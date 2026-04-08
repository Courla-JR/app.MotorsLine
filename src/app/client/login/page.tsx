"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      setError(error.message);
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
      className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* Ambient light bleeds */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      <main className="w-full max-w-sm md:max-w-[480px] flex flex-col items-center space-y-12 z-10">
        {/* Branding */}
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
            Espace Client
          </p>
        </header>

        {/* Login card */}
        <section
          className="w-full p-8 rounded-[32px] shadow-2xl"
          style={{
            background: "rgba(28, 27, 27, 0.4)",
            backdropFilter: "blur(12px)",
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
            {/* Email / Identifiant */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold uppercase tracking-widest text-[#c4c7c8] ml-1"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Identifiant
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors duration-300 select-none">
                  person
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@motorsline.fr"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-white/20 focus:bg-[#3a3939] transition-all duration-300 text-sm placeholder:text-zinc-600"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label
                  htmlFor="password"
                  className="text-[11px] font-semibold uppercase tracking-widest text-[#c4c7c8]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Mot de passe
                </label>
                <a
                  href="#"
                  className="text-[10px] text-zinc-500 hover:text-white transition-colors"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Oublié?
                </a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors duration-300 select-none">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-white/20 focus:bg-[#3a3939] transition-all duration-300 text-sm placeholder:text-zinc-600"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-[#ffb4ab] text-sm text-center"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="pt-4 space-y-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#0A0A0A] font-semibold py-4 rounded-full active:scale-95 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(255,255,255,0.2)] hover:bg-zinc-100 uppercase tracking-tight disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {loading ? "Connexion…" : "Se connecter"}
              </button>

            </div>
          </form>
        </section>

        {/* Footer visual */}
        <footer className="w-full flex flex-col items-center">
          <div className="w-32 h-1 bg-[#353534] rounded-full mb-6" />
          <div className="relative w-full h-32 overflow-hidden rounded-2xl group">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUgb6hnENPaxSn1fpQjR5BLILwxFbWwoYFhLNlWHjE8RLlPUCAdAQoTuJqIMIUFGedA-uQ5eTHphQZ0RHA0chIsb7RE2MK7CiCvOwqHt7-mioAvkci-zy0Zd7WDc-AmiTnFfBqakbgf7bmcix-denqTX4RC74krEK2Pj_wwpu1cX5L0zYYOjzcjCxQJEWhkeKmvyDAuU8pVZrJqHuCko9e8quQLbK4jFkaFs2KZvLJkilO_tReVUGBGJ-VwdEqjKIlYLcgrFpHQuw"
              alt="luxury car dashboard"
              className="w-full h-full object-cover opacity-40 grayscale hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
          </div>
        </footer>
      </main>

      {/* Support link */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-center w-full px-6">
        <p
          className="text-[10px] text-zinc-600 uppercase tracking-widest"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Besoin d&apos;assistance ?{" "}
          <span className="text-zinc-400 font-semibold cursor-pointer">
            Support Motors Line
          </span>
        </p>
      </div>
    </div>
  );
}
