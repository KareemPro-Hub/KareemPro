import { requireAdmin } from "@/lib/admin";
import TeamBoard from "./TeamBoard";

export default async function AdminTeamPage() {
  const { supabase } = await requireAdmin();

  const [{ data: members }, { data: tasks }] = await Promise.all([
    supabase.from("team_members").select("*").order("created_at", { ascending: true }),
    supabase.from("team_tasks").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <section className="view active">
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="overline">فريق العمل</span>
            <h2>مين شغال على إيه دلوقتي</h2>
          </div>
        </div>

        <TeamBoard members={members || []} tasks={tasks || []} />
      </div>
    </section>
  );
}
