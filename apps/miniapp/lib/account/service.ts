import type { Query } from '../registration/service';
type Identity={id:number;first_name?:unknown;last_name?:unknown;username?:unknown;language_code?:unknown};
function bounded(value:unknown,max:number){return typeof value==='string'?value.slice(0,max):'';}
export function accountService(query:Query){
 return {async open(user:Identity){
  if(!Number.isSafeInteger(user.id)||user.id<=0)throw Error('invalid_identity');
  const {rows}=await query(`INSERT INTO vaynexo_accounts(telegram_id,first_name,last_name,username,language_code)
   VALUES($1,$2,$3,$4,$5) ON CONFLICT(telegram_id) DO UPDATE SET first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,username=EXCLUDED.username,language_code=EXCLUDED.language_code,last_seen_at=now()
   RETURNING telegram_id,first_name,last_name,username,created_at`,[user.id,bounded(user.first_name,128),bounded(user.last_name,128),bounded(user.username,64)||null,bounded(user.language_code,16)||null]);
  const r=rows[0];if(!r)throw Error('unavailable');
  return {telegramId:Number(r.telegram_id),firstName:r.first_name as string,lastName:r.last_name as string,username:r.username as string|null};
 }};
}
