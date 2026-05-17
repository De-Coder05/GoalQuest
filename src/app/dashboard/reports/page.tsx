"use client";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useStore, calcScore, THRUST_AREAS } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";



const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

function downloadCSV(rows: (string | number)[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { goals, users } = useStore();

  const exportCSV = () => {
    const rows: (string | number)[][] = [["Employee", "Goal", "Thrust Area", "UoM", "Target", "Weightage", "Q1 Actual", "Q1 Score", "Status"]];
    goals.forEach((g) => {
      const u = users.find((x) => x.id === g.ownerId);
      const q1 = g.checkins.find((c) => c.quarter === "Q1");
      rows.push([u?.name ?? g.ownerId, g.title, g.thrustArea, g.uom, g.target, g.weightage, q1?.actual ?? "", q1 ? Math.round(calcScore(g.uom, g.target, q1.actual) * 100) + "%" : "", g.status]);
    });
    downloadCSV(rows, "goalquest-achievements.csv");
    toast.success("Report downloaded");
  };

  const qoq = (["Q1", "Q2", "Q3", "Q4"] as const).map((q) => {
    const ss = goals.flatMap((g) => g.checkins.filter((c) => c.quarter === q).map((c) => calcScore(g.uom, g.target, c.actual)));
    return { quarter: q, score: ss.length ? Math.round((ss.reduce((a,b) => a+b, 0) / ss.length) * 100) : 0 };
  });

  const dist = THRUST_AREAS.map((t) => ({ name: t, value: goals.filter((g) => g.thrustArea === t).length })).filter((d) => d.value > 0);

  const uomDist = (["min", "max", "timeline", "zero"] as const).map((u) => ({ name: u, count: goals.filter((g) => g.uom === u).length }));

  return (
    <>
      <PageHeader title="Reports" description="Cycle analytics and exportable achievement data."
        action={<Button onClick={exportCSV}><Download className="h-4 w-4" /> Download CSV</Button>} />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">QoQ progress trend</CardTitle></CardHeader>
          <CardContent style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={qoq}>
                <XAxis dataKey="quarter" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Goals by thrust area</CardTitle></CardHeader>
          <CardContent style={{ height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dist} dataKey="value" nameKey="name" outerRadius={80}>
                  {dist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Goals by unit of measurement</CardTitle></CardHeader>
          <CardContent style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={uomDist}>
                <XAxis dataKey="name" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
