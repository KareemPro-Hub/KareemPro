"use client";

import { useState, useTransition, Fragment, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import RiyalIcon from "@/app/components/RiyalIcon";
import CheckIcon from "@/app/components/CheckIcon";
import { acceptProposal, rejectProposal } from "./proposal-actions";

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

const STEPS = [
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
  { name: "سليمان حسن", role: "AI Specialist" },
  { name: "جويرية هاني", role: "Digital Platforms Developer" },
  { name: "أحمد شاهين", role: "Creative Video Editor" },
  { name: "أسماء المقدم", role: "Social Media Specialist" },
  { name: "مريم أحمد", role: "Graphic & Visual Designer" },
  { name: "ندى رحيم", role: "Office Documentation Specialist" },
];

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

  const radius = size * 0.38;
  const angleFor = (i) => (i / members.length) * 2 * Math.PI - Math.PI / 2;

  return (
    <div className="team-orbit" ref={containerRef}>
      <svg className="team-orbit-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        {members.map((_, i) => {
          const angle = angleFor(i);
          const x = 50 + 38 * Math.cos(angle);
          const y = 50 + 38 * Math.sin(angle);
          return (
            <line
              key={i}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              className={visible ? "team-line-visible" : ""}
              style={{ transitionDelay: `${150 + i * 80}ms` }}
            />
          );
        })}
      </svg>
      <div className="team-avatar team-avatar-center" style={{ backgroundImage: `url(${centerPhoto})` }}>
        <span className="team-crown">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 8l4 3 5-6 5 6 4-3-2 11H5L3 8Z" />
          </svg>
        </span>
      </div>
      {members.map((m, i) => {
        const angle = angleFor(i);
        const dx = radius * Math.cos(angle);
        const dy = radius * Math.sin(angle);
        return (
          <div
            key={i}
            className="team-avatar team-avatar-satellite"
            style={{
              transform: visible
                ? `translate(-50%, -50%) translate(${dx}px, ${dy}px)`
                : "translate(-50%, -50%) translate(0, 0)",
              opacity: visible ? 1 : 0,
              transitionDelay: `${i * 80}ms`,
            }}
          >
            <PersonIcon />
          </div>
        );
      })}
      <div className="team-founder-caption">
        <div className="team-founder-name">{centerName}</div>
        <div className="team-founder-role">{centerRole}</div>
      </div>
    </div>
  );
}

