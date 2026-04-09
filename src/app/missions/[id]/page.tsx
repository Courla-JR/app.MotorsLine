"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type MissionStatus = "a_faire" | "en_cours" | "terminee" | "annulee";

type Mission = {
  id: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string | null;
  status: MissionStatus;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  delivery_date: string | null;
  notes: string | null;
  price: number | null;
  service_level: string | null;
  distance_km: string | null;
  duration: string | null;
};

const CONVOYEUR_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/missions" },
  { icon: "add_circle", label: "Nouvelle mission", href: "/missions/new" },
  { icon: "receipt_long", label: "Facturation", href: "/billing" },
  { icon: "person", label: "Profil", href: "/profile" },
];

const STATUS_CONFIG: Record<MissionStatus, { label: string; color: string; bg: string; icon: string }> = {
  a_faire:  { label: "Planifiée",  color: "text-[#c4c7c8]",  bg: "bg-[#353534]",    icon: "schedule"       },
  en_cours: { label: "En cours",   color: "text-[#002109]",  bg: "bg-[#66ff8e]",   icon: "local_shipping" },
  terminee: { label: "Terminée",   color: "text-[#c4c7c8]/60", bg: "bg-[#2a2a2a]/40", icon: "check_circle" },
  annulee:  { label: "Annulée",    color: "text-[#ffb4ab]",  bg: "bg-[#ffb4ab]/10", icon: "cancel"         },
};

const SERVICE_LABELS: Record<string, string> = {
  essentiel:  "Essentiel",
  premium:    "Premium",
  sur_mesure: "Sur Mesure",
};

const TIMELINE_STEPS = [
  { label: "Planifiée",       icon: "schedule"       },
  { label: "Prise en charge", icon: "handshake"      },
  { label: "En transit",      icon: "local_shipping" },
  { label: "Livrée",          icon: "where_to_vote"  },
];

