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

function isFuture(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) > new Date();
}

function formatPickup(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [activeMissions, setActiveMissions] = useState<DbMission[]>([]);
  const [upcomingMissions, setUpcomingMissions] = useState<DbMission[]>([]);
  const [statsTotal, setStatsTotal] = useState(0);
  const [statsEnCours, setStatsEnCours] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/client/login"); return; }

      // Get client record by email
      const { data: client } = await supabase
        .from("clients")
        .select("id, company_name")
        .eq("email", user.email!)
        .single();

      if (!client) { setLoading(false); return; }
      setCompanyName(client.company_name);

      // Fetch all missions for this client
      const { data: missions } = await supabase
        .from("missions")
        .select("id, vehicle_brand, vehicle_model, vehicle_plate, status, pickup_address, delivery_address, pickup_date")
        .eq("client_id", client.id)
        .order("pickup_date", { ascending: true });

      const list = (missions as DbMission[]) ?? [];

      // This month stats
      const now = new Date();
      const thisMonth = list.filter((m) => {
        if (!m.pickup_date) return false;
        const d = new Date(m.pickup_date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      setStatsTotal(thisMonth.length);
      setStatsEnCours(list.filter((m) => m.status === "en_cours").length);

      setActiveMissions(list.filter((m) => m.status === "en_cours"));
      setUpcomingMissions(
        list.filter((m) => m.status === "a_faire" && isFuture(m.pickup_date)).slice(0, 3)
      );

      setLoading(false);
    }
    fetchData();
  }, [router]);

  const displayName = companyName ?? "—";

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen pb-24 antialiased">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-neutral-950/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <h1
          className="text-xl font-bold tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Motors Line
        </h1>
        <div className="w-10 h-10 rounded-full border border-white/10 bg-[#1A1A1A] flex items-center justify-center">
          <span className="material-symbols-outlined text-[#c4c7c8] text-lg">person</span>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-lg mx-auto">
        {/* Welcome */}
        <section className="mb-10">
          <h2
            className="text-3xl font-semibold tracking-tight text-white mb-1"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Bonjour, {loading ? "..." : displayName}
          </h2>
          <p className="text-[#949493] text-sm font-medium capitalize" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {today}
          </p>
        </section>

        {/* Stats */}
        <section className="flex gap-4 mb-12 overflow-x-auto -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { label: "Missions ce mois", value: loading ? "—" : String(statsTotal) },
            { label: "En cours", value: loading ? "—" : String(statsEnCours) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="min-w-[160px] bg-[#1A1A1A] p-6 rounded-2xl flex flex-col justify-between h-32 border border-white/[0.03] shrink-0"
            >
              <span
                className="text-[#949493] text-xs uppercase tracking-widest font-semibold"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {stat.label}
              </span>
              <span
                className="text-4xl font-bold text-white"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </section>

        {/* Active Missions */}
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

          {activeMissions.map((m) => (
            <div key={m.id} className="bg-[#1c1b1b] rounded-3xl p-6 border border-white/[0.05] mb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                    {m.vehicle_brand} {m.vehicle_model}
                  </h4>
                  <p className="text-[#949493] text-xs tracking-widest mt-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {m.vehicle_plate}
                  </p>
                </div>
                <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
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
                  <span className="text-[#E0E0E0] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {m.pickup_address}
                  </span>
                  <span className="text-[#E0E0E0] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {m.delivery_address}
                  </span>
                </div>
              </div>

              <Link
                href="/missions/tracking"
                className="w-full flex items-center justify-center gap-2 border border-[#2A2A2A] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/5 transition-all active:scale-95"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Suivre en direct
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          ))}
        </section>

        {/* Upcoming */}
        {upcomingMissions.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold tracking-tight text-white mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
              Prochaines missions
            </h3>
            <div className="space-y-4">
              {upcomingMissions.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#0e0e0e] p-5 rounded-2xl flex items-center justify-between border border-white/[0.02] hover:bg-[#201f1f] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-[#2a2a2a] flex items-center justify-center">
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
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-4 pb-4 bg-neutral-950/80 backdrop-blur-xl rounded-t-2xl z-50 shadow-[0_-4px_24px_rgba(255,255,255,0.02)]">
        {[
          { icon: "dashboard", label: "Dashboard", href: "/client/dashboard", active: true },
          { icon: "local_shipping", label: "Missions", href: "/client/missions", active: false },
          { icon: "receipt_long", label: "Facturation", href: "#", active: false },
          { icon: "settings", label: "Paramètres", href: "#", active: false },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center transition-all ${item.active ? "text-white scale-110" : "text-zinc-600 hover:text-zinc-300"}`}
          >
            <span
              className="material-symbols-outlined"
              style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="font-medium text-[10px] uppercase tracking-widest mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