export default function OnboardingFunnel({ clientName, about, portfolio, testimonials, proposal }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [showReject, setShowReject] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [agree, setAgree] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const packages = (proposal.proposal_packages || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
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
    <div>
      <div className="funnel-steps">
        {STEPS.map((s, i) => (
          <Fragment key={s.id}>
            <div className={`funnel-step ${i < stepIndex ? "done" : i === stepIndex ? "active" : ""}`}>
              <s.Icon />
              <span>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`funnel-step-line ${i < stepIndex ? "done" : ""}`} />
            )}
          </Fragment>
        ))}
      </div>

      <div className="card funnel-card">
        {stepIndex < 4 && (
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
          {stepIndex === 0 && (() => {
            const bodyText =
              about?.body || "Kareem Pro شريكك في بناء منتج رقمي احترافي من الفكرة لحد الإطلاق.";
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

          {stepIndex === 1 && (
            <div className="team-section">
              <div className="team-heading">
                <span className="team-heading-bar" />
                <h2 className="title" style={{ fontSize: "1.4rem" }}>
                  فريق يصنع الفرق
                </h2>
                <p className="muted">نخبة من المبدعين يعملون بشغف لتقديم أفضل النتائج</p>
              </div>

              <TeamOrbit
                members={TEAM_MEMBERS}
                centerPhoto="/team/kareem-founder.jpg"
                centerName="كريم عبد الصادق"
                centerRole="CEO & Founder, Kareem Pro"
              />
            </div>
          )}

          {stepIndex === 2 && (
            <>
              <h2 className="title" style={{ fontSize: "1.2rem" }}>
                روائعنا البصرية والتقنية
              </h2>
              {portfolio && portfolio.length > 0 ? (
                <div className="portfolio-grid" style={{ marginTop: "1.2rem" }}>
                  {portfolio.map((item) => {
                    const Wrapper = item.link_url ? "a" : "div";
                    const wrapperProps = item.link_url
                      ? { href: item.link_url, target: "_blank", rel: "noopener noreferrer" }
                      : {};
                    const hasStack = Number(item.stack_count) > 1;
                    return (
                      <div className="portfolio-stack" key={item.id}>
                        {hasStack && (
                          <>
                            <div className="portfolio-stack-layer layer-2" />
                            <div className="portfolio-stack-layer layer-1" />
                          </>
                        )}
                        <Wrapper className="portfolio-item" {...wrapperProps}>
                          <div
                            className="portfolio-item-bg"
                            style={item.image_url ? { backgroundImage: `url(${item.image_url})` } : undefined}
                          />
                          <div className="portfolio-item-tint" />
                          <div className="portfolio-item-shade" />
                          {hasStack && (
                            <span className="portfolio-stack-badge">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="4" width="12" height="12" rx="2" />
                                <path d="M8 20h12a2 2 0 0 0 2 -2v-12" />
                              </svg>
                              +{item.stack_count - 1} أعمال أخرى
                            </span>
                          )}
                          <div className="portfolio-item-body">
                            <div className="portfolio-item-title">{item.title}</div>
                            {item.link_url && (
                              <span className="portfolio-item-cta">
                                شاهد كل الأعمال
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="19" y1="12" x2="5" y2="12" />
                                  <polyline points="11 6 5 12 11 18" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </Wrapper>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted" style={{ marginTop: "1rem" }}>
                  قريبًا هنشاركك نماذج من أعمالنا هنا.
                </p>
              )}
            </>
          )}

          {stepIndex === 3 && (
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

          {stepIndex === 4 && !selectedPackage && !showReject && (
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
                {packages.map((pkg) => {
                  const featureLines = (pkg.features || "")
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean);
                  const [pkgName, pkgTagline] = (pkg.name || "").split("|").map((s) => s.trim());
                  const isPremiumTier = pkgName.includes("الاحترافية");
                  return (
                    <div
                      className={`package-card ${pkg.is_featured ? "featured" : ""} ${isPremiumTier ? "premium-tier" : ""}`}
                      key={pkg.id}
                    >
                      {pkg.is_featured && <span className="package-badge">⭐ الأكثر طلبًا</span>}
                      {isPremiumTier && <span className="package-badge premium-badge">💎 الأرقى والأشمل</span>}
                      <div className="package-head">
                        <div className="package-name">{pkgName}</div>
                        {pkgTagline && <div className="package-tagline">{pkgTagline}</div>}
                        <div className="package-price">
                          <span dir="ltr">{Number(pkg.price).toLocaleString("en-US")}</span>
                          <RiyalIcon size="0.7em" />
                        </div>
                        <div className="package-launch-note">أسعار إطلاق لفترة محدودة لأول عملائنا.</div>
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
                })}
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
                  <li>الاستضافة وقاعدة البيانات (تبدأ مجانية وتُرفع السعة عند الحاجة)</li>
                  <li>
                    حماية الفيديوهات — لو مشروعك يعتمد على محتوى مرئي محمي زي المنصات
                    التعليمية (تبدأ من 600 ريال سنويًا)
                  </li>
                  <li>رسوم بوابة الدفع (حوالي 2.5–3٪ من كل عملية)</li>
                  <li>تجديد الدومين (حوالي 55 ريال سنويًا)</li>
                  <li>
                    حسابات مطوري Apple وGoogle لنشر التطبيقات (حوالي 370 ريال سنويًا و95
                    ريال لمرة واحدة على الترتيب)
                  </li>
                </ul>
                تُحدَّد هذه التكاليف بدقة حسب مشروعك عند البدء.
              </div>
            </>
          )}

          {stepIndex === 4 && showReject && (
            <>
              <h2 className="title" style={{ fontSize: "1.2rem" }}>
                رفض العرض
              </h2>
              <p className="muted" style={{ marginBottom: "1rem" }}>
                ممكن تقولنا السبب؟ ده هيساعدنا نحسّن العرض ليك أو لغيرك.
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

          {stepIndex === 4 && selectedPackage && (
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
                  الطرف الأول: <strong>كريم محمد</strong> — ويشار إليه بـ: Kareem Pro - CEO
                </p>
                <p>
                  والطرف الثاني: <strong>{clientName}</strong> — ويشار إليه باسم: العميل
                </p>

                <p>
                  على تنفيذ مشروع منصة رقمية حسب الباقة التي اختارها العميل من الباقات المعروضة
                  عليه قبل التعاقد.
                </p>

                <p>
                  اسم الباقة المختارة: <strong>{selectedPackage.name.split("|")[0].trim()}</strong>
                </p>
                <p>
                  قيمة الباقة:{" "}
                  <strong>
                    <span dir="ltr">{Number(selectedPackage.price).toLocaleString("en-US")}</span>
                    <RiyalIcon size="0.8em" /> سعودي
                  </strong>
                </p>

                <h4>شروط الاتفاق:</h4>
                <ol className="contract-points">
                  <li>يبدأ تنفيذ المشروع بعد استلام الدفعة الأولى وكافة البيانات اللازمة من العميل.</li>
                  <li>
                    يلتزم مقدم الخدمة بتنفيذ البنود الخاصة بالباقة المختارة فقط، وفق ما تم عرضه
                    والاتفاق عليه قبل توقيع العقد.
                  </li>
                  <li>أي إضافات أو تعديلات خارج الباقة المختارة يتم الاتفاق على تكلفتها ومدة تنفيذها بشكل منفصل.</li>
                  <li>
                    العميل مسؤول عن توفير المحتوى والبيانات والحسابات اللازمة لتنفيذ المشروع، مثل
                    الدومين، بوابة الدفع، وحسابات المتاجر إن لزم الأمر.
                  </li>
                  <li>
                    نشر التطبيق على Google Play وApp Store يخضع لسياسات وموافقة المتاجر، وقد يتطلب
                    وقتًا أو تعديلات إضافية.
                  </li>
                  <li>
                    لا تشمل قيمة الباقة أي رسوم خارجية مثل الدومين، الاستضافة، حساب Apple Developer،
                    حساب Google Play، أو رسوم بوابات الدفع.
                  </li>
                  <li>
                    الدعم الفني يشمل معالجة الأخطاء التقنية الناتجة عن التنفيذ، ولا يشمل إضافة مزايا
                    جديدة أو إدارة المنصة بعد التسليم.
                  </li>
                  <li>يتم تسليم المشروع بعد الانتهاء من البنود المتفق عليها وسداد كامل قيمة الباقة.</li>
                  <li>
                    في حال تأخر العميل في إرسال البيانات أو سداد الدفعات، يحق لمقدم الخدمة إيقاف
                    العمل مؤقتًا حتى استكمال اللازم.
                  </li>
                  <li>توقيع العميل على هذا العقد يعني موافقته على الباقة المختارة وقيمتها وشروط تنفيذها.</li>
                </ol>

                <div className="contract-signoff">
                  <div>
                    <div className="who">الطرف الأول</div>
                    <div>كريم محمد</div>
                    <div className="role">Kareem Pro — CEO</div>
                  </div>
                  <div className="signed-badge">
                    <CheckIcon size="0.9em" /> موقَّع
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
