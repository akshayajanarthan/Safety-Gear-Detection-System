import { createFileRoute, Outlet, redirect, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Brain, LayoutDashboard, Users, Upload, FileText, Settings, LogOut, Bell, Search } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const nav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "MRI Upload", url: "/upload", icon: Upload },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

function AppLayout() {
  const { session, loading, user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [session, loading, navigate]);

  if (loading || !session) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading console…</div>;
  }

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-sm font-semibold">NeuroMind.ai</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Clinical Console</span>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/20 text-primary font-semibold">{initials}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{user?.email}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{role}</div>
              </div>
              <button
                onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
                className="rounded p-1 hover:bg-accent/20"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/60 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search patients, scans, reports…" className="pl-9" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
              <div className="hidden text-xs text-muted-foreground md:block">
                Model <span className="text-primary">NeuroMind-CNN v3.2</span> · GPU cluster online
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
