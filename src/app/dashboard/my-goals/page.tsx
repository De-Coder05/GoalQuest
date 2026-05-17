"use client";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useStore, type GoalStatus } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Share2 } from "lucide-react";



const TABS: { key: GoalStatus | "all"; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "awaiting", label: "Awaiting Approval" },
  { key: "approved", label: "Approved" },
  { key: "returned", label: "Returned" },
];

export default function MyGoals() {
  const { currentUser, goals } = useStore();
  if (!currentUser) return null;
  const mine = goals.filter((g) => g.ownerId === currentUser.id);

  return (
    <>
      <PageHeader title="My goals" description="Track progress and approval status across your goal sheet." />
      <Tabs defaultValue="awaiting">
        <TabsList>{TABS.map((t) => (
          <TabsTrigger key={t.key} value={t.key}>{t.label} ({mine.filter((g) => g.status === t.key).length})</TabsTrigger>
        ))}</TabsList>
        {TABS.map((t) => {
          const list = mine.filter((g) => g.status === t.key);
          return (
            <TabsContent key={t.key} value={t.key} className="space-y-3 mt-4">
              {list.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet.</p>}
              {list.map((g) => (
                <Card key={g.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{g.title}</h3>
                          {g.shared && <Badge variant="secondary" className="gap-1"><Share2 className="h-3 w-3" /> Shared</Badge>}
                          {g.status === "approved" && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{g.thrustArea} · UoM: {g.uom} · target {g.target}</div>
                        {g.description && <p className="text-sm mt-2 text-muted-foreground">{g.description}</p>}
                        {g.managerComment && (
                          <div className="mt-3 text-sm border-l-2 border-warning pl-3">
                            <div className="text-xs font-medium text-warning mb-0.5">Manager feedback</div>
                            {g.managerComment}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant={g.status === "approved" ? "default" : "secondary"}>{g.status}</Badge>
                        <div className="text-2xl font-semibold mt-1 tabular-nums">{g.weightage}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}
