import { createCipheriv, randomBytes } from 'node:crypto';
export type Query = (sql:string,values?:unknown[])=>Promise<{rows:Record<string,unknown>[]}>;
export type Contact = {user_id?:number;phone_number?:string};
export function ownContact(message:{chat?:{id?:number;type?:string};from?:{id?:number;is_bot?:boolean};contact?:Contact;forward_origin?:unknown}) {
 const id=message.from?.id;
 if(!Number.isSafeInteger(id)||id!<=0||message.from?.is_bot||message.chat?.type!=='private'||message.chat.id!==id||message.contact?.user_id!==id||message.forward_origin)return null;
 const raw=message.contact?.phone_number;
 if(typeof raw!=='string'||!/^\+?[1-9]\d{6,14}$/.test(raw))return null;
 return {id:id!,phone:raw.startsWith('+')?raw:'+'+raw};
}
export function validDataKey(value:string|undefined) { return !!value&&/^[a-f0-9]{64}$/.test(value); }
function encryptPhone(phone:string,key:string) {
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(key,'hex'),iv);
 const encrypted=Buffer.concat([cipher.update(phone,'utf8'),cipher.final()]);
 return ['v1',iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),encrypted.toString('base64url')].join('.');
}
export function createRegistrationService(query:Query,key:string) {
 if(!validDataKey(key))throw Error('Registration configuration unavailable');
 return {
  async status(id:number) {
   const {rows}=await query('SELECT registered_at, phone_last4, pending_until > NOW() AS pending FROM vaynexo_phone_registrations WHERE telegram_id=$1',[id]);
   const row=rows[0];
   return {registered:!!row?.registered_at,maskedPhone:row?.registered_at?`•••• ${row.phone_last4}`:null,pending:row?.pending===true};
  },
  async begin(id:number) {
   const {rows}=await query(`INSERT INTO vaynexo_phone_registrations (telegram_id,pending_until,next_request_at,consent_at,consent_version)
     VALUES ($1,NOW()+INTERVAL '5 minutes',NOW()+INTERVAL '30 seconds',NOW(),'phone-v1')
     ON CONFLICT (telegram_id) DO UPDATE SET pending_until=EXCLUDED.pending_until,next_request_at=EXCLUDED.next_request_at,consent_at=EXCLUDED.consent_at,consent_version=EXCLUDED.consent_version
     WHERE vaynexo_phone_registrations.registered_at IS NULL AND vaynexo_phone_registrations.next_request_at <= NOW()
     RETURNING telegram_id`,[id]);
   return rows.length>0;
  },
  async cancel(id:number) {await query('UPDATE vaynexo_phone_registrations SET pending_until=NULL WHERE telegram_id=$1 AND registered_at IS NULL',[id]);},
  async accept(message:Parameters<typeof ownContact>[0]) {
   const contact=ownContact(message);if(!contact)return false;
   const ciphertext=encryptPhone(contact.phone,key);
   const {rows}=await query(`UPDATE vaynexo_phone_registrations SET phone_ciphertext=$2,phone_last4=$3,registered_at=NOW(),pending_until=NULL
      WHERE telegram_id=$1 AND registered_at IS NULL AND pending_until>NOW() AND consent_version='phone-v1' RETURNING telegram_id`,[contact.id,ciphertext,contact.phone.slice(-4)]);
   return rows.length>0;
  }
 };
}
