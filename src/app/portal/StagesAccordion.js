"use client";

import { useState } from "react";
import RiyalIcon from "@/app/components/RiyalIcon";
import CheckIcon from "@/app/components/CheckIcon";
import { PAY_STATUS_STYLE, PAY_STATUS_LABEL } from "@/lib/paymentStatus";

const PROD_NODE_STYLE = {
  completed: { color: "#2f8a4e", ring: "linear-gradient(135deg,#3fae66,#2f8a4e)" },
  current: { color: "#c1590a", ring: "linear-gradient(135deg,#ff7b27,#ffad38)" },
  upcoming: { color: "#8a7466", ring: "linear-gradient(135deg,#e7c9a3,#d8b184)" },
};

export default function StagesAccordion({ clientTimeline, clientCurrentIdx, stages }) {
  const [prodOpen, setProdOpen] = useState(Math.max(clientCurrentIdx, 0));
  const [payOpen, setPayOpen] = useState(() => {
    const idx = stages.findIndex((s) => s.status === "awaiting_payment");
    return idx === -1 ? 0 : idx;
  });

  return (
    <div className="stages-accordion-grid">
      <div className="stages-accordion-col">
        <div className="stages-accordion-heading-wrap">
          <div className="stages-accordion-heading">
            <span className="stages-accordion-heading-icon">🛠️</span> مراحل الإنتاج
          </div>
          <div className="stages-accordion-subheading">أين يقف مشروعك الآن في التنفيذ</div>
        </div>
        <div className="stages-accordion-card">
          {clientTimeline.map((item, idx) => {
            const state =
              clientCurrentIdx === -1
                ? idx === 0
                  ? "current"
                  : "upcoming"
                : idx < clientCurrentIdx
                ? "completed"
                : idx === clientCurrentIdx
                ? "current"
                : "upcoming";
            const node = PROD_NODE_STYLE[state];
            const isOpen = idx === prodOpen;
            const isLast = idx === clientTimeline.length - 1;
            return (
              <div
                className={`stages-accordion-row${isLast ? " last" : ""}`}
                key={item.key}
                onClick={() => setProdOpen(isOpen ? -1 : idx)}
              >
                <span className="stages-accordion-node" style={{ background: node.ring }}>
                  {state === "completed" ? <CheckIcon size="0.8em" color="#fff" /> : idx + 1}
                </span>
                <div className="stages-accordion-row-body">
                  <span className="stages-accordion-row-title">{item.title}</span>
                  {isOpen && <p className="stages-accordion-row-desc">{item.desc}</p>}
                </div>
                <span className={`stages-accordion-chevron${isOpen ? " open" : ""}`}>‹</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stages-accordion-col">
        <div className="stages-accordion-heading-wrap">
          <div className="stages-accordion-heading">
            <span className="stages-accordion-heading-icon">💳</span> مراحل السداد
          </div>
          <div className="stages-accordion-subheading">مراحل سداد قيمة الباقة على دفعات</div>
        </div>
        <div className="stages-accordion-card">
          {stages.length === 0 ? (
            <p className="stages-accordion-empty">لا توجد مراحل سداد مسجلة لهذا المشروع بعد.</p>
          ) : (
            stages.map((stage, idx) => {
              const st = PAY_STATUS_STYLE[stage.status] || PAY_STATUS_STYLE.upcoming;
              const isOpen = idx === payOpen;
              const isLast = idx === stages.length - 1;
              return (
                <div
                  className={`stages-accordion-row${isLast ? " last" : ""}`}
                  key={stage.id}
                  onClick={() => setPayOpen(isOpen ? -1 : idx)}
                >
                  <span className="stages-accordion-node" style={{ background: st.ring }}>
                    {st.icon === "✓" ? <CheckIcon size="0.75em" color="#fff" /> : stage.stage_number}
                  </span>
                  <div className="stages-accordion-row-body">
                    <div className="stages-accordion-row-title-line">
                      <span className="stages-accordion-row-title">{stage.title}</span>
                      <span
                        className="stages-accordion-badge"
                        style={{ color: st.color, background: st.bg }}
                      >
                        {PAY_STATUS_LABEL[stage.status] || stage.status}
                      </span>
                    </div>
                    {stage.description && (
                      <p className="stages-accordion-row-desc">{stage.description}</p>
                    )}
                    <p className="stages-accordion-row-amount">
                      قيمة المرحلة:{" "}
                      <span dir="ltr">{Number(stage.amount || 0).toLocaleString("en-US")}</span>{" "}
                      <RiyalIcon size="0.8em" />
                    </p>
                    {isOpen && stage.status === "awaiting_payment" && (
                      <div className="stages-accordion-instructions" onClick={(e) => e.stopPropagation()}>
                        <p>
                          هذه المرحلة بانتظار السداد لبدء التنفيذ. التحويل يكون{" "}
                          <strong>دوليًا من بنك الراجحي إلى بنك مصر</strong>.
                        </p>
                        <p>
                          نزّل ملف بيانات المستفيد وأضفه في تطبيق الراجحي لكي يتم التحويل
                          الدولي بنجاح:{" "}
                          <a
                            href="/kareem-pro-bank-beneficiary-guide.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            تحميل بيانات المستفيد (PDF)
                          </a>
                        </p>
                        <p>
                          بعد التحويل، فضلاً زودنا بصورة الإيصال عبر الواتساب على الرقم{" "}
                          <a
                            href="https://wa.me/966507069605"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            966507069605+
                          </a>{" "}
                          لننطلق مباشرة.
                        </p>
                      </div>
                    )}
                  </div>
                  <span className={`stages-accordion-chevron${isOpen ? " open" : ""}`}>‹</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
