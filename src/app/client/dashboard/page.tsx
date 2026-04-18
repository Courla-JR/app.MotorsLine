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
  vehicle_image_url: string | null;
  status: "a_faire" | "prise_en_charge" | "en_cours" | "terminee" | "annulee";
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  delivery_date: string | null;
  distance_km: string | null;
  duration: string | null;
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

function MissionCard({ mission: m, badge, showDelivery }: { mission: DbMission; badge: { label: string; className: string }; showDelivery?: boolean }) {
  const distanceLine = [m.distance_km, m.duration].filter(Boolean).join(" · ");
  const displayDate = showDelivery ? m.delivery_date : m.pickup_date;
  return (
    <div className="bg-[#1c1b1b] rounded-3xl overflow-hidden border border-white/[0.05] flex flex-col">
      {/* Vehicle image */}
      {m.vehicle_image_url && (
        <div className="h-36 w-full overflow-hidden">
          <img src={m.vehicle_image_url} alt={`${m.vehicle_brand} ${m.vehicle_model}`} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-xl font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
              {m.vehicle_brand} {m.vehicle_model}
            </h4>
            <p className="text-[#949493] text-xs tracking-widest mt-0.5 font-mono uppercase" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {m.vehicle_plate}
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        {/* Date */}
        {displayDate && (
          <p className="text-[#949493] text-xs capitalize mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {showDelivery ? "Livré le " : ""}{formatPickup(displayDate)}
          </p>
        )}

        {/* Route */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="w-0.5 h-5 bg-[#353534] rounded-full" />
            <div className="w-2 h-2 border border-[#949493] rounded-full" />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-[#E0E0E0] text-sm truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>{m.pickup_address}</span>
            <span className="text-[#E0E0E0] text-sm truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>{m.delivery_address}</span>
          </div>
        </div>

        {/* Distance · Durée */}
        {distanceLine && (
          <p className="text-[#949493] text-xs ml-5 mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>{distanceLine}</p>
        )}

        <div className="mt-auto">
          <Link
            href={`/client/missions/${m.id}`}
            className="w-full flex items-center justify-center gap-2 border border-[#2A2A2A] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/5 transition-all active:scale-95"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Voir les détails
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

const CLIENT_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/client/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/client/missions" },
  { icon: "add_circle", label: "Nouvelle", href: "/client/missions/new" },
  { icon: "receipt_long", label: "Facturation", href: "/client/billing" },
  { icon: "person", label: "Profil", href: "/client/profile" },
];

export default function ClientDashboardPage() {
  const router = useRouter();
  const [contactName, setContactName] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [activeMissions, setActiveMissions] = useState<DbMission[]>([]);
  const [plannedMissions, setPlannedMissions] = useState<DbMission[]>([]);
  const [statsTotal,     setStatsTotal]     = useState(0);
  const [statsEnCours,   setStatsEnCours]   = useState(0);
  const [statsTerminees, setStatsTerminees] = useState(0);
  const [totalMissions,  setTotalMissions]  = useState(0);
  const [lastCompletedMission, setLastCompletedMission] = useState<DbMission | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/client/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setContactName(profile?.full_name ?? null);

      const { data: client } = await supabase
        .from("clients")
        .select("id, company_name")
        .eq("user_id", user.id)
        .single();

      if (!client) { setLoading(false); return; }
      setCompanyName(client.company_name);

      const { data: missions } = await supabase
        .from("missions")
        .select("id, vehicle_brand, vehicle_model, vehicle_plate, vehicle_image_url, status, pickup_address, delivery_address, pickup_date, delivery_date, distance_km, duration")
        .eq("client_id", client.id)
        .order("pickup_date", { ascending: true });

      const list = (missions as DbMission[]) ?? [];

      const now = new Date();
      const thisMonth = list.filter((m) => {
        if (!m.pickup_date) return false;
        const d = new Date(m.pickup_date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      setStatsTotal(thisMonth.length);
      setStatsEnCours(list.filter((m) => m.status === "en_cours" || m.status === "prise_en_charge").length);
      setStatsTerminees(list.filter((m) => {
        if (m.status !== "terminee" || !m.pickup_date) return false;
        const d = new Date(m.pickup_date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length);

      setTotalMissions(list.length);
      setActiveMissions(list.filter((m) => m.status === "en_cours" || m.status === "prise_en_charge"));
      setPlannedMissions(list.filter((m) => m.status === "a_faire"));
      const completed = list
        .filter((m) => m.status === "terminee")
        .sort((a, b) => new Date(b.delivery_date ?? b.pickup_date ?? "").getTime() - new Date(a.delivery_date ?? a.pickup_date ?? "").getTime());
      setLastCompletedMission(completed[0] ?? null);

      setLoading(false);
    }
    fetchData();
  }, [router]);

  const displayName = contactName?.split(" ")[0] ?? companyName ?? "—";

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
                item.href === "/client/dashboard" ? "bg-white/10 text-white" : "text-[#949493] hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={item.href === "/client/dashboard" ? { fontVariationSettings: "'FILL' 1" } : undefined}
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
        <header className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-neutral-950/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <Link href="/client/dashboard" className="cursor-pointer">
            <h1
              className="text-xl font-bold tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400 overflow-visible pr-1"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Motors Line
            </h1>
          </Link>
          <a href="https://wa.me/33761238105?text=Bonjour%2C%20je%20vous%20contacte%20via%20votre%20site" target="_blank" rel="noopener noreferrer" aria-label="Contacter Motors Line sur WhatsApp" className="w-10 h-10 rounded-full border border-white/10 bg-[#1A1A1A] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#c4c7c8] text-lg">chat</span>
          </a>
        </header>

        <main className="pt-24 md:pt-8 px-6 max-w-lg md:max-w-5xl mx-auto">

          {/* Welcome */}
          <section className="mb-10 flex items-start justify-between">
            <div>
              <h2
                className="text-3xl font-semibold tracking-tight text-white mb-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Bonjour, {loading ? "..." : displayName}
              </h2>
              <p className="text-[#949493] text-sm font-medium capitalize" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {today}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <a href="https://wa.me/33761238105?text=Bonjour%2C%20je%20vous%20contacte%20via%20votre%20site" target="_blank" rel="noopener noreferrer" aria-label="Contacter Motors Line sur WhatsApp" className="w-10 h-10 rounded-full border border-white/10 bg-[#1A1A1A] flex items-center justify-center hover:bg-[#2a2a2a] transition-colors">
                <span className="material-symbols-outlined text-[#c4c7c8] text-lg">chat</span>
              </a>
            </div>
          </section>

          {/* Stats */}
          <section className="mb-12">
            <div className="flex gap-4 overflow-x-auto -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-visible md:mx-0 md:px-0 md:grid md:grid-cols-3">
              {[
                { label: "Missions ce mois", value: loading ? "—" : String(statsTotal) },
                { label: "En cours",          value: loading ? "—" : String(statsEnCours) },
                { label: "Terminées",         value: loading ? "—" : String(statsTerminees) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-[160px] md:min-w-0 bg-[#1A1A1A] p-6 rounded-2xl flex flex-col justify-between h-32 border border-white/[0.03] shrink-0 md:shrink"
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
            </div>
          </section>

          {/* Priorité 0 — onboarding (nouveau compte, 0 missions) */}
          {!loading && totalMissions === 0 && (
            <section className="mb-12">
              <h3 className="text-lg font-semibold tracking-tight text-white mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
                Comment ça marche
              </h3>
              <div className="flex flex-col gap-3">
                <Link
                  href="/client/missions/new"
                  className="bg-[#1A1A1A] rounded-2xl border border-white/[0.06] p-6 flex items-start gap-5 hover:bg-[#222] transition-colors group"
                >
                  <span className="text-3xl font-bold text-white/15 shrink-0 font-mono leading-none mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>01</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                      Créez votre première mission
                    </h4>
                    <p className="text-[#949493] text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Renseignez le véhicule, les adresses et le créneau
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[#444748] group-hover:text-white transition-colors shrink-0 mt-0.5">arrow_forward</span>
                </Link>
                <div className="bg-[#1A1A1A] rounded-2xl border border-white/[0.03] p-6 flex items-start gap-5 opacity-50">
                  <span className="text-3xl font-bold text-white/15 shrink-0 font-mono leading-none mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>02</span>
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                      Suivez-la en temps réel
                    </h4>
                    <p className="text-[#949493] text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Statut, itinéraire et état du véhicule à chaque étape
                    </p>
                  </div>
                </div>
                <div className="bg-[#1A1A1A] rounded-2xl border border-white/[0.03] p-6 flex items-start gap-5 opacity-50">
                  <span className="text-3xl font-bold text-white/15 shrink-0 font-mono leading-none mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>03</span>
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                      Recevez le récapitulatif
                    </h4>
                    <p className="text-[#949493] text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Photos, kilométrage et rapport de livraison par email
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Priorité 1 — missions en cours (prise_en_charge ou en_cours) */}
          {!loading && activeMissions.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold tracking-tight text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                  Missions en cours
                </h3>
                <Link
                  href={`/client/missions/${activeMissions[0].id}`}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 hover:bg-[#22C55E]/20 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_6px_#22C55E]" />
                  <span className="text-[10px] font-bold text-[#22C55E] uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    En direct
                  </span>
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {activeMissions.map((m) => {
                  const badge = m.status === "prise_en_charge"
                    ? { label: "Prise en charge", className: "bg-[#3b82f6]/20 text-[#93c5fd]" }
                    : { label: "En cours", className: "bg-white text-black" };
                  return <MissionCard key={m.id} mission={m} badge={badge} />;
                })}
              </div>
            </section>
          )}

          {/* Priorité 2 — mission planifiée (a_faire), aucune en cours */}
          {!loading && activeMissions.length === 0 && plannedMissions.length > 0 && (
            <section className="mb-12">
              <h3 className="text-lg font-semibold tracking-tight text-white mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
                Prochaine mission
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {plannedMissions.map((m) => (
                  <MissionCard key={m.id} mission={m} badge={{ label: "Planifiée", className: "bg-[#353534] text-[#c4c7c8]" }} />
                ))}
              </div>
            </section>
          )}

          {/* Priorité 3 — aucune mission en cours ni planifiée */}
          {!loading && totalMissions > 0 && activeMissions.length === 0 && plannedMissions.length === 0 && (
            <section className="mb-12">
              {lastCompletedMission && (
                <>
                  <h3 className="text-lg font-semibold tracking-tight text-white mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
                    Dernière mission terminée
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <MissionCard
                      mission={lastCompletedMission}
                      badge={{ label: "Livrée", className: "bg-[#353534] text-[#50C878]" }}
                      showDelivery
                    />
                  </div>
                </>
              )}
              <div className="bg-[#1A1A1A] rounded-2xl border border-white/[0.06] p-8 flex flex-col items-center gap-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#242424] flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[#c4c7c8] text-2xl"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
                  >
                    route
                  </span>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                    Planifiez votre prochain convoyage
                  </h4>
                  <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Créez une mission en quelques clics
                  </p>
                </div>
                <Link
                  href="/client/missions/new"
                  className="px-6 py-2.5 bg-white text-[#0A0A0A] rounded-full text-sm font-bold hover:bg-zinc-100 transition-colors active:scale-95"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Créer une mission
                </Link>
              </div>
            </section>
          )}
        </main>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0A]/80 backdrop-blur-xl rounded-t-2xl z-50 border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.02)]">
          <div className="flex justify-around items-center h-16 px-4">
            {CLIENT_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-center transition-colors ${item.href === "/client/dashboard" ? "text-white" : "text-[#949493] hover:text-white"}`}
              >
                <span
                  className="material-symbols-outlined"
                  style={item.href === "/client/dashboard" ? { fontVariationSettings: "'FILL' 1" } : undefined}
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
