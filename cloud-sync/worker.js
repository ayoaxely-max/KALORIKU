const ALLOWED_ORIGIN='https://ayoaxely-max.github.io';
const MAX_CHUNKS=120, MAX_PART=100000, MAX_BYTES=12000000;
const encoder=new TextEncoder();
function json(value,status=200,headers={}){return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store',...headers}})}
function headers(request){const origin=request.headers.get('Origin');return origin===ALLOWED_ORIGIN?{'access-control-allow-origin':origin,'vary':'Origin','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'Authorization,Content-Type','access-control-max-age':'600'}:{}}
function fail(message,status,cors){return json({ok:false,error:message},status,cors)}
function isHex64(x){return typeof x==='string'&&/^[a-f0-9]{64}$/.test(x)}
async function sha256(x){const digest=await crypto.subtle.digest('SHA-256',encoder.encode(x));return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function equal(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}
async function body(request,limit=125000){const size=Number(request.headers.get('content-length'))||0;if(size>limit)throw Error('Permintaan terlalu besar');const text=await request.text();if(text.length>limit)throw Error('Permintaan terlalu besar');return JSON.parse(text)}
function rowOut(row){return {ok:true,revision:row.revision,updatedAt:row.updated_at,chunks:row.count,bytes:row.bytes,active:!!row.active_upload}}
export default {
 async fetch(request,env){
  const u=new URL(request.url),cors=headers(request);
  if(request.method==='OPTIONS')return request.headers.get('Origin')===ALLOWED_ORIGIN?new Response(null,{status:204,headers:cors}):fail('Asal tidak diizinkan',403,cors);
  if(u.pathname==='/health')return json({ok:true,service:'kaloriku-sync',version:2,limits:{chunks:MAX_CHUNKS,part:MAX_PART}},200,cors);
  if(request.headers.get('Origin')!==ALLOWED_ORIGIN)return fail('Asal tidak diizinkan',403,cors);
  if(!env.SYNC_DB)return fail('Penyimpanan belum tersedia',503,cors);
  const accountId=request.headers.get('X-Account-ID')||u.searchParams.get('account');
  const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
  if(!isHex64(accountId)||!isHex64(token))return fail('Kunci sinkronisasi tidak valid',401,cors);
  try{
   const authHash=await sha256(token);
   let account=await env.SYNC_DB.prepare('SELECT * FROM sync_accounts WHERE account_id=?').bind(accountId).first();
   if(u.pathname==='/sync/init'&&request.method==='POST'){
    if(!account){
     await env.SYNC_DB.prepare('INSERT OR IGNORE INTO sync_accounts(account_id,auth_hash) VALUES (?,?)').bind(accountId,authHash).run();
     account=await env.SYNC_DB.prepare('SELECT * FROM sync_accounts WHERE account_id=?').bind(accountId).first();
    }
   }
   if(!account||!equal(account.auth_hash,authHash))return fail('Akun sinkronisasi atau kode pemulihan salah',401,cors);
   if(u.pathname==='/sync/init'&&request.method==='POST'||u.pathname==='/sync/head'&&request.method==='GET')
    return json(rowOut(account),200,cors);
   if(u.pathname==='/sync/chunk'&&request.method==='POST'){
    const x=await body(request,125000);
    if(!/^[a-f0-9-]{36}$/.test(x.uploadId||'')||!Number.isInteger(x.index)||x.index<0||x.index>=MAX_CHUNKS||
      typeof x.data!=='string'||!x.data.length||x.data.length>MAX_PART||!/^[A-Za-z0-9_-]+$/.test(x.data))
     return fail('Bagian data tidak valid',400,cors);
    await env.SYNC_DB.prepare('INSERT OR REPLACE INTO sync_chunks(account_id,upload_id,idx,data) VALUES (?,?,?,?)')
     .bind(accountId,x.uploadId,x.index,x.data).run();
    return json({ok:true,index:x.index},200,cors);
   }
   if(u.pathname==='/sync/commit'&&request.method==='POST'){
    const x=await body(request,1000);
    if(!/^[a-f0-9-]{36}$/.test(x.uploadId||'')||!Number.isInteger(x.total)||x.total<1||x.total>MAX_CHUNKS||
      !Number.isInteger(x.expectedRevision)||x.expectedRevision<0)return fail('Metadata sinkronisasi tidak valid',400,cors);
    const counts=await env.SYNC_DB.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(LENGTH(data)),0) AS bytes, MIN(idx) AS first, MAX(idx) AS last FROM sync_chunks WHERE account_id=? AND upload_id=?').bind(accountId,x.uploadId).first();
    if(Number(counts.n)!==x.total||Number(counts.first)!==0||Number(counts.last)!==x.total-1||Number(counts.bytes)>MAX_BYTES)
      return fail('Bagian belum lengkap atau terlalu besar',400,cors);
    const upd=await env.SYNC_DB.prepare("UPDATE sync_accounts SET active_upload=?,count=?,bytes=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE account_id=? AND revision=?")
      .bind(x.uploadId,x.total,counts.bytes,accountId,x.expectedRevision).run();
    if(!(upd.meta?.changes>0))return fail('Data cloud sudah berubah di perangkat lain. Unduh dan periksa sebelum mengunggah ulang.',409,cors);
    const newest=await env.SYNC_DB.prepare('SELECT * FROM sync_accounts WHERE account_id=?').bind(accountId).first();
    // Preserve the previous snapshot for in-flight readers. Clean only older unrelated uploads.
    await env.SYNC_DB.prepare('DELETE FROM sync_chunks WHERE account_id=? AND upload_id NOT IN (?,?)')
     .bind(accountId,x.uploadId,account.active_upload||x.uploadId).run();
    return json(rowOut(newest),200,cors);
   }
   if(u.pathname==='/sync/read'&&request.method==='GET'){
    const index=Number(u.searchParams.get('index'));
    const requestedUpload=u.searchParams.get('upload');
    if(!Number.isInteger(index)||index<0||index>=MAX_CHUNKS||
       !/^[a-f0-9-]{36}$/.test(requestedUpload||''))return fail('Bagian tidak valid',400,cors);
    const head=await env.SYNC_DB.prepare('SELECT active_upload,count,revision FROM sync_accounts WHERE account_id=?').bind(accountId).first();
    if(!head.active_upload)return fail('Belum ada data cloud',404,cors);
    if(requestedUpload!==head.active_upload)return fail('Revisi cloud berubah, silakan mulai unduh ulang',409,cors);
    if(index>=head.count)return fail('Indeks tidak tersedia',404,cors);
    const part=await env.SYNC_DB.prepare('SELECT data FROM sync_chunks WHERE account_id=? AND upload_id=? AND idx=?').bind(accountId,requestedUpload,index).first();
    if(!part)return fail('Bagian data tidak tersedia',503,cors);
    return json({ok:true,data:part.data,index,revision:head.revision},200,cors);
   }
   if(u.pathname==='/sync/manifest'&&request.method==='GET'){
    if(!account.active_upload)return fail('Belum ada data cloud',404,cors);
    return json({...rowOut(account),upload:account.active_upload},200,cors);
   }
   if(u.pathname==='/sync/delete'&&request.method==='POST'){
    const x=await body(request,500);
    if(x.confirm!=='DELETE CLOUD'||x.expectedRevision!==account.revision)return fail('Konfirmasi tidak sesuai atau cloud sudah berubah',409,cors);
    const updated=await env.SYNC_DB.prepare("UPDATE sync_accounts SET active_upload=NULL,count=0,bytes=0,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE account_id=? AND revision=?")
      .bind(accountId,account.revision).run();
    if(!(updated.meta?.changes>0))return fail('Versi berubah',409,cors);
    await env.SYNC_DB.prepare('DELETE FROM sync_chunks WHERE account_id=?').bind(accountId).run();
    return json({ok:true,deleted:true},200,cors);
   }
   return fail('Endpoint tidak tersedia',404,cors);
  }catch(e){return fail('Kesalahan layanan: '+String(e.message||e).slice(0,180),500,cors)}
 }
};