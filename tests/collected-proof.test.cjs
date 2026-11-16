const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync(__dirname+'/../app/api/send-test/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
async function run({wrongIssue=false,missingRecipient=false}={}){
 let sent;
 const company={id:'collected-id',slug:'collected-comforts',name:'Collected Co.',sender_name:'Collected Co.',sender_email:'chantalcollected@gmail.com',reply_to_email:'chantalcollected@gmail.com',primary_colour:'#403f36',secondary_colour:'#6d745a',logo_url:'https://www.collectedco.co.nz/assets/collected-co-logo-approved.webp',website_url:'https://www.collectedco.co.nz'};
 const db={from:table=>({select(){return this},eq(){return this},ilike(){return this},maybeSingle:async()=>({data:table==='companies'?company:table==='issues'?(wrongIssue?null:{id:7,issue_number:'01',title:'A lovely first hello.',month:'November',year:2026}):(missingRecipient?null:{id:1,name:'Chantal',email:'chantalcollected@gmail.com',unsubscribe_token:'fixture-token',active:false}),error:null})})};
 const context={exports:{},Response,console,process:{env:{RESEND_API_KEY:'fixture',NEWSLETTER_FROM:'Codexus <news@example.test>',NEWSLETTER_REPLY_TO:'reply@example.test',WEBSITE_URL:'https://codexus-newsletter.vercel.app'}},require:name=>name==='next/server'?{NextResponse:{json:Response.json}}:name==='resend'?{Resend:class{emails={send:async args=>{sent=args;return {data:{id:'accepted'},error:null}}}}}:name==='@/lib/supabase'?{supabase:db}:name==='@/lib/tenant-auth'?{requireCompanyAccess:async()=>({company})}:{applyWebsiteBrand:async()=>null}};
 vm.runInNewContext(source,context);
 const response=await context.exports.POST({json:async()=>({companySlug:'collected-comforts',issueId:7,email:'chantalcollected@gmail.com'})});
 return {status:response.status,sent};
}
test('Collected proof uses its branding and verified transport, only to Chantal',async()=>{
 const r=await run();assert.equal(r.status,200);assert.equal(r.sent.to,'chantalcollected@gmail.com');assert.equal(r.sent.from,'Collected Co. <news@example.test>');assert.equal(r.sent.replyTo,'chantalcollected@gmail.com');
 for(const fragment of ['PROOF EMAIL — Collected Co.','#faf9f6','#6d745a','font-family:Georgia,serif','collected-co-logo-approved.webp','/newsletter/7'])assert.ok(r.sent.html.includes(fragment));
 assert.ok(r.sent.subject.startsWith('[PROOF]'));
});
test('missing company issue or recipient cannot send a proof',async()=>{for(const opts of [{wrongIssue:true},{missingRecipient:true}]){const r=await run(opts);assert.ok(r.status>=400);assert.equal(r.sent,undefined)}});
