"use client";
import { PageHeader } from "@/components/AppLayout";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Target, Users, ClipboardList, ShieldAlert, BarChart3, ArrowRight, Activity } from "lucide-react";
import { useEffect, useState } from "react";

function Stat({ label, value, icon: Icon, tone = "default", index = 0, attention = false, subtitle = "" }: any) {
  const toneCls = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-500/15 text-green-600 dark:text-green-400",
    warning: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    info: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    destructive: "bg-red-500/15 text-red-600 dark:text-red-400",
  }[tone as "default" | "success" | "warning" | "info" | "destructive"];

  return (
    <Card className={`transition-all duration-300 hover:shadow-md hover:border-primary/50 ${attention ? "animate-pulse border-yellow-500/50" : ""}`} style={{ animationDelay: `${index * 100}ms` }}>
      <CardContent className="p-6 flex flex-col justify-between h-full min-h-[120px]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
          </div>
          <div className={`h-12 w-12 rounded-xl grid place-items-center ${toneCls}`}><Icon className="h-6 w-6" /></div>
        </div>
        {subtitle && <div className="mt-4 text-xs font-medium text-muted-foreground/80">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [goals, setGoals] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, locked: 0, submitted: 0, draft: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchDashboardData = async () => {
      try {
        if (user.role === 'ADMIN') {
          const res = await fetch('/api/analytics');
          if (res.ok) setAnalytics(await res.json());
        } else {
          const view = user.role === 'MANAGER' ? 'team' : 'my';
          const res = await fetch(`/api/goals?view=${view}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setGoals(data);
              setStats({
                total: data.length,
                locked: data.filter((g: any) => g.status === 'LOCKED').length,
                submitted: data.filter((g: any) => g.status === 'SUBMITTED').length,
                draft: data.filter((g: any) => g.status === 'DRAFT').length,
              });
            }
          }
        }
      } catch (e) {} finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="gq-spinner"></div>
      </div>
    );
  }

  // --- EMPLOYEE DASHBOARD ---
  if (user.role === 'EMPLOYEE') {
    const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);
    return (
      <div className="animate-in fade-in duration-500">
        <PageHeader title={`Welcome back, ${user.name.split(" ")[0]}`} description="Here is an overview of your active cycle goals and check-ins."
          action={<Button asChild><Link href="/dashboard/my-goals">Manage Goals</Link></Button>} />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat index={0} label="Total Goals" value={stats.total} icon={Target} subtitle="Current FY cycle" />
          <Stat index={1} label="Approved & Locked" value={stats.locked} icon={CheckCircle2} tone="success" subtitle={`${stats.locked} goals finalized`} />
          <Stat index={2} label="Awaiting Approval" value={stats.submitted} icon={Clock} tone="warning" attention={stats.submitted > 0} subtitle="Pending manager review" />
          <Stat index={3} label="Total Weightage" value={`${totalWeight}%`} icon={ClipboardList} tone="info" subtitle={totalWeight === 100 ? "Perfect distribution" : "Must equal 100%"} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-border/50 shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-border/50">
              <CardTitle className="text-lg">Recent Goals</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {goals.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <Target className="h-10 w-10 mb-3 opacity-20" />
                  <p>You haven't set any goals for this cycle yet.</p>
                  <Button variant="link" asChild className="mt-2"><Link href="/dashboard/my-goals/create">Create your first goal</Link></Button>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {goals.slice(0, 6).map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-5 hover:bg-muted/10 transition-colors">
                      <div className="min-w-0 pr-4">
                        <div className="font-semibold text-sm truncate mb-1">{g.title}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-sm bg-background">{g.thrustArea}</Badge></span>
                          <span>Weight: {g.weightage}%</span>
                          <span>Target: {g.target} {g.uomType}</span>
                        </div>
                      </div>
                      <Badge variant={g.status === "LOCKED" ? "default" : g.status === "SUBMITTED" ? "secondary" : "outline"} className="shrink-0">{g.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Shortcuts to your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-between h-12">
                <Link href="/dashboard/check-ins">Log Check-in <ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between h-12">
                <Link href="/dashboard/my-goals">View Goal Sheet <ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- MANAGER DASHBOARD ---
  if (user.role === 'MANAGER') {
    return (
      <div className="animate-in fade-in duration-500">
        <PageHeader title="Manager Overview" description="Monitor your team's goal alignments and pending check-ins." 
          action={<Button asChild><Link href="/dashboard/approvals">Review Approvals</Link></Button>} />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat index={0} label="Team Goals" value={stats.total} icon={Users} subtitle="Total goals across reports" />
          <Stat index={1} label="Goals Locked" value={stats.locked} icon={CheckCircle2} tone="success" subtitle="Fully approved goals" />
          <Stat index={2} label="Pending Goal Reviews" value={stats.submitted} icon={Clock} tone="warning" attention={stats.submitted > 0} subtitle="Requires your approval" />
          <Stat index={3} label="Check-ins Pending" value="0" icon={Activity} tone="info" subtitle="Quarterly updates" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-border/50 shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-border/50">
              <CardTitle className="text-lg">Recent Team Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {goals.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No team goals submitted yet.</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {goals.filter(g => g.status === 'SUBMITTED' || g.status === 'LOCKED').slice(0, 6).map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-5 hover:bg-muted/10 transition-colors">
                      <div className="min-w-0 pr-4">
                        <div className="font-semibold text-sm truncate mb-1">{g.title}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{g.user?.name}</span>
                          <span>•</span>
                          <span>{g.thrustArea}</span>
                        </div>
                      </div>
                      <Badge variant={g.status === "LOCKED" ? "default" : "secondary"}>{g.status === "SUBMITTED" ? "NEEDS REVIEW" : g.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-between h-12 border-primary/20 hover:bg-primary/5">
                  <Link href="/dashboard/approvals">Goal Approvals {stats.submitted > 0 && <Badge className="ml-2 bg-primary">{stats.submitted}</Badge>} <ArrowRight className="h-4 w-4 ml-auto" /></Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between h-12">
                  <Link href="/dashboard/check-ins">Quarterly Check-ins <ArrowRight className="h-4 w-4 ml-auto" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader title="System Dashboard" description="Organization-wide analytics and governance overview." 
        action={<Button asChild variant="outline"><Link href="/dashboard/analytics">View Full Analytics</Link></Button>} />
      
      {analytics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Stat index={0} label="Active Users" value={analytics.summary.totalUsers} icon={Users} subtitle="Registered personnel" />
            <Stat index={1} label="Total System Goals" value={analytics.summary.totalGoals} icon={Target} subtitle="Across all departments" />
            <Stat index={2} label="Completion Rate" value={`${analytics.summary.completionRate}%`} icon={BarChart3} tone="info" subtitle="Goals locked / finalized" />
            <Stat index={3} label="Escalations" value="0" icon={ShieldAlert} tone="warning" subtitle="Active SLA breaches" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-border/50 shadow-sm">
              <CardHeader className="bg-muted/20 border-b border-border/50">
                <CardTitle className="text-lg">Goal Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {Object.entries(analytics.statusDistribution).map(([status, count]: any) => {
                    if (count === 0 && status !== 'SUBMITTED' && status !== 'LOCKED') return null;
                    const percent = analytics.summary.totalGoals > 0 ? (count / analytics.summary.totalGoals) * 100 : 0;
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>{status}</span>
                          <span className="text-muted-foreground">{count} ({percent.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percent} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Governance Hub</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-between h-12">
                    <Link href="/dashboard/admin/cycles">Manage Cycles <ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between h-12 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-500/10">
                    <Link href="/dashboard/admin/escalations">View Escalations <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between h-12">
                    <Link href="/dashboard/admin/audit">System Audit Trail <ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
