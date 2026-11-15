import Link from "next/link";
import { ArrowUpRight, Check, Compass, Layers3, Network, Radar, Scale, ShieldCheck, Waypoints } from "lucide-react";
import { getLandingContent } from "./landing-content";

type LandingSectionsProps = { locale: string };

function SectionHeading({ id, eyebrow, title, body }: { id: string; eyebrow: string; title: string; body: string }) {
  return (
    <div className="atlas-section-heading">
      <p className="atlas-eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      <p className="atlas-section-intro">{body}</p>
    </div>
  );
}

function SignalMap({ locale, labels }: { locale: string; labels: readonly string[] }) {
  const isFa = locale === "fa";
  return (
    <div className="atlas-map" role="img" aria-label={isFa ? "نمودار مفهومی از ارتباط محصول، شواهد و فرصت‌های بهبود" : "Concept diagram connecting an offer, evidence, and improvement opportunities"}>
      <div className="atlas-map-topline">
        <span className="atlas-map-kicker">OX / SIGNAL MAP</span>
        <span className="atlas-map-index">CONCEPT 01</span>
      </div>
      <svg className="atlas-map-svg" viewBox="0 0 620 390" aria-hidden="true">
        <defs>
          <linearGradient id="atlas-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#167c80" stopOpacity="0.16" />
            <stop offset="55%" stopColor="#167c80" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#d18b4e" stopOpacity="0.65" />
          </linearGradient>
          <radialGradient id="atlas-node">
            <stop offset="0%" stopColor="#74c3bb" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#74c3bb" stopOpacity="0.04" />
          </radialGradient>
        </defs>
        <g fill="none" stroke="url(#atlas-line)" strokeWidth="1.6">
          <path d="M310 184 C230 115 172 104 106 90" /><path d="M310 184 C398 104 464 113 532 72" />
          <path d="M310 184 C223 246 166 278 82 310" /><path d="M310 184 C401 247 470 282 548 306" />
          <path d="M106 90 C176 24 250 26 310 76" strokeDasharray="4 7" />
          <path d="M532 72 C456 18 380 28 310 76" strokeDasharray="4 7" />
          <path d="M82 310 C164 366 239 360 310 316" strokeDasharray="4 7" />
          <path d="M548 306 C466 366 388 360 310 316" strokeDasharray="4 7" />
          <path d="M106 90 C85 177 104 244 82 310" strokeOpacity="0.35" />
          <path d="M532 72 C558 164 529 238 548 306" strokeOpacity="0.35" />
        </g>
        <g fill="url(#atlas-node)">
          <circle cx="106" cy="90" r="35" /><circle cx="532" cy="72" r="35" /><circle cx="82" cy="310" r="35" /><circle cx="548" cy="306" r="35" />
        </g>
        <g fill="none" stroke="#167c80" strokeWidth="1.5">
          <circle cx="106" cy="90" r="8" /><circle cx="532" cy="72" r="8" /><circle cx="82" cy="310" r="8" /><circle cx="548" cy="306" r="8" />
        </g>
        <circle cx="310" cy="184" r="92" fill="url(#atlas-node)" opacity="0.42" />
        <circle cx="310" cy="184" r="62" fill="none" stroke="#167c80" strokeOpacity="0.45" strokeDasharray="3 7" />
        <circle cx="310" cy="184" r="42" fill="#167c80" fillOpacity="0.12" stroke="#167c80" strokeWidth="1.6" />
        <path d="M310 151 L343 184 L310 217 L277 184 Z" fill="#167c80" fillOpacity="0.16" stroke="#167c80" strokeWidth="1.4" />
        <circle cx="310" cy="184" r="7" fill="#d18b4e" />
        <g fill="#d18b4e"><circle cx="106" cy="90" r="3" /><circle cx="532" cy="72" r="3" /><circle cx="82" cy="310" r="3" /><circle cx="548" cy="306" r="3" /></g>
      </svg>
      <div className="atlas-map-center"><span>OFFER</span><strong>{isFa ? "زمینه محصول" : "Product context"}</strong></div>
      <div className="atlas-map-label atlas-map-label-one"><span>01</span><strong>{labels[0]}</strong></div>
      <div className="atlas-map-label atlas-map-label-two"><span>02</span><strong>{labels[1]}</strong></div>
      <div className="atlas-map-label atlas-map-label-three"><span>03</span><strong>{labels[2]}</strong></div>
      <div className="atlas-map-footer">
        <span><i className="atlas-dot atlas-dot-teal" /> {isFa ? "زمینه" : "Context"}</span>
        <span><i className="atlas-dot atlas-dot-amber" /> {isFa ? "بینش" : "Insight"}</span>
        <span className="atlas-concept-label">{isFa ? "نمای مفهومی" : "Conceptual view"}</span>
      </div>
    </div>
  );
}

