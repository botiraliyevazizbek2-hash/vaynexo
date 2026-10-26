import type { Product } from './catalog';
export function productRegion(product: Product) {
 const id=product.categoryId || product.id.split(':')[1] || product.subtitle;
 const name=product.categoryName || product.subtitle;
 const short=name.replace(/^Mobile Legends\s*/i,'').replace(/^\((.*)\)$/,'$1').trim() || name;
 const labels:Record<string,string>={Russia:'RU',Turkey:'Turkiya',Singapore:'SG',Malaysia:'MY',Indonesia:'ID',Brazil:'BR',Philippines:'PH','United States':'US'};
 return {id,label:labels[short]??short};
}
export function catalogRegions(products:Product[]) {
 const unique=new Map<string,{id:string;label:string}>();
 for(const product of products){const region=productRegion(product);if(!unique.has(region.id))unique.set(region.id,region);}
 const order=['Global','RU','Turkiya','SG','MY','ID','PH','BR','US'];
 return [...unique.values()].sort((a,b)=>{
  const ai=order.indexOf(a.label),bi=order.indexOf(b.label);
  return (ai<0?100:ai)-(bi<0?100:bi)||a.label.localeCompare(b.label);
 });
}
export function isMLBBCategory(category:{id:string;name:string}) {
 const text=category.id+' '+category.name;
 return /mobile[\s_-]*legends|\bmlbb\b/i.test(text)&&!/(?:\b|_)adventure(?:\b|_)/i.test(text);
}
