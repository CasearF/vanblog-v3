import { MenuItem } from './menu.dto';

export const defaultStaticSetting: StaticSetting = {
  storageType: 'local',
  picgoConfig: null,
  enableWaterMark: false,
  enableWebp: true,
  waterMarkText: null,
  picgoPlugins: null,
};

export type SettingType =
  | 'static'
  | 'https'
  | 'waline'
  | 'layout'
  | 'login'
  | 'menu'
  | 'version'
  | 'isr'
  | 'theme';

export type SettingValue =
  | StaticSetting
  | HttpsSetting
  | WalineSetting
  | LayoutSetting
  | VersionSetting
  | ISRSetting
  | ThemeSetting;

export interface ISRSetting {
  mode: 'delay' | 'onDemand';
  delay: number;
}

export interface MenuSetting {
  data: MenuItem[];
}

export type StorageType = 'picgo' | 'local';
export type StaticType = 'img' | 'customPage';
export interface LoginSetting {
  enableMaxLoginRetry: boolean;
  maxRetryTimes: number;
  durationSeconds: number;
  expiresIn: number;
}
export interface VersionSetting {
  version: string;
}

// export interface ScriptItem {
//   type: 'code' | 'link';
//   value: string;
// }

export interface LayoutSetting {
  script: string;
  html: string;
  css: string;
  head: string;
}

export interface HeadTag {
  name: string;
  props: Record<string, string>;
  conent: string;
}

export interface WalineSetting {
  'smtp.enabled': boolean;
  'smtp.port': number;
  'smtp.host': string;
  'smtp.user': string;
  'smtp.password': string;
  'sender.name': string;
  'sender.email': string;
  authorEmail: string;
  webhook?: string;
  forceLoginComment: boolean;
  otherConfig?: string;
}

export interface ManualCertRecord {
  id: string;
  domains: string[];
  subject: string;
  issuer: string;
  notBefore: string; // ISO
  notAfter: string; // ISO
  fingerprint256: string;
  isSelfSigned: boolean;
  remark: string;
  certPath: string; // 容器内绝对路径，落在 Caddy 数据卷，不对外返回
  keyPath: string; // 同上；私钥文件 0600
  createdAt: string; // ISO
}

// 返回给前端 / API 的脱敏视图：不含磁盘路径（也从不含私钥本身）
export type ManualCertPublic = Omit<ManualCertRecord, 'certPath' | 'keyPath'>;

export interface HttpsSetting {
  redirect: boolean;
  manualCerts?: ManualCertRecord[];
}

export interface ThemeSetting {
  theme: string;
}

export interface SearchStaticOption {
  staticType: StaticType;
  page: number;
  pageSize: number;
  view: 'admin' | 'public';
}
export const StoragePath: Record<StaticType, string> = {
  img: `img`,
  customPage: `customPage`,
};
export class StaticSetting {
  storageType: StorageType;
  picgoConfig: any;
  picgoPlugins: string;
  enableWaterMark: boolean;
  waterMarkText: string;
  enableWebp: boolean;
}
