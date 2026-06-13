import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { SettingProvider } from '../setting/setting.provider';
import { ManualCertRecord } from 'src/types/setting.dto';

// Caddy admin API（与 caddy start 同容器，仅本机可达）
const CADDY_ADMIN = 'http://127.0.0.1:2019';
// 手动上传证书的落盘目录：Caddy 数据卷内（容器 /root/.local/share/caddy → 宿主 /var/vanblog/caddy/data）。
// 选此处的原因：① 持久卷，重启/升级不丢；② 不被任何 HTTP 路由 serve（/app/static 才是公开的，私钥绝不能放那）；
// ③ 与 Caddy 自动申请的证书同处一卷，语义自洽；④ 零 compose 改动，存量部署直接生效。
const MANUAL_CERT_DIR = '/root/.local/share/caddy/vanblog-manual';
const MANUAL_CERT_TAG = 'vanblog-manual';

@Injectable()
export class CaddyProvider {
  subjects: string[] = [];
  logger = new Logger(CaddyProvider.name);
  constructor(private readonly settingProvider: SettingProvider) {
    this.init();
  }
  async init() {
    // this.subjects = await getDefaultSubjects();
    // this.logger.log(`默认 subjects:`, this.subjects);
    // await this.updateSubjects(this.subjects);
    const configInDB = await this.settingProvider.getHttpsSetting();
    let txt = '初始化 caddy 配置完成！';
    if (configInDB?.redirect) {
      await this.setRedirect(true);
      txt = txt + 'https 自动重定向已开启';
    } else {
      await this.setRedirect(false);
      txt = 'https 自动重定向已关闭';
    }

    this.logger.log(txt);

    // entrypoint.sh 每次启动都 `caddy start --config /app/caddy.json`，会抹掉运行时通过 admin API
    // 注入的证书。故与 redirect 一样，需在启动时把 DB 里记录的手动证书重新加载回 Caddy。
    const manualCerts = configInDB?.manualCerts || [];
    if (manualCerts.length > 0) {
      await this.applyManualCerts(manualCerts);
    }
  }

  private ensureManualCertDir() {
    if (!fs.existsSync(MANUAL_CERT_DIR)) {
      fs.mkdirSync(MANUAL_CERT_DIR, { recursive: true, mode: 0o700 });
    }
  }

  // 把上传的 PEM 证书 / 私钥落盘到 Caddy 数据卷；私钥严格 0600。返回容器内绝对路径。
  saveManualCertFiles(id: string, certPem: string, keyPem: string) {
    this.ensureManualCertDir();
    const certPath = path.join(MANUAL_CERT_DIR, `${id}.crt`);
    const keyPath = path.join(MANUAL_CERT_DIR, `${id}.key`);
    fs.writeFileSync(certPath, certPem, { mode: 0o644 });
    fs.writeFileSync(keyPath, keyPem, { mode: 0o600 });
    // writeFile 的 mode 受 umask 影响，显式 chmod 兜底，确保私钥不被同组/其它用户读取。
    try {
      fs.chmodSync(keyPath, 0o600);
    } catch (err) {
      this.logger.warn(`收紧私钥权限失败：${keyPath}`);
    }
    return { certPath, keyPath };
  }

  deleteManualCertFiles(record: Pick<ManualCertRecord, 'certPath' | 'keyPath'>) {
    for (const p of [record?.certPath, record?.keyPath]) {
      try {
        if (p && fs.existsSync(p)) {
          fs.unlinkSync(p);
        }
      } catch (err) {
        this.logger.warn(`删除证书文件失败：${p}`);
      }
    }
  }

