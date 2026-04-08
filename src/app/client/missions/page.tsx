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
  delivery_date: string | null;
};

type Filter = "toutes" | "en_cours" | "a_faire" | "terminee";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "Toutes", value: "toutes" },
  { label: "En cours", value: "en_cours" },
  { label: "Planifiées", value: "a_faire" },
  { label: "Terminées", value: "terminee" },
];

const CLIENT_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/client/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/client/missions" },
  { icon: "receipt_long", label: "Facturation", href: "/client/billing" },
  { icon: "settings", label: "Paramètres", href: "/client/settings" },
];

function StatusBadge({ status }: { status: DbMission["status"] }) {
  if (status === "en_cours")
    return <span className="px-3 py-1 rounded-full bg-white text-[#0A0A0A] text-[10px] font-bold uppercase tracking-wider">En cours</span>;
  if (status === "a_faire")
    return <span className="px-3 py-1 rounded-full bg-[#353534] text-[#c4c7c8] text-[10px] font-bold uppercase tracking-wider">Planifiée</span>;
  if (status === "terminee")
    return <span className="px-3 py-1 rounded-full bg-[#353534] text-[#66ff8e] text-[10px] font-bold uppercase tracking-wider">Terminée</span>;
  return <span className="px-3 py-1 rounded-full bg-[#ffb4ab]/10 text-[#ffb4ab] text-[10px] font-bold uppercase tracking-wider">Annulée</span>;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function ClientMissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<DbMission[]>([]);

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "user-role=; path=/; Max-Age=0";
    router.push("/client/login");
  }
  const [filter, setFilter] = useState<Filter>("toutes");
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getClient() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/client/login"); return; }

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("email", user.email!)
        .single();

      setClientId(client?.id ?? null);
    }
    getClient();
  }, [router]);

  useEffect(() => {
    if (clientId === null) return;

    async function fetchMissions() {
      setLoading(true);
      let query = supabase
        .from("missions")
        .select("id, vehicle_brand, vehicle_model, vehicle_plate, status, pickup_address, delivery_address, pickup_date, delivery_date")
        .eq("client_id", clientId!)
        .order("pickup_date", { ascending: false });

      if (filter !== "toutes") {
        query = query.eq("status", filter);
      }

      const { data } = await query;
      setMissions((data as DbMission[]) ?? []);
      setLoading(false);
    }
    fetchMissions();
  }, [clientId, filter]);

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
                item.href === "/client/missions" ? "bg-white/10 text-white" : "text-[#949493] hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={item.href === "/client/missions" ? { fontVariationSettings: "'FILL' 1" } : undefined}
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
      <div className="md:ml-60 pb-32 md:pb-10">

        {/* TopAppBar (mobile only) */}
        <header className="md:hidden fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex justify-between items-center px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/client/dashboard">
              <span className="material-symbols-outlined text-white cursor-pointer active:opacity-70 active:scale-95 duration-150">
                arrow_back
              </span>
            </Link>
            <h1
              className="text-xl font-bold tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Motors Line
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full border border-white/10 bg-[#1A1A1A] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#c4c7c8] text-lg">person</span>
          </div>
        </header>

        <main className="pt-24 md:pt-8 pb-8 px-4 md:px-6 max-w-lg md:max-w-5xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-4xl font-semibold text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                Missions
              </h2>
              <p className="text-[#c4c7c8] text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Gérez vos transports de véhicules
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-6">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  filter === f.value
                    ? "bg-white text-[#0A0A0A]"
                    : "bg-[#1c1b1b] border border-[#444748]/20 text-[#c4c7c8] hover:bg-[#2a2a2a]"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {f.label}
              </button>
            ))}
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
            </div>
          )}

          {/* Mission grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {missions.map((m) => (
              <div
                key={m.id}
                className={`relative bg-[#1c1b1b] rounded-2xl p-6 flex flex-col gap-4 ${
                  m.status === "terminee" || m.status === "annulee" ? "opacity-70" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                      {m.vehicle_brand} {m.vehicle_model}
                    </h3>
                    <p className="text-xs font-mono uppercase tracking-widest text-[#c4c7c8] mt-1">
                      {m.vehicle_plate}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-white shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-[#c4c7c8] uppercase tracking-widest font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        Départ
                      </p>
                      <p className="text-sm text-white font-medium truncate" style={{ fontFamily: "Inter, sans-serif" }}>
                        {m.pickup_address}
                      </p>
                    </div>
                    {m.pickup_date && (
                      <span className="text-[#c4c7c8] text-xs font-mono ml-auto shrink-0">{formatDate(m.pickup_date)}</span>
                    )}
                  </div>
                  <div className="ml-[3px] h-4 w-0.5 bg-[#353534] rounded-full" />
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#8e9192] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-[#c4c7c8] uppercase tracking-widest font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        Arrivée
                      </p>
                      <p className="text-sm text-white font-medium truncate" style={{ fontFamily: "Inter, sans-serif" }}>
                        {m.delivery_address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-4 border-t border-white/5 flex items-center justify-between">
                  {m.status === "terminee" && m.delivery_date ? (
                    <span className="text-[10px] font-mono text-[#c4c7c8]/50 uppercase">
                      Livré le {formatDate(m.delivery_date)}
                    </span>
                  ) : (
                    <div />
                  )}
                  <button
                    className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
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
        <nav className="md:hidden fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-4 pb-4 bg-neutral-950/80 backdrop-blur-xl rounded-t-2xl z-50 shadow-[0_-4px_24px_rgba(255,255,255,0.02)]">
          {CLIENT_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-all ${item.href === "/client/missions" ? "text-white scale-110" : "text-zinc-600 hover:text-zinc-300"}`}
            >
              <span className="material-symbols-outlined mb-1" style={item.href === "/client/missions" ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {item.icon}
              </span>
              <span className="font-medium text-[10px] uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

      </div>
    </div>
  );
}
