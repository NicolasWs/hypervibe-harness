// db-query-readonly.mjs - Verbatim port of isReadOnly() from templates/agent/tools/db-query.ts:51-79.
// Shows statements with side effects that the keyword denylist accepts as "read-only".
// Usage: node analysis/poc/db-query-readonly.mjs
const FORBIDDEN_KEYWORDS = ["insert","update","delete","drop","alter","truncate","grant","revoke","create","comment","vacuum","lock","copy","do","call","merge"];
function isReadOnly(query) {
  const stripped = query.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ").trim().toLowerCase();
  if (!stripped.startsWith("select") && !stripped.startsWith("with")) return { ok: false, reason: "query must start with SELECT" };
  for (const kw of FORBIDDEN_KEYWORDS) if (new RegExp(`\\b${kw}\\b`, "i").test(stripped)) return { ok: false, reason: kw };
  if (stripped.replace(/;\s*$/, "").includes(";")) return { ok: false, reason: "multiple statements" };
  return { ok: true };
}
for (const q of [
  "SELECT setval('users_id_seq', 1)",
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity",
  "SELECT pg_advisory_lock(1)",
  "SELECT pg_sleep(600)   -- the 10 s AbortController at db-query.ts:88-89 is never passed to db.execute",
  "DELETE FROM users",
]) console.log(JSON.stringify(isReadOnly(q)).padEnd(40), q);
