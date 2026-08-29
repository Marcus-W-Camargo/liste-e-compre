import type { ItemCompra, SessaoCompra } from '../types';

const PREFIXO = 'liste-e-compre:compra-em-andamento:';

function chave(owner: string) {
  return `${PREFIXO}${owner}`;
}

function itemValido(item: unknown): item is ItemCompra {
  if (!item || typeof item !== 'object') return false;
  const valor = item as Record<string, unknown>;
  return (
    typeof valor.id === 'string' &&
    typeof valor.nome === 'string' &&
    typeof valor.categoria === 'string' &&
    typeof valor.quantidade === 'number' &&
    Number.isFinite(valor.quantidade) &&
    (valor.tipo === 'un' || valor.tipo === 'Kg') &&
    typeof valor.precoUnitario === 'number' &&
    Number.isFinite(valor.precoUnitario) &&
    typeof valor.pego === 'boolean' &&
    (valor.origem === 'planejado' || valor.origem === 'extra')
  );
}

function sessaoValida(valor: unknown): valor is SessaoCompra {
  if (!valor || typeof valor !== 'object') return false;
  const sessao = valor as Record<string, unknown>;
  return (
    typeof sessao.id === 'string' &&
    typeof sessao.listaId === 'string' &&
    typeof sessao.nomeLista === 'string' &&
    typeof sessao.dataInicio === 'string' &&
    Array.isArray(sessao.itens) &&
    sessao.itens.every(itemValido)
  );
}

export function carregarSessaoCompraLocal(owner: string) {
  try {
    const armazenada = localStorage.getItem(chave(owner));
    if (!armazenada) return null;
    const sessao: unknown = JSON.parse(armazenada);
    if (sessaoValida(sessao)) return structuredClone(sessao);
    localStorage.removeItem(chave(owner));
  } catch {
    localStorage.removeItem(chave(owner));
  }
  return null;
}

export function salvarSessaoCompraLocal(
  owner: string,
  sessao: SessaoCompra,
) {
  if (!sessaoValida(sessao))
    throw new Error('A compra em andamento possui dados inválidos.');
  localStorage.setItem(chave(owner), JSON.stringify(sessao));
}

export function limparSessaoCompraLocal(owner: string) {
  localStorage.removeItem(chave(owner));
}
