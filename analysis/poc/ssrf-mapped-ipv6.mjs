// ssrf-mapped-ipv6.mjs - Verbatim port of isBlockedIp() from templates/agent/tools/http-fetch.ts:60-75,
// fed the hostname exactly as guardUrl() derives it (new URL(url).hostname, brackets stripped).
// WHATWG URL rewrites an IPv4-mapped IPv6 literal to hex (::ffff:7f00:1), which the dotted-quad
// regex does not recognise, so loopback and the cloud-metadata address are classified as public.
// Usage: node analysis/poc/ssrf-mapped-ipv6.mjs
import { isIP } from "node:net";
function isBlockedIp(ip) {
  if (ip === "::1" || ip === "::") return true;
  if (/^fe80:/i.test(ip) || /^f[cd][0-9a-f]{2}:/i.test(ip)) return true;
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  const m = v4.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const a = Number(m[1]), b = Number(m[2]);
  if (a === 0 || a === 127 || a === 10) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}
for (const u of ["http://127.0.0.1/", "http://[::ffff:127.0.0.1]/", "http://[::ffff:169.254.169.254]/latest/meta-data/"]) {
  const host = new URL(u).hostname.replace(/^\[|\]$/g, "");
  console.log(u.padEnd(50), "host =", host.padEnd(18), "isIP =", isIP(host), " blocked =", isBlockedIp(host));
}
