import { createAdminClient } from "@/lib/supabase/server";

// Every download goes through a short-lived signed URL instead of a public
// bucket URL — the "project-files" bucket is private (contracts/invoices
// are sensitive), so this is the only way to actually reach a file, and it
// always requires an ownership check to have already happened by the caller.
export async function createSignedFileUrl(storagePath, expiresIn = 300) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("project-files").createSignedUrl(storagePath, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
