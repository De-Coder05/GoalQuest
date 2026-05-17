"use client";
import { PageHeader } from "@/components/AppLayout";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertCircle, Target, Users, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";

function Stat({ label, value, icon: Icon, tone = "default", index = 0, attention = false }: any) {
  const toneCls = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-500/15 text-green-500",
    warning: "bg-yellow-500/20 text-yellow-500",
    info: "bg-blue-500/15 text-blue-500",
  }[tone as "default" | "success" | "warning" | "info"];

  return (
    <Card className={`transition-all hover:-translate-y-1 ${attention ? "animate-pulse" : ""}`} style={{ animationDelay: `${index * 100}ms` }}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-11 w-11 rounded-lg grid place-items-center ${toneCls}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [goals, setGoals] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, locked: 0, submitted: 0, draft: 0 });

  useEffect(() => {
    const view = user?.role === 'ADMIN' ? 'all' : user?.role === 'MANAGER' ? 'team' : 'my';
    fetch(`/api/goals?view=${view}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setGoals(data);
          setStats({
            total: data.length,
            locked: data.filter((g: any) => g.status === 'LOCKED').length,
            submitted: data.filter((g: any) => g.status === 'SUBMITTED').length,
            draft: data.filter((g: any) => g.status === 'DRAFT').length,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  if (!user) return null;

  if (user.role === 'EMPLOYEE') {
    const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);
    return (
      <>
        <PageHeader title={`Hello, ${user.name.split(" ")[0]}`} description="Your goals and check-ins at a glance."
          action={<Button asChild><Link href="/dashboard/my-goals">Create / Edit Goals</Link></Button>} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Stat index={0} label="Total goals" value={stats.total} icon={Target} />
          <Stat index={1} label="Approved" value={stats.locked} icon={CheckCircle2} tone="success" />
          <Stat index={2} label="Awaiting approval" value={stats.submitted} icon={Clock} tone="warning" attention={stats.submitted > 0} />
          <Stat index={3} label="Total weightage" value={`${totalWeight}%`} icon={ClipboardList} tone="info" />
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Recent goals</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {goals.length === 0 && <p className="text-sm text-muted-foreground">No goals yet. <Link href="/dashboard/my-goals" className="text-primary underline">Create your first goal</Link>.</p>}
            {goals.slice(0, 5).map((g) => (
              <div key={g.id} className="flex items-center justify-between border rounded-md p-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{g.title}</div>
                  <div className="text-xs text-muted-foreground">{g.thrustArea} · {g.weightage}%</div>
                </div>
                <Badge variant={g.status === "LOCKED" ? "default" : "secondary"}>{g.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </>
    );
  }

  // Very similar implementation for Manager and Admin would follow...
  return (
    <>
      <PageHeader title={`${user.role} Dashboard`} description="Overview of metrics." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat index={0} label="Total goals" value={stats.total} icon={Target} />
        <Stat index={1} label="Locked" value={stats.locked} icon={CheckCircle2} tone="success" />
        <Stat index={2} label="Pending Reviews" value={stats.submitted} icon={Clock} tone="warning" />
      </div>
    </>
  );
}
