(()=>{'use strict';
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
const hash=async(v)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const pending=new URLSearchParams(location.search);let active=false;
function overlay(text){let box=document.getElementById('codexus-sso-status');if(!box){box=document.createElement('section');box.id='codexus-sso-status';box.setAttribute('role','status');box.style.cssText='position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;gap:20px;align-items:center;justify-content:center;background:#faf9f6;color:#343c30;font:16px Arial;padding:30px;text-align:center';document.body.appendChild(box)}box.replaceChildren();const message=document.createElement('p');message.textContent=text;box.appendChild(message);return box;}
async function boot(){
 const response=await fetch('/codexus-sso-config.json',{cache:'no-store'});if(!response.ok)return;const config=await response.json();
 const requested=pending.get('target')||pending.get('codexus_target');
 const target=config.targets.includes(requested)?requested:config.target;
 async function begin(){
  if(active)return;active=true;
  if(!target){location.assign('https://www.codex-us.net/');return;}
  const requestedPortal=pending.get('portal_origin');const portalOrigin=['https://www.codex-us.net','https://codex-us.net','https://codexus-portal.vercel.app'].includes(requestedPortal)?requestedPortal:'https://www.codex-us.net';
  const callback=new URL(config.callbackUrl);if(location.origin!==callback.origin){callback.searchParams.set('codexus_start','1');callback.searchParams.set('target',target);callback.searchParams.set('portal_origin',portalOrigin);location.assign(callback.href);return;}
  const verifier=random(),state=random();const sharedComputer=!!document.getElementById('codexus-sso-shared')?.checked;sessionStorage.setItem('codexus-sso:'+target,JSON.stringify({verifier,state,sharedComputer,at:Date.now()}));
  const url=new URL('/connect',portalOrigin);url.searchParams.set('target',target);url.searchParams.set('challenge',await hash(verifier));url.searchParams.set('state',state);location.assign(url.href);
 }
 if(pending.get('codexus_sso')==='1'){
  active=true;const code=pending.get('code'),state=pending.get('state');history.replaceState(null,'',location.pathname);
  const box=overlay('Connecting your Codexus account…');
  try{
   if(!target)throw Error('Choose your application from the Codexus Portal.');
   const saved=JSON.parse(sessionStorage.getItem('codexus-sso:'+target)||'null');sessionStorage.removeItem('codexus-sso:'+target);
   if(!saved||saved.state!==state||Date.now()-saved.at>300000||!/^[a-f0-9]{64}$/.test(code||''))throw Error('This sign-in request has expired or belongs to a different browser. Open the app from the Portal again.');
   const body={target,code,state,verifier:saved.verifier,sharedComputer:saved.sharedComputer===true};
   const r=await fetch(config.exchange,{method:'POST',headers:{'Content-Type':'application/json',...(config.key?{apikey:config.key}:{})},credentials:config.mode==='server'?'same-origin':'omit',body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error||'Your account does not have access to this application.');
   if(config.mode!=='server'){
    const verified=await fetch(data.url+'/auth/v1/verify',{method:'POST',headers:{apikey:data.anon_key,'Content-Type':'application/json'},body:JSON.stringify({token_hash:data.token_hash,type:'magiclink'})});const session=await verified.json();if(!verified.ok||!session.access_token)throw Error('Your app session could not be established. Please open the app from the Portal again.');
    session.expires_at=session.expires_at||Math.floor(Date.now()/1000)+session.expires_in;
    const storage=config.mode==='session'?sessionStorage:localStorage;storage.setItem(config.storageKey,JSON.stringify(session));
   }
   location.replace(config.successPath||'/');
  }catch(e){box.firstChild.textContent=e instanceof Error?e.message:'Sign-in could not be completed.';const link=document.createElement('a');link.href='https://www.codex-us.net/';link.textContent='Return to Codexus Portal';box.appendChild(link);}
  return;
 }
 if(pending.get('codexus_start')==='1'){overlay('Opening Codexus Portal…');await begin();return;}
 if(!config.loginPaths.includes(location.pathname))return;
 const done=new WeakSet();
 function scan(){
  const forms=[...document.querySelectorAll('form')].filter(f=>f.querySelector('input[autocomplete="current-password"]')||location.pathname==='/join'&&f.querySelector('input[autocomplete="new-password"]'));
  for(const form of forms){if(done.has(form)||!form.getClientRects().length)continue;done.add(form);
   const section=document.createElement('section');section.style.cssText='margin:20px 0;display:block';
   const button=document.createElement('button');button.type='button';button.textContent='Continue with Codexus Portal';button.style.cssText='width:100%;min-height:48px;padding:13px 18px;border:0;border-radius:8px;background:#354733;color:white;font:600 14px Arial;cursor:pointer';button.onclick=()=>void begin();
   const note=document.createElement('p');note.textContent='One Codexus account. Access is limited to your assigned company and applications.';note.style.cssText='font:12px/1.6 Arial;opacity:.75;margin:10px 0';
   const reset=document.createElement('a');reset.href='https://www.codex-us.net/login?mode=forgot';reset.textContent='Reset Codexus Portal password';reset.style.cssText='display:block;margin:12px 0;font:12px Arial;text-decoration:underline;color:inherit';section.append(button,note,reset);
   if(config.sharedComputer){const label=document.createElement('label');label.style.cssText='display:flex;gap:10px;align-items:center;margin:12px 0;font:13px Arial';const input=document.createElement('input');input.type='checkbox';input.id='codexus-sso-shared';input.style.cssText='width:auto';label.append(input,document.createTextNode('Shared or borrowed computer'));section.appendChild(label);}
   form.before(section);
   // Keep existing local sign-in available during migration.
   const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Use existing app sign-in';toggle.style.cssText='background:transparent;color:inherit;border:0;padding:8px 0;font:12px Arial;text-decoration:underline;cursor:pointer';section.appendChild(toggle);const helpLinks=[...form.parentElement.querySelectorAll('a[href="/forgot-password"]')];for(const link of helpLinks)link.hidden=true;const previousDisplay=form.style.display;form.hidden=true;form.style.display='none';
   toggle.onclick=()=>{form.hidden=!form.hidden;form.style.display=form.hidden?'none':previousDisplay;for(const link of helpLinks)link.hidden=form.hidden;toggle.textContent=form.hidden?'Use existing app sign-in':'Hide existing app sign-in';};
  }
 }
 scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void boot());else void boot();
})();
