// Packs the extension into dist/roboost-crm-gmail-extension.zip with no dependencies: node scripts/build.mjs
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const included = ['manifest.json', 'src', 'icons'];

const listFiles = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path).flatMap((name) => listFiles(join(path, name)))
    : [path];

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
};

const localParts = [];
const centralParts = [];
let offset = 0;

for (const file of included.flatMap((entry) => listFiles(join(root, entry))).sort()) {
  const name = Buffer.from(relative(root, file).split(sep).join('/'));
  const data = readFileSync(file);
  const compressed = deflateRawSync(data);
  const crc = crc32(data);

  const local = Buffer.alloc(30);

  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(0, 10);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);

  const central = Buffer.alloc(46);

  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(0, 12);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);

  localParts.push(local, name, compressed);
  centralParts.push(central, name);
  offset += local.length + name.length + compressed.length;
}

const centralDirectory = Buffer.concat(centralParts);
const end = Buffer.alloc(22);
const entryCount = centralParts.length / 2;

end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(entryCount, 8);
end.writeUInt16LE(entryCount, 10);
end.writeUInt32LE(centralDirectory.length, 12);
end.writeUInt32LE(offset, 16);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(
  join(root, 'dist', 'roboost-crm-gmail-extension.zip'),
  Buffer.concat([...localParts, centralDirectory, end]),
);
console.log(`dist/roboost-crm-gmail-extension.zip: ${entryCount} files`);
