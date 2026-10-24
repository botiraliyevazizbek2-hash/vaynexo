import { useEffect, useState } from "react";
import { Diamond } from "lucide-react";
import { api, money } from "./api";
import { dictionaries } from "./i18n";
const allowed = {
  test_paid: ["test_processing", "test_refunded"],
  test_processing: ["test_completed", "test_failed"],
  test_failed: ["test_refunded"],
  awaiting_test_payment: ["cancelled"],
};
export default function Admin({ lang, chooseLanguage }) {
  const t = dictionaries[lang] || dictionaries.uz;
  const [token, setToken] = useState(
      sessionStorage.getItem("vaynexo-admin") || "",
    ),
    [key, setKey] = useState(""),
    [tab, setTab] = useState("summary"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  function remember(value) {
    setToken(value);
    sessionStorage.setItem("vaynexo-admin", value);
  }
  function logout() {
    setToken("");
    setData(null);
    sessionStorage.removeItem("vaynexo-admin");
  }
  function fail(e) {
    setError(e.status === 403 ? t.forbidden : t[e.message] || t.error);
    if (e.status === 401) logout();
  }
  async function run(fn) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function load() {
    setData(await api(tab === "news" ? "/news/admin" : "/admin/" + tab, { token }));
  }
  useEffect(() => {
    if (!token) return;
    let active = true;
    setData(null);
    api(tab === "news" ? "/news/admin" : "/admin/" + tab, { token })
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) fail(e);
      });
    return () => {
      active = false;
    };
  }, [token, tab]);
  async function patch(path, body) {
    await api("/admin/" + path, { token, method: "PATCH", body });
    await load();
  }
  return (
    <div className="admin-shell">
      <header>
        <a className="brand" href="/">
          <Diamond /> VAYNEXO
        </a>
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
          {token && <button onClick={logout}>{t.logout}</button>}
        </div>
      </header>
      <main>
        <span className="test-pill">{t.test}</span>
        <h1>{t.admin}</h1>
        <p className="muted">{t.testNote}</p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!token ? (
          <form
            className="panel form"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const r = await api("/auth/admin", {
                  method: "POST",
                  body: { key },
                });
                setKey("");
                remember(r.token);
              });
            }}
          >
            <p>{t.access}</p>
            <label>
              {t.adminKey}
              <input
                type="password"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoComplete="off"
              />
            </label>
            <button disabled={busy} className="primary">
              {t.signIn}
            </button>
            {sessionStorage.getItem("vaynexo-token") && (
              <button
                type="button"
                onClick={() =>
                  remember(sessionStorage.getItem("vaynexo-token"))
                }
              >
                {t.useTelegram}
              </button>
            )}
          </form>
        ) : (
          <>
            <div className="tabs admin-tabs">
              {[
                "summary",
                "orders",
                "products",
                "users",
                "support",
                "audit",
                "news",
              ].map((id) => (
                <button
                  key={id}
                  className={tab === id ? "selected" : ""}
                  onClick={() => setTab(id)}
                >
                  {t[id] || t.help}
                </button>
              ))}
              <button disabled={busy} onClick={() => run(load)}>
                {t.refresh}
              </button>
            </div>
            {!data ? (
              <p>{t.loading}</p>
            ) : (
              <>
                {tab === "summary" && (
                  <div className="future-grid">
                    {[
                      ["orders", data.orders],
                      ["users", data.users],
                      ["completedTotal", money(data.test_completed_uzs, lang)],
                    ].map(([title, value]) => (
                      <div className="panel" key={title}>
                        <p className="muted">{t[title]}</p>
                        <h2>{value}</h2>
                        {title === "completedTotal" && (
                          <small>{t.noRealRevenue}</small>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {tab === "orders" &&
                  data.map((o) => (
                    <article className="order-card" key={o.id}>
                      <div className="order-top">
                        <span>#{o.id.slice(0, 8)}</span>
                        <span className="status">{t[o.status]}</span>
                      </div>
                      <h3>
                        {o.product_names[lang]} · {money(o.price_uzs, lang)}
                      </h3>
                      <p>
                        ID {o.player_id} ({o.zone_id}) · User #{o.user_id}
                      </p>
                      <div className="actions">
                        {(allowed[o.status] || []).map((s) => (
                          <button
                            disabled={busy}
                            key={s}
                            onClick={() =>
                              run(() => patch("orders/" + o.id, { status: s }))
                            }
                          >
                            {t[s]}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))}
                {tab === "products" &&
                  data.map((p) => (
                    <ProductForm
                      key={p.id + "-" + p.price_uzs + "-" + p.active}
                      {...{ p, t, lang, busy }}
                      save={(body) =>
                        run(() => patch("products/" + p.id, body))
                      }
                    />
                  ))}
                {tab === "support" &&
                  data.map((ticket) => (
                    <form
                      key={ticket.id}
                      className="panel form ticket"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const reply = new FormData(e.currentTarget).get(
                          "reply",
                        );
                        run(() => patch("support/" + ticket.id, { reply }));
                      }}
                    >
                      <span className="muted">
                        #{ticket.id} · User #{ticket.user_id}
                      </span>
                      <p>{ticket.message}</p>
                      <label>
                        {t.reply}
                        <textarea
                          name="reply"
                          required
                          maxLength={2000}
                          defaultValue={ticket.reply}
                        />
                      </label>
                      <button disabled={busy}>{t.send}</button>
                    </form>
                  ))}
                {tab === "users" &&
                  data.map((u) => (
                    <div className="panel ticket" key={u.id}>
                      <strong>
                        #{u.id} {u.name}
                      </strong>
                      <p>
                        {u.language.toUpperCase()} · Telegram{" "}
                        {u.telegram_id || "—"}
                      </p>
                      <p>
                        ID {u.player_id || "—"} ({u.zone_id || "—"})
                      </p>
                    </div>
                  ))}
                {tab === "news" && (
                  <div className="panel">
                    <p className="muted">{t.newsAdminNote}</p>
                    <button disabled={busy} onClick={() => run(async () => {
                      await api("/news/admin/import", { token, method: "POST" });
                      await load();
                    })}>{t.newsImport}</button>
                    {Array.isArray(data) && data.map((item) => (
                      <article className="ticket" key={item.id}>
                        <h3>{item.title}</h3>
                        <p className="muted">{item.source} · {item.published_at.slice(0, 10)}</p>
                        <a href={item.url} target="_blank" rel="noopener noreferrer">{t.newsSource}</a>
                        <div className="actions">
                          <span>{item.approved ? t.newsApproved : t.newsPending}</span>
                          <button disabled={busy} onClick={() => run(async () => {
                            await api("/news/admin/" + item.id, { token, method: "PATCH", body: { approved: !item.approved } });
                            await load();
                          })}>{item.approved ? t.newsReject : t.newsApprove}</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                {tab === "audit" && (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Actor</th>
                          <th>Action</th>
                          <th>Target</th>
                          <th>Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((a) => (
                          <tr key={a.id}>
                            <td>{a.id}</td>
                            <td>{a.actor}</td>
                            <td>{a.action}</td>
                            <td>{a.target}</td>
                            <td>
                              <code>{JSON.stringify(a.detail)}</code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {Array.isArray(data) && data.length === 0 && (
                  <p className="empty">{t.empty}</p>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
function ProductForm({ p, t, lang, busy, save }) {
  const [price, setPrice] = useState(p.price_uzs),
    [active, setActive] = useState(p.active);
  return (
    <form
      className="panel product-editor"
      onSubmit={(e) => {
        e.preventDefault();
        save({ price_uzs: Number(price), active });
      }}
    >
      <strong>{p.names[lang]}</strong>
      <label>
        {t.price}
        <input
          required
          type="number"
          min="1"
          max="100000000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        {t.active}
      </label>
      <button disabled={busy}>{t.save}</button>
    </form>
  );
}
