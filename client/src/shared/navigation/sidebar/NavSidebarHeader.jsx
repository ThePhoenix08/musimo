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
  const ico = "w-full h-full";
  const Icon = {
    logo: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={ico}
      >
        <path d="M3 13h3l2.5-7 4 15 2.5-9 1.5 3H21" />
      </svg>
    ),
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex">
        {open && (
          <SidebarMenuButton
            asChild
            className="data-[slot=sidebar-menu-button]:p-1.5!"
          >
            <section>
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-zinc-950 p-1.5">
                {Icon.logo}
              </span>
              <span className="text-base font-semibold">Musimo</span>
            </section>
          </SidebarMenuButton>
        )}
        <SidebarTrigger />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
