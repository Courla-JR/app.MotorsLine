"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role ?? "convoyeur";
      if (role === "admin") router.replace("/admin");
      else if (role === "client") router.replace("/client/dashboard");
      else router.replace("/dashboard");
    }

    checkSession();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* Ambient glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">

        {/* Badge */}
        <div className="mb-10 flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#66ff8e] shadow-[0_0_6px_#66ff8e]" />
          <span
            className="text-[10px] text-[#949493] uppercase tracking-[0.2em] font-medium"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Transport haute gamme
          </span>
        </div>

        {/* Logo */}
        <div className="mb-6 relative">
          <h1
            className="text-5xl md:text-6xl font-semibold italic tracking-tighter silver-gradient-text"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Motors Line
          </h1>
          <div className="absolute -inset-6 bg-white/5 blur-3xl rounded-full -z-10" />
        </div>

        {/* Baseline */}
        <p
          className="text-[#949493] text-base md:text-lg tracking-wide mb-14"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Par des pros.{" "}
          <span className="text-[#E0E0E0]">Pour des pros.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            href="/login"
            className="flex-1 py-4 bg-white text-[#0A0A0A] font-bold text-lg rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-100 active:scale-95 transition-all duration-150 shadow-[0_0_24px_rgba(255,255,255,0.08)] whitespace-nowrap"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_shipping
            </span>
            Espace Convoyeur
          </Link>
          <Link
            href="/client/login"
            className="flex-1 py-4 bg-transparent text-white font-bold text-lg rounded-lg flex items-center justify-center gap-2 border border-[#2A2A2A] hover:bg-white/5 hover:border-white/20 active:scale-95 transition-all duration-150 whitespace-nowrap"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              person
            </span>
            Espace Client
          </Link>
        </div>

        {/* Vitrine link */}
        <a
          href="https://motorsline.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center gap-1.5 text-[#949493] hover:text-white transition-colors duration-150 text-sm"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          motorsline.fr
          <span className="material-symbols-outlined text-sm leading-none">open_in_new</span>
        </a>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-8 left-0 w-full flex justify-center px-6">
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
