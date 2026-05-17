"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "employee" | "manager" | "admin";
export type UoM = "min" | "max" | "timeline" | "zero";
export type GoalStatus = "draft" | "awaiting" | "approved" | "returned";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  managerId?: string;
}

export interface CheckIn {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  actual: string; // string for both numeric and date
  status: "Not Started" | "On Track" | "Completed";
  score: number; // 0..1
  managerComment?: string;
  reviewed?: boolean;
  submittedAt: string;
}

export interface Goal {
  id: string;
  ownerId: string;
  thrustArea: string;
  title: string;
  description: string;
  uom: UoM;
  target: string;
  weightage: number;
  status: GoalStatus;
  shared?: boolean;
  primaryOwnerId?: string;
  managerComment?: string;
  checkins: CheckIn[];
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  ts: string;
  user: string;
  action: string;
  goalId?: string;
  details: string;
  change?: string;
}

export interface Escalation {
  id: string;
  date: string;
  employee: string;
  rule: string;
  status: "Pending" | "Resolved";
}

export interface CyclePhase {
  key: string;
  label: string;
  open: boolean;
  window: string;
}

interface StoreState {
  currentUser: User | null;
  users: User[];
  goals: Goal[];
  audit: AuditEntry[];
  escalations: Escalation[];
  cycle: { name: string; phases: CyclePhase[] };
}

export const THRUST_AREAS = [
  "Sales & Revenue",
  "Customer Excellence",
  "Operational Efficiency",
  "Technology & Innovation",
  "People & Culture",
];

const seedUsers: User[] = [
  { id: "u-admin", name: "Avery Patel", email: "admin@atomberg.com", role: "admin", department: "HR" },
  { id: "u-mgr", name: "Morgan Kapoor", email: "manager@atomberg.com", role: "manager", department: "Sales" },
  { id: "u-emp", name: "Jordan Rivera", email: "employee@atomberg.com", role: "employee", department: "Sales", managerId: "u-mgr" },
  { id: "u-john", name: "John Doe", email: "john@atomberg.com", role: "employee", department: "Sales", managerId: "u-mgr" },
  { id: "u-sarah", name: "Sarah Smith", email: "sarah@atomberg.com", role: "employee", department: "Marketing", managerId: "u-mgr" },
  { id: "u-mike", name: "Mike Johnson", email: "mike@atomberg.com", role: "employee", department: "Engineering", managerId: "u-mgr" },
  { id: "u-lisa", name: "Lisa Chen", email: "lisa@atomberg.com", role: "employee", department: "Operations", managerId: "u-mgr" },
];

const seedGoals: Goal[] = [
  {
    id: "g-1", ownerId: "u-john", thrustArea: "Sales & Revenue", title: "Increase Revenue by 20%",
    description: "Drive net-new pipeline and expansion in NA region.", uom: "min", target: "120", weightage: 40,
    status: "awaiting", checkins: [], createdAt: "2024-05-02T10:00:00Z",
  },
  {
    id: "g-2", ownerId: "u-john", thrustArea: "Customer Excellence", title: "Improve CSAT to 90%",
    description: "", uom: "min", target: "90", weightage: 30, status: "awaiting", checkins: [], createdAt: "2024-05-02T10:00:00Z",
  },
  {
    id: "g-3", ownerId: "u-john", thrustArea: "Operational Efficiency", title: "Reduce Operational Cost by $50K",
    description: "", uom: "max", target: "50", weightage: 30, status: "awaiting", checkins: [], createdAt: "2024-05-02T10:00:00Z",
  },
  {
    id: "g-4", ownerId: "u-sarah", thrustArea: "Technology & Innovation", title: "Launch Brand Refresh",
    description: "", uom: "timeline", target: "2025-06-30", weightage: 60, status: "approved",
    checkins: [{ quarter: "Q1", actual: "70", status: "On Track", score: 0.7, submittedAt: "2024-07-15T12:00:00Z" }],
    createdAt: "2024-05-02T10:00:00Z",
  },
  {
    id: "g-5", ownerId: "u-sarah", thrustArea: "People & Culture", title: "Zero Compliance Incidents",
    description: "", uom: "zero", target: "0", weightage: 40, status: "approved", checkins: [], createdAt: "2024-05-02T10:00:00Z",
  },
];

const seedCycle = {
  name: "FY 2025",
  phases: [
    { key: "set", label: "Goal Setting", open: true, window: "May 1 – May 31" },
    { key: "q1", label: "Q1 Check-in", open: true, window: "July 1 – July 15" },
    { key: "q2", label: "Q2 Check-in", open: false, window: "Oct 1 – Oct 15" },
    { key: "q3", label: "Q3 Check-in", open: false, window: "Jan 1 – Jan 15" },
    { key: "q4", label: "Q4 Check-in", open: false, window: "Mar 25 – Apr 10" },
  ] as CyclePhase[],
};

const seedAudit: AuditEntry[] = [
  { id: "a-1", ts: "2024-07-15T10:30:00Z", user: "manager@atomberg.com", action: "Target changed", goalId: "g-1", details: "Revenue Target", change: "50 → 55" },
  { id: "a-2", ts: "2024-07-20T14:15:00Z", user: "admin@atomberg.com", action: "Goal unlocked", goalId: "g-1", details: "Scope clarification" },
];

