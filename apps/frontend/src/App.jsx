import { useEffect, useRef, useState } from "react";
import {
  Diamond,
  Home,
  ShoppingBag,
  ReceiptText,
  UserRound,
  Headphones,
  ArrowUpRight,
  Search,
  ShieldCheck,
  Swords,
  Sparkles,
  Newspaper,
  X,
  ChevronRight,
} from "lucide-react";
import { api, money } from "./api";
import { dictionaries } from "./i18n";
import Admin from "./Admin";
import "./profile-transition.css";

const tabs = [
  ["home", Home],
  ["shop", ShoppingBag],
  ["orders", ReceiptText],
  ["profile", UserRound],
  ["help", Headphones],
];
export default function App() {
  const [dash, setDash] = useState(false);
  const [reveal, setReveal] = useState(false);
  const transitionLock = useRef(false);
  const transitionTimers = useRef([]);
  useEffect(() => () => transitionTimers.current.forEach(clearTimeout), []);
  useEffect(() => { const image = new Image(); image.src = "/effects/gusion-kof-dash.webp"; }, []);
  function navigate(id) {
    if (transitionLock.current || id === tab) return;
    if (id !== "profile" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTab(id); return;
    }
    transitionLock.current = true;
    setDash(true);
    transitionTimers.current = [
      setTimeout(() => { setTab(id); setReveal(true); }, 360),
      setTimeout(() => { setDash(false); setReveal(false); transitionLock.current = false; }, 980),
    ];
  }
  const [lang, setLang] = useState(
    localStorage.getItem("vaynexo-lang") || "uz",
  );
  const t = dictionaries[lang] || dictionaries.uz;
  const [tab, setTab] = useState("home"),
    [token, setToken] = useState(sessionStorage.getItem("vaynexo-token") || "");
  const [config, setConfig] = useState(null),
    [products, setProducts] = useState([]),
    [user, setUser] = useState(null),
    [orders, setOrders] = useState([]),
    [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null),
    [player, setPlayer] = useState(""),
    [zone, setZone] = useState(""),
    [accepted, setAccepted] = useState(false),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const orderKey = useRef(null),
    modalRef = useRef(null);
  function chooseLanguage(value) {
    setLang(value);
    localStorage.setItem("vaynexo-lang", value);
    document.documentElement.lang = value;
  }
  function saveToken(value) {
    setToken(value);
    sessionStorage.setItem("vaynexo-token", value);
  }
  function logout() {
    sessionStorage.removeItem("vaynexo-token");
    setToken("");
    setUser(null);
    setOrders([]);
    setTickets([]);
    setPlayer("");
    setZone("");
  }
  function fail(e) {
    setError(e.status === 403 ? t.forbidden : t[e.message] || t.error);
    if (e.status === 401) logout();
  }
  async function action(fn) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function loadPublic() {
    setLoading(true);
    setError("");
    try {
      const [c, p] = await Promise.all([api("/config"), api("/catalog")]);
      setConfig(c);
      setProducts(p);
    } catch (e) {
      fail(e);
    } finally {
      setLoading(false);
    }
  }
  async function loadOrders() {
    setOrders(await api("/orders", { token }));
  }
  useEffect(() => {
    loadPublic();
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    if (!token) return;
    let active = true;
    api("/me", { token })
      .then((u) => {
        if (active) {
          setUser(u);
          setPlayer(u.player_id);
          setZone(u.zone_id);
          chooseLanguage(u.language);
        }
      })
      .catch((e) => {
        if (active) fail(e);
      });
    return () => {
      active = false;
    };
  }, [token]);
  useEffect(() => {
    if (!token) return;
    let active = true;
    const route =
      tab === "orders" ? "/orders" : tab === "help" ? "/support" : null;
    if (route)
      api(route, { token })
        .then((data) => {
          if (active) (tab === "orders" ? setOrders : setTickets)(data);
        })
        .catch((e) => {
          if (active) fail(e);
        });
    return () => {
      active = false;
    };
  }, [tab, token]);
  useEffect(() => {
    if (selected) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [selected]);
  async function login() {
    await action(async () => {
      const init = window.Telegram?.WebApp?.initData;
      const r = await api(init ? "/auth/telegram" : "/auth/demo", {
        method: "POST",
        body: init ? { init_data: init } : undefined,
      });
      saveToken(r.token);
    });
  }
  function select(p) {
    setSelected(p);
    setAccepted(false);
    orderKey.current = crypto.randomUUID();
    setError("");
  }
  async function create(e) {
    e.preventDefault();
    await action(async () => {
      await api("/orders", {
        token,
        method: "POST",
        key: orderKey.current,
        body: {
          product_id: selected.id,
          player_id: player,
          zone_id: zone,
          expected_price_uzs: selected.price_uzs,
        },
      });
      await loadOrders();
      setSelected(null);
      setTab("orders");
    });
  }
  async function saveProfile(e) {
    e.preventDefault();
    await action(async () => {
      const u = await api("/me", {
        token,
        method: "PUT",
        body: {
          language: lang,
          player_id: player,
          zone_id: zone,
          notifications: user.notifications,
        },
      });
      setUser(u);
      setNotice(t.saved);
    });
  }
  const matching = products.filter(
    (p) =>
      (filter === "all" || p.category === filter) &&
      p.names[lang].toLowerCase().includes(search.toLowerCase()),
  );
  const cards = (list) => (
    <div className="products">
      {list.map((p) => (
        <button
          className={"product " + (p.category === "passes" ? "pass" : "")}
          key={p.id}
          onClick={() => select(p)}
        >
          <div className="product-art">
            <Diamond size={42} strokeWidth={1.3} />
            <span>
              {p.category === "passes" ? "PASS" : p.id.split("-").pop()}
            </span>
          </div>
          <span className="muted small">MOBILE LEGENDS</span>
          <h3>{p.names[lang]}</h3>
          <div className="product-bottom">
            <strong>{money(p.price_uzs, lang)}</strong>
            <span className="round">
              <ArrowUpRight size={18} />
            </span>
          </div>
        </button>
      ))}
    </div>
  );
  if (location.pathname.startsWith("/admin"))
    return <Admin lang={lang} chooseLanguage={chooseLanguage} />;
  return (
    <div className="shell">
      {dash && <div className="vx-dash" aria-hidden="true">
        <div className="vx-trail" /><div className="vx-knife" />
        <div className="vx-runner"><img src="/effects/gusion-kof-dash.webp" alt="" /></div>
      </div>}
      <aside className="sidebar">
        <a className="brand" href="/">
          <Diamond /> VAYNEXO<span>•</span>
        </a>
        <div className="side-caption">MLBB / UZBEKISTAN</div>
        <nav>
          {tabs.map(([id, Icon]) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={tab === id ? "nav active" : "nav"}
            >
              <Icon size={20} />
              {t[id]}
              {tab === id && <ChevronRight size={16} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="test-pill">{t.test}</span>
          <p>{t.testNote}</p>
        </div>
      </aside>
      <div className="workspace">
        <header>
          <span className="mobile-brand">
            <Diamond size={20} /> VAYNEXO
          </span>
          <span className="desktop-label">{t[tab]}</span>
          <div className="header-actions">
            <select
              aria-label={t.language}
              value={lang}
              onChange={(e) => chooseLanguage(e.target.value)}
            >
              <option value="uz">UZ</option>
              <option value="ru">RU</option>
              <option value="en">EN</option>
            </select>
            <span className="avatar">{user?.name?.slice(0, 1) || "V"}</span>
          </div>
        </header>
        <main className={reveal ? "vx-reveal" : undefined} aria-busy={dash}>
          <div className="test-banner">
            <span className="test-pill">{t.test}</span>
            <span>{t.testNote}</span>
          </div>
          {error && (
            <div role="alert" className="error">
              {error}
              <button onClick={() => setError("")} aria-label={t.close}>
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <p role="status" className="success">
              {notice}
            </p>
          )}
          {loading ? (
            <p role="status">{t.loading}</p>
          ) : !config ? (
            <button onClick={loadPublic}>{t.retry}</button>
          ) : (
            <>
              {!token && (
                <div className="login-strip">
                  <div>
                    <strong>{t.login}</strong>
                    <p>{t.loginNote}</p>
                  </div>
                  {(config.demo_login || window.Telegram?.WebApp?.initData) && (
                    <button className="primary" disabled={busy} onClick={login}>
                      {window.Telegram?.WebApp?.initData ? t.signIn : t.demo}
                    </button>
                  )}
                </div>
              )}
              {tab === "home" && (
                <>
                  <section className="hero">
                    <div className="hero-copy">
                      <span className="eyebrow">{t.eyebrow}</span>
                      <h1>{t.hello}</h1>
                      <p>{t.intro}</p>
                      <button
                        className="primary"
                        onClick={() => setTab("shop")}
                      >
                        {t.openShop}
                        <ArrowUpRight size={19} />
                      </button>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="orbit" />
                      <Diamond size={170} strokeWidth={0.65} />
                      <span>V</span>
                    </div>
                  </section>
                  <div className="section-heading">
                    <h2>{t.popular}</h2>
                    <button
                      className="text-button"
                      onClick={() => setTab("shop")}
                    >
                      {t.all}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  {cards(products.slice(0, 3))}
                  <div className="section-heading">
                    <h2>{t.future}</h2>
                  </div>
                  <div className="future-grid">
                    {[
                      ["coach", Sparkles],
                      ["arena", Swords],
                      ["news", Newspaper],
                    ].map(([id, Icon]) => (
                      <div className="future-card" key={id}>
                        <Icon size={24} />
                        <h3>{t[id]}</h3>
                        <span className="muted small">{t.soon}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {tab === "shop" && (
                <>
                  <div className="page-title">
                    <span className="eyebrow">MLBB / TOP-UP</span>
                    <h1>{t.shop}</h1>
                    <p>{t.accountNote}</p>
                  </div>
                  <div className="filters">
                    <div className="tabs">
                      {["all", "diamonds", "passes"].map((f) => (
                        <button
                          key={f}
                          className={filter === f ? "selected" : ""}
                          onClick={() => setFilter(f)}
                        >
                          {t[f]}
                        </button>
                      ))}
                    </div>
                    <label className="search">
                      <Search size={18} />
                      <input
                        aria-label={t.search}
                        placeholder={t.search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                  </div>
                  {matching.length ? (
                    cards(matching)
                  ) : (
                    <div className="empty">{t.empty}</div>
                  )}
                </>
              )}
              {tab === "orders" && token && (
                <>
                  <div className="section-heading">
                    <h1>{t.orders}</h1>
                    <button disabled={busy} onClick={() => action(loadOrders)}>
                      {t.refresh}
                    </button>
                  </div>
                  {orders.length ? (
                    orders.map((o) => (
                      <article className="order-card" key={o.id}>
                        <div className="order-top">
                          <span className="muted small">
                            #{o.id.slice(0, 8)} ·{" "}
                            {new Date(o.created_at).toLocaleString()}
                          </span>
                          <span className={"status " + o.status}>
                            {t[o.status]}
                          </span>
                        </div>
                        <h3>{o.product_names[lang]}</h3>
                        <p className="muted">
                          ID {o.player_id} ({o.zone_id})
                        </p>
                        <strong>{money(o.price_uzs, lang)}</strong>
                        {o.status === "awaiting_test_payment" && (
                          <div className="actions">
                            <button
                              disabled={busy}
                              className="primary"
                              onClick={() =>
                                action(async () => {
                                  await api(`/orders/${o.id}/test-payment`, {
                                    token,
                                    method: "POST",
                                  });
                                  await loadOrders();
                                })
                              }
                            >
                              {t.pay}
                            </button>
                            <button
                              disabled={busy}
                              onClick={() =>
                                action(async () => {
                                  await api(`/orders/${o.id}/cancel`, {
                                    token,
                                    method: "POST",
                                  });
                                  await loadOrders();
                                })
                              }
                            >
                              {t.cancel}
                            </button>
                          </div>
                        )}
                      </article>
                    ))
                  ) : (
                    <div className="empty">
                      <ReceiptText size={36} />
                      <h3>{t.empty}</h3>
                      <p>{t.emptyOrders}</p>
                      <button onClick={() => setTab("shop")}>
                        {t.openShop}
                      </button>
                    </div>
                  )}
                </>
              )}
              {tab === "profile" && user && (
                <>
                  <div className="page-title">
                    <h1>{t.profile}</h1>
                    <p>{user.name}</p>
                  </div>
                  <form className="panel form" onSubmit={saveProfile}>
                    <h3>{t.account}</h3>
                    <p className="muted">{t.accountNote}</p>
                    <AccountFields {...{ player, setPlayer, zone, setZone }} />
                    <p className="warning">{t.unverified}</p>
                    <label>
                      {t.language}
                      <select
                        value={lang}
                        onChange={(e) => chooseLanguage(e.target.value)}
                      >
                        <option value="uz">O‘zbekcha</option>
                        <option value="ru">Русский</option>
                        <option value="en">English</option>
                      </select>
                    </label>
                    <button disabled={busy} className="primary">
                      {t.save}
                    </button>
                  </form>
                  <button className="logout" onClick={logout}>
                    {t.logout}
                  </button>
                </>
              )}
              {tab === "help" && token && (
                <>
                  <div className="page-title">
                    <h1>{t.supportTitle}</h1>
                    <p>{t.supportNote}</p>
                  </div>
                  <form
                    className="panel form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      action(async () => {
                        await api("/support", {
                          token,
                          method: "POST",
                          body: { message },
                        });
                        setMessage("");
                        setTickets(await api("/support", { token }));
                      });
                    }}
                  >
                    <label>
                      {t.message}
                      <textarea
                        required
                        minLength={3}
                        maxLength={2000}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </label>
                    <button disabled={busy} className="primary">
                      {t.send}
                    </button>
                  </form>
                  <div className="section-heading">
                    <h2>{t.help}</h2>
                    <button
                      disabled={busy}
                      onClick={() =>
                        action(async () =>
                          setTickets(await api("/support", { token })),
                        )
                      }
                    >
                      {t.refresh}
                    </button>
                  </div>
                  {tickets.map((ticket) => (
                    <article key={ticket.id} className="panel ticket">
                      <p>{ticket.message}</p>
                      <div className="reply">
                        <span className="eyebrow">
                          {ticket.reply ? t.answer : t.waiting}
                        </span>
                        {ticket.reply && <p>{ticket.reply}</p>}
                      </div>
                    </article>
                  ))}
                </>
              )}
            </>
          )}
        </main>
        <footer>
          VAYNEXO <span>MLBB community platform · 2026</span>
        </footer>
      </div>
      <nav className="bottom-nav">
        {tabs.map(([id, Icon]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => navigate(id)}
          >
            <Icon size={20} />
            <span>{t[id]}</span>
          </button>
        ))}
      </nav>
      <dialog
        ref={modalRef}
        onCancel={(e) => {
          e.preventDefault();
          if (!busy) setSelected(null);
        }}
        aria-labelledby="checkout-title"
      >
        <div className="modal-head">
          <h2 id="checkout-title">{t.checkout}</h2>
          <button
            disabled={busy}
            aria-label={t.close}
            onClick={() => setSelected(null)}
          >
            <X />
          </button>
        </div>
        {selected && (
          <form onSubmit={create} className="form">
            <div className="checkout-product">
              <Diamond size={32} />
              <div>
                <strong>{selected.names[lang]}</strong>
                <p className="muted small">Mobile Legends: Bang Bang</p>
              </div>
            </div>
            <AccountFields {...{ player, setPlayer, zone, setZone }} />
            <p className="warning">{t.unverified}</p>
            <div className="total">
              <span>{t.total}</span>
              <strong>{money(selected.price_uzs, lang)}</strong>
            </div>
            <label className="check">
              <input
                type="checkbox"
                required
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              {t.terms}
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            {token ? (
              <button disabled={busy || !accepted} className="primary">
                {busy ? t.loading : t.create}
              </button>
            ) : (
              <>
                <p>{t.loginNote}</p>
                {(config?.demo_login || window.Telegram?.WebApp?.initData) && (
                  <button
                    type="button"
                    disabled={busy}
                    className="primary"
                    onClick={login}
                  >
                    {t.signIn}
                  </button>
                )}
              </>
            )}
          </form>
        )}
      </dialog>
    </div>
  );
}
function AccountFields({ player, setPlayer, zone, setZone }) {
  return (
    <div className="field-row">
      <label>
        User ID
        <input
          required
          inputMode="numeric"
          pattern="[0-9]{4,20}"
          maxLength={20}
          placeholder="123456789"
          value={player}
          onChange={(e) => setPlayer(e.target.value)}
        />
      </label>
      <label>
        Zone ID
        <input
          required
          inputMode="numeric"
          pattern="[0-9]{2,10}"
          maxLength={10}
          placeholder="1234"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        />
      </label>
    </div>
  );
}
