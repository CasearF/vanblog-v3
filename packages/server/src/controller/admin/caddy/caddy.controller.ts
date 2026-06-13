import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  Logger,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/provider/auth/auth.guard';
import { config } from 'src/config';
import { SettingProvider } from 'src/provider/setting/setting.provider';
import { HttpsSetting, ManualCertPublic, ManualCertRecord } from 'src/types/setting.dto';
import { CaddyProvider } from 'src/provider/caddy/caddy.provider';
import { isIpv4 } from 'src/utils/ip';
import { validateCertAndKey } from 'src/utils/cert';
import { ApiToken } from 'src/provider/swagger/token';

// 脱敏：返回给前端时去掉磁盘路径（私钥本来就不入库）。
function toPublicCert(record: ManualCertRecord): ManualCertPublic {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { certPath, keyPath, ...rest } = record;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  return rest;
}

@ApiTags('caddy')
@ApiToken
@Controller('/api/admin/caddy')
export class CaddyController {
  private readonly logger = new Logger(CaddyController.name);
  constructor(
    private readonly settingProvider: SettingProvider,
    private readonly caddyProvider: CaddyProvider,
  ) {}
  @UseGuards(...AdminGuard)
  @Get('https')
  async getHttpsConfig() {
    const config = await this.settingProvider.getHttpsSetting();
    return {
      statusCode: 200,
      data: config,
    };
  }

  @Get('ask')
  async askOnDemand(@Query('domain') domain: string) {
    // console.log(is);
    const is = isIpv4(domain);
    // console.log(domain, is);
    if (!is) {
      return 'is Domain, on damand https';
    } else {
      // 增加到 subjects 中
      this.logger.log('试图通过 ip + https 访问，已驳回');
      // this.caddyProvider.addSubject(domain);
      throw new BadRequestException();
    }
  }
  @UseGuards(...AdminGuard)
  @Delete('log')
  async clearLog() {
    if (config.demo && config.demo == 'true') {
      return {
        statusCode: 401,
        message: '演示站禁止修改此项！',
      };
    }
    await this.caddyProvider.clearLog();
    return {
      statusCode: 200,
      data: '清除 Caddy 运行日志成功！',
    };
  }
  @UseGuards(...AdminGuard)
  @Get('log')
  async getCaddyLog() {
    const log = await this.caddyProvider.getLog();
    return {
      statusCode: 200,
      data: log,
    };
  }
  @UseGuards(...AdminGuard)
  @Get('config')
  async getCaddyConfig() {
    const caddyConfig = await this.caddyProvider.getConfig();
    return {
      statusCode: 200,
      data: JSON.stringify(caddyConfig, null, 2),
    };
  }
  @UseGuards(...AdminGuard)
  @Put('https')
  async updateHttpsConfig(@Body() dto: HttpsSetting) {
    if (config.demo && config.demo == 'true') {
      return {
        statusCode: 401,
        message: '演示站禁止修改此项！',
      };
    }
    const result = await this.caddyProvider.setRedirect(dto.redirect || false);
    if (!result) {
      return {
        statusCode: 500,
        message: '更新失败！请查看 Caddy 日志获取详细信息！',
      };
    }
    await this.settingProvider.updateHttpsSetting(dto);
    return {
      statusCode: 200,
      data: '更新成功！',
    };
  }

  // 列出已上传的手动证书（脱敏，无路径、无私钥）。
  @UseGuards(...AdminGuard)
  @Get('cert')
  async getManualCerts() {
    const httpsConfig = await this.settingProvider.getHttpsSetting();
    const certs = (httpsConfig?.manualCerts || []).map(toPublicCert);
    return {
      statusCode: 200,
      data: certs,
    };
  }

  // 上传 PEM 证书 + 私钥：校验（成对 + 未过期 + 含域名）→ 落盘 → 热加载进 Caddy → 入库。
  @UseGuards(...AdminGuard)
  @Post('cert')
  async uploadManualCert(@Body() dto: { cert?: string; key?: string; remark?: string }) {
    if (config.demo && config.demo == 'true') {
      return {
        statusCode: 401,
        message: '演示站禁止修改此项！',
      };
    }
    if (!dto?.cert || !dto?.key) {
      return {
        statusCode: 400,
        message: '证书和私钥均不能为空！',
      };
    }
    const result = validateCertAndKey(dto.cert, dto.key);
    if (!result.ok) {
      // 注意：只回显校验错误信息，绝不回显上传内容（私钥敏感）。
      return {
        statusCode: 400,
        message: result.error,
      };
    }

    const id = randomUUID();
    const { certPath, keyPath } = this.caddyProvider.saveManualCertFiles(id, dto.cert, dto.key);
    const record: ManualCertRecord = {
      id,
      ...result.info,
      remark: dto.remark || '',
      certPath,
      keyPath,
      createdAt: new Date().toISOString(),
    };

    const httpsConfig = await this.settingProvider.getHttpsSetting();
    const manualCerts = [...(httpsConfig?.manualCerts || []), record];
    const applied = await this.caddyProvider.applyManualCerts(manualCerts);
    if (!applied) {
      // 应用失败则回滚刚落盘的文件，避免留下孤儿证书。
      this.caddyProvider.deleteManualCertFiles(record);
      return {
        statusCode: 500,
        message: '证书已校验通过，但应用到 Caddy 失败，请查看 Caddy 日志排查！',
      };
    }
    await this.settingProvider.updateHttpsSetting({ manualCerts });
    this.logger.log(`已上传并应用手动 HTTPS 证书：${record.domains.join(', ')}`);
    return {
      statusCode: 200,
      data: toPublicCert(record),
    };
  }

  // 删除某条手动证书：撤出 Caddy（该域名回退到自动 HTTPS）→ 出库 → 删盘。
  @UseGuards(...AdminGuard)
  @Delete('cert')
  async deleteManualCert(@Query('id') id: string) {
    if (config.demo && config.demo == 'true') {
      return {
        statusCode: 401,
        message: '演示站禁止修改此项！',
      };
    }
    if (!id) {
      return {
        statusCode: 400,
        message: '缺少证书 id！',
      };
    }
    const httpsConfig = await this.settingProvider.getHttpsSetting();
    const all = httpsConfig?.manualCerts || [];
    const target = all.find((c) => c.id === id);
    if (!target) {
      return {
        statusCode: 404,
        message: '未找到对应证书！',
      };
    }
    const remaining = all.filter((c) => c.id !== id);
    const applied = await this.caddyProvider.applyManualCerts(remaining);
    if (!applied) {
      return {
        statusCode: 500,
        message: '更新 Caddy 配置失败，请查看 Caddy 日志排查！',
      };
    }
    await this.settingProvider.updateHttpsSetting({ manualCerts: remaining });
    this.caddyProvider.deleteManualCertFiles(target);
    this.logger.log(`已删除手动 HTTPS 证书：${target.domains.join(', ')}`);
    return {
      statusCode: 200,
      data: '删除成功！',
    };
  }
}
