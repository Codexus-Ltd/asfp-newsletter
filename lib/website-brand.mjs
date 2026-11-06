/** @returns {Promise<Record<string, any>|null>} */
export async function fetchWebsiteBrand(companyId,fetcher=fetch){
 if(typeof companyId!=='string'||! /^[a-z0-9-]{1,100}$/.test(companyId))return null;
 try{const response=await fetcher('https://www.codex-us.net/brands/'+encodeURIComponent(companyId)+'.json',{signal:AbortSignal.timeout(5000),cache:'no-store'});if(!response.ok)return null;const b=await response.json();if(b.company_id!==companyId||!Number.isSafeInteger(b.revision))return null;
 const safe={company_id:companyId,revision:b.revision};
 for(const k of ['accent','background','surface','text','muted','sidebar']){if(!/^#[a-f0-9]{6}$/i.test(b[k]))return null;safe[k]=b[k];}
 for(const k of ['logo_url','document_logo_url','favicon_url','website_url']){const u=new URL(b[k]);if(u.protocol!=='https:'||u.username||u.password)return null;safe[k]=u.href;}
 safe.name=String(b.name||'').slice(0,100);safe.font=b.font==='serif'?'serif':'sans';safe.heading_font=b.heading_font==='serif'?'serif':'sans';return safe;
 }catch{return null;}
}

export async function applyWebsiteBrand(company,fetcher=fetch){if(!company?.slug)return null;const brand=await fetchWebsiteBrand(company.slug,fetcher);if(brand)Object.assign(company,{logo_url:brand.logo_url,primary_colour:brand.sidebar,secondary_colour:brand.accent,website_url:brand.website_url});return brand;}
