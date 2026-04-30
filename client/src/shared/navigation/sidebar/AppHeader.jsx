import { useLocation } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
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
      className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 px-3"
      style={{
        background: "oklch(0.1465 0.0057 69.1979)",
        borderBottom: "1px solid oklch(0.2684 0.0134 41.6416)",
      }}
    >
      {/* icon badge */}
      <div
        className="flex items-center justify-center w-6 h-6 rounded-md shrink-0"
        style={{ background: "oklch(0.829 0.1712 81.0381 / 0.15)" }}
      >
        <Icon size={13} style={{ color: "oklch(0.829 0.1712 81.0381)" }} />
      </div>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage
              className="font-semibold tracking-wide"
              style={{
                color: "oklch(0.829 0.1712 81.0381)",
                fontSize: "15px",
                letterSpacing: "0.04em",
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
