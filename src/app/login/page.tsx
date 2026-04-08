"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
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
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role ?? "convoyeur";
    if (role === "admin") {
      router.push("/admin");
    } else if (role === "client") {
      router.push("/client/dashboard");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* Background decorative glow */}
      <div className="fixed top-0 right-0 w-1/2 h-screen -z-20 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px]" />
      </div>

      {/* Background atmosphere */}
      <div className="fixed inset-0 -z-30 opacity-10 pointer-events-none">
        <div
          className="w-full h-full bg-cover bg-center mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAbT9a-sw-c-MKrwbn1yR_NKOWwJYSoLNr8x9M60667xXwtCwZHrPbq_tI-DezDYtI5X0lb--7V-hYLGaKbZs9O5MuNPS0-eWFC43_NRJlHfO8rpRsXgD0Qb-PuTLGYNZ1_6B6Xh1exhjpqXnspZbAwtmuy_10trjyea7PWelR3i8vK7ll5WVb5jYYCsM7pH0BREDqlhc3enam7gfHQQrJFIaY2UZTa7yn10DGhJQQbo75nYUORv9Zjn5SicrqUK6I5OjtfcdLPFXY')",
          }}
        />
      </div>

      <main className="w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="mb-12 text-center">
          <div className="relative inline-block mb-2">
            <h1
              className="text-4xl font-semibold italic tracking-tighter silver-gradient-text"
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
            Espace Convoyeur
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
                placeholder="ex: convoyeur@motorsline.fr"
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

          {/* Secondary action */}
          <div className="flex flex-col items-center pt-4">
            <a
              href="#"
              className="text-[#949493] text-sm underline decoration-[#949493]/30 underline-offset-4 hover:text-white transition-colors"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Code d&apos;accès temporaire ?
            </a>
          </div>
        </form>
      </main>

      {/* Footer */}
      <div className="fixed bottom-12 left-0 w-full px-6 pointer-events-none opacity-20">
        <div className="max-w-md mx-auto border-t border-white/10 pt-4 flex justify-between items-center">
          <span
            className="text-[10px] tracking-tighter uppercase"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            High-End Transport
          </span>
          <div className="h-[1px] flex-grow mx-4 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <span
            className="text-[10px] tracking-tighter uppercase"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Est. 2024
          </span>
        </div>
      </div>
    </div>
  );
}
