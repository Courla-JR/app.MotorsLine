"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type DbMission = {
  id: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_plate: string;
  status: "a_faire" | "en_cours" | "terminee" | "annulee";
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  delivery_date: string | null;
};

type Filter = "toutes" | "a_faire" | "en_cours" | "terminee";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "Toutes", value: "toutes" },
  { label: "À faire", value: "a_faire" },
  { label: "En cours", value: "en_cours" },
  { label: "Terminées", value: "terminee" },
];

const CONVOYEUR_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/missions" },
  { icon: "add_circle", label: "Nouvelle mission", href: "/missions/new" },
  { icon: "person", label: "Profil", href: "/profile" },
];

function StatusBadge({ status }: { status: DbMission["status"] }) {
  const map = {
    en_cours: { label: "En cours", className: "bg-[#66ff8e] text-[#002109]" },
    a_faire: { label: "À faire", className: "bg-[#2a2a2a] text-[#c4c7c8]" },
    terminee: { label: "Terminée", className: "bg-[#2a2a2a]/40 text-[#c4c7c8]/50" },
    annulee: { label: "Annulée", className: "bg-[#ffb4ab]/10 text-[#ffb4ab]" },
  };
  const { label, className } = map[status] ?? map.a_faire;
  return (
    <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${className}`}>
      {label}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<DbMission[]>([]);
  const [filter, setFilter] = useState<Filter>("toutes");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMissions() {
      setLoading(true);
      let query = supabase
        .from("missions")
        .select("id, vehicle_brand, vehicle_model, vehicle_plate, status, pickup_address, delivery_address, pickup_date, delivery_date")
        .order("created_at", { ascending: false });

      if (filter !== "toutes") {
        query = query.eq("status", filter);
      }

      const { data } = await query;
      setMissions((data as DbMission[]) ?? []);
      setLoading(false);
    }
    fetchMissions();
  }, [filter]);

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen antialiased">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#0A0A0A] border-r border-[#2A2A2A] z-50 py-8 px-4">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text" style={{ fontFamily: "Inter, sans-serif" }}>
            Motors Line
          </h1>
          <p className="text-[10px] text-[#949493] uppercase tracking-widest mt-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Espace Convoyeur
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          {CONVOYEUR_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                item.href === "/missions" ? "bg-white/10 text-white" : "text-[#949493] hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={item.href === "/missions" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <div className="md:ml-60 pb-32 md:pb-10">

        {/* TopAppBar (mobile only) */}
        <header className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 h-16 w-full max-w-md mx-auto">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <span className="material-symbols-outlined text-white cursor-pointer active:opacity-70 active:scale-95 duration-150">
                  arrow_back
                </span>
              </Link>
              <h1 className="text-xl font-bold tracking-tighter text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                Motors Line
              </h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#c4c7c8]">search</span>
            </div>
          </div>
        </header>

        <main className="max-w-md md:max-w-5xl mx-auto px-6 mt-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[26px] font-bold text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                Missions
              </h2>
              {/* Desktop search */}
              <div className="hidden md:flex w-10 h-10 rounded-full bg-[#2a2a2a] items-center justify-center">
                <span className="material-symbols-outlined text-[#c4c7c8]">search</span>
              </div>
            </div>
            {/* Filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-5 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                    filter === f.value
                      ? "bg-white text-[#0A0A0A] font-bold"
                      : "bg-[#2a2a2a] text-[#c4c7c8] font-medium hover:bg-[#3a3939]"
                  }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <span className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Chargement...
              </span>
            </div>
          )}

          {/* Empty state */}
          {!loading && missions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <span className="material-symbols-outlined text-[#444748] text-5xl">local_shipping</span>
              <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Aucune mission trouvée
              </p>
              <Link
                href="/missions/new"
                className="px-6 py-3 bg-white text-[#0A0A0A] rounded-full text-sm font-bold"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Créer une mission
              </Link>
            </div>
          )}

          {/* Mission grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {missions.map((m) => (
              <div
                key={m.id}
                className={`bg-[#1c1b1b] rounded-2xl p-5 relative overflow-hidden group ${
                  m.status === "terminee" || m.status === "annulee" ? "opacity-60" : ""
                }`}
              >
                <div className="absolute top-0 right-0 p-4">
                  <StatusBadge status={m.status} />
                </div>
                <div className="mb-4 z-10">
                  <h3
                    className={`text-lg font-bold tracking-tight leading-tight mb-1 ${m.status === "terminee" ? "text-white/50" : "text-white"}`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {m.vehicle_brand} {m.vehicle_model}
                  </h3>
                  <p className={`text-xs font-mono uppercase tracking-widest ${m.status === "terminee" ? "text-[#c4c7c8]/50" : "text-[#c4c7c8]"}`}>
                    {m.vehicle_plate}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${m.status === "terminee" ? "bg-white/50" : "bg-white"}`} />
                    <p className={`text-sm font-medium truncate ${m.status === "terminee" ? "text-[#e5e2e1]/50" : "text-[#e5e2e1]"}`} style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {m.pickup_address}
                    </p>
                    {m.pickup_date && (
                      <span className="text-[#c4c7c8] text-xs font-mono ml-auto shrink-0">{formatDate(m.pickup_date)}</span>
                    )}
                  </div>
                  <div className="ml-1 h-8 relative">
                    <div className="absolute left-[3px] top-0 bottom-0 w-1 bg-[#353534] rounded-full" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${m.status === "terminee" ? "bg-[#8e9192]/50" : "bg-[#8e9192]"}`} />
                    <p className={`text-sm font-medium truncate ${m.status === "terminee" ? "text-[#e5e2e1]/50" : "text-[#e5e2e1]"}`} style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {m.delivery_address}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  {m.status === "terminee" ? (
                    <span className="text-[10px] font-mono text-[#c4c7c8]/40">
                      LIVRÉ {m.delivery_date ? formatDate(m.delivery_date) : ""}
                    </span>
                  ) : (
                    <div />
                  )}
                  <button
                    className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${m.status === "terminee" ? "text-white/40" : "text-white"}`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {m.status === "terminee" ? "Archives" : "Détails"}
                    <span className="material-symbols-outlined text-sm">
                      {m.status === "terminee" ? "history" : "arrow_forward_ios"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl fixed bottom-0 w-full z-50 rounded-t-2xl border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.05)]">
          <div className="flex justify-around items-center pt-3 pb-6 px-4">
            {[
              { icon: "dashboard", label: "Dashboard", href: "/dashboard", active: false },
              { icon: "local_shipping", label: "Missions", href: "/missions", active: true },
              { icon: "add_circle", label: "Nouveau", href: "/missions/new", active: false },
              { icon: "person", label: "Profil", href: "#", active: false },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center transition-colors ${item.active ? "text-white scale-110" : "text-[#949493] hover:text-white"}`}
              >
                <span className="material-symbols-outlined mb-1" style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.icon}
                </span>
                <span className="font-medium text-[10px] uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </nav>

      </div>
    </div>
  );
}
