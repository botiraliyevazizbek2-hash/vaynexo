'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { catalogRegions, productRegion } from '../../lib/shop/regions';
import type { Product } from '../../lib/shop/catalog';
export type CatalogStatus = 'loading' | 'ready' | 'awaiting_pricing' | 'unavailable';
export function useLiveCatalog() {
 const [products,setProducts]=useState<Product[]>([]);
 const [requestedRegion,setRequestedRegion]=useState<string|null>(null);
 const [status,setStatus]=useState<CatalogStatus>('loading');
 const [revision,setRevision]=useState(0);
 const reload=useCallback(()=>setRevision(value=>value+1),[]);
 useEffect(()=>{
  const abort=new AbortController();let timer:ReturnType<typeof setTimeout>;
  async function read(){
   try{
    const response=await fetch('/api/catalog',{signal:abort.signal,cache:'no-store'});
    const data=await response.json();
    if(!response.ok||!['ready','awaiting_pricing','unavailable'].includes(data.status)||!Array.isArray(data.products))throw Error('invalid_catalog');
    const list:Product[]=data.products.map((p:Product)=>{
     if(typeof p.id!=='string'||!p.id.startsWith('rsc:')||typeof p.title!=='string'||typeof p.subtitle!=='string'||!Number.isSafeInteger(p.price)||p.price<=0||!['diamond','ticket','crown'].includes(p.icon))throw Error('invalid_product');
     return {id:p.id,categoryId:typeof p.categoryId==='string'?p.categoryId:undefined,categoryName:typeof p.categoryName==='string'?p.categoryName:undefined,title:p.title,subtitle:p.subtitle,diamonds:typeof p.diamonds==='string'?p.diamonds:p.title,price:p.price,icon:p.icon,supplier:'resellcodes'};
    });
    if(!abort.signal.aborted){setProducts(data.status==='ready'?list:[]);setStatus(data.status);}
   }catch{if(!abort.signal.aborted){setProducts([]);setStatus('unavailable');}}
   finally{if(!abort.signal.aborted)timer=setTimeout(read,60000);}
  }
  void read();
  return()=>{abort.abort();clearTimeout(timer);};
 },[revision]);
 const regions=useMemo(()=>catalogRegions(products),[products]);
 const regionId=regions.find(r=>r.id===requestedRegion)?.id??regions[0]?.id??'';
 const regionProducts=useMemo(()=>products.filter(p=>productRegion(p).id===regionId),[products,regionId]);
 const setRegion=(id:string)=>{if(regions.some(r=>r.id===id))setRequestedRegion(id);};
 return {products,regionProducts,regions,regionId,setRegion,status,reload};
}
export type LiveCatalog = ReturnType<typeof useLiveCatalog>;
