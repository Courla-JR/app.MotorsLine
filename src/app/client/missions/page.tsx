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
  { icon: "add_circle", label: "Nouvelle", href: "/client/missions/new" },
  { icon: "receipt_long", label: "Facturation", href: "/client/billing" },
  { icon: "person", label: "Profil", href: "/client/profile" },
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
        .eq("user_id", user.id)
        .single();

      setClientId(client?.id ?? null);
    }
    getClient();
  }, [router]);

  useEffect(() => {
    if (clientId === null) return;

    async function fetchMissions() {
      setLoading(true);

      const buildQuery = (cols: string) => {
        let q = supabase.from("missions").select(cols).eq("client_id", clientId!).order("pickup_date", { ascending: false });
        if (filter !== "toutes") q = q.eq("status", filter);
        return q;
      };

      let { data, error } = await buildQuery(
        "id, vehicle_brand, vehicle_model, vehicle_plate, vehicle_image_url, status, pickup_address, delivery_address, pickup_date, delivery_date"
      );

      if (error) {
        const fallback = await buildQuery(
          "id, vehicle_brand, vehicle_model, vehicle_plate, status, pickup_address, delivery_address, pickup_date, delivery_date"
        );
        data = fallback.data as any;
      }

      setMissions((data as unknown as DbMission[]) ?? []);
      setLoading(false);
    }
    fetchMissions();
  }, [clientId, filter]);

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen antialiased">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#0A0A0A] border-r border-[#2A2A2A] z-50 py-8 px-4">
        <div className="mb-10 px-2">
          <Link href="/client/dashboard" className="cursor-pointer">
            <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text overflow-visible pr-1" style={{ fontFamily: "Inter, sans-serif" }}>
              Motors Line
            </h1>
          </Link>
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
          <Link href="/client/dashboard" className="cursor-pointer">
            <h1
              className="text-xl font-bold tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400 overflow-visible pr-1"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Motors Line
            </h1>
          </Link>
          <Link href="/client/profile" className="w-10 h-10 rounded-full border border-white/10 bg-[#1A1A1A] flex items-center justify-center hover:bg-[#2a2a2a] transition-colors">
            <span className="material-symbols-outlined text-[#c4c7c8] text-lg">person</span>
          </Link>
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

          {/* Mission list */}
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
            {missions.map((m) => (
              <Link
                key={m.id}
                href={`/client/missions/${m.id}`}
                className={`group bg-[#131313] rounded-3xl overflow-hidden flex flex-col hover:bg-[#1a1919] active:scale-[0.99] transition-all duration-150 ${
                  m.status === "terminee" || m.status === "annulee" ? "opacity-60" : ""
                }`}
              >
                {m.vehicle_image_url && m.vehicle_image_url.trim() !== "" && (
                  <div className="h-[180px] w-full shrink-0">
                    <img src={m.vehicle_image_url} alt={`${m.vehicle_brand} ${m.vehicle_model}`} className="w-full h-full object-cover" />
                  </div>
                )}
                {/* Top: vehicle + badge */}
                <div className={`px-5 ${m.vehicle_image_url && m.vehicle_image_url.trim() !== "" ? "pt-4" : "pt-5"} pb-4 flex items-start justify-between gap-3`}>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-base leading-tight truncate" style={{ fontFamily: "Inter, sans-serif" }}>
                      {m.vehicle_brand} {m.vehicle_model}
                    </p>
                    <p className="text-[#949493] text-[11px] font-mono uppercase tracking-widest mt-0.5">
                      {m.vehicle_plate}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>

                {/* Divider */}
                <div className="mx-5 h-px bg-white/[0.05]" />

                {/* Route */}
                <div className="px-5 py-4 flex gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1.5 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <div className="w-px flex-1 bg-[#2a2a2a]" style={{ minHeight: "20px" }} />
                    <div className="w-1.5 h-1.5 rounded-full border border-[#949493]" />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                        {m.pickup_address}
                      </p>
                      {m.pickup_date && (
                        <p className="text-[#949493] text-[11px] mt-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {formatDate(m.pickup_date)}
                        </p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#c4c7c8] text-sm truncate leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                        {m.delivery_address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom action row */}
                <div className="px-5 pb-4 flex items-center justify-between">
                  {m.status === "terminee" && m.delivery_date ? (
                    <p className="text-[10px] text-[#949493] font-mono uppercase tracking-wider">
                      Livré {formatDate(m.delivery_date)}
                    </p>
                  ) : (
                    <div />
                  )}
                  <span className="flex items-center gap-1 text-xs font-bold text-white/40 group-hover:text-white/80 transition-colors uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
                    {m.status === "terminee" ? "Archives" : "Voir"}
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </main>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0A]/80 backdrop-blur-xl rounded-t-2xl z-50 border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.02)]">
          <div className="flex justify-around items-center h-16 px-4">
            {CLIENT_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-center transition-colors ${item.href === "/client/missions" ? "text-white" : "text-[#949493] hover:text-white"}`}
              >
                <span className="material-symbols-outlined" style={item.href === "/client/missions" ? { fontVariationSettings: "'FILL' 1" } : undefined}>
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
