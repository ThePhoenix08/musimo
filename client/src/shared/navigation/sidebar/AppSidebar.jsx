import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
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
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/auth/state/slices/auth.slice";

const SIDEBAR_DATA = {
  navMain: [
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
      title: "Search",
      url: "/app/projects?view=search",
      icon: IconSearch,
    },
  ],
};

// const DUMMY_PROJECTS = [
//   {
//     name: "Interstellar",
//     url: "/app/projects/12",
//     icon: IconFileAnalytics,
//   },
//   {
//     name: "Believer",
//     url: "/app/projects/100",
//     icon: IconFileAnalytics,
//   },
//   {
//     name: "Why This Kolaveri Di? (The Soup of Love)",
//     url: "/app/projects/2046",
//     icon: IconFileAnalytics,
//   },
// ];

export function AppSidebar() {
  const user = useSelector(selectCurrentUser);

  return (
    <Sidebar variant="floating" side="left" collapsible="icon">
      <SidebarHeader>
        <NavSidebarHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={SIDEBAR_DATA.navMain} />
        {/* <NavProjects items={DUMMY_PROJECTS} /> */}
        <NavSecondary items={SIDEBAR_DATA.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
