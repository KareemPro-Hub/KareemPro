import { requireAdmin } from "@/lib/admin";
import NewProjectForm from "./NewProjectForm";

export default async function NewProjectPage() {
  const { supabase } = await requireAdmin();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, email")
    .order("created_at", { ascending: false });

  return (
    <section className="view active" style={{ maxWidth: 640 }}>
      <a href="/admin/projects" className="muted" style={{ textDecoration: "none" }}>
        ← رجوع للمشاريع
      </a>
      <div className="card" style={{ marginTop: "1.2rem" }}>
        <h1 className="title">مشروع جديد</h1>
        {(!clients || clients.length === 0) ? (
          <p className="muted">
            لازم تضيف عميل الأول قبل ما تنشئ مشروع.{" "}
            <a href="/admin/clients/new" style={{ color: "var(--g2)" }}>
              إضافة عميل
            </a>
          </p>
        ) : (
          <NewProjectForm clients={clients} />
        )}
      </div>
    </section>
  );
}
