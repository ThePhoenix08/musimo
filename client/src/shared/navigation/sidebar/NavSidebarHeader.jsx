import { IconInnerShadowTop } from "@tabler/icons-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "react-router";

export function NavSidebarHeader() {
  const { open } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex">
        {open && (
          <SidebarMenuButton
            asChild
            className="data-[slot=sidebar-menu-button]:p-1.5!"
          >
            <Link to="/app">
              <IconInnerShadowTop className="size-5!" />
              <span className="text-base font-semibold">Musimo</span>
            </Link>
          </SidebarMenuButton>
        )}
        <SidebarTrigger />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
