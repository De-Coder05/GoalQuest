"use client";
import { useRouter } from "next/navigation";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useStore, THRUST_AREAS, type Goal, type UoM } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil, Save, Plus, CheckCircle2, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { progressTone } from "@/lib/anim";



const UOM_OPTS: { value: UoM; label: string; hint: string }[] = [
  { value: "min", label: "Min — Numeric / %", hint: "Higher is better (e.g. Revenue)" },
  { value: "max", label: "Max — Numeric / %", hint: "Lower is better (e.g. Cost)" },
  { value: "timeline", label: "Timeline", hint: "Date-based completion" },
  { value: "zero", label: "Zero", hint: "Zero = Success (e.g. Incidents)" },
];

interface Draft {
  thrustArea: string;
  title: string;
  description: string;
  uom: UoM;
  target: string;
  weightage: number;
}

const emptyDraft = (): Draft => ({ thrustArea: "", title: "", description: "", uom: "min", target: "", weightage: 10 });

export default function Create() {
  const { currentUser, goals, setGoals, submitOwnGoals, addAudit } = useStore();
  const router = useRouter();
  if (!currentUser) return null;

  const mine = goals.filter((g) => g.ownerId === currentUser.id);
  const locked = mine.some((g) => g.status === "awaiting" || g.status === "approved");
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalWeight = useMemo(() => mine.reduce((s, g) => s + g.weightage, 0), [mine]);

  const validate = (d: Draft): string | null => {
    if (!d.thrustArea) return "Pick a thrust area";
    if (d.title.trim().length < 5) return "Goal title must be at least 5 characters";
    if (d.title.length > 100) return "Goal title is too long";
    if (!d.target) return "Target value is required";
    if (d.weightage < 10) return "Minimum weightage per goal is 10%";
    return null;
  };

  const addOrUpdate = async () => {
    const err = validate(draft);
    if (err) { toast.error(err); return; }

    try {
      const cyclesRes = await fetch('/api/cycles');
      const cycles = await cyclesRes.json();
      const activeCycle = cycles.length > 0 ? cycles[0].id : null;
      if (!activeCycle) {
        toast.error("No active goal cycle found. Please ask admin to create one.");
        return;
      }

      if (editingId) {
        const others = mine.filter((g) => g.id !== editingId).reduce((s, g) => s + g.weightage, 0);
        if (others + draft.weightage > 100) { toast.error("Total weightage cannot exceed 100%"); return; }
        
        setGoals(goals.map((g) => g.id === editingId ? { ...g, ...draft } : g));
        
        addAudit({ user: currentUser.email, action: "Goal edited", goalId: editingId, details: draft.title });
        setEditingId(null);
      } else {
        if (mine.length >= 8) { toast.error("Maximum 8 goals per employee"); return; }
        if (totalWeight + draft.weightage > 100) { toast.error("Total weightage cannot exceed 100%"); return; }

        const res = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            thrustArea: draft.thrustArea,
            title: draft.title,
            description: draft.description,
            uomType: draft.uom,
            target: String(draft.target),
            weightage: draft.weightage,
            cycleId: activeCycle
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to save goal to database");
        }
        
        const savedGoal = await res.json();
        
        const g: Goal = {
          id: savedGoal.id, 
          ownerId: currentUser.id, 
          ...draft, 
          status: "draft", 
          checkins: [], 
          createdAt: savedGoal.createdAt,
        };
        setGoals([...goals, g]);
        addAudit({ user: currentUser.email, action: "Goal created", goalId: g.id, details: g.title });
      }
      setDraft(emptyDraft());
      toast.success("Goal saved successfully!");
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    }
  };

  const startEdit = (g: Goal) => {
    setEditingId(g.id);
    setDraft({ thrustArea: g.thrustArea, title: g.title, description: g.description, uom: g.uom, target: g.target, weightage: g.weightage });
  };

  const remove = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
    addAudit({ user: currentUser.email, action: "Goal deleted", goalId: id, details: "" });
    if (editingId === id) { setEditingId(null); setDraft(emptyDraft()); }
  };

  const submit = async () => {
    if (totalWeight !== 100) { toast.error("Weightage must total exactly 100%"); return; }
    if (mine.length === 0) { toast.error("Add at least one goal"); return; }
    
    try {
      const cyclesRes = await fetch('/api/cycles');
      const cycles = await cyclesRes.json();
      const activeCycle = cycles.length > 0 ? cycles[0].id : null;
      if (!activeCycle) throw new Error("No active goal cycle found.");

      const res = await fetch('/api/goals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId: activeCycle })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit goals");
      }

      submitOwnGoals(currentUser.id);
      addAudit({ user: currentUser.email, action: "Sheet submitted", details: `${mine.length} goals submitted for approval` });
      toast.success("Goals locked pending manager approval");
      router.push("/dashboard/my-goals");
    } catch (e: any) {
      toast.error(e.message || "An error occurred during submission");
    }
  };

  const ready = totalWeight === 100 && mine.length > 0 && !locked;

  return (
    <>
      <PageHeader title="Create goals" description="Define your goal sheet for the cycle. Total weightage must reach 100%." />

      {locked && (
        <Card className="mb-6 border-info/40 bg-info/5">
          <CardContent className="p-5 flex items-center gap-3">
            <Lock className="h-5 w-5 text-info" />
            <div className="text-sm">Your goal sheet is locked for editing — it's pending manager review.</div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editingId ? "Edit goal" : "Add a goal"}</h2>
              {editingId && <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setDraft(emptyDraft()); }}>Cancel edit</Button>}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Thrust Area</Label>
                <Select value={draft.thrustArea} onValueChange={(v) => setDraft({ ...draft, thrustArea: v })} disabled={locked}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{THRUST_AREAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Goal title</Label>
                <Input id="title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Increase revenue by 20%" disabled={locked} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Context, success criteria…" disabled={locked} />
            </div>
            <div className="space-y-2">
              <Label>Unit of measurement</Label>
              <RadioGroup value={draft.uom} onValueChange={(v) => setDraft({ ...draft, uom: v as UoM, target: "" })} className="grid sm:grid-cols-2 gap-2" disabled={locked}>
                {UOM_OPTS.map((o) => (
                  <Label key={o.value} htmlFor={`uom-${o.value}`}
                    className={`border rounded-md p-3 flex items-start gap-3 cursor-pointer ${draft.uom === o.value ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem id={`uom-${o.value}`} value={o.value} className="mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">{o.label}</div>
                      <div className="text-xs text-muted-foreground">{o.hint}</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="target">Target value</Label>
                <Input id="target" type={draft.uom === "timeline" ? "date" : "number"} value={draft.target}
                  onChange={(e) => setDraft({ ...draft, target: e.target.value })} disabled={locked} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight">Weightage (%)</Label>
                <Input id="weight" type="number" min={10} max={100} value={draft.weightage}
                  onChange={(e) => setDraft({ ...draft, weightage: Number(e.target.value) || 0 })} disabled={locked} />
              </div>
            </div>
            <Button onClick={addOrUpdate} disabled={locked}>
              {editingId ? <><Save className="h-4 w-4" /> Save changes</> : <><Plus className="h-4 w-4" /> Add goal</>}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Weightage</span>
                <span className={`text-sm tabular-nums ${totalWeight === 100 ? "text-success" : totalWeight > 100 ? "text-destructive" : "text-muted-foreground"}`}>{totalWeight}/100</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full transition-[width,background-color] duration-500 ease-out"
                  style={{ width: `${Math.min(totalWeight, 100)}%`, backgroundColor: progressTone(totalWeight) }}
                />
              </div>
              {totalWeight > 100 && <p className="text-xs text-destructive mt-2">Total weightage cannot exceed 100%</p>}
              {totalWeight < 100 && <p className="text-xs text-muted-foreground mt-2">{100 - totalWeight}% remaining</p>}
              {ready && <p className="text-xs text-success mt-2 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Ready to submit</p>}
              <Button className="w-full mt-4" onClick={submit} disabled={!ready}>Submit for approval</Button>
              <p className="text-xs text-muted-foreground mt-2">{mine.length}/8 goals used</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-medium text-sm">Your goal sheet</h3>
              {mine.length === 0 && <p className="text-sm text-muted-foreground">No goals yet.</p>}
              {mine.map((g) => (
                <div key={g.id} className="border rounded-md p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{g.title}</div>
                      <div className="text-xs text-muted-foreground">{g.thrustArea} · target {g.target} · {g.weightage}%</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px]">{g.status}</Badge>
                      {!locked && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => startEdit(g)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(g.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
