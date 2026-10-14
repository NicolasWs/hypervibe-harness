#!/usr/bin/env node
// test-email-sender.mjs - /add-email keeps the sender a project already has (3.4.11): the plan of
// scripts/email-sender.mjs, and setup-email.mjs reading the project's own .env for it before it
// pushes anything. Reads and computes only: nothing is installed, nothing sent.
//
//   node scripts/tests/test-email-sender.mjs

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { senderPlan } = await import(pathToFileURL(join(ROOT, "scripts", "email-sender.mjs")).href);
const { envValue } = await import(pathToFileURL(join(ROOT, "scripts", "env-value.mjs")).href);

let checks = 0;
let failures = 0;
function check(label, ok, detail = "") {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}${ok || !detail ? "" : `   (${detail})`}`);
}

console.log("── Ce que /add-email pousse comme expéditeur ──");
let p = senderPlan({ provider: "resend", inPlace: {} });
check("Resend, aucun expéditeur : l'adresse de test de Resend est posée", JSON.stringify(p.pushed) === '["RESEND_FROM_EMAIL=onboarding@resend.dev"]' && p.kept.length === 0);
p = senderPlan({ provider: "resend", inPlace: { RESEND_FROM_EMAIL: "bonjour@atelier.fr" } });
check("Resend, un expéditeur vérifié en place : il est gardé, rien n'est poussé", p.pushed.length === 0 && JSON.stringify(p.kept) === '["RESEND_FROM_EMAIL"]', JSON.stringify(p));
p = senderPlan({ provider: "brevo", inPlace: {}, brevoSender: "contact@atelier.fr", brevoSenderName: "Atelier" });
check("Brevo, rien en place : l'expéditeur saisi et son nom sont posés", JSON.stringify(p.pushed) === '["BREVO_SENDER_EMAIL=contact@atelier.fr","BREVO_SENDER_NAME=Atelier"]');
p = senderPlan({ provider: "brevo", inPlace: { BREVO_SENDER_EMAIL: "equipe@cabinet.fr", BREVO_SENDER_NAME: "Cabinet" }, brevoSender: "autre@atelier.fr", brevoSenderName: "Autre" });
check("Brevo, l'expéditeur de l'administrateur en place : gardé, l'adresse saisie n'écrase rien", p.pushed.length === 0 && p.kept.length === 2, JSON.stringify(p));
p = senderPlan({ provider: "brevo", inPlace: { BREVO_SENDER_EMAIL: "equipe@cabinet.fr" }, brevoSender: "x@y.fr", brevoSenderName: "Atelier" });
check("Brevo, l'adresse en place sans nom : l'adresse gardée, seul le nom manquant est posé", JSON.stringify(p.pushed) === '["BREVO_SENDER_NAME=Atelier"]' && JSON.stringify(p.kept) === '["BREVO_SENDER_EMAIL"]', JSON.stringify(p));

console.log("\n── Le script lit l'expéditeur du projet avant de pousser ──");
{
  const dir = mkdtempSync(join(tmpdir(), "hv-sender-"));
  try {
    writeFileSync(join(dir, ".env"), "AUTRE=1\n");
    writeFileSync(join(dir, ".env.local"), 'RESEND_FROM_EMAIL="bonjour@atelier.fr"\n');
    check("l'expéditeur rangé dans .env.local (là où l'équipe le dépose) est lu", envValue(dir, "RESEND_FROM_EMAIL") === "bonjour@atelier.fr");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const setup = readFileSync(join(ROOT, "scripts", "setup-email.mjs"), "utf8");
check("setup-email.mjs lit les trois expéditeurs du projet par envValue", ["RESEND_FROM_EMAIL", "BREVO_SENDER_EMAIL", "BREVO_SENDER_NAME"].every((k) => setup.includes(`${k}: envValue(WEB_DIR, "${k}")`)));
check("... et ne pousse que ce que le plan dit manquer", /senderPlan\(\{ provider, inPlace: senderInPlace/.test(setup) && /\.\.\.pushed\]|const kvs = pushed;/.test(setup) && !/kvs\.push\(`RESEND_FROM_EMAIL=onboarding@resend\.dev`\)/.test(setup));
check("... et ne réclame l'adresse Brevo que si le projet n'en a pas", /if \(provider === "brevo" && !senderInPlace\.BREVO_SENDER_EMAIL\)/.test(setup));

console.log(`\n${checks - failures}/${checks} checks`);
process.exitCode = failures ? 1 : 0;
