"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { signInDemo } from "@/lib/store";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setMessage(error ? error.message : "Check your email for a secure sign-in link.");
  }

  return (
    <main className="centered-page">
      <div className="auth-card">
        <div className="icon-tile"><LockKeyhole /></div>
        <p className="eyebrow">Private practice space</p>
        <h1>Start improving your answers</h1>
        {configured ? (
          <>
            <p>Enter your email and we will send you a secure, password-free sign-in link.</p>
            <form className="auth-form" onSubmit={sendMagicLink}>
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              <button className="button button-wide" type="submit">Email me a sign-in link <ArrowRight size={18} /></button>
            </form>
            {message && <p className="auth-message">{message}</p>}
          </>
        ) : (
          <>
            <p>Use the fully functional local demo now. Production email authentication activates when Supabase environment variables are configured.</p>
            <button className="button button-wide" onClick={() => { signInDemo(); router.push("/dashboard"); }}>
              Continue to InterviewLab <ArrowRight size={18} />
            </button>
            <p className="fine-print">Your demo attempts stay in this browser and are never uploaded to third-party analytics.</p>
          </>
        )}
      </div>
    </main>
  );
}
