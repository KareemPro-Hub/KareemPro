"use client";

import { useState, useTransition, Fragment, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import RiyalIcon from "@/app/components/RiyalIcon";
import CheckIcon from "@/app/components/CheckIcon";
import { acceptProposal, rejectProposal } from "./proposal-actions";
import "./portal-dashboard.css";

function AboutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16.5" />
      <circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
function TeamIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3" />
      <path d="M6 20c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="4.5" cy="9.5" r="1.8" />
      <circle cx="19.5" cy="9.5" r="1.8" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3-6.2 7-6.2s7 2.6 7 6.2" />
    </svg>
  );
}
function PortfolioIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <line x1="3" y1="12.5" x2="21" y2="12.5" />
    </svg>
  );
}
function QuoteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 8.5c-2 0-3.2 1.4-3.2 3.4C3.8 14 5 15.3 6.6 15.3c1 0 1.4 1 .7 1.9-1 1.3-2.5 1.9-2.5 1.9" />
      <path d="M16 8.5c-2 0-3.2 1.4-3.2 3.4 0 2.1 1.2 3.4 2.8 3.4 1 0 1.4 1 .7 1.9-1 1.3-2.5 1.9-2.5 1.9" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4" />
      <line x1="8.5" y1="13" x2="15.5" y2="13" />
      <line x1="8.5" y1="16.5" x2="13.5" y2="16.5" />
    </svg>
  );
}

// Full step list. Blogger proposals skip "portfolio" (نماذج أعمالنا) — the
// deal is already agreed by phone before the client ever opens this link, so
// there's no need to sell them on past work samples. Filtered per-render
// below into `steps`, keyed by id (not index) so removing a step doesn't
// shift anything else.
const ALL_STEPS = [
  { id: "about", label: "تعرّف علينا", Icon: AboutIcon },
  { id: "portfolio", label: "نماذج أعمالنا", Icon: PortfolioIcon },
  { id: "team", label: "الفريق", Icon: TeamIcon },
  { id: "testimonials", label: "آراء عملائنا", Icon: QuoteIcon },
  { id: "proposal", label: "العرض الفني والمالي", Icon: DocIcon },
];

// Team roster (hub-and-spoke satellites around the founder). Grows as names
// are sent over; the diagram always renders exactly this many satellites —
// no padding to match any external reference count. Real photos are added
// per member once provided (generic icon placeholder until then).
const TEAM_MEMBERS = [
  { name: "سليمان حسن", role: "AI Specialist", photo: "/team/suleiman-hassan.jpg" },
  { name: "جويرية هاني", role: "Digital Platforms Developer", photo: "/team/gawriya-hani.jpg" },
  { name: "أحمد شاهين", role: "Creative Video Editor", photo: "/team/ahmed-shahin.jpg" },
  { name: "أسماء المقدم", role: "Social Media Specialist", photo: "/team/asmaa-elmoqaddem.jpg" },
  { name: "مريم أحمد", role: "Graphic & Visual Designer", photo: "/team/mariam-ahmed.jpg" },
  { name: "ندى رحيم", role: "Office Documentation Specialist", photo: "/team/nada-rahim.jpg" },
];
// Programming offers show programming job titles (approved by Kareem
// 2026-09-25). Every other service keeps the titles in TEAM_MEMBERS.
const PROGRAMMING_SERVICES = new Set(["pharmacy", "link", "platform", "platform-apps"]);
const PROGRAMMING_ROLES = {
  "أحمد شاهين": "Web Developer",
  "أسماء المقدم": "Growth Marketer",
  "مريم أحمد": "UI/UX Designer",
  "ندى رحيم": "Full Stack Developer",
};
const PORTFOLIO_COVERS={"مونتاج احترافي":["https://img.youtube.com/vi/X4k2BYJuKbk/hqdefault.jpg"],"عرض مرئي":["https://img.youtube.com/vi/XA5TXQpjNrc/hqdefault.jpg"],"تعليق صوتي":["https://img.youtube.com/vi/g94wHiCSEDk/hqdefault.jpg"],"ريلز وسناب":["https://img.youtube.com/vi/zhNVbDO2lcw/hqdefault.jpg","https://img.youtube.com/vi/OG7rtRnAjvQ/hqdefault.jpg","https://img.youtube.com/vi/lMWqyAV96SI/hqdefault.jpg"]};
const PORTFOLIO_DESCRIPTIONS={"مونتاج احترافي":"مونتاج احترافي يصنع من كل لقطة قصة تستحق المشاهدة.","عرض مرئي":"نصنع من فكرتك عرضًا بصريًا يترك أثرًا لا يُنسى.","تعليق صوتي":"نمنح عملك صوتًا يليق بقيمته.","ريلز وسناب":"نستخرج من التفاصيل الصغيرة قصة تستحق المشاهدة.","منصات وتطبيقات":"نحوّل فكرتك إلى منصة رقمية تليق بقيمة مشروعك.",
// Five individual works (not categories) shown only in the editing-course
// funnel — see COURSE_PORTFOLIO_TITLES below. Each one is its own
// portfolio_items row whose title doubles as the key here.
"جائزة الطائف للعمل المجتمعي":"حين يلتقي العطاء بالهيبة — فيديو توثيقي يدمج وقار الصوت الرجالي الرخيم بفخامة الإخراج البصري، بحضور سمو أمير الطائف.",
"فيديو تعريفي وطني للطلاب":"فيديو يدمج بين هيبة المناسبة الوطنية وبراءة الطفولة، بمونتاج سلس وجاذبية بصرية عالية.",
"مبادرة بقيمي أرتقي":"توثيق إبداعي فخم يختزل نجاح المبادرة، بمونتاج نابض بالحياة يبرز قيمة العمل المجتمعي الأصيل.",
"تكريم مسيرة تعليمية":"ختام مسيرة تفيض بالنور، احتفاء بعقود من العطاء في ميدان التعليم.",
"شركة المنظومة العربية":"ملحمة بصرية تحتفي بمسيرة 94 عاما من المجد، بأداء صوتي مهيب ومونتاج سينمائي يدمج عراقة الماضي بطموح المستقبل."};

// Hub-and-spoke team diagram: a center "founder" avatar with satellite
// member avatars that burst outward from the center the first time the
// diagram scrolls into view (measured in real pixels via ResizeObserver so
// it stays correct at any container width, then animated with a staggered
// CSS transition) — same interaction as the reference design.
// Icons for the LINK "why us" cards, keyed by the point label so reordering
// the copy keeps each icon on its own point. Unknown labels get a spark.
const WHY_ICONS = {
  "جرّب قبل أن تقرّر": <><path d="M5 3l14 9-6 1.5L10 20z" /><path d="M13 13.5l4.5 4.5" /></>,
  "كود بلا عمولة": <><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3M15 8l2 2" /></>,
  "شفافية كاملة": <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  "التزام بالموعد": <><rect x="3" y="4.5" width="18" height="16.5" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /><path d="M8.8 15l2.2 2.2 4.4-4.4" /></>,
  "تقنيات عالمية": <><rect x="6.5" y="2" width="11" height="20" rx="2.5" /><path d="M10.5 18.5h3" /></>,
  "منصة تبيع وأنت نائم": <><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z" /></>,
  "تصميم يُقنع": <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></>,
  "نحن شركاء طموحك": <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17" cy="9" r="2.8" /><path d="M16.5 14.2c2.9.3 5 2.5 5 5.8" /></>,
};
const WHY_FALLBACK_ICON = <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />;

function WhyIcon({ label }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {WHY_ICONS[label] || WHY_FALLBACK_ICON}
    </svg>
  );
}

