"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type InvitationState = "loading" | "invalid" | "valid" | "success";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [state, setState] = useState<InvitationState>("loading");
  const [invitationEmail, setInvitationEmail] = useState("");
  const [invitationContactName, setInvitationContactName] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    async function validateToken() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data } = await supabase
        .from("invitations")
        .select("id, email, contact_name, used, created_at")
        .eq("token", token!)
        .eq("used", false)
        .gte("created_at", sevenDaysAgo)
        .single();

      if (!data) {
        setState("invalid");
      } else {
        setInvitationEmail(data.email);
        setInvitationContactName(data.contact_name ?? null);
        setState("valid");
      }
    }

    validateToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: invitationEmail,
      password,
    });

    if (signUpError) {
      console.error("[register] signUp error message:", signUpError.message);
      console.error("[register] signUp error status:", signUpError.status);
      console.error("[register] signUp error name:", signUpError.name);
      console.error("[register] signUp error full:", JSON.stringify(signUpError, null, 2));
      console.error("[register] signUp error raw:", signUpError);
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    const userId = signUpData.user?.id;
    console.log("[register] signUp success, userId:", userId);

    if (userId) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        role: "client",
        full_name: invitationContactName ?? null,
      });
      if (profileError) {
        console.error("[register] profile upsert error:", JSON.stringify(profileError));
      }

      // Link the clients record to this auth user via user_id
      const { error: clientLinkError } = await supabase
        .from("clients")
        .update({ user_id: userId })
        .ilike("email", invitationEmail);
      if (clientLinkError) {
        console.error("[register] client user_id link error:", JSON.stringify(clientLinkError));
      }
    }

    const { error: inviteUpdateError } = await supabase
      .from("invitations")
      .update({ used: true })
      .eq("token", token!);
    if (inviteUpdateError) {
      console.error("[register] invitation update error:", JSON.stringify(inviteUpdateError));
    }

    document.cookie = `user-role=client; path=/; SameSite=Lax; Max-Age=2592000`;

    setState("success");
    setTimeout(() => router.push("/client/dashboard"), 1500);
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Vérification du lien…
        </p>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4 px-6">
        <span className="material-symbols-outlined text-[#444748] text-5xl">lock</span>
        <h1
          className="text-white text-2xl font-bold tracking-tight text-center"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Invitation requise
        </h1>
        <p
          className="text-[#949493] text-sm text-center max-w-xs"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Ce lien d'invitation est invalide ou a déjà été utilisé. Contactez votre
          gestionnaire Motors Line pour recevoir une nouvelle invitation.
        </p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4 px-6">
        <span className="material-symbols-outlined text-[#66ff8e] text-5xl">check_circle</span>
        <h1
          className="text-white text-2xl font-bold tracking-tight"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Compte créé !
        </h1>
        <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Redirection vers votre espace…
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      <main className="w-full max-w-sm md:max-w-[480px] flex flex-col items-center space-y-10 z-10">
        <header className="text-center space-y-2">
          <h1
            className="silver-gradient-text text-4xl font-semibold italic tracking-tighter"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Motors Line
          </h1>
          <p
            className="text-[14px] font-medium tracking-widest uppercase text-[#949493]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Création de compte
          </p>
        </header>

        <section
          className="w-full p-8 rounded-[32px] shadow-2xl"
          style={{ background: "rgba(28, 27, 27, 0.4)", backdropFilter: "blur(12px)" }}
        >
          <p
            className="text-[#949493] text-sm mb-6 text-center"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Invitation pour{" "}
            <span className="text-white font-semibold">{invitationEmail}</span>
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold uppercase tracking-widest text-[#c4c7c8] ml-1"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Mot de passe
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors select-none">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-white/20 focus:bg-[#3a3939] transition-all duration-300 text-sm placeholder:text-zinc-600"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm"
                className="block text-[11px] font-semibold uppercase tracking-widest text-[#c4c7c8] ml-1"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Confirmer le mot de passe
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors select-none">
                  lock_reset
                </span>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-white/20 focus:bg-[#3a3939] transition-all duration-300 text-sm placeholder:text-zinc-600"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                />
              </div>
            </div>

            {error && (
              <p
                className="text-[#ffb4ab] text-sm text-center"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {error}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-white text-[#0A0A0A] font-semibold py-4 rounded-full active:scale-95 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(255,255,255,0.2)] hover:bg-zinc-100 uppercase tracking-tight disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {submitting ? "Création…" : "Créer mon compte"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default function ClientRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Chargement…
          </p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
