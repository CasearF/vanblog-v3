import { Injectable, Logger } from '@nestjs/common';
import { ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';
import { MetaProvider } from '../meta/meta.provider';
import { SettingProvider } from '../setting/setting.provider';

const ignoreWebsiteWarnings = [
  'Experimental features are not covered by semver',
  'You have enabled experimental feature',
  'Invalid next.config.js options',
  'The value at .experimental has an',
  '(node:62) ExperimentalWarning',
  'null',
];

@Injectable()
export class WebsiteProvider {
  // constructor() {}
  ctx: ChildProcess = null;
  logger = new Logger(WebsiteProvider.name);
  // 崩溃自动重启的退避控制
  private crashCount = 0;
  private lastSpawnAt = 0;
  constructor(
    private metaProvider: MetaProvider,
    private settingProvider: SettingProvider,
  ) {}
  async init() {
    this.run();
  }
  async loadEnv() {
    const meta = await this.metaProvider.getAll();
    const isrConfig = await this.settingProvider.getISRSetting();
    const isrEnv =
      isrConfig.mode == 'delay'
        ? {
            VAN_BLOG_REVALIDATE: 'true',
            VAN_BLOG_REVALIDATE_TIME: isrConfig.delay,
          }
        : {
            VAN_BLOG_REVALIDATE: 'false',
          };
    if (!meta?.siteInfo) return { ...isrEnv };
    const siteinfo = meta.siteInfo;
    const socials = meta.socials;
    const urls = [];
    const addEach = (u: string) => {
      if (!u) return null;
      try {
        const url = new URL(u);
        if (url?.host) {
          if (!urls.includes(url?.host)) {
            urls.push(url?.host);
          }
        }
      } catch (err) {
        return null;
      }
    };
    addEach(siteinfo?.baseUrl);
    addEach(siteinfo?.siteLogo);
    addEach(siteinfo?.authorLogo);
    addEach(siteinfo?.authorLogoDark);
    addEach(siteinfo?.payAliPay);
    addEach(siteinfo?.payAliPayDark);
    addEach(siteinfo?.payWechat);
    addEach(siteinfo?.payWechatDark);
    const wechatItem = socials.find((s) => s.type == 'wechat');
    if (wechatItem) {
      addEach(wechatItem?.value);
    }
    const wechatDarkItem = socials.find((s) => s.type == 'wechat-dark');
    if (wechatDarkItem) {
      addEach(wechatDarkItem?.value);
    }
    return { VAN_BLOG_ALLOW_DOMAINS: urls.join(','), ...isrEnv };
  }
  async restart(reason: string) {
    this.logger.log(`${reason}重启 website`);
    if (this.ctx) {
      await this.stop();
    }
    // 主动重启：停掉旧进程后立即拉起新进程
    //（旧进程的 exit 因 this.ctx 已被替换不会再触发自动重启）
    this.crashCount = 0;
    await this.run();
  }
  async restore(reason: string) {
    this.logger.log(`${reason}`);
    this.ctx = null;
    // 进程意外退出后的自动重启加入退避，避免启动即崩时的紧密循环
    const now = Date.now();
    if (now - this.lastSpawnAt < 5000) {
      this.crashCount++;
    } else {
      this.crashCount = 0;
    }
    if (this.crashCount > 5) {
      this.logger.error('website 连续崩溃超过 5 次，停止自动重启');
      return;
    }
    const delay = Math.min(500 * 2 ** this.crashCount, 30000);
    this.logger.warn(
      `website 将在 ${delay}ms 后自动重启（第 ${this.crashCount} 次）`,
    );
    await new Promise((r) => setTimeout(r, delay));
    await this.run();
  }
  async stop(noMessage?: boolean) {
    if (this.ctx) {
      try {
        this.ctx.unref();
        process.kill(-this.ctx.pid, 'SIGTERM');
      } catch (e) {
        // Process may have already exited
      }
      this.ctx = null;
      if (noMessage) return;
      this.logger.log('website 停止成功！');
    }
  }
  async run(): Promise<any> {
    if (process.env['VANBLOG_DISABLE_WEBSITE'] === 'true') {
      this.logger.log('无 website 模式');
      return;
    }
    let cmd = 'pnpm';
    let args = ['dev'];
    if (process.env.NODE_ENV == 'production') {
      cmd = 'node';
      args = ['./packages/website/server.js'];
    }
    if (this.ctx != null) {
      this.logger.log('Website 已在运行');
      return;
    }
    const loadEnvs = await this.loadEnv();
    this.logger.log(JSON.stringify(loadEnvs, null, 2));
    this.lastSpawnAt = Date.now();
    const child = spawn(cmd, args, {
      env: {
        ...process.env,
        ...loadEnvs,
      },
      cwd: path.join(path.resolve(process.cwd(), '..'), 'website'),
      detached: true,
      shell: process.platform === 'win32',
    });
    this.ctx = child;
    child.on('message', (message) => {
      this.logger.log(message);
    });
    child.on('exit', async () => {
      // 仅当退出的是当前管理的进程时才自动重启，
      // 避免旧进程延迟触发的 exit 误触发或重复拉起
      if (this.ctx === child) {
        await this.restore('website 进程退出，自动重启');
      }
    });
    child.stdout.on('data', (data) => {
      const t: string = data.toString();
      this.logger.log(t.substring(0, t.length - 1));
    });
    child.stderr.on('data', (data) => {
      const t: string = data.toString();

      let showLog = true;
      for (const each of ignoreWebsiteWarnings) {
        if (t.includes(each)) showLog = false;
      }
      if (showLog) {
        this.logger.error(t.substring(0, t.length - 1));
      }
    });
    this.logger.log('Website 启动成功！');
  }
}