// Programming-era "about us" layout (option B, approved 2026-09-25): an
// editorial side column (headline + promise) beside a numbered 01–08 list.
// Used for LINK only for now. Collapses to one column on phones.
function WhyKareemPro({ title, points }) {
  const hl = "منصتك";
  const t = title || "لماذا تبني منصتك معنا ؟";
  const at = t.indexOf(hl);
  return (
    <section className="why-kp">
      <div className="why-kp-side">
        <div className="why-kp-kicker">— WHY US</div>
        <h2 className="why-kp-title">
          {at === -1 ? t : (<>{t.slice(0, at)}<em>{hl}</em>{t.slice(at + hl.length)}</>)}
        </h2>
        <p className="why-kp-lead">نلتزم بها معك من أول يوم، ونثبتها بمنصات حيّة تفتحها الآن بنفسك.</p>
        <div className="why-kp-seal">
          <b>{points.length}</b>
          <span>التزامات واضحة<br />من أول يوم حتى ما بعد التسليم</span>
        </div>
      </div>
      <ol className="why-kp-list">
        {points.map((p, i) => (
          <li className={`why-kp-item${i < 2 ? " is-top" : ""}`} key={p.label}>
            <span className="why-kp-num">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3><WhyIcon label={p.label} />{p.label}</h3>
              <p>{p.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Programming offers' "نماذج أعمالنا" step (design #3 «نوافذ متصفح حيّة»,
// approved by Kareem 2026-09-25): every live project inside a browser frame
// with its real domain, a LIVE badge and a direct "try it" link. Same six
// projects and copy as the homepage gallery (public/index.html) — keep both
// in sync. Images are the same public/*-preview.webp files.
const PROGRAMMING_WORKS = [
  { cat: "منصة تعليمية", host: "qudratmaghrabi.com", url: "https://www.qudratmaghrabi.com/", title: "منصة قدرات المغربي", desc: "منصة متخصصة في اختبار القدرات الكمي: كورسات، اشتراكات، متابعة طلاب، ولوحة تحكم كاملة للمدرّب.", tags: ["Next.js", "Supabase", "Payments"], img: "/qudrat-preview.webp" },
  { cat: "تطبيق iOS", host: "App Store", url: "https://apps.apple.com/us/app/%D9%82%D8%AF%D8%B1%D8%A7%D8%AA-%D8%A7%D9%84%D9%85%D8%BA%D8%B1%D8%A8%D9%8A/id6799747012?l=ar", title: "تطبيق قدرات المغربي", desc: "تطبيق أيفون منشور فعليًا على App Store — نفس محتوى المنصة بتجربة أصلية وسرعة أعلى.", tags: ["Swift", "SwiftUI", "App Store"], img: "/qudrat-app-preview.webp", app: true },
  { cat: "موقع تعريفي", host: "ebda3-media.com", url: "https://ebda3-media.com/", title: "Ebda3 Media", desc: "موقع تعريفي لوكالة إبداعية بهوية داكنة أنيقة وتصفّح سلس — من تصميمنا وبرمجتنا بالكامل.", tags: ["Next.js", "Responsive"], img: "/ebda3-preview.webp" },
  { cat: "مدونة ربحية", host: "kareemwallet.com", url: "https://www.kareemwallet.com/", title: "محفظة كريم", desc: "مدونة ربحية كاملة: قالب مخصص، هيكلة أقسام، سيو، ومحتوى مهيّأ للقبول في أدسنس.", tags: ["Blogger", "SEO", "AdSense"], img: "/kareemwallet-preview.webp" },
  { cat: "مدونة ذكاء اصطناعي", host: "ai-bander.com", url: "https://www.ai-bander.com/", title: "مدونة الذكاء الاصطناعي", desc: "مدونة عربية متخصصة في الذكاء الاصطناعي وأدواته وأخباره: تصميم مخصص، هيكلة سيو، ووضع ليلي وتصفّح سريع على الموبايل.", tags: ["Blogger", "SEO", "Responsive"], img: "/bandar-blog-shot.webp" },
  { cat: "مدونة تقنية", host: "ikareempro.com", url: "https://www.ikareempro.com/", title: "iKareem", desc: "مدونة تقنية بتصميم مخصص: شروحات الذكاء الاصطناعي والماك والآيفون، بهيكلة سيو كاملة وتصفّح سريع على الموبايل.", tags: ["Blogger", "SEO", "Responsive"], img: "/ikareem-blog-shot.webp" },
];

function LiveWorks() {
  return (
    <section className="live-works">
      <div className="live-works-head">
        <h2>لا نعرض صور .. نعرض <em>منصات حيّة</em></h2>
        <p>افتح أي مشروع، وقيّم شغلنا بنفسك.</p>
      </div>
      <div className="live-works-grid">
        {PROGRAMMING_WORKS.map((w) => (
          <article className="lw-win" key={w.title}>
            <div className="lw-bar">
              <i /><i /><i />
              <span className="lw-url">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                <span>{w.host}</span>
              </span>
              <span className="lw-live">LIVE</span>
            </div>
            <a className="lw-shot" href={w.url} target="_blank" rel="noopener noreferrer" aria-label={`افتح ${w.title}`}>
              <img src={w.img} alt={w.title} loading="lazy" width="1400" height="875" />
            </a>
            <div className="lw-body">
              <span className="lw-cat">{w.cat}</span>
              <h3>{w.title}</h3>
              <p>{w.desc}</p>
              <div className="lw-foot">
                <div className="lw-tags">{w.tags.map((t) => <span key={t}>{t}</span>)}</div>
                <a className="lw-cta" href={w.url} target="_blank" rel="noopener noreferrer">
                  {w.app ? "حمّل التطبيق" : "جرّب الموقع الحي"}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8.5 7H17v8.5" /></svg>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TeamOrbit({ members, centerPhoto, centerName, centerRole }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setSize(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Matches the approved 1300×1210 composition: satellites sit roughly
  // 30% of the board width away from the founder.
  const radius = size * 0.3;
  const angleFor = (i) => (i / members.length) * 2 * Math.PI - Math.PI / 2;

  return (
    <div className="team-orbit" ref={containerRef}>
      <div className="team-heading team-heading-compact">
        <h2 className="title">فريق يصنع الفرق</h2>
        <p className="muted">نخبة من المبدعين يعملون بشغف لتقديم أفضل النتائج</p>
      </div>
      {/* Creative layer (desktop only — hidden on phones in CSS): two
          slowly rotating orbit rings sized to the real satellite radius, and
          animated dashed links from the founder to each member. Purely
          decorative, so aria-hidden and pointer-events:none. */}
      {size > 0 && (
        <div className={`team-orbit-fx${visible ? " is-on" : ""}`} aria-hidden="true">
          <span className="team-ring team-ring-a" style={{ width: radius * 2, height: radius * 2 }} />
          <span className="team-ring team-ring-b" style={{ width: radius * 2.25, height: radius * 2.25 }} />
          <svg className="team-links" viewBox={`0 0 ${size} ${size * (1210 / 1300)}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="teamLinkGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffad38" />
                <stop offset="100%" stopColor="#e2366f" />
              </linearGradient>
            </defs>
            {members.map((_, i) => {
              const a = angleFor(i);
              return (
                <line
                  key={i}
                  x1={size / 2}
                  y1={(size * (1210 / 1300)) / 2}
                  x2={size / 2 + radius * Math.cos(a)}
                  y2={(size * (1210 / 1300)) / 2 + radius * Math.sin(a)}
                  style={{ transitionDelay: `${300 + i * 80}ms` }}
                />
              );
            })}
          </svg>
        </div>
      )}
      <div className="team-avatar team-avatar-center" style={{ backgroundImage: `url(${centerPhoto})` }}>
        <span className="team-crown">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 8l4 3 5-6 5 6 4-3-2 11H5L3 8Z" />
          </svg>
        </span>
      </div>
      <div className="team-orbit-satellites">
        {members.map((m, i) => {
          const angle = angleFor(i);
          const dx = radius * Math.cos(angle);
          const dy = radius * Math.sin(angle);
          return (
            <div
              key={i}
              className={`team-avatar team-avatar-satellite${m.photo ? " has-photo" : ""}`}
              style={{
                transform: visible
                  ? `translate(-50%, -50%) translate(${dx}px, ${dy}px)`
                  : "translate(-50%, -50%) translate(0, 0)",
                opacity: visible ? 1 : 0,
                transitionDelay: `${i * 80}ms`,
              }}
            >
              {/* The circular photo lives in its own inner box (rather than
                  as a background-image on this outer positioning div) so
                  that on mobile — where this whole box switches from
                  absolute radial placement to a plain flex column — the
                  photo can stay a fixed 76×76 circle while the caption
                  below it sizes naturally in normal flow. Putting the image
                  directly on the outer (auto-height) box would stretch it
                  into an oval as soon as the caption pushed the box taller. */}
              <div
                className="team-avatar-satellite-photo"
                style={m.photo ? { backgroundImage: `url(${m.photo})` } : undefined}
              >
                {!m.photo && <PersonIcon />}
              </div>
              {m.name && (
                <div className="team-satellite-caption">
                  <div className="team-satellite-name">{m.name}</div>
                  {m.role && <div className="team-satellite-role">{m.role}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="team-founder-caption">
        <div className="team-founder-name">{centerName}</div>
        <div className="team-founder-role">{centerRole}</div>
      </div>
    </div>
  );
}

// Detects which of Kareem Pro's service lines a proposal belongs to, from
// its project title (and, once picked, the package name) — so the contract
// wording and the "ملاحظة مهمة" cost note speak the client's own language
// instead of always defaulting to generic "منصة رقمية" phrasing. Keyword
// heuristic on purpose (no formal service-type field on proposals yet).
// ── Premium crown ──
// Marks the single line that makes the top tier worth its price (the 50-article
// promise on the Blogger ladder). An SVG, not an emoji, so it inherits the
// card's own gold and stays crisp at any size — same rule as every other icon
// in the portal.
function CrownIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ flexShrink: 0, marginInlineStart: "5px", verticalAlign: "-2px", color: "#ffc266" }}
    >
      <path d="M3 8.2a1.3 1.3 0 1 1 1.72 1.23l1.2 4.02h12.16l1.2-4.02A1.3 1.3 0 1 1 21 8.2a1.3 1.3 0 0 1-.77 1.19l-2.2 1.53-2.9-3.63a1.3 1.3 0 1 0-2.26-.02L12 8.9l-.87-1.63a1.3 1.3 0 1 0-2.26.02l-2.9 3.63-2.2-1.53A1.3 1.3 0 0 1 3 8.2Z" />
      <path d="M5.6 15.45h12.8a.9.9 0 0 1 .9.9v.6a.9.9 0 0 1-.9.9H5.6a.9.9 0 0 1-.9-.9v-.6a.9.9 0 0 1 .9-.9Z" />
    </svg>
  );
}

// Renders a string in which ** … ** marks the part to emphasise, so a tagline
// can bold just the words that set its tier apart ("بمحتوى كامل") instead of
// the whole line.
function withInlineBold(text) {
  return String(text || "")
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
}

// ── Blogger "full content" tier ──
// On the 1,300 package our team writes and publishes all 50 articles; on the
// 750 one we write 5 and the client publishes the remaining 45. Several
// contract clauses below hinge on that difference, so they branch on this
// set. Keep it in sync with BLOGGER_FULL_CONTENT_PRICES in lib/timeline.js
// and BLOGGER_FULL_CONTENT_PRICES in lib/packageStages.js.
const BLOGGER_FULL_CONTENT_PRICES = new Set([1300]);

// ── Blogger payment plans, by package price ──
// Both Blogger tiers are paid in three instalments, but the amounts differ per
// tier (750 → 250/250/250، 1,300 → 450/450/400). Keep this in sync with the
// "طريقة السداد" line inside each package's features text in admin/actions.js.
// Article packages: [amount, "when it falls due"] per instalment, worded
// exactly like clause 7 of the articles contract below. Keep the amounts in
// sync with PACKAGE_STAGE_AMOUNTS in lib/packageStages.js.
// Editing course: [amount, "when it falls due"] per instalment, worded
// exactly like clause 7 of the course contract below. Both tiers pay in
// three, so their timelines are identical too. Keep the amounts in sync with
// PACKAGE_STAGE_AMOUNTS in lib/packageStages.js.
const COURSE_PAYMENT_PLANS = {
  600: [
    [200, "مقدم"],
    [200, "عند الحصة الرابعة"],
    [200, "عند الحصة الثامنة"],
  ],
  900: [
    [300, "مقدم"],
    [300, "عند الحصة الخامسة"],
    [300, "عند الحصة العاشرة"],
  ],
};

const ARTICLES_PAYMENT_PLANS = {
  650: [
    [350, "مقدم"],
    [300, "عند نشر المقال الخامس عشر"],
  ],
  1100: [
    [400, "مقدم"],
    [350, "عند المقال العشرين"],
    [350, "عند المقال الأربعين"],
  ],
  1750: [
    [650, "مقدم"],
    [550, "عند المقال الخامس والثلاثين"],
    [550, "عند المقال السبعين"],
  ],
};

// LINK: two packages since 2026-09-26 — المتكاملة 9,900 (one month support)
// and الذهبية 14,700 (full support for a whole year). A 2,600 settlement for
// an earlier deal is deducted from whichever is chosen (Kareem rounded it
// from 2,590 + 10 waived to a single 2,600) — net 7,300 / 12,100 in three
// milestone payments. Keyed by the listed price. Keep in sync with
// PACKAGE_STAGE_AMOUNTS / PACKAGE_SETTLEMENTS in lib/packageStages.js and the
// "طريقة السداد" lines in SERVICE_TEMPLATES.link (admin/actions.js).
const LINK_SETTLEMENT = { owed: 2600 };
const LINK_PAYMENT_PLANS = {
  9900: [
    [2500, "عند توقيع العقد"],
    [2500, "عند إطلاق منصة الويب"],
    [2300, "عند نشر التطبيقين على المتاجر"],
  ],
  14700: [
    [4100, "عند توقيع العقد"],
    [4000, "عند إطلاق منصة الويب"],
    [4000, "عند نشر التطبيقين على المتاجر"],
  ],
};
// The yearly-support package: its contract swaps the one-month support
// clause for the full-year one below.
const LINK_YEAR_SUPPORT_PRICE = 14700;

const BLOGGER_PAYMENT_PLANS = {
  750: [250, 250, 250],
  1300: [450, 450, 400],
};

function bloggerPaymentPlan(price) {
  const numericPrice = Number(price);
  const plan = BLOGGER_PAYMENT_PLANS[numericPrice];
  if (plan) return plan;
  // Unknown tier: split evenly and let the last payment absorb the remainder,
  // so the three figures always add up to exactly the package price.
  const part = Math.floor(numericPrice / 3);
  return [part, part, numericPrice - part * 2];
}

function detectServiceType(text) {
  const t = text || "";
  if (/بلوجر|blogger/i.test(t)) return "blogger";
  // Checked after blogger: an article package is sold to a client whose blog
  // already exists, so "مقال" alone identifies it. Keep in sync with
  // packageTier() in lib/timeline.js, which uses the same word.
  if (/مقال/.test(t)) return "articles";
  // Editing course: "كورس" / "حصص" are unambiguous — no other service line
  // uses either word. Checked BEFORE video so a course whose copy mentions
  // "فيديو" can never be filed as a video production job.
  if (/كورس|حصة|حصص/.test(t)) return "course";
  // LINK is checked before "تطبيق" below — its package name mentions the
  // apps too. Keep in sync with packageTier() in lib/timeline.js.
  if (/LINK/i.test(t)) return "link";
  if (/صيدلي|Urs/i.test(t)) return "pharmacy";
  if (/تعليق صوتي/i.test(t)) return "voiceover";
  if (/فيديو/i.test(t)) return "video";
  if (/تطبيق/i.test(t)) return "platform-apps";
  return "platform";
}

// "About us" copy on the funnel's first step comes from one global row in
// site_content (about_us) shared by every client. This override changes a
// single label — "سيادةٌ بصرية" → "إبداع تقني" — for the pharmacy branch
// only, without touching that shared row or any other service type. Same
// "label: text" line format the parser below already understands.
const SERVICE_ABOUT_OVERRIDES = {
  pharmacy: `هنا في Kareem Pro:
خبرةٌ تتحدث: 11 عامًا من الحرفية البصرية، التي تتجاوز حدود المألوف.
ذكاء التصميم: لا نبيع خدمةً فقط! فكل تفصيلةٍ نُسِجَتْ لتخاطب عقل عميلك، وتدفعه لاختيارك.
إبداع تقني: نصنع لعلامتك إبداعًا بصريًا وثِقلاً تقنيًا، يجبر السوق بأكمله على الالتفات إليك.`,
  // LINK: programming-only pitch (Kareem, 2026-09-25). Rendered by the
  // WhyKareemPro layout below — first two points are the featured cards.
  link: `لماذا تبني منصتك معنا ؟
جرّب قبل أن تقرّر: كل مشروع في معرضنا موقع حي تفتحه بنفسك.
كود بلا عمولة: منصتك ملكك بالكامل، باسمك وعلى نطاقك، بلا اشتراك شهري.
شفافية كاملة: تتابع كل مرحلة ودفعة وملف من لوحتك لحظة بلحظة.
التزام بالموعد: جدول تنفيذ واضح بمراحل محددة، مكتوب في عقدك.
تقنيات عالمية: iPhone وAndroid بأداء حقيقي، لا مجرد موقع داخل غلاف.
منصة تبيع وأنت نائم: تستقبل الطلبات والدفعات على مدار الساعة.
تصميم يُقنع: كل شاشة مدروسة لتقود عميلك للخطوة التالية.
نحن شركاء طموحك: نفكّر في مشروعك كأنه مشروعنا، قبل التسليم وبعده.`,
  // Article packages are sold to a client we have ALREADY delivered to, so
  // the funnel's opening step is a thank-you rather than an introduction —
  // same "label: text" format, same renderer, different job.
  articles: `شكرًا لثقتك 🤝
ثقة تُبنى على نتيجة: اخترتنا مرة، ورجعت تختارنا تاني — وده أصدق تقييم ممكن نستلمه.
عميل من طراز خاص: التعامل معك سلس وواضح ومحترم، وده بيخلّي الشغل معك متعة حقيقية.
نفس اليد، نفس المستوى: نفس الفريق اللي كتب مقالاتك الأولى هو اللي هيكمل — بنفس الروح وبنفس الجودة.`,
};

const SERVICE_META = {
  blogger: { partyRole: "صاحب مدونة بلوجر", serviceLine: "مدونة بلوجر ربحية" },
  pharmacy: { partyRole: "صاحب منصة Urs", serviceLine: "منصة SaaS لإدارة الصيدليات" },
  link: { partyRole: "صاحب منصة LINK", serviceLine: "منصة LINK السعودية (منصة ويب وتطبيقا iPhone وAndroid)" },
  voiceover: { partyRole: "صاحب التعليق الصوتي", serviceLine: "تعليق صوتي إبداعي" },
  video: { partyRole: "صاحب الفيديو", serviceLine: "فيديو سينمائي احترافي" },
  "platform-apps": { partyRole: "صاحب المنصة الرقمية", serviceLine: "منصة رقمية مع التطبيقات" },
  platform: { partyRole: "صاحب المنصة الرقمية", serviceLine: "منصة رقمية" },
  articles: { partyRole: "صاحب المدونة", serviceLine: "كتابة ونشر مقالات المدونة" },
  course: { partyRole: "المتدرب", serviceLine: "كورس مونتاج احترافي" },
};

// Five individual works shown at the FRONT of the editing-course funnel's
// "نماذج من إبداعاتنا" step, before the three category stacks. Unlike every
// other portfolio row these are single videos, not categories: each has its
// own portfolio_items row (sort_order -5..-1, so they lead the list) whose
// title is the key used by PORTFOLIO_DESCRIPTIONS above and by the course
// entry in PORTFOLIO_CATEGORIES_BY_SERVICE below. Order here is the order
// Kareem asked for.
// COURSE FUNNEL ONLY. In the course funnel every cover opens its video
// straight on YouTube instead of the site's portfolio page — these two
// category cards show one video's thumbnail, so each maps to that video.
// "ريلز وسناب" is deliberately absent: shorts keep their original link.
// Nothing here is read by any other service.
const COURSE_CATEGORY_VIDEO_LINKS = {
  "مونتاج احترافي": "https://www.youtube.com/watch?v=X4k2BYJuKbk",
  "عرض مرئي": "https://www.youtube.com/watch?v=XA5TXQpjNrc",
};

const COURSE_PORTFOLIO_TITLES = [
  "جائزة الطائف للعمل المجتمعي",
  "فيديو تعريفي وطني للطلاب",
  "مبادرة بقيمي أرتقي",
  "تكريم مسيرة تعليمية",
  "شركة المنظومة العربية",
];

// "نماذج أعمالنا" shows different portfolio_items depending on what the
// client is actually buying — a pharmacy/platform prospect doesn't care
// about video-editing or voiceover reels, and showing those would look
// off-brief. Matched against portfolio_items.title (see PORTFOLIO_COVERS
// above, same source of truth). Types not listed here (blogger never shows
// this step at all) fall through to showing everything, unfiltered.
const PORTFOLIO_CATEGORIES_BY_SERVICE = {
  pharmacy: ["منصات وتطبيقات"],
  link: ["منصات وتطبيقات"],
  platform: ["منصات وتطبيقات"],
  "platform-apps": ["منصات وتطبيقات"],
  video: ["مونتاج احترافي", "عرض مرئي", "ريلز وسناب"],
  // A course sells the trainer's own editing work as the proof: five picked
  // videos first (see COURSE_PORTFOLIO_TITLES), then the same category
  // stacks the video service shows.
  course: [...COURSE_PORTFOLIO_TITLES, "مونتاج احترافي", "عرض مرئي", "ريلز وسناب"],
  voiceover: ["تعليق صوتي"],
};

// Only these categories are actual video/reel work — used to decide whether
// the "▶ play" bubble should render on a portfolio slide. Non-video
// categories (e.g. "منصات وتطبيقات", which shows website/platform
// screenshots) must never get a play icon.
const VIDEO_PORTFOLIO_TITLES = new Set([
  ...COURSE_PORTFOLIO_TITLES,
  "مونتاج احترافي",
  "عرض مرئي",
  "تعليق صوتي",
  "ريلز وسناب",
]);

export default function OnboardingFunnel({ clientName, about, portfolio, testimonials, proposal }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [showReject, setShowReject] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [agree, setAgree] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [portfolioIndex, setPortfolioIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const packages = (proposal.proposal_packages || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const serviceType = detectServiceType(`${proposal.project_title || ""} ${selectedPackage?.name || ""}`);
  const serviceMeta = SERVICE_META[serviceType];
  // True only for the Blogger tier where WE deliver the full 50 articles.
  const isFullContentBlogger =
    serviceType === "blogger" && BLOGGER_FULL_CONTENT_PRICES.has(Number(selectedPackage?.price));
  // Article packages go straight to the point: a thank-you, then the offer.
  // The client already knows us — they bought before — so the "who we are /
  // team / past work / testimonials" sell is noise here. The first step's
  // own copy comes from SERVICE_ABOUT_OVERRIDES.articles above; only its
  // label in the stepper needs changing, hence the { ...s, label } rewrite.
  const steps =
    serviceType === "articles"
      ? ALL_STEPS.filter((s) => s.id === "about" || s.id === "proposal").map((s) =>
          s.id === "about" ? { ...s, label: "شكرًا لثقتك" } : s
        )
      : serviceType === "course"
        ? // The work itself is the whole pitch for a course: show what we edit,
          // then the packages. No "about us", no team, no testimonials.
          ALL_STEPS.filter((s) => s.id === "portfolio" || s.id === "proposal")
        : serviceType === "blogger"
          ? ALL_STEPS.filter((s) => s.id !== "portfolio")
          : ALL_STEPS;
  const currentStepId = steps[stepIndex]?.id;
  const proposalStepIndex = steps.length - 1;

  // Fall back to the full, unfiltered list whenever there's no category
  // mapping for this service type, or the filter would leave nothing to
  // show (e.g. that category has no portfolio_items rows yet) — an empty
  // "نماذج أعمالنا" step is worse than an off-topic one.
  const relevantCategories = PORTFOLIO_CATEGORIES_BY_SERVICE[serviceType];
  const filteredPortfolio = relevantCategories
    ? (portfolio || []).filter((item) => relevantCategories.includes(item.title))
    : null;
  const visiblePortfolio = filteredPortfolio && filteredPortfolio.length > 0 ? filteredPortfolio : portfolio;

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }
  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handleAccept() {
    setError(null);
    const parts = signerName.trim().split(/\s+/).filter(Boolean);
    if (!agree) {
      setError("لازم توافق على بنود العقد أولاً");
      return;
    }
    if (parts.length < 3) {
      setError("اكتب اسمك الثلاثي كامل كتوقيع");
      return;
    }
    startTransition(async () => {
      try {
        await acceptProposal({ proposalId: proposal.id, packageId: selectedPackageId, signerName });
        router.refresh();
      } catch (e) {
        setError(e.message || "حصل خطأ، حاول تاني");
      }
    });
  }

  function handleReject() {
    setError(null);
    if (rejectReason.trim().length < 3) {
      setError("اكتب سبب الرفض من فضلك");
      return;
    }
    startTransition(async () => {
      try {
        await rejectProposal({ proposalId: proposal.id, reason: rejectReason });
        router.refresh();
      } catch (e) {
        setError(e.message || "حصل خطأ، حاول تاني");
      }
    });
  }

  return (
    <div className="onboarding-funnel-light">
      <div className="funnel-steps">
        {steps.map((s, i) => (
          <Fragment key={s.id}>
            <button
              type="button"
              className={`funnel-step ${i < stepIndex ? "done" : i === stepIndex ? "active" : ""}`}
              onClick={() => setStepIndex(i)}
            >
              <s.Icon />
              <span>{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`funnel-step-line ${i < stepIndex ? "done" : ""}`} />
            )}
          </Fragment>
        ))}
      </div>

      <div className={`card funnel-card${currentStepId === "portfolio" ? " works-funnel-card" : ""}`}>
        {stepIndex < proposalStepIndex && (
          <div className="funnel-nav funnel-nav-top">
            <button
              type="button"
              className="btn btn-outline btn-sm funnel-nav-btn"
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
              السابق
            </button>
            <button type="button" className="btn btn-primary btn-sm funnel-nav-btn" onClick={goNext}>
              التالي
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
          </div>
        )}

        <div className="funnel-body">
          {currentStepId === "about" && (() => {
            const bodyText =
              SERVICE_ABOUT_OVERRIDES[serviceType] ||
              about?.body ||
              "Kareem Pro شريكك في بناء منتج رقمي احترافي من الفكرة لحد الإطلاق.";
            const lines = bodyText
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean);

            // First line (if there's more than one) is a lead-in sentence, e.g.
            // "هنا في Kareem Pro:" — the rest, when written as "label: description",
            // render as a set of highlighted points. Otherwise fall back to plain text.
            const introLine = lines.length > 1 ? lines[0] : null;
            const restLines = lines.length > 1 ? lines.slice(1) : lines;

            const points = restLines.map((line) => {
              const sepIndex = line.search(/[:：]/);
              if (sepIndex === -1) return null;
              return {
                label: line.slice(0, sepIndex).trim(),
                text: line.slice(sepIndex + 1).trim(),
              };
            });
            const isPointList = restLines.length > 0 && points.every((p) => p !== null);

            if (serviceType === "link" && isPointList) {
              return <WhyKareemPro title={introLine} points={points} />;
            }

            return (
              <>
                {isPointList ? (
                  <>
                    {introLine && <p className="about-intro">{introLine}</p>}
                    <div className="about-points">
                      {points.map((p, i) => (
                        <div className="about-point" key={i}>
                          <span className="about-point-icon">{i + 1}</span>
                          <div>
                            <div className="about-point-label">{p.label}</div>
                            <div className="about-point-text">{p.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ color: "var(--text)", lineHeight: 2, whiteSpace: "pre-line" }}>
                    {bodyText}
                  </p>
                )}
              </>
            );
          })()}

          {currentStepId === "team" && (
            <div className="team-section">
              <TeamOrbit
                members={
                  PROGRAMMING_SERVICES.has(serviceType)
                    ? TEAM_MEMBERS.map((m) =>
                        PROGRAMMING_ROLES[m.name] ? { ...m, role: PROGRAMMING_ROLES[m.name] } : m
                      )
                    : TEAM_MEMBERS
                }
                centerPhoto="/team/kareem-founder.jpg"
                centerName="كريم عبد الصادق"
                centerRole="CEO & Founder, Kareem Pro"
              />
            </div>
          )}

          {currentStepId === "portfolio" && PROGRAMMING_SERVICES.has(serviceType) && <LiveWorks />}

          {currentStepId === "portfolio" && !PROGRAMMING_SERVICES.has(serviceType) && (
            <section className="works-showcase">
              <div className="works-carousel-head">
                {visiblePortfolio && visiblePortfolio.length > 1 && (
                  <div className="works-arrows">
                    <button type="button" onClick={() => setPortfolioIndex((portfolioIndex + 1) % visiblePortfolio.length)}>‹</button>
                    <button type="button" onClick={() => setPortfolioIndex((portfolioIndex - 1 + visiblePortfolio.length) % visiblePortfolio.length)}>›</button>
                  </div>
                )}
                <h2>نماذج من إبداعاتنا</h2>
              </div>
              {visiblePortfolio && visiblePortfolio.length > 0 ? (
                <>
                <div className="works-carousel">
                  {visiblePortfolio.map((item, index) => {
                    let offset = index - portfolioIndex;
                    if (offset > visiblePortfolio.length / 2) offset -= visiblePortfolio.length;
                    if (offset < -visiblePortfolio.length / 2) offset += visiblePortfolio.length;
                    const hasStack = Number(item.stack_count) > 1;
                    // Course funnel only — everywhere else item.link_url is used
                    // exactly as before.
                    const itemLink =
                      (serviceType === "course" && COURSE_CATEGORY_VIDEO_LINKS[item.title]) ||
                      item.link_url;
                    const coverImages=PORTFOLIO_COVERS[item.title]||[item.image_url].filter(Boolean);
                    const itemLabel = item.description || item.title;
                    return (
                      <button
                        type="button"
                        className={`works-slide${offset === 0 ? " active" : ""}`}
                        key={item.id}
                        onClick={() => {
                          if (offset === 0 && itemLink) {
                            window.open(itemLink, "_blank", "noopener,noreferrer");
                          } else {
                            setPortfolioIndex(index);
                          }
                        }}
                        style={{ "--offset": offset }}
                      >
                          {coverImages.length>1?<div className="works-cover-strip">{coverImages.map((src)=><span key={src} style={{backgroundImage:`url(${src})`}}><i>▶</i></span>)}</div>:<div className={`works-card-bg${["محفظة كريم","iKareem"].includes(item.description)?" works-card-bg--full":""}`} style={coverImages[0]?{backgroundImage:`url(${coverImages[0]})`}:undefined}/>}
                          <div className="works-card-shade" />
                          {hasStack && serviceType !== "course" && (
                            <span className="works-stack-badge">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="4" width="12" height="12" rx="2" />
                                <path d="M8 20h12a2 2 0 0 0 2 -2v-12" />
                              </svg>
                              +{item.stack_count - 1} أعمال أخرى
                            </span>
                          )}
                          <div className="works-card-body">
                            <div className="works-card-title">{itemLabel}</div>
                          </div>
                          {offset === 0 && VIDEO_PORTFOLIO_TITLES.has(item.title) && <span className="works-play">▶</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="works-detail">
                  <h3>{visiblePortfolio[portfolioIndex]?.description || visiblePortfolio[portfolioIndex]?.title}</h3>
                  <p>{PORTFOLIO_DESCRIPTIONS[visiblePortfolio[portfolioIndex]?.title] || "نموذج إبداعي صُمم بعناية ليصنع تجربة تستحق المشاهدة."}</p>
                  {(() => {
                    const current = visiblePortfolio[portfolioIndex];
                    // Same course-only override the cards use above.
                    const href =
                      (serviceType === "course" && COURSE_CATEGORY_VIDEO_LINKS[current?.title]) ||
                      current?.link_url;
                    // Label follows the destination, not the stack count: a
                    // YouTube link is one video, anything else is the works page
                    // (which is what every other service still gets).
                    const label = /youtube\.com|youtu\.be/.test(href || "")
                      ? "شاهد الفيديو ←"
                      : "شاهد كل الأعمال ←";
                    return href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>
                    ) : (
                      <span className="works-detail-button">شاهد كل الأعمال ←</span>
                    );
                  })()}
                </div>
                </>
              ) : (
                <p className="muted" style={{ marginTop: "1rem" }}>
                  قريبًا هنشاركك نماذج من أعمالنا هنا.
                </p>
              )}
            </section>
          )}

          {currentStepId === "testimonials" && (
            <>
              <h2 className="title" style={{ fontSize: "1.2rem" }}>
                آراء عملائنا
              </h2>
              {testimonials && testimonials.length > 0 ? (
                <div className="testimonial-grid">
                  {testimonials.map((t) => {
                    const initial = (t.client_name || "؟").trim().charAt(0);
                    return (
                      <div className="testimonial-card" key={t.id}>
                        <div className="testimonial-stars" aria-hidden="true">
                          ★★★★★
                        </div>
                        <div className="quote">&quot;{t.quote}&quot;</div>
                        <div className="testimonial-footer">
                          <div className="testimonial-avatar">{initial}</div>
                          <div className="testimonial-who">
                            <span className="who">{t.client_name}</span>
                            {t.role && <span className="role">{t.role}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted" style={{ marginTop: "1rem" }}>
                  قريبًا هنشاركك آراء عملائنا هنا.
                </p>
              )}
            </>
          )}

          {currentStepId === "proposal" && !selectedPackage && !showReject && (
            <>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={goBack}
                style={{ marginBottom: "1.2rem" }}
              >
                السابق
              </button>
              <h2 className="title" style={{ fontSize: "1.2rem", marginBottom: "1.2rem" }}>
                حدد باقتك، ولنبدأ نبض مشروعك .. 🚀
              </h2>
              <div className={`package-grid${packages.length === 2 ? " package-grid-two" : ""}${packages.length === 1 ? " package-grid-one" : ""}`}>
                {(() => {
                  const packagePrices = packages.map((p) => Number(p.price));
                  const maxPackagePrice = Math.max(...packagePrices);
                  const minPackagePrice = Math.min(...packagePrices);
                  return packages.map((pkg) => {
                    const featureLines = (pkg.features || "")
                      .split("\n")
                      .map((l) => l.trim())
                      .filter(Boolean);
                    const [pkgName, pkgTagline] = (pkg.name || "").split("|").map((s) => s.trim());
                    // Value-based tier color, not name-based — a price ladder can be
                    // renamed or reordered (like pharmacy's was), and a hardcoded name
                    // match would silently mislabel the wrong tier as "premium".
                    const isPremiumTier = packages.length > 1 && Number(pkg.price) === maxPackagePrice;
                    const isBaseTier = packages.length > 1 && Number(pkg.price) === minPackagePrice;
                    const isValueTier = packages.length > 2 && !isPremiumTier && !isBaseTier;
                    const tierClass = isPremiumTier ? "premium-tier" : isValueTier ? "value-tier" : isBaseTier ? "base-tier" : "";
                    return (
                    <div
                      className={`package-card ${pkg.is_featured ? "featured" : ""} ${tierClass}`}
                      key={pkg.id}
                    >
                      {pkg.is_featured && <span className="package-badge">⭐ الأكثر طلبًا</span>}
                      {/* Both badges sit in the same pinned slot at the top of the card,
                          so a card that is BOTH the featured pick and the top tier (the
                          two-tier Blogger ladder) would stack them on top of each other.
                          "الأكثر طلبًا" is the one that drives the choice, so it wins. */}
                      {isPremiumTier && !pkg.is_featured && (
                        <span className="package-badge premium-badge">💎 الأرقى والأشمل</span>
                      )}
                      <div className="package-head">
                        <div className="package-name">{pkgName}</div>
                        {pkgTagline && <div className="package-tagline">{withInlineBold(pkgTagline)}</div>}
                        {pkg.original_price != null && Number(pkg.original_price) > Number(pkg.price) && (
                          <div className="package-price-original">
                            <span dir="ltr">{Number(pkg.original_price).toLocaleString("en-US")}</span>
                            <RiyalIcon size="0.65em" tone="dark" />
                          </div>
                        )}
                        <div className="package-price">
                          <span dir="ltr">{Number(pkg.price).toLocaleString("en-US")}</span>
                          <RiyalIcon size="0.7em" tone="dark" />
                        </div>
                        <div className="package-launch-note">
                          {serviceType === "link" ? "عرض خاص لعملائنا المميزين ❤️" : "عرض خاص لأول تعاون معنا ❤️"}
                        </div>
                      </div>
                      {featureLines.length > 0 && (
                        <ul className="package-features">
                          {featureLines.map((line, i) => (
                            <li key={i}>
                              <span className="package-check">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                              {/* A feature line wrapped in ** … ** is the one that sets this
                                  tier apart (e.g. 5 vs 50 articles on the Blogger ladder) —
                                  rendered bold so the difference between two otherwise
                                  identical cards is impossible to miss. */}
                              <span>
                                {line.startsWith("كل مميزات") || line.startsWith("**") ? (
                                  <>
                                    <strong>{line.replace(/^\*\*/, "").replace(/\*\*$/, "")}</strong>
                                    {/* The crown belongs to the top tier only — on the base
                                        card the same line is still bold, just uncrowned. */}
                                    {pkg.is_featured && <CrownIcon />}
                                  </>
                                ) : (
                                  line
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        className="btn btn-primary btn-sm package-cta"
                        onClick={() => setSelectedPackageId(pkg.id)}
                      >
                        اختيار هذه الباقة
                      </button>
                    </div>
                    );
                  });
                })()}
              </div>

              <button
                type="button"
                className="muted"
                style={{
                  background: "none",
                  border: "none",
                  textDecoration: "underline",
                  cursor: "pointer",
                  marginTop: "1.4rem",
                  padding: 0,
                }}
                onClick={() => setShowReject(true)}
              >
                لا أرغب بالمتابعة حاليًا
              </button>

              {/* The recurring-cost note is about running a thing we BUILT —
                  hosting, domain renewal, payment-gateway fees, store developer
                  accounts. An article package builds nothing and runs nothing:
                  the client already owns and pays for their blog. Showing it
                  here would list costs that have nothing to do with what they
                  are buying, so this service skips the note entirely. */}
              {serviceType !== "articles" && serviceType !== "course" && (
              <div className="notice" style={{ marginTop: "1.4rem", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                <strong style={{ color: "var(--text)", display: "block", marginBottom: "0.5rem" }}>
                  ملاحظة مهمة:
                </strong>
                الأسعار أعلاه لا تشمل التكاليف التشغيلية المتكررة التي تُدفع مباشرة لمزوّدي
                الخدمة حسب طبيعة مشروعك، ومنها تقريبًا:
                <ul className="cost-list">
                  {serviceType === "blogger" ? (
                    <>
                      <li>
                        تجديد الدومين — يُدفع مباشرة لمزوّد الدومين، حوالي 10$ سنويًا تقريبًا، وقد يزيد
                        قليلًا حسب سياسة أسعار الشركة المزوّدة.
                      </li>
                    </>
                  ) : serviceType === "link" ? (
                    <>
                      <li>
                        الاستضافة وقاعدة البيانات السحابية ومساحة تخزين الصور والملفات (تبدأ مجانية
                        وتُرفع السعة عند الحاجة)
                      </li>
                      <li>رسوم بوابة الدفع (حوالي 2.5–3٪ من كل عملية)</li>
                      <li>خدمة الخرائط وتحديد الموقع ورسائل التحقق SMS، حسب حجم الاستخدام.</li>
                      <li>تجديد الدومين (حوالي 55<RiyalIcon size="0.75em" /> سنويًا)</li>
                      <li>
                        حسابات مطوري Apple وGoogle لنشر التطبيقين باسم صاحب المشروع (حوالي
                        370<RiyalIcon size="0.75em" /> سنويًا و95<RiyalIcon size="0.75em" /> لمرة واحدة على
                        الترتيب)
                      </li>
                    </>
                  ) : serviceType === "pharmacy" ? (
                    <>
                      <li>الاستضافة وقاعدة البيانات السحابية لبيانات الصيدلية وبوابة الدفع.</li>
                      <li>تجديد الدومين الخاص بالمنصة (حوالي 40<RiyalIcon size="0.75em" /> سنويًا، وقد تزيد التكلفة قليلًا حسب سياسة الأسعار لدى مزوّد الدومين)</li>
                      <li>
                        رسوم اشتراك حسابات المتاجر الرسمية (أبل وجوجل ومايكروسوفت) اللازمة لنشر
                        التطبيقات على كل جهاز، حسب الباقة المختارة.
                      </li>
                    </>
                  ) : (
                    <>
                      <li>الاستضافة وقاعدة البيانات (تبدأ مجانية وتُرفع السعة عند الحاجة)</li>
                      <li>
                        حماية الفيديوهات — لو مشروعك يعتمد على محتوى مرئي محمي زي المنصات
                        التعليمية (تبدأ من 600<RiyalIcon size="0.75em" /> سنويًا)
                      </li>
                      <li>رسوم بوابة الدفع (حوالي 2.5–3٪ من كل عملية)</li>
                      <li>تجديد الدومين (حوالي 55<RiyalIcon size="0.75em" /> سنويًا)</li>
                      <li>
                        حسابات مطوري Apple وGoogle لنشر التطبيقات (حوالي 370<RiyalIcon size="0.75em" /> سنويًا
                        و95<RiyalIcon size="0.75em" /> لمرة واحدة على الترتيب)
                      </li>
                    </>
                  )}
                </ul>
                تُحدَّد هذه التكاليف بدقة حسب مشروعك عند البدء.
              </div>
              )}
            </>
          )}

          {currentStepId === "proposal" && showReject && (
            <>
              <h2 className="title" style={{ fontSize: "1.2rem" }}>
                رفض العرض
              </h2>
              <p className="muted" style={{ marginBottom: "1rem" }}>
                ممكن تقولنا السبب ؟ ده هيساعدنا نحسّن العرض ليك أو لغيرك.
              </p>
              <div className="field">
                <label>سبب الرفض</label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
              </div>
              {error && <div className="notice notice-error">{error}</div>}
              <div style={{ display: "flex", gap: "0.7rem" }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setShowReject(false);
                    setError(null);
                  }}
                  disabled={isPending}
                >
                  رجوع
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleReject}
                  disabled={isPending}
                >
                  {isPending ? "جارِ الإرسال..." : "تأكيد الرفض"}
                </button>
              </div>
            </>
          )}

          {currentStepId === "proposal" && selectedPackage && (
            <>
              <h2 className="title" style={{ fontSize: "1.2rem" }}>
                العقد — {selectedPackage.name.split("|")[0].trim()}
              </h2>
              <div className="contract-box">
                <h3>عقد تنفيذ مشروع مع Kareem Pro</h3>

                <p className="contract-verse">
                  قال الله تعالى:
                  <br />
                  <strong>{"{ يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ }"}</strong>
                </p>

                <p>
                  <strong>تم الاتفاق بين:</strong>
                </p>
                <p>
                  الطرف الأول: <strong>كريم عبد الصادق</strong> — ويشار إليه بـ: Kareem Pro - CEO
                </p>
                <p>
                  والطرف الثاني: <strong>{clientName}</strong> — ويشار إليه باسم: {serviceMeta.partyRole}
                </p>

                <p>
                  على تنفيذ مشروع {serviceMeta.serviceLine} حسب الباقة التي اختارها صاحب المشروع من
                  الباقات المعروضة عليه قبل التعاقد.
                </p>

                <p>
                  اسم المشروع: <strong>{proposal.project_title}</strong>
                </p>
                <p>
                  قيمة الباقة:{" "}
                  <strong>
                    <span dir="ltr">{Number(selectedPackage.price).toLocaleString("en-US")}</span>
                    <RiyalIcon size="0.8em" tone="dark" /> سعودي
                  </strong>
                  {serviceType === "blogger" && (() => {
                    // Three payments, derived from the package price instead of
                    // hardcoded — the Blogger ladder now has two tiers (750 and
                    // 1,300) and each needs its own split. BLOGGER_PAYMENT_PLANS
                    // holds the agreed numbers per price; anything else falls back
                    // to an even three-way split so a future tier can never print
                    // a wrong figure.
                    const [first, second, third] = bloggerPaymentPlan(selectedPackage.price);
                    return (
                      <>
                        {" "}(ثلاث دفعات) الدفعة الأولى: {first}
                        <RiyalIcon size="0.75em" tone="dark" /> مقدم — الدفعة الثانية: {second}
                        <RiyalIcon size="0.75em" tone="dark" /> بعد إعداد الصفحات الإلزامية — الدفعة
                        الثالثة: {third}
                        <RiyalIcon size="0.75em" tone="dark" />{" "}
                        {isFullContentBlogger
                          ? "عند اكتمال نشر المقالات الخمسين"
                          : "عند تسليم المدونة وكتابة المقالات التأسيسية"}
                      </>
                    );
                  })()}
                  {serviceType === "course" && (() => {
                    // Same shape as the articles line below: instalments are
                    // tied to a count of SESSIONS ACTUALLY TAUGHT, so the figure
                    // printed here can never disagree with the stages the portal
                    // creates on acceptance.
                    const plan = COURSE_PAYMENT_PLANS[Number(selectedPackage.price)];
                    if (!plan) return null;
                    return (
                      <>
                        {" "}(ثلاث دفعات){" "}
                        {plan.map(([amount, when], i) => (
                          <span key={i}>
                            {i > 0 && " — "}
                            {["الدفعة الأولى", "الدفعة الثانية", "الدفعة الثالثة"][i]}: {amount}
                            <RiyalIcon size="0.75em" tone="dark" /> {when}
                          </span>
                        ))}
                      </>
                    );
                  })()}
                  {serviceType === "articles" && (() => {
                    // Instalments are tied to a count of PUBLISHED ARTICLES, not
                    // to dates — the milestone wording per package lives in
                    // ARTICLES_PAYMENT_PLANS so this line can never print a split
                    // that disagrees with the stages the portal actually creates.
                    const plan = ARTICLES_PAYMENT_PLANS[Number(selectedPackage.price)];
                    if (!plan) return null;
                    return (
                      <>
                        {" "}({plan.length === 2 ? "دفعتان" : "ثلاث دفعات"}){" "}
                        {plan.map(([amount, when], i) => (
                          <span key={i}>
                            {i > 0 && " — "}
                            {["الدفعة الأولى", "الدفعة الثانية", "الدفعة الثالثة"][i]}: {amount}
                            <RiyalIcon size="0.75em" tone="dark" /> {when}
                          </span>
                        ))}
                      </>
                    );
                  })()}
                  {serviceType === "pharmacy" && (
                    <>
                      {" "}(خمس دفعات متساوية{" "}
                      <span dir="ltr">{Math.round(Number(selectedPackage.price) / 5).toLocaleString("en-US")}</span>
                      <RiyalIcon size="0.75em" tone="dark" /> لكل دفعة)
                    </>
                  )}
                </p>

                <h4>شروط الاتفاق:</h4>
                <ol className="contract-points">
                  {serviceType === "course" ? (
                    /* Training, not production: nothing is built and nothing is
                       handed over, so almost none of the build clauses apply.
                       Its own risks are different too — scheduling, session
                       recordings, the trainee's own Adobe subscription — which
                       is why this is a complete clause set of its own rather
                       than a branch inside the shared list. */
                    <>
                      <li>يبدأ التدريب بعد استلام الدفعة الأولى وتحديد جدول الحصص.</li>
                      <li>الحصص فردية ومباشرة عبر الإنترنت، ومدة الحصة ساعة كاملة.</li>
                      <li>
                        يُتفق على مواعيد الحصص مسبقا بما يناسب الطرفين، ويلتزم بها الطرفان.
                      </li>
                      <li>تأجيل أي حصة متاح بإشعار قبل أربع وعشرين ساعة على الأقل.</li>
                      <li>
                        يُسلَّم تسجيل كل حصة للمتدرب، وهو ملك له للاستخدام الشخصي فقط. ولا يجوز نشره
                        أو بيعه أو مشاركته مع الغير.
                      </li>
                      <li>
                        يتولى المتدرب توفير جهاز مناسب واتصال إنترنت مستقر واشتراك Adobe الخاص به.
                      </li>
                      <li>
                        تُسدَّد قيمة الباقة على دفعات مرتبطة بعدد الحصص المنفَّذة فعليا:
                        <ul className="contract-subpoints">
                          <li>
                            باقة التأسيس (600 ريال): 200 مقدما — 200 عند الحصة الرابعة — 200 عند
                            الحصة الثامنة.
                          </li>
                          <li>
                            باقة الاحتراف (900 ريال): 300 مقدما — 300 عند الحصة الخامسة — 300 عند
                            الحصة العاشرة.
                          </li>
                        </ul>
                      </li>
                      <li>
                        تُستحق كل دفعة فور بلوغ عدد الحصص المرتبط بها، ويُخطَر المتدرب بها عبر
                        الواتساب، ويُمهَل يومان من تاريخ الإشعار لسدادها. وفي حال تأخر السداد تتوقف
                        الحصص مؤقتا حتى استكمال المستحق، ثم تُستأنف من حيث توقفت.
                      </li>
                      <li>الدفعات المسددة عن حصص تمت بالفعل غير قابلة للاسترداد.</li>
                      <li>
                        للمتدرب أن يطلب ترقية باقته إلى باقة أعلى في أي وقت، ويُحتسب له ما سدده.
                      </li>
                      <li>تُسلَّم شهادة إتمام من Kareem Pro بعد اجتياز كامل حصص الباقة.</li>
                      <li>
                        توقيع المتدرب على هذا العقد يعني موافقته الكاملة على الباقة المختارة وقيمتها
                        وشروط تنفيذها.
                      </li>
                    </>
                  ) : serviceType === "articles" ? (
                    /* Article packages get their own complete clause set: a pure
                       content retainer on a blog that already exists shares almost
                       nothing with a build contract — no data collection, no
                       handover, no scope-change annex — and its payments are tied
                       to a count of published articles rather than to milestones
                       of a thing being built. Written as its own branch (like
                       pharmacy below) rather than woven into the shared list, so
                       neither can break the other by accident. */
                    <>
                      <li>
                        يبدأ التنفيذ بعد استلام الدفعة الأولى (المقدم) مباشرة، ولا يتطلب أي بيانات أو
                        إجراءات من صاحب المشروع.
                      </li>
                      <li>
                        يلتزم مقدم الخدمة بكتابة ونشر عدد المقالات المحدد في الباقة المختارة، على مدونة
                        صاحب المشروع القائمة بالفعل.
                      </li>
                      <li>
                        تُكتب المقالات بنفس مستوى وأسلوب المقالات التأسيسية التي سبق تسليمها والموافقة
                        عليها، بصياغة مختصرة وقوية تناسب القارئ العربي ومحركات البحث.
                      </li>
                      <li>
                        يلتزم مقدم الخدمة بتنويع بنية المقالات وزواياها ومواضيعها، بما يمنع تكرار المحتوى
                        ويستوفي معايير Google الخاصة بأصالة المحتوى.
                      </li>
                      <li>
                        يتم نشر <strong>مقال واحد يوميًا فقط</strong>، وهو إيقاع مقصود ومدروس لحماية
                        تقييم المدونة لدى محركات البحث، إذ إن النشر المكثّف في وقت قصير يضر بالسيو
                        وبفرص القبول في أدسنس.
                      </li>
                      <li>مدة التنفيذ = عدد مقالات الباقة بالأيام، تبدأ من تاريخ نشر أول مقال.</li>
                      <li>
                        تُسدَّد قيمة الباقة على دفعات مرتبطة بعدد المقالات المنشورة فعليًا — لا بالتواريخ
                        — على النحو التالي:
                        <ul className="contract-subpoints">
                          <li>
                            باقة 30 مقالًا (650 ريال): 350 مقدمًا — 300 عند نشر المقال الخامس عشر.
                          </li>
                          <li>
                            باقة 60 مقالًا (1,100 ريال): 400 مقدمًا — 350 عند المقال العشرين — 350 عند
                            المقال الأربعين.
                          </li>
                          <li>
                            باقة 100 مقال (1,750 ريال): 650 مقدمًا — 550 عند المقال الخامس والثلاثين —
                            550 عند المقال السبعين.
                          </li>
                        </ul>
                      </li>
                      <li>
                        تُستحق كل دفعة فور بلوغ عدد المقالات المرتبط بها، ويُخطَر صاحب المشروع بها عبر
                        الواتساب، ويُمهَل ثلاثة أيام من تاريخ الإشعار لسدادها. وفي حال تأخر السداد
                        يتوقف النشر مؤقتًا حتى استكمال المستحق، ثم يُستأنف من حيث توقف ويُستكمل ما تبقى
                        من مقالات الباقة دون أي إخلال بباقي البنود.
                      </li>
                      <li>
                        الدفعات المسددة عن مقالات منشورة بالفعل غير قابلة للاسترداد، فهي تقابل عملًا
                        منجزًا ومسلَّمًا ومنشورًا على المدونة.
                      </li>
                      <li>
                        لصاحب المشروع أن يطلب ترقية باقته إلى باقة أعلى في أي وقت، ويُحتسب له ما سدده،
                        ويُعاد جدولة الدفعات المتبقية وفق الباقة الجديدة.
                      </li>
                      <li>
                        المقالات المنشورة ملك خالص لصاحب المشروع، وله كامل الحق في تعديلها أو التصرف
                        فيها كما يشاء.
                      </li>
                      <li>
                        نعمل على تنفيذ المحتوى وفق أفضل الممارسات المعتمدة لدى Google، بما يمنح المدونة
                        أقوى وضع ممكن أمام أدسنس. ويسعد مقدم الخدمة بمرافقة صاحب المشروع ومساعدته
                        مجانًا في خطوات التقديم ومتابعته حتى النهاية. ويبقى قرار القبول النهائي وتوقيته
                        بيد Google وحدها وفق سياساتها، شأنه شأن أي مدونة، وهو ما لا يملك أي طرف ضمانه.
                      </li>
                      <li>
                        توقيع صاحب المشروع على هذا العقد يعني موافقته الكاملة على الباقة المختارة
                        وقيمتها وشروط تنفيذها.
                      </li>
                    </>
                  ) : serviceType === "link" ? (
                    /* LINK has its own clause set, modelled on pharmacy's: a
                       two-month build with native store apps, a settlement
                       folded into the price, and marketplace-specific
                       responsibilities (vetting teachers, users' data).
                       Condensed 2026-09-25 (Kareem) — same obligations,
                       shorter wording. */
                    <>
                      <li>
                        يبدأ التنفيذ بعد استلام الدفعة الأولى وكامل البيانات والمتطلبات من صاحب
                        المشروع، ومدته التقديرية حوالي شهرين: شهر لمنصة الويب (أربع مراحل)، وشهر
                        لتطبيقي iPhone وAndroid الأصليين (أربع مراحل).
                      </li>
                      <li>
                        لا يُحتسب على مقدم الخدمة أي تأخير سببه تأخر البيانات أو المراجعات أو الردود من
                        صاحب المشروع، ولا مدة مراجعة المتاجر للتطبيقين.
                      </li>
                      <li>
                        أي إضافة أو تعديل خارج الباقة يُسعَّر وتُحدَّد مدته في ملحق منفصل، ولا يُنفَّذ إلا
                        بعد تأكيد كتابي عبر واتساب.
                      </li>
                      <li>
                        يوفر صاحب المشروع الحسابات اللازمة باسمه: الدومين، وبوابة الدفع، وحسابي مطوري
                        Apple وGoogle، وخدمات الخرائط والرسائل عند الحاجة.
                      </li>
                      <li>
                        رسوم التشغيل المستمرة على صاحب المشروع وتُدفع مباشرة لمزوديها: الاستضافة وقاعدة
                        البيانات، والرسائل، والخرائط، وعمولات بوابة الدفع، واشتراكا مطوري Apple وGoogle.
                      </li>
                      <li>
                        يتولى مقدم الخدمة نشر التطبيقين على App Store وGoogle Play من حسابي صاحب المشروع،
                        والنشر يخضع لسياسات المتاجر وموافقتها، ويلتزم مقدم الخدمة بالتعديلات التقنية التي
                        تطلبها المتاجر حتى إتمام النشر.
                      </li>
                      <li>
                        التشغيل اليومي للمنصة (اعتماد حسابات المعلمين ومؤهلاتهم، ومتابعة البلاغات،
                        والتعامل مع المستخدمين) مسؤولية صاحب المشروع، ومقدم الخدمة يوفر له أدواته في
                        لوحة الإدارة.
                      </li>
                      <li>
                        الأكواد المصدرية وملفات المشروع ملك كامل لصاحب المشروع فور سداد كامل المستحق،
                        ولا يعيد مقدم الخدمة استخدامها أو بيعها دون إذن كتابي.
                      </li>
                      <li>
                        يحافظ مقدم الخدمة على سرية بيانات صاحب المشروع ومستخدمي المنصة، ولا يشاركها مع
                        أي طرف ثالث.
                      </li>
                      <li>
                        قيمة الباقة{" "}
                        {Number(selectedPackage.price).toLocaleString("en-US")} ريال، يُخصم منها 2,600 ريال
                        تسوية لمستحقات سابقة لصاحب المشروع، فيصبح الصافي{" "}
                        {(Number(selectedPackage.price) - LINK_SETTLEMENT.owed).toLocaleString("en-US")} ريال
                        على ثلاث دفعات:
                        <ul className="contract-subpoints">
                          {(LINK_PAYMENT_PLANS[Number(selectedPackage.price)] || []).map(([amount, when], i) => (
                            <li key={i}>
                              {["الدفعة الأولى", "الدفعة الثانية", "الدفعة الثالثة"][i]}:{" "}
                              {amount.toLocaleString("en-US")} ريال {when}.
                            </li>
                          ))}
                        </ul>
                      </li>
                      <li>
                        بمجرد توقيع هذا العقد تُسوّى المستحقات السابقة لصاحب المشروع (2,600 ريال) تسوية
                        نهائية.
                      </li>
                      {Number(selectedPackage.price) === LINK_YEAR_SUPPORT_PRICE ? (
                        <li>
                          دعم فني كامل لمدة سنة من التسليم: صيانة وإصلاح أي خطأ، وتحديث التطبيقين مع إصدارات
                          iOS وAndroid ومتطلبات المتاجر، ومتابعة الأداء والأمان، وإضافة مميزات وتحسينات ضمن
                          نطاق المنصة؛ ولا يشمل التشغيل اليومي أو بناء أنظمة وتطبيقات جديدة كليًا، فتُسعَّر في
                          ملحق منفصل.
                        </li>
                      ) : (
                        <li>
                          الدعم الفني شهر بعد التسليم لمعالجة الأخطاء التقنية الناتجة عن التنفيذ، ولا يشمل
                          مزايا جديدة أو التشغيل اليومي.
                        </li>
                      )}
                      <li>
                        إذا تأخر صاحب المشروع في البيانات أو أي دفعة أكثر من 3 أيام، يحق لمقدم الخدمة
                        إيقاف العمل لحين استكمال المستحق، دون أي التزام إضافي عليه.
                      </li>
                      <li>
                        الدفعات المسددة غير قابلة للاسترداد في أي حال، لأنها تغطي الوقت والجهد المبذولين
                        والمشاريع التي أُلغيت للتفرغ لهذا المشروع، ويُسلَّم لصاحب المشروع ما أُنجز عند الإلغاء.
                      </li>
                      <li>توقيع صاحب المشروع على هذا العقد يعني موافقته الكاملة على الباقة المختارة وقيمتها وشروط تنفيذها.</li>
                    </>
                  ) : serviceType === "pharmacy" ? (
                    /* Pharmacy (Urs) is its own fully separate clause set — enough
                       distinct risk (gov't integration dependency, IP transfer,
                       non-refundable stages, late-payment cutoff) that weaving it
                       into the shared conditional list below would make both
                       harder to read and easier to break by accident. */
                    <>
                      <li>
                        يبدأ تنفيذ المشروع بعد استلام الدفعة الأولى وكافة البيانات والمتطلبات اللازمة
                        من صاحب المشروع.
                      </li>
                      <li>
                        يلتزم مقدم الخدمة بتنفيذ البنود الخاصة بالباقة المختارة فقط، وفق ما تم عرضه
                        والاتفاق عليه قبل توقيع العقد.
                      </li>
                      <li>
                        أي إضافات أو تعديلات خارج الباقة المختارة (سواء طلبها صاحب المشروع أو نتجت عن
                        تغيير في المتطلبات) يتم تسعيرها وتحديد مدة تنفيذها في ملحق منفصل، ولا تُنفَّذ
                        إلا بعد التأكيد الكتابي عليها عبر وسائل التواصل المعتمدة (واتساب أو البريد
                        الإلكتروني).
                      </li>
                      <li>
                        يلتزم صاحب المشروع بتجهيز حسابات الربط الرسمية المطلوبة لدى الجهات المعنية
                        (كهيئة الزكاة والضريبة والجمارك وهيئة الغذاء والدواء) قبل بدء مرحلة الربط.
                        اعتماد الربط والموافقة عليه من هذه الجهات يخضع بالكامل لسياساتها وإجراءاتها،
                        وليس مسؤولية مقدم الخدمة. أي تأخير ناتج عن تأخر صاحب المشروع في تجهيز هذه
                        الحسابات لا يُحتسب على مقدم الخدمة، ولا يُعتبر إخلالًا بمواعيد التسليم.
                      </li>
                      <li>
                        يقوم مقدم الخدمة ببناء النظام ووظائفه (الكاشير، المخزون، المحاسبة، الاشتراكات)
                        كنظام فعلي متكامل، ويتم اختباره ببيانات تجريبية أثناء التطوير. الانتقال للتشغيل
                        الفعلي ببيانات حقيقية مرهون باكتمال ربط الحسابات الرسمية المذكورة في البند
                        السابق.
                      </li>
                      <li>
                        جميع الأكواد المصدرية وملفات المشروع الناتجة عن هذا العقد ملك كامل لصاحب
                        المشروع فور سداد كامل قيمة الباقة، ولا يحق لمقدم الخدمة إعادة استخدامها أو
                        بيعها لطرف آخر دون إذن كتابي.
                      </li>
                      <li>يلتزم مقدم الخدمة بالحفاظ على سرية بيانات صاحب المشروع وعدم مشاركتها مع أي طرف ثالث.</li>
                      <li>
                        تقتصر مسؤولية مقدم الخدمة على قيمة الباقة المتفق عليها فقط، ويتحمل صاحب المشروع
                        وحده أي رسوم خارجية تفرضها جهات أخرى خارج نطاق هذا الاتفاق.
                      </li>
                      <li>
                        الدعم الفني بعد التسليم يشمل معالجة الأخطاء التقنية الناتجة عن التنفيذ حسب
                        الباقة المختارة، ولا يشمل إضافة مزايا جديدة أو الدعم التشغيلي اليومي.
                      </li>
                      <li>يتم تسليم المشروع بعد الانتهاء من كل البنود المتفق عليها في الباقة المختارة وسداد كامل الدفعات الخمس.</li>
                      <li>
                        في حال تأخر صاحب المشروع في إرسال البيانات أو سداد أي دفعة لأكثر من 3 أيام،
                        يحق لمقدم الخدمة إيقاف العمل مؤقتًا حتى استكمال المستحق، دون أن يترتب على ذلك
                        أي التزام إضافي من مقدم الخدمة.
                      </li>
                      <li>
                        الدفعات المسددة عن مراحل منجزة وموافق عليها غير قابلة للاسترداد، فهي تقابل جهدًا
                        حقيقيًا ووقتًا كاملًا بُذِل في تنفيذها، وقد تم الاعتذار عن مشاريع أخرى خلال هذه
                        الفترة تفرغًا للعمل على هذا المشروع.
                      </li>
                      <li>توقيع صاحب المشروع على هذا العقد يعني موافقته الكاملة على الباقة المختارة وقيمتها وشروط تنفيذها.</li>
                    </>
                  ) : (
                    <>
                      <li>يبدأ تنفيذ المشروع بعد استلام الدفعة الأولى وكافة البيانات اللازمة من صاحب المشروع.</li>
                      <li>
                        يلتزم مقدم الخدمة بتنفيذ البنود الخاصة بالباقة المختارة فقط، وفق ما تم عرضه
                        والاتفاق عليه قبل توقيع العقد.
                      </li>
                      <li>أي إضافات أو تعديلات خارج الباقة المختارة يتم الاتفاق على تكلفتها ومدة تنفيذها بشكل منفصل.</li>
                      <li>
                        صاحب المشروع مسؤول عن توفير المحتوى والبيانات والحسابات اللازمة لتنفيذ المشروع، مثل
                        الدومين{serviceType === "blogger" ? "." : "، بوابة الدفع، وحسابات المتاجر إن لزم الأمر."}
                      </li>
                      {serviceType !== "blogger" && (
                        <li>
                          نشر التطبيق على Google Play وApp Store يخضع لسياسات وموافقة المتاجر، وقد يتطلب
                          وقتًا أو تعديلات إضافية.
                        </li>
                      )}
                      {serviceType === "blogger" && (
                        <>
                          <li>
                            يتم تسليم المدونة كاملة (التصميم، الهيكلة، والصفحات الإلزامية) خلال 5 أيام عمل
                            من استلام كافة البيانات المطلوبة من صاحب المشروع.
                          </li>
                          {/* The three clauses below are the ONLY place the two Blogger
                              tiers really differ: on the 750 package we write 5 articles
                              and the client publishes the remaining 45; on the 1,300 one
                              we write and publish all 50. Keeping both wordings side by
                              side (instead of patching numbers into one shared sentence)
                              keeps each contract readable on its own. */}
                          {isFullContentBlogger ? (
                            <>
                              <li>
                                يلتزم مقدم الخدمة بكتابة ونشر 50 مقالًا احترافيًا للمدونة خلال 30 يوم عمل
                                من تاريخ تسليم المدونة، بشكل تدريجي ومتباعد زمنيًا وليس دفعة واحدة، لضمان
                                أعلى فرص القبول من Google.
                              </li>
                              <li>
                                بمجرد تسليم المدونة كاملة ونشر المقالات الخمسين، يُستحق كامل باقي قيمة
                                الباقة، ويُعتبر المشروع منفَّذًا بالكامل من طرف مقدم الخدمة.
                              </li>
                              <li>
                                لا يقع على صاحب المشروع أي التزام بكتابة أو نشر محتوى إضافي ضمن هذه
                                الباقة. والتقديم لبرنامج Google AdSense يتم بعد اكتمال نشر المقالات
                                الخمسين، ويسعد مقدم الخدمة بمتابعة صاحب المشروع ومساعدته فيه مجانًا. قبول
                                المدونة في أدسنس وتحقيق الربح منها يخضع بالكامل لسياسات Google وحدها،
                                وليس مسؤولية مقدم الخدمة.
                              </li>
                            </>
                          ) : (
                            <>
                              <li>يلتزم مقدم الخدمة بكتابة 5 مقالات تأسيسية للمدونة ضمن نفس مدة التسليم (5 أيام).</li>
                              <li>
                                بمجرد تسليم المدونة كاملة ونشر المقالات الخمس التأسيسية، يُستحق كامل باقي قيمة
                                الباقة، ويُعتبر المشروع منفَّذًا بالكامل من طرف مقدم الخدمة.
                              </li>
                              <li>
                                نشر باقي المحتوى (45 مقالًا) والتقديم لبرنامج Google AdSense مسؤولية صاحب
                                المشروع بالكامل بعد ذلك — لا علاقة لهما بالمستحقات المالية. يُنصح بنشر المحتوى
                                بشكل تدريجي ومتباعد زمنيًا وليس دفعة واحدة، لضمان أعلى فرص القبول من Google،
                                ويسعد مقدم الخدمة بمتابعة صاحب المشروع ومساعدته كلما تواصل معه عند نشر كل مقال.
                                قبول المدونة في أدسنس وتحقيق الربح منها يخضع بالكامل لسياسات Google وحدها،
                                وليس مسؤولية مقدم الخدمة.
                              </li>
                            </>
                          )}
                        </>
                      )}
                      <li>
                        تقتصر مسؤولية مقدم الخدمة على قيمة الباقة المتفق عليها فقط، ويتحمل صاحب المشروع
                        وحده أي رسوم خارجية تفرضها جهات أخرى خارج نطاق هذا الاتفاق.
                      </li>
                      <li>
                        الدعم الفني يشمل معالجة الأخطاء التقنية الناتجة عن التنفيذ، ولا يشمل إضافة مزايا
                        جديدة أو إدارة {serviceType === "blogger" ? "المدونة" : "المنصة"} بعد التسليم.
                      </li>
                      {serviceType !== "blogger" && (
                        <li>يتم تسليم المشروع بعد الانتهاء من البنود المتفق عليها وسداد كامل قيمة الباقة.</li>
                      )}
                      <li>
                        في حال تأخر صاحب المشروع في إرسال البيانات أو سداد الدفعات، يحق لمقدم الخدمة إيقاف
                        العمل مؤقتًا حتى استكمال اللازم.
                      </li>
                      <li>توقيع صاحب المشروع على هذا العقد يعني موافقته على الباقة المختارة وقيمتها وشروط تنفيذها.</li>
                    </>
                  )}
                </ol>

                <div className="contract-signoff">
                  <div>
                    <div className="who">الطرف الأول</div>
                    <div>كريم عبد الصادق</div>
                    <div className="role">Kareem Pro — CEO</div>
                  </div>
                  <div className="signed-badge">
                    <CheckIcon size="0.9em" /> وقّع على العقد
                  </div>
                </div>
              </div>

              <div className="agree-row">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <label htmlFor="agree">قرأت بنود العقد أعلاه وأوافق عليها بالكامل.</label>
              </div>

              <div className="field">
                <label>التوقيع — اكتب اسمك الثلاثي كامل</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="مثال: محمد أحمد علي"
                />
              </div>

              {error && <div className="notice notice-error">{error}</div>}

              <div style={{ display: "flex", gap: "0.7rem" }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSelectedPackageId(null);
                    setError(null);
                  }}
                  disabled={isPending}
                >
                  رجوع للباقات
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleAccept}
                  disabled={isPending}
                >
                  {isPending ? "جارِ التوقيع..." : "أوافق على بركة الله"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
