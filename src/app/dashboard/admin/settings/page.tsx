"use client";

import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";



export default function Settings() {
  return (
    <>
      <PageHeader title="Settings" description="Workspace preferences." />
      <Card><CardContent className="p-6 text-sm text-muted-foreground">
        Configure org-wide defaults (coming soon). For demo purposes, all data is stored locally in your browser and can be reset by clearing site data.
      </CardContent></Card>
    </>
  );
}
