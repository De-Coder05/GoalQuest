"use client";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, EyeOff, Check, Loader2, ArrowRight } from "lucide-react";

const QUICK = [
  { label: "Admin / HR", email: "admin@atomberg.com" },
  { label: "Manager", email: "manager@atomberg.com" },
  { label: "Employee", email: "employee@atomberg.com" },
];

export default function Login() {
  const { data: session } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
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
    if (!targetEmail) {
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background overflow-hidden relative">
      {/* Decorative background blobs for the right side */}
      <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[15%] w-[30rem] h-[30rem] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none z-0" />

      {/* LEFT PANE - BRANDING */}
      <div className="hidden lg:flex flex-col justify-between p-14 bg-primary text-primary-foreground relative overflow-hidden shadow-2xl z-10">
        
        {/* Dynamic Abstract Background on Left */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-black blur-[120px] mix-blend-overlay animate-pulse duration-10000" />
          <div className="absolute bottom-[-10%] right-[-20%] w-[600px] h-[600px] rounded-full bg-white blur-[100px] mix-blend-overlay opacity-60" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>
        
        <div className="z-10 flex flex-col h-full justify-between">
          <div className="flex items-center gap-3 animate-in slide-in-from-top-8 fade-in duration-700">
            <div className="w-12 h-12 rounded-xl bg-black text-primary grid place-items-center shadow-2xl">
              <Target className="h-7 w-7" />
            </div>
            <span className="font-bold text-2xl tracking-tight">AtomQuest</span>
          </div>
          
          <div className="space-y-6 animate-in slide-in-from-left-12 fade-in duration-1000 delay-300 fill-mode-backwards">
            <h1 className="text-[3.5rem] font-black leading-[1.1] tracking-tighter">
              Empower Your Team.<br/>Achieve More.
            </h1>
            <p className="text-primary-foreground/90 max-w-md text-lg font-medium leading-relaxed">
              The official Atomberg platform to set ambitious goals, run seamless quarterly check-ins, and align your entire organization.
            </p>
          </div>
          
          <div className="flex items-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-500 fill-mode-backwards">
            <div className="h-px bg-primary-foreground/20 flex-1" />
            <div className="text-sm font-bold tracking-widest uppercase text-primary-foreground/80">
              Hackathon 1.0 Edition
            </div>
            <div className="h-px bg-primary-foreground/20 flex-1" />
          </div>
        </div>
      </div>

      {/* RIGHT PANE - LOGIN FORM */}
      <div className="flex items-center justify-center p-6 z-10">
        <Card className={`w-full max-w-[440px] border-border/40 shadow-2xl bg-card/80 backdrop-blur-2xl animate-in zoom-in-95 fade-in duration-700 ${shake ? "gq-shake" : ""}`}>
          <CardContent className="p-8 sm:p-10">
            <div className="text-center space-y-2 mb-8 animate-in slide-in-from-top-4 fade-in duration-700 delay-200 fill-mode-backwards">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary grid place-items-center mx-auto mb-4 lg:hidden">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground">Sign in to your GoalQuest account</p>
            </div>
            
            <form onSubmit={submit} className="space-y-5 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300 fill-mode-backwards">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">Email</Label>
                <Input
                  id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="name@atomberg.com"
                  className={`h-11 px-4 transition-all duration-300 focus:bg-primary/[0.03] focus:border-primary focus:ring-4 focus:ring-primary/10 ${error ? "border-destructive bg-destructive/5 focus:ring-destructive/20" : ""}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw" className="font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="pw" type={showPw ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    className={`h-11 pl-4 pr-11 transition-all duration-300 focus:bg-primary/[0.03] focus:border-primary focus:ring-4 focus:ring-primary/10 ${error ? "border-destructive bg-destructive/5 focus:ring-destructive/20" : ""}`}
                  />
                  <button
                    type="button" onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-1 px-3 grid place-items-center text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="text-sm text-destructive font-medium bg-destructive/10 border border-destructive/20 rounded-md p-3 animate-in fade-in zoom-in-95">
                  Invalid credentials. Try a demo account.
                </div>
              )}
              
              <Button type="submit" size="lg" className="w-full h-11 text-base font-semibold group transition-all duration-300 hover:shadow-lg hover:shadow-primary/25" disabled={loading || success}>
                {success ? (
                  <span className="inline-flex items-center gap-2"><Check className="h-5 w-5" /> Authenticated</span>
                ) : loading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Verifying…</span>
                ) : (
                  <span className="inline-flex items-center gap-2">Sign in to portal <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                )}
              </Button>
            </form>
            
            <div className="mt-8 pt-8 border-t border-border/50 animate-in fade-in duration-700 delay-500 fill-mode-backwards">
              <div className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-4 text-center">
                Quick Demo Access
              </div>
              <div className="grid grid-cols-3 gap-3">
                {QUICK.map((q) => (
                  <Button key={q.email} type="button" variant="outline" className="h-auto py-2.5 px-2 flex flex-col gap-1 transition-all hover:border-primary hover:bg-primary/5"
                    onClick={() => { setEmail(q.email); submit(undefined, q.email); }}>
                    <span className="text-xs font-semibold">{q.label}</span>
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
