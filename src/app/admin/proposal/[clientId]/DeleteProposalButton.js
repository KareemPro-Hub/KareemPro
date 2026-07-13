"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProposal } from "@/app/admin/actions";

export default function DeleteProposalButton({ proposalId }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!window.confirm("متأكد إنك عايز تحذف العرض ده وتبدأ من جديد ؟")) return;
    startTransition(async () => {
      await deleteProposal(proposalId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className="btn btn-outline btn-sm btn-danger"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "جارِ الحذف..." : "حذف العرض وإرسال عرض جديد"}
    </button>
  );
}
