"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendProposalDecisionEmail } from "@/lib/email";
import { buildStagesForProposal, PACKAGE_SETTLEMENTS } from "@/lib/packageStages";
import { isTechfixer } from "@/lib/techfixer-offer";

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
    .select("*, clients(full_name, email), proposal_packages!proposal_packages_proposal_id_fkey(*)")
    .eq("id", proposalId)
    .single();

  if (proposalError || !proposal) throw new Error("العرض غير موجود");
  if (proposal.client_id !== user.id) throw new Error("غير مصرح لك بهذا الإجراء");
  if (proposal.status !== "pending") throw new Error("تم اتخاذ قرار بخصوص هذا العرض بالفعل");

  const chosenPackage = (proposal.proposal_packages || []).find((p) => p.id === packageId);
  if (!chosenPackage) throw new Error("الباقة المختارة غير موجودة");

  // A single database transaction prevents duplicate projects and partial
  // signatures if project/stage creation fails. Only the server can call it.
  const settlement = PACKAGE_SETTLEMENTS[Number(chosenPackage.price)];
  const stages = (buildStagesForProposal(chosenPackage) || []).map((stage, index) => ({
    ...stage,
    status: isTechfixer(chosenPackage.name) && index === 0 ? "awaiting_payment" : "upcoming",
  }));
  const { error: acceptanceError } = await admin.rpc("accept_proposal_atomic", {
    p_proposal_id: proposalId,
    p_package_id: packageId,
    p_client_id: user.id,
    p_signer_name: name,
    p_expected_name: chosenPackage.name,
    p_expected_price: chosenPackage.price,
    p_stages: stages,
    p_discount: settlement?.amount || 0,
    p_discount_note: settlement?.note || null,
  });
  if (acceptanceError) throw new Error(acceptanceError.message);

  try {
    await sendProposalDecisionEmail({
      clientName: proposal.clients.full_name,
      clientEmail: proposal.clients.email,
      status: "accepted",
      packageName: chosenPackage.name,
      price: chosenPackage.price,
      projectTitle: proposal.project_title,
    });
  } catch (error) {
    // The signed contract and in-app notification are already committed.
    console.error("[proposal] accepted email failed:", error?.message);
  }

  revalidatePath("/portal");
  revalidatePath("/admin");
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
  const { data: updated, error: updateError } = await admin
    .from("proposals")
    .update({ status: "rejected", rejection_reason: trimmedReason, decided_at: now })
    .eq("id", proposalId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) throw new Error(updateError.message);
  if (!updated) throw new Error("تم اتخاذ قرار بخصوص هذا العرض بالفعل");

  try {
    await sendProposalDecisionEmail({
      clientName: proposal.clients.full_name,
      clientEmail: proposal.clients.email,
      status: "rejected",
      projectTitle: proposal.project_title,
      reason: trimmedReason,
    });
  } catch (error) {
    console.error("[proposal] rejected email failed:", error?.message);
  }

  await admin.from("notifications").insert({
    client_id: proposal.client_id,
    type: "proposal_rejected",
    message: `${proposal.clients.full_name} رفض العرض — "${proposal.project_title}"`,
    link: "/admin/pipeline",
    for_admin: true,
  });

  revalidatePath("/portal");
  revalidatePath("/admin");
}
