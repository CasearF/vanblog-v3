import { Injectable, Logger } from '@nestjs/common';
import { ChildProcess, spawn } from 'node:child_process';
import { config } from 'src/config';
import { WalineSetting } from 'src/types/setting.dto';
import { makeSalt } from 'src/utils/crypto';
import { MetaProvider } from '../meta/meta.provider';
import { SettingProvider } from '../setting/setting.provider';
@Injectable()
export class WalineProvider {
  // constructor() {}
  ctx: ChildProcess = null;
  logger = new Logger(WalineProvider.name);
  env = {};
  constructor(
    private metaProvider: MetaProvider,
    private readonly settingProvider: SettingProvider,
  ) {}

  mapConfig2Env(walineSetting: WalineSetting) {
    const walineEnvMapping = {
      'smtp.port': 'SMTP_PORT',
      'smtp.host': 'SMTP_HOST',
      'smtp.user': 'SMTP_USER',
      'sender.name': 'SENDER_NAME',
      'sender.email': 'SENDER_EMAIL',
      'smtp.password': 'SMTP_PASS',
      authorEmail: 'AUTHOR_EMAIL',
      webhook: 'WEBHOOK',
      forceLoginComment: 'LOGIN',
    };
    const result = {};
    if (!walineSetting) {
      return result;
    }
    for (const key of Object.keys(walineSetting)) {
      if (key == 'forceLoginComment') {
        if (walineSetting.forceLoginComment) {
          result['LOGIN'] = 'force';
        }
      } else if (key == 'otherConfig') {
        if (walineSetting.otherConfig) {
          try {
            const data = JSON.parse(walineSetting.otherConfig);
            for (const [k, v] of Object.entries(data)) {
              result[k] = v;
            }
          } catch (err) {
            this.logger.warn(
              `waline otherConfig JSON 解析失败，已忽略：${err?.message || err}`,
            );
          }
        }
      } else {
        const rKey = walineEnvMapping[key];
        if (rKey) {
          result[rKey] = walineSetting[key];
        }
      }
    }
    if (!walineSetting['smtp.enabled']) {
      const r2 = {};
      for (const [k, v] of Object.entries(result)) {
        if (
          ![
            'SMTP_PASS',
            'SMTP_USER',
            'SMTP_HOST',
            'SMTP_PORT',
            'SENDER_NAME',
            'SENDER_EMAIL',
          ].includes(k)
        ) {
          r2[k] = v;
        }
      }
      return r2;
    }
    // console.log(result);
    return result;
  }
  async loadEnv() {
    const url = new URL(config.mongoUrl);
    const mongoEnv = {
      MONGO_HOST: url.hostname,
      MONGO_PORT: url.port,
      MONGO_USER: url.username,
      MONGO_PASSWORD: url.password,
      MONGO_DB: config.walineDB,
      MONGO_AUTHSOURCE: 'admin',
    };
    const siteInfo = await this.metaProvider.getSiteInfo();
    const otherEnv = {
      SITE_NAME: siteInfo?.siteName || undefined,
      SITE_URL: siteInfo?.baseUrl || undefined,
      JWT_TOKEN: global.jwtSecret || makeSalt(),
    };
    const walineConfig = await this.settingProvider.getWalineSetting();
    const walineConfigEnv = this.mapConfig2Env(walineConfig);
    this.env = {
      ...mongoEnv,
      ...otherEnv,
      ...walineConfigEnv,
      PORT: '8360',
    };
    this.logger.log(`waline 配置： ${JSON.stringify(this.env, null, 2)}`);
  }
  async init() {
    this.run();
  }
  async restart(reason: string) {
    this.logger.log(`${reason}重启 waline`);
    if (this.ctx) {
      await this.stop();
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.run();
  }
  async stop() {
    if (this.ctx) {
      try {
        this.ctx.unref();
        // detached:true 时子进程自成进程组，用负 PID 杀掉整个进程组，
        // 避免子孙进程残留占用 8360 端口导致下次重启 EADDRINUSE
        process.kill(-this.ctx.pid, 'SIGTERM');
      } catch (e) {
        try {
          process.kill(this.ctx.pid, 'SIGTERM');
        } catch (e2) {
          // Process may have already exited
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.ctx = null;
      this.logger.log('waline 停止成功！');
    }
  }
  async run(): Promise<any> {
    // 已有进程在跑时先停掉，避免重复 spawn 与端口冲突
    if (this.ctx != null) {
      await this.stop();
    }
    await this.loadEnv();
    const base = '../waline/node_modules/@waline/vercel/vanilla.js';
    const child = spawn('node', [base], {
      env: {
        ...process.env,
        ...this.env,
      },
      cwd: process.cwd(),
      detached: true,
    });
    this.ctx = child;
    child.on('message', (message) => {
      this.logger.log(message);
    });
    child.on('exit', () => {
      // 仅当退出的是当前管理的进程时才清空引用，
      // 避免旧进程延迟触发的 exit 清掉新进程的引用
      if (this.ctx === child) {
        this.ctx = null;
        this.logger.warn('Waline 进程退出');
      }
    });
    child.stdout.on('data', (data) => {
      const t = data.toString();
      if (!t.includes('Cannot find module')) {
        this.logger.log(t.substring(0, t.length - 1));
      }
    });
    child.stderr.on('data', (data) => {
      const t = data.toString();
      this.logger.error(t.substring(0, t.length - 1));
    });
    this.logger.log('Waline 启动成功！');
  }
}
