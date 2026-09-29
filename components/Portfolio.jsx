"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PROJECTS } from "@/lib/projects";
import SHOTS from "@/lib/shots.json";

/* =========================================================
   EDIT ONLY THIS SECTION - your details, links and content
   ========================================================= */
const PROFILE = {
  name: "Ayesha Tariq",
  role: "Full Stack Developer",
  intro:
    "I build fast, secure and responsive websites, WordPress plugins and full stack web apps. Every project below is live - see it on desktop and mobile right here.",
  email: "tariqayesha037@gmail.com",
  phone: "+92 3057162265", // shown inside the Hire me button
  whatsapp: "https://wa.me/923057162265",
  linkedin: "",
  github: "https://www.linkedin.com/in/ayesha-t-a0a677202?",
  stats: [
    { value: "4+", label: "Years experience" },
    { value: "20+", label: "Websites delivered" },
    { value: "2", label: "Plugins built" },
  ],
  skills: ["WordPress", "Custom Themes", "Plugin Development", "WooCommerce", "Elementor", "PHP", "JavaScript", "React", "REST API", "Speed Optimisation", "SEO", "Security"],
};

const PLUGINS = [
  {
    name: "My WordPress Plugin",
    version: "1.0",
    description: "Quick Online Booking reservation",
    features: [
      "Booking Calendar Schedule Form adds a two-step booking calendar to any page. Visitors pick check-in/check-out (or arrival/return) dates and times, then submit their details"
    ],


    link: "https://wordpress.org/plugins/quick-booking-widget/",
    linkLabel: "View plugin",
    demoUrl: "", // optional live demo to preview in the card
  },
  {
    name: "Checkout Field Editor (Checkout Manager) for WooCommerce",
    version: "2.5.5",
    description: "Add custom fields to the WooCommerce checkout, edit the default ones and control the whole checkout form without code. Works with Classic and Block Checkout.",
    features: [
      "Add, edit, hide and delete checkout fields",
      "20 field types for Classic Checkout, 4 for Block Checkout",
      "Drag and drop field ordering",
      "Translation ready (WPML, Polylang, Loco Translate)",
    ],
    link: "https://wordpress.org/plugins/woo-checkout-regsiter-field-editor/",
    linkLabel: "View on WordPress.org",
    demoUrl: "",
  },
];

const TESTIMONIALS = [
  // { quote: "Delivered on time and the site is very fast.", author: "Client Name", role: "Company" },
];
/* ========================================================= */


/* ---------- Site previews ----------
   Every preview tries, in order:
   1. the LIVE site in an iframe (only if the site allows embedding)
   2. your own screenshot from /public/shots (run `npm run shots`, see README)
   3. an automatic screenshot from thum.io, then WordPress mShots
   The next source is used automatically when one fails, so a preview is never blank. */
const deviceOf = (w) => (w >= 1000 ? "desktop" : w >= 600 ? "tablet" : "mobile");

function buildSources(p, w, h, embeddable) {
  const list = [];
  if (embeddable) list.push({ type: "live" });
  const local = SHOTS[p.slug]?.[deviceOf(w)];
  if (local) list.push({ type: "img", src: local });
  const iw = Math.min(w, 1200);
  list.push({ type: "img", src: `https://image.thum.io/get/width/${iw}/crop/${Math.round((iw * h) / w)}/viewportWidth/${w}/noanimate/${p.url}` });
  list.push({ type: "img", src: `https://s0.wp.com/mshots/v1/${encodeURIComponent(p.url)}?w=${iw}&h=${Math.round((iw * h) / w)}` });
  return list;
}

// url -> does the site allow being shown in an iframe? Shared by all previews.
const embedCache = new Map();
const checkEmbed = (url) => {
  if (!embedCache.has(url)) {
    embedCache.set(url, fetch(`/api/embed-check?url=${encodeURIComponent(url)}`)
      .then((r) => r.json()).then((d) => d.embeddable !== false).catch(() => true));
  }
  return embedCache.get(url);
};
function useEmbeddable(url) {
  const [ok, setOk] = useState(null);
  useEffect(() => {
    if (!url) return;
    let dead = false;
    checkEmbed(url).then((v) => !dead && setOk(v));
    return () => { dead = true; };
  }, [url]);
  return ok;
}

/* Renders the site at a real device width (desktop 1280 / tablet 768 / mobile 390),
   then scales it to fit its box. Nothing loads until the box scrolls near the screen. */
