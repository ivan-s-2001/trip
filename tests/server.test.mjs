import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import worker from '../server/worker.mjs';
if(!globalThis.crypto) Object.defineProperty(globalThis,"crypto",{value:webcrypto});
const tokens={wife:'a'.repeat(64),husband:'b'.repeat(64)};
const access=new Map();for(const [role,token]of Object.entries(tokens)){const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');access.set(hash,role)}
const events=new Map(),state=new Map();
const env={DB:{prepare(sql){return {async all(){return {results:sql.includes('FROM state')?[...state.values()]:[...events.values()]}},bind(...args){return {async first(){return access.has(args[0])?{role:access.get(args[0])}:null},async all(){return {results:sql.includes('FROM state')?[...state.values()]:[...events.values()]}},sql,args}}}},async batch(statements){for(const {sql,args}of statements){if(sql.includes('INTO events')){const [id,key,value,at,received]=args;if(!events.has(id))events.set(id,{id,key,value,at,received});}else{const [key,value,at]=args;if(!state.has(key)||state.get(key).at<=at)state.set(key,{key,value,at});}}}}};
async function call(path,role,data){return worker.fetch(new Request('https://example.test/api/'+path,{method:data?'POST':'GET',headers:role?{Authorization:'Bearer '+tokens[role]}:{},body:data?JSON.stringify(data):undefined}),env)}
assert.equal((await call('state')).status,401);
assert.equal((await(await call('me','wife')).json()).role,'wife');
const event={id:'test-local-event-0001',key:'trip-choice-11-5',value:'поддержка',at:Date.now()};
assert.equal((await call('events','husband',{events:[event]})).status,403);
assert.equal((await call('events','wife',{events:[event]})).status,200);
assert.equal((await call('events','wife',{events:[event]})).status,200);
assert.equal(events.size,1);
assert.equal((await(await call('state','husband')).json()).state[0].value,'поддержка');
await call('events','wife',{events:[{...event,id:'test-local-event-0002',value:'тишина',at:event.at-1000}]});assert.equal(state.get(event.key).value,'поддержка');
assert.equal((await call('events','wife',{events:[{...event,key:'unknown'}]})).status,400);
assert.equal((await call('events','wife',{events:[{...event,value:'x'.repeat(2001)}]})).status,400);
console.log('PASS: role authorization, write/read, retries, stale updates, validation');
