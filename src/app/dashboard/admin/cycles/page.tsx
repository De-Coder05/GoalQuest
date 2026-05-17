"use client";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";



export default function Cycles() {
  const { cycle, setCyclePhase, addAudit, currentUser } = useStore();
  return (
    <>
      <PageHeader title="Cycle management" description={`Active cycle: ${cycle.name}`} />
      <div className="grid md:grid-cols-2 gap-4">
        {cycle.phases.map((p) => (
          <Card key={p.key}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.label}</div>
                <div className="text-xs text-muted-foreground">{p.window}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${p.open ? "text-success" : "text-muted-foreground"}`}>{p.open ? "Open" : "Closed"}</span>
                <Switch checked={p.open} onCheckedChange={(v) => {
                  setCyclePhase(p.key, v);
                  addAudit({ user: currentUser!.email, action: "Cycle phase toggled", details: `${p.label} → ${v ? "Open" : "Closed"}` });
                  toast.success(`${p.label} ${v ? "opened" : "closed"}`);
                }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
