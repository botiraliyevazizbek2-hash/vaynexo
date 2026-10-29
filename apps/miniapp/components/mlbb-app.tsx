'use client';
import { AIChat } from './ai/ai-chat';
import { SectionAdvertisement } from './home/section-advertisement';
import { HomePage } from './home/home-page';
import { ServicePage } from './home/service-page';
import { useLiveCatalog } from './shop/use-live-catalog';
import { useTelegramAccount, type AccountState } from './registration/use-telegram-account';
import { PhoneSettings } from './registration/phone-settings';
import { PricingPanel } from './admin/pricing-panel';
import { useI18n } from './language-provider';
import { ShopPage } from './shop/shop-page';
import { OrdersPage } from './shop/orders-page';
import { useDemoShop } from './shop/use-demo-shop';
import type { Language } from '../lib/i18n/core';
import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowDownLeft, ArrowRight, Bell, BookOpen, Bot, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Clock3, Copy, Crown, Diamond, Flame, Gamepad2, Gift, Headphones, History, Home, Info, Languages, Menu, Newspaper, Plus, Send, Settings, Shield, ShieldCheck, Sparkles, Star, Swords, Ticket, Trophy, UserRound, Users, X, Zap } from 'lucide-react';
type Tab = 'home' | 'shop' | 'coach' | 'news' | 'tournaments' | 'profile' | 'order' | 'admin' | 'marketplace' | 'boost' | 'rental' | 'telegram';
function useTelegramWebApp() {
    useEffect(() => {
        const tg = (window as Window & {
            Telegram?: {
                WebApp?: {
                    ready?: () => void;
                    expand?: () => void;
                    setHeaderColor?: (color: string) => void;
                    setBackgroundColor?: (color: string) => void;
                };
            };
        }).Telegram?.WebApp;
        tg?.ready?.();
        tg?.expand?.();
        tg?.setHeaderColor?.('#080d1b');
        tg?.setBackgroundColor?.('#080d1b');
    }, []);
}
function App({phoneAvailable=false}:{phoneAvailable?:boolean}) {
    const account=useTelegramAccount();
    const { t, language, setLanguage, syncFailed } = useI18n();
    useTelegramWebApp();
    const [tab, setTab] = useState<Tab>('home');
    const [profileDash, setProfileDash] = useState(false);
    const [profileReveal, setProfileReveal] = useState(false);
    const transitionLock = useRef(false);
    const transitionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const dashReady = useRef(false);
    useEffect(() => {
        const image = new Image();
        image.onload = () => { dashReady.current = true; };
        image.src = '/effects/gusion-kof-dash.webp';
        return () => {
            image.onload = null;
            transitionTimers.current.forEach(clearTimeout);
        };
    }, []);
    const navigate = (next: Tab) => {
        if (transitionLock.current || next === tab) return;
        if (next !== 'profile' || !dashReady.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setTab(next);
            return;
        }
        transitionLock.current = true;
        setProfileDash(true);
        transitionTimers.current = [
            setTimeout(() => { setTab(next); setProfileReveal(true); window.scrollTo({top: 0, behavior: 'instant'}); }, 360),
            setTimeout(() => { setProfileDash(false); setProfileReveal(false); transitionLock.current = false; }, 980),
        ];
    };
    const catalog = useLiveCatalog();
    const shop = useDemoShop(catalog.regionProducts);
    const { userId, serverId } = shop;
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState('');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    useEffect(() => {
        const requested = new URLSearchParams(window.location.search).get('tab');
        const deepLinkTabs: Tab[] = ['home', 'shop', 'coach', 'news', 'tournaments', 'profile', 'order', 'admin', 'marketplace', 'boost', 'rental', 'telegram'];
        if (requested && deepLinkTabs.includes(requested as Tab))
            setTab(requested as Tab);
    }, []);
    useEffect(() => {
        if (!toast)
            return;
        const timer = window.setTimeout(() => setToast(''), 2600);
        return () => window.clearTimeout(timer);
    }, [toast]);
    const notify = (message: string) => setToast(message);
    const goToShop = () => navigate('shop');
    const copyId = async () => {
        if (!userId || !serverId) { notify('Avval do‘konda MLBB ID va serverni kiriting.'); return; }
        try {
            await navigator.clipboard.writeText(`${userId} (${serverId})`);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1700);
        }
        catch {
            notify(`ID: ${userId} (${serverId})`);
        }
    };
    const navItems: {
        id: Tab;
        label: string;
        icon: typeof Home;
    }[] = [
        { id: 'home', label: 'Asosiy', icon: Home },
        { id: 'shop', label: 'Do‘kon', icon: Diamond },
        { id: 'coach', label: 'AI', icon: Bot },
        { id: 'news', label: 'Yangiliklar', icon: Flame },
        { id: 'profile', label: 'Profil', icon: UserRound },
    ];
    const currentTitle: Record<Tab, string> = {
        marketplace:'Akkaunt savdosi',boost:'Boost xizmati',rental:'Akkauntlar ijarasi',telegram:'Telegram xizmatlari',admin: 'Katalog va ustama', home: 'VAYNEXO', shop: 'Do‘kon & Olmoslar', coach: 'Sun’iy intellekt', news: 'Yangiliklar', tournaments: 'Turnirlar & Jamoalar', profile: 'Profil', order: 'Buyurtma holati',
    };
    return (<div className="app-shell">
      {profileDash && <div className="vx-dash" aria-hidden="true"><div className="vx-trail"/><div className="vx-knife"/><div className="vx-runner"><img src="/effects/gusion-kof-dash.webp" alt="" decoding="async"/></div></div>}
      <aside className="desktop-sidebar">
        <div className="brand-lockup"><div className="brand-mark v-brand-mark"><img src="/vaynexo-logo-square.svg" alt=""/></div><div><b>VAYNEXO</b><small>{t("O\u2018yinchilar markazi")}</small></div></div>
        <div className="sidebar-label">{t("MENYU")}</div>
        <nav className="side-nav">
          {navItems.map((item) => <button key={item.id} className={`side-link ${tab === item.id ? 'active' : ''}`} onClick={() => { navigate(item.id); }}><item.icon size={18}/><span>{t(item.label)}</span>{item.id === 'shop' && <i className="nav-dot"/>}</button>)}
          <button className={`side-link ${tab === 'tournaments' ? 'active' : ''}`} onClick={() => navigate('tournaments')}><Trophy size={18}/><span>{t("Turnirlar")}</span><span className="side-tag">{t("LIVE")}</span></button>
          <button className={`side-link ${tab === 'order' ? 'active' : ''}`} onClick={() => navigate('order')}><ClipboardList size={18}/><span>{t("Buyurtmalar")}</span></button>
        </nav>
        <div className="sidebar-spacer"/>
        <div className="help-card"><div className="help-icon"><Headphones size={19}/></div><b>{t("Yordam kerakmi?")}</b><p>{t("Operatorimiz sizga yordam beradi.")}</p><button className="button secondary small" onClick={() => notify('Demo: operator chat integratsiyasi keyin ulanadi.')}>{t("Yordam olish") + " "}<ArrowRight size={14}/></button></div>
        <button className="v-sidebar-account" onClick={()=>navigate('profile')}><UserRound size={19}/><span><b>{account.user?.firstName||t('Profil')}</b><small>{account.user?.username?'@'+account.user.username:t('Shaxsiy kabinet')}</small></span><ChevronRight size={16}/></button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title"><button className="mobile-menu icon-button" aria-label={t("Menyu")} onClick={() => setShowMobileMenu(!showMobileMenu)}>{showMobileMenu ? <X size={20}/> : <Menu size={20}/>}</button><div className="brand-mark mini-mark"><Gamepad2 size={17}/></div><div><h1>{t(currentTitle[tab])}</h1><p><span className="status-dot"/>{" " + t('Raqamli xizmatlar platformasi')}</p></div></div>
          <div className="topbar-actions"><select aria-label={t("Ilova tili")} value={language} onChange={e => setLanguage(e.target.value as Language)}><option value="uz">UZ</option><option value="ru">RU</option><option value="en">EN</option></select><button className="icon-button notification-button" aria-label={t("Bildirishnomalar")} onClick={() => notify('Hozircha yangi bildirishnoma yo‘q.')}><Bell size={18}/><i /></button></div>
        </header>

        {showMobileMenu && <div className="mobile-menu-panel">{navItems.map((item) => <button key={item.id} onClick={() => { navigate(item.id); setShowMobileMenu(false); }}><item.icon size={17}/>{t(item.label)}</button>)}<button onClick={() => { navigate('tournaments'); setShowMobileMenu(false); }}><Trophy size={17}/>{t("Turnirlar")}</button><button onClick={() => {navigate('order');setShowMobileMenu(false);}}><ClipboardList size={17}/>{t("Buyurtmalar")}</button></div>}

        {syncFailed && <div role="status" className="disclaimer">{t("Til sinxronlanmadi. Qayta urinib ko‘ring.")}</div>}<div className={`page-content${profileReveal ? ' vx-reveal' : ''}`} aria-busy={profileDash}>
          {tab === 'admin' && <PricingPanel/>}
          {(tab==='marketplace'||tab==='boost'||tab==='rental'||tab==='telegram')&&<ServicePage service={tab} onBack={()=>navigate('home')}/>}
          {tab === 'home' && <HomePage onNavigate={navigate}/>}
          {tab === 'shop' && <ShopPage catalog={catalog} shop={shop} onOrders={() => navigate('order')}/>}
          <div hidden={tab!=='coach'}><AIChat/></div>
          {tab === 'news' && <NewsPage notify={notify}/>}
          {tab === 'tournaments' && <TournamentsPage/>}
          {tab === 'profile' && <ProfilePage account={account} phoneAvailable={phoneAvailable} userId={userId} serverId={serverId} copyId={copyId} copied={copied} notify={notify}/>}
          {tab === 'order' && <OrdersPage shop={shop} onShop={goToShop}/>}
        </div>
        {tab!=='coach'&&<footer className="app-footer"><div className="footer-logo"><div className="brand-mark mini-mark"><Gamepad2 size={15}/></div><b>{"VAYNEXO"}</b></div><span>{t('O‘yinlar va raqamli xizmatlar')}</span><button onClick={() => notify('Maxfiylik va foydalanish shartlari backend ishga tushishidan oldin qo‘shiladi.')}><ShieldCheck size={14}/>{" " + t("Xavfsizlik")}</button></footer>}
      </main>

      <nav className="bottom-nav" aria-label={t("Asosiy navigatsiya")}>
        <div className="bottom-nav-group">
          {navItems.filter(item => ['home', 'shop', 'profile'].includes(item.id)).map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} aria-current={tab === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><item.icon size={20}/><span>{t(item.label)}</span></button>)}
        </div>
        <button className={`bottom-nav-ai ${tab === 'coach' ? 'active' : ''}`} aria-current={tab === 'coach' ? 'page' : undefined} onClick={() => navigate('coach')}><Bot size={21}/><span>{t('AI')}</span></button>
      </nav>
      {toast && <div className="toast" role="status"><Info size={17}/><span>{t(toast)}</span><button onClick={() => setToast('')} aria-label={t("Yopish")}><X size={15}/></button></div>}
    </div>);
}
function SectionTitle({ icon: Icon, title, aside, onAside }: {
    icon: typeof Home;
    title: string;
    aside?: string;
    onAside?: () => void;
}) {
    const { t } = useI18n();
    return <div className="section-title"><div className="section-title-main"><Icon size={18}/><h2>{t(title)}</h2></div>{aside && <button onClick={onAside}>{t(aside)}<ArrowRight size={14}/></button>}</div>;
}
function NewsPage({ notify }: {
    notify: (msg: string) => void;
}) {
    const { t } = useI18n();
    const [filter, setFilter] = useState('Barchasi');
    const news = [
        { tag: 'PATCH', color: 'cyan', title: 'Patch yangiliklari', desc: 'Qahramonlar, buyumlar va balans o‘zgarishlarini bir joyda kuzating.', date: 'Rasmiy manba ulanganidan keyin yangilanadi', art: 'patch' },
        { tag: 'GUIDE', color: 'purple', title: 'Rank uchun foydali qo‘llanma', desc: 'Draft paytida tarkibni muvozanatlashtirish va rol tanlash bo‘yicha tavsiyalar.', date: 'Tahririyat materiali', art: 'guide' },
        { tag: 'EVENT', color: 'gold', title: 'MLBB eventlar taqvimi', desc: 'Tadbirlar va muddatlarni tekshirilgan manbalar asosida kuzatish.', date: 'Kalendar integratsiyasi rejalashtirilgan', art: 'event' },
        { tag: 'ESPORTS', color: 'blue', title: 'Mahalliy MLBB hamjamiyati', desc: 'Jamoalar, turnir e’lonlari va musobaqa natijalarini kuzating.', date: 'Hamjamiyat bo‘limi', art: 'esports' },
    ];
    const filtered = news.filter(n => filter === 'Barchasi' || n.tag.toLowerCase() === filter.toLowerCase());
    return <div className="content-stack news-page"><SectionAdvertisement section="news"/>
    <div className="category-pills news-filters" id="news-feed">{['Barchasi', 'Patch', 'Event', 'Guide', 'Esports'].map(f => <button key={f} className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)}>{t(f)}</button>)}</div><div className="news-grid">{filtered.map((item, i) => <article className="news-card" key={item.tag}><div className={`news-thumb ${item.art}`}><span className={`tag-pill ${item.color}-tag`}>{t(item.tag)}</span><div className="news-thumb-icon">{item.art === 'patch' ? <Swords size={27}/> : item.art === 'guide' ? <BookOpen size={27}/> : item.art === 'event' ? <CalendarDays size={27}/> : <Trophy size={27}/>}</div><span className="news-thumb-number">{t("0")}{i + 1}</span></div><div className="news-card-body"><span className="news-date"><Clock3 size={12}/>{t(item.date)}</span><h3>{t(item.title)}</h3><p>{t(item.desc)}</p><button onClick={() => notify('Bu material demo ko‘rinishida. Kontent boshqaruv tizimi keyin ulanadi.')}>{t("Batafsil") + " "}<ArrowRight size={14}/></button></div></article>)}</div>
  </div>;
}
function TournamentsPage(){
 const {t}=useI18n();const [section,setSection]=useState('Turnirlar');
 return <div className="content-stack arena-page"><SectionAdvertisement section="tournaments"/><div className="segmented-tabs" id="arena-tabs">{['Turnirlar','Jamoalar','Reyting'].map(s=><button key={s} className={section===s?'selected':''} onClick={()=>setSection(s)}>{s==='Turnirlar'?<Trophy size={15}/>:s==='Jamoalar'?<Users size={15}/>:<Activity size={15}/>} {t(s)}</button>)}</div><div className="empty-state compact-empty"><div className="empty-icon">{section==='Turnirlar'?<CalendarDays size={24}/>:section==='Jamoalar'?<Users size={24}/>:<Trophy size={24}/>}</div><h3>{t(section==='Turnirlar'?'Hozircha turnirlar yo‘q':section==='Jamoalar'?'Jamoalar hali qo‘shilmagan':'Reyting tayyorlanmoqda')}</h3><p>{t('Yangiliklar shu bo‘limda e’lon qilinadi.')}</p></div></div>;
}
function ProfilePage({ userId, serverId, copyId, copied, notify, account, phoneAvailable }: {
    account: AccountState;
    phoneAvailable: boolean;
    userId: string;
    serverId: string;
    copyId: () => void;
    copied: boolean;
    notify: (msg: string) => void;
}) {
    const { t, language, setLanguage } = useI18n();
    const [notifications, setNotifications] = useState(true);
    const displayName=account.user?[account.user.firstName,account.user.lastName].filter(Boolean).join(' ')||account.user.username||t('Telegram foydalanuvchisi'):t('Mehmon');
    return <div className="content-stack profile-page">
    <section className="profile-hero profile-identity"><div className="profile-avatar-wrap"><div className="profile-avatar">{account.photoUrl?<img src={account.photoUrl} alt={t('Telegram profil rasmi')} onError={account.onPhotoError} referrerPolicy="no-referrer"/>:<UserRound size={38} aria-label={t('Profil rasmi yo‘q')}/>}</div></div><div className="profile-main"><div className="profile-name-line"><h3>{displayName}</h3></div>{account.user&&<><div className="rank-line">{account.user.username?'@'+account.user.username:'Telegram'}</div><div className="player-id-line">Telegram ID: {account.user.telegramId}</div></>}{userId&&<div className="player-id-line">MLBB ID: {userId} ({serverId})<button onClick={copyId} aria-label={t('ID ni nusxalash')}><Copy size={13}/></button>{copied&&<small>{t('Nusxalandi')}</small>}</div>}</div></section>
    {account.status==='error'&&<div className="disclaimer" role="status">{t('Profilni saqlab bo‘lmadi. Qayta urinib ko‘ring.')}<button className="button secondary small" onClick={account.retry}>{t('Qayta tekshirish')}</button></div>}
    <PhoneSettings available={phoneAvailable}/>

    <SectionTitle icon={Settings} title={t("Ilova sozlamalari")}/><div className="settings-card"><div className="setting-row"><div className="setting-icon"><Bell size={17}/></div><div className="setting-copy"><b>{t("Telegram bildirishnomalari")}</b><small>{t("Yangiliklar va buyurtma xabarlari")}</small></div><button className={`toggle ${notifications ? 'on' : ''}`} onClick={() => setNotifications(!notifications)} aria-label={t("Bildirishnomalarni almashtirish")}><span /></button></div><div className="setting-row"><div className="setting-icon"><Languages size={17}/></div><div className="setting-copy"><b>{t("Ilova tili")}</b><small>{t("Hozirgi sozlama")}</small></div><select value={language} onChange={e => setLanguage(e.target.value as Language)} aria-label={t("Ilova tili")}><option value="uz">{t("O\u2018zbekcha (Lotin)")}</option><option value="ru">{t("\u0420\u0443\u0441\u0441\u043A\u0438\u0439")}</option><option value="en">{t("English")}</option></select></div><div className="setting-row"><div className="setting-icon"><Shield size={17}/></div><div className="setting-copy"><b>{t("Ma\u2019lumotlar himoyasi")}</b><small>{t("Maxfiylik sozlamalari va shartlar")}</small></div><button className="plain-link" onClick={() => notify('Maxfiylik hujjati ishlab chiqish bosqichida.')}>{t("Ko\u2018rish") + " "}<ChevronRight size={15}/></button></div><div className="setting-row"><div className="setting-icon"><Headphones size={17}/></div><div className="setting-copy"><b>{t("24/7 qo\u2018llab-quvvatlash")}</b><small>{t("Telegram operatori")}</small></div><button className="plain-link" onClick={() => notify('Telegram operatori hali ulanmagan.')}>{t("Yordam") + " "}<ChevronRight size={15}/></button></div></div>

  </div>;
}
export default App;
