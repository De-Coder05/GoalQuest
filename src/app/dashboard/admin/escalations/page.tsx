"use client";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";



const RULES = [
  "Employee hasn't submitted goals → Day 5: Auto-notify",
  "Manager hasn't approved → Day 10: Auto-notify",
  "Check-in overdue → Day 3: Auto-notify",
];

export default function Esc() {
  const { escalations, resolveEscalation } = useStore();
  return (
    <>
      <PageHeader title="Escalations" description="Automated nudges based on cycle SLAs." />
      <Card className="mb-6">
        <CardContent className="p-5">
          <h3 className="font-medium mb-2 text-sm">Escalation rules</h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            {RULES.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Employee</TableHead><TableHead>Rule</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {escalations.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">{e.date}</TableCell>
                  <TableCell className="text-sm">{e.employee}</TableCell>
                  <TableCell className="text-sm">{e.rule}</TableCell>
                  <TableCell><Badge variant={e.status === "Pending" ? "secondary" : "default"} className={e.status === "Resolved" ? "bg-success text-white" : ""}>{e.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {e.status === "Pending" && <Button size="sm" variant="outline" onClick={() => { resolveEscalation(e.id); toast.success("Marked as resolved"); }}>Resolve</Button>}
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
