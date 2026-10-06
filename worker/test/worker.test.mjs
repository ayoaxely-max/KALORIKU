import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';

const origin = 'https://ayoaxely-max.github.io';
const env = {GEMINI_API_KEY:'unit-test-placeholder',ALLOWED_ORIGIN:origin,GEMINI_MODEL:'gemini-3.8-flash',GEMINI_FALLBACK_MODEL:'gemini-2.5-flash'};
const food = {name:'Nasi putih',estimated_grams:150,min_grams:100,max_grams:200,confidence:.85,portion_description:'sepiring'};
function request(imageBase64='aGVsbG8='){
  return new Request('https://kaloriku-ai.example/analyze',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({imageBase64,mimeType:'image/jpeg'})});
}
function okResponse(){
  return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({foods:[food]})}]}}]}),{status:200});
}
async function withMock(sequence,task){
  const previous=globalThis.fetch;
  const urls=[];
  globalThis.fetch=async url=>{
    urls.push(String(url));
    const item=sequence.shift();
    assert.ok(item,'No more mocked API replies');
    return item;
  };
  try {await task(urls)} finally {globalThis.fetch=previous}
}

test('normal image recognition keeps food schema',async()=>{
  await withMock([okResponse()],async urls=>{
    const r=await app.fetch(request(),env);
    const j=await r.json();
    assert.equal(r.status,200);
    assert.equal(j.result.foods[0].name,'Nasi putih');
    assert.equal(urls.length,1);
  });
});
test('transient 503 retries primary then succeeds',async()=>{
  await withMock([new Response('busy',{status:503}),okResponse()],async urls=>{
    const r=await app.fetch(request(),env);
    assert.equal(r.status,200);
    assert.equal(urls.length,2);
    assert.ok(urls.every(x=>x.includes('gemini-3.8-flash')));
  });
});
test('busy primary falls back to alternative model',async()=>{
  await withMock([new Response('busy',{status:503}),new Response('busy',{status:503}),okResponse()],async urls=>{
    const r=await app.fetch(request(),env);
    const j=await r.json();
    assert.equal(r.status,200);
    assert.equal(j.model,'gemini-2.5-flash');
    assert.equal(urls.length,3);
    assert.ok(urls[2].includes('gemini-2.5-flash'));
  });
});
test('exhausted retries return safe temporary error without provider text',async()=>{
  await withMock([new Response('PRIVATE_PROVIDER_ERROR',{status:429}),new Response('PRIVATE_PROVIDER_ERROR',{status:503}),new Response('PRIVATE_PROVIDER_ERROR',{status:503})],async urls=>{
    const r=await app.fetch(request(),env);
    const j=await r.json();
    assert.equal(r.status,503);
    assert.equal(j.error,'ai_temporarily_unavailable');
    assert.equal(j.retryable,true);
    assert.ok(!JSON.stringify(j).includes('PRIVATE_PROVIDER_ERROR'));
    assert.equal(urls.length,3);
  });
});
test('permanent provider errors are not retried',async()=>{
  await withMock([new Response('invalid key',{status:403})],async urls=>{
    const r=await app.fetch(request(),env);
    const j=await r.json();
    assert.equal(r.status,502);
    assert.equal(j.retryable,false);
    assert.equal(urls.length,1);
  });
});
test('missing API key and invalid image do not call provider',async()=>{
  const noKey=await app.fetch(request(),{...env,GEMINI_API_KEY:''});
  assert.equal(noKey.status,503);
  const invalid=await app.fetch(request(''),env);
  assert.equal(invalid.status,413);
});
