"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CLIENT_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/client/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/client/missions" },
  { icon: "add_circle", label: "Nouvelle", href: "/client/missions/new" },
  { icon: "receipt_long", label: "Facturation", href: "/client/billing" },
  { icon: "person", label: "Profil", href: "/client/profile" },
];

export default function ClientSettingsPage() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "user-role=; path=/; Max-Age=0";
    router.push("/client/login");
  }

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen antialiased">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#0A0A0A] border-r border-[#2A2A2A] z-50 py-8 px-4">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text" style={{ fontFamily: "Inter, sans-serif" }}>
            Motors Line
          </h1>
          <p className="text-[10px] text-[#949493] uppercase tracking-widest mt-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Espace Client
          </p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {CLIENT_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                item.href === "/client/settings" ? "bg-white/10 text-white" : "text-[#949493] hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={item.href === "/client/settings" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#949493] hover:text-white hover:bg-white/5 transition-colors w-full mt-2"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Déconnexion</span>
        </button>
      </aside>

      {/* ── Main Content ── */}
      <div className="md:ml-60 pb-24 md:pb-10">

        {/* TopAppBar (mobile only) */}
        <header className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-neutral-950/80 backdrop-blur-xl">
          <h1 className="text-xl font-bold tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400" style={{ fontFamily: "Inter, sans-serif" }}>
            Motors Line
          </h1>
        </header>

        <main className="pt-24 md:pt-8 px-6 max-w-lg md:max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold tracking-tight text-white mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
            Paramètres
          </h2>
          <p className="text-[#949493] text-sm mb-12" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Gérez votre compte et vos préférences
          </p>

          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[#111] rounded-2xl border border-white/5">
            <span className="material-symbols-outlined text-[#444748] text-5xl">settings</span>
            <p className="text-white font-semibold text-lg" style={{ fontFamily: "Inter, sans-serif" }}>
              Bientôt disponible
            </p>
            <p className="text-[#949493] text-sm text-center max-w-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Les paramètres de compte arrivent prochainement. Contactez votre gestionnaire pour toute modification.
            </p>
          </div>
        </main>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-4 pb-4 bg-neutral-950/80 backdrop-blur-xl rounded-t-2xl z-50">
          {CLIENT_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-center transition-all ${item.href === "/client/settings" ? "text-white scale-110" : "text-zinc-600 hover:text-zinc-300"}`}
            >
              <span className="material-symbols-outlined" style={item.href === "/client/settings" ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {item.icon}
              </span>
            </Link>
          ))}
        </nav>

      </div>
    </div>
  );
}
