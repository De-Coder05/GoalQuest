"use client";
import { useEffect, useState } from 'react';
import { PageHeader } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Lock, TrendingUp, BarChart3, Activity, PieChart, Layers } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { 
    fetch('/api/analytics').then(r => r.json()).then(setData).catch(() => {}); 
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="gq-spinner"></div>
    </div>
  );

  const statusColors: Record<string, string> = { 
    DRAFT: 'bg-slate-300 dark:bg-slate-700', 
    SUBMITTED: 'bg-blue-500', 
    APPROVED: 'bg-emerald-500', 
    LOCKED: 'bg-primary', 
    RETURNED: 'bg-red-500' 
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <PageHeader 
        title="Full System Analytics" 
        description="Comprehensive organizational performance insights and KPI tracking." 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm gq-card-hover">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl grid place-items-center bg-blue-500/15 text-blue-600 dark:text-blue-400"><Users className="h-6 w-6" /></div>
            <div>
              <div className="text-3xl font-bold tracking-tight">{data.summary.totalUsers}</div>
              <div className="text-sm font-medium text-muted-foreground">Total Users</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm gq-card-hover">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl grid place-items-center bg-primary/10 text-primary"><Target className="h-6 w-6" /></div>
            <div>
              <div className="text-3xl font-bold tracking-tight">{data.summary.totalGoals}</div>
              <div className="text-sm font-medium text-muted-foreground">Total Goals</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm gq-card-hover">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl grid place-items-center bg-green-500/15 text-green-600 dark:text-green-400"><Lock className="h-6 w-6" /></div>
            <div>
              <div className="text-3xl font-bold tracking-tight">{data.summary.lockedGoals}</div>
              <div className="text-sm font-medium text-muted-foreground">Active (Locked)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm gq-card-hover">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl grid place-items-center bg-pink-500/15 text-pink-600 dark:text-pink-400"><TrendingUp className="h-6 w-6" /></div>
            <div>
              <div className="text-3xl font-bold tracking-tight">{data.summary.completionRate}%</div>
              <div className="text-sm font-medium text-muted-foreground">Completion Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2"><PieChart className="h-5 w-5 text-primary" /> Goal Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              {Object.entries(data.statusDistribution).map(([status, count]) => {
                if (count === 0) return null;
                return (
                  <div key={status} className="flex-1 min-w-[120px] p-4 bg-muted/30 rounded-xl text-center border border-border/50">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-3 shadow-sm ${statusColors[status] || 'bg-primary'}`}></div>
                    <div className="text-3xl font-black tabular-nums">{count as number}</div>
                    <div className="text-xs font-semibold text-muted-foreground mt-1">{status}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Thrust Area Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {Object.entries(data.thrustAreas).map(([area, count]) => {
              const percent = data.summary.totalGoals > 0 ? ((count as number) / data.summary.totalGoals) * 100 : 0;
              return (
                <div key={area} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-foreground/80">{area}</span>
                    <span className="font-bold">{count as number}</span>
                  </div>
                  <Progress value={percent} className="h-2 bg-muted/50" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Department Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Department</th>
                    <th className="px-6 py-4 font-semibold text-center">Goals</th>
                    <th className="px-6 py-4 font-semibold text-center">Locked</th>
                    <th className="px-6 py-4 font-semibold text-center">With Updates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {Object.entries(data.departments).map(([dept, info]: [string, any]) => (
                    <tr key={dept} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium">{dept}</td>
                      <td className="px-6 py-4 text-center font-semibold">{info.total}</td>
                      <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">{info.locked}</td>
                      <td className="px-6 py-4 text-center">{info.withAchievements}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Manager Effectiveness</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.managerEffectiveness.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No manager data available yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Manager</th>
                      <th className="px-6 py-4 font-semibold text-center">Team Size</th>
                      <th className="px-6 py-4 font-semibold text-center">Goal Check-ins</th>
                      <th className="px-6 py-4 font-semibold text-center">Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {data.managerEffectiveness.map((m: any) => (
                      <tr key={m.name} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-medium">{m.name}</td>
                        <td className="px-6 py-4 text-center">{m.teamSize}</td>
                        <td className="px-6 py-4 text-center">{m.checkedInGoals} / {m.totalGoals}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={m.completionRate >= 80 ? 'default' : m.completionRate >= 50 ? 'secondary' : 'destructive'} 
                            className={m.completionRate >= 80 ? 'bg-green-500 hover:bg-green-600 text-white' : ''}>
                            {m.completionRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
