import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Temporary diagnostic endpoint — returns exactly what the live session sees when
// querying its own proposal, including any raw Supabase/PostgREST error object.
// Safe to delete once the "portal shows no proposal" issue is resolved.
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null, userError: userError?.message || null });
  }

  const proposalQuery = await supabase
    .from("proposals")
    .select("*, proposal_packages!proposal_packages_proposal_id_fkey(*)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const rawProposals = await supabase.from("proposals").select("id, client_id, status");

  return NextResponse.json({
    userId: user.id,
    userEmail: user.email,
    proposalQuery: {
      data: proposalQuery.data,
      error: proposalQuery.error,
      status: proposalQuery.status,
      statusText: proposalQuery.statusText,
    },
    rawProposalsVisibleToThisSession: {
      data: rawProposals.data,
      error: rawProposals.error,
      count: rawProposals.data?.length ?? null,
    },
  });
}
