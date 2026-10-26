import { timingSafeEqual } from 'node:crypto';
import { isLanguage, normalizeLanguage, type Language } from '../i18n/core';
const DEFAULT_WEBAPP_URL = 'https://null-alpha-orcin.vercel.app';
type Sender = { id:number; first_name?:string; is_bot?:boolean; language_code?:string };
export type TelegramUpdate = {update_id:number; message?:{message_id:number;chat:{id:number;type:string};from?:Sender;text?:string};callback_query?:{id:string;from:Sender;data?:string;message?:{message_id:number;chat:{id:number;type:string}}}};
type Button = {text:string;web_app?:{url:string};url?:string;callback_data?:string};
export type BotReply = {text:string;reply_markup?:{inline_keyboard:Button[][]}};
const text = {
 uz:{welcome:'VAYNEXO ga xush kelibsiz',player:'o‘yinchi',intro:'Mobile Legends: Bang Bang o‘yinchilari uchun hamjamiyat platformasi.',open:'Ilovani ochish',shop:'Do‘kon',coach:'AI murabbiy',arena:'Arena',news:'Yangiliklar',help:'Yordam',language:'Tilni tanlang',demo:'Hozircha demo rejim: haqiqiy buyurtma, to‘lov va olmos yetkazish ulanmagan.',unknown:'Buyruqlar uchun /help yuboring.',shopInfo:'Olmoslar va passlar katalogi.',coachInfo:'Build, counter-pick va meta maslahatlari — hozircha demo.',arenaInfo:'Turnirlar va jamoalar — demo bo‘lim.',newsInfo:'Patch va qahramon yangilanishlari — demo kontent.',appInfo:'Barcha bo‘limlar bitta ilovada.',start:'Boshlash'},
 ru:{welcome:'Добро пожаловать в VAYNEXO',player:'игрок',intro:'Платформа сообщества игроков Mobile Legends: Bang Bang.',open:'Открыть приложение',shop:'Магазин',coach:'AI-тренер',arena:'Арена',news:'Новости',help:'Помощь',language:'Выберите язык',demo:'Пока демо-режим: реальные заказы, оплата и доставка алмазов не подключены.',unknown:'Отправьте /help для списка команд.',shopInfo:'Каталог алмазов и пропусков.',coachInfo:'Советы по сборкам, контрпикам и мете — пока демо.',arenaInfo:'Турниры и команды — демо-раздел.',newsInfo:'Обновления патчей и героев — демо-контент.',appInfo:'Все разделы в одном приложении.',start:'Начать'},
 en:{welcome:'Welcome to VAYNEXO',player:'player',intro:'A community platform for Mobile Legends: Bang Bang players.',open:'Open app',shop:'Shop',coach:'AI Coach',arena:'Arena',news:'News',help:'Help',language:'Choose your language',demo:'Demo mode: real orders, payments and diamond delivery are not connected.',unknown:'Send /help for the command list.',shopInfo:'Diamond and pass catalogue.',coachInfo:'Build, counter-pick and meta advice — currently a demo.',arenaInfo:'Tournaments and teams — demo section.',newsInfo:'Patch and hero updates — demo content.',appInfo:'All sections in one app.',start:'Start'},
};
export function getWebAppUrl(tab?:string,language:Language='uz') {
 const url=new URL(process.env.TELEGRAM_WEBAPP_URL || DEFAULT_WEBAPP_URL);
 if(url.protocol!=='https:')throw new Error('Invalid Mini App URL');
 url.searchParams.set('lang',language);if(tab)url.searchParams.set('tab',tab);
 return url.toString();
}
export function isValidSecret(received:string|null) {
 const expected=process.env.TELEGRAM_WEBHOOK_SECRET;if(!expected||!received)return false;
 const a=Buffer.from(received),b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);
}
export function parseCommand(input?:string) {
 if(!input?.startsWith('/'))return null;
 const [raw]=input.trim().split(/\s+/);const [command,mention]=raw.slice(1).split('@');
 return mention&&mention.toLowerCase()!=='vaynexobot'?null:command.toLowerCase();
}
function escapeHtml(s:string){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function openButton(label:string,tab:string|undefined,language:Language,isPrivate:boolean):Button {
 const url=getWebAppUrl(tab,language);return isPrivate?{text:label,web_app:{url}}:{text:label,url};
}
function languageButtons():Button[]{return [{text:'O‘zbekcha',callback_data:'lang:uz'},{text:'Русский',callback_data:'lang:ru'},{text:'English',callback_data:'lang:en'}];}
export function commandList(language:Language){const t=text[language];return [{command:'start',description:t.start},{command:'app',description:t.open},{command:'shop',description:t.shop},{command:'coach',description:t.coach},{command:'arena',description:t.arena},{command:'news',description:t.news},{command:'language',description:t.language},{command:'help',description:t.help}];}
export function buildReply(command:string|null,firstName:string|undefined,isPrivate:boolean,language:Language='uz'):BotReply|null {
 const t=text[language];const name=escapeHtml(firstName?.slice(0,64)||t.player);
 if(command==='language')return {text:t.language,reply_markup:{inline_keyboard:[languageButtons()]}};
 if(command==='help')return {text:`<b>${t.help}</b>\n\n${commandList(language).map(c=>`/${c.command} — ${c.description}`).join('\n')}`};
 if(command==='start')return {text:`<b>${t.welcome}</b>, ${name}!\n\n${t.intro}\n\n• <b>${t.shop}</b> — ${t.shopInfo}\n• <b>${t.coach}</b> — ${t.coachInfo}\n• <b>${t.arena}</b> — ${t.arenaInfo}\n• <b>${t.news}</b> — ${t.newsInfo}\n\n<i>${t.demo}</i>`,reply_markup:{inline_keyboard:[[openButton(t.open,undefined,language,isPrivate)],[openButton(t.shop,'shop',language,isPrivate),openButton(t.coach,'coach',language,isPrivate)],...(isPrivate?[languageButtons()]:[]) ]}};
 const sections:Record<string,{title:string;info:string;tab?:string}>={app:{title:t.open,info:t.appInfo},shop:{title:t.shop,info:t.shopInfo,tab:'shop'},coach:{title:t.coach,info:t.coachInfo,tab:'coach'},arena:{title:t.arena,info:t.arenaInfo,tab:'tournaments'},news:{title:t.news,info:t.newsInfo,tab:'news'}};
 const section=command?sections[command]:undefined;
 if(section)return {text:`<b>${section.title}</b>\n${section.info}\n\n<i>${t.demo}</i>`,reply_markup:{inline_keyboard:[[openButton(t.open,section.tab,language,isPrivate)]]}};
 return isPrivate?{text:t.unknown}:null;
}
export async function telegramCall<T=unknown>(method:string,body:unknown):Promise<T> {
 const token=process.env.TELEGRAM_BOT_TOKEN;if(!token)throw new Error('Telegram unavailable');
 let response;try {response=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});}catch{throw new Error('Telegram network error');}
 const data=await response.json().catch(()=>null);
 if(!response.ok||data?.ok!==true)throw new Error(`Telegram request failed (${response.status})`);
 return data.result as T;
}
export async function getSavedLanguage(chatId:number,fallback?:string):Promise<Language> {
 const menu=await telegramCall<{type:string;web_app?:{url:string}}>('getChatMenuButton',{chat_id:chatId});
 if(menu.type==='web_app'&&menu.web_app){try{const url=new URL(menu.web_app.url);const expected=new URL(getWebAppUrl());const language=url.searchParams.get('lang');if(url.origin===expected.origin&&isLanguage(language))return language;}catch{}}
 return normalizeLanguage(fallback);
}
export async function saveLanguage(chatId:number,language:Language) {
 await telegramCall('setMyCommands',{scope:{type:'chat',chat_id:chatId},commands:commandList(language)});
 await telegramCall('setChatMenuButton',{chat_id:chatId,menu_button:{type:'web_app',text:text[language].open,web_app:{url:getWebAppUrl(undefined,language)}}});
}
export async function sendMessage(chatId:number,reply:BotReply){return telegramCall('sendMessage',{chat_id:chatId,...reply,parse_mode:'HTML',link_preview_options:{is_disabled:true}});}
