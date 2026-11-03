// Starts the Projektraum and prepares everything that is missing on the way:
// .env, dependencies (npm ci), database (prisma migrate deploy) and the production build.
// Only needs Node.js – runs before node_modules exist, so it uses built-in modules only.

import { spawnSync, spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.PORT || "3000";
const DEPS_STEMPEL = path.join(ROOT, "node_modules", ".projektraum-deps");
const BUILD_STEMPEL = path.join(ROOT, ".next", ".projektraum-build");

// Files that change the production build (config/checkliste.json is read at runtime and is not part of it).
const BUILD_EINGABEN = ["src", "public", "prisma/schema.prisma", "package-lock.json", "next.config.ts", "tsconfig.json"];

function schritt(text) {
  console.log(`\n▸ ${text}`);
}

function abbruch(text) {
  console.error(`\n✖ ${text}`);
  process.exit(1);
}

function ausfuehren(befehl) {
  const r = spawnSync(befehl, { cwd: ROOT, stdio: "inherit", shell: true });
  if (r.status !== 0) abbruch(`Befehl fehlgeschlagen: ${befehl}`);
}

function lies(datei) {
  try {
    return fs.readFileSync(datei, "utf8");
  } catch {
    return null;
  }
}

function hashVon(eintraege) {
  const hash = crypto.createHash("sha1");
  const besuche = (rel) => {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return;
    if (fs.statSync(abs).isDirectory()) {
      for (const name of fs.readdirSync(abs).sort()) besuche(path.join(rel, name));
    } else {
      hash.update(rel.replaceAll("\\", "/"));
      hash.update(fs.readFileSync(abs));
    }
  };
  eintraege.forEach(besuche);
  return hash.digest("hex");
}

// 1. Node version (Next.js 15 needs 18.18 or newer)
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 18 || (major === 18 && minor < 18)) {
  abbruch(`Node.js ${process.versions.node} ist zu alt. Bitte Node.js 20 oder neuer installieren (https://nodejs.org).`);
}

// 2. Configuration
if (!fs.existsSync(path.join(ROOT, ".env"))) {
  schritt("Erster Start: .env wird aus .env.example angelegt");
  fs.copyFileSync(path.join(ROOT, ".env.example"), path.join(ROOT, ".env"));
}

// 3. Dependencies – installed when missing or when package-lock.json changed
const depsHash = hashVon(["package-lock.json"]);
if (lies(DEPS_STEMPEL) !== depsHash) {
  schritt("Abhängigkeiten werden installiert (npm ci) – beim ersten Start dauert das einige Minuten");
  ausfuehren("npm ci");
  fs.writeFileSync(DEPS_STEMPEL, depsHash);
}

// 4. Database – creates it on first start, applies new migrations after updates
schritt("Datenbank wird geprüft");
ausfuehren("npx prisma migrate deploy");

// 5. Production build – rebuilt when the code changed since the last build
const buildHash = hashVon(BUILD_EINGABEN);
if (!fs.existsSync(path.join(ROOT, ".next", "BUILD_ID")) || lies(BUILD_STEMPEL) !== buildHash) {
  schritt("App wird erstellt (next build)");
  ausfuehren("npx next build");
  fs.writeFileSync(BUILD_STEMPEL, buildHash);
}

// 6. Start
schritt(`Projektraum läuft auf http://localhost:${PORT} (im Büronetz: http://<Name-des-Servers>:${PORT}). Beenden mit Ctrl+C.`);
// Run Next.js directly with node (no shell in between) so Ctrl+C / systemd stop signals reach the server.
const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const server = spawn(process.execPath, [nextBin, "start", "-H", "0.0.0.0", "-p", PORT], { cwd: ROOT, stdio: "inherit" });
server.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
