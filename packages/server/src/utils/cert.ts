import { X509Certificate, createPrivateKey } from 'crypto';

export interface CertInfo {
  domains: string[];
  subject: string;
  issuer: string;
  notBefore: string; // ISO
  notAfter: string; // ISO
  fingerprint256: string;
  isSelfSigned: boolean;
}

// 扁平结构而非可辨识联合：server tsconfig 关闭了 strictNullChecks，
// 联合在 `!res.ok` 分支无法正确收窄，故用可选字段，任何严格度下都安全。
export interface CertValidationResult {
  ok: boolean;
  error?: string;
  info?: CertInfo;
}

/**
 * 解析 X509 subjectAltName 字符串，形如：
 *   "DNS:example.com, DNS:*.example.com, IP Address:10.0.0.1"
 * → ['example.com', '*.example.com', '10.0.0.1']
 * 纯函数，便于单测。
 */
export function parseSubjectAltName(san?: string): string[] {
  if (!san) return [];
  return san
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      // 去掉 "DNS:" / "IP Address:" 等前缀，只保留值
      const idx = entry.indexOf(':');
      return idx >= 0 ? entry.slice(idx + 1).trim() : entry;
    })
    .filter(Boolean);
}

/** 从 subject DN（如 "CN=example.com" 或 "CN=a\nO=b"）中取 CN。纯函数。 */
export function parseCommonName(subject?: string): string | null {
  if (!subject) return null;
  const m = subject.match(/CN\s*=\s*([^,\n/]+)/);
  return m ? m[1].trim() : null;
}

/** notAfter 距 now 还有多少天（向下取整）；负数表示已过期。纯函数。 */
export function daysUntil(notAfter: Date, now: Date = new Date()): number {
  return Math.floor((notAfter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isExpired(notAfter: Date, now: Date = new Date()): boolean {
  return notAfter.getTime() <= now.getTime();
}

export function isNotYetValid(notBefore: Date, now: Date = new Date()): boolean {
  return notBefore.getTime() > now.getTime();
}

/**
 * 校验上传的 PEM 证书 + 私钥：
 * 1) 两者都能解析；2) 私钥与证书匹配；3) 证书在有效期内；4) 至少含一个域名。
 * 通过后返回脱敏的证书元信息（绝不包含私钥）。
 */
export function validateCertAndKey(certPem: string, keyPem: string): CertValidationResult {
  let x509: X509Certificate;
  try {
    x509 = new X509Certificate(certPem);
  } catch (e) {
    return { ok: false, error: '证书解析失败，请确认上传的是合法的 PEM 格式证书' };
  }

  let keyObject;
  try {
    keyObject = createPrivateKey(keyPem);
  } catch (e) {
    return { ok: false, error: '私钥解析失败，请确认上传的是合法的 PEM 格式私钥' };
  }

  let matched = false;
  try {
    matched = x509.checkPrivateKey(keyObject);
  } catch (e) {
    matched = false;
  }
  if (!matched) {
    return { ok: false, error: '证书与私钥不匹配，请检查上传内容是否成对' };
  }

  const notBefore = new Date(x509.validFrom);
  const notAfter = new Date(x509.validTo);
  if (isExpired(notAfter)) {
    return { ok: false, error: `证书已于 ${notAfter.toISOString()} 过期，无法使用` };
  }
  if (isNotYetValid(notBefore)) {
    return { ok: false, error: `证书尚未生效（生效时间 ${notBefore.toISOString()}）` };
  }

  const sans = parseSubjectAltName(x509.subjectAltName);
  const cn = parseCommonName(x509.subject);
  const domains = Array.from(new Set([...sans, ...(cn ? [cn] : [])]));
  if (domains.length === 0) {
    return { ok: false, error: '证书中未找到任何域名（SAN 与 CN 均为空）' };
  }

  return {
    ok: true,
    info: {
      domains,
      subject: x509.subject,
      issuer: x509.issuer,
      notBefore: notBefore.toISOString(),
      notAfter: notAfter.toISOString(),
      fingerprint256: x509.fingerprint256,
      isSelfSigned: x509.subject === x509.issuer,
    },
  };
}
