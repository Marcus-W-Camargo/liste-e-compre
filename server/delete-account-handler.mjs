import { createClient } from '@supabase/supabase-js';

function responder(res, status, payload) {
  res.statusCode=status; res.setHeader('Content-Type','application/json; charset=utf-8'); res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff'); res.end(JSON.stringify(payload));
}
function origemPermitida(req, env) {
  const allowed=new Set([env.APP_ORIGIN]);
  if(env.VERCEL_ENV==='preview'&&env.VERCEL_URL)allowed.add(`https://${env.VERCEL_URL}`);
  return typeof req.headers.origin==='string'&&allowed.has(req.headers.origin);
}
export function createDeleteAccountHandler({env=process.env}={}) {
 return async function handler(req,res){
  if(req.method!=='DELETE'){res.setHeader('Allow','DELETE');return responder(res,405,{ok:false,error:'Método não permitido.'});}
  if(!origemPermitida(req,env))return responder(res,403,{ok:false,error:'Origem não permitida.'});
  const authorization=String(req.headers.authorization??'');
  if(!authorization.startsWith('Bearer '))return responder(res,401,{ok:false,error:'Autenticação necessária.'});
  if(!env.SUPABASE_URL||!env.SUPABASE_SECRET_KEY)return responder(res,503,{ok:false,error:'Serviço temporariamente indisponível.'});
  const client=createClient(env.SUPABASE_URL.replace(/\/$/,''),env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const token=authorization.slice(7);
  const {data:{user},error:userError}=await client.auth.getUser(token);
  if(userError||!user)return responder(res,401,{ok:false,error:'Sessão inválida. Entre novamente.'});
  const path=`${user.id}/avatar.jpg`;
  const {error:storageError}=await client.storage.from('profile-photos').remove([path]);
  if(storageError&&!/not found|object not found/i.test(storageError.message??''))return responder(res,503,{ok:false,error:'Não foi possível remover todos os dados da conta. Tente novamente.'});
  const {error:deleteError}=await client.auth.admin.deleteUser(user.id);
  if(deleteError)return responder(res,503,{ok:false,error:'Não foi possível excluir a conta agora. Tente novamente.'});
  return responder(res,200,{ok:true});
 };
}
export default createDeleteAccountHandler();
