"use client";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";

const RULES = [
  "Employee hasn't submitted goals → Day 5: Auto-notify",
  "Manager hasn't approved → Day 10: Auto-notify",
  "Check-in overdue → Day 3: Auto-notify",
];

export default function Esc() {
  const [escalations, setEscalations] = useState<any[]>([]);

  const fetchEsc = () => fetch('/api/escalations').then(r => r.json()).then(d => {
    if(Array.isArray(d)) setEscalations(d);
  });

  useEffect(() => { fetchEsc(); }, []);

  const resolveEscalation = async (id: string) => {
    await fetch('/api/escalations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'resolve' })
    });
    toast.success("Escalation resolved");
    fetchEsc();
  };

  const triggerMock = async () => {
    await fetch('/api/escalations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'trigger_mock' })
    });
    toast.info("Mock escalation triggered!");
    fetchEsc();
  };

  return (
    <>
      <PageHeader title="Escalations" description="Automated nudges based on cycle SLAs." 
        action={<Button onClick={triggerMock} variant="outline" className="gap-2"><BellRing className="w-4 h-4"/> Trigger Test Escalation</Button>} />
      <Card className="mb-6">
        <CardContent className="p-5">
          <h3 className="font-medium mb-2 text-sm">Active Escalation Rules (Configured in System)</h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            {RULES.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Employee</TableHead><TableHead>Rule Triggered</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {escalations.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No active escalations</TableCell></TableRow>
              )}
              {escalations.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">{new Date(e.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm font-medium">{e.employee?.name}</TableCell>
                  <TableCell className="text-sm">{e.rule}</TableCell>
                  <TableCell><Badge variant={e.status === "Pending" ? "destructive" : "default"} className={e.status === "Resolved" ? "bg-success text-white" : ""}>{e.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {e.status === "Pending" && <Button size="sm" variant="outline" onClick={() => resolveEscalation(e.id)}>Mark Resolved</Button>}
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
