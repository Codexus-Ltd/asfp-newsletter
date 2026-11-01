import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 const store=await cookies();const url=process.env.NEXT_PUBLIC_SUPABASE_URL!,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
 const auth=createServerClient(url,key,{cookies:{getAll:()=>store.getAll(),setAll:values=>values.forEach(({name,value,options})=>store.set(name,value,options))}});
 try{
  const body=await request.json();if(!['newsletter-asfp','newsletter-comfort','newsletter-mahi','newsletter-codexus'].includes(body.target))throw Error('Application not permitted');
  const r=await fetch(url+'/functions/v1/portal-app-session',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});const result=await r.json();if(!r.ok)throw Error(result.error||'Application access required');
  const verified=await auth.auth.verifyOtp({token_hash:result.token_hash,type:'magiclink'});if(verified.error||!verified.data.user)throw Error('Your Newsletter session could not be established.');
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){await auth.auth.signOut({scope:'local'});return Response.json({error:e instanceof Error?e.message:'App sign-in failed'},{status:403,headers:{'Cache-Control':'no-store'}})}
}
