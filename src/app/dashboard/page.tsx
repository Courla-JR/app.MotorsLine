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
  status: "a_faire" | "en_cours" | "terminee" | "annulee";
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
};

const CONVOYEUR_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/missions" },
  { icon: "add_circle", label: "Nouvelle mission", href: "/missions/new" },
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

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ full_name: string | null; role: string | null } | null>(null);
  const [statsTotal, setStatsTotal] = useState(0);
  const [statsEnCours, setStatsEnCours] = useState(0);
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

      const { data: allMissions } = await supabase
        .from("missions")
        .select("id, vehicle_brand, vehicle_model, vehicle_plate, status, pickup_address, delivery_address, pickup_date")
        .order("pickup_date", { ascending: true });

      const list = (allMissions as DbMission[]) ?? [];
      const now = new Date();

      // Missions ce mois
      const thisMonth = list.filter((m) => {
        if (!m.pickup_date) return false;
        const d = new Date(m.pickup_date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      setStatsTotal(thisMonth.length);
      setStatsEnCours(list.filter((m) => m.status === "en_cours").length);

      setActiveMissions(list.filter((m) => m.status === "en_cours"));
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
          <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text" style={{ fontFamily: "Inter, sans-serif" }}>
            Motors Line
          </h1>
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
        <header className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl fixed top-0 w-full z-50">
          <div className="flex items-center justify-between px-6 h-16 w-full max-w-md mx-auto">
            <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#949493] via-[#E0E0E0] to-[#949493] pr-1" style={{ fontFamily: "Inter, sans-serif" }}>
              Motors Line
            </span>
            <Link href="/profile" className="w-8 h-8 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] flex items-center justify-center hover:bg-[#2a2a2a] transition-colors">
              <span className="material-symbols-outlined text-[#c4c7c8] text-sm">person</span>
            </Link>
          </div>
        </header>

        <main className="max-w-md md:max-w-5xl mx-auto px-6 pt-24 md:pt-8">

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
              <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Aucune mission en cours.
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {activeMissions.map((m) => (
                <Link key={m.id} href={`/missions/${m.id}`} className="bg-[#1c1b1b] rounded-3xl p-6 border border-white/[0.05] hover:bg-[#242323] transition-colors block">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                        {m.vehicle_brand} {m.vehicle_model}
                      </h4>
                      <p className="text-[#949493] text-xs tracking-widest mt-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        {m.vehicle_plate}
                      </p>
                    </div>
                    <span className="bg-[#66ff8e] text-[#002109] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      En cours
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-white" />
                      <div className="w-0.5 h-6 bg-[#353534] rounded-full" />
                      <div className="w-2 h-2 border border-[#949493] rounded-full" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[#E0E0E0] text-sm truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        {m.pickup_address}
                      </span>
                      <span className="text-[#E0E0E0] text-sm truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        {m.delivery_address}
                      </span>
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-center gap-2 border border-[#2A2A2A] text-white px-6 py-2.5 rounded-full text-sm font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
                    Voir les détails
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </Link>
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
          <div className="flex justify-around items-center pt-3 pb-6 px-4 max-w-md mx-auto">
            <Link href="/dashboard" className="flex items-center justify-center text-white scale-110 transition-transform">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            </Link>
            <Link href="/missions" className="flex items-center justify-center text-[#949493] hover:text-white transition-colors">
              <span className="material-symbols-outlined">local_shipping</span>
            </Link>
            <Link href="/missions/new" className="flex items-center justify-center text-[#949493] hover:text-white transition-colors relative -top-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 duration-200 ease-out">
                <span className="material-symbols-outlined text-[#0A0A0A] text-3xl">add</span>
              </div>
            </Link>
            <Link href="/profile" className="flex items-center justify-center text-[#949493] hover:text-white transition-colors">
              <span className="material-symbols-outlined">person</span>
            </Link>
          </div>
        </nav>

      </div>
    </div>
  );
}
