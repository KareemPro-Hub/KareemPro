"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createSignedFileUrl } from "@/lib/projectFiles";

// ── Client gets a real download/open URL for one of their own project
// files — a signed storage URL for real uploads, or the external URL as-is
// for "link" type entries. Ownership is verified before anything is
// generated, same pattern as every other client-facing action here. ──
export async function getMyFileUrl(fileId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");
  if (!fileId) throw new Error("معرّف الملف مفقود");

  const admin = createAdminClient();
  const { data: file, error } = await admin
    .from("project_files")
    .select("client_id, storage_path, external_url")
    .eq("id", fileId)
    .single();
  if (error) throw new Error(error.message);
  if (file.client_id !== user.id) throw new Error("غير مصرح لك بهذا الإجراء");

  if (file.external_url) return file.external_url;
  return createSignedFileUrl(file.storage_path);
}