export function LandingSections({ locale }: LandingSectionsProps) {
  const t = getLandingContent(locale);
  const isFa = locale === "fa";
  const tracks = t.tracks.items;
  const steps = t.method.steps;
  const offerTypes = t.offers.types;
  const evidenceItems = t.evidence.items;

  return (
    <main id="main-content" className="atlas-main" tabIndex={-1}>
      <section className="atlas-hero" aria-labelledby="atlas-hero-title">
        <div className="atlas-hero-orbit atlas-hero-orbit-one" aria-hidden="true" />
        <div className="atlas-hero-orbit atlas-hero-orbit-two" aria-hidden="true" />
        <div className="atlas-container atlas-hero-grid">
          <div className="atlas-hero-copy">
            <p className="atlas-eyebrow"><span className="atlas-eyebrow-mark" aria-hidden="true" />{t.hero.eyebrow}</p>
            <h1 id="atlas-hero-title">{t.hero.title}<span>{t.hero.titleAccent}</span></h1>
            <p className="atlas-hero-body">{t.hero.body}</p>
            <div className="atlas-hero-actions">
              <Link className="atlas-button atlas-button-primary" href={"/" + locale + "/register"}>{t.hero.primary}<ArrowUpRight size={17} aria-hidden="true" /></Link>
              <a className="atlas-button atlas-button-secondary" href="#approach">{t.hero.secondary}<Compass size={16} aria-hidden="true" /></a>
            </div>
            <p className="atlas-auth-note"><ShieldCheck size={15} aria-hidden="true" />{t.hero.accessNote}</p>
          </div>
          <div className="atlas-hero-visual">
            <div className="atlas-visual-caption"><span>{t.hero.visualEyebrow}</span><span>FA / EN · 01</span></div>
            <SignalMap locale={locale} labels={t.hero.visualNodes} />
            <p className="atlas-visual-note">{t.hero.visualNote}</p>
          </div>
        </div>
        <div className="atlas-container atlas-hero-bottom" aria-hidden="true">
          <span>{isFa ? "هوشمندی محصول" : "PRODUCT INTELLIGENCE"}</span><span className="atlas-bottom-line" />
          <span>{isFa ? "زمینه بازار" : "MARKET CONTEXT"}</span><span className="atlas-bottom-line" />
          <span>{isFa ? "مسیر بهبود" : "IMPROVEMENT DIRECTION"}</span>
        </div>
      </section>

      <section id="tracks" className="atlas-section atlas-tracks" aria-labelledby="atlas-tracks-title">
        <div className="atlas-container">
          <SectionHeading id="atlas-tracks-title" eyebrow={t.tracks.eyebrow} title={t.tracks.title} body={t.tracks.body} />
          <div className="atlas-track-grid">
            {tracks.map((track) => {
              const Icon = track.id === "digital" ? Radar : Scale;
              return (
                <article className="atlas-track-card" key={track.id}>
                  <div className="atlas-card-topline"><span className="atlas-card-number">{track.number}</span><span className="atlas-card-icon"><Icon size={21} aria-hidden="true" /></span></div>
                  <h3>{track.title}</h3>
                  <p className="atlas-card-description">{track.description}</p>
                  <ul className="atlas-check-list">
                    {track.points.map((point) => <li key={point}><Check size={15} aria-hidden="true" /><span>{point}</span></li>)}
                  </ul>
                  <p className="atlas-card-note">{track.note}</p>
                </article>
              );
            })}
          </div>
          <div className="atlas-service-model">
            <div className="atlas-service-model-head"><span className="atlas-mini-label">{t.serviceModel.standalone}</span><span className="atlas-service-divider" aria-hidden="true" /><span className="atlas-mini-label atlas-mini-label-accent">{t.serviceModel.bundle}</span></div>
            <h3>{t.serviceModel.title}</h3>
            <p>{t.serviceModel.body}</p>
            <p className="atlas-service-footnote">{t.serviceModel.comprehensive}</p>
          </div>
        </div>
      </section>

      <section id="approach" className="atlas-section atlas-approach" aria-labelledby="atlas-approach-title">
        <div className="atlas-container">
          <SectionHeading id="atlas-approach-title" eyebrow={t.method.eyebrow} title={t.method.title} body={t.method.body} />
          <ol className="atlas-method-grid">
            {steps.map((step, index) => (
              <li className="atlas-method-card" key={step.number}>
                <div className="atlas-method-top"><span>{step.number}</span>
                  {index === 0 ? <Compass size={18} aria-hidden="true" /> : index === 1 ? <Layers3 size={18} aria-hidden="true" /> : index === 2 ? <Radar size={18} aria-hidden="true" /> : index === 3 ? <Network size={18} aria-hidden="true" /> : <Waypoints size={18} aria-hidden="true" />}
                </div>
                <h3>{step.title}</h3><p>{step.description}</p>
              </li>
            ))}
          </ol>
          <div className="atlas-method-baseline"><span className="atlas-baseline-symbol" aria-hidden="true">↗</span><p>{isFa ? "خروجی هر مرحله باید با دامنه، منبع و محدودیت‌های اطلاعات موجود خوانده شود." : "Each stage should be read together with the scope, sources, and limitations of the available information."}</p></div>
        </div>
      </section>

      <section id="offers" className="atlas-section atlas-offers" aria-labelledby="atlas-offers-title">
        <div className="atlas-container atlas-offers-grid">
          <div className="atlas-offers-copy">
            <p className="atlas-eyebrow">{t.offers.eyebrow}</p><h2 id="atlas-offers-title">{t.offers.title}</h2><p className="atlas-section-intro">{t.offers.body}</p>
            <div className="atlas-audience-block"><h3>{t.offers.audienceTitle}</h3>
              <ul className="atlas-audience-list">{t.offers.audience.map((item) => <li key={item}><Check size={14} aria-hidden="true" />{item}</li>)}</ul>
            </div>
            <p className="atlas-offers-note">{t.offers.channelNote}</p>
          </div>
          <div className="atlas-offer-type-list">
            {offerTypes.map((item, index) => <article className="atlas-offer-type" key={item.title}><span className="atlas-offer-type-number">0{index + 1}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></article>)}
          </div>
        </div>
      </section>

      <section id="evidence" className="atlas-section atlas-evidence" aria-labelledby="atlas-evidence-title">
        <div className="atlas-container">
          <SectionHeading id="atlas-evidence-title" eyebrow={t.evidence.eyebrow} title={t.evidence.title} body={t.evidence.body} />
          <div className="atlas-evidence-grid">
            {evidenceItems.map((item, index) => <article className="atlas-evidence-card" key={item.title}><span className="atlas-evidence-index">0{index + 1}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}
          </div>
          <div className="atlas-unknown-note"><span className="atlas-unknown-mark">?</span><p>{t.evidence.note}</p></div>
        </div>
      </section>

      <section className="atlas-section atlas-boundaries" aria-labelledby="atlas-boundaries-title">
        <div className="atlas-container atlas-boundaries-inner">
          <div className="atlas-boundaries-heading"><span className="atlas-boundaries-icon"><ShieldCheck size={22} aria-hidden="true" /></span><p className="atlas-eyebrow">{t.boundaries.eyebrow}</p><h2 id="atlas-boundaries-title">{t.boundaries.title}</h2></div>
          <ul className="atlas-boundary-list">{t.boundaries.items.map((item) => <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>)}</ul>
        </div>
      </section>

      <section id="start" className="atlas-closing" aria-labelledby="atlas-closing-title">
        <div className="atlas-container atlas-closing-inner">
          <div><p className="atlas-eyebrow">{t.closing.eyebrow}</p><h2 id="atlas-closing-title">{t.closing.title}</h2><p>{t.closing.body}</p></div>
          <div className="atlas-closing-actions">
            <Link className="atlas-button atlas-button-primary" href={"/" + locale + "/register"}>{t.closing.primary}<ArrowUpRight size={17} aria-hidden="true" /></Link>
            <Link className="atlas-button atlas-button-secondary" href={"/" + locale + "/login"}>{t.closing.secondary}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
