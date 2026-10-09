const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const source=fs.readFileSync(require('node:path').join(__dirname,'../sync.js'),'utf8');
async function screen(nativeRole,storedRole='',storedToken=''){
 const store=new Map([['trip-role',storedRole],['trip-access',storedToken]]),elements=new Map(),calls=[],nativeSaved=[];let setup;
 const element=id=>{if(!elements.has(id))elements.set(id,{hidden:false,value:'',textContent:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn},showModal(){this.open=true},close(){this.open=false},replaceChildren(){}});return elements.get(id)};
 const context={window:null,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},document:{hidden:false,addEventListener(_,fn){setup=fn},getElementById:element,createElement:()=>({append(){}})},TripNative:{getAppRole:()=>nativeRole,getSyncAccess:()=>storedToken,setSyncAccess:(...x)=>nativeSaved.push(x)},navigator:{onLine:false},location:{search:'',hash:'',pathname:'/'},history:{replaceState(){}},URLSearchParams,crypto:webcrypto,Date,Set,JSON,Event,addEventListener(){},dispatchEvent(){},setInterval(){},fetch:async(path,options)=>{calls.push(options.headers.Authorization);return {ok:true,json:async()=>path.endsWith('/api/me')?{role:'wife'}:{state:[],events:[]}}}};
 context.window=context;vm.createContext(context);vm.runInContext(source,context);await setup();return {store,element,calls,context,nativeSaved};
}
(async()=>{
 const wife=await screen('wife');assert.ok(!wife.element('connectSheet').open);assert.equal(wife.element('scene').hidden,false);
 wife.element('accessCode').value='https://ivan-s-2001.github.io/trip/#access='+'a'.repeat(64);
 await wife.element('connectForm').listeners.submit({preventDefault(){}});assert.equal(wife.store.get('trip-access'),'a'.repeat(64));assert.equal(wife.nativeSaved[0][1],'wife');
 const husband=await screen('husband');assert.equal(husband.element('connectSheet').open,true);
 husband.element('accessCode').value='a'.repeat(64);await husband.element('connectForm').listeners.submit({preventDefault(){}});assert.equal(husband.store.get('trip-access'),'');assert.equal(husband.context.TripSync.getRole(),'');
 console.log('PASS: recipient opens without login, connection link saved natively, editor rejects recipient code');
})().catch(e=>{console.error(e);process.exit(1)});