function activeStep(status: MissionStatus): number {
  if (status === "a_faire")  return 0;
  if (status === "en_cours") return 2;
  if (status === "terminee") return 3;
  return -1;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ConvoyeurMissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const missionId = params.id as string;

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchMission() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || (profile.role !== "convoyeur" && profile.role !== "admin")) {
        router.push("/login");
        return;
      }
      setIsAdmin(profile.role === "admin");

      const { data, error: missionError } = await supabase
        .from("missions")
        .select("*")
        .eq("id", missionId)
        .single();

      if (missionError) {
        console.error("[mission detail convoyeur] fetch error:", missionError.message, missionError.code);
      }
      if (!data) { router.push("/missions"); return; }
      setMission(data as Mission);
      setLoading(false);
    }
    fetchMission();
  }, [missionId, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "user-role=; path=/; Max-Age=0";
    router.push("/login");
  }

  const statusCfg = mission ? STATUS_CONFIG[mission.status] : null;
  const step = mission ? activeStep(mission.status) : -1;

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen antialiased">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#0A0A0A] border-r border-[#2A2A2A] z-50 py-8 px-4">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text overflow-visible pr-1" style={{ fontFamily: "Inter, sans-serif" }}>
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
          <Link href="/admin" className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#949493] hover:text-white hover:bg-white/5 transition-colors mt-1">
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
      <div className="md:ml-60 pb-32 md:pb-10">

        {/* TopAppBar (mobile only) */}
        <header className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/missions">
              <span className="material-symbols-outlined text-white cursor-pointer active:opacity-70 active:scale-95 duration-150">
                arrow_back
              </span>
            </Link>
            <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text overflow-visible pr-1" style={{ fontFamily: "Inter, sans-serif" }}>
              Motors Line
            </h1>
          </div>
          <Link href="/profile" className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center hover:bg-[#3a3939] transition-colors">
            <span className="material-symbols-outlined text-[#c4c7c8]">person</span>
          </Link>
        </header>

        <main className="pt-24 md:pt-8 pb-8 px-4 md:px-6 max-w-lg md:max-w-3xl mx-auto">

          {/* Back (desktop) */}
          <Link
            href="/missions"
            className="hidden md:inline-flex items-center gap-2 text-[#949493] hover:text-white text-sm mb-8 transition-colors"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Retour aux missions
          </Link>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <span className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Chargement...</span>
            </div>
          ) : mission && statusCfg ? (
            <div className="flex flex-col gap-6">

              {/* ── Header ── */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-semibold text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                    {mission.vehicle_brand} {mission.vehicle_model}
                  </h2>
                  <p className="text-xs font-mono uppercase tracking-widest text-[#c4c7c8] mt-1">
                    {mission.vehicle_plate}
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.color}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>
                    {statusCfg.icon}
                  </span>
                  {statusCfg.label}
                </span>
              </div>

              {/* ── Véhicule ── */}
              <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Véhicule
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Marque</p>
                    <p className="text-white font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{mission.vehicle_brand || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Modèle</p>
                    <p className="text-white font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{mission.vehicle_model || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Immatriculation</p>
                    <p className="text-white font-medium text-sm font-mono uppercase">{mission.vehicle_plate || "—"}</p>
                  </div>
                  {mission.vehicle_color && (
                    <div>
                      <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Couleur</p>
                      <p className="text-white font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{mission.vehicle_color}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Itinéraire ── */}
              <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Itinéraire
                </h3>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center pt-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    <div className="w-0.5 flex-1 bg-[#353534] rounded-full my-2" style={{ minHeight: "40px" }} />
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-[#949493]" />
                  </div>
                  <div className="flex flex-col gap-6 flex-1">
                    <div>
                      <p className="text-[10px] text-[#c4c7c8] uppercase tracking-widest font-medium mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Départ</p>
                      <p className="text-white font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{mission.pickup_address}</p>
                      {mission.pickup_date && (
                        <p className="text-[#949493] text-xs font-mono mt-1 capitalize">{formatDate(mission.pickup_date)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-[#c4c7c8] uppercase tracking-widest font-medium mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Arrivée</p>
                      <p className="text-white font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{mission.delivery_address}</p>
                      {mission.delivery_date && (
                        <p className="text-[#949493] text-xs font-mono mt-1 capitalize">{formatDate(mission.delivery_date)}</p>
                      )}
                    </div>
                  </div>
                </div>
                {(mission.distance_km || mission.duration) && (
                  <div className="mt-5 pt-5 border-t border-white/[0.05] flex gap-6">
                    {mission.distance_km && (
                      <div>
                        <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Distance</p>
                        <p className="text-white font-semibold text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{mission.distance_km}</p>
                      </div>
                    )}
                    {mission.duration && (
                      <div>
                        <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Durée estimée</p>
                        <p className="text-white font-semibold text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{mission.duration}</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* ── Tarif ── */}
              <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Tarif
                </h3>
                {mission.price ? (
                  <div className="flex items-end gap-3">
                    <p className="text-3xl font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                      {mission.price}€
                      <span className="text-base font-medium text-[#949493] ml-1">HT</span>
                    </p>
                    {mission.service_level && (
                      <span className="mb-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#c4c7c8]">
                        {SERVICE_LABELS[mission.service_level] ?? mission.service_level}
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>Sur devis</p>
                    <p className="text-xs text-[#949493] mt-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Contactez votre gestionnaire pour les détails tarifaires
                    </p>
                  </div>
                )}
              </section>

              {/* ── Timeline ── */}
              {mission.status !== "annulee" && (
                <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                  <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-6" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Suivi
                  </h3>
                  <div className="flex flex-col gap-0">
                    {TIMELINE_STEPS.map((s, i) => {
                      const isDone   = i < step;
                      const isActive = i === step;
                      return (
                        <div key={s.label} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                              isDone   ? "bg-white/10 border border-white/20"  :
                              isActive ? "bg-white shadow-[0_0_12px_rgba(255,255,255,0.25)]" :
                                         "bg-[#1a1a1a] border border-[#2a2a2a]"
                            }`}>
                              {isDone ? (
                                <span className="material-symbols-outlined text-[#66ff8e]" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}>check</span>
                              ) : (
                                <span className={`material-symbols-outlined ${isActive ? "text-[#0A0A0A]" : "text-[#444748]"}`}
                                  style={{ fontSize: "16px", fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                                  {s.icon}
                                </span>
                              )}
                            </div>
                            {i < TIMELINE_STEPS.length - 1 && (
                              <div className={`w-0.5 h-8 my-1 rounded-full ${isDone ? "bg-white/20" : "bg-[#2a2a2a]"}`} />
                            )}
                          </div>
                          <div className="pt-1 pb-8 last:pb-0">
                            <p className={`text-sm font-semibold ${isActive ? "text-white" : isDone ? "text-[#c4c7c8]" : "text-[#444748]"}`}
                              style={{ fontFamily: "Inter, sans-serif" }}>
                              {s.label}
                            </p>
                            {isActive && i < TIMELINE_STEPS.length - 1 && (
                              <p className="text-[10px] text-[#949493] mt-0.5 uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                Étape en cours
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── Notes ── */}
              {mission.notes && (
                <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                  <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Notes logistiques
                  </h3>
                  <p className="text-[#c4c7c8] text-sm leading-relaxed" style={{ fontFamily: "Montserrat, sans-serif" }}>{mission.notes}</p>
                </section>
              )}

              {/* ── Suivi en direct (en_cours seulement) ── */}
              {mission.status === "en_cours" && (
                <section className="bg-[#1c1b1b] rounded-2xl overflow-hidden border border-white/[0.04]">
                  <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                    <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Suivi en direct
                    </h3>
                    <span className="flex items-center gap-1.5 text-[10px] text-[#66ff8e] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#66ff8e] animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className="relative h-64 bg-[#111] flex flex-col items-center justify-center gap-3">
                    <div className="absolute inset-0 opacity-5" style={{
                      backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                      backgroundSize: "32px 32px",
                    }} />
                    <span className="material-symbols-outlined text-[#353534] text-5xl">map</span>
                    <p className="text-[#444748] text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Localisation en cours de chargement…
                    </p>
                  </div>
                </section>
              )}

            </div>
          ) : null}
        </main>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl fixed bottom-0 w-full z-50 rounded-t-2xl border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.05)]">
          <div className="flex justify-around items-center pt-3 pb-6 px-4">
            {[
              { icon: "dashboard", href: "/dashboard" },
              { icon: "local_shipping", href: "/missions" },
              { icon: "add_circle", href: "/missions/new" },
              { icon: "person", href: "/profile" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center transition-colors ${item.href === "/missions" ? "text-white scale-110" : "text-[#949493] hover:text-white"}`}
              >
                <span className="material-symbols-outlined" style={item.href === "/missions" ? { fontVariationSettings: "'FILL' 1" } : undefined}>
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
