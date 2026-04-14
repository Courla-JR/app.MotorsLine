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
  distance_km?: string | null;
  clients: { company_name: string } | null;
};

const CONVOYEUR_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/missions" },
  { icon: "add_circle", label: "Nouvelle mission", href: "/missions/new?from=convoyeur" },
  { icon: "receipt_long", label: "Facturation", href: "/billing" },
  { icon: "person", label: "Profil", href: "/profile" },
];

function formatPickup(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function isFuture(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) > new Date();
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: DbMission["status"] }) {
  const map: Record<DbMission["status"], { label: string; className: string }> = {
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

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ full_name: string | null; role: string | null } | null>(null);
  const [statsTotal, setStatsTotal] = useState(0);
  const [statsEnCours, setStatsEnCours] = useState(0);
  const [statsTerminees, setStatsTerminees] = useState(0);
  const [totalKm, setTotalKm] = useState(0);
  const [activeMissions, setActiveMissions] = useState<DbMission[]>([]);
  const [upcomingMissions, setUpcomingMissions] = useState<DbMission[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      let { data: allMissions } = await supabase
        .from("missions")
        .select("id, vehicle_brand, vehicle_model, vehicle_plate, vehicle_image_url, status, pickup_address, delivery_address, pickup_date, delivery_date, distance_km, clients(company_name)")
        .order("pickup_date", { ascending: true }) as { data: DbMission[] | null };

      if (!allMissions) {
        const fallback = await supabase
          .from("missions")
          .select("id, vehicle_brand, vehicle_model, vehicle_plate, status, pickup_address, delivery_address, pickup_date, delivery_date, distance_km, clients(company_name)")
          .order("pickup_date", { ascending: true });
        allMissions = fallback.data as any;
      }

      const list = (allMissions as unknown as DbMission[]) ?? [];
      const now = new Date();

      // Missions ce mois
      const thisMonth = list.filter((m) => {
        if (!m.pickup_date) return false;
        const d = new Date(m.pickup_date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      setStatsTotal(thisMonth.length);
      setStatsEnCours(list.filter((m) => m.status === "en_cours" || m.status === "prise_en_charge").length);

      const doneThisMonth = thisMonth.filter((m) => m.status === "terminee");
      setStatsTerminees(doneThisMonth.length);
      const km = doneThisMonth.reduce((acc, m) => {
        const parsed = parseFloat(m.distance_km ?? "");
        return isNaN(parsed) ? acc : acc + parsed;
      }, 0);
      setTotalKm(Math.round(km));

      setActiveMissions(list.filter((m) => m.status === "en_cours" || m.status === "prise_en_charge"));
      setUpcomingMissions(
        list.filter((m) => m.status === "a_faire" && isFuture(m.pickup_date)).slice(0, 4)
      );

      setLoading(false);
    }
    fetchData();
  }, [router]);

  const displayName = profile?.full_name?.split(" ")[0] ?? "Convoyeur";

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "user-role=; path=/; Max-Age=0";
    router.push("/login");
  }

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
                item.href === "/dashboard" ? "bg-white/10 text-white" : "text-[#949493] hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={item.href === "/dashboard" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{item.label}</span>
            </Link>
          ))}
        </nav>
        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#949493] hover:text-white hover:bg-white/5 transition-colors mt-1"
          >
            <span className="material-symbols-outlined text-xl">swap_horiz</span>
            <span className="font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Espace admin</span>
          </Link>
        )}
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
              {profile?.role === "admin" && (
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

        <main className="max-w-md md:max-w-5xl mx-auto px-6 pt-6 md:pt-8">

          {/* Welcome */}
          <section className="mb-10 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                Bonjour, {loading ? "..." : displayName}
              </h2>
              <p className="text-[#949493] text-sm font-medium capitalize" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {today}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/profile" className="w-10 h-10 rounded-full border border-white/10 bg-[#1A1A1A] flex items-center justify-center hover:bg-[#2a2a2a] transition-colors">
                <span className="material-symbols-outlined text-[#c4c7c8] text-lg">person</span>
              </Link>
            </div>
          </section>

          {/* Stats */}
          <section className="mb-12">
            <div className="flex gap-4 overflow-x-auto -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-visible md:mx-0 md:px-0 md:grid md:grid-cols-2">
              {[
                { label: "Missions ce mois", value: loading ? "—" : String(statsTotal) },
                { label: "En cours", value: loading ? "—" : String(statsEnCours) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-[160px] md:min-w-0 bg-[#1A1A1A] p-6 rounded-2xl flex flex-col justify-between h-32 border border-white/[0.03] shrink-0 md:shrink"
                >
                  <span className="text-[#949493] text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {stat.label}
                  </span>
                  <span className="text-4xl font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Missions en cours */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold tracking-tight text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                Missions en cours
              </h3>
              <span className="text-xs text-white/40 uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
                En direct
              </span>
            </div>

            {!loading && activeMissions.length === 0 && (
              <div className="bg-[#1c1b1b] rounded-2xl border border-white/[0.05] p-6">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#949493] mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Récap du mois
                </p>
                <div className="flex gap-3 mb-5">
                  <div className="flex-1 bg-[#141414] rounded-xl p-4">
                    <p className="text-[#949493] text-xs mb-1.5" style={{ fontFamily: "Montserrat, sans-serif" }}>Terminées</p>
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>{statsTerminees}</p>
                  </div>
                  <div className="flex-1 bg-[#141414] rounded-xl p-4">
                    <p className="text-[#949493] text-xs mb-1.5" style={{ fontFamily: "Montserrat, sans-serif" }}>Km parcourus</p>
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>{totalKm > 0 ? `${totalKm} km` : "—"}</p>
                  </div>
                </div>
                {upcomingMissions.length > 0 && (
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-[#949493] mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Prochaine mission
                    </p>
                    <Link href={`/missions/${upcomingMissions[0].id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="w-8 h-8 rounded-lg bg-[#2a2a2a] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white/60 text-sm">directions_car</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-semibold truncate" style={{ fontFamily: "Inter, sans-serif" }}>
                          {upcomingMissions[0].vehicle_brand} {upcomingMissions[0].vehicle_model}
                        </p>
                        <p className="text-[#949493] text-xs truncate capitalize" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {formatPickup(upcomingMissions[0].pickup_date)} · {upcomingMissions[0].delivery_address}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-zinc-600 shrink-0">chevron_right</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {activeMissions.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#1c1b1b] rounded-2xl overflow-hidden relative group"
                >
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
                    {(!m.vehicle_image_url || m.vehicle_image_url.trim() === "") && (
                      <div className="absolute top-0 right-0 p-4">
                        <StatusBadge status={m.status} />
                      </div>
                    )}
                    <div className={`flex items-start justify-between gap-2 mb-4 ${(!m.vehicle_image_url || m.vehicle_image_url.trim() === "") ? "pr-16" : ""}`}>
                      <div className="min-w-0">
                        <h4 className="text-lg font-bold tracking-tight leading-tight mb-1 text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                          {m.vehicle_brand} {m.vehicle_model}
                        </h4>
                        <p className="text-xs font-mono uppercase tracking-widest text-[#c4c7c8]">
                          {m.vehicle_plate}
                        </p>
                        {m.clients?.company_name && (
                          <p className="text-xs mt-1.5 flex items-center gap-1 text-[#949493]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>business</span>
                            {m.clients.company_name}
                          </p>
                        )}
                      </div>
                      {m.vehicle_image_url && m.vehicle_image_url.trim() !== "" && <StatusBadge status={m.status} />}
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full shrink-0 bg-white" />
                        <p className="text-sm font-medium truncate text-[#e5e2e1]" style={{ fontFamily: "Montserrat, sans-serif" }}>
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
                        <div className="w-2 h-2 rounded-full shrink-0 bg-[#8e9192]" />
                        <p className="text-sm font-medium truncate text-[#e5e2e1]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {m.delivery_address}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-end">
                      <Link
                        href={`/missions/${m.id}`}
                        className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity text-white"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        Détails
                        <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Prochaines missions */}
          {upcomingMissions.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold tracking-tight text-white mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
                Prochaines missions
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingMissions.map((m) => (
                  <Link
                    key={m.id}
                    href={`/missions/${m.id}`}
                    className="bg-[#0e0e0e] p-5 rounded-2xl flex items-center justify-between border border-white/[0.02] hover:bg-[#201f1f] transition-colors group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-[#2a2a2a] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white/60">directions_car</span>
                      </div>
                      <div>
                        <p className="font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                          {m.vehicle_brand} {m.vehicle_model}
                        </p>
                        <p className="text-[11px] text-[#949493] uppercase tracking-tighter capitalize" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {formatPickup(m.pickup_date) ?? "—"}
                        </p>
                        {m.clients?.company_name && (
                          <p className="text-[11px] text-[#666] mt-0.5 flex items-center gap-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "11px" }}>business</span>
                            {m.clients.company_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-zinc-600 group-hover:text-white transition-colors">
                      chevron_right
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl fixed bottom-0 w-full z-50 rounded-t-2xl border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.05)]">
          <div className="flex justify-around items-center h-16 px-4 max-w-md mx-auto">
            {CONVOYEUR_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center transition-colors ${item.href === "/dashboard" ? "text-white" : "text-[#949493] hover:text-white"}`}
              >
                <span
                  className="material-symbols-outlined"
                  style={item.href === "/dashboard" ? { fontVariationSettings: "'FILL' 1" } : undefined}
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
