const obj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const str = (x) => typeof x === 'string' && x.length > 0;
const num = (x) => typeof x === 'number' && Number.isFinite(x) && x >= 0;
const date = (x) => str(x) && Number.isFinite(Date.parse(x));
function items(xs, purchase = false) {
  return (
    Array.isArray(xs) &&
    new Set(xs.map((i) => i?.id)).size === xs.length &&
    xs.every(
      (i) =>
        obj(i) &&
        str(i.id) &&
        i.id.length <= 100 &&
        str(i.nome) &&
        i.nome.length <= 300 &&
        typeof i.categoria === 'string' &&
        i.categoria.length <= 100 &&
        num(i.quantidade) &&
        ['un', 'Kg'].includes(i.tipo) &&
        (i.preco == null || num(i.preco)) &&
        (!purchase ||
          (num(i.precoUnitario) &&
            typeof i.pego === 'boolean' &&
            ['planejado', 'extra'].includes(i.origem) &&
            (i.quantidadePlanejada == null || num(i.quantidadePlanejada)))),
    )
  );
}
function purchase(p, completed) {
  return (
    obj(p) &&
    str(p.id) &&
    str(p.listaId) &&
    str(p.nomeLista) &&
    date(p.dataInicio) &&
    items(p.itens, true) &&
    (!completed ||
      (date(p.dataFim) &&
        num(p.valorTotal) &&
        num(p.porcentagemFinal) &&
        p.porcentagemFinal <= 100 &&
        num(p.gastosAdicionais)))
  );
}
export function validData(d) {
  return (
    obj(d) &&
    items(d.itens) &&
    Array.isArray(d.historico) &&
    Array.isArray(d.compras) &&
    d.historico.every(
      (l) =>
        obj(l) &&
        str(l.id) &&
        l.id !== '__draft__' &&
        str(l.nome) &&
        l.nome.length <= 200 &&
        date(l.data) &&
        items(l.itens),
    ) &&
    new Set(d.historico.map((l) => l.id)).size === d.historico.length &&
    new Set(d.historico.map((l) => l.nome.toLowerCase())).size ===
      d.historico.length &&
    (d.sessao === null || purchase(d.sessao, false)) &&
    d.compras.every((p) => purchase(p, true)) &&
    new Set(d.compras.map((p) => p.id)).size === d.compras.length
  );
}
export function readLegacy(storage, email) {
  const suffix = encodeURIComponent(email.trim().toLowerCase());
  const read = (prefix, fallback) =>
    JSON.parse(
      storage.getItem(`${prefix}_${suffix}`) ?? JSON.stringify(fallback),
    );
  try {
    const data = {
      itens: read('carrinho_compras', []),
      historico: read('historico_listas', []),
      sessao: read('sessao_compra', null),
      compras: read('compras_finalizadas', []),
      edicaoId: null,
    };
    if (!validData(data)) return { data: null, invalid: true };
    if (
      !data.itens.length &&
      !data.historico.length &&
      !data.sessao &&
      !data.compras.length
    )
      return { data: null, invalid: false };
    return { data, invalid: false };
  } catch {
    return { data: null, invalid: true };
  }
}
