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
};

type Stats = {
  total: number;
  en_cours: number;
  a_faire: number;
};

function StatusBadge({ status }: { status: DbMission["status"] }) {
  if (status === "en_cours")
    return <span className="bg-white text-[#0A0A0A] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">En cours</span>;
  if (status === "a_faire")
    return <span className="bg-[#1A1A1A] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border border-white/10">À faire</span>;
  return <span className="bg-[#1A1A1A] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border border-white/10">Terminée</span>;
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function isToday(iso: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function isFuture(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) > new Date();
}

function MissionCard({ mission }: { mission: DbMission }) {
  const time = formatTime(mission.pickup_date);
  const icon = mission.status === "a_faire" && !isToday(mission.pickup_date) ? "event" : "schedule";

  return (
    <div className="bg-[#1c1b1b] rounded-xl p-5 border border-white/5 h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-white font-bold text-lg mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
            {mission.vehicle_brand} {mission.vehicle_model}
          </h4>
          <span className="text-[#949493] text-xs tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {mission.vehicle_plate}
          </span>
        </div>
        <StatusBadge status={mission.status} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex flex-col items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-white" />
          <div className="w-0.5 h-6 bg-[#353534] rounded-full" />
          <div className="w-2 h-2 border border-[#949493] rounded-full" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[#E0E0E0] text-sm truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {mission.pickup_address}
          </span>
          <span className="text-[#E0E0E0] text-sm truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {mission.delivery_address}
          </span>
        </div>
      </div>

      <div className="flex items-center pt-4 border-t border-white/5">
        <span className="material-symbols-outlined text-[#949493] text-sm">{icon}</span>
        <span className="text-[#949493] text-xs ml-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {time ?? "—"}
        </span>
      </div>
    </div>
  );
}

const CONVOYEUR_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/missions" },
  { icon: "add_circle", label: "Nouvelle mission", href: "/missions/new" },
  { icon: "person", label: "Profil", href: "/profile" },
];

export default function DashboardPage() {
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, en_cours: 0, a_faire: 0 });
  const [todayMissions, setTodayMissions] = useState<DbMission[]>([]);
  const [upcomingMissions, setUpcomingMissions] = useState<DbMission[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      const { data: allMissions } = await supabase
        .from("missions")
        .select("id, vehicle_brand, vehicle_model, vehicle_plate, status, pickup_address, delivery_address, pickup_date")
        .order("pickup_date", { ascending: true });

      const list = (allMissions as DbMission[]) ?? [];

      setStats({
        total: list.length,
        en_cours: list.filter((m) => m.status === "en_cours").length,
        a_faire: list.filter((m) => m.status === "a_faire").length,
      });

      setTodayMissions(
        list.filter(
          (m) => m.status === "en_cours" || (m.status === "a_faire" && isToday(m.pickup_date))
        )
      );

      setUpcomingMissions(
        list.filter(
          (m) => m.status === "a_faire" && !isToday(m.pickup_date) && isFuture(m.pickup_date)
        ).slice(0, 4)
      );

      setLoading(false);
    }
    fetchData();
  }, []);

  const displayName = profile?.full_name?.split(" ")[0] ?? "Convoyeur";

  return (
    <div className="bg-[#0A0A0A] min-h-screen">

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
      </aside>

      {/* ── Main Content ── */}
      <div className="md:ml-60 pb-24 md:pb-10">

        {/* TopAppBar (mobile only) */}
        <header className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-40 border-b border-transparent">
          <div className="flex items-center justify-between px-6 h-16 w-full max-w-md mx-auto">
            <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#949493] via-[#E0E0E0] to-[#949493]" style={{ fontFamily: "Inter, sans-serif" }}>
              Motors Line
            </span>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-white cursor-pointer">notifications</span>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#2A2A2A] bg-[#1A1A1A] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#c4c7c8] text-lg">person</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-md md:max-w-5xl mx-auto px-6 pt-6">

          {/* Greeting */}
          <section className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-[26px] font-semibold text-white leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                Bonjour, {loading ? "..." : displayName}
              </h2>
              <p className="text-[#949493] text-sm mt-1 capitalize" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {today}
              </p>
            </div>
            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-3">
              <span className="material-symbols-outlined text-white cursor-pointer">notifications</span>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#2A2A2A] bg-[#1A1A1A] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#c4c7c8] text-lg">person</span>
              </div>
            </div>
          </section>

          {/* Stats cards */}
          <section className="mb-10">
            <div className="flex gap-4 overflow-x-auto -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-visible md:mx-0 md:px-0 md:grid md:grid-cols-3">
              {[
                { label: "Total missions", value: loading ? "—" : String(stats.total) },
                { label: "En cours", value: loading ? "—" : String(stats.en_cours) },
                { label: "À faire", value: loading ? "—" : String(stats.a_faire) },
              ].map((stat) => (
                <div key={stat.label} className="min-w-[160px] md:min-w-0 bg-[#1A1A1A] p-5 rounded-lg flex flex-col justify-between h-32 border border-white/5 shrink-0 md:shrink">
                  <span className="text-[#949493] text-xs uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {stat.label}
                  </span>
                  <span className="text-white text-3xl font-bold" style={{ fontFamily: "Inter, sans-serif" }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Aujourd'hui */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                Aujourd&apos;hui
              </h3>
              <span className="text-xs text-[#949493]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {loading ? "..." : `${todayMissions.length} mission${todayMissions.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            {!loading && todayMissions.length === 0 && (
              <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Aucune mission pour aujourd&apos;hui.
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {todayMissions.map((m) => (
                <MissionCard key={m.id} mission={m} />
              ))}
            </div>
          </section>

          {/* À venir */}
          {upcomingMissions.length > 0 && (
            <section className="mb-12">
              <h3 className="text-[20px] font-bold text-white mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
                À venir
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingMissions.map((m) => (
                  <MissionCard key={m.id} mission={m} />
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl fixed bottom-0 w-full z-50 rounded-t-2xl border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.05)]">
          <div className="flex justify-around items-center pt-3 pb-6 px-4 max-w-md mx-auto">
            <Link href="/dashboard" className="flex flex-col items-center text-white scale-110 transition-transform">
              <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
              <span className="font-medium text-[10px] uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>Dashboard</span>
            </Link>
            <Link href="/missions" className="flex flex-col items-center text-[#949493] hover:text-white transition-colors">
              <span className="material-symbols-outlined mb-1">local_shipping</span>
              <span className="font-medium text-[10px] uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>Missions</span>
            </Link>
            <Link href="/missions/new" className="flex flex-col items-center text-[#949493] hover:text-white transition-colors relative -top-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 duration-200 ease-out">
                <span className="material-symbols-outlined text-[#0A0A0A] text-3xl">add</span>
              </div>
              <span className="font-medium text-[10px] uppercase tracking-widest mt-5" style={{ fontFamily: "Inter, sans-serif" }}>Nouveau</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center text-[#949493] hover:text-white transition-colors">
              <span className="material-symbols-outlined mb-1">person</span>
              <span className="font-medium text-[10px] uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>Profil</span>
            </Link>
          </div>
        </nav>

      </div>
    </div>
  );
}
