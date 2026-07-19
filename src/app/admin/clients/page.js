import { requireAdmin } from "@/lib/admin";
import ClientActions from "../ClientActions";
import Money from "@/app/components/Money";
import { clientFinance } from "@/lib/adminFinance";

const AVATAR_PALETTE = [
  "linear-gradient(135deg,#ff7b27,#ffad38)",
  "linear-gradient(135deg,#e8720d,#c1590a)",
  "linear-gradient(135deg,#ffad38,#e8720d)",
];

const OFFER_STYLE = {
  accepted: { icon: "✅", label: "تمت الموافقة", color: "#2f8a4e", bg: "rgba(47,138,78,.12)" },
  pending: { icon: "⏳", label: "قيد المراجعة", color: "#c1590a", bg: "rgba(255,173,56,.18)" },
  rejected: { icon: "✕", label: "مرفوض", color: "#b93a2e", bg: "rgba(185,58,46,.14)" },
};

export default async function AdminClientsPage({ searchParams }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const q = (params?.q || "").trim().toLowerCase();

  const { data: allClients } = await supabase
    .from("clients")
    .select("*, projects(*, stages(*)), proposals(status, created_at)")
    .order("created_at", { ascending: false });

  const clients = q
    ? (allClients || []).filter(
        (c) =>
          (c.full_name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q)
      )
    : allClients || [];

  return (
    <section className="view active">
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="overline">مساحة العمل</span>
            <h2>أصحاب المشاريع {q && <span className="muted" style={{ fontSize: "0.7em" }}>— نتائج البحث عن "{params.q}"</span>}</h2>
          </div>
          <a className="client-luxe-add-btn" href="/admin/clients/new">
            <span>+</span> عميل جديد
          </a>
        </div>

        {clients.length === 0 && <p className="muted">لا يوجد عملاء مطابقون.</p>}

        <div className="client-luxe-list">
          {clients.map((c, idx) => {
            const finance = clientFinance(c);
            const latestProposal = (c.proposals || []).sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            )[0];
            const offer = latestProposal ? OFFER_STYLE[latestProposal.status] : null;

            return (
              <div className="client-luxe-card" key={c.id}>
                <ClientActions clientId={c.id} clientName={c.full_name} />

                <div className="client-luxe-row">
                  <div className="client-luxe-identity">
                    <span
                      className="client-luxe-avatar"
                      style={{ background: AVATAR_PALETTE[idx % AVATAR_PALETTE.length] }}
                    >
                      {(c.full_name || "؟").trim().charAt(0)}
                    </span>
                    <div className="client-luxe-identity-text">
                      <b>
                        {c.full_name}
                        {c.is_test && <span className="client-luxe-test-badge">تجريبي</span>}
                      </b>
                      <span dir="ltr">{c.email}</span>
                    </div>
                  </div>

                  <div className="client-luxe-block">
                    <span className="client-luxe-label">المشاريع</span>
                    {(c.projects || []).length === 0 ? (
                      <b className="muted">لا يوجد</b>
                    ) : (
                      c.projects.map((p) => (
                        <a className="client-luxe-project-link" href={`/admin/projects/${p.id}`} key={p.id}>
                          {p.title}
                        </a>
                      ))
                    )}
                  </div>

                  <div className="client-luxe-block center">
                    <span className="client-luxe-label">العرض الفني</span>
                    {offer ? (
                      <a
                        className="client-luxe-offer-badge"
                        href={`/admin/proposal/${c.id}`}
                        style={{ color: offer.color, background: offer.bg }}
                      >
                        {offer.icon} {offer.label}
                      </a>
                    ) : (
                      <a className="client-luxe-project-link" href={`/admin/proposal/${c.id}`}>
                        + إنشاء عرض
                      </a>
                    )}
                  </div>

                  <div className="client-luxe-balance">
                    <span className="client-luxe-label">الرصيد المالي</span>
                    <b>
                      <Money value={finance.pending} />
                    </b>
                  </div>

                  <div className="client-luxe-split">
                    <div>
                      <span className="client-luxe-label">محصّل</span>
                      <b className="collected">
                        <Money value={finance.collected} />
                      </b>
                    </div>
                    <div className="client-luxe-divider" />
                    <div>
                      <span className="client-luxe-label">متبقي</span>
                      <b className={finance.pending > 0 ? "remaining" : "collected"}>
                        <Money value={finance.pending} />
                      </b>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
