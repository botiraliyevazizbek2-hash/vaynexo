export type HomeDestination='shop'|'marketplace'|'boost'|'rental'|'telegram'|'coach';
export type PendingService='marketplace'|'boost'|'rental'|'telegram';
export const homeServices: {id:HomeDestination;title:string;description:string;tag:string;tone:string;keywords:string}[]=[
 {id:'shop',title:'Mobile Legends',description:'Olmoslar va passlar',tag:'MLBB',tone:'cyan',keywords:'mlbb diamond diamonds pass olmos'},
 {id:'marketplace',title:'Akkaunt savdosi',description:'Sotib olish va sotish',tag:'MARKET',tone:'blue',keywords:'account buy sell akkaunt savdo'},
 {id:'boost',title:'Boost xizmati',description:'Rank ko‘tarish',tag:'RANK',tone:'violet',keywords:'boost rank рейтинг'},
 {id:'rental',title:'Akkauntlar ijarasi',description:'Vaqtincha foydalanish',tag:'RENT',tone:'teal',keywords:'rent rental ijara аккаунт'},
 {id:'telegram',title:'Telegram xizmatlari',description:'Telegram Stars va Premium',tag:'TELEGRAM',tone:'azure',keywords:'telegram stars premium yulduz obuna'},
 {id:'coach',title:'Sun’iy intellekt',description:'AI xizmatlari',tag:'AI',tone:'indigo',keywords:'ai artificial intelligence gpt coach suniy murabbiy интеллект'},
];
// Replace copy, artwork, destination and badge here when a real campaign is ready.
// No discounts or delivery guarantees are invented by the homepage.
export const homeBanners:[{id:string;badge:string;title:string;description:string;action:string;destination:HomeDestination;tone:string},...{id:string;badge:string;title:string;description:string;action:string;destination:HomeDestination;tone:string}[]]=[
 {id:'mlbb',badge:'MOBILE LEGENDS',title:'O‘yiningizga yangi kuch.',description:'Olmoslar va passlarni bitta katalogda ko‘ring.',action:'Katalogni ochish',destination:'shop',tone:'diamonds'},
 {id:'telegram',badge:'TEZ KUNDA',title:'Telegram imkoniyatlari.',description:'Stars va Premium — VAYNEXO’da.',action:'Xizmatlarni ko‘rish',destination:'telegram',tone:'telegram'},
 {id:'ai',badge:'AI YORDAMCHI',title:'Yangi fikr. Yangi strategiya.',description:'MLBB bo‘yicha AI murabbiy bilan tanishing.',action:'Bo‘limni ochish',destination:'coach',tone:'intelligence'},
];
