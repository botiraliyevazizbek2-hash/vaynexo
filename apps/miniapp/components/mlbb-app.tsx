'use client';
import { useLiveCatalog, type LiveCatalog } from './shop/use-live-catalog';
import { useTelegramAccount, type AccountState } from './registration/use-telegram-account';
import { PhoneSettings } from './registration/phone-settings';
import { PricingPanel } from './admin/pricing-panel';
import { useI18n } from './language-provider';
import { formatPrice, type Product } from '../lib/shop/catalog';
import { ShopPage } from './shop/shop-page';
import { OrdersPage } from './shop/orders-page';
import { ProductCard } from './shop/product-card';
import { useDemoShop } from './shop/use-demo-shop';
import type { Language } from '../lib/i18n/core';
import { useEffect, useState } from 'react';
import { Activity, ArrowDownLeft, ArrowRight, Bell, BookOpen, Bot, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Clock3, Copy, Crown, Diamond, Flame, Gamepad2, Gift, Headphones, History, Home, Info, Languages, Menu, Newspaper, Plus, Send, Settings, Shield, ShieldCheck, Sparkles, Star, Swords, Ticket, Trophy, UserRound, Users, X, Zap } from 'lucide-react';
const heroBanner = '/images/hero-banner.jpg';
type Tab = 'home' | 'shop' | 'coach' | 'news' | 'tournaments' | 'profile' | 'order' | 'admin';
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
    const catalog = useLiveCatalog();
    const shop = useDemoShop(catalog.regionProducts);
    const { userId, serverId } = shop;
    const [coachQuestion, setCoachQuestion] = useState('');
    const [coachReplyQuestion, setCoachReplyQuestion] = useState('');
    const coachReply = coachReplyQuestion ? t('Savolingiz: “{question}”\n\nDemo yordamchi tavsiyasi: avval tanlagan rolingizni aniqlang, joriy patchga mos builddan foydalaning va raqib tarkibiga qarab counter tanlang. Bu javob hozircha demo; aniq statistika va patch manbalari AI backend ulanganda qo‘shiladi.', { question: coachReplyQuestion }) : t('Salom! Men MLBB bo‘yicha yordamchingizman. Qahramon, build, emblem yoki counter haqida so‘rashingiz mumkin.');
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState('');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    useEffect(() => {
        const requested = new URLSearchParams(window.location.search).get('tab');
        const deepLinkTabs: Tab[] = ['home', 'shop', 'coach', 'news', 'tournaments', 'profile', 'order', 'admin'];
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
    const goToShop = () => setTab('shop');
    const buyProduct = (product: Product) => { shop.buyProduct(product); setTab('shop'); };
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
    const submitCoach = () => {
        if (!coachQuestion.trim())
            return;
        const q = coachQuestion.trim();
        setCoachReplyQuestion(q);
        setCoachQuestion('');
    };
    const navItems: {
        id: Tab;
        label: string;
        icon: typeof Home;
    }[] = [
        { id: 'home', label: 'Asosiy', icon: Home },
        { id: 'shop', label: 'Do‘kon', icon: Diamond },
        { id: 'coach', label: 'AI Murabbiy', icon: Bot },
        { id: 'news', label: 'Yangiliklar', icon: Flame },
        { id: 'profile', label: 'Profil', icon: UserRound },
    ];
    const currentTitle: Record<Tab, string> = {
        admin: 'Katalog va ustama', home: 'MLBB Uz', shop: 'Do‘kon & Olmoslar', coach: 'AI Murabbiy', news: 'Yangiliklar', tournaments: 'Turnirlar & Jamoalar', profile: 'Profil', order: 'Buyurtma holati',
    };
    return (<div className="app-shell">
      <aside className="desktop-sidebar">
        <div className="brand-lockup"><div className="brand-mark"><Gamepad2 size={22}/></div><div><b>{t("MLBB") + " "}<span>{t("UZ")}</span></b><small>{t("O\u2018yinchilar markazi")}</small></div></div>
        <div className="sidebar-label">{t("MENYU")}</div>
        <nav className="side-nav">
          {navItems.map((item) => <button key={item.id} className={`side-link ${tab === item.id ? 'active' : ''}`} onClick={() => { setTab(item.id); }}><item.icon size={18}/><span>{t(item.label)}</span>{item.id === 'shop' && <i className="nav-dot"/>}</button>)}
          <button className={`side-link ${tab === 'tournaments' ? 'active' : ''}`} onClick={() => setTab('tournaments')}><Trophy size={18}/><span>{t("Turnirlar")}</span><span className="side-tag">{t("LIVE")}</span></button>
          <button className={`side-link ${tab === 'order' ? 'active' : ''}`} onClick={() => setTab('order')}><ClipboardList size={18}/><span>{t("Buyurtmalar")}</span></button>
        </nav>
        <div className="sidebar-spacer"/>
        <div className="help-card"><div className="help-icon"><Headphones size={19}/></div><b>{t("Yordam kerakmi?")}</b><p>{t("Operatorimiz sizga yordam beradi.")}</p><button className="button secondary small" onClick={() => notify('Demo: operator chat integratsiyasi keyin ulanadi.')}>{t("Yordam olish") + " "}<ArrowRight size={14}/></button></div>
        <div className="sidebar-user"><div className="avatar avatar-small">{t("S")}</div><div><b>{t("Shadow_7")}</b><small>{t("Mythic Immortal")}</small></div><button className="icon-button mini" aria-label={t("Profil")} onClick={() => setTab('profile')}><ChevronDown size={16}/></button></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title"><button className="mobile-menu icon-button" aria-label={t("Menyu")} onClick={() => setShowMobileMenu(!showMobileMenu)}>{showMobileMenu ? <X size={20}/> : <Menu size={20}/>}</button><div className="brand-mark mini-mark"><Gamepad2 size={17}/></div><div><h1>{t(currentTitle[tab])}</h1><p><span className="status-dot"/>{" " + t("O\u2018zbekiston MLBB hamjamiyati")}</p></div></div>
          <div className="topbar-actions"><select aria-label={t("Ilova tili")} value={language} onChange={e => setLanguage(e.target.value as Language)}><option value="uz">UZ</option><option value="ru">RU</option><option value="en">EN</option></select><div className="online-pill"><span className="status-dot"/>{" " + t("Moonton API:") + " "}<b>{t("demo rejim")}</b></div><button className="icon-button notification-button" aria-label={t("Bildirishnomalar")} onClick={() => notify('Hozircha yangi bildirishnoma yo‘q.')}><Bell size={18}/><i /></button></div>
        </header>

        {showMobileMenu && <div className="mobile-menu-panel">{navItems.map((item) => <button key={item.id} onClick={() => { setTab(item.id); setShowMobileMenu(false); }}><item.icon size={17}/>{t(item.label)}</button>)}<button onClick={() => { setTab('tournaments'); setShowMobileMenu(false); }}><Trophy size={17}/>{t("Turnirlar")}</button><button onClick={() => {setTab('order');setShowMobileMenu(false);}}><ClipboardList size={17}/>{t("Buyurtmalar")}</button></div>}

        {syncFailed && <div role="status" className="disclaimer">{t("Til sinxronlanmadi. Qayta urinib ko‘ring.")}</div>}<div className="page-content">
          {tab === 'admin' && <PricingPanel/>}
          {tab === 'home' && <HomePage catalog={catalog} goToShop={goToShop} setTab={setTab} buyProduct={buyProduct} notify={notify}/>}
          {tab === 'shop' && <ShopPage catalog={catalog} shop={shop} onOrders={() => setTab('order')}/>}
          {tab === 'coach' && <CoachPage question={coachQuestion} setQuestion={setCoachQuestion} reply={coachReply} submit={submitCoach} notify={notify}/>}
          {tab === 'news' && <NewsPage notify={notify}/>}
          {tab === 'tournaments' && <TournamentsPage notify={notify}/>}
          {tab === 'profile' && <ProfilePage account={account} phoneAvailable={phoneAvailable} userId={userId} serverId={serverId} copyId={copyId} copied={copied} notify={notify}/>}
          {tab === 'order' && <OrdersPage shop={shop} onShop={goToShop}/>}
        </div>
        <footer className="app-footer"><div className="footer-logo"><div className="brand-mark mini-mark"><Gamepad2 size={15}/></div><b>{t("MLBB UZ")}</b></div><span>{t("Hamjamiyat konsepti \u00B7 Demo ma\u2019lumotlar")}</span><button onClick={() => notify('Maxfiylik va foydalanish shartlari backend ishga tushishidan oldin qo‘shiladi.')}><ShieldCheck size={14}/>{" " + t("Xavfsizlik")}</button></footer>
      </main>

      <nav className="bottom-nav" aria-label={t("Asosiy navigatsiya")}>
        {navItems.map((item) => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); }}><item.icon size={19}/><span>{t(item.label)}</span></button>)}
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
function HomePage({ goToShop, setTab, buyProduct, notify, catalog }: {
    catalog: LiveCatalog;
    goToShop: () => void;
    setTab: (tab: Tab) => void;
    buyProduct: (p: Product) => void;
    notify: (msg: string) => void;
}) {
    const { t } = useI18n();
    const featured = [...catalog.regionProducts].sort((a,b)=>a.price-b.price).slice(0,3);
    return <>
    <section className="hero-card">
      <div className="hero-copy"><div className="eyebrow"><Zap size={13} fill="currentColor"/>{" " + t("MLBB UZ COMMUNITY") + " "}<span className="eyebrow-line"/></div><h2>{t("MLBB O\u2018zbekiston")}<br /><span>{t("hamjamiyatiga")}</span><br />{t("xush kelibsiz!")}</h2><p>{t("Olmoslar, AI murabbiy, turnirlar va jamoalar \u2014 barchasi bitta joyda.")}</p><div className="hero-actions"><button className="button primary" onClick={goToShop}>{t("Do\u2018konga o\u2018tish") + " "}<ArrowRight size={16}/></button><button className="button ghost" onClick={() => setTab('tournaments')}><Trophy size={16}/>{" " + t("Turnirlar")}</button></div><div className="hero-proof"><span><ShieldCheck size={14}/>{" " + t("Xavfsiz jarayon")}</span><span><Zap size={14}/>{" " + t("Tezkor yordam")}</span></div></div>
      <div className="hero-art" style={{ backgroundImage: `linear-gradient(90deg, rgba(9,14,31,.2), rgba(9,14,31,.02)), url(${heroBanner})` }}><div className="hero-art-top"><span className="live-tag"><i />{" " + t("MLBB UZ")}</span><span className="rank-chip"><Crown size={13}/>{" " + t("MYTHIC")}</span></div><div className="hero-art-bottom"><div className="hero-diamond"><Diamond size={22}/></div><div><b>{t("Yangi mavsum")}</b><small>{t("Yangi maqsadlar sari")}</small></div><Sparkles size={19} className="sparkle"/></div></div>
      <div className="hero-glow"/>
    </section>

    <section className="stats-strip">
      <div className="stat-player"><div className="avatar avatar-blue">{t("S")}</div><div><small>{t("So\u2018nggi o\u2018yinchi")}</small><b>{t("Shadow_7") + " "}<span className="verified">{t("\u2713")}</span></b><small>{t("ID: 84219\u2022\u2022\u2022") + " "}<span className="tiny-server">{t("(5143)")}</span></small></div></div>
      <div className="stat-mini"><span className="stat-icon cyan"><Diamond size={17}/></span><div><small>{t("Namuna balans")}</small><b>{t("125") + " "}<small>{t("olmos")}</small></b></div></div>
      <div className="stat-mini"><span className="stat-icon purple"><Trophy size={17}/></span><div><small>{t("Hamjamiyat")}</small><b>{t("MLBB Uz")}</b></div></div>
    </section>

    <SectionTitle icon={Gamepad2} title={t("Asosiy bo\u2018limlar")} aside={t("Barchasi")} onAside={() => setTab('shop')}/>
    <div className="feature-grid">
      <FeatureCard icon={Diamond} tone="cyan" label={t("Do\u2018kon & Olmoslar")} desc={t("Weekly Pass, Twilight va olmos paketlari")} badge="TOP" onClick={goToShop}/>
      <FeatureCard icon={Bot} tone="purple" label={t("AI Murabbiy")} desc={t("Build, counter-pick va meta bo\u2018yicha maslahat")} badge="AI" onClick={() => setTab('coach')}/>
      <FeatureCard icon={Trophy} tone="gold" label={t("Turnirlar")} desc={t("MLBB musobaqalari va jamoalar")} badge="UZ" onClick={() => setTab('tournaments')}/>
      <FeatureCard icon={Newspaper} tone="blue" label={t("Yangiliklar")} desc={t("Patch o\u2018zgarishlari va yangi qahramonlar")} badge="NEWS" onClick={() => setTab('news')}/>
      <FeatureCard icon={Users} tone="violet" label={t("Jamoalar")} desc={t("Jamoalar va o\u2018yinchilar hamjamiyati")} badge="UZB" onClick={() => setTab('tournaments')}/>
      <FeatureCard icon={UserRound} tone="slate" label={t("Profilim")} desc={t("Buyurtmalar, sozlamalar va tarix")} badge="ME" onClick={() => setTab('profile')}/>
    </div>

    <SectionTitle icon={Flame} title={t("Hozir trendda")} aside={t("Do\u2018konga o\u2018tish")} onAside={goToShop}/>
    <div className="product-row">{featured.map((product,index)=><ProductCard key={product.id} product={product} onBuy={()=>buyProduct(product)} featured={index===0}/>)}</div>
    {catalog.status==='loading'&&<p className="disclaimer" role="status">{t('Yuklanmoqda...')}</p>}
    {catalog.status!=='loading'&&!featured.length&&<p className="disclaimer">{t(catalog.status==='awaiting_pricing'?'Admin ustama foizi va kursni belgilagach paketlar chiqadi.':'Katalog vaqtincha mavjud emas. Keyinroq qayta urinib ko‘ring.')}</p>}

    <section className="trust-panel"><div className="trust-heading"><div className="trust-shield"><ShieldCheck size={20}/></div><div><h3>{t("Ishonch va xavfsizlik")}</h3><p>{t("Xarid jarayoni tushunarli va kuzatiladigan bo\u2018lishi kerak.")}</p></div><span className="demo-badge">{t("DEMO")}</span></div><div className="trust-items"><TrustItem icon={Shield} title={t("ID tekshiruvi")} desc={t("Xariddan oldin ma\u2019lumotni tekshirish oqimi")}/><TrustItem icon={Zap} title={t("Buyurtma kuzatuvi")} desc={t("Holat va xatolar ochiq ko\u2018rsatiladi")}/><TrustItem icon={Headphones} title={t("Yordam xizmati")} desc={t("Muammo bo\u2018lsa, operatorga murojaat")}/></div><div className="payment-footnote"><span>{t("To\u2018lov usullari demo maketi:")}</span><div className="payment-logos"><b>{t("CLICK")}</b><b>{t("Payme")}</b><b>{t("UZCARD")}</b></div></div></section>
  </>;
}
function FeatureCard({ icon: Icon, tone, label, desc, badge, onClick }: {
    icon: typeof Home;
    tone: string;
    label: string;
    desc: string;
    badge: string;
    onClick: () => void;
}) {
    const { t } = useI18n();
    return <button className="feature-card" onClick={onClick}><div className={`feature-icon ${tone}`}><Icon size={21}/></div><span className={`feature-badge ${tone}`}>{t(badge)}</span><h3>{t(label)}</h3><p>{t(desc)}</p><span className="feature-arrow"><ArrowRight size={15}/></span></button>;
}
function TrustItem({ icon: Icon, title, desc }: {
    icon: typeof Home;
    title: string;
    desc: string;
}) {
    const { t } = useI18n();
    return <div className="trust-item"><div className="trust-icon"><Icon size={17}/></div><div><b>{t(title)}</b><p>{t(desc)}</p></div></div>;
}
function CoachPage({ question, setQuestion, reply, submit, notify }: {
    question: string;
    setQuestion: (s: string) => void;
    reply: string;
    submit: () => void;
    notify: (msg: string) => void;
}) {
    const { t } = useI18n();
    const [role, setRole] = useState('Jungler');
    const [rank, setRank] = useState('Mythic');
    const suggestions = ['Lylia uchun build', 'Jungle counterlar', 'Solo rank maslahati', 'Emblem tanlash'];
    return <div className="content-stack"><div className="page-intro"><div><div className="eyebrow small-eyebrow"><Sparkles size={13}/>{" " + t("SMART COACH")}</div><h2>{t("AI Murabbiy")}</h2><p>{t("O\u2018zbek tilida o\u2018yin bo\u2018yicha yordam va qo\u2018llanmalar.")}</p></div><span className="ai-status"><span className="status-dot"/>{" " + t("Demo AI")}</span></div>
    <div className="coach-layout"><section className="coach-chat"><div className="chat-header"><div className="ai-orb"><Bot size={23}/><span /></div><div><h3>{t("MLBB Coach")}</h3><p>{t("Qahramonlar \u00B7 Build \u00B7 Macro")}</p></div><span className="available-pill">{t("Sinov")}</span></div><div className="chat-context"><div className="context-chip"><Gamepad2 size={14}/><select value={role} onChange={e => setRole(e.target.value)} aria-label={t("O\u2018yin roli")}><option value="Jungler">{t("Jungler")}</option><option value="Mid Laner">{t("Mid Laner")}</option><option value="Gold Laner">{t("Gold Laner")}</option><option value="Roamer">{t("Roamer")}</option><option value="EXP Laner">{t("EXP Laner")}</option></select><ChevronDown size={12}/></div><div className="context-chip"><Trophy size={14}/><select value={rank} onChange={e => setRank(e.target.value)} aria-label={t("Rank")}><option value="Epic">{t("Epic")}</option><option value="Legend">{t("Legend")}</option><option value="Mythic">{t("Mythic")}</option><option value="Mythical Honor">{t("Mythical Honor")}</option><option value="Mythical Glory">{t("Mythical Glory")}</option><option value="Mythical Immortal">{t("Mythical Immortal")}</option></select><ChevronDown size={12}/></div></div><div className="chat-messages"><div className="message-row"><div className="message-avatar"><Bot size={16}/></div><div className="chat-bubble assistant-bubble"><span className="message-label">{t("MLBB COACH")}</span><p>{t("Salom, o\u2018yinchi! \uD83D\uDC4B Men MLBB bo\u2018yicha yordamchingizman. Qahramonlar, buildlar, counter-pick va rank bo\u2018yicha savollaringizni yozing.")}</p><div className="bubble-meta">{t("Demo yordamchi \u00B7 hozir")}</div></div></div><div className="message-row"><div className="message-avatar"><Bot size={16}/></div><div className="chat-bubble assistant-bubble reply-bubble"><p>{t(reply)}</p><div className="bubble-meta">{t("Manba ulangan emas \u00B7 javobni tekshiring")}</div></div></div></div><div className="suggestion-row">{suggestions.map(s => <button key={s} onClick={() => setQuestion(t(s))}>{t(s)}</button>)}</div><form className="chat-composer" onSubmit={e => { e.preventDefault(); submit(); }}><input value={question} onChange={e => setQuestion(e.target.value)} placeholder={t("Savolingizni yozing...")}/><button type="submit" className="send-button" aria-label={t("Yuborish")}><Send size={17}/></button></form><div className="ai-disclaimer"><ShieldCheck size={13}/>{" " + t("Tavsiyalar hozircha demo. Patch ma\u2019lumotlari va AI API hali ulanmagan.")}</div></section>
      <aside className="coach-side"><div className="side-info-card"><div className="side-info-icon purple"><BookOpen size={19}/></div><h3>{t("Qanday yordam beradi?")}</h3><p>{t("Tanlagan rolingiz va rankingizni hisobga olgan holda savollaringizga yo\u2018naltirilgan javob berish uchun mo\u2018ljallangan.")}</p><div className="mini-divider"/><div className="check-line"><CheckCircle2 size={15}/>{" " + t("Build va emblem tavsiyalari")}</div><div className="check-line"><CheckCircle2 size={15}/>{" " + t("Counter-pick tushuntirishlari")}</div><div className="check-line"><CheckCircle2 size={15}/>{" " + t("Patchga bog\u2018langan maslahatlar")}</div></div><div className="side-info-card meta-card"><div className="meta-top"><Activity size={17}/><span>{t("PATCH HOLATI")}</span></div><h3>{t("Ma\u2019lumot manbasi")}</h3><p>{t("Joriy patch raqami va real statistika backend orqali ulanganda ko\u2018rsatiladi.")}</p><button className="button secondary full" onClick={() => notify('Patch ma’lumotlari integratsiya bosqichida.')}>{t("Holatni ko\u2018rish") + " "}<ArrowRight size={14}/></button></div></aside></div>
  </div>;
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
    return <div className="content-stack"><div className="page-intro"><div><div className="eyebrow small-eyebrow"><Flame size={13}/>{" " + t("YANGI MA\u2019LUMOTLAR")}</div><h2>{t("Yangiliklar & Patch")}</h2><p>{t("MLBB yangiliklari va o\u2018yin bo\u2018yicha foydali kontent.")}</p></div><button className="icon-button" onClick={() => notify('Demo kontent — yangilanish feed’i hali ulanmagan.')}><Activity size={17}/></button></div>
    <div className="news-feature"><div className="news-feature-art"><div className="news-orbit orbit-a"/><div className="news-orbit orbit-b"/><div className="news-gem"><Sparkles size={44}/></div><span className="news-art-label">{t("MLBB UZ INSIGHTS")}</span></div><div className="news-feature-copy"><span className="tag-pill cyan-tag">{t("O\u2018YIN QO\u2018LLANMASI")}</span><h3>{t("Yaxshiroq o\u2018yna.")}<br /><span>{t("Ko\u2018proq o\u2018rgan.")}</span></h3><p>{t("Build, counter va strategiyalarni o\u2018zbek tilida o\u2018rganish uchun yagona markaz.")}</p><button className="button primary" onClick={() => notify('Qo‘llanmalar kontenti bosqichma-bosqich qo‘shiladi.')}>{t("Qo\u2018llanmalarni ko\u2018rish") + " "}<ArrowRight size={15}/></button></div></div>
    <div className="category-pills news-filters">{['Barchasi', 'Patch', 'Event', 'Guide', 'Esports'].map(f => <button key={f} className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)}>{t(f)}</button>)}</div><div className="news-grid">{filtered.map((item, i) => <article className="news-card" key={item.tag}><div className={`news-thumb ${item.art}`}><span className={`tag-pill ${item.color}-tag`}>{t(item.tag)}</span><div className="news-thumb-icon">{item.art === 'patch' ? <Swords size={27}/> : item.art === 'guide' ? <BookOpen size={27}/> : item.art === 'event' ? <CalendarDays size={27}/> : <Trophy size={27}/>}</div><span className="news-thumb-number">{t("0")}{i + 1}</span></div><div className="news-card-body"><span className="news-date"><Clock3 size={12}/>{t(item.date)}</span><h3>{t(item.title)}</h3><p>{t(item.desc)}</p><button onClick={() => notify('Bu material demo ko‘rinishida. Kontent boshqaruv tizimi keyin ulanadi.')}>{t("Batafsil") + " "}<ArrowRight size={14}/></button></div></article>)}</div>
  </div>;
}
function TournamentsPage({ notify }: {
    notify: (msg: string) => void;
}) {
    const { t } = useI18n();
    const [section, setSection] = useState('Turnirlar');
    return <div className="content-stack"><div className="page-intro"><div><div className="eyebrow small-eyebrow"><Trophy size={13}/>{" " + t("MLBB UZ ESPORTS")}</div><h2>{t("Turnirlar & Jamoalar")}</h2><p>{t("Mahalliy musobaqalar, jamoalar va o\u2018yinchilar uchun markaz.")}</p></div><span className="secure-chip"><Users size={14}/>{" " + t("Hamjamiyat")}</span></div>
    <div className="segmented-tabs">{['Turnirlar', 'Jamoalar', 'Reyting'].map(s => <button key={s} className={section === s ? 'selected' : ''} onClick={() => setSection(s)}>{s === 'Turnirlar' ? <Trophy size={15}/> : s === 'Jamoalar' ? <Users size={15}/> : <Activity size={15}/>} {t(s)}</button>)}</div>
    {section === 'Turnirlar' && <><section className="tournament-hero"><div className="tourney-overlay"><span className="tag-pill red-tag"><i />{" " + t("NAMUNA TURNIR")}</span><span className="region-tag"><Activity size={12}/>{" " + t("O\u2018zbekiston")}</span><h3>{t("UZBEKISTAN")}<br /><span>{t("MLBB CUP")}</span></h3><p>{t("Hamjamiyat uchun turnir maketi")}</p><div className="tourney-stats"><div><small>{t("FORMAT")}</small><b>{t("5v5 Draft")}</b></div><div><small>{t("HOLATI")}</small><b className="cyan-text">{t("Rejalashtirilmoqda")}</b></div><div><small>{t("SOVRIN")}</small><b>{t("Keyin e\u2019lon qilinadi")}</b></div></div><button className="button primary" onClick={() => notify('Ro‘yxatdan o‘tish backend va turnir reglamenti tayyor bo‘lganda yoqiladi.')}>{t("Qiziqish bildirish") + " "}<ArrowRight size={15}/></button></div><div className="tourney-art"><div className="trophy-glow"><Trophy size={77}/></div><div className="tourney-ring ring-1"/><div className="tourney-ring ring-2"/></div></section><SectionTitle icon={CalendarDays} title={t("Rejalashtirilgan turnirlar")} aside={t("Barchasi")} onAside={() => notify('Hozircha demo taqvim.')}/><div className="empty-state compact-empty"><div className="empty-icon"><CalendarDays size={24}/></div><h3>{t("Turnir kalendari ulanmagan")}</h3><p>{t("Haqiqiy tadbirlar, sanalar va reglamentlar tekshirilgan manbalardan qo\u2018shiladi.")}</p></div></>}
    {section === 'Jamoalar' && <><div className="team-grid"><TeamCard name={t("Toshkent Cyber Wolves")} initials="TW" rank="Mythic" detail={t("Jamoa profili uchun namuna")} color="blue" onClick={() => notify('Jamoa profillari backendga ulanganidan keyin ochiladi.')}/><TeamCard name={t("Samarqand Titans")} initials="ST" rank="Glory" detail={t("Yangi a\u2019zolarni qidirish \u2014 demo")} color="purple" onClick={() => notify('Jamoa profillari backendga ulanganidan keyin ochiladi.')}/><TeamCard name={t("Buxoro MLBB Club")} initials="BC" rank="Mythic" detail={t("Hamjamiyat jamoasi maketi")} color="gold" onClick={() => notify('Jamoa profillari backendga ulanganidan keyin ochiladi.')}/></div><button className="button secondary full" onClick={() => notify('Jamoa yaratish funksiyasi backendga ulangach ishlaydi.')}><Plus size={16}/>{" " + t("O\u2018z jamoangni yaratish")}</button></>}
    {section === 'Reyting' && <div className="ranking-card"><div className="ranking-heading"><div><h3>{t("O\u2018zbekiston top o\u2018yinchilari")}</h3><p>{t("Reyting interfeysi maketi")}</p></div><span className="demo-badge">{t("DEMO")}</span></div>{[{ n: 1, name: 'Apex_Slayer', rank: 'Mythic Immortal', wr: '76%', matches: '420 o‘yin' }, { n: 2, name: 'TashkentGhost', rank: 'Mythic Immortal', wr: '71%', matches: '389 o‘yin' }, { n: 3, name: 'SamarkandKing', rank: 'Mythic Glory', wr: '68%', matches: '312 o‘yin' }].map(p => <div className="rank-row" key={p.n}><div className={`rank-place place-${p.n}`}>{p.n}</div><div className="avatar rank-avatar">{t(p.name[0])}</div><div className="rank-name"><b>{t(p.name)}</b><small>{t(p.rank)}</small></div><div className="rank-score"><b>{p.wr}{" " + t("WR")}</b><small>{t(p.matches)}</small></div></div>)}<p className="ranking-note"><Info size={14}/>{" " + t("Ko\u2018rsatkichlar uydirma namuna. Haqiqiy reyting ishonchli ma\u2019lumot manbasini talab qiladi.")}</p></div>}
  </div>;
}
function TeamCard({ name, initials, rank, detail, color, onClick }: {
    name: string;
    initials: string;
    rank: string;
    detail: string;
    color: string;
    onClick: () => void;
}) {
    const { t } = useI18n();
    return <button className="team-card" onClick={onClick}><div className={`team-logo ${color}`}>{initials}</div><div className="team-card-main"><b>{t(name)}</b><span><Trophy size={12}/>{rank}</span><small>{t(detail)}</small></div><ChevronRight size={17}/></button>;
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
