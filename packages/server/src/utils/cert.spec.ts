import {
  parseSubjectAltName,
  parseCommonName,
  daysUntil,
  isExpired,
  isNotYetValid,
  validateCertAndKey,
} from './cert';

// 一次性、可丢弃的自签测试证书（openssl 生成，100 年有效期，
// SAN = DNS:example.com,DNS:*.example.com,IP:10.0.0.1）。非任何真实站点密钥。
const CERT1 = `-----BEGIN CERTIFICATE-----
MIIDPTCCAiWgAwIBAgIUU7H+tZ4xDnrz55W9+h7PGR9B9YAwDQYJKoZIhvcNAQEL
BQAwFjEUMBIGA1UEAwwLZXhhbXBsZS5jb20wIBcNMjYwNjEzMDg0MDI0WhgPMjEy
NjA1MjAwODQwMjRaMBYxFDASBgNVBAMMC2V4YW1wbGUuY29tMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1KCWO8pNQRyKffcC4NjWBF7jJ6Tlrw2whxvw
uh42Wt52XD18RDrVVkM34sU+skNrnVpHx2sLnb18pLSrqGEPU9Iz1YqTpmbdxBZU
IPWBFdNyWh69tMwsXkzIClCAnaG0LBb0ys2BBjWrF2JWL3XdvqLUHAedVxullRFC
/a23An0uLHok1WHI0uSZgU1g+O3bHeQjNtX0PH8DiLFeZIPIWTr0dIvIWvq4Dkkx
0yWHiqt2SA6CcB4alQdJlTxjs0mnkmCRDqdp16i9Cn/uB7hn0be97b09YPqWb3WY
Ghy0UC3FBwVRUn1D2Oc99IzFE/kCvrdNGdmVu+prYpOYf7Xm4QIDAQABo4GAMH4w
HQYDVR0OBBYEFBldfh1YO3Wg5vLRJE044b+lfZEXMB8GA1UdIwQYMBaAFBldfh1Y
O3Wg5vLRJE044b+lfZEXMA8GA1UdEwEB/wQFMAMBAf8wKwYDVR0RBCQwIoILZXhh
bXBsZS5jb22CDSouZXhhbXBsZS5jb22HBAoAAAEwDQYJKoZIhvcNAQELBQADggEB
ABxYzunnaFRYqHN2WDXO9IhzRhapIx9d+DWHbpK4Zddlwx3ERgz7/P1bXhtq53El
M1VACsP/0STA8+xjhvGWvpLaJmvEHQlQxw059g6SbB2XK5jgFHTsDkQfgri8S0HT
hLq0/xjAvbEif7vInHo9JGOuMl2r5+nIXNvgQef3f/hdxebnsga3f1uzeqpqr7d0
7pipNmkJe1vCV+5mviELziLfilQTgUXihDwKlpwpi9UjKKE4c0nzqrWUI3YG2X+q
KjFGj3HyImHs6X3RWQ1p2DVsrfCzIsof294x1dj9rZbyhr6gSGdqjE5b9UjHjZ0P
TiYNQxmVnV9LJ5YNP5ivlWk=
-----END CERTIFICATE-----`;

