"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendClientNoteEmail } from "@/lib/email";

// ══════════════════ Client notes/ideas ("أفكارك وملاحظاتك") ══════════════════
// A client-side twin of the admin checklist: the client jots down ideas or
// requests about their own project(s), privately at first. Nothing reaches
// Kareem until the client explicitly hits "إرسال لكريم" on that note — see
// sendMyNoteToAdmin below, which is the only path that actually notifies him
// (real admin notification + real email, same reliability pattern used for
// proposal accept/reject).

// ── Client adds a new private note, optionally tagged to one of their own
// projects. Returns the inserted row (with the project title embedded) so
// the client component can push it straight into local state. ──
export async function addMyNote(text, projectId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");

  const clean = (text || "").toString().trim();
  if (!clean) throw new Error("اكتب ملاحظة أولاً");

  const admin = createAdminClient();

  if (projectId) {
    const { data: project, error: projErr } = await admin
      .from("projects")
      .select("client_id")
      .eq("id", projectId)
      .single();
    if (projErr) throw new Error(projErr.message);
    if (project.client_id !== user.id) throw new Error("غير مصرح لك بهذا الإجراء");
  }

  const { data, error } = await admin
    .from("client_notes")
    .insert({ client_id: user.id, project_id: projectId || null, text: clean })
    .select("*, projects(title)")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/portal");
  return data;
}

// ── Client sends one of their own (not-yet-sent) notes to the admin for
// real — stamps sent_to_admin/sent_at, drops a real `for_admin` notification
// row, and emails Kareem directly so it can't be missed. ──
export async function sendMyNoteToAdmin(noteId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  if (!noteId) throw new Error("معرّف الملاحظة مفقود");

  const admin = createAdminClient();
  const { data: note, error: fetchError } = await admin
    .from("client_notes")
    .select("client_id, project_id, text, sent_to_admin, projects(title), clients(full_name, email)")
    .eq("id", noteId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (note.client_id !== user.id) throw new Error("غير مصرح لك بهذا الإجراء");
  if (note.sent_to_admin) return;

  const clientName = note.clients?.full_name || "عميل";
  const clientEmail = note.clients?.email || user.email;
  const projectTitle = note.projects?.title || "مشروعك";

  const { error } = await admin
    .from("client_notes")
    .update({ sent_to_admin: true, sent_at: new Date().toISOString() })
    .eq("id", noteId);
  if (error) throw new Error(error.message);

  await admin.from("notifications").insert({
    client_id: user.id,
    project_id: note.project_id,
    type: "client_note",
    message: `${clientName} أرسل ملاحظة بخصوص "${projectTitle}": ${note.text}`,
    link: "/admin/pipeline",
    for_admin: true,
  });

  try {
    await sendClientNoteEmail({ clientName, clientEmail, projectTitle, text: note.text });
  } catch {
    // The in-app admin notification already landed — an email hiccup
    // shouldn't fail the whole action from the client's point of view.
  }

  revalidatePath("/portal");
  revalidatePath("/admin");
  revalidatePath("/admin/pipeline");
}

// ── Client permanently deletes one of their own notes (e.g. added by
// mistake, or a private draft they no longer want). ──
export async function deleteMyNote(noteId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  if (!noteId) throw new Error("معرّف الملاحظة مفقود");

  const admin = createAdminClient();
  const { data: note, error: fetchError } = await admin
    .from("client_notes")
    .select("client_id")
    .eq("id", noteId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (note.client_id !== user.id) throw new Error("غير مصرح لك بهذا الإجراء");

  const { error } = await admin.from("client_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);
  revalidatePath("/portal");
}
