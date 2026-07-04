"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendProposalDecisionEmail } from "@/lib/email";

// ── Client accepts a proposal: picks one package and signs with their full name. ──
export async function acceptProposal({ proposalId, packageId, signerName }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");

  const name = (signerName || "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length < 3) throw new Error("من فضلك اكتب اسمك الثلاثي كامل كتوقيع");

  const admin = createAdminClient();

  const { data: proposal, error: proposalError } = await admin
    .from("proposals")
    .select("*, clients(full_name, email), proposal_packages(*)")
    .eq("id", proposalId)
    .single();

  if (proposalError || !proposal) throw new Error("العرض غير موجود");
  if (proposal.client_id !== user.id) throw new Error("غير مصرح لك بهذا الإجراء");
  if (proposal.status !== "pending") throw new Error("تم اتخاذ قرار بخصوص هذا العرض بالفعل");

  const chosenPackage = (proposal.proposal_packages || []).find((p) => p.id === packageId);
  if (!chosenPackage) throw new Error("الباقة المختارة غير موجودة");

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("proposals")
    .update({
      status: "accepted",
      selected_package_id: packageId,
      signer_name: name,
      signed_at: now,
      decided_at: now,
    })
    .eq("id", proposalId);

  if (updateError) throw new Error(updateError.message);

  await sendProposalDecisionEmail({
    clientName: proposal.clients.full_name,
    clientEmail: proposal.clients.email,
    status: "accepted",
    packageName: chosenPackage.name,
    price: chosenPackage.price,
    projectTitle: proposal.project_title,
  });

  revalidatePath("/portal");
}

// ── Client rejects a proposal with a required reason. ──
export async function rejectProposal({ proposalId, reason }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول");

  const trimmedReason = (reason || "").trim();
  if (trimmedReason.length < 3) throw new Error("من فضلك اكتب سبب الرفض");

  const admin = createAdminClient();
  const { data: proposal, error: proposalError } = await admin
    .from("proposals")
    .select("*, clients(full_name, email)")
    .eq("id", proposalId)
    .single();

  if (proposalError || !proposal) throw new Error("العرض غير موجود");
  if (proposal.client_id !== user.id) throw new Error("غير مصرح لك بهذا الإجراء");
  if (proposal.status !== "pending") throw new Error("تم اتخاذ قرار بخصوص هذا العرض بالفعل");

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("proposals")
    .update({ status: "rejected", rejection_reason: trimmedReason, decided_at: now })
    .eq("id", proposalId);

  if (updateError) throw new Error(updateError.message);

  await sendProposalDecisionEmail({
    clientName: proposal.clients.full_name,
    clientEmail: proposal.clients.email,
    status: "rejected",
    projectTitle: proposal.project_title,
    reason: trimmedReason,
  });

  revalidatePath("/portal");
}
