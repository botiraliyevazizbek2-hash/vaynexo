import { telegramCall } from '../telegram/bot';
export function signedPhotoUrl(value:unknown):string|null {
 if(typeof value!=='string'||value.length>2048)return null;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
export async function telegramProfilePhoto(id:number) {
 const token=process.env.TELEGRAM_BOT_TOKEN;
 if(!token||!Number.isSafeInteger(id)||id<=0)throw Error('unavailable');
 const photos=await telegramCall<{photos?:{file_id:string}[][]}>('getUserProfilePhotos',{user_id:id,limit:1});
 const sizes=photos.photos?.[0];if(!Array.isArray(sizes)||!sizes.length)return null;
 const fileId=sizes[sizes.length-1]?.file_id;
 if(typeof fileId!=='string'||fileId.length>512)throw Error('unavailable');
 const file=await telegramCall<{file_path?:string;file_size?:number}>('getFile',{file_id:fileId});
 if(!file.file_path||file.file_path.length>512||!file.file_path.split('/').every(p=>/^[A-Za-z0-9_.-]+$/.test(p)&&p!=='.'&&p!=='..')||(file.file_size??0)>2000000)throw Error('unavailable');
 const response=await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000)});
 if(!response.ok||Number(response.headers.get('content-length')??0)>2000000||!response.body)throw Error('unavailable');
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 while(true){const r=await reader.read();if(r.done)break;size+=r.value.byteLength;if(size>2000000){await reader.cancel();throw Error('unavailable');}chunks.push(r.value);}
 if(!size)throw Error('unavailable');
 const bytes=Buffer.concat(chunks);
 const type=bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'?'image/webp':null;
 if(!type)throw Error('unavailable');
 return {bytes,type};
}
