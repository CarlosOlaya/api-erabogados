const { mkdir, writeFile } = require('node:fs/promises');
const { dirname, resolve } = require('node:path');

const outputFlag = process.argv.indexOf('--output');
const output = outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined;

if (!output) {
  console.error('Uso: node scripts/export-firma-seed.cjs --output <archivo.json>');
  process.exit(1);
}

const { INITIAL_FIRM_PROFILE } = require('../dist/firma/firma.seed.js');
const profile = {
  ...INITIAL_FIRM_PROFILE,
  version: 1,
  updatedAt: new Date().toISOString(),
};
const destination = resolve(output);

mkdir(dirname(destination), { recursive: true })
  .then(() => writeFile(destination, `${JSON.stringify(profile, null, 2)}\n`, 'utf8'))
  .then(() => console.log(`Snapshot inicial escrito en ${destination}`));