const seedEscalations: Escalation[] = [
  { id: "e-1", date: "2024-05-06", employee: "mike@atomberg.com", rule: "Goals not submitted (Day 5)", status: "Pending" },
  { id: "e-2", date: "2024-07-04", employee: "lisa@atomberg.com", rule: "Q1 Check-in overdue (Day 3)", status: "Resolved" },
];

const KEY = "goalquest:v1";

function loadState(): Partial<StoreState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

interface StoreCtx extends StoreState {
  login: (email: string) => boolean;
  logout: () => void;
  setGoals: (g: Goal[]) => void;
  addAudit: (e: Omit<AuditEntry, "id" | "ts">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  approveGoals: (ownerId: string) => void;
  returnGoals: (ownerId: string, comment: string) => void;
  submitOwnGoals: (ownerId: string) => void;
  setCyclePhase: (key: string, open: boolean) => void;
  resolveEscalation: (id: string) => void;
  addCheckin: (goalId: string, ci: CheckIn) => void;
  reviewCheckin: (goalId: string, quarter: string, comment: string) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

import { useSession } from "next-auth/react";

export function StoreProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  
  const [state, setState] = useState<StoreState>(() => {
    const persisted = loadState();
    return {
      currentUser: persisted.currentUser ?? null,
      users: persisted.users ?? seedUsers,
      goals: persisted.goals ?? seedGoals,
      audit: persisted.audit ?? seedAudit,
      escalations: persisted.escalations ?? seedEscalations,
      cycle: persisted.cycle ?? seedCycle,
    };
  });

  useEffect(() => {
    if (session?.user) {
      const email = session.user.email?.toLowerCase();
      const u = state.users.find(x => x.email.toLowerCase() === email);
      if (u) {
        setState(s => ({ ...s, currentUser: u }));
      } else {
        // Create an ad-hoc user for the store if not found in mock data
        setState(s => ({
          ...s,
          currentUser: {
            id: 'u-custom',
            name: session.user?.name || 'User',
            email: session.user?.email || '',
            role: ((session.user as any)?.role?.toLowerCase() as Role) || 'employee',
            department: 'Custom'
          }
        }));
      }
    }
  }, [session, state.users]);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const value = useMemo<StoreCtx>(() => {
    const addAudit: StoreCtx["addAudit"] = (e) => {
      setState((s) => ({
        ...s,
        audit: [
          { id: `a-${Date.now()}`, ts: new Date().toISOString(), ...e },
          ...s.audit,
        ],
      }));
    };

    return {
      ...state,
      login: (email) => {
        const u = state.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
        if (!u) return false;
        setState((s) => ({ ...s, currentUser: u }));
        return true;
      },
      logout: () => setState((s) => ({ ...s, currentUser: null })),
      setGoals: (g) => setState((s) => ({ ...s, goals: g })),
      addAudit,
      updateGoal: (id, patch) =>
        setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      approveGoals: (ownerId) =>
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) =>
            g.ownerId === ownerId && g.status === "awaiting" ? { ...g, status: "approved" } : g,
          ),
        })),
      returnGoals: (ownerId, comment) =>
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) =>
            g.ownerId === ownerId && g.status === "awaiting"
              ? { ...g, status: "returned", managerComment: comment }
              : g,
          ),
        })),
      submitOwnGoals: (ownerId) =>
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) =>
            g.ownerId === ownerId && (g.status === "draft" || g.status === "returned")
              ? { ...g, status: "awaiting" }
              : g,
          ),
        })),
      setCyclePhase: (key, open) =>
        setState((s) => ({
          ...s,
          cycle: { ...s.cycle, phases: s.cycle.phases.map((p) => (p.key === key ? { ...p, open } : p)) },
        })),
      resolveEscalation: (id) =>
        setState((s) => ({
          ...s,
          escalations: s.escalations.map((e) => (e.id === id ? { ...e, status: "Resolved" } : e)),
        })),
      addCheckin: (goalId, ci) =>
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, checkins: [...g.checkins.filter((c) => c.quarter !== ci.quarter), ci] }
              : g,
          ),
        })),
      reviewCheckin: (goalId, quarter, comment) =>
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  checkins: g.checkins.map((c) =>
                    c.quarter === quarter ? { ...c, managerComment: comment, reviewed: true } : c,
                  ),
                }
              : g,
          ),
        })),
    };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

export function calcScore(uom: UoM, target: string, actual: string): number {
  if (!actual) return 0;
  if (uom === "zero") return Number(actual) === 0 ? 1 : 0;
  if (uom === "timeline") {
    const t = new Date(target).getTime();
    const a = new Date(actual).getTime();
    if (Number.isNaN(t) || Number.isNaN(a)) return 0;
    return a <= t ? 1 : Math.max(0, 1 - (a - t) / (1000 * 60 * 60 * 24 * 30));
  }
  const t = Number(target);
  const a = Number(actual);
  if (!t || !a) return 0;
  if (uom === "min") return Math.min(1.5, a / t);
  return Math.min(1.5, t / a);
}
