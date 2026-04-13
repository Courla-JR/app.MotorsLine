"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DbMission = {
  id: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_image_url?: string | null;
  status: "a_faire" | "prise_en_charge" | "en_cours" | "terminee" | "annulee";
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  delivery_date: string | null;
  clients: { company_name: string } | null;
};

type Filter = "toutes" | "a_faire" | "prise_en_charge" | "en_cours" | "terminee";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "Toutes", value: "toutes" },
  { label: "À faire", value: "a_faire" },
  { label: "Prise en charge", value: "prise_en_charge" },
  { label: "En cours", value: "en_cours" },
  { label: "Terminées", value: "terminee" },
];

const CONVOYEUR_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/missions" },
  { icon: "add_circle", label: "Nouvelle mission", href: "/missions/new?from=convoyeur" },
  { icon: "receipt_long", label: "Facturation", href: "/billing" },
  { icon: "person", label: "Profil", href: "/profile" },
];

type MissionStatus = DbMission["status"];

const STATUS_LABELS: Record<MissionStatus, string> = {
  a_faire:         "À faire",
  prise_en_charge: "Prise en charge",
  en_cours:        "En cours",
  terminee:        "Terminée",
  annulee:         "Annulée",
};

function StatusBadge({ status }: { status: DbMission["status"] }) {
  const map = {
    a_faire:         { label: "À faire",          className: "bg-[#2a2a2a] text-[#c4c7c8]" },
    prise_en_charge: { label: "Prise en charge",  className: "bg-[#3b82f6]/20 text-[#93c5fd]" },
    en_cours:        { label: "En cours",         className: "bg-[#66ff8e] text-[#002109]" },
    terminee:        { label: "Terminée",         className: "bg-[#2a2a2a]/40 text-[#c4c7c8]/50" },
    annulee:         { label: "Annulée",          className: "bg-[#ffb4ab]/10 text-[#ffb4ab]" },
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
  const router = useRouter();
  const [missions, setMissions] = useState<DbMission[]>([]);
  const [filter, setFilter] = useState<Filter>("toutes");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function updateStatus(missionId: string, newStatus: MissionStatus) {
    setUpdatingId(missionId);
    const { error } = await supabase.from("missions").update({ status: newStatus }).eq("id", missionId);
    if (!error) {
      setMissions((prev) => prev.map((m) => m.id === missionId ? { ...m, status: newStatus } : m));
      try {
        await fetch("/api/missions/status-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mission_id: missionId, new_status: newStatus }),
        });
      } catch (err) {
        console.error("[status-notification] fetch error:", err);
      }
    }
    setUpdatingId(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "user-role=; path=/; Max-Age=0";
    router.push("/login");
  }

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setIsAdmin(profile?.role === "admin");
    }
    checkRole();
  }, [router]);

  useEffect(() => {
    async function fetchMissions() {
      setLoading(true);

      // Try with vehicle_image_url; fall back if the column doesn't exist yet
      const buildQuery = (cols: string) => {
        let q = supabase.from("missions").select(cols).order("created_at", { ascending: false });
        if (filter !== "toutes") q = q.eq("status", filter);
        return q;
      };

      let { data, error } = await buildQuery(
        "id, vehicle_brand, vehicle_model, vehicle_plate, vehicle_image_url, status, pickup_address, delivery_address, pickup_date, delivery_date, clients(company_name)"
      );

      if (error) {
        const fallback = await buildQuery(
          "id, vehicle_brand, vehicle_model, vehicle_plate, status, pickup_address, delivery_address, pickup_date, delivery_date, clients(company_name)"
        );
        data = fallback.data as any;
      }

      setMissions((data as unknown as DbMission[]) ?? []);
      setLoading(false);
    }
    fetchMissions();
  }, [filter]);

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen antialiased">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#0A0A0A] border-r border-[#2A2A2A] z-50 py-8 px-4">
        <div className="mb-10 px-2">
          <Link href="/dashboard" className="cursor-pointer">
            <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text overflow-visible pr-1" style={{ fontFamily: "Inter, sans-serif" }}>
              Motors Line
            </h1>
          </Link>
          <p className="text-[10px] text-[#949493] uppercase tracking-widest mt-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Espace Convoyeur
          </p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
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
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#949493] hover:text-white hover:bg-white/5 transition-colors mt-1"
          >
            <span className="material-symbols-outlined text-xl">swap_horiz</span>
            <span className="font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Espace admin</span>
          </Link>
        )}
      </aside>

      {/* ── Main Content ── */}
      <div className="md:ml-60 pb-32 md:pb-10">

        {/* TopAppBar (mobile only) */}
        <header className="md:hidden sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#1c1b1b]">
          <div className="px-4 h-16 flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              <Link href="/dashboard" className="cursor-pointer">
                <span className="text-base font-bold italic tracking-tighter silver-gradient-text overflow-visible pr-1">
                  Motors Line
                </span>
              </Link>
              <span className="text-[10px] uppercase tracking-widest text-[#444748] font-medium px-1.5 py-0.5 rounded border border-[#2a2a2a] shrink-0">
                Convoyeur
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isAdmin && (
                <Link href="/admin" className="flex items-center gap-1.5 p-2 bg-[#1c1b1b] border border-white/10 text-[#c4c7c8] rounded-full hover:text-white hover:border-white/20 transition-colors">
                  <span className="material-symbols-outlined text-base">swap_horiz</span>
                </Link>
              )}
              <Link href="/missions/new?from=convoyeur" className="flex items-center gap-1.5 p-2 bg-white text-[#0A0A0A] rounded-full font-bold hover:bg-zinc-100 transition-colors active:scale-95">
                <span className="material-symbols-outlined text-base">add</span>
              </Link>
              <button onClick={handleLogout} className="p-2 text-[#949493] hover:text-white transition-colors">
                <span className="material-symbols-outlined text-base">logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-md md:max-w-5xl mx-auto px-6 mt-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[26px] font-bold text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                  Missions
                </h2>
                <p className="text-[#949493] text-sm mt-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Gérez vos transports de véhicules
                </p>
              </div>
              {/* Desktop profile / admin switch */}
              <div className="hidden md:flex items-center gap-2">
                {isAdmin && (
                  <Link href="/admin" className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center hover:bg-[#3a3939] transition-colors">
                    <span className="material-symbols-outlined text-[#c4c7c8]">swap_horiz</span>
                  </Link>
                )}
                <Link href="/profile" className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center hover:bg-[#3a3939] transition-colors">
                  <span className="material-symbols-outlined text-[#c4c7c8]">person</span>
                </Link>
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
                className={`bg-[#1c1b1b] rounded-2xl overflow-hidden relative group ${
                  m.status === "terminee" || m.status === "annulee" ? "opacity-60" : ""
                }`}
              >
                {/* Vehicle image — only when URL is non-empty */}
                {m.vehicle_image_url && m.vehicle_image_url.trim() !== "" && (
                  <div className="h-[180px] w-full shrink-0">
                    <img
                      src={m.vehicle_image_url}
                      alt={`${m.vehicle_brand} ${m.vehicle_model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5 relative">
                  {/* Status badge — top-right of content area (or absolute on card when no image) */}
                  {(!m.vehicle_image_url || m.vehicle_image_url.trim() === "") && (
                    <div className="absolute top-0 right-0 p-4">
                      <StatusBadge status={m.status} />
                    </div>
                  )}

                  {/* Vehicle title + badge row */}
                  <div className={`flex items-start justify-between gap-2 mb-4 ${(!m.vehicle_image_url || m.vehicle_image_url.trim() === "") ? "pr-16" : ""}`}>
                    <div className="min-w-0">
                      <h3
                        className={`text-lg font-bold tracking-tight leading-tight mb-1 ${m.status === "terminee" ? "text-white/50" : "text-white"}`}
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {m.vehicle_brand} {m.vehicle_model}
                      </h3>
                      <p className={`text-xs font-mono uppercase tracking-widest ${m.status === "terminee" ? "text-[#c4c7c8]/50" : "text-[#c4c7c8]"}`}>
                        {m.vehicle_plate}
                      </p>
                      {m.clients?.company_name && (
                        <p className={`text-xs mt-1.5 flex items-center gap-1 ${m.status === "terminee" ? "text-[#949493]/50" : "text-[#949493]"}`} style={{ fontFamily: "Montserrat, sans-serif" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>business</span>
                          {m.clients.company_name}
                        </p>
                      )}
                    </div>
                    {m.vehicle_image_url && m.vehicle_image_url.trim() !== "" && <StatusBadge status={m.status} />}
                  </div>

                  {/* Route */}
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

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    {/* Status dropdown */}
                    {m.status !== "terminee" && m.status !== "annulee" ? (
                      <div className="relative shrink-0">
                        <select
                          value={m.status}
                          disabled={updatingId === m.id}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => { e.stopPropagation(); updateStatus(m.id, e.target.value as MissionStatus); }}
                          className="bg-[#131313] border border-[#2a2a2a] text-white text-xs rounded-lg px-3 py-2 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-50"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-2 text-[#949493] text-sm pointer-events-none">
                          {updatingId === m.id ? "progress_activity" : "expand_more"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-[#c4c7c8]/40">
                        {m.status === "terminee" ? `LIVRÉ ${m.delivery_date ? formatDate(m.delivery_date) : ""}` : "ANNULÉE"}
                      </span>
                    )}
                    <Link
                      href={`/missions/${m.id}`}
                      className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity shrink-0 ${m.status === "terminee" ? "text-white/40" : "text-white"}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {m.status === "terminee" ? "Archives" : "Détails"}
                      <span className="material-symbols-outlined text-sm">
                        {m.status === "terminee" ? "history" : "arrow_forward_ios"}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl fixed bottom-0 w-full z-50 rounded-t-2xl border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.05)]">
          <div className="flex justify-around items-center h-16 px-4">
            {CONVOYEUR_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center transition-colors ${item.href === "/missions" ? "text-white" : "text-[#949493] hover:text-white"}`}
              >
                <span
                  className="material-symbols-outlined"
                  style={item.href === "/missions" ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
              </Link>
            ))}
          </div>
        </nav>

      </div>
    </div>
  );
}
