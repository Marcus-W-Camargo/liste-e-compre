import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CloudStore, emptyData } from '../shared/cloud-store.mjs';
import { readLegacy } from '../shared/data-validation.mjs';
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
const item = {
  id: 'a',
  nome: 'Leite',
  categoria: 'Laticinios',
  quantidade: 1,
  tipo: 'un',
};
test('não grava antes de carregar e agrupa mutações do mesmo evento', async () => {
  const saved = [];
  const store = new CloudStore({
    load: async () => ({ data: emptyData(), revision: 0 }),
    save: async (...args) => {
      saved.push(args);
      return { ok: true, revision: 1 };
    },
  });
  assert.throws(() =>
    store.mutate((d) => {
      d.itens = [item];
    }),
  );
  await store.connect('alice', 'alice@example.com');
  assert.equal(saved.length, 0);
  store.mutate((d) => {
    d.itens = [item];
  });
  store.mutate((d) => {
    d.edicaoId = 'lista';
  });
  await store.flush();
  assert.equal(saved.length, 1);
  assert.equal(saved[0][3].edicaoId, 'lista');
  assert.equal(store.getSnapshot().dirty, false);
});
test('edita durante uma gravação: envia a próxima revisão em sequência', async () => {
  const request = deferred();
  const saved = [];
  const store = new CloudStore({
    load: async () => ({ data: emptyData(), revision: 0 }),
    save: async (...args) => {
      saved.push(args);
      return saved.length === 1 ? request.promise : { ok: true, revision: 2 };
    },
  });
  await store.connect('alice', 'a');
  store.mutate((d) => {
    d.itens = [item];
  });
  const pending = store.flush();
  store.mutate((d) => {
    d.itens[0].quantidade = 2;
  });
  request.resolve({ ok: true, revision: 1 });
  await pending;
  assert.equal(saved.length, 2);
  assert.equal(saved[1][1], 1);
  assert.equal(saved[1][3].itens[0].quantidade, 2);
});
test('falha de rede preserva edição e retry reutiliza operation id', async () => {
  const saved = [];
  let failure = true;
  const store = new CloudStore({
    load: async () => ({ data: emptyData(), revision: 0 }),
    save: async (...args) => {
      saved.push(args);
      if (failure) throw new Error('offline');
      return { ok: true, revision: 1 };
    },
  });
  await store.connect('alice', 'a');
  store.mutate((d) => {
    d.itens = [item];
  });
  await assert.rejects(store.flush(), /offline/);
  assert.equal(store.getSnapshot().dirty, true);
  assert.deepEqual(store.getSnapshot().data.itens, [item]);
  failure = false;
  await store.retry();
  assert.equal(saved[0][2], saved.at(-1)[2]);
  assert.equal(store.getSnapshot().dirty, false);
});
test('conflito preserva edição e exige recarga explícita', async () => {
  let revision = 0;
  const store = new CloudStore({
    load: async () => ({ data: emptyData(), revision }),
    save: async () => ({ ok: false, revision: 2 }),
  });
  await store.connect('alice', 'a');
  store.mutate((d) => {
    d.itens = [item];
  });
  await assert.rejects(store.flush(), /outro dispositivo/);
  assert.deepEqual(store.getSnapshot().data.itens, [item]);
  assert.equal(store.getSnapshot().status, 'conflict');
  await assert.rejects(store.retry());
  revision = 2;
  await store.reload();
  assert.equal(store.getSnapshot().revision, 2);
  assert.equal(store.getSnapshot().dirty, false);
});
test('resposta atrasada da conta anterior não altera a conta atual', async () => {
  const request = deferred();
  const store = new CloudStore({
    load: async (owner) =>
      owner === 'alice' ? request.promise : { data: emptyData(), revision: 4 },
    save: async () => ({ ok: true, revision: 1 }),
  });
  const old = store.connect('alice', 'a');
  await store.connect('bob', 'b');
  request.resolve({ data: { ...emptyData(), itens: [item] }, revision: 8 });
  await old;
  assert.equal(store.getSnapshot().owner, 'bob');
  assert.equal(store.getSnapshot().revision, 4);
  assert.deepEqual(store.getSnapshot().data.itens, []);
});
test('refresh atrasado não sobrescreve edição iniciada enquanto carregava', async () => {
  const request = deferred();
  let initial = true;
  const store = new CloudStore({
    load: async () => {
      if (initial) {
        initial = false;
        return { data: emptyData(), revision: 0 };
      }
      return request.promise;
    },
    save: async () => ({ ok: true, revision: 1 }),
  });
  await store.connect('alice', 'a');
  const refresh = store.load();
  store.mutate((d) => {
    d.itens = [item];
  });
  await store.flush();
  request.resolve({ data: emptyData(), revision: 0 });
  await refresh;
  assert.deepEqual(store.getSnapshot().data.itens, [item]);
});
test('importação local lê só listas do e-mail atual, nunca credenciais', () => {
  const keys = [];
  const storage = {
    getItem(key) {
      keys.push(key);
      return key === 'carrinho_compras_alice%40example.com'
        ? JSON.stringify([item])
        : null;
    },
  };
  const imported = readLegacy(storage, 'Alice@example.com');
  assert.deepEqual(imported.data.itens, [item]);
  assert.ok(keys.every((k) => k.endsWith('alice%40example.com')));
  assert.ok(!keys.includes('usuarios_local'));
  assert.equal(readLegacy({ getItem: () => '{invalid' }, 'a').invalid, true);
});
