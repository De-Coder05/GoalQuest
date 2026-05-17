import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, Target, CheckSquare, Users, ClipboardCheck,
  Settings, FileBarChart, LogOut, Moon, Sun, ShieldAlert, History, CalendarRange,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Role = "employee" | "manager" | "admin";

interface NavItem { to: string; label: string; icon: typeof Target }

const NAV: Record<Role, NavItem[]> = {
  employee: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/goals/create", label: "Create Goals", icon: Target },
    { to: "/goals", label: "My Goals", icon: ClipboardCheck },
    { to: "/checkins", label: "Check-ins", icon: CheckSquare },
    { to: "/reports", label: "Reports", icon: FileBarChart },
  ],
  manager: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/team", label: "My Team", icon: Users },
    { to: "/approvals", label: "Goal Approvals", icon: ClipboardCheck },
    { to: "/checkins", label: "Check-ins", icon: CheckSquare },
    { to: "/reports", label: "Reports", icon: FileBarChart },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/cycles", label: "Cycle Management", icon: CalendarRange },
    { to: "/admin/completion", label: "Completion Status", icon: ClipboardCheck },
    { to: "/admin/audit", label: "Audit Trail", icon: History },
    { to: "/admin/escalations", label: "Escalations", icon: ShieldAlert },
    { to: "/reports", label: "Reports", icon: FileBarChart },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

const ROLE_LABEL: Record<Role, string> = { employee: "Employee", manager: "Manager (L1)", admin: "Admin / HR" };

function useTheme() {
  useEffect(() => {
    const saved = localStorage.getItem("gq-theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
  }, []);
  return {
    toggle: () => {
      const el = document.documentElement;
      el.classList.toggle("dark");
      localStorage.setItem("gq-theme", el.classList.contains("dark") ? "dark" : "light");
    },
  };
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const path = usePathname();
  const { toggle } = useTheme();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status !== "authenticated" || !session?.user) return null;
  const currentUser = session.user as any;
  const role = currentUser.role.toLowerCase() as Role;
  const items = NAV[role] || NAV.employee;

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="px-5 py-5 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary grid place-items-center text-primary-foreground font-bold">G</div>
            <div>
              <div className="font-semibold tracking-tight">GoalQuest</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">Atomberg</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => {
            const active = path === item.to || (item.to !== "/dashboard" && path?.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link key={item.to} href={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold">
              {currentUser.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{currentUser.name}</div>
              <div className="text-xs text-muted-foreground truncate">{currentUser.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <span className="md:hidden font-semibold">GoalQuest</span>
            <Badge variant="secondary" className="font-normal">{ROLE_LABEL[role]}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:block" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
