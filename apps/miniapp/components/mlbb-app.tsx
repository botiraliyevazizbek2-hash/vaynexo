'use client';
import { useI18n } from './language-provider';
import type { Language } from '../lib/i18n/core';
import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownLeft, ArrowLeft, ArrowRight, Bell, BookOpen, Bot, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Clock3, Copy, Crown, Diamond, ExternalLink, Flame, Gamepad2, Gift, Headphones, History, Home, Info, Languages, LockKeyhole, Menu, MessageCircle, Minus, Newspaper, Plus, Search, Send, Settings, Shield, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Star, Swords, Ticket, Trophy, UserRound, Users, Wallet, X, Zap, } from 'lucide-react';
const heroBanner = '/images/hero-banner.jpg';
type Tab = 'home' | 'shop' | 'coach' | 'news' | 'tournaments' | 'profile' | 'order';
type Product = {
    id: string;
    title: string;
    subtitle: string;
    diamonds: string;
    price: number;
    oldPrice?: number;
    badge?: string;
    icon: 'diamond' | 'ticket' | 'crown';
};
const products: Product[] = [
    { id: 'd56', title: '56 Olmos', subtitle: 'Tezkor to‘ldirish', diamonds: '56', price: 14000, badge: 'Mashhur', icon: 'diamond' },
    { id: 'd172', title: '172 Olmos', subtitle: 'Bonusli paket', diamonds: '172', price: 39000, oldPrice: 42000, badge: '-7%', icon: 'diamond' },
    { id: 'd278', title: '278 + 28 Olmos', subtitle: 'Qo‘shimcha bonus', diamonds: '306', price: 69000, badge: 'Foydali', icon: 'diamond' },
    { id: 'd568', title: '568 + 56 Olmos', subtitle: 'Ko‘proq olmos', diamonds: '624', price: 139000, icon: 'diamond' },
    { id: 'weekly', title: 'Weekly Diamond Pass', subtitle: 'Haftalik olmos va sovrinlar', diamonds: 'Pass', price: 24000, oldPrice: 29000, badge: 'Tejamkor', icon: 'ticket' },
    { id: 'starlight', title: 'Starlight Pass', subtitle: 'Oylik eksklyuziv mukofotlar', diamonds: 'Pass', price: 78000, icon: 'crown' },
];
const formatPrice = (price: number) => `${price.toLocaleString('en-US').replace(/,/g, ' ')} UZS`;
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
function App() {
    const { t, language, setLanguage, syncFailed } = useI18n();
    useTelegramWebApp();
    const [tab, setTab] = useState<Tab>('home');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [userId, setUserId] = useState('842190334');
    const [serverId, setServerId] = useState('5143');
    const [idVerified, setIdVerified] = useState(false);
    const [demoOrderNumber, setDemoOrderNumber] = useState('');
    const [payment, setPayment] = useState('click');
    const [quantity, setQuantity] = useState(1);
    const [orderCreated, setOrderCreated] = useState(false);
    const [search, setSearch] = useState('');
    const [coachQuestion, setCoachQuestion] = useState('');
    const [coachReplyQuestion, setCoachReplyQuestion] = useState('');
    const coachReply = coachReplyQuestion ? t('Savolingiz: “{question}”\n\nDemo yordamchi tavsiyasi: avval tanlagan rolingizni aniqlang, joriy patchga mos builddan foydalaning va raqib tarkibiga qarab counter tanlang. Bu javob hozircha demo; aniq statistika va patch manbalari AI backend ulanganda qo‘shiladi.', { question: coachReplyQuestion }) : t('Salom! Men MLBB bo‘yicha yordamchingizman. Qahramon, build, emblem yoki counter haqida so‘rashingiz mumkin.');
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState('');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    useEffect(() => {
        const requested = new URLSearchParams(window.location.search).get('tab');
        const deepLinkTabs: Tab[] = ['home', 'shop', 'coach', 'news', 'tournaments', 'profile'];
        if (requested && deepLinkTabs.includes(requested as Tab))
            setTab(requested as Tab);
    }, []);
    const visibleProducts = useMemo(() => products.filter((p) => `${t(p.title)} ${t(p.subtitle)}`.toLowerCase().includes(search.toLowerCase())), [search, language]);
    useEffect(() => {
        if (!toast)
            return;
        const timer = window.setTimeout(() => setToast(''), 2600);
        return () => window.clearTimeout(timer);
    }, [toast]);
    const notify = (message: string) => setToast(message);
    const goToShop = () => { setSelectedProduct(null); setOrderCreated(false); setDemoOrderNumber(''); setTab('shop'); };
    const buyProduct = (product: Product) => {
        setSelectedProduct(product);
        setQuantity(1);
        setIdVerified(false);
        setOrderCreated(false);
        setDemoOrderNumber('');
        setTab('shop');
        window.setTimeout(() => document.getElementById('checkout-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };
    const verifyPlayer = () => {
        if (userId.trim().length < 5 || serverId.trim().length < 2) {
            notify('MLBB ID va Server ID ni tekshirib kiriting.');
            setIdVerified(false);
            return;
        }
        setIdVerified(true);
        notify('Demo tekshiruv muvaffaqiyatli. Haqiqiy nik backend/API ulanganda tekshiriladi.');
    };
    const placeDemoOrder = () => {
        if (!selectedProduct)
            return;
        if (!idVerified) {
            notify('Davom etishdan oldin MLBB ID ni tekshiring.');
            return;
        }
        setDemoOrderNumber(`DEMO-ML-${Math.floor(100000 + Math.random() * 900000)}`);
        setOrderCreated(true);
        setTab('order');
        notify('Demo buyurtma yaratildi. Haqiqiy to‘lov ulanmagan.');
    };
    // The demo ID confirmation becomes invalid whenever either ID changes.
    const updateUserId = (value: string) => { setUserId(value); setIdVerified(false); };
    const updateServerId = (value: string) => { setServerId(value); setIdVerified(false); };
    const copyId = async () => {
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
        home: 'MLBB Uz', shop: 'Do‘kon & Olmoslar', coach: 'AI Murabbiy', news: 'Yangiliklar', tournaments: 'Turnirlar & Jamoalar', profile: 'Profil', order: 'Buyurtma holati',
    };
    return (<div className="app-shell">
      <aside className="desktop-sidebar">
        <div className="brand-lockup"><div className="brand-mark"><Gamepad2 size={22}/></div><div><b>{t("MLBB") + " "}<span>{t("UZ")}</span></b><small>{t("O\u2018yinchilar markazi")}</small></div></div>
        <div className="sidebar-label">{t("MENYU")}</div>
        <nav className="side-nav">
          {navItems.map((item) => <button key={item.id} className={`side-link ${tab === item.id ? 'active' : ''}`} onClick={() => { setTab(item.id); setSelectedProduct(null); }}><item.icon size={18}/><span>{t(item.label)}</span>{item.id === 'shop' && <i className="nav-dot"/>}</button>)}
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
          <div className="topbar-actions"><select aria-label={t("Ilova tili")} value={language} onChange={e => setLanguage(e.target.value as Language)}><option value="uz">UZ</option><option value="ru">RU</option><option value="en">EN</option></select><div className="online-pill"><span className="status-dot"/>{" " + t("Moonton API:") + " "}<b>{t("demo rejim")}</b></div><button className="icon-button notification-button" aria-label={t("Bildirishnomalar")} onClick={() => notify('Hozircha yangi bildirishnoma yo‘q.')}><Bell size={18}/><i /></button><button className="top-avatar" aria-label={t("Profilga o\u2018tish")} onClick={() => setTab('profile')}>{t("S")}</button></div>
        </header>

        {showMobileMenu && <div className="mobile-menu-panel">{navItems.map((item) => <button key={item.id} onClick={() => { setTab(item.id); setShowMobileMenu(false); }}><item.icon size={17}/>{t(item.label)}</button>)}<button onClick={() => { setTab('tournaments'); setShowMobileMenu(false); }}><Trophy size={17}/>{t("Turnirlar")}</button></div>}

        {syncFailed && <div role="status" className="disclaimer">{t("Til sinxronlanmadi. Qayta urinib ko‘ring.")}</div>}<div className="page-content">
          {tab === 'home' && <HomePage goToShop={goToShop} setTab={setTab} buyProduct={buyProduct} notify={notify}/>}
          {tab === 'shop' && <ShopPage products={visibleProducts} search={search} setSearch={setSearch} selectedProduct={selectedProduct} buyProduct={buyProduct} userId={userId} setUserId={updateUserId} serverId={serverId} setServerId={updateServerId} idVerified={idVerified} verifyPlayer={verifyPlayer} payment={payment} setPayment={setPayment} quantity={quantity} setQuantity={setQuantity} placeDemoOrder={placeDemoOrder}/>}
          {tab === 'coach' && <CoachPage question={coachQuestion} setQuestion={setCoachQuestion} reply={coachReply} submit={submitCoach} notify={notify}/>}
          {tab === 'news' && <NewsPage notify={notify}/>}
          {tab === 'tournaments' && <TournamentsPage notify={notify}/>}
          {tab === 'profile' && <ProfilePage userId={userId} serverId={serverId} copyId={copyId} copied={copied} setTab={setTab} notify={notify}/>}
          {tab === 'order' && <OrderPage orderNumber={demoOrderNumber} orderCreated={orderCreated} selectedProduct={selectedProduct} quantity={quantity} payment={payment} userId={userId} serverId={serverId} setTab={setTab} goToShop={goToShop}/>}
        </div>
        <footer className="app-footer"><div className="footer-logo"><div className="brand-mark mini-mark"><Gamepad2 size={15}/></div><b>{t("MLBB UZ")}</b></div><span>{t("Hamjamiyat konsepti \u00B7 Demo ma\u2019lumotlar")}</span><button onClick={() => notify('Maxfiylik va foydalanish shartlari backend ishga tushishidan oldin qo‘shiladi.')}><ShieldCheck size={14}/>{" " + t("Xavfsizlik")}</button></footer>
      </main>

      <nav className="bottom-nav" aria-label={t("Asosiy navigatsiya")}>
        {navItems.map((item) => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); if (item.id !== 'shop')
        setSelectedProduct(null); }}><item.icon size={19}/><span>{t(item.label)}</span></button>)}
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
function HomePage({ goToShop, setTab, buyProduct, notify }: {
    goToShop: () => void;
    setTab: (tab: Tab) => void;
    buyProduct: (p: Product) => void;
    notify: (msg: string) => void;
}) {
    const { t } = useI18n();
    const featured = products[4];
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
    <div className="product-row">
      <ProductCard product={featured} onBuy={() => buyProduct(featured)} featured/>
      <ProductCard product={products[0]} onBuy={() => buyProduct(products[0])}/>
      <ProductCard product={products[2]} onBuy={() => buyProduct(products[2])}/>
    </div>

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
function ProductCard({ product, onBuy, featured = false }: {
    product: Product;
    onBuy: () => void;
    featured?: boolean;
}) {
    const { t } = useI18n();
    const Icon = product.icon === 'ticket' ? Ticket : product.icon === 'crown' ? Crown : Diamond;
    return <article className={`product-card ${featured ? 'product-featured' : ''}`}><div className="product-card-top"><div className="product-icon"><Icon size={23}/></div>{product.badge && <span className="product-badge">{t(product.badge)}</span>}</div><h3>{t(product.title)}</h3><p>{t(product.subtitle)}</p><div className="product-price">{formatPrice(product.price)}</div>{product.oldPrice && <div className="old-price">{formatPrice(product.oldPrice)}</div>}<button className="button primary full" onClick={onBuy}><ShoppingCart size={15}/>{" " + t("Sotib olish")}</button></article>;
}
function TrustItem({ icon: Icon, title, desc }: {
    icon: typeof Home;
    title: string;
    desc: string;
}) {
    const { t } = useI18n();
    return <div className="trust-item"><div className="trust-icon"><Icon size={17}/></div><div><b>{t(title)}</b><p>{t(desc)}</p></div></div>;
}
function ShopPage({ products: shownProducts, search, setSearch, selectedProduct, buyProduct, userId, setUserId, serverId, setServerId, idVerified, verifyPlayer, payment, setPayment, quantity, setQuantity, placeDemoOrder }: {
    products: Product[];
    search: string;
    setSearch: (s: string) => void;
    selectedProduct: Product | null;
    buyProduct: (p: Product) => void;
    userId: string;
    setUserId: (s: string) => void;
    serverId: string;
    setServerId: (s: string) => void;
    idVerified: boolean;
    verifyPlayer: () => void;
    payment: string;
    setPayment: (s: string) => void;
    quantity: number;
    setQuantity: (n: number) => void;
    placeDemoOrder: () => void;
}) {
    const { t } = useI18n();
    const [category, setCategory] = useState('all');
    const filtered = shownProducts.filter(p => category === 'all' || (category === 'diamonds' ? p.icon === 'diamond' : category === 'passes' ? p.icon !== 'diamond' : p.badge === 'Mashhur'));
    return <div className="content-stack">
    <div className="page-intro"><div><div className="eyebrow small-eyebrow"><Diamond size={13}/>{" " + t("MLBB TOP-UP")}</div><h2>{t("Do\u2018kon & Olmoslar")}</h2><p>{t("Kerakli mahsulotni tanlang, ma\u2019lumotlarni tasdiqlang.")}</p></div><div className="secure-chip"><ShieldCheck size={15}/>{" " + t("Tekshiriladigan jarayon")}</div></div>
    <div className="shop-promo"><div className="promo-symbol"><Diamond size={26}/><Sparkles size={15}/></div><div><span className="mini-label">{t("MLBB UZ STORE")}</span><h3>{t("Sevimli skinlaringizga")}<br />{t("yaqinroq bo\u2018ling.")}</h3><p>{t("Mahsulotlar va narxlar \u2014 demo ma\u2019lumotlar.")}</p></div><div className="promo-decoration"><div className="promo-orb orb-one"/><div className="promo-orb orb-two"/><Diamond size={62}/></div></div>
    <div className="filter-toolbar"><div className="category-pills"><button className={category === 'all' ? 'selected' : ''} onClick={() => setCategory('all')}>{t("Barchasi")}</button><button className={category === 'diamonds' ? 'selected' : ''} onClick={() => setCategory('diamonds')}>{t("Olmoslar")}</button><button className={category === 'passes' ? 'selected' : ''} onClick={() => setCategory('passes')}>{t("Passlar")}</button><button className={category === 'popular' ? 'selected' : ''} onClick={() => setCategory('popular')}>{t("Top")}</button></div><label className="search-box"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Mahsulot qidirish...")}/></label></div>
    <div className="shop-layout"><div className="shop-products"><div className="catalog-meta"><span>{filtered.length}{" " + t("ta mahsulot")}</span><span><span className="status-dot"/>{" " + t("Demo katalog")}</span></div><div className="catalog-grid">{filtered.map(p => <ProductCard key={p.id} product={p} onBuy={() => buyProduct(p)}/>)}</div><div className="disclaimer"><Info size={15}/><span>{t("Ko\u2018rsatilgan paketlar va narxlar sinov uchun. Haqiqiy mahsulotlar ta\u2019minotchi API\u2019si bilan sinxronlanadi.")}</span></div></div>
      <aside className="checkout-card" id="checkout-card"><div className="checkout-header"><div><span className="step-label">{t("BUYURTMA")}</span><h3>{selectedProduct ? t("Xaridni davom ettirish") : t("Mahsulot tanlang")}</h3></div><div className="checkout-lock"><LockKeyhole size={18}/></div></div>
        {selectedProduct ? <><div className="selected-product"><div className="selected-product-icon"><Diamond size={23}/></div><div className="selected-product-name"><b>{t(selectedProduct.title)}</b><small>{t(selectedProduct.subtitle)}</small></div><div className="quantity-control"><button aria-label={t("Kamaytirish")} onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={12}/></button><b>{quantity}</b><button aria-label={t("Ko\u2018paytirish")} onClick={() => setQuantity(Math.min(10, quantity + 1))}><Plus size={12}/></button></div></div>
        <div className="form-section"><label htmlFor="mlbb-id">{t("MLBB User ID")}</label><input id="mlbb-id" value={userId} onChange={e => { setUserId(e.target.value.replace(/\D/g, '').slice(0, 20)); }} placeholder={t("Masalan: 123456789")} inputMode="numeric"/><label htmlFor="server-id">{t("Server ID (Zone ID)")}</label><input id="server-id" value={serverId} onChange={e => { setServerId(e.target.value.replace(/\D/g, '').slice(0, 8)); }} placeholder={t("Masalan: 5143")} inputMode="numeric"/><button className={`button ${idVerified ? 'success' : 'secondary'} full verify-button`} onClick={verifyPlayer}>{idVerified ? <CheckCircle2 size={16}/> : <ShieldCheck size={16}/>} {idVerified ? t("ID kiritildi \u00B7 demo") : t("ID ni tekshirish")}</button><div className="field-note"><Info size={13}/>{" " + t("Hozircha haqiqiy o\u2018yin nikini tekshirish ulangan emas.")}</div></div>
        <div className="form-section payment-section"><label>{t("To\u2018lov usuli") + " "}<span>{t("Demo")}</span></label><button className={`payment-option ${payment === 'click' ? 'chosen' : ''}`} onClick={() => setPayment('click')}><span className="pay-brand click-brand">{t("C")}</span><span><b>{t("Click")}</b><small>{t("Demo tanlov")}</small></span>{payment === 'click' && <CheckCircle2 size={17}/>}</button><button className={`payment-option ${payment === 'payme' ? 'chosen' : ''}`} onClick={() => setPayment('payme')}><span className="pay-brand payme-brand">{t("P")}</span><span><b>{t("Payme")}</b><small>{t("Demo tanlov")}</small></span>{payment === 'payme' && <CheckCircle2 size={17}/>}</button><button className={`payment-option ${payment === 'stars' ? 'chosen' : ''}`} onClick={() => setPayment('stars')}><span className="pay-brand stars-brand">{t("\u2605")}</span><span><b>{t("Telegram Stars")}</b><small>{t("Telegram raqamli savdo oqimi")}</small></span>{payment === 'stars' && <CheckCircle2 size={17}/>}</button></div>
        <div className="checkout-total"><span>{t("Jami summa")}</span><b>{formatPrice(selectedProduct.price * quantity)}</b></div><button className="button primary full pay-button" onClick={placeDemoOrder}>{t("Demo buyurtma yaratish") + " "}<ArrowRight size={16}/></button><p className="checkout-footnote"><ShieldCheck size={13}/>{" " + t("Haqiqiy to\u2018lov amalga oshirilmaydi.")}</p></> : <div className="empty-checkout"><div className="empty-icon"><ShoppingBag size={24}/></div><b>{t("Mahsulot tanlanmagan")}</b><p>{t("Katalogdan mahsulot tanlang. Keyin MLBB ID, server va buyurtma tafsilotlarini kiriting.")}</p><div className="empty-steps"><span><i>{t("1")}</i>{" " + t("Paket tanlang")}</span><span><i>{t("2")}</i>{" " + t("ID kiriting")}</span><span><i>{t("3")}</i>{" " + t("Tasdiqlang")}</span></div></div>}
      </aside></div>
  </div>;
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
function ProfilePage({ userId, serverId, copyId, copied, setTab, notify }: {
    userId: string;
    serverId: string;
    copyId: () => void;
    copied: boolean;
    setTab: (tab: Tab) => void;
    notify: (msg: string) => void;
}) {
    const { t, language, setLanguage } = useI18n();
    const [notifications, setNotifications] = useState(true);
    return <div className="content-stack"><div className="page-intro"><div><div className="eyebrow small-eyebrow"><UserRound size={13}/>{" " + t("SHAXSIY KABINET")}</div><h2>{t("Mening profilim")}</h2><p>{t("Profil, buyurtmalar va ilova sozlamalari.")}</p></div><button className="icon-button" onClick={() => notify('Sozlamalar shu oynada boshqariladi.')}><Settings size={17}/></button></div>
    <section className="profile-hero"><div className="profile-avatar-wrap"><div className="profile-avatar">{t("S")}</div><span className="avatar-status"/></div><div className="profile-main"><div className="profile-name-line"><h3>{t("Shadow_7")}</h3><span className="verified-badge"><Check size={11}/></span><span className="country-badge">{t("UZBEKISTAN")}</span></div><div className="player-id-line">{t("ID:") + " "}{userId} <span>{t("(")}{serverId}{t(")")}</span><button onClick={copyId} aria-label={t("ID ni nusxalash")}><Copy size={13}/></button>{copied && <small>{t("Nusxalandi")}</small>}</div><div className="rank-line"><Crown size={15}/>{" " + t("Mythic Immortal") + " "}<span>{t("\u00B7")}</span> <Star size={13}/>{" " + t("68")}</div></div><div className="profile-edit"><button className="button secondary small" onClick={() => notify('Profilni MLBB API orqali tasdiqlash hali ulanmagan.')}><Settings size={14}/>{" " + t("Sozlash")}</button></div></section>
    <div className="profile-stat-grid"><ProfileStat icon={Activity} title={t("G\u2018alaba (WR)")} value="68.4%" foot={t("Demo statistika")} color="cyan"/><ProfileStat icon={CalendarDays} title={t("Weekly Pass")} value="4 kun" foot={t("Namuna muddat")} color="gold"/><ProfileStat icon={ShieldCheck} title={t("MLBB API")} value="Ulanmagan" foot={t("Integratsiya kutilmoqda")} color="purple"/></div>
    <div className="profile-wallet-grid"><div className="wallet-card diamonds-wallet"><div><span>{t("Olmoslar")}</span><Diamond size={17}/></div><b>{t("125") + " "}<small>{t("DM")}</small></b><small>{t("Demo balans")}</small><button className="button cyan-button full" onClick={() => setTab('shop')}><Plus size={15}/>{" " + t("To\u2018ldirish")}</button></div><div className="wallet-card cashback-wallet"><div><span>{t("Bonuslar")}</span><Gift size={17}/></div><b>{t("14 500") + " "}<small>{t("UZS")}</small></b><small>{t("Namuna bonus balansi")}</small><button className="button amber-button full" onClick={() => notify('Bonus ishlatish qoidalari hali sozlanmagan.')}><Ticket size={15}/>{" " + t("Ishlatish")}</button></div></div>
    <SectionTitle icon={Star} title={t("Sevimli qahramonlar")} aside={t("Tahrirlash")} onAside={() => notify('Qahramonlar ro‘yxati keyingi bosqichda ulanadi.')}/><div className="hero-favorites"><FavoriteHero name={t("Gusion")} role={t("Qotil \u00B7 Assassin")} win="69%" tone="hero-purple"/><FavoriteHero name={t("Fanny")} role={t("Qotil \u00B7 Assassin")} win="64%" tone="hero-blue"/><FavoriteHero name={t("Chou")} role={t("Jangchi \u00B7 Fighter")} win="71%" tone="hero-gold"/></div>
    <SectionTitle icon={History} title={t("Xaridlar tarixi")} aside={t("Barchasi")} onAside={() => setTab('order')}/><div className="history-list"><HistoryRow icon={CalendarDays} name={t("Weekly Diamond Pass")} date="Demo yozuv · 14:52" price="24 000 UZS" state={t("Demo")}/><HistoryRow icon={Diamond} name={t("278 + 28 Olmos")} date="Demo yozuv · 19:10" price="69 000 UZS" state={t("Demo")}/><HistoryRow icon={Sparkles} name={t("Starlight Pass")} date="Demo yozuv · 11:05" price="78 000 UZS" state={t("Demo")}/></div>
    <SectionTitle icon={Settings} title={t("Ilova sozlamalari")}/><div className="settings-card"><div className="setting-row"><div className="setting-icon"><Bell size={17}/></div><div className="setting-copy"><b>{t("Telegram bildirishnomalari")}</b><small>{t("Yangiliklar va buyurtma xabarlari")}</small></div><button className={`toggle ${notifications ? 'on' : ''}`} onClick={() => setNotifications(!notifications)} aria-label={t("Bildirishnomalarni almashtirish")}><span /></button></div><div className="setting-row"><div className="setting-icon"><Languages size={17}/></div><div className="setting-copy"><b>{t("Ilova tili")}</b><small>{t("Hozirgi sozlama")}</small></div><select value={language} onChange={e => setLanguage(e.target.value as Language)} aria-label={t("Ilova tili")}><option value="uz">{t("O\u2018zbekcha (Lotin)")}</option><option value="ru">{t("\u0420\u0443\u0441\u0441\u043A\u0438\u0439")}</option><option value="en">{t("English")}</option></select></div><div className="setting-row"><div className="setting-icon"><Shield size={17}/></div><div className="setting-copy"><b>{t("Ma\u2019lumotlar himoyasi")}</b><small>{t("Maxfiylik sozlamalari va shartlar")}</small></div><button className="plain-link" onClick={() => notify('Maxfiylik hujjati ishlab chiqish bosqichida.')}>{t("Ko\u2018rish") + " "}<ChevronRight size={15}/></button></div><div className="setting-row"><div className="setting-icon"><Headphones size={17}/></div><div className="setting-copy"><b>{t("24/7 qo\u2018llab-quvvatlash")}</b><small>{t("Telegram operatori")}</small></div><button className="plain-link" onClick={() => notify('Telegram operatori hali ulanmagan.')}>{t("Yordam") + " "}<ChevronRight size={15}/></button></div></div>
    <button className="button danger-outline full logout-button" onClick={() => notify('Demo rejim: haqiqiy akkaunt ulanishi amalga oshirilmagan.')}><ArrowDownLeft size={16}/>{" " + t("Boshqa MLBB hisobga o\u2018tish")}</button>
  </div>;
}
function ProfileStat({ icon: Icon, title, value, foot, color }: {
    icon: typeof Home;
    title: string;
    value: string;
    foot: string;
    color: string;
}) { const { t } = useI18n(); return <div className="profile-stat"><div className={`profile-stat-icon ${color}`}><Icon size={15}/><span>{t(title)}</span></div><b>{t(value)}</b><small>{t(foot)}</small></div>; }
function FavoriteHero({ name, role, win, tone }: {
    name: string;
    role: string;
    win: string;
    tone: string;
}) { const { t } = useI18n(); return <div className="favorite-card"><div className={`hero-portrait ${tone}`}><span>{name.slice(0, 1)}</span><Sparkles size={18}/></div><b>{t(name)}</b><small>{t(role)}</small><div className="hero-win"><span>{win}{" " + t("WR")}</span><span className="win-track"><i style={{ width: win }}/></span></div><small className="muted-match">{t("Namuna statistika")}</small></div>; }
function HistoryRow({ icon: Icon, name, date, price, state }: {
    icon: typeof Home;
    name: string;
    date: string;
    price: string;
    state: string;
}) { const { t } = useI18n(); return <div className="history-row"><div className="history-icon"><Icon size={18}/></div><div className="history-main"><b>{t(name)}</b><small>{t(date)}</small></div><div className="history-right"><b>{price}</b><small><CheckCircle2 size={12}/>{t(state)}</small></div></div>; }
function OrderPage({ orderNumber, orderCreated, selectedProduct, quantity, payment, userId, serverId, setTab, goToShop }: {
    orderNumber: string;
    orderCreated: boolean;
    selectedProduct: Product | null;
    quantity: number;
    payment: string;
    userId: string;
    serverId: string;
    setTab: (tab: Tab) => void;
    goToShop: () => void;
}) {
    const { t } = useI18n();
    return <div className="content-stack"><div className="page-intro"><div><div className="eyebrow small-eyebrow"><ClipboardList size={13}/>{" " + t("ORDER TRACKING")}</div><h2>{t("Buyurtma holati")}</h2><p>{t("Buyurtma jarayoni va tafsilotlari.")}</p></div><span className="demo-badge">{t("DEMO")}</span></div>
    {orderCreated && selectedProduct ? <div className="order-detail-layout"><section className="order-main-card"><div className="order-success"><div className="success-mark"><Check size={28}/></div><div><h3>{t("Demo buyurtma yaratildi")}</h3><p>{t("Bu buyurtma faqat interfeysni sinash uchun. To\u2018lov ham, yetkazish ham amalga oshirilmadi.")}</p></div></div><div className="order-reference"><span>{t("Buyurtma raqami")}</span><b>{orderNumber}</b></div><div className="order-timeline"><TimelineItem active done title={t("Buyurtma yaratildi")} desc={t("Demo buyurtma mahalliy interfeysda yaratildi.")}/><TimelineItem active title={t("To\u2018lov kutilmoqda")} desc={t("Haqiqiy to\u2018lov provayderi ulanmagan.")}/><TimelineItem title={t("Yetkazilmoqda")} desc={t("Yetkazib beruvchi adapteri ulanmagan.")}/><TimelineItem title={t("Bajarildi")} desc={t("Haqiqiy tasdiq kelgandagina bajarilgan deb ko\u2018rsatiladi.")}/></div><button className="button secondary full" onClick={() => setTab('profile')}><History size={15}/>{" " + t("Profil va buyurtmalar")}</button></section><aside className="order-summary-card"><h3>{t("Buyurtma tafsilotlari")}</h3><div className="summary-product"><div className="selected-product-icon"><Diamond size={22}/></div><div><b>{t(selectedProduct.title)}</b><small>{t(selectedProduct.subtitle)}</small></div></div><div className="summary-line"><span>{t("Miqdor")}</span><b>{quantity}{" " + t("\u00D7")}</b></div><div className="summary-line"><span>{t("MLBB User ID")}</span><b>{userId}</b></div><div className="summary-line"><span>{t("Server ID")}</span><b>{serverId}</b></div><div className="summary-line"><span>{t("To\u2018lov usuli")}</span><b>{payment.toUpperCase()}</b></div><div className="summary-line total-line"><span>{t("Jami")}</span><b>{formatPrice(selectedProduct.price * quantity)}</b></div><div className="disclaimer"><Info size={14}/><span>{t("Demo ma\u2019lumot. Backend ulanmaguncha buyurtma saqlanmaydi.")}</span></div></aside></div> : <div className="empty-state order-empty"><div className="empty-icon"><ClipboardList size={27}/></div><h3>{t("Hozircha buyurtma tanlanmagan")}</h3><p>{t("Do\u2018kondan paket tanlang. Sinov buyurtmasini yaratganingizdan keyin bu yerda jarayon ko\u2018rinadi.")}</p><button className="button primary" onClick={goToShop}>{t("Do\u2018konga o\u2018tish") + " "}<ArrowRight size={15}/></button></div>}
  </div>;
}
function TimelineItem({ active = false, done = false, title, desc }: {
    active?: boolean;
    done?: boolean;
    title: string;
    desc: string;
}) { const { t } = useI18n(); return <div className={`timeline-item ${active ? 'active' : ''} ${done ? 'done' : ''}`}><div className="timeline-marker">{done ? <Check size={13}/> : active ? <span /> : null}</div><div><b>{t(title)}</b><p>{t(desc)}</p></div></div>; }
export default App;
