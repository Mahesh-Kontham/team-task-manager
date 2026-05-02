import { useState } from "react";
import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, FolderKanban, LogOut, Menu, X, Users } from "lucide-react";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";

export default function Layout() {
  const { user, isLoading, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", path: "/projects", icon: FolderKanban },
    // "My Tasks" and "Team" can be added here in the future
  ];

  return (
    <div className="flex min-h-screen w-full bg-background md:bg-muted/40">
      {/* Mobile Topbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b-[0.5px] bg-background px-4">
        <div className="font-medium text-[15px]">TaskFlow</div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-[220px] bg-background border-r-[0.5px] flex flex-col transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="flex h-14 items-center px-6 font-medium text-[15px] border-b-[0.5px] md:border-b-0 md:h-20">
          TaskFlow
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive 
                    ? "bg-muted text-foreground" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t-[0.5px]">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={user.name} />
            <div className="flex flex-col">
              <span className="text-[13px] font-medium leading-none mb-1">{user.name}</span>
              <Badge variant={user.role as any}>{user.role}</Badge>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ml-[220px] pt-14 md:pt-0 min-w-0">
        <div className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