function Scaled({ p, w, h, title }) {
  const box = useRef(null);
  const [scale, setScale] = useState(0.3);
  const [near, setNear] = useState(false);
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const embeddable = useEmbeddable(near ? p.url : "");

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / w);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "300px" });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, [w]);

  const sources = useMemo(
    () => (embeddable === null ? [] : buildSources(p, w, h, embeddable)),
    [p, w, h, embeddable]
  );
  useEffect(() => { setIdx(0); setLoaded(false); }, [sources]);

  const cur = sources[idx];
  const failed = sources.length > 0 && !cur;
  const next = () => { setLoaded(false); setIdx((i) => i + 1); };

  // A live frame that never finishes loading is replaced by a screenshot after 15s
  useEffect(() => {
    if (cur?.type !== "live" || loaded) return;
    const t = setTimeout(next, 15000);
    return () => clearTimeout(t);
  }, [cur, loaded]);

  const s = { width: w, transform: `scale(${scale})` };
  return (
    <div ref={box} className="scaled" style={{ height: h * scale }}>
      {!loaded && !failed && <div className="sk" />}
      {near && cur?.type === "live" && (
        <iframe key={`live-${idx}`} src={p.url} title={title} height={h} style={s}
          onLoad={() => setLoaded(true)} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
      )}
      {near && cur?.type === "img" && (
        <img key={cur.src} src={cur.src} alt={title} referrerPolicy="no-referrer"
          style={{ ...s, height: h, objectFit: "cover", objectPosition: "top" }}
          onLoad={() => setLoaded(true)} onError={next} />
      )}
      {failed && <div className="shotfail">Preview not available. Use “Open site”.</div>}
    </div>
  );
}

const Toggle = ({ value, onChange, options, label }) => (
  <div className="tog" role="group" aria-label={label}>
    {options.map(([k, l]) => (
      <button key={k} aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>
    ))}
  </div>
);

const hostOf = (u) => u.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

function Project({ p }) {
  const [view, setView] = useState("all");
  const show = (d) => view === "all" || view === d;
  return (
    <article className="proj">
      <div className="ph">
        <div>
          <h3>{p.title}</h3>
          <p>{p.description}</p>
        </div>
        <div className="tools">
          <Toggle label="Preview size" value={view} onChange={setView}
            options={[["all", "All"], ["desktop", "Desktop"], ["tablet", "Tablet"], ["mobile", "Mobile"]]} />
          <a className="lnk" href={p.url} target="_blank" rel="noopener noreferrer">Open site</a>
        </div>
      </div>
      <div className="stage">
        {show("desktop") && (
          <div className={`desk${view === "desktop" ? " solo" : ""}`}>
            <div className="bar"><i /><i /><i /><span>{hostOf(p.url)}</span></div>
            <Scaled p={p} w={1280} h={800} title={`${p.title} desktop`} />
          </div>
        )}
        {show("tablet") && (
          <div className="dev">
            <div className={`tab${view === "tablet" ? " solo" : ""}`}>
              <Scaled p={p} w={768} h={1024} title={`${p.title} tablet`} />
            </div>
            <p className="cap">Tablet</p>
          </div>
        )}
        {show("mobile") && (
          <div className="dev">
            <div className={`phone${view === "mobile" ? " solo" : ""}`}>
              <Scaled p={p} w={390} h={800} title={`${p.title} mobile`} />
            </div>
            <p className="cap">Mobile</p>
          </div>
        )}
      </div>
    </article>
  );
}

function Contact() {
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    setMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.detail) console.error("Contact form server error:", data.detail);
        throw new Error((data.error || "Something went wrong. Please try again.") + (data.detail ? ` [${data.detail}]` : ""));
      }
      form.reset();
      setStatus("success");
      setMsg("Thank you! Your message was sent. I will reply to your email soon.");
    } catch (err) {
      setStatus("error");
      setMsg(err.message || "Network error. Please try again.");
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="two">
        <input name="name" placeholder="Your name" required maxLength={100} aria-label="Your name" />
        <input name="email" type="email" placeholder="Your email" required maxLength={150} aria-label="Your email" />
      </div>
      <input name="phone" type="tel" placeholder="Phone (optional)" maxLength={30} aria-label="Phone (optional)" />
      <textarea name="message" rows={5} placeholder="Tell me about your project" required minLength={10} maxLength={3000} aria-label="Message" />
      <div className="hp" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
      <button className="btn" type="submit" disabled={status === "sending"} style={{ justifySelf: "start" }}>
        {status === "sending" ? "Sending..." : "Send message"}
      </button>
      <div role="status" aria-live="polite">
        {msg && <p className={`msg ${status === "success" ? "ok" : "err"}`}>{msg}</p>}
      </div>
    </form>
  );
}

