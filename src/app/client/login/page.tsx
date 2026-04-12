"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message;
      if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
        setError("Identifiants incorrects. Vérifiez votre e-mail et mot de passe.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Veuillez confirmer votre adresse e-mail.");
      } else if (msg.includes("Too many requests")) {
        setError("Trop de tentatives. Réessayez dans quelques minutes.");
      } else {
        setError("Erreur de connexion. Veuillez réessayer.");
      }
      setLoading(false);
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
      const role = profile?.role ?? "client";
      document.cookie = `user-role=${role}; path=/; SameSite=Lax; Max-Age=2592000`;
      router.push("/client/dashboard");
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-1.5 text-[#949493] hover:text-white transition-colors text-sm z-10"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Accueil
      </Link>

      {/* Background decorative glow */}
      <div className="fixed top-0 right-0 w-1/2 h-screen -z-20 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px]" />
      </div>

      <main className="w-full max-w-md md:max-w-[480px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-12 text-center">
          <div className="relative inline-block mb-2">
            <h1
              className="text-4xl font-semibold italic tracking-tighter silver-gradient-text overflow-visible pr-1"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Motors Line
            </h1>
            <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-full -z-10" />
          </div>
          <p
            className="text-[14px] text-[#949493] tracking-widest uppercase"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Espace Client
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-xs text-[#c4c7c8] ml-1"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Identifiant (e-mail)
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: client@motorsline.fr"
                className="w-full h-14 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 pr-12 text-white placeholder:text-[#8e9192]/40 focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-[#3a3939] transition-all duration-200"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#444748] select-none">
                person
              </span>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-xs text-[#c4c7c8] ml-1"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 pr-12 text-white placeholder:text-[#8e9192]/40 focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-[#3a3939] transition-all duration-200"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#444748] select-none">
                lock
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p
              className="text-[#ffb4ab] text-sm text-center"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-white text-[#0A0A0A] font-bold rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 transition-all duration-150 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-8 left-0 w-full flex justify-center px-6 pointer-events-none">
        <p
          className="text-[10px] text-[#444748] tracking-wide"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          © 2026 CJagency — Tous droits réservés
        </p>
      </footer>
    </div>
  );
}
