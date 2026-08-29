import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const [txt, csv, json] = await Promise.all([
  readFile(new URL('../data/tipos_produtos_mercado.txt', import.meta.url), 'utf8'),
  readFile(new URL('../data/tipos_produtos_mercado.csv', import.meta.url), 'utf8'),
  readFile(new URL('../src/data/produtosMercado.json', import.meta.url), 'utf8'),
]);

const produtos = JSON.parse(json);

function produtoDaLinhaCsv(linha) {
  const correspondencia = linha.match(/^"((?:[^"]|"")*)","((?:[^"]|"")*)"$/);
  assert.ok(correspondencia, `Linha CSV inválida: ${linha}`);
  return correspondencia[2].replaceAll('""', '"');
}

test('catálogo atualizado inclui os grupos aprovados de limpeza e higiene', () => {
  assert.match(txt, /LIMPEZA\n-------/);
  assert.match(txt, /HIGIENE\n-------/);
  assert.ok(produtos.includes('Sabão Líquido para Roupas'));
  assert.ok(produtos.includes('Limpador de Vaso Sanitário'));
  assert.ok(produtos.includes('Creme Dental para Dentes Sensíveis'));
  assert.ok(produtos.includes('Protetor Solar Facial'));
});

test('biblioteca interna contém apenas nomes únicos', () => {
  assert.equal(produtos.length, 906);
  assert.equal(new Set(produtos).size, produtos.length);
});

test('CSV e biblioteca interna são gerados na mesma ordem', () => {
  const linhas = csv.trimEnd().split('\n');
  assert.equal(linhas[0], 'secao,produto');
  assert.deepEqual(linhas.slice(1).map(produtoDaLinhaCsv), produtos);
});