export default function Portfolio() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      setDark(saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
    } catch (_) {}
  }, []);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch (_) {}
  };
  const [shown, setShown] = useState(6);
  const all = PROJECTS;
  const list = all.slice(0, shown);
  const first = PROJECTS[0];

  return (
    <div className={`pf${dark ? " dark" : ""}`}>
      <nav>
        <div className="wrap">
          <div className="brand"><b>{PROFILE.name}</b><small>{PROFILE.role}</small></div>
          <a className="l" href="#websites">Websites</a>
          <a className="l" href="#plugins">Plugins</a>
          <a className="l" href="#skills">Skills</a>
          <a className="l" href="#contact">Contact</a>
          <button className="ic" onClick={toggleTheme} aria-label="Toggle dark mode"><span aria-hidden="true">◐</span><span className="tx"> {dark ? "Light" : "Dark"}</span></button>
          <a className="btn hire" href={`tel:${PROFILE.phone.replace(/[^\d+]/g, "")}`} aria-label={`Hire me, call ${PROFILE.phone}`}>Hire me: {PROFILE.phone}</a>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap">
          <div>
            <span className="role">{PROFILE.role}</span>
            <h1>{PROFILE.name}</h1>
            <p>{PROFILE.intro}</p>
            <div className="row">
              <a className="btn" href="#websites">See my work</a>
              {PROFILE.whatsapp && <a className="btn ghost" href={PROFILE.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
              {PROFILE.linkedin && <a className="btn ghost" href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
              {PROFILE.github && <a className="btn ghost" href={PROFILE.github} target="_blank" rel="noopener noreferrer">Linkdln</a>}
            </div>
            <div className="stats">
              {PROFILE.stats.map((s) => <div key={s.label}><b>{s.value}</b><span>{s.label}</span></div>)}
            </div>
          </div>
          {first && (
            <div className="heroview" aria-label="Featured project preview">
              <div className="desk" style={{ flex: "1 1 260px" }}>
                <div className="bar"><i /><i /><i /><span>{hostOf(first.url)}</span></div>
                <Scaled p={first} w={1280} h={800} title="Featured desktop" />
              </div>
              <div className="phone" style={{ flex: "0 0 96px", borderWidth: 5, borderRadius: 18 }}>
                <Scaled p={first} w={390} h={800} title="Featured mobile" />
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        <section id="websites">
          <div className="wrap">
            <h2 className="sh">Websites I built</h2>
            <p className="sub">Live previews on desktop, tablet and mobile.</p>
            {list.map((p) => <Project p={p} key={p.url} />)}
            {all.length > shown && (
              <button className="btn more" onClick={() => setShown((n) => n + 6)}>Show more websites ({all.length - shown} left)</button>
            )}
          </div>
        </section>

        <section id="plugins" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <h2 className="sh">WordPress plugins</h2>
            <p className="sub">Custom plugins I developed.</p>
            <div className="plugs">
              {PLUGINS.map((pl) => (
                <div className="card" key={pl.name}>
                  <h3>{pl.name}{pl.version && <span className="ver">v{pl.version}</span>}</h3>
                  <p style={{ margin: 0 }}>{pl.description}</p>
                  <ul>{pl.features?.map((f) => <li key={f}>{f}</li>)}</ul>
                  {pl.demoUrl && <div className="desk"><Scaled p={{ url: pl.demoUrl }} w={1280} h={800} title={`${pl.name} demo`} /></div>}
                  <a className="btn" href={pl.link} target="_blank" rel="noopener noreferrer">{pl.linkLabel || "View plugin"}</a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="skills" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <h2 className="sh">Skills</h2>
            <p className="sub">Tools and technologies I work with.</p>
            <div className="chips">{PROFILE.skills.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
          </div>
        </section>

        {TESTIMONIALS.length > 0 && (
          <section style={{ paddingTop: 0 }}>
            <div className="wrap">
              <h2 className="sh">Client feedback</h2>
              <div className="tests" style={{ marginTop: 24 }}>
                {TESTIMONIALS.map((t) => (
                  <figure className="card" key={t.author} style={{ margin: 0 }}>
                    <blockquote style={{ margin: 0 }}>{t.quote}</blockquote>
                    <figcaption style={{ color: "var(--muted)" }}>{t.author}{t.role && `, ${t.role}`}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="contact" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <h2 className="sh">Let's work together</h2>
            <p className="sub">Tell me about your project and I will reply within one day.</p>
            <Contact />
          </div>
        </section>
      </main>

      <footer><div className="wrap">&copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> {PROFILE.name} - {PROFILE.email} - {PROFILE.phone}</div></footer>
    </div>
  );
}
