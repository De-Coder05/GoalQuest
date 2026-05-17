"use client";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";



export default function Audit() {
  const [audit, setAudit] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch('/api/audit-logs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            ts: d.timestamp,
            user: d.user?.email || 'Unknown',
            action: d.action,
            goalId: d.goalId,
            details: d.goal ? d.goal.title : d.field,
            change: d.oldValue ? `${d.oldValue} → ${d.newValue}` : d.newValue,
          }));
          setAudit(mapped);
        }
      })
      .catch(err => console.error("Failed to fetch audit logs", err));
  }, []);

  const list = useMemo(() => audit.filter((a) =>
    !q || a.user.includes(q) || a.action.toLowerCase().includes(q.toLowerCase()) || (a.goalId ?? "").includes(q) || a.details.toLowerCase().includes(q.toLowerCase())
  ), [audit, q]);

  return (
    <>
      <PageHeader title="Audit trail" description="Every change is logged with who, what, and when." />
      <div className="mb-4 max-w-sm">
        <Input placeholder="Search by user, action, goal…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Goal</TableHead><TableHead>Details</TableHead><TableHead>Change</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {list.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(a.ts).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{a.user}</TableCell>
                  <TableCell className="text-sm">{a.action}</TableCell>
                  <TableCell className="text-xs">{a.goalId ?? "—"}</TableCell>
                  <TableCell className="text-xs">{a.details}</TableCell>
                  <TableCell className="text-xs font-mono">{a.change ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
