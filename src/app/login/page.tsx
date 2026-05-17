"use client";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, EyeOff, Check, Loader2 } from "lucide-react";

const QUICK = [
  { label: "Admin / HR", email: "admin@atomberg.com" },
  { label: "Manager (L1)", email: "manager@atomberg.com" },
  { label: "Employee", email: "employee@atomberg.com" },
];

export default function Login() {
  const { data: session } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("employee@atomberg.com");
  const [password, setPassword] = useState("password123");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const submit = async (e?: React.FormEvent, directEmail?: string) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(false);
    setShake(false);

    const targetEmail = directEmail || email;
    
    const res = await signIn("credentials", {
      redirect: false,
      email: targetEmail,
      password,
    });

    if (res?.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 550);
    } else {
      setLoading(false);
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <div className="flex items-center gap-2 animate-in slide-in-from-top-4 fade-in">
          <div className="w-9 h-9 rounded-lg bg-primary-foreground/15 grid place-items-center"><Target className="h-5 w-5" /></div>
          <span className="font-semibold tracking-tight">GoalQuest</span>
        </div>
        <div className="space-y-5 animate-in slide-in-from-bottom-8 fade-in">
          <h1 className="text-4xl font-semibold leading-tight">The future of organizational goal management.</h1>
          <p className="text-primary-foreground/80 max-w-md">Set goals, run quarterly check-ins, approve at scale — all in one calm, auditable workspace.</p>
        </div>
        <div className="text-sm text-primary-foreground/70">AtomQuest Hackathon 1.0</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className={`w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm animate-in zoom-in-95 duration-300 ${shake ? "animate-pulse" : ""}`}>
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Use one of the demo accounts to explore each role.</p>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className={`transition-all duration-300 focus:bg-primary/[0.03] focus:border-primary ${error ? "border-destructive" : ""}`}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw">Password</Label>
                <div className="relative">
                  <Input
                    id="pw" type={showPw ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    className={`pr-10 transition-all duration-300 focus:bg-primary/[0.03] focus:border-primary ${error ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button" onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-2 grid place-items-center text-muted-foreground hover:text-foreground transition-transform duration-200"
                    style={{ transform: `rotate(${showPw ? 180 : 0}deg)` }}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive font-medium">Invalid credentials. Try a demo account.</p>}
              <Button type="submit" className={`w-full ${shake ? "animate-pulse" : ""}`} disabled={loading || success}>
                {success ? (
                  <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" /> Signed in</span>
                ) : loading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</span>
                ) : "Sign in"}
              </Button>
            </form>
            <div className="mt-6">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Quick demo access</div>
              <div className="grid grid-cols-3 gap-2">
                {QUICK.map((q) => (
                  <Button key={q.email} type="button" variant="outline" size="sm"
                    onClick={() => { setEmail(q.email); submit(undefined, q.email); }}>
                    {q.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
