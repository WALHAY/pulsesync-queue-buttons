import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { unzipSync, zipSync } from 'fflate';

const root = new URL('../', import.meta.url);
const metadata = JSON.parse(await readFile(new URL('addon/metadata.json', root), 'utf8'));
const addonFiles = ['metadata.json', metadata.script, metadata.css, metadata.image, 'README.md'];
const files = [
  ...addonFiles.map(name => [name, `addon/${name}`]),
  ['LICENSE', 'LICENSE'],
  ['CHANGELOG.md', 'CHANGELOG.md'],
];
const entries = {};
for (const [name, source] of files) {
  entries[name] = [
    new Uint8Array(await readFile(new URL(source, root))),
    {
      mtime: new Date('2026-01-01T00:00:00Z'),
    },
  ];
}
const archive = zipSync(entries, { level: 9 });
const unpacked = unzipSync(archive);
for (const name of Object.keys(entries)) {
  if (!Buffer.from(unpacked[name]).equals(Buffer.from(entries[name][0]))) {
    throw new Error(`Archive verification failed: ${name}`);
  }
}
await mkdir(new URL('dist/', root), { recursive: true });
const filename = `${metadata.name}-${metadata.version}.pext`;
await writeFile(new URL(`dist/${filename}`, root), archive);
console.log(`Built and verified dist/${filename} (${archive.length} bytes)`);
