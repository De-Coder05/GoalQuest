"use client";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useStore, calcScore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";



export default function Team() {
  const { currentUser, users, goals } = useStore();
  const team = users.filter((u) => u.managerId === currentUser!.id);

  const quarters = ["Q1", "Q2", "Q3", "Q4"] as const;

  return (
    <>
      <PageHeader title="My team" description="Quarterly performance across your direct reports." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Goals</TableHead>
                {quarters.map((q) => <TableHead key={q} className="text-right">{q}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((m) => {
                const tg = goals.filter((g) => g.ownerId === m.id && g.status === "approved");
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </TableCell>
                    <TableCell>{tg.length} approved</TableCell>
                    {quarters.map((q) => {
                      const scores = tg.flatMap((g) => g.checkins.filter((c) => c.quarter === q).map((c) => calcScore(g.uom, g.target, c.actual)));
                      const avg = scores.length ? Math.round((scores.reduce((a,b) => a+b, 0) / scores.length) * 100) : null;
                      return (
                        <TableCell key={q} className="text-right">
                          {avg === null ? <span className="text-muted-foreground">—</span> : (
                            <Badge className={avg >= 80 ? "bg-success text-white" : avg >= 50 ? "bg-warning text-white" : "bg-destructive text-white"}>{avg}%</Badge>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
