import { requireAdmin } from "@/lib/admin";
import {
  updateAboutContent,
  addPortfolioItem,
  deletePortfolioItem,
  addTestimonial,
  deleteTestimonial,
} from "@/app/admin/actions";
import DeleteItemButton from "./DeleteItemButton";

export default async function AdminContentPage() {
  const { supabase } = await requireAdmin();

  const [{ data: about }, { data: portfolio }, { data: testimonials }] = await Promise.all([
    supabase.from("site_content").select("*").eq("key", "about_us").maybeSingle(),
    supabase.from("portfolio_items").select("*").order("sort_order", { ascending: true }),
    supabase.from("testimonials").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="admin-light">
    <div className="shell">
      <a href="/admin" className="muted" style={{ textDecoration: "none" }}>
        ← رجوع للوحة التحكم
      </a>

      <h1 className="title" style={{ marginTop: "1rem" }}>
        المحتوى العام
      </h1>
      <p className="muted" style={{ marginBottom: "1.6rem" }}>
        هذا المحتوى يظهر لكل العملاء الجدد قبل ما يشوفوا العرض الفني الخاص بيهم.
      </p>

      <div className="card">
        <h2 className="title" style={{ fontSize: "1.1rem" }}>
          تعرّف علينا
        </h2>
        <form action={updateAboutContent}>
          <div className="field">
            <label>العنوان</label>
            <input type="text" name="title" required defaultValue={about?.title || ""} />
          </div>
          <div className="field">
            <label>النص التسويقي</label>
            <textarea name="body" rows={5} required defaultValue={about?.body || ""} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            حفظ
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="title" style={{ fontSize: "1.1rem" }}>
          نماذج من الأعمال
        </h2>

        {(portfolio || []).map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              padding: "0.7rem 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{item.title}</div>
              {item.description && <div className="muted">{item.description}</div>}
              {item.link_url && (
                <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="muted" style={{ fontSize: "0.8rem" }}>
                  {item.link_url}
                </a>
              )}
              {item.stack_count > 1 && (
                <div className="muted" style={{ fontSize: "0.8rem" }}>
                  شارة العدد: +{item.stack_count - 1} أعمال أخرى
                </div>
              )}
            </div>
            <DeleteItemButton action={deletePortfolioItem} id={item.id} label="نموذج" />
          </div>
        ))}
        {(!portfolio || portfolio.length === 0) && (
          <p className="muted">لسه مفيش نماذج مضافة.</p>
        )}

        <form action={addPortfolioItem} style={{ marginTop: "1.2rem" }}>
          <div className="field">
            <label>عنوان النموذج</label>
            <input type="text" name="title" required placeholder="مثال: منصة إدارة العيادات" />
          </div>
          <div className="field">
            <label>وصف مختصر (اختياري)</label>
            <textarea name="description" rows={2} />
          </div>
          <div className="field">
            <label>رابط صورة (اختياري)</label>
            <input type="url" name="image_url" placeholder="https://..." />
          </div>
          <div className="field">
            <label>رابط المشروع/الخدمة (اختياري — يفتح عند ضغط العميل على الكارت)</label>
            <input type="url" name="link_url" placeholder="https://..." />
          </div>
          <div className="field">
            <label>عدد الأعمال في نفس التصنيف (اختياري — يظهر شارة &quot;+رقم أعمال أخرى&quot; مع تأثير كروت متكدسة خلف الكارت)</label>
            <input type="number" name="stack_count" min="2" placeholder="مثال: 6" />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            + إضافة نموذج
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="title" style={{ fontSize: "1.1rem" }}>
          آراء العملاء
        </h2>

        {(testimonials || []).map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              padding: "0.7rem 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>
                {t.client_name} {t.role && <span className="muted">— {t.role}</span>}
              </div>
              <div className="muted">{t.quote}</div>
            </div>
            <DeleteItemButton action={deleteTestimonial} id={t.id} label="رأي" />
          </div>
        ))}
        {(!testimonials || testimonials.length === 0) && (
          <p className="muted">لسه مفيش آراء مضافة.</p>
        )}

        <form action={addTestimonial} style={{ marginTop: "1.2rem" }}>
          <div className="field">
            <label>اسم العميل</label>
            <input type="text" name="client_name" required />
          </div>
          <div className="field">
            <label>الصفة/الشركة (اختياري)</label>
            <input type="text" name="role" />
          </div>
          <div className="field">
            <label>نص الرأي</label>
            <textarea name="quote" rows={3} required />
          </div>
          <div className="field">
            <label>رابط صورة شخصية (اختياري)</label>
            <input type="url" name="avatar_url" placeholder="https://..." />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            + إضافة رأي
          </button>
        </form>
      </div>
    </div>
    </div>
  );
}
