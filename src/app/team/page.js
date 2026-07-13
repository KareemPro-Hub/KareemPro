import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyTasks from "./MyTasks";
import "./team-portal.css";

export default async function TeamPortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/team/login");

  const [{ data: member }, { data: tasks }] = await Promise.all([
    supabase.from("team_members").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("team_tasks")
      .select("*")
      .eq("assignee_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const name = member?.full_name || user.email;

  return (
    <div className="team-portal">
      <header className="team-portal-header">
        <div className="team-portal-brand">
          <img src="/logo-transparent.png" alt="Kareem Pro" />
          <span>Kareem Pro</span>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="team-portal-logout" aria-label="تسجيل الخروج">
            ↪ تسجيل الخروج
          </button>
        </form>
      </header>

      <main className="team-portal-main">
        <div className="team-portal-welcome">
          <h1>أهلًا، {name} 👋</h1>
          <p>هذه مهامك المطلوبة اليوم</p>
        </div>

        <MyTasks tasks={tasks || []} />
      </main>
    </div>
  );
}
