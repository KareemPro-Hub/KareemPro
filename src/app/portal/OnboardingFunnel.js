"use client";

import { useState, useTransition, Fragment } from "react";
import { useRouter } from "next/navigation";
import RiyalIcon from "@/app/components/RiyalIcon";
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
  { id: "portfolio", label: "نماذج أعمالنا", Icon: PortfolioIcon },
  { id: "testimonials", label: "آراء عملائنا", Icon: QuoteIcon },
  { id: "proposal", label: "العرض الفني والمالي", Icon: DocIcon },
];

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
                <h1 className="title">
                  {about?.title || "تعرّف علينا"}
                </h1>

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
            <>
              <h2 className="title" style={{ fontSize: "1.2rem" }}>
                نماذج من أعمالنا
              </h2>
              {portfolio && portfolio.length > 0 ? (
                <div className="portfolio-grid" style={{ marginTop: "1.2rem" }}>
                  {portfolio.map((item) => (
                    <div className="portfolio-item" key={item.id}>
                      {item.image_url && <img src={item.image_url} alt={item.title} />}
                      <div className="portfolio-item-body">
                        <div style={{ fontWeight: 700 }}>{item.title}</div>
                        {item.description && <div className="muted">{item.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ marginTop: "1rem" }}>
                  قريبًا هنشاركك نماذج من أعمالنا هنا.
                </p>
              )}
            </>
          )}

          {stepIndex === 2 && (
            <>
              <h2 className="title" style={{ fontSize: "1.2rem" }}>
                آراء عملائنا
              </h2>
              {testimonials && testimonials.length > 0 ? (
                <div style={{ marginTop: "1.2rem" }}>
                  {testimonials.map((t) => (
                    <div className="testimonial-card" key={t.id}>
                      <div className="quote">&quot;{t.quote}&quot;</div>
                      <div className="who">
                        {t.client_name}
                        {t.role ? ` — ${t.role}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ marginTop: "1rem" }}>
                  قريبًا هنشاركك آراء عملائنا هنا.
                </p>
              )}
            </>
          )}

          {stepIndex === 3 && !selectedPackage && !showReject && (
            <>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={goBack}
                style={{ marginBottom: "1.2rem" }}
              >
                السابق
              </button>
              <h2 className="title" style={{ fontSize: "1.2rem" }}>
                العرض الفني والمالي — {proposal.project_title}
              </h2>
              <p className="muted" style={{ marginBottom: "1.2rem" }}>
                اختر الباقة المناسبة لك عشان نبدأ فورًا.
              </p>
              <div className="package-grid">
                {packages.map((pkg) => {
                  const featureLines = (pkg.features || "")
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean);
                  return (
                    <div className={`package-card ${pkg.is_featured ? "featured" : ""}`} key={pkg.id}>
                      {pkg.is_featured && <span className="package-badge">⭐ الأكثر طلبًا</span>}
                      <div className="package-head">
                        <div className="package-name">{pkg.name}</div>
                        <div className="package-price" dir="ltr">
                          {Number(pkg.price).toLocaleString("en-US")}
                          <RiyalIcon size="0.7em" />
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
                              <span>{line}</span>
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
                <strong style={{ color: "var(--text)" }}>ملاحظة مهمة:</strong> الأسعار أعلاه لا
                تشمل ضريبة القيمة المضافة (VAT) ولا التكاليف التشغيلية المتكررة التي تُدفع
                مباشرة لمزوّدي الخدمة حسب طبيعة مشروعك، ومنها تقريبًا: الاستضافة وقاعدة
                البيانات (تبدأ مجانية وتُرفع السعة عند الحاجة)، حماية الفيديوهات — لو مشروعك
                يعتمد على محتوى مرئي محمي زي المنصات التعليمية (تبدأ من 600 ريال سنويًا)، رسوم
                بوابة الدفع (حوالي 2.5–3٪ من كل عملية)، تجديد الدومين (حوالي 55 ريال سنويًا)،
                وحسابات مطوري Apple وGoogle لنشر التطبيقات (حوالي 370 ريال سنويًا و95 ريال
                لمرة واحدة على الترتيب). تُحدَّد هذه التكاليف بدقة حسب مشروعك عند البدء.
              </div>
            </>
          )}

          {stepIndex === 3 && showReject && (
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

          {stepIndex === 3 && selectedPackage && (
            <>
              <h2 className="title" style={{ fontSize: "1.2rem" }}>
                العقد — {selectedPackage.name}
              </h2>
              <div className="contract-box">
                <h3>عقد اتفاق تنفيذ مشروع</h3>
                <p>
                  يقر <strong>{clientName}</strong> بموافقته على تنفيذ{" "}
                  <strong>&quot;{proposal.project_title}&quot;</strong> مع Kareem Pro، وفق باقة{" "}
                  <strong>{selectedPackage.name}</strong> بقيمة إجمالية قدرها{" "}
                  <strong dir="ltr">
                    {Number(selectedPackage.price).toLocaleString("en-US")}
                    <RiyalIcon size="0.85em" />
                  </strong>
                  .
                </p>
                <p>
                  يبدأ العمل فور اعتماد هذا العقد، ويتم تنفيذ المشروع على مراحل يُحدَّد لكل
                  منها موعد سداد مستقل. نطاق العمل محدد بمميزات الباقة المختارة أعلاه، وأي
                  إضافة خارج هذا النطاق تُحتسب كطلب تعديل منفصل. يلتزم الطرفان بسرية تفاصيل
                  المشروع، ولا يجوز الكشف عنها لطرف ثالث دون موافقة خطية.
                </p>
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
                  {isPending ? "جارِ التوقيع..." : "أوافق وأمضي"}
                </button>
              </div>
            </>
          )}
        </div>

        {stepIndex < 3 && (
          <div className="funnel-nav">
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
      </div>
    </div>
  );
}
