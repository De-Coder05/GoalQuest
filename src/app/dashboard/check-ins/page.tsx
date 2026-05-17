"use client";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useStore, calcScore, type CheckIn } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { CountUp, progressTone } from "@/lib/anim";
import { Circle, CircleDot, CheckCircle2 } from "lucide-react";



type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

function EmployeeCheckin() {
  const { currentUser, goals, addCheckin, cycle, addAudit } = useStore();
  const mine = goals.filter((g) => g.ownerId === currentUser!.id && g.status === "approved");
  const openPhase = cycle.phases.find((p) => p.open && p.key.startsWith("q"));
  const quarter = (openPhase?.key.toUpperCase() ?? "Q1") as Quarter;
  const [draft, setDraft] = useState<Record<string, { actual: string; status: CheckIn["status"] }>>({});

  if (!openPhase) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">No check-in window is open right now.</CardContent></Card>;
  }
  if (mine.length === 0) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">No approved goals to check in on yet.</CardContent></Card>;
  }

  const submit = async () => {
    try {
      for (const g of mine) {
        const d = draft[g.id];
        if (!d?.actual) continue;
        
        const res = await fetch('/api/achievements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goalId: g.id,
            quarter,
            actualAchievement: String(d.actual),
            progressStatus: d.status === 'Completed' ? 'COMPLETED' : d.status === 'On Track' ? 'ON_TRACK' : 'NOT_STARTED'
          })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to submit check-in");
        }
        
        // Update local store
        addCheckin(g.id, { quarter, actual: d.actual, status: d.status, score: calcScore(g.uom, g.target, d.actual), submittedAt: new Date().toISOString() });
        addAudit({ user: currentUser!.email, action: `${quarter} check-in`, goalId: g.id, details: `Actual: ${d.actual}` });
      }
      toast.success("Check-in submitted. Awaiting manager review.");
      setDraft({});
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm"><Badge variant="secondary">{quarter} window open</Badge> <span className="text-muted-foreground ml-2">{openPhase.window}</span></div>
      {mine.map((g, idx) => {
        const existing = g.checkins.find((c) => c.quarter === quarter);
        const d = draft[g.id] ?? { actual: existing?.actual ?? "", status: existing?.status ?? "On Track" };
        const score = Math.round(calcScore(g.uom, g.target, d.actual) * 100);
        const StatusIcon = d.status === "Completed" ? CheckCircle2 : d.status === "On Track" ? CircleDot : Circle;
        return (
          <Card key={g.id} className="gq-card-hover gq-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium">{g.title}</div>
                  <div className="text-xs text-muted-foreground">Target: {g.target} · UoM: {g.uom} · Weight {g.weightage}%</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold tabular-nums flex items-center justify-end gap-2">
                    {d.actual ? <><CountUp value={score} duration={500} suffix="%" />{score >= 100 && <CheckCircle2 className="h-5 w-5 text-success gq-bounce-in" />}</> : "—"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">Progress score</div>
                </div>
              </div>
              {d.actual && (
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full transition-[width,background-color] duration-500 ease-out"
                    style={{ width: `${Math.min(score, 100)}%`, backgroundColor: progressTone(score) }}
                  />
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`a-${g.id}`}>Actual achievement</Label>
                  <Input id={`a-${g.id}`} type={g.uom === "timeline" ? "date" : "number"} value={d.actual}
                    className="transition-all duration-300 focus:bg-primary/[0.03] focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(e) => setDraft({ ...draft, [g.id]: { ...d, actual: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={d.status} onValueChange={(v) => setDraft({ ...draft, [g.id]: { ...d, status: v as CheckIn["status"] } })}>
                    <SelectTrigger>
                      <span className="inline-flex items-center gap-2"><StatusIcon className={`h-4 w-4 ${d.status === "Completed" ? "text-success" : d.status === "On Track" ? "text-info animate-pulse" : "text-muted-foreground"}`} /><SelectValue /></span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Started"><span className="inline-flex items-center gap-2"><Circle className="h-4 w-4" /> Not Started</span></SelectItem>
                      <SelectItem value="On Track"><span className="inline-flex items-center gap-2"><CircleDot className="h-4 w-4 text-info" /> On Track</span></SelectItem>
                      <SelectItem value="Completed"><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Completed</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {existing?.managerComment && (
                <div className="mt-3 text-sm border-l-2 border-info pl-3 gq-slide-up">
                  <div className="text-xs font-medium text-info mb-0.5">Manager review</div>
                  {existing.managerComment}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      <Button onClick={submit}>Submit {quarter} check-in</Button>
    </div>
  );
}

function ManagerCheckin() {
  const { currentUser, users, goals, reviewCheckin, addAudit } = useStore();
  const team = users.filter((u) => u.managerId === currentUser!.id);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [quarter, setQuarter] = useState<Quarter>("Q1");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm">Quarter</Label>
        <Select value={quarter} onValueChange={(v) => setQuarter(v as Quarter)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>{(["Q1","Q2","Q3","Q4"] as Quarter[]).map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {team.map((m) => {
        const tg = goals.filter((g) => g.ownerId === m.id && g.status === "approved");
        const submitted = tg.some((g) => g.checkins.some((c) => c.quarter === quarter));
        return (
          <Card key={m.id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.email} · {m.department}</div>
                </div>
                <Badge variant={submitted ? "default" : "secondary"}>{submitted ? "Submitted" : "Pending"}</Badge>
              </div>
              {submitted && (
                <div className="space-y-2">
                  {tg.map((g) => {
                    const c = g.checkins.find((x) => x.quarter === quarter);
                    if (!c) return null;
                    const score = Math.round(calcScore(g.uom, g.target, c.actual) * 100);
                    return (
                      <div key={g.id} className="grid grid-cols-4 gap-2 text-sm border rounded-md p-3">
                        <div className="col-span-2"><div className="font-medium truncate">{g.title}</div><div className="text-xs text-muted-foreground">target {g.target} → actual {c.actual}</div></div>
                        <div className="text-xs"><Badge variant="outline">{c.status}</Badge></div>
                        <div className={`text-right font-semibold tabular-nums ${score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"}`}>{score}%</div>
                      </div>
                    );
                  })}
                  <Textarea placeholder="Add a check-in comment for this member…" value={comments[m.id] ?? ""} onChange={(e) => setComments({ ...comments, [m.id]: e.target.value })} rows={2} />
                  <Button size="sm" onClick={async () => {
                    try {
                      const c = comments[m.id] ?? "";
                      for (const g of tg) {
                        if (g.checkins.find((x) => x.quarter === quarter)) {
                          const res = await fetch('/api/checkins', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ goalId: g.id, quarter, comment: c })
                          });
                          if (!res.ok) throw new Error("Failed to save review");
                          reviewCheckin(g.id, quarter, c);
                        }
                      }
                      addAudit({ user: currentUser!.email, action: `${quarter} reviewed`, details: `${m.name}` });
                      toast.success("Check-in marked as reviewed");
                    } catch (e: any) {
                      toast.error(e.message || "An error occurred");
                    }
                  }}>Complete review</Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function CheckIns() {
  const { currentUser } = useStore();
  if (!currentUser) return null;
  return (
    <>
      <PageHeader title="Check-ins" description={currentUser.role === "manager" ? "Review your team's quarterly progress." : "Log progress on your approved goals."} />
      {currentUser.role === "manager" ? (
        <Tabs defaultValue="review"><TabsList><TabsTrigger value="review">Team check-ins</TabsTrigger></TabsList>
          <TabsContent value="review" className="mt-4"><ManagerCheckin /></TabsContent>
        </Tabs>
      ) : currentUser.role === "employee" ? (
        <EmployeeCheckin />
      ) : (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">Admin role doesn't perform check-ins. Use Completion Status instead.</CardContent></Card>
      )}
    </>
  );
}
