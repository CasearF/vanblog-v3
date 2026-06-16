# all-in-one 多阶段构建：admin / server / website 各为一个 BUILDER 阶段，最终汇入 RUNNER。
# （历史上 packages/* 下有独立单包 Dockerfile，均为上游遗留死代码，已删除——统一走本文件。）
FROM  node:22-alpine as ADMIN_BUILDER
ENV NODE_OPTIONS='--max_old_space_size=4096 --openssl-legacy-provider'
ENV EEE=production
WORKDIR /app
USER root
RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*
COPY ./packages/admin/ ./
RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@9.15.9 --activate
RUN pnpm config set network-timeout 600000 -g
RUN pnpm config set registry https://registry.npmjs.org -g
RUN pnpm config set fetch-retries 20 -g
RUN pnpm config set fetch-timeout 600000 -g
RUN pnpm i
# 修复 esbuild 安装问题
RUN cd node_modules/.pnpm/esbuild*/node_modules/esbuild && node install.js 2>/dev/null || true
# RUN sed -i 's/\/assets/\/admin\/assets/g' dist/admin/index.html
RUN pnpm build

FROM node:22 as SERVER_BUILDER
ENV NODE_OPTIONS=--max_old_space_size=4096
WORKDIR /app
COPY ./packages/server/ .
# 共享类型包（declaration-only .d.ts）：server 的 tsconfig paths 用 ../shared/src/index.d.ts 解析。
# server 内容被铺平到 /app，故 ../shared = /shared，与本地 packages/shared 同构。
# 仅供 nest build(tsc) 类型解析，emit 时被擦除，不进运行时/dist。
COPY ./packages/shared /shared
RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@9.15.9 --activate
RUN pnpm config set network-timeout 600000 -g
RUN pnpm config set registry https://registry.npmmirror.com -g
RUN pnpm config set fetch-retries 20 -g
RUN pnpm config set fetch-timeout 600000 -g
RUN pnpm i
RUN pnpm build

FROM node:22-alpine AS WEBSITE_BUILDER
WORKDIR /app
RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*
COPY ./package.json ./
COPY ./pnpm-lock.yaml ./
COPY ./pnpm-workspace.yaml ./
COPY ./tsconfig.base.json ./
COPY ./packages/website ./packages/website
# 共享类型包（declaration-only .d.ts）：website 的 tsconfig paths 用 ../shared/src/index.d.ts 解析。
# website 保持 packages/ 布局，故落到 /app/packages/shared，与本地同构。
COPY ./packages/shared ./packages/shared
ENV isBuild t
ENV VAN_BLOG_ALLOW_DOMAINS "pic.mereith.com"
ARG VAN_BLOG_BUILD_SERVER=http://localhost:3000
ENV VAN_BLOG_SERVER_URL ${VAN_BLOG_BUILD_SERVER}
ARG VAN_BLOG_VERSIONS
ENV VAN_BLOG_VERSION ${VAN_BLOG_VERSIONS}
RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@9.15.9 --activate
RUN pnpm config set network-timeout 600000 -g
RUN pnpm config set registry https://registry.npmmirror.com -g
RUN pnpm config set fetch-retries 20 -g
RUN pnpm config set fetch-timeout 600000 -g
RUN pnpm install --frozen-lockfile
RUN pnpm build:website


#运行容器
FROM node:22-alpine AS RUNNER
WORKDIR /app
# Caddy 钉定 2.8.4 静态二进制(不走 apk,与 Alpine 漂移解耦、镜像可复现——Tier 1 的教训)。
# 从 2.6.4 升来:仅 caddyTemplate.json 的 on_demand.ask → on_demand.permission(http 模块)一处改动。
# trusted_proxies 数组在 2.8 仍是合法格式(源码核实 reverse_proxy.TrustedProxies []string,无需改);
# server CaddyProvider 不碰 on_demand/trusted_proxies、其 admin API 路径 2.6→2.8 未变,故均不用改。
# (旧 2.6.4 钉版注释曾把历史 000 归因于 trusted_proxies/ask 拒载——经 2.8.4 源码核实有误,详见 deployment-and-ci-notes.md §11。)
RUN  apk add --no-cache --update tzdata nss-tools libwebp-tools ca-certificates curl \
  && curl -fsSL https://github.com/caddyserver/caddy/releases/download/v2.8.4/caddy_2.8.4_linux_amd64.tar.gz -o /tmp/caddy.tar.gz \
  && tar -xzf /tmp/caddy.tar.gz -C /usr/bin caddy \
  && chmod +x /usr/bin/caddy \
  && rm /tmp/caddy.tar.gz \
  && apk del curl \
  && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
  && echo "Asia/Shanghai" > /etc/timezone \
  && apk del tzdata
RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@9.15.9 --activate
RUN pnpm config set network-timeout 600000 -g
RUN pnpm config set registry https://registry.npmmirror.com -g
RUN pnpm config set fetch-retries 20 -g
RUN pnpm config set fetch-timeout 600000 -g
# 复制 cli 工具
WORKDIR /app/cli
COPY ./packages/cli/ ./
RUN pnpm i
# 安装 waline
WORKDIR /app/waline
COPY ./packages/waline/ ./
RUN pnpm i
# 复制 server
WORKDIR /app/server
COPY --from=SERVER_BUILDER /app/node_modules ./node_modules
COPY --from=SERVER_BUILDER /app/dist/src/ ./
# 复制 website
WORKDIR /app/website
COPY --from=WEBSITE_BUILDER  /app/packages/website/.next/standalone/ ./
COPY --from=WEBSITE_BUILDER /app/packages/website/next.config.js ./packages/website/next.config.js
COPY --from=WEBSITE_BUILDER /app/packages/website/public ./packages/website/public
COPY --from=WEBSITE_BUILDER /app/packages/website/package.json ./packages/website/package.json
COPY --from=WEBSITE_BUILDER  /app/packages/website/.next/static ./packages/website/.next/static
RUN  cd  /app/website  && cd ..
ENV NODE_ENV production
ENV VAN_BLOG_SERVER_URL "http://127.0.0.1:3000"
ENV VAN_BLOG_ALLOW_DOMAINS "pic.mereith.com"
ENV VAN_BLOG_DATABASE_URL "mongodb://mongo:27017/vanBlog?authSource=admin"
ENV EMAIL "vanblog@mereith.com"
ENV VAN_BLOG_WALINE_DB "waline"
# 复制静态文件
WORKDIR /app/admin
COPY --from=ADMIN_BUILDER /app/dist/ ./
COPY caddyTemplate.json /app/caddyTemplate.json
# 复制入口文件
WORKDIR /app
COPY ./scripts/start.js ./
COPY ./entrypoint.sh ./
ENV PORT 3001
# 增加版本
ARG VAN_BLOG_VERSIONS
ENV VAN_BLOG_VERSION ${VAN_BLOG_VERSIONS}
VOLUME /app/static
VOLUME /var/log
VOLUME /root/.config/caddy
VOLUME /root/.local/share/caddy

EXPOSE 80
ENTRYPOINT [ "sh","entrypoint.sh" ]
# CMD [ "entrypoint.sh" ]
