import { Link } from "wouter";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { ArrowUpRight, MoveRight } from "lucide-react";

/* ── Fonts ──────────────────────────────────────────────────────────── */
const _fc = document.createElement("link");
_fc.rel = "stylesheet";
_fc.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,400;0,9..144,600;1,9..144,200;1,9..144,400;1,9..144,600&family=Azeret+Mono:wght@300;400;500&family=DM+Sans:wght@200;300;400&display=swap";
document.head.appendChild(_fc);

/* ── Styles ─────────────────────────────────────────────────────────── */
const _sc = document.createElement("style");
_sc.textContent = `
  :root {
    --char:    #111110;
    --char2:   #1a1a18;
    --char3:   #222220;
    --sage:    #899e89;
    --sage2:   #b0c4b0;
    --ecru:    #ddd8cc;
    --warm:    #c4bdb0;
    --line:    rgba(137,158,137,0.13);
    --ff-disp: 'Fraunces', Georgia, serif;
    --ff-mono: 'Azeret Mono', monospace;
    --ff-sans: 'DM Sans', sans-serif;
  }

  .vc * { box-sizing: border-box; margin: 0; padding: 0; }
  .vc {
    background: var(--char);
    color: var(--ecru);
    font-family: var(--ff-sans);
    font-weight: 300;
    overflow-x: hidden;
  }

  /* grain */
  .vc::before {
    content: '';
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.03;
    pointer-events: none;
    z-index: 9999;
  }

  /* ── ambient lights ── */
  .vc-light {
    position: fixed;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
    z-index: 0;
  }
  .vc-light-1 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(137,158,137,0.07) 0%, transparent 70%);
    top: -10%; left: -10%;
  }
  .vc-light-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(176,196,176,0.05) 0%, transparent 70%);
    bottom: 20%; right: 10%;
  }

  /* ── NAV ── */
  .vc-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 500;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.6rem 3rem;
    background: rgba(17,17,16,0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .vc-nav-border {
    position: absolute;
    bottom: 0; left: 3rem; right: 3rem;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--line) 30%, var(--line) 70%, transparent);
  }
  .vc-logo {
    font-family: var(--ff-disp);
    font-size: 1.1rem;
    font-weight: 200;
    letter-spacing: 0.1em;
    color: var(--ecru);
    font-style: italic;
  }
  .vc-logo-dot { color: var(--sage); font-style: normal; }
  .vc-nav-c {
    display: flex;
    gap: 3rem;
    align-items: center;
  }
  .vc-nav-c a {
    font-family: var(--ff-mono);
    font-size: 0.6rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--warm);
    opacity: 0.5;
    text-decoration: none;
    transition: opacity .2s, color .2s;
  }
  .vc-nav-c a:hover { opacity: 1; color: var(--sage2); }
  .vc-btn {
    font-family: var(--ff-mono);
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 0.55rem 1.35rem;
    border: 1px solid rgba(137,158,137,0.2);
    background: transparent;
    color: var(--ecru);
    cursor: pointer;
    transition: all .25s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border-radius: 2px;
  }
  .vc-btn:hover { border-color: var(--sage); color: var(--sage2); }
  .vc-btn-fill {
    background: rgba(137,158,137,0.12);
    border-color: var(--sage);
    color: var(--sage2);
  }
  .vc-btn-fill:hover { background: rgba(137,158,137,0.22); }

  /* ── HERO ── */
  .vc-hero {
    min-height: 100vh;
    padding-top: 5.5rem;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
  }
  .vc-hero-body {
    flex: 1;
    display: grid;
    grid-template-columns: 5fr 4fr;
    border-bottom: 1px solid var(--line);
  }
  .vc-hero-l {
    padding: 5rem 4rem 4rem;
    border-right: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    position: relative;
  }
  .vc-ornament {
    position: absolute;
    top: 4rem; left: 4rem;
    font-family: var(--ff-mono);
    font-size: 0.5rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--sage);
    opacity: 0.45;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .vc-ornament::before {
    content: '';
    display: block;
    width: 20px; height: 1px;
    background: var(--sage);
    opacity: 0.6;
  }
  .vc-hero-h {
    font-family: var(--ff-disp);
    font-size: clamp(4rem, 7.5vw, 9.5rem);
    font-weight: 200;
    line-height: 0.93;
    letter-spacing: -0.02em;
    color: var(--ecru);
    margin-bottom: 2.5rem;
  }
  .vc-hero-h em {
    font-style: italic;
    font-weight: 200;
    color: var(--sage);
  }
  .vc-hero-sub {
    font-family: var(--ff-mono);
    font-size: 0.68rem;
    line-height: 2;
    color: var(--warm);
    opacity: 0.65;
    max-width: 400px;
    margin-bottom: 3.5rem;
    letter-spacing: 0.04em;
  }
  .vc-cta-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
  .vc-cta-note {
    font-family: var(--ff-mono);
    font-size: 0.55rem;
    letter-spacing: 0.15em;
    color: var(--warm);
    opacity: 0.4;
    text-transform: uppercase;
  }

  .vc-hero-r {
    padding: 4rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    justify-content: center;
  }
  .vc-card {
    border: 1px solid var(--line);
    background: rgba(255,255,255,0.01);
    padding: 1.75rem;
    transition: background .25s, border-color .25s;
    position: relative;
    overflow: hidden;
  }
  .vc-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 0% 0%, rgba(137,158,137,0.06) 0%, transparent 60%);
    opacity: 0;
    transition: opacity .3s;
  }
  .vc-card:hover { background: rgba(137,158,137,0.04); border-color: rgba(137,158,137,0.25); }
  .vc-card:hover::before { opacity: 1; }
  .vc-card-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  .vc-card-val {
    font-family: var(--ff-disp);
    font-size: 2.6rem;
    font-weight: 400;
    color: var(--ecru);
    line-height: 1;
    letter-spacing: -0.01em;
  }
  .vc-card-delta {
    font-family: var(--ff-mono);
    font-size: 0.58rem;
    color: var(--sage2);
    letter-spacing: 0.1em;
  }
  .vc-card-lbl {
    font-family: var(--ff-mono);
    font-size: 0.55rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--warm);
    opacity: 0.5;
    margin-bottom: 1rem;
  }
  .vc-mini-bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 28px;
  }
  .vc-mini-bar {
    flex: 1;
    min-width: 4px;
    background: rgba(137,158,137,0.15);
    transition: background .2s;
  }
  .vc-mini-bar.hi { background: rgba(137,158,137,0.55); }
  .vc-mini-bar:hover { background: rgba(176,196,176,0.5); }

  /* pipeline rows */
  .vc-pipe-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid rgba(137,158,137,0.07);
  }
  .vc-pipe-row:last-child { border-bottom: none; padding-bottom: 0; }
  .vc-pipe-name {
    font-family: var(--ff-mono);
    font-size: 0.58rem;
    color: var(--warm);
    opacity: 0.65;
    flex: 1;
    letter-spacing: 0.03em;
  }
  .vc-pipe-track {
    width: 70px; height: 2px;
    background: rgba(137,158,137,0.1);
    position: relative;
  }
  .vc-pipe-fill { height: 100%; background: var(--sage); }
  .vc-pipe-val {
    font-family: var(--ff-mono);
    font-size: 0.58rem;
    color: var(--ecru);
    opacity: 0.7;
    width: 38px;
    text-align: right;
  }

  /* ── FEATURES SECTION ── */
  .vc-features-wrap {
    position: relative; z-index: 1;
    border-bottom: 1px solid var(--line);
    padding: 6rem 4rem;
  }
  .vc-sec-eyebrow {
    font-family: var(--ff-mono);
    font-size: 0.55rem;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: var(--sage);
    margin-bottom: 2rem;
    opacity: 0.7;
  }
  .vc-sec-h {
    font-family: var(--ff-disp);
    font-size: clamp(2.5rem, 4.5vw, 5.5rem);
    font-weight: 200;
    line-height: 1.05;
    color: var(--ecru);
    max-width: 700px;
    margin-bottom: 5rem;
    letter-spacing: -0.01em;
  }
  .vc-sec-h em { font-style: italic; color: var(--sage2); }
  .vc-feats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: var(--line);
    border: 1px solid var(--line);
  }
  .vc-feat {
    background: var(--char);
    padding: 2.5rem 2rem;
    transition: background .3s;
    position: relative;
  }
  .vc-feat:hover { background: var(--char2); }
  .vc-feat-line {
    width: 32px; height: 1px;
    background: var(--sage);
    opacity: 0.3;
    margin-bottom: 1.75rem;
    transition: width .3s, opacity .3s;
  }
  .vc-feat:hover .vc-feat-line { width: 56px; opacity: 0.7; }
  .vc-feat-n {
    font-family: var(--ff-mono);
    font-size: 0.5rem;
    letter-spacing: 0.25em;
    color: var(--sage);
    opacity: 0.5;
    margin-bottom: 1rem;
  }
  .vc-feat-title {
    font-family: var(--ff-disp);
    font-size: 1.1rem;
    font-weight: 400;
    color: var(--ecru);
    margin-bottom: 0.75rem;
    line-height: 1.3;
  }
  .vc-feat-title em { font-style: italic; color: var(--sage2); }
  .vc-feat-desc {
    font-family: var(--ff-mono);
    font-size: 0.6rem;
    line-height: 1.85;
    color: var(--warm);
    opacity: 0.6;
    letter-spacing: 0.03em;
  }

  /* ── QUOTE ── */
  .vc-quote-wrap {
    position: relative; z-index: 1;
    padding: 8rem 4rem;
    border-bottom: 1px solid var(--line);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6rem;
    align-items: center;
  }
  .vc-quote-l {
    font-family: var(--ff-disp);
    font-style: italic;
    font-weight: 200;
    font-size: clamp(1.6rem, 2.8vw, 3.2rem);
    line-height: 1.38;
    color: var(--ecru);
    letter-spacing: -0.01em;
  }
  .vc-quote-r {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  .vc-quote-attr {
    font-family: var(--ff-mono);
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--sage);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .vc-quote-attr-name { color: var(--ecru); opacity: 0.8; }
  .vc-quote-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .vc-q-stat {
    padding: 1.25rem;
    border: 1px solid var(--line);
    background: rgba(255,255,255,0.01);
  }
  .vc-q-stat-v {
    font-family: var(--ff-disp);
    font-size: 1.8rem;
    color: var(--ecru);
    font-weight: 400;
    line-height: 1;
    margin-bottom: 0.3rem;
  }
  .vc-q-stat-l {
    font-family: var(--ff-mono);
    font-size: 0.52rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--warm);
    opacity: 0.5;
  }

  /* ── LOGOS ── */
  .vc-logos {
    position: relative; z-index: 1;
    padding: 3rem 4rem;
    border-bottom: 1px solid var(--line);
    display: flex;
    align-items: center;
    gap: 4rem;
    flex-wrap: wrap;
  }
  .vc-logos-lbl {
    font-family: var(--ff-mono);
    font-size: 0.52rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--warm);
    opacity: 0.4;
    white-space: nowrap;
  }
  .vc-logo-item {
    font-family: var(--ff-disp);
    font-size: 0.95rem;
    font-weight: 400;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--warm);
    opacity: 0.2;
    transition: opacity .25s, color .25s;
    cursor: default;
  }
  .vc-logo-item:hover { opacity: 0.7; color: var(--sage2); }

  /* ── CTA ── */
  .vc-cta {
    position: relative; z-index: 1;
    padding: 8rem 4rem;
    border-bottom: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 3rem;
    overflow: hidden;
  }
  .vc-cta-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid var(--line);
    pointer-events: none;
  }
  .vc-cta-ring-1 { width: 500px; height: 500px; top: 50%; left: 50%; transform: translate(-50%,-50%); }
  .vc-cta-ring-2 { width: 700px; height: 700px; top: 50%; left: 50%; transform: translate(-50%,-50%); opacity: 0.5; }
  .vc-cta-ring-3 { width: 900px; height: 900px; top: 50%; left: 50%; transform: translate(-50%,-50%); opacity: 0.25; }
  .vc-cta-h {
    font-family: var(--ff-disp);
    font-size: clamp(3rem, 6vw, 7rem);
    font-weight: 200;
    line-height: 1.0;
    color: var(--ecru);
    letter-spacing: -0.01em;
    position: relative;
  }
  .vc-cta-h em { font-style: italic; color: var(--sage2); }
  .vc-cta-sub {
    font-family: var(--ff-mono);
    font-size: 0.65rem;
    line-height: 1.9;
    color: var(--warm);
    opacity: 0.55;
    max-width: 400px;
    letter-spacing: 0.04em;
    position: relative;
  }
  .vc-cta-btns { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; position: relative; }

  /* ── FOOTER ── */
  .vc-footer {
    position: relative; z-index: 1;
    padding: 2.5rem 4rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1.5rem;
  }
  .vc-footer-logo {
    font-family: var(--ff-disp);
    font-style: italic;
    font-size: 1rem;
    font-weight: 200;
    color: var(--warm);
    opacity: 0.35;
    letter-spacing: 0.08em;
  }
  .vc-footer-links {
    display: flex;
    gap: 2.5rem;
  }
  .vc-footer-links a {
    font-family: var(--ff-mono);
    font-size: 0.58rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--warm);
    opacity: 0.3;
    text-decoration: none;
    transition: opacity .2s, color .2s;
  }
  .vc-footer-links a:hover { opacity: 0.8; color: var(--sage2); }
  .vc-footer-copy {
    font-family: var(--ff-mono);
    font-size: 0.55rem;
    letter-spacing: 0.08em;
    color: var(--warm);
    opacity: 0.25;
  }

  /* Animations */
  @keyframes vc-rise {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .vc-a1 { animation: vc-rise 1s cubic-bezier(0.16,1,0.3,1) both; }
  .vc-a2 { animation: vc-rise 1s cubic-bezier(0.16,1,0.3,1) .14s both; }
  .vc-a3 { animation: vc-rise 1s cubic-bezier(0.16,1,0.3,1) .28s both; }
  .vc-a4 { animation: vc-rise 1s cubic-bezier(0.16,1,0.3,1) .42s both; }
  .vc-a5 { animation: vc-rise 1s cubic-bezier(0.16,1,0.3,1) .56s both; }
`;
document.head.appendChild(_sc);

