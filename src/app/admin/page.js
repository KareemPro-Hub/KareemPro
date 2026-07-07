import { requireAdmin } from "@/lib/admin";
import RiyalIcon from "@/app/components/RiyalIcon";
import ClientsTable from "./ClientsTable";

function clientFinance(client) {
  let contracted = 0;
  let collected = 0;
  (client.projects || []).forEach((p) => {
    contracted += Number(p.package_price) || 0;
    (p.stages || []).forEach((s) => {
      if (["paid", "in_progress", "completed"].includes(s.status)) {
        collected += Number(s.amount) || 0;
      }
    });
  });
  return { contracted, collected, pending: Math.max(contracted - collected, 0) };
}

function Money({ value }) {
  return (
    <span>
      <span dir="ltr">{Number(value).toLocaleString("en-US")}</span>
      <RiyalIcon size="0.85em" />
    </span>
  );
}

export default async function AdminHome() {
  const { supabase } = await requireAdmin();

  const { data: clients } = await supabase
    .from("clients")
    .select("*, projects(*, stages(*)), proposals(status, created_at)")
    .order("created_at", { ascending: false });

  const finances = (clients || []).map((c) => ({ client: c, finance: clientFinance(c) }));
  const totals = finances.reduce(
    (acc, { finance }) => ({
      contracted: acc.contracted + finance.contracted,
      collected: acc.collected + finance.collected,
      pending: acc.pending + finance.pending,
    }),
    { contracted: 0, collected: 0, pending: 0 }
  );

  return (
    <div className="shell">
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <span className="stat-value">{(clients || []).length}</span>
          <span className="stat-label">إجمالي العملاء</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📄</span>
          <span className="stat-value">
            <Money value={totals.contracted} />
          </span>
          <span className="stat-label">إجمالي قيمة العقود</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <span className="stat-value stat-value-positive">
            <Money value={totals.collected} />
          </span>
          <span className="stat-label">إجمالي المُحصَّل</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <span className="stat-value stat-value-warning">
            <Money value={totals.pending} />
          </span>
          <span className="stat-label">إجمالي المستحق</span>
        </div>
      </div>

      <ClientsTable rows={finances} />
    </div>
  );
}
