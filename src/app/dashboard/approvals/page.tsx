"use client";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { burstConfetti } from "@/lib/anim";



export default function Approvals() {
  const { currentUser, users, goals, updateGoal, approveGoals, returnGoals, addAudit } = useStore();
  const team = users.filter((u) => u.managerId === currentUser!.id);
  const awaitingByMember = team.map((m) => ({ m, gs: goals.filter((g) => g.ownerId === m.id && g.status === "awaiting") })).filter((x) => x.gs.length);
  const [edit, setEdit] = useState<Record<string, { target: string; weightage: number } | null>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  if (awaitingByMember.length === 0) {
    return (
      <>
        <PageHeader title="Goal approvals" description="Review submitted goal sheets from your team." />
        <Card><CardContent className="p-6 text-sm text-muted-foreground">No goal sheets awaiting approval right now.</CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Goal approvals" description="Review submitted goal sheets from your team." />
      <Accordion type="multiple" className="space-y-3">
        {awaitingByMember.map(({ m, gs }) => {
          const total = gs.reduce((s, g) => s + g.weightage, 0);
          return (
            <AccordionItem key={m.id} value={m.id} className="border rounded-lg bg-card px-4 transition-all duration-200 hover:border-primary hover:bg-primary/[0.04] hover:shadow-md gq-slide-up" style={{ animationDelay: `${50 * awaitingByMember.findIndex(x => x.m.id === m.id)}ms` }}>
              <AccordionTrigger>
                <div className="flex items-center gap-3 w-full">
                  <div className="text-left">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.email} · {gs.length} goals · {total}% weight</div>
                  </div>
                  <Badge variant="secondary" className="ml-auto mr-2">Awaiting</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {gs.map((g) => {
                    const e = edit[g.id];
                    return (
                      <div key={g.id} className="border rounded-md p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm">{g.title}</div>
                            <div className="text-xs text-muted-foreground">{g.thrustArea} · UoM: {g.uom}</div>
                            {e ? (
                              <div className="grid grid-cols-2 gap-2 mt-3 max-w-md">
                                <Input value={e.target} onChange={(ev) => setEdit({ ...edit, [g.id]: { ...e, target: ev.target.value } })} placeholder="Target" />
                                <Input type="number" value={e.weightage} onChange={(ev) => setEdit({ ...edit, [g.id]: { ...e, weightage: Number(ev.target.value) } })} placeholder="Weightage" />
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground mt-1">Target {g.target} · Weight {g.weightage}%</div>
                            )}
                          </div>
                          {e ? (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => {
                                const newTotal = gs.filter((x) => x.id !== g.id).reduce((s, x) => s + x.weightage, 0) + e.weightage;
                                if (newTotal > 100) { toast.error("Total weightage cannot exceed 100%"); return; }
                                updateGoal(g.id, { target: e.target, weightage: e.weightage });
                                addAudit({ user: currentUser!.email, action: "Manager edit", goalId: g.id, details: g.title, change: `target ${g.target}→${e.target}, w ${g.weightage}→${e.weightage}` });
                                setEdit({ ...edit, [g.id]: null });
                                toast.success("Goal updated");
                              }}><Check className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => setEdit({ ...edit, [g.id]: null })}><X className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <Button size="icon" variant="ghost" onClick={() => setEdit({ ...edit, [g.id]: { target: g.target, weightage: g.weightage } })}><Pencil className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <Textarea placeholder="Feedback (required if returning for revision)…" value={comments[m.id] ?? ""} onChange={(ev) => setComments({ ...comments, [m.id]: ev.target.value })} rows={2} />
                  <div className="flex gap-2">
                    <Button onClick={() => {
                      if (total !== 100) { toast.error("Sheet weightage must total 100%"); return; }
                      approveGoals(m.id);
                      addAudit({ user: currentUser!.email, action: "Sheet approved", details: m.name });
                      burstConfetti();
                      toast.success(`Approved ${m.name}'s goal sheet`);
                    }}>Approve all</Button>
                    <Button variant="outline" className="border-warning text-warning hover:bg-warning/10" onClick={() => {
                      const c = comments[m.id]?.trim();
                      if (!c) { toast.error("Please add feedback before returning"); return; }
                      returnGoals(m.id, c);
                      addAudit({ user: currentUser!.email, action: "Sheet returned", details: `${m.name}: ${c}` });
                      toast.success("Returned for revision");
                    }}>Return for revision</Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </>
  );
}
