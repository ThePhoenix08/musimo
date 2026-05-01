import React from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/shared/navigation/sidebar/AppSidebar.jsx";
import { Outlet } from "react-router";
import { AppHeader } from "@/shared/navigation/sidebar/AppHeader.jsx";
import { useIsMobile } from "@/hooks/use-mobile";

function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="internal-app h-full w-full overflow-hidden">
      <SidebarProvider defaultOpen={false} style={{ height: "100%" }}>
        {isMobile && <SidebarTrigger />}
        <AppSidebar />
        <SidebarInset>
          <main className="h-full w-full flex flex-col overflow-hidden rounded-sm border">
            <AppHeader />
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default AppLayout;
