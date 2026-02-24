import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/shared/navigation/sidebar/AppSidebar.jsx";
import { Outlet } from "react-router";
import { AppHeader } from "@/shared/navigation/sidebar/AppHeader.jsx";

function AppLayout() {
  return (
    <div className="internal-app">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main>
            <AppHeader />
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default AppLayout;
