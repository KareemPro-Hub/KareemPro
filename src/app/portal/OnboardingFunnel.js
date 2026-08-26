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
  { id: "team", label: "الفريق", Icon: TeamIcon },
  { id: "portfolio", label: "نماذج أعمالنا", Icon: PortfolioIcon },
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
const PORTFOLIO_COVERS={"مونتاج احترافي":["https://img.youtube.com/vi/X4k2BYJuKbk/hqdefault.jpg"],"عرض مرئي":["https://img.youtube.com/vi/XA5TXQpjNrc/hqdefault.jpg"],"تعليق صوتي":["https://img.youtube.com/vi/g94wHiCSEDk/hqdefault.jpg"],"ريلز وسناب":["https://img.youtube.com/vi/zhNVbDO2lcw/hqdefault.jpg","https://img.youtube.com/vi/OG7rtRnAjvQ/hqdefault.jpg","https://img.youtube.com/vi/lMWqyAV96SI/hqdefault.jpg"]};
const PORTFOLIO_DESCRIPTIONS={"مونتاج احترافي":"مونتاج احترافي يصنع من كل لقطة قصة تستحق المشاهدة.","عرض مرئي":"نصنع من فكرتك عرضًا بصريًا يترك أثرًا لا يُنسى.","تعليق صوتي":"نمنح عملك صوتًا يليق بقيمته.","ريلز وسناب":"نستخرج من التفاصيل الصغيرة قصة تستحق المشاهدة.","منصات وتطبيقات":"نحوّل فكرتك إلى منصة رقمية تليق بقيمة مشروعك."};

// Hub-and-spoke team diagram: a center "founder" avatar with satellite
// member avatars that burst outward from the center the first time the
// diagram scrolls into view (measured in real pixels via ResizeObserver so
// it stays correct at any container width, then animated with a staggered
// CSS transition) — same interaction as the reference design.
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
function detectServiceType(text) {
  const t = text || "";
  if (/بلوجر|blogger/i.test(t)) return "blogger";
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
};

const SERVICE_META = {
  blogger: { partyRole: "صاحب مدونة بلوجر", serviceLine: "مدونة بلوجر ربحية" },
  pharmacy: { partyRole: "صاحب منصة Urs", serviceLine: "منصة SaaS لإدارة الصيدليات" },
  voiceover: { partyRole: "صاحب التعليق الصوتي", serviceLine: "تعليق صوتي إبداعي" },
  video: { partyRole: "صاحب الفيديو", serviceLine: "فيديو سينمائي احترافي" },
  "platform-apps": { partyRole: "صاحب المنصة الرقمية", serviceLine: "منصة رقمية مع التطبيقات" },
  platform: { partyRole: "صاحب المنصة الرقمية", serviceLine: "منصة رقمية" },
};

// "نماذج أعمالنا" shows different portfolio_items depending on what the
// client is actually buying — a pharmacy/platform prospect doesn't care
// about video-editing or voiceover reels, and showing those would look
// off-brief. Matched against portfolio_items.title (see PORTFOLIO_COVERS
// above, same source of truth). Types not listed here (blogger never shows
// this step at all) fall through to showing everything, unfiltered.
const PORTFOLIO_CATEGORIES_BY_SERVICE = {
  pharmacy: ["منصات وتطبيقات"],
  platform: ["منصات وتطبيقات"],
  "platform-apps": ["منصات وتطبيقات"],
  video: ["مونتاج احترافي", "عرض مرئي", "ريلز وسناب"],
  voiceover: ["تعليق صوتي"],
};