const KEY1 = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDUoJY7yk1BHIp9
9wLg2NYEXuMnpOWvDbCHG/C6HjZa3nZcPXxEOtVWQzfixT6yQ2udWkfHawudvXyk
tKuoYQ9T0jPVipOmZt3EFlQg9YEV03JaHr20zCxeTMgKUICdobQsFvTKzYEGNasX
YlYvdd2+otQcB51XG6WVEUL9rbcCfS4seiTVYcjS5JmBTWD47dsd5CM21fQ8fwOI
sV5kg8hZOvR0i8ha+rgOSTHTJYeKq3ZIDoJwHhqVB0mVPGOzSaeSYJEOp2nXqL0K
f+4HuGfRt73tvT1g+pZvdZgaHLRQLcUHBVFSfUPY5z30jMUT+QK+t00Z2ZW76mti
k5h/tebhAgMBAAECggEACM2uELNMYexyB7t+HhP+PvO0ix34wEfkYeCwVa1l7drZ
etHVIwBOWE4ryn7lDNWNp2f/MjCSfF1Fw45DL/NWUo+ww5fza2ulhY6Q3MU7ay1c
NgLhMwLT2LLsQqCRBa3F92AbMikibSDUWNFSjRAfzmqAlplCXIKdl0Od4uHSEqdL
srKN1g07rU5h9WUxRtWnzfKPO8CgBZWj6mDq8f7EEnZZOB75ZLzec3oGwO90jDsP
uEPIuv2H8EOywdW48eDi6SZF1zNjd8rXmsFqYLIZDw7KZUel1fYHmFmS3KeHcVLO
lanMSH/QT4IHLn2B+3xJEFdM48By6dFjXDXOFt3NsQKBgQD4Cla2quy3053BGXhu
wFFlm7vv+QT8S1TX3R/J/G1yvrk2xUrEwPlz5tT3z2LXheFabBwV9MDPf64wSRgz
B25YDVSl4dPIzfnDc+SoL4Lae7+2Pc9F1clGbfDzK+w/Eq2G1rG+mULxAyy4UVyj
AXJ8Q3ONYrYbw9sYxe3OOYhpEQKBgQDbc1QFWBukEOJavCyNmW76NQZgxN4A6iBp
Z9UrzzpcrnZg+b0u0LfXhjJMf4iYl3xwFyv+FXVqwWo+eOR2hkOkGMwqb6SNczP4
YdAEVzxQpraQkFNgkbiWKDgat3evdZPUB5GOoHoEx+8dCUsDJTvRIEyT8K5Lu3k5
5V3IRtYg0QKBgQCOgboiRv+r+ev35n9X+iyJ2TjX/dVMcqdzQjsiXGIxe7yD6EQ1
2L05RtTy73bVZrj7r4NPZghk7vGQEl7R6qIN+tK4X4/DHfwyvGIR8wIWLuUNemOc
tuBmE4JM495euodyIeWLIRjhybYmy7ASgyFYnZRFFgKU3ykBCa7APjPOUQKBgHi3
eUmzTQk0bH/DMbL26zBiCM8knIbeQ9QX1RDTXuRq6B2yY5okIG1Dmdmw8iAWfNJg
PMf5X+zI1rvk3rBAbWcQaQcTAO76p2UD0V0B6+DlxFnDusnNfz/CghJYSFNRl280
dqKBrn2Ayg0r9oKVcdE5NkbPR+HLEAWEIdGw/ctxAoGAUHP2vOW2tdEDwpYoSHHA
swG164SeGz4eVPOy6Z+fp8v/WDXdkNpxEo03oDBRLaAzosrOfE4VS//ExT3jXDKP
4UJqg+TEZ9ELN2n1sZVaJL20vICLZ4gikJsvgm/fgK58Vbui8dUsqcEGiM/eB/0W
2Z9kOrDPCL7cNm0CoUNBICU=
-----END PRIVATE KEY-----`;

// 一把与 CERT1 无关的私钥，用于“证书与私钥不匹配”的反例。
const KEY2 = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC+O8QpD25r7zRL
ugpeKXbkJwCZ85KD0rFFtr1sYDFEIKu+SnT+k3UDpp36WZwgJSQPUMGyzMHZsT72
xOgnciOIl7NnLXbtRPkJpMRiPLSUEBF2/p7VpOpN7CKdbqbWjAF+Q/PGLLK9snTk
iYKaqLT+jH4HqncepyDEQTZrrLRysI6OSIkzawIRCgHBaT2a/8lPFAbZFkk6xx+v
Zvmfr9/XvPH1aIaxiYSw2VdvVhvht1/PSe+fHzDQkzWifb+GsMNMCWw3I9tWhFLP
RnO9VmsjJxz+JGg9xcVPVxIsrhbMrXrUmxbu/eU8Igut6gH9jodJ1uFqXWhTBSnD
ejpNR0HVAgMBAAECggEAWsjS+HVw0Pm7D1idkgpfvsoOM2pWRarLBuYKyCmv2T9u
NsX5x3Q/p5pgUhVpuL2A0/5KMjYdXPKFhea6k/iYlJsw9tBvrRP5dWy4e9lUpER2
0T76NiMZ3k4OxusDm+f83nE3aR/zvSvpNReayIwytDf//VCQwIQp0v78Ja6p/wEI
mJvnv3jt68V7LSJq+LMsblz9kL37Qf5BaS4KoxtpHyzv2UOYbTyIJdCg8/ztcH7f
CXhQRzPiyMZn6rrlIMeLI1JRUiNmJU0SJXxzhUjOWoMc2Jx2GEVckt40v+3SbtOU
HeNOiXz/n4DOm4kdFPjtlfW6cCpTAifSOIOd/YpxEQKBgQDhjAq/uXUGxaMQy6HY
HZC7q/AuPcZjadYlSxmNLR9EcEuDQDC/ZsK/Bbx2iggVBvV/fXkxds4uOWWuOtqu
cPFRqm5yMlMJlX7get8wGBtJV1H/8+2GFVUNar15KGzyXqoWM9bBHPpXps8nuXlr
vMD8URVMBlUHOJY0QdXIbNcMUwKBgQDX6x9NbUB8+ZZ9TF16rjMxo7e8mWJUrTVx
o2X7Do7N70SFJmhA8y/kMkKjgHKm6ZYbDcCvfluaE52gq+Dh6H6eKwGlenrnwANB
6v1W8sIoalnqS0JzliBVNd9fFKtVgLl5HJjigDs0CICUSzSAqO9PdUZgd1fyNNUC
Rcb3QMp0NwKBgD4EJ6B3+fmWtjOUCjhGSNmReUT9r2L+Yud2Mtxin8pNpjW8nKrE
MqAbj6p4YaiGdVJMydoT9LU5CwBRJnf4jiIKXrv/ol1sQaqvnla3CimsXNun0pOf
ofdCdj6uIuaxqMraDh6jPSKEt0kQ8pXxHI9ELDrvMsn9gS91OrcVVjwJAoGAFmB/
tf6EmG8lcYbgiT5Uf+h/ukQLNMteppBQmVxA4IbTixkX5ONPK08qKNe/Ch1bOSKL
vaRSyf0OcQBfJgp6VNoQKZ4v7qSvsb0w1DoEdTvQZb+2+1OrtikHJUt3Fj1o+2xD
S/YOLK5U5QmGP29CnfGBga3cp3ViPgINRMKqOLECgYEArc9DNk3rW2y2oaMYKEgm
QCjDEGT4oNchO9EKGOTnXqCYAP07IIGnt495aidGoqhZyCXRsedTgNS3XyE0sTOr
DToz5BpVaDhVzuHEqC8IGSM7Y5pj+zMig7rskrW/WQsrCostlBYdffIBF/XhXT0W
Qdl7LGk3d9IUepFuhuF4U/E=
-----END PRIVATE KEY-----`;

