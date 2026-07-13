import { redirect } from "next/navigation";

// The admin/client/team logins are now one shared screen with a 3-way tab
// picker at /login — this route just bounces there with the team tab
// preselected, so any existing links/redirects to /team/login still work.
export default function TeamLoginRedirect() {
  redirect("/login?role=team");
}
