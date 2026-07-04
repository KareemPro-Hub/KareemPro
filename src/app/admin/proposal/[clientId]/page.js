import { requireAdmin } from "@/lib/admin";
import NewProposalForm from "./NewProposalForm";
import DeleteProposalButton from "./DeleteProposalButton";

const STATUS_LABEL = {
  pending: "بانتظار قرار العميل",
  accepted: "تمت الموافقة ✅",
  rejected: "مرفوض ⚠️",
};

export default async function ClientProposalPage({ params }) {
  const { clientId } = await params;
  const { supabase } = await requireAdmin();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!client) {
    return (
      <div className="shell">
        <p className="muted">العميل غير موجود.</p>
      </div>
    );
  }

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*, proposal_packages!proposal_packages_proposal_id_fkey(*)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="shell">
      <a href="/admin" className="muted" style={{ textDecoration: "none" }}>
        ← رجوع للوحة التحكم
      </a>

      <h1 className="title" style={{ marginTop: "1rem" }}>
        العرض الفني والمالي — {client.full_name}
      </h1>
      <p className="muted" style={{ marginBottom: "1.6rem" }} dir="ltr">
        {client.email}
      </p>

      {proposal ? (
        <div className="card">
          <span className="tag">{STATUS_LABEL[proposal.status] || proposal.status}</span>
          <h2 className="title" style={{ marginTop: "0.7rem", fontSize: "1.15rem" }}>
            {proposal.project_title}
          </h2>

          {(proposal.proposal_packages || [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((pkg) => (
              <div
                key={pkg.id}
                className="card"
                style={{
                  marginTop: "1rem",
                  border:
                    proposal.selected_package_id === pkg.id
                      ? "1px solid rgba(37,211,102,0.5)"
                      : undefined,
                }}
              >
                <div className="stage-head">
                  <span className="stage-title">
                    {pkg.is_featured && "⭐ "}
                    {pkg.name}
                  </span>
                  {proposal.selected_package_id === pkg.id && (
                    <span className="stage-status completed">الباقة المختارة</span>
                  )}
                </div>
                <p className="stage-amount" dir="ltr">
                  {Number(pkg.price).toLocaleString("en-US")}
                </p>
                {pkg.features && (
                  <p className="stage-desc" style={{ whiteSpace: "pre-line" }}>
                    {pkg.features}
                  </p>
                )}
              </div>
            ))}

          <div
            className="notice"
            style={{
              marginTop: "1.2rem",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              fontSize: "0.82rem",
            }}
          >
            <strong style={{ color: "var(--text)" }}>ملاحظة تظهر للعميل:</strong> الأسعار لا
            تشمل VAT ولا التكاليف التشغيلية المتكررة (استضافة/قاعدة بيانات، حماية الفيديوهات
            لو محتوى مرئي محمي، رسوم بوابة الدفع، تجديد الدومين، حسابات مطوري Apple/Google).
          </div>

          {proposal.status === "rejected" && proposal.rejection_reason && (
            <div className="notice notice-error" style={{ marginTop: "1.2rem" }}>
              سبب الرفض: {proposal.rejection_reason}
            </div>
          )}

          {proposal.status === "accepted" && (
            <div className="notice notice-ok" style={{ marginTop: "1.2rem" }}>
              وقّع باسم: {proposal.signer_name} —{" "}
              {new Date(proposal.signed_at).toLocaleString("en-US")}
            </div>
          )}

          <div style={{ marginTop: "1.2rem" }}>
            <DeleteProposalButton proposalId={proposal.id} />
          </div>
        </div>
      ) : (
        <NewProposalForm clientId={clientId} />
      )}
    </div>
  );
}
