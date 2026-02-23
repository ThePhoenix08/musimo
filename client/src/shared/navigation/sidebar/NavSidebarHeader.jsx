import { IconInnerShadowTop } from "@tabler/icons-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router"


export function NavSidebarHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex">
        <SidebarMenuButton
          asChild
          className="data-[slot=sidebar-menu-button]:p-1.5!"
        >
          <Link to="/app">
            <IconInnerShadowTop className="size-5!" />
            <span className="text-base font-semibold">Musimo</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
