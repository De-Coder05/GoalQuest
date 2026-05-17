"use client";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";



export default function Completion() {
  const { users, goals } = useStore();
  const employees = users.filter((u) => u.role === "employee");
  const submitted = employees.filter((u) => goals.some((g) => g.ownerId === u.id && (g.status === "awaiting" || g.status === "approved")));
  const approved = employees.filter((u) => goals.some((g) => g.ownerId === u.id && g.status === "approved"));
  const q1 = employees.filter((u) => goals.some((g) => g.ownerId === u.id && g.checkins.some((c) => c.quarter === "Q1")));

  const pct = (n: number, d: number) => d ? Math.round((n / d) * 100) : 0;

  const pending = employees.map((u) => {
    const hasSubmitted = submitted.some((x) => x.id === u.id);
    const hasApproved = approved.some((x) => x.id === u.id);
    const hasQ1 = q1.some((x) => x.id === u.id);
    let task = "—"; let overdue = 0;
    if (!hasSubmitted) { task = "Submit goal sheet"; overdue = 12; }
    else if (!hasApproved) { task = "Awaiting manager approval"; overdue = 4; }
    else if (!hasQ1) { task = "Q1 check-in"; overdue = 3; }
    else return null;
    return { u, task, overdue };
  }).filter(Boolean) as { u: typeof employees[number]; task: string; overdue: number }[];

  return (
    <>
      <PageHeader title="Completion status" description="Real-time view of cycle progression." />
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Goal sheets submitted", n: submitted.length, d: employees.length },
          { label: "Goal sheets approved", n: approved.length, d: employees.length },
          { label: "Q1 check-ins completed", n: q1.length, d: approved.length },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-sm">{m.label}</div>
                <div className="text-sm tabular-nums">{m.n}/{m.d} <span className="text-muted-foreground">({pct(m.n, m.d)}%)</span></div>
              </div>
              <Progress value={pct(m.n, m.d)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Pending task</TableHead><TableHead className="text-right">Days overdue</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {pending.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">All caught up.</TableCell></TableRow>}
              {pending.sort((a, b) => b.overdue - a.overdue).map((p) => (
                <TableRow key={p.u.id}>
                  <TableCell><div className="font-medium">{p.u.name}</div><div className="text-xs text-muted-foreground">{p.u.email}</div></TableCell>
                  <TableCell className="text-sm capitalize">{p.u.role}</TableCell>
                  <TableCell className="text-sm">{p.task}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={p.overdue > 7 ? "bg-destructive text-white" : p.overdue > 3 ? "bg-warning text-white" : "bg-success text-white"}>{p.overdue}d</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
