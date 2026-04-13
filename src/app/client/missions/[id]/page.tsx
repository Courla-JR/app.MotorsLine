"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Script from "next/script";
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

type TrackingRow = {
  mission_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  updated_at: string;
};

type PhotoType = "before" | "after";

type MissionPhoto = {
  id: string;
  mission_id: string;
  photo_url: string;
  type: PhotoType;
  caption: string | null;
  created_at: string;
};

const CLIENT_NAV = [
  { icon: "dashboard",      label: "Dashboard",  href: "/client/dashboard" },
  { icon: "local_shipping", label: "Missions",   href: "/client/missions"  },
  { icon: "add_circle",     label: "Nouvelle",   href: "/client/missions/new" },
  { icon: "receipt_long",   label: "Facturation",href: "/client/billing"   },
  { icon: "person",         label: "Profil",     href: "/client/profile"   },
];

const STATUS_CONFIG: Record<MissionStatus, { label: string; color: string; bg: string; icon: string }> = {
  a_faire:  { label: "Planifiée",  color: "text-[#c4c7c8]",  bg: "bg-[#353534]",       icon: "schedule"       },
  en_cours: { label: "En cours",   color: "text-[#0A0A0A]",  bg: "bg-[#F59E0B]",       icon: "local_shipping" },
  terminee: { label: "Terminée",   color: "text-[#66ff8e]",  bg: "bg-[#353534]",       icon: "check_circle"   },
  annulee:  { label: "Annulée",    color: "text-[#ffb4ab]",  bg: "bg-[#ffb4ab]/10",    icon: "cancel"         },
};

const SERVICE_LABELS: Record<string, string> = {
  essentiel:  "Essentiel",
  premium:    "Premium",
  sur_mesure: "Sur Mesure",
};

// Progress steps mapped to status
const STEPS = ["Planifiée", "Prise en charge", "En transit", "Livrée"] as const;

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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Dark map style for Google Maps
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry",           stylers: [{ color: "#111111" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0a" }] },
  { elementType: "labels.text.fill",   stylers: [{ color: "#555555" }] },
  { featureType: "road",               elementType: "geometry",           stylers: [{ color: "#2a2a2a" }] },
  { featureType: "road",               elementType: "geometry.stroke",    stylers: [{ color: "#1a1a1a" }] },
  { featureType: "road.highway",       elementType: "geometry",           stylers: [{ color: "#353535" }] },
  { featureType: "water",              elementType: "geometry",           stylers: [{ color: "#070707" }] },
  { featureType: "poi",                stylers:                           [{ visibility: "off" }] },
  { featureType: "transit",            stylers:                           [{ visibility: "off" }] },
  { featureType: "administrative",     elementType: "geometry.stroke",    stylers: [{ color: "#2a2a2a" }] },
  { featureType: "administrative",     elementType: "labels.text.fill",   stylers: [{ color: "#444444" }] },
];