const miniBarData = [10, 18, 14, 26, 22, 34, 30, 44, 38, 55, 48, 70];
const pipes = [
  { name: "Enterprise", pct: 88, val: "$2.4M" },
  { name: "Mid-Market", pct: 60, val: "$890K" },
  { name: "Growth", pct: 40, val: "$340K" },
];

export function LandingPage() {
  return (
    <div className="vc">
      <div className="vc-light vc-light-1" />
      <div className="vc-light vc-light-2" />

      {/* NAV */}
      <nav className="vc-nav">
        <div className="vc-logo">Enterprise<span className="vc-logo-dot">.</span>CRM</div>
        <div className="vc-nav-c">
          <a href="#">Platform</a>
          <a href="#">Pricing</a>
          <a href="#">Docs</a>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <SignedOut>
            <Link href="/sign-in"><a className="vc-btn">Sign In</a></Link>
            <Link href="/sign-up"><a className="vc-btn vc-btn-fill">Get Started <ArrowUpRight size={11} /></a></Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard"><a className="vc-btn vc-btn-fill">Dashboard <ArrowUpRight size={11} /></a></Link>
          </SignedIn>
        </div>
        <div className="vc-nav-border" />
      </nav>

      {/* HERO */}
      <section className="vc-hero">
        <div className="vc-hero-body">
          <div className="vc-hero-l">
            <div className="vc-ornament vc-a1">Revenue Operations Platform</div>
            <h1 className="vc-hero-h vc-a2">
              The<br />
              <em>Operating</em><br />
              System<br />
              for Sales
            </h1>
            <p className="vc-hero-sub vc-a3">
              A unified intelligence layer that transforms fragmented customer
              data into structured revenue architecture. Built for teams
              who refuse to accept opacity in their pipeline.
            </p>
            <div className="vc-cta-row vc-a4">
              <SignedOut>
                <Link href="/sign-up"><a className="vc-btn vc-btn-fill">Begin Free Trial <ArrowUpRight size={11} /></a></Link>
                <Link href="/sign-in"><a className="vc-btn">Sign In</a></Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard"><a className="vc-btn vc-btn-fill">Open Dashboard <ArrowUpRight size={11} /></a></Link>
              </SignedIn>
              <span className="vc-cta-note">No card required</span>
            </div>
          </div>
          <div className="vc-hero-r vc-a5">
            {/* Revenue card */}
            <div className="vc-card">
              <div className="vc-card-lbl">Total Pipeline Value</div>
              <div className="vc-card-top">
                <div className="vc-card-val">$3.8M</div>
                <span className="vc-card-delta">↑ 24% YoY</span>
              </div>
              <div className="vc-mini-bars">
                {miniBarData.map((h, i) => (
                  <div key={i} className={`vc-mini-bar ${i >= miniBarData.length - 2 ? "hi" : ""}`} style={{ height: `${h / 70 * 100}%` }} />
                ))}
              </div>
            </div>
            {/* Pipeline card */}
            <div className="vc-card">
              <div className="vc-card-lbl">Deal Stages</div>
              {pipes.map(p => (
                <div className="vc-pipe-row" key={p.name}>
                  <span className="vc-pipe-name">{p.name}</span>
                  <div className="vc-pipe-track">
                    <div className="vc-pipe-fill" style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="vc-pipe-val">{p.val}</span>
                </div>
              ))}
            </div>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--line)", border: "1px solid var(--line)" }}>
              {[["142", "Accounts"], ["68%", "Win Rate"]].map(([v, l]) => (
                <div key={l} style={{ background: "var(--char)", padding: "1.5rem" }}>
                  <div className="vc-card-val" style={{ fontSize: "1.9rem" }}>{v}</div>
                  <div className="vc-card-lbl" style={{ marginBottom: 0 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="vc-features-wrap">
        <div className="vc-sec-eyebrow">Core Ecosystem</div>
        <h2 className="vc-sec-h">
          Built for <em>clarity.</em><br />
          Engineered for precision.
        </h2>
        <div className="vc-feats-grid">
          {[
            { n: "01", title: "Relationship", ti: "Intelligence", desc: "Deep contact mapping with contextual history, relationship graphs, and predictive scoring." },
            { n: "02", title: "Pipeline", ti: "Cartography", desc: "Visual pipeline that renders your entire sales architecture in one fluid, spatial interface." },
            { n: "03", title: "Sovereign", ti: "Data", desc: "Bank-grade encryption at rest and in transit. Role-based access. Full audit trails." },
            { n: "04", title: "Velocity", ti: "Analytics", desc: "Cycle time analysis and win-rate forecasting that reveals the levers driving revenue." },
          ].map(f => (
            <div className="vc-feat" key={f.n}>
              <div className="vc-feat-line" />
              <div className="vc-feat-n">{f.n}</div>
              <div className="vc-feat-title">{f.title} <em>{f.ti}</em></div>
              <p className="vc-feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QUOTE */}
      <div className="vc-quote-wrap">
        <p className="vc-quote-l">
          "We replaced three separate tools and closed our best quarter in five years.
          The pipeline visibility alone changed how we run our entire go-to-market motion."
        </p>
        <div className="vc-quote-r">
          <div className="vc-quote-attr">
            <span className="vc-quote-attr-name">Sarah Chen</span>
            <span>VP Sales · Kube-IQ</span>
          </div>
          <div className="vc-quote-stats">
            {[["↑68%", "Win Rate"], ["+$2M", "New ARR"], ["−14d", "Sales Cycle"], ["3→1", "Tools Consolidated"]].map(([v, l]) => (
              <div className="vc-q-stat" key={l}>
                <div className="vc-q-stat-v">{v}</div>
                <div className="vc-q-stat-l">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LOGOS */}
      <div className="vc-logos">
        <span className="vc-logos-lbl">Trusted by</span>
        {["PROTECT", "KUBE–IQ", "FLASH", "DATA–X", "MERIDIAN", "AXIOM"].map(l => (
          <span className="vc-logo-item" key={l}>{l}</span>
        ))}
      </div>

      {/* CTA */}
      <div className="vc-cta">
        <div className="vc-cta-ring vc-cta-ring-1" />
        <div className="vc-cta-ring vc-cta-ring-2" />
        <div className="vc-cta-ring vc-cta-ring-3" />
        <h2 className="vc-cta-h">
          Your pipeline deserves<br />
          <em>better infrastructure.</em>
        </h2>
        <p className="vc-cta-sub">
          Start free. No credit card required. Full platform access
          for 14 days — then choose a plan that scales with your team.
        </p>
        <div className="vc-cta-btns">
          <SignedOut>
            <Link href="/sign-up"><a className="vc-btn vc-btn-fill">Start Free Trial <ArrowUpRight size={11} /></a></Link>
            <Link href="/sign-in"><a className="vc-btn">Sign In</a></Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard"><a className="vc-btn vc-btn-fill">Open Dashboard <ArrowUpRight size={11} /></a></Link>
          </SignedIn>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="vc-footer">
        <div className="vc-footer-logo">Enterprise.CRM</div>
        <div className="vc-footer-links">
          <a href="#">Documentation</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Github</a>
        </div>
        <div className="vc-footer-copy">© 2026 Enterprise CRM Ecosystem</div>
      </footer>
    </div>
  );
}