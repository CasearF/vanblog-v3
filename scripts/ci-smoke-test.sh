#!/usr/bin/env bash
# CI 冒烟测试：镜像启动后打关键端点，断言状态码与响应格式。
# 覆盖 2026-06 实际踩过的回归：Caddy /api/* 路由缺失(404)、
# strip_path_prefix 导致 WaLine 返回旧格式(v3 客户端解析崩溃)。
# 用法: ci-smoke-test.sh <base_url>   例: ci-smoke-test.sh http://127.0.0.1:8080
set -u
BASE="${1:-http://127.0.0.1:8080}"
PASS=0
FAIL=0

wait_for() { # wait_for <名称> <url> <最大秒数>
  local name="$1" url="$2" max="$3" code=000 i=0
  echo "==> 等待 ${name} (${BASE}${url}) ..."
  while [ "$i" -lt "$max" ]; do
    # curl 失败时 %{http_code} 自身就输出 000，勿再追加回退值（否则拼成 000000）
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$BASE$url" || true)
    [ -n "$code" ] || code=000
    case "$code" in
      000|502|503) i=$((i+3)); sleep 3 ;;
      *) echo "    ${name} 就绪 (HTTP $code, ${i}s)"; return 0 ;;
    esac
  done
  echo "    ⚠ ${name} 在 ${max}s 内未就绪 (最后状态 $code)，继续断言（让失败暴露细节）"
  return 1
}

check() { # check <名称> <期望状态码(逗号分隔)> <url> [响应体必含的正则]
  local name="$1" expect="$2" url="$3" body_re="${4:-}"
  local tmp code ok=1
  tmp=$(mktemp)
  code=$(curl -s -o "$tmp" -w '%{http_code}' --max-time 15 "$BASE$url" || true)
  [ -n "$code" ] || code=000
  echo "$expect" | tr ',' '\n' | grep -qx "$code" || ok=0
  if [ -n "$body_re" ] && ! grep -q "$body_re" "$tmp"; then ok=0; fi
  if [ "$ok" -eq 1 ]; then
    echo "  ✅ ${name} (HTTP $code) $url"
    PASS=$((PASS+1))
  else
    echo "  ❌ ${name} 期望[HTTP $expect${body_re:+ 且响应含 $body_re}] 实际[HTTP $code] $url"
    echo "     响应前 300 字节: $(head -c 300 "$tmp")"
    FAIL=$((FAIL+1))
  fi
  rm -f "$tmp"
}

# ---- 等待启动：Next.js 首页(主链路) ----
wait_for "网站首页(caddy→next)" "/" 180 || true

# ---- 初始化实例（关键前置：waline 仅在已初始化实例上启动，main.ts 有 checkHasInited 守卫；
#      init 成功后服务端会拉起 waline 并重启前台，故 init 后需重新等待） ----
echo "==> 初始化实例 (POST /api/admin/init)"
init_out=$(mktemp)
init_code=$(curl -s -o "$init_out" -w '%{http_code}' --max-time 30 -X POST \
  -H 'Content-Type: application/json' \
  -d '{"user":{"username":"smoke","password":"smoke-ci-pass","nickname":"smoke"},"siteInfo":{"author":"smoke","authorDesc":"ci","authorLogo":"","siteLogo":"","favicon":"","siteName":"smoke-test","siteDesc":"ci smoke test","baseUrl":"http://127.0.0.1:8080"}}' \
  "$BASE/api/admin/init" || true)
[ -n "$init_code" ] || init_code=000
# NestJS @Post 默认返回 201 Created；以响应体 statusCode:200 为成功凭据，HTTP 接受 200/201
if { [ "$init_code" = "201" ] || [ "$init_code" = "200" ]; } && grep -q '"statusCode":200' "$init_out"; then
  echo "  ✅ 初始化成功 (HTTP $init_code)"
  PASS=$((PASS+1))
else
  echo "  ❌ 初始化失败 (HTTP $init_code): $(head -c 200 "$init_out")"
  FAIL=$((FAIL+1))
fi
rm -f "$init_out"

# init 触发前台重启 + waline 启动，重新等待两条链路
wait_for "前台(初始化后重启)" "/" 90 || true
wait_for "WaLine(/ui)" "/ui" 120 || true

echo "==> 开始断言"
# 1. 主站链路: caddy → website(3001)
check "首页" "200" "/"
# 2. NestJS 服务端: caddy /api/* → server(3000)
check "公共 meta API" "200" "/api/public/meta" '"statusCode":200'
# 3. 后台 SPA: caddy handle_path /admin* → admin(3002)
check "后台 /admin" "200" "/admin/"
# 4. WaLine 仪表盘: caddy /ui* → waline(8360)
check "WaLine /ui" "200" "/ui"
# 5. 【回归核心】/api/comment 必须到 8360 且返回 v3 新格式(errno 包裹)。
#    若 Caddy 误加 strip_path_prefix /api，WaLine 会按旧客户端返回裸格式 → 此断言失败。
check "WaLine /api/comment 新格式" "200" "/api/comment?path=%2F&pageSize=10&page=1&lang=zh-CN&sortBy=insertedAt_desc" '"errno":0'
# 6. 【回归核心】/api/oauth 必须路由到 WaLine(302 跳转)，而不是落入 NestJS 404。
check "WaLine /api/oauth 路由" "302" "/api/oauth?type=github&redirect=%2Fui"
# 7. 旧根路径兼容(老客户端/第三方仍可能用)
check "WaLine 旧路径 /comment" "200" "/comment?path=%2F&lang=zh-CN"

echo "=============================="
echo "冒烟结果: ${PASS} 通过, ${FAIL} 失败"
[ "$FAIL" -eq 0 ] || exit 1
