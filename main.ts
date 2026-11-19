// Leonida Trophy Guide — the entrypoint for make.fun competition gta6-trophy-guide-01.
// Node 22, standard library only. The guide itself is the static files in app/ (index.html,
// style.css, app.js and the data files), plus the screenshots in screenshots/. This program hands
// the entry in: it copies app/ and screenshots/ beside this file into the output directory and
// writes dossier.json there, the summary the judge reads, built with the vendored make.fun
// library. vendor/makefun-frontend.ts is the kit's copy and stays untouched: the scorer rebuilds
// the dossier with its own copy and the two must match byte for byte.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and
// directories in app/ or 48 MiB of app files — app/ counts beside /output's own 1000-entry cap
// with its screenshots/ and dossier.json).
const dossier = buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 });
writeFileSync(join(out, 'dossier.json'), dossier);

// One line on stdout so a local run shows the handoff landed: where it went and how big the
// dossier is. The grader ignores stdout; it only reads the files in the output directory.
console.log(`handed in ${out}: dossier.json is ${Buffer.byteLength(dossier)} bytes`);
