import { useLocation } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FolderOpen,
  User,
  Settings,
  Bell,
  Music2,
} from "lucide-react";

const ROUTE_META = {
  "/app/dashboard": { label: "Dashboard", icon: LayoutDashboard },
  "/app/projects": { label: "Projects", icon: FolderOpen },
  "/app/user/profile": { label: "Profile", icon: User },
  "/app/user/settings": { label: "Settings", icon: Settings },
  "/app/user/notifications": { label: "Notifications", icon: Bell },
};

function getRouteMeta(pathname) {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];
  if (pathname.startsWith("/app/projects/")) {
    return { label: "Project", icon: Music2 };
  }
  return { label: "Home", icon: LayoutDashboard };
}

export function AppHeader() {
  const location = useLocation();
  const { label, icon: Icon } = getRouteMeta(location.pathname);

  return (
    <header
      className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2.5 px-4"
      style={{
        /* Sits one step lighter than sidebar, one step darker than cards */
        background: "var(--card)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Icon badge — amber tinted, matches accent system */}
      <div
        className="flex items-center justify-center w-6 h-6 rounded-md shrink-0"
        style={{
          background: "color-mix(in oklch, var(--primary) 15%, transparent)",
        }}
      >
        <Icon size={13} style={{ color: "var(--primary)" }} />
      </div>

      {/* Breadcrumb label */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage
              style={{
                color: "var(--foreground)",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              {label}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
