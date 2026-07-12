import { requireAdmin } from "@/lib/admin";
import { inviteClient } from "@/app/admin/actions";

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
          هنبعت للعميل إيميل دعوة لإنشاء حساب الدخول للبوابة تلقائيًا.
        </p>
        <form action={inviteClient}>
          <div className="field">
            <label>اسم صاحب المشروع</label>
            <input type="text" name="full_name" required />
          </div>
          <div className="field">
            <label>البريد الإلكتروني</label>
            <input type="email" name="email" required dir="ltr" />
          </div>
          <div className="field">
            <label>رقم الجوال (اختياري)</label>
            <input type="text" name="phone" dir="ltr" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            إرسال الدعوة وإضافة صاحب المشروع
          </button>
        </form>
      </div>
    </section>
  );
}