// Only these categories are actual video/reel work — used to decide whether
// the "▶ play" bubble should render on a portfolio slide. Non-video
// categories (e.g. "منصات وتطبيقات", which shows website/platform
// screenshots) must never get a play icon.
const VIDEO_PORTFOLIO_TITLES = new Set([
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
  const steps = serviceType === "blogger" ? ALL_STEPS.filter((s) => s.id !== "portfolio") : ALL_STEPS;
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
              className="btn btn-outline btn-sm"
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              السابق
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={goNext}>
              التالي
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
                members={TEAM_MEMBERS}
                centerPhoto="/team/kareem-founder.jpg"
                centerName="كريم عبد الصادق"
                centerRole="CEO & Founder, Kareem Pro"
              />
            </div>
          )}

          {currentStepId === "portfolio" && (
            <section className="works-showcase">
              <div className="works-carousel-head">
                {visiblePortfolio && visiblePortfolio.length > 1 && (
                  <div className="works-arrows">
                    <button type="button" onClick={() => setPortfolioIndex((portfolioIndex - 1 + visiblePortfolio.length) % visiblePortfolio.length)}>‹</button>
                    <button type="button" onClick={() => setPortfolioIndex((portfolioIndex + 1) % visiblePortfolio.length)}>›</button>
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
                    const coverImages=PORTFOLIO_COVERS[item.title]||[item.image_url].filter(Boolean);
                    const itemLabel = item.description || item.title;
                    return (
                      <button
                        type="button"
                        className={`works-slide${offset === 0 ? " active" : ""}`}
                        key={item.id}
                        onClick={() => {
                          if (offset === 0 && item.link_url) {
                            window.open(item.link_url, "_blank", "noopener,noreferrer");
                          } else {
                            setPortfolioIndex(index);
                          }
                        }}
                        style={{ "--offset": offset }}
                      >
                          {coverImages.length>1?<div className="works-cover-strip">{coverImages.map((src)=><span key={src} style={{backgroundImage:`url(${src})`}}><i>▶</i></span>)}</div>:<div className="works-card-bg" style={coverImages[0]?{backgroundImage:`url(${coverImages[0]})`}:undefined}/>}
                          <div className="works-card-shade" />
                          {hasStack && (
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
                  {visiblePortfolio[portfolioIndex]?.link_url ? <a href={visiblePortfolio[portfolioIndex].link_url} target="_blank" rel="noopener noreferrer">شاهد كل الأعمال ←</a> : <span className="works-detail-button">شاهد كل الأعمال ←</span>}
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
              <div className="package-grid">
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
                      {isPremiumTier && <span className="package-badge premium-badge">💎 الأرقى والأشمل</span>}
                      <div className="package-head">
                        <div className="package-name">{pkgName}</div>
                        {pkgTagline && <div className="package-tagline">{pkgTagline}</div>}
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
                        <div className="package-launch-note">عرض خاص لأول تعاون معنا ❤️</div>
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
                              <span>{line.startsWith("كل مميزات") ? <strong>{line}</strong> : line}</span>
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

              <div className="notice" style={{ marginTop: "1.4rem", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                <strong style={{ color: "var(--text)", display: "block", marginBottom: "0.5rem" }}>
                  ملاحظة مهمة:
                </strong>
                الأسعار أعلاه لا تشمل التكاليف التشغيلية المتكررة التي تُدفع مباشرة لمزوّدي
                الخدمة حسب طبيعة مشروعك، ومنها تقريبًا:
                <ul className="cost-list">
                  {serviceType === "blogger" ? (
                    <>
                      <li>رسوم بوابة الدفع لو احتجت لاحقًا ربط وسيلة دفع بالمدونة (حوالي 2.5–3٪ من كل عملية).</li>
                      <li>
                        تجديد الدومين — يُدفع مباشرة لمزوّد الدومين، حوالي 10$ سنويًا تقريبًا، وقد يزيد
                        قليلًا حسب سياسة أسعار الشركة المزوّدة.
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
                  {serviceType === "blogger" && (
                    <>
                      {" "}(ثلاث دفعات 300<RiyalIcon size="0.75em" tone="dark" /> — مقدم، بعد إعداد
                      الصفحات الإلزامية، وعند تسليم المدونة وكتابة المقالات الخمس التأسيسية)
                    </>
                  )}
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
                  {serviceType === "pharmacy" ? (
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
                        في حال تأخر صاحب المشروع في إرسال البيانات أو سداد أي دفعة لأكثر من 14 يومًا،
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
                      <li>
                        تقتصر مسؤولية مقدم الخدمة على قيمة الباقة المتفق عليها فقط، ويتحمل صاحب المشروع
                        وحده أي رسوم خارجية تفرضها جهات أخرى خارج نطاق هذا الاتفاق.
                      </li>
                      <li>
                        الدعم الفني يشمل معالجة الأخطاء التقنية الناتجة عن التنفيذ، ولا يشمل إضافة مزايا
                        جديدة أو إدارة المنصة بعد التسليم.
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
