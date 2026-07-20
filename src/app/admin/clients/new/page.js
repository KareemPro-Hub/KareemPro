import { requireAdmin } from "@/lib/admin";
import NewClientForm from "./NewClientForm";

export default async function NewClientPage() {
  await requireAdmin();

  return (
    <section className="view active" style={{ maxWidth: 560 }}>
      <a href="/admin/clients" className="muted" style={{ textDecoration: "none" }}>
        ← رجوع للعملاء
      </a>
      <div className="card" style={{ marginTop: "1.2rem" }}>
        <h1 className="title">إضافة عميل جديد</h1>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          بعد الإنشاء هتبعت له رسالة ترحيب جاهزة على الواتساب فيها زر دخول مباشر
          للوحة تحكمه — من غير اسم مستخدم أو كلمة سر. (وإيميل ترحيبي بيتبعت
          تلقائيًا كنسخة احتياطية.)
        </p>
        <NewClientForm />
      </div>
    </section>
  );
}
