import { requireAdmin } from "@/lib/admin";
import DeliveryActionCard from "./DeliveryActionCard";

const AVATAR_PALETTE = [
  "linear-gradient(135deg,#ff7b27,#ffad38)",
  "linear-gradient(135deg,#e8720d,#c1590a)",
  "linear-gradient(135deg,#ffad38,#e8720d)",
];

const ACTION_TYPES = [
  {
    key: "invoice",
    icon: "🧾",
    title: "إصدار الفاتورة",
    desc: "إصدار الفاتورة النهائية للمشروع وإرسالها للعميل.",
  },
  {
    key: "review",
    icon: "⭐",
    title: "طلب تقييم",
    desc: "إرسال رسالة للعميل لطلب تقييم بعد استلام المشروع.",
  },
  {
    key: "confirm",
    icon: "✔️",
    title: "تأكيد الاستلام",
    desc: "تأكيد استلام العميل للمشروع بشكل نهائي وإغلاق الملف.",
  },
];

export default async function AdminDeliveryPage() {
  const { supabase } = await requireAdmin();

  const { data: clients } = await supabase
    .from("clients")
    .select("full_name, projects(*)")
    .order("created_at", { ascending: false });

  const projects = (clients || []).flatMap((c) =>
    (c.projects || []).map((p) => ({ ...p, clientName: c.full_name }))
  );

  return (
    <section className="view active">
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="overline">الإدارة والأداء</span>
            <h2>مركز التسليم — مسار الإنتاج لكل مشروع</h2>
          </div>
        </div>

        {projects.length === 0 && <p className="muted">لسه مفيش مشاريع.</p>}

        <div className="delivery-luxe-list">
          {projects.map((p, idx) => {
            const doneMap = {
              invoice: p.invoice_sent_at,
              review: p.review_requested_at,
              confirm: p.delivery_confirmed_at,
            };
            const allDone = ACTION_TYPES.every((t) => !!doneMap[t.key]);

            return (
              <div className="delivery-luxe-card" key={p.id}>
                <div className="delivery-luxe-head">
                  <div className="delivery-luxe-identity">
                    <span
                      className="delivery-luxe-avatar"
                      style={{ background: AVATAR_PALETTE[idx % AVATAR_PALETTE.length] }}
                    >
                      {(p.clientName || "؟").trim().charAt(0)}
                    </span>
                    <div>
                      <div className="delivery-luxe-name">
                        {p.title}{" "}
                        <a className="delivery-luxe-open" href={`/admin/projects/${p.id}`}>
                          فتح المشروع ←
                        </a>
                      </div>
                      <div className="delivery-luxe-sub">{p.clientName}</div>
                    </div>
                  </div>
                  <div className={`delivery-luxe-ready${allDone ? " done" : " pending"}`}>
                    {allDone ? "تم التسليم بالكامل" : "قيد إجراءات التسليم"}
                  </div>
                </div>

                <div className="delivery-luxe-grid">
                  {ACTION_TYPES.map((t) => (
                    <DeliveryActionCard
                      key={t.key}
                      projectId={p.id}
                      actionKey={t.key}
                      icon={t.icon}
                      title={t.title}
                      desc={t.desc}
                      doneAt={doneMap[t.key]}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