  // 通过 admin API 把手动证书热加载进 Caddy 的 apps/tls/certificates/load_files。
  // 与 on-demand 自动 HTTPS 共存：同 SNI 命中手动证书时 Caddy 直接用它（不再走 ACME），
  // 其它域名仍按需自动申请。空数组 = 撤销全部手动证书，回退到纯自动。
  async applyManualCerts(records: ManualCertRecord[]) {
    const loadFiles = (records || [])
      .filter((r) => r && fs.existsSync(r.certPath) && fs.existsSync(r.keyPath))
      .map((r) => ({ certificate: r.certPath, key: r.keyPath, tags: [MANUAL_CERT_TAG] }));
    try {
      // 运行时配置里 apps/tls 默认只有 automation、没有 certificates。Caddy admin API 语义：
      // PATCH 要求路径已存在、PUT 要求路径不存在。优先 PATCH 整个 load_files 数组——这是一次
      // 原子的“就地替换”，不会出现“先清空再写入”的中间空窗（避免误删其它域名正在用的证书）；
      // 仅当 certificates 尚不存在（首次）时 PATCH 报错，再回退用 PUT 创建。全程无需 caddy stop，零中断。
      try {
        await axios.patch(`${CADDY_ADMIN}/config/apps/tls/certificates/load_files`, loadFiles);
      } catch (patchErr) {
        await axios.put(`${CADDY_ADMIN}/config/apps/tls/certificates`, { load_files: loadFiles });
      }
      this.logger.log(`已应用 ${loadFiles.length} 个手动 HTTPS 证书到 Caddy`);
      return true;
    } catch (err) {
      this.logger.error('应用手动 HTTPS 证书失败', err?.response?.data || err?.message);
      return false;
    }
  }
  clearLog() {
    try {
      fs.writeFileSync('/var/log/caddy.log', '');
    } catch (err) {}
  }
  async addSubject(domain: string) {
    if (!this.subjects.includes(domain)) {
      this.subjects.push(domain);
      await this.updateSubjects(this.subjects);
    }
  }

  async setRedirect(redirect: boolean) {
    if (!redirect) {
      try {
        await axios.delete('http://127.0.0.1:2019/config/apps/http/servers/srv1/listener_wrappers');
        this.logger.log('https 自动重定向已关闭');
        return '关闭成功！';
      } catch (err) {
        // console.log(err);
        this.logger.error('关闭 https 自动重定向失败');
        return false;
      }
    } else {
      try {
        await axios.post('http://127.0.0.1:2019/config/apps/http/servers/srv1/listener_wrappers', [
          {
            wrapper: 'http_redirect',
          },
        ]);
        this.logger.log('https 自动重定向已关闭');
        return '开启成功！';
      } catch (err) {
        // console.log(err);
        this.logger.error('开启 https 自动重定向失败');
        return false;
      }
    }
  }

  async getSubjects() {
    try {
      const res = await axios.get(
        'http://127.0.0.1:2019/config/apps/tls/automation/policies/subjects',
      );
      return res?.data;
    } catch (err) {
      // console.log(err);
      this.logger.error('更新 subjects 失败，通过 IP 进行 https 访问可能受限');
    }
  }
  async getAutomaticDomains() {
    try {
      const res = await axios.get('http://127.0.0.1:2019/config/apps/tls/certificates/automate');
      return res?.data;
    } catch (err) {
      console.log(err);
    }
  }

  async updateSubjects(domains: string[]) {
    try {
      const res = await axios.patch(
        'http://127.0.0.1:2019/config/apps/tls/automation/policies/0/subjects',
        domains,
      );
      if (res.status == 200) {
        return true;
      }
    } catch (err) {
      console.log(err?.data?.error || err);
    }
    return false;
  }
  async applyHttpsChange(domains: string[]) {
    return await this.updateHttpsDomains([...domains, ...this.subjects]);
  }

  async updateHttpsDomains(domains: string[]) {
    try {
      const res = await axios.patch(
        'http://127.0.0.1:2019/config/apps/tls/certificates/automate',
        domains,
      );
      if (res.status == 200) {
        return true;
      }
    } catch (err) {
      console.log(err);
    }
    return false;
  }
  async getConfig() {
    try {
      const res = await axios.get('http://127.0.0.1:2019/config');
      return res?.data;
    } catch (err) {
      console.log(err);
    }
  }
  async getLog() {
    try {
      const data = fs.readFileSync('/var/log/caddy.log', { encoding: 'utf-8' });
      return data.toString();
    } catch (err) {
      return '';
    }
  }
}