export default function ClientMissionDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const missionId = params.id as string;

  const [mission,  setMission]  = useState<Mission | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [tracking,   setTracking]   = useState<TrackingRow | null>(null);
  const [eta,        setEta]        = useState<string | null>(null);
  const [mapsReady,  setMapsReady]  = useState(false);
  const [noTracking, setNoTracking] = useState(false);

  // ── Photos (read-only) ──
  const [photos,   setPhotos]   = useState<MissionPhoto[]>([]);
  const [photoTab, setPhotoTab] = useState<PhotoType>("before");

  // ── Lightbox ──
  const [lightboxOpen,  setLightboxOpen]  = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // If Maps API is already loaded in the browser (cached from another page),
  // onLoad on the Script tag won't fire — detect it here instead.
  useEffect(() => {
    if (mission?.status !== "en_cours") return;
    if (typeof window !== "undefined" && (window as unknown as { google?: { maps?: unknown } }).google?.maps) {
      setMapsReady(true);
    }
  }, [mission?.status]);

  // Map refs
  const mapDivRef      = useRef<HTMLDivElement | null>(null);
  const mapRef         = useRef<google.maps.Map | null>(null);
  const carMarkerRef   = useRef<google.maps.Marker | null>(null);
  const deliveryLatLng = useRef<{ lat: number; lng: number } | null>(null);

  // ── Photos fetch ──
  useEffect(() => {
    if (!missionId) return;
    supabase
      .from("mission_photos")
      .select("*")
      .eq("mission_id", missionId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setPhotos((data ?? []) as MissionPhoto[]));
  }, [missionId]);

  // ── Auth + mission fetch ──
  useEffect(() => {
    async function fetchMission() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/client/login"); return; }

      const { data: client } = await supabase
        .from("clients").select("id").eq("user_id", user.id).single();
      if (!client) { router.push("/client/login"); return; }

      const { data, error } = await supabase
        .from("missions").select("*")
        .eq("id", missionId).eq("client_id", client.id).single();
      if (error) console.error("[mission detail] fetch error:", error.message);
      if (!data) { router.push("/client/missions"); return; }
      setMission(data as Mission);
      setLoading(false);
    }
    fetchMission();
  }, [missionId, router]);

  // ── Realtime subscription + initial tracking fetch ──
  useEffect(() => {
    if (!mission || mission.status !== "en_cours") return;

    // Initial fetch
    supabase.from("mission_tracking").select("*")
      .eq("mission_id", missionId).single()
      .then(({ data }) => {
        if (data) setTracking(data as TrackingRow);
        else setNoTracking(true);
      });

    const channel = supabase
      .channel(`tracking:${missionId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "mission_tracking",
        filter: `mission_id=eq.${missionId}`,
      }, (payload) => {
        const row = payload.new as TrackingRow;
        setTracking(row);
        setNoTracking(false);
        moveCarMarker(row.latitude, row.longitude);
        computeEta(row.latitude, row.longitude, row.speed);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mission, missionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── ETA calculation ──
  function computeEta(lat: number, lng: number, speed: number | null) {
    if (!deliveryLatLng.current || !speed || speed <= 0) { setEta(null); return; }
    const distKm = haversineKm(lat, lng, deliveryLatLng.current.lat, deliveryLatLng.current.lng);
    const hours  = distKm / speed; // speed is m/s from geolocation
    const hours2 = distKm / (speed * 3.6); // convert m/s → km/h
    void hours; // unused
    const mins   = Math.round(hours2 * 60);
    if (mins <= 0)       { setEta("Arrivée imminente"); return; }
    if (mins < 60)       { setEta(`~${mins} min`); return; }
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    setEta(`~${h}h${m > 0 ? m.toString().padStart(2, "0") : "00"}`);
  }

  // ── Google Maps init ──
  const initMap = useCallback(() => {
    if (!mapDivRef.current || !mission) return;

    const map = new google.maps.Map(mapDivRef.current, {
      center:            { lat: 46.2276, lng: 2.2137 }, // France center
      zoom:              6,
      styles:            DARK_MAP_STYLES,
      disableDefaultUI:  true,
      zoomControl:       false,
    });
    mapRef.current = map;

    // Directions route
    const directionsService  = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor:   "#ffffff",
        strokeOpacity: 0.35,
        strokeWeight:  3,
      },
    });

    directionsService.route({
      origin:      mission.pickup_address,
      destination: mission.delivery_address,
      travelMode:  google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status !== "OK" || !result) return;
      directionsRenderer.setDirections(result);

      const route = result.routes[0]?.legs[0];
      if (!route) return;

      // Custom origin marker (white dot)
      new google.maps.Marker({
        position: route.start_location,
        map,
        icon: {
          path:        google.maps.SymbolPath.CIRCLE,
          scale:       6,
          fillColor:   "#ffffff",
          fillOpacity: 1,
          strokeColor: "#0A0A0A",
          strokeWeight: 2,
        },
      });

      // Custom destination marker (outlined)
      new google.maps.Marker({
        position: route.end_location,
        map,
        icon: {
          path:        google.maps.SymbolPath.CIRCLE,
          scale:       6,
          fillColor:   "#1c1b1b",
          fillOpacity: 1,
          strokeColor: "#949493",
          strokeWeight: 2,
        },
      });

      // Store delivery coords for ETA
      deliveryLatLng.current = {
        lat: route.end_location.lat(),
        lng: route.end_location.lng(),
      };
    });

    // If we already have tracking data, place the car marker
    if (tracking) {
      placeCarMarker(map, tracking.latitude, tracking.longitude);
      computeEta(tracking.latitude, tracking.longitude, tracking.speed);
    }
  }, [mission, tracking]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-init map when mapsReady + mission are both available
  useEffect(() => {
    if (mapsReady && mission && mission.status === "en_cours") {
      initMap();
    }
  }, [mapsReady, mission, initMap]);

  // When tracking arrives after map is already init'd
  useEffect(() => {
    if (tracking && mapRef.current) {
      moveCarMarker(tracking.latitude, tracking.longitude);
      computeEta(tracking.latitude, tracking.longitude, tracking.speed);
    }
  }, [tracking]); // eslint-disable-line react-hooks/exhaustive-deps

  function placeCarMarker(map: google.maps.Map, lat: number, lng: number) {
    if (carMarkerRef.current) {
      carMarkerRef.current.setPosition({ lat, lng });
      return;
    }
    carMarkerRef.current = new google.maps.Marker({
      position: { lat, lng },
      map,
      icon: {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#F59E0B">
            <circle cx="12" cy="12" r="11" fill="#1c1b1b" stroke="#F59E0B" stroke-width="1.5"/>
            <path d="M17.5 10.5c-.28-.84-1.06-1.5-2-1.5H8.5c-.94 0-1.72.66-2 1.5L5 14v5c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-5l-1.5-3.5zM8.5 16a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm7 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM7 13l1-3h8l1 3H7z" fill="#F59E0B"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor:     new google.maps.Point(16, 16),
      },
      title: "Position du convoyeur",
    });
    map.panTo({ lat, lng });
  }

  function moveCarMarker(lat: number, lng: number) {
    if (!mapRef.current) return;
    if (!carMarkerRef.current) {
      placeCarMarker(mapRef.current, lat, lng);
    } else {
      carMarkerRef.current.setPosition({ lat, lng });
      mapRef.current.panTo({ lat, lng });
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "user-role=; path=/; Max-Age=0";
    router.push("/client/login");
  }

  const statusCfg = mission ? STATUS_CONFIG[mission.status] : null;
  const step      = mission ? activeStep(mission.status) : -1;

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen antialiased">

      {/* Google Maps API — only loaded when en_cours */}
      {mission?.status === "en_cours" && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`}
          strategy="afterInteractive"
          onLoad={() => setMapsReady(true)}
        />
      )}

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
          <div className="flex items-center gap-4">
            <Link href="/client/missions">
              <span className="material-symbols-outlined text-white cursor-pointer active:opacity-70 active:scale-95 duration-150">
                arrow_back
              </span>
            </Link>
            <Link href="/client/dashboard" className="cursor-pointer">
              <h1
                className="text-xl font-bold tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400 overflow-visible pr-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Motors Line
              </h1>
            </Link>
          </div>
          <Link href="/client/profile" className="w-10 h-10 rounded-full border border-white/10 bg-[#1A1A1A] flex items-center justify-center hover:bg-[#2a2a2a] transition-colors">
            <span className="material-symbols-outlined text-[#c4c7c8] text-lg">person</span>
          </Link>
        </header>

        <main className="pt-24 md:pt-8 pb-8 px-4 md:px-6 max-w-lg md:max-w-3xl mx-auto">

          {/* Back link (desktop) */}
          <Link
            href="/client/missions"
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
            <div className="flex flex-col gap-5">

              {/* ── HEADER ── */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-2xl font-semibold text-white tracking-tight leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                    {mission.vehicle_brand} {mission.vehicle_model}
                  </h2>
                  <p className="text-xs font-mono uppercase tracking-widest text-[#c4c7c8] mt-1">
                    {mission.vehicle_plate}
                  </p>
                </div>
                <span className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.color}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: "13px", fontVariationSettings: "'FILL' 1" }}>
                    {statusCfg.icon}
                  </span>
                  {statusCfg.label}
                </span>
              </div>

              {/* ── MAP CARD (en_cours only) ── */}
              {mission.status === "en_cours" && (
                <section className="bg-[#1c1b1b] rounded-2xl overflow-hidden border border-white/[0.04]">
                  {/* Live indicator */}
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                    <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Suivi en direct
                    </h3>
                    <span className="flex items-center gap-1.5 text-[10px] text-[#66ff8e] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#66ff8e] animate-pulse" />
                      Live
                    </span>
                  </div>

                  {/* Map container */}
                  <div className="relative" style={{ height: "220px" }}>
                    <div ref={mapDivRef} className="absolute inset-0" />

                    {/* Fallback overlay — shown until map + tracking ready */}
                    {(!mapsReady || noTracking) && (
                      <div className="absolute inset-0 bg-[#111] flex flex-col items-center justify-center gap-3 pointer-events-none">
                        <div className="absolute inset-0 opacity-5" style={{
                          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                          backgroundSize:  "32px 32px",
                        }} />
                        <span className="material-symbols-outlined text-[#353534] text-5xl">map</span>
                        <p className="text-[#444748] text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {noTracking ? "Localisation indisponible" : "Chargement de la carte…"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ETA row */}
                  {eta && (
                    <div className="px-5 py-3 border-t border-white/[0.04] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#F59E0B] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        schedule
                      </span>
                      <p className="text-sm font-semibold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                        ETA : {eta}
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* ── PROGRESS BAR ── */}
              {mission.status !== "annulee" && (
                <section className="bg-[#1c1b1b] rounded-2xl px-5 py-5 border border-white/[0.04]">
                  <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Avancement
                  </h3>
                  <div className="flex items-center gap-0">
                    {STEPS.map((label, i) => {
                      const isDone   = i < step;
                      const isActive = i === step;
                      const isFuture = i > step;
                      return (
                        <div key={label} className="flex items-center flex-1 last:flex-none">
                          {/* Step dot + label */}
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                              isDone   ? "bg-white"                                                            :
                              isActive ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] animate-pulse"      :
                                         "bg-[#2a2a2a] border border-[#3a3a3a]"
                            }`} />
                            <p className={`text-[9px] font-semibold uppercase tracking-wide leading-none text-center ${
                              isFuture ? "text-[#444748]" : "text-white"
                            }`} style={{ fontFamily: "Montserrat, sans-serif", maxWidth: "52px" }}>
                              {label}
                            </p>
                          </div>

                          {/* Connector line (not after last) */}
                          {i < STEPS.length - 1 && (
                            <div className="flex-1 h-0.5 mx-1.5 mb-5 rounded-full">
                              <div className={`h-full rounded-full transition-all duration-500 ${isDone ? "bg-white/40" : "bg-[#2a2a2a]"}`} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── ÉTAT DU VÉHICULE (photos, read-only) ── */}
              {photos.length > 0 && (() => {
                const displayed = photos.filter(p => p.type === photoTab);
                return (
                  <section className="bg-[#1c1b1b] rounded-2xl p-5 border border-white/[0.04]">
                    {/* Header + tabs */}
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        État du véhicule
                      </h3>
                      <div className="flex gap-1 bg-[#111] rounded-lg p-0.5">
                        {(["before", "after"] as PhotoType[]).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setPhotoTab(tab)}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                              photoTab === tab
                                ? "bg-white text-[#0A0A0A]"
                                : "text-[#949493] hover:text-white"
                            }`}
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                          >
                            {tab === "before" ? "Prise en charge" : "Livraison"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Photo grid */}
                    {displayed.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {displayed.map((photo, idx) => (
                          <button
                            key={photo.id}
                            onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                            className="aspect-square block focus:outline-none"
                          >
                            <img
                              src={photo.photo_url}
                              alt={photo.caption ?? `Photo ${photo.type}`}
                              className="w-full h-full object-cover rounded-xl hover:opacity-90 transition-opacity"
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center gap-2 opacity-40">
                        <span className="material-symbols-outlined text-[#949493] text-3xl">photo_library</span>
                        <p className="text-[10px] text-[#949493] uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          Aucune photo pour cet onglet
                        </p>
                      </div>
                    )}
                  </section>
                );
              })()}

              {/* ── VÉHICULE ── */}
              <section className="bg-[#1c1b1b] rounded-2xl p-5 border border-white/[0.04]">
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

              {/* ── ITINÉRAIRE ── */}
              <section className="bg-[#1c1b1b] rounded-2xl p-5 border border-white/[0.04]">
                <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Itinéraire
                </h3>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center pt-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    <div className="w-px flex-1 border-l border-dashed border-[#353534] my-2" style={{ minHeight: "40px" }} />
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

              {/* ── TARIF ── */}
              <section className="bg-[#1c1b1b] rounded-2xl p-5 border border-white/[0.04]">
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

              {/* ── NOTES ── */}
              {mission.notes && (
                <section className="bg-[#1c1b1b] rounded-2xl p-5 border border-white/[0.04]">
                  <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Notes logistiques
                  </h3>
                  <p className="text-[#c4c7c8] text-sm leading-relaxed" style={{ fontFamily: "Montserrat, sans-serif" }}>{mission.notes}</p>
                </section>
              )}

            </div>
          ) : null}
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

      {/* ── LIGHTBOX ── */}
      {lightboxOpen && (() => {
        const displayed = photos.filter(p => p.type === photoTab);
        const photo = displayed[lightboxIndex];
        if (!photo) return null;
        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
              onClick={() => setLightboxOpen(false)}
            >
              <span className="material-symbols-outlined text-white text-xl">close</span>
            </button>

            {/* Prev */}
            {lightboxIndex > 0 && (
              <button
                className="absolute left-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i - 1); }}
              >
                <span className="material-symbols-outlined text-white text-xl">chevron_left</span>
              </button>
            )}

            {/* Next */}
            {lightboxIndex < displayed.length - 1 && (
              <button
                className="absolute right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i + 1); }}
              >
                <span className="material-symbols-outlined text-white text-xl">chevron_right</span>
              </button>
            )}

            {/* Image */}
            <img
              src={photo.photo_url}
              alt={photo.caption ?? `Photo ${photo.type}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Counter */}
            <div className="absolute bottom-4 left-0 w-full flex justify-center">
              <span className="text-[#949493] text-xs font-mono">{lightboxIndex + 1} / {displayed.length}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