describe('parseSubjectAltName', () => {
  it('strips DNS:/IP Address: prefixes and trims', () => {
    expect(parseSubjectAltName('DNS:example.com, DNS:*.example.com, IP Address:10.0.0.1')).toEqual([
      'example.com',
      '*.example.com',
      '10.0.0.1',
    ]);
  });
  it('returns [] for undefined/empty', () => {
    expect(parseSubjectAltName(undefined)).toEqual([]);
    expect(parseSubjectAltName('')).toEqual([]);
  });
});

describe('parseCommonName', () => {
  it('extracts CN from a subject DN', () => {
    expect(parseCommonName('CN=example.com')).toBe('example.com');
    expect(parseCommonName('C=US, O=Acme, CN=foo.bar')).toBe('foo.bar');
  });
  it('returns null when no CN', () => {
    expect(parseCommonName('O=Acme')).toBeNull();
    expect(parseCommonName(undefined)).toBeNull();
  });
});

describe('expiry helpers', () => {
  const now = new Date('2026-06-13T00:00:00Z');
  it('daysUntil computes floored day difference', () => {
    expect(daysUntil(new Date('2026-06-23T00:00:00Z'), now)).toBe(10);
    expect(daysUntil(new Date('2026-06-03T00:00:00Z'), now)).toBe(-10);
  });
  it('isExpired is true at or after notAfter', () => {
    expect(isExpired(new Date('2026-06-12T23:59:59Z'), now)).toBe(true);
    expect(isExpired(new Date('2026-06-14T00:00:00Z'), now)).toBe(false);
  });
  it('isNotYetValid is true before notBefore', () => {
    expect(isNotYetValid(new Date('2026-06-14T00:00:00Z'), now)).toBe(true);
    expect(isNotYetValid(new Date('2026-06-12T00:00:00Z'), now)).toBe(false);
  });
});

describe('validateCertAndKey', () => {
  it('accepts a matching cert/key pair and extracts domains', () => {
    const res = validateCertAndKey(CERT1, KEY1);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.info.domains).toEqual(
        expect.arrayContaining(['example.com', '*.example.com', '10.0.0.1']),
      );
      expect(res.info.isSelfSigned).toBe(true);
      expect(new Date(res.info.notAfter).getTime()).toBeGreaterThan(Date.now());
      expect(res.info.fingerprint256).toMatch(/^[0-9A-F:]+$/);
    }
  });

  it('rejects a cert/key mismatch', () => {
    const res = validateCertAndKey(CERT1, KEY2);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain('不匹配');
    }
  });

  it('rejects an unparseable certificate', () => {
    const res = validateCertAndKey('not a pem', KEY1);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain('证书解析失败');
    }
  });

  it('rejects an unparseable private key', () => {
    const res = validateCertAndKey(CERT1, 'not a key');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain('私钥解析失败');
    }
  });
});
