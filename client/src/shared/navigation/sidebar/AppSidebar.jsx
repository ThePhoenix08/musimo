import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  IconDashboard,
  IconFileAnalytics,
  IconFolder,
  IconHelp,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";
import { NavMain } from "@/shared/navigation/sidebar/NavMain.jsx";
import { NavProjects } from "@/shared/navigation/sidebar/NavProjects.jsx";
import { NavSecondary } from "@/shared/navigation/sidebar/NavSecondary.jsx";
import { NavSidebarHeader } from "@/shared/navigation/sidebar/NavSidebarHeader.jsx";
import { NavUser } from "@/shared/navigation/sidebar/NavUser.jsx";

const SIDEBAR_DATA = {
  navMain: [
    {
      title: "Dashboard",
      url: "/app/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Library",
      url: "/app/projects?view=all",
      icon: IconFolder,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/app/user/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/app/projects?view=search",
      icon: IconSearch,
    },
  ],
};

const DUMMY_PROJECTS = [
  {
    name: "Interstellar",
    url: "/app/projects/12",
    icon: IconFileAnalytics,
  },
  {
    name: "Believer",
    url: "/app/projects/100",
    icon: IconFileAnalytics,
  },
  {
    name: "Why This Kolaveri Di? (The Soup of Love)",
    url: "/app/projects/2046",
    icon: IconFileAnalytics,
  },
];

const DUMMY_USER = {
  user_id: "1abdaa86-e6ca-4312-8753-5b4bc3d50531",
  name: "Chu Feng",
  username: "Qiankun",
  email: "v8ganesh@gmail.com",
  created_at: "2026-02-20T04:57:41.519458+00:00",
  updated_at: "2026-02-20T04:58:09.139349+00:00",
  email_verified: true,
  avatar: "https://i.pravatar.cc/150?img=57",
};

export function AppSidebar() {
  return (
    <Sidebar variant="inset" side="left" collapsible="icon">
      <SidebarHeader>
        <NavSidebarHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={SIDEBAR_DATA.navMain} />
        <NavProjects items={DUMMY_PROJECTS} />
        <NavSecondary items={SIDEBAR_DATA.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={DUMMY_USER} />
      </SidebarFooter>
    </Sidebar>
  );
}
