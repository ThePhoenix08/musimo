import { IconInnerShadowTop } from "@tabler/icons-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavSidebarHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex">
        <SidebarMenuButton
          asChild
          className="data-[slot=sidebar-menu-button]:p-1.5!"
        >
          <a href="/app">
            <IconInnerShadowTop className="size-5!" />
            <span className="text-base font-semibold">Musimo</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
