import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "न्यूज़रूम लॉगिन — जय हिन्द भारत" },
      { name: "description", content: "जय हिन्द भारत के संपादकीय पैनल में साइन इन करें।" },
      { property: "og:title", content: "न्यूज़रूम लॉगिन — जय हिन्द भारत" },
      { property: "og:description", content: "संपादकीय पैनल एक्सेस।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/admin" });
  }, [loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("खाता बन गया। अब साइन इन करें।");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "लॉगिन विफल");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google साइन इन विफल");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/admin" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-md border border-border bg-card p-5">
        <h1 className="headline text-xl font-bold">न्यूज़रूम पैनल</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "in" ? "अपने खाते से साइन इन करें।" : "नया संपादक खाता बनाएं।"}
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ईमेल"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="पासवर्ड"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {mode === "in" ? "साइन इन" : "खाता बनाएं"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void google()}
          className="mt-3 h-10 w-full rounded-md border border-border text-sm font-semibold hover:bg-accent"
        >
          Google से साइन इन
        </button>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "in" ? "up" : "in"))}
          className="mt-4 w-full text-xs font-semibold text-primary"
        >
          {mode === "in" ? "नया खाता बनाएं" : "पहले से खाता है? साइन इन करें"}
        </button>
      </div>
    </div>
  );
}
