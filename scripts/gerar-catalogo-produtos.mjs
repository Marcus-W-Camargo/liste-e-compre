import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const caminhoTxt = resolve(raiz, 'data/tipos_produtos_mercado.txt');
const caminhoCsv = resolve(raiz, 'data/tipos_produtos_mercado.csv');
const caminhoJson = resolve(raiz, 'src/data/produtosMercado.json');

function normalizar(valor) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim();
}

function ehTitulo(linha) {
  if (!linha || /^[-=]+$/.test(linha)) return false;
  if (/^(LISTA DE|Foco:|Fontes:|FIM DA|Total aproximado:|Pode ser)/i.test(linha)) {
    return false;
  }
  return linha === linha.toLocaleUpperCase('pt-BR');
}

function escaparCsv(valor) {
  return `"${valor.replaceAll('"', '""')}"`;
}

const texto = await readFile(caminhoTxt, 'utf8');
const produtos = [];
const chaves = new Set();
let secao = 'OUTROS';

for (const linhaOriginal of texto.split(/\r?\n/)) {
  const linha = linhaOriginal.trim();

  if (ehTitulo(linha)) {
    secao = linha;
    continue;
  }

  if (!linha.startsWith('- ')) continue;

  const produto = linha.slice(2).replace(/\s+/g, ' ').trim();
  const chave = normalizar(produto);
  if (!produto || chaves.has(chave)) continue;

  chaves.add(chave);
  produtos.push({ secao, produto });
}

if (produtos.length < 800) {
  throw new Error(`Catálogo incompleto: apenas ${produtos.length} produtos únicos.`);
}

const csv = [
  'secao,produto',
  ...produtos.map(({ secao: grupo, produto }) =>
    `${escaparCsv(grupo)},${escaparCsv(produto)}`,
  ),
].join('\n');

await mkdir(dirname(caminhoJson), { recursive: true });
await writeFile(caminhoCsv, `${csv}\n`, 'utf8');
await writeFile(
  caminhoJson,
  `${JSON.stringify(produtos.map(({ produto }) => produto), null, 2)}\n`,
  'utf8',
);

console.log(`${produtos.length} produtos únicos gerados.`);
