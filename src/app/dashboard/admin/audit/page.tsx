"use client";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";



export default function Audit() {
  const { audit } = useStore();
  const [q, setQ] = useState("");
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
