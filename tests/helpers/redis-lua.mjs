import fengari from 'fengari';
const { lua, lauxlib, lualib, to_luastring: bytes } = fengari;

// Executa os scripts REAIS em uma VM Lua; apenas redis.call e relógio são simulados.
// Não substitui a verificação de integração no Upstash antes de produção.
export function redisFixture() {
  const records = new Map();
  let now = 0;
  function get(key) {
    const record = records.get(key);
    if (record && record.expiry <= now) { records.delete(key); return undefined; }
    return record;
  }
  function redisCall(cmd, key, ...args) {
    let record = get(key);
    if (cmd === 'DEL') return Number(records.delete(key));
    if (cmd === 'TTL') return record ? Math.floor((record.expiry - now) / 1000) : -2;
    if (cmd === 'EXPIRE') { if (record) record.expiry = now + Number(args[0]) * 1000; return Number(!!record); }
    if (cmd === 'INCR') {
      record ??= { value: 0, expiry: Infinity };
      records.set(key, record);
      return ++record.value;
    }
    if (cmd === 'HGET') return record?.fields[args[0]] ?? null;
    if (cmd === 'HSET') {
      record ??= { fields: {}, expiry: Infinity };
      records.set(key, record);
      for (let i = 0; i < args.length; i += 2) record.fields[args[i]] = args[i + 1];
      return args.length / 2;
    }
    if (cmd === 'HINCRBY') {
      record.fields[args[0]] = String(Number(record.fields[args[0]] || 0) + Number(args[1]));
      return Number(record.fields[args[0]]);
    }
    if (cmd === 'HDEL') { delete record.fields[args[0]]; return 1; }
    throw new Error(`Unsupported Redis command: ${cmd}`);
  }
  async function command(cmd, script, count, key, ...args) {
    if (cmd !== 'EVAL' || count !== 1) throw new Error('Expected EVAL with one key');
    const state = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(state);
    for (const [name, values] of [['KEYS', [key]], ['ARGV', args]]) {
      lua.lua_createtable(state, values.length, 0);
      values.forEach((v, index) => {
        lua.lua_pushstring(state, bytes(String(v)));
        lua.lua_rawseti(state, -2, index + 1);
      });
      lua.lua_setglobal(state, bytes(name));
    }
    lua.lua_newtable(state);
    lua.lua_pushjsfunction(state, (s) => {
      const values = Array.from({ length: lua.lua_gettop(s) }, (_, i) => lua.lua_tojsstring(s, i + 1));
      const result = redisCall(...values);
      if (result === null) lua.lua_pushboolean(s, false);
      else if (typeof result === 'number') lua.lua_pushnumber(s, result);
      else lua.lua_pushstring(s, bytes(String(result)));
      return 1;
    });
    lua.lua_setfield(state, -2, bytes('call'));
    lua.lua_setglobal(state, bytes('redis'));
    if (lauxlib.luaL_dostring(state, bytes(script)) !== lua.LUA_OK) {
      throw new Error(lua.lua_tojsstring(state, -1));
    }
    const result = lua.lua_tonumber(state, -1);
    lua.lua_close(state);
    return result;
  }
  return { command, records, advance: (ms) => { now += ms; } };
}
