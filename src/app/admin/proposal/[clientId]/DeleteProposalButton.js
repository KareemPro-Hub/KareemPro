"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProposal } from "@/app/admin/actions";

export default function DeleteProposalButton({ proposalId }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!window.confirm("متأكد إنك عايز تحذف العرض ده وتبدأ من جديد؟")) return;
    startTransition(async () => {
      await deleteProposal(proposalId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      style={{ color: "#ff9d84", borderColor: "rgba(255,85,53,0.4)" }}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "جارِ الحذف..." : "حذف العرض وإرسال عرض جديد"}
    </button>
  );
}
