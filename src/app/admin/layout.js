// The light/white theme (".admin-light" in globals.css) is applied per-page
// instead of here, because /admin/login keeps its own dark cinematic design
// (glass card + glow blobs) and must NOT inherit the light theme — a shared
// wrapper here would force it on every route including login.
export default function AdminLayout({ children }) {
  return children;
}
