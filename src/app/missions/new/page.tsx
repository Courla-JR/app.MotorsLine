"use client";

/* global google */
declare const google: any;

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { supabase } from "@/lib/supabase";

type ServiceLevel = "essentiel" | "premium" | "sur_mesure";

type Pricing =
  | { surDevis: false; tranche: string; essentiel: number; premium: number }
  | { surDevis: true;  tranche: string; essentiel: null;   premium: null   };

function roundTo5(n: number) { return Math.round(n / 5) * 5; }

function getPricing(distanceMeters: number): Pricing {
  const km = distanceMeters / 1000;
  if (km <= 50)  return { surDevis: false, tranche: "Locale",          essentiel: 95,  premium: roundTo5(95  * 1.35) };
  if (km <= 150) return { surDevis: false, tranche: "Régionale",       essentiel: 145, premium: roundTo5(145 * 1.35) };
  if (km <= 300) return { surDevis: false, tranche: "Inter-régionale", essentiel: 250, premium: roundTo5(250 * 1.35) };
  if (km <= 500) return { surDevis: false, tranche: "Longue distance", essentiel: 380, premium: roundTo5(380 * 1.35) };
  return               { surDevis: true,  tranche: "Grande distance",  essentiel: null, premium: null };
}

const CONVOYEUR_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/missions" },
  { icon: "add_circle", label: "Nouvelle mission", href: "/missions/new" },
  { icon: "receipt_long", label: "Facturation", href: "/billing" },
  { icon: "person", label: "Profil", href: "/profile" },
];

const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (let m = 0; m < 60; m += 15) {
    if (h === 22 && m > 0) break;
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

const ADMIN_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/admin" },
  { icon: "add_circle", label: "Nouvelle mission", href: "/missions/new" },
];

type ClientOption = { id: string; company_name: string };

export default function NewMissionPage() {
  const router = useRouter();

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [color, setColor] = useState("");
  const [vin, setVin] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("convoyeur");
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  useEffect(() => {
    const match = document.cookie.split(";").find((c) => c.trim().startsWith("user-role="));
    const role = match?.split("=")[1]?.trim() ?? "convoyeur";
    setUserRole(role);
    if (role === "admin") {
      supabase.from("clients").select("id, company_name").order("company_name").then(({ data }) => {
        setClientOptions((data as ClientOption[]) ?? []);
      });
    }
  }, []);

  // Maps state
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; distanceMeters: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<ServiceLevel>("essentiel");

  // Derive pricing from distanceMeters at render time — avoids stale/missing state issues
  const pricing: Pricing | null = routeInfo ? getPricing(routeInfo.distanceMeters) : null;

  // Price to save: based on selectedLevel + distance tranche
  const selectedPrice: number | null =
    pricing && !pricing.surDevis && selectedLevel !== "sur_mesure"
      ? selectedLevel === "essentiel" ? pricing.essentiel : pricing.premium
      : null;

  // Refs for autocomplete inputs and place results
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const deliveryInputRef = useRef<HTMLInputElement>(null);
  const pickupPlaceRef = useRef<any>(null);
  const deliveryPlaceRef = useRef<any>(null);

  const computeRoute = useCallback(() => {
    if (!pickupPlaceRef.current?.geometry?.location || !deliveryPlaceRef.current?.geometry?.location) return;
    setRouteLoading(true);
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: pickupPlaceRef.current.geometry.location,
        destination: deliveryPlaceRef.current.geometry.location,
        travelMode: "DRIVING",
      },
      (result: any, status: string) => {
        setRouteLoading(false);
        if (status === "OK" && result) {
          const leg = result.routes[0].legs[0];
          const distanceMeters = leg.distance?.value ?? 0;
          setRouteInfo({
            distance: leg.distance?.text ?? "—",
            duration: leg.duration?.text ?? "—",
            distanceMeters,
          });
          // Force sur_mesure for grande distance; keep user's choice otherwise
          if (getPricing(distanceMeters).surDevis) setSelectedLevel("sur_mesure");
        }
      }
    );
  }, []);

  const initMaps = useCallback(() => {
    if (!pickupInputRef.current || !deliveryInputRef.current) return;

    const opts = { fields: ["formatted_address", "geometry"], types: ["address"] };

    const acPickup = new google.maps.places.Autocomplete(pickupInputRef.current, opts);
    const acDelivery = new google.maps.places.Autocomplete(deliveryInputRef.current, opts);

    acPickup.addListener("place_changed", () => {
      const place = acPickup.getPlace();
      if (place?.geometry) {
        pickupPlaceRef.current = place;
        setRouteInfo(null);
        setSelectedLevel("essentiel");
        computeRoute();
      }
    });

    acDelivery.addListener("place_changed", () => {
      const place = acDelivery.getPlace();
      if (place?.geometry) {
        deliveryPlaceRef.current = place;
        setRouteInfo(null);
        setSelectedLevel("essentiel");
        computeRoute();
      }
    });
  }, [computeRoute]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Non authentifié.");
      setLoading(false);
      return;
    }

    const pickupDatetime = pickupDate && pickupTime
      ? new Date(`${pickupDate}T${pickupTime}`).toISOString()
      : pickupDate ? new Date(pickupDate).toISOString() : null;

    const { error: insertError } = await supabase.from("missions").insert({
      status: "a_faire",
      convoyeur_id: user.id,
      client_id: userRole === "admin" ? (selectedClientId || null) : null,
      vehicle_brand: brand,
      vehicle_model: model,
      vehicle_plate: plate,
      vehicle_color: color || null,
      vehicle_vin: vin || null,
      pickup_address: pickupInputRef.current?.value ?? "",
      pickup_date: pickupDatetime,
      delivery_address: deliveryInputRef.current?.value ?? "",
      notes: notes || null,
      price: selectedPrice ?? null,
      service_level: selectedLevel,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Send confirmation email (best-effort, non-blocking for navigation)
    if (user.email && routeInfo) {
      fetch("/api/send-mission-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: user.email,
          vehicleBrand: brand,
          vehicleModel: model,
          vehiclePlate: plate,
          pickupAddress: pickupInputRef.current?.value ?? "",
          deliveryAddress: deliveryInputRef.current?.value ?? "",
          distance: routeInfo.distance,
          duration: routeInfo.duration,
          serviceLevel: selectedLevel,
          price: selectedPrice,
          pickupDate: pickupDate && pickupTime
            ? new Date(`${pickupDate}T${pickupTime}`).toISOString()
            : pickupDate ? new Date(pickupDate).toISOString() : null,
        }),
      }).catch(() => {}); // silent — email failure must not block navigation
    }

    router.push(userRole === "admin" ? "/admin" : "/missions");
  }

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* Google Maps API */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={initMaps}
      />

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#0A0A0A] border-r border-[#2A2A2A] z-50 py-8 px-4">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text" style={{ fontFamily: "Inter, sans-serif" }}>
            Motors Line
          </h1>
          <p className="text-[10px] text-[#949493] uppercase tracking-widest mt-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {userRole === "admin" ? "Espace Admin" : "Espace Convoyeur"}
          </p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {(userRole === "admin" ? ADMIN_NAV : CONVOYEUR_NAV).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                item.href === "/missions/new" ? "bg-white/10 text-white" : "text-[#949493] hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={item.href === "/missions/new" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{item.label}</span>
            </Link>
          ))}
        </nav>
        {userRole === "convoyeur" && (
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
      <div className="md:ml-60">

        {/* TopAppBar (mobile only) */}
        <header className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 h-16 w-full max-w-lg mx-auto">
            <div className="flex items-center gap-4">
              <Link href={userRole === "admin" ? "/admin" : "/missions"}>
                <span className="material-symbols-outlined text-white cursor-pointer active:opacity-70 active:scale-95 duration-150">
                  arrow_back
                </span>
              </Link>
              <h1 className="font-semibold text-[20px] text-white">Nouvelle mission</h1>
            </div>
            <span className="silver-gradient-text text-xl font-bold tracking-tighter">Motors Line</span>
          </div>
        </header>

        {/* Desktop page title */}
        <div className="hidden md:block px-8 pt-8 pb-2 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <Link href={userRole === "admin" ? "/admin" : "/missions"}>
              <span className="material-symbols-outlined text-[#949493] hover:text-white cursor-pointer transition-colors">
                arrow_back
              </span>
            </Link>
            <h1 className="font-semibold text-[24px] text-white">Nouvelle mission</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pb-40 md:pb-10">
          <main className="max-w-lg md:max-w-2xl mx-auto px-6 mt-6 space-y-8">

            {/* Service level selector */}
            <section className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-medium text-[#c4c7c8] ml-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Niveau de service
              </label>
              <div className="flex flex-wrap gap-2">
                {(["essentiel", "premium", "sur_mesure"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedLevel(level)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-transform active:scale-95 ${
                      selectedLevel === level
                        ? "bg-white text-[#0A0A0A]"
                        : "bg-[#2a2a2a] text-white font-medium border border-white/5 hover:bg-[#3a3939]"
                    }`}
                  >
                    {level === "essentiel" ? "Essentiel" : level === "premium" ? "Premium" : "Sur Mesure"}
                  </button>
                ))}
              </div>
            </section>

            {/* Vehicle */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Véhicule</h3>
                <span className="material-symbols-outlined text-[#c4c7c8] text-sm">directions_car</span>
              </div>
              <div className="bg-[#1A1A1A] p-5 rounded-xl space-y-4 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Marque</label>
                    <input
                      required
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="ex: Porsche"
                      className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Modèle</label>
                    <input
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="ex: 911 GT3"
                      className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Immatriculation</label>
                    <input
                      required
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                      placeholder="AA-123-BB"
                      className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm font-mono placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Couleur</label>
                    <input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="Noir Intense"
                      className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Numéro VIN (Optionnel)</label>
                  <input
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    placeholder="WPOZZZ..."
                    className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm font-mono placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                  />
                </div>
              </div>
            </section>

            {/* Route */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Itinéraire</h3>
                <span className="material-symbols-outlined text-[#c4c7c8] text-sm">route</span>
              </div>
              <div className="bg-[#1A1A1A] p-5 rounded-xl space-y-6 relative overflow-visible">
                <div className="absolute left-9 top-14 bottom-32 w-[2px] bg-[#353534] rounded-full" />

                {/* Pickup */}
                <div className="relative pl-10">
                  <div className="absolute left-3 top-2 w-3 h-3 rounded-full border-2 border-white bg-[#1A1A1A] z-10" />
                  <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Départ</label>
                  <div className="relative">
                    <input
                      ref={pickupInputRef}
                      required
                      placeholder="Saisir l'adresse de départ"
                      className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm pr-10 placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                      autoComplete="off"
                      onInput={(e) => {
                        if (!e.currentTarget.value) { pickupPlaceRef.current = null; setRouteInfo(null); }
                      }}
                    />
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#c4c7c8] text-lg">location_on</span>
                  </div>
                </div>

                {/* Delivery */}
                <div className="relative pl-10">
                  <div className="absolute left-3 top-2 w-3 h-3 rounded-full bg-white z-10" />
                  <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Arrivée</label>
                  <div className="relative">
                    <input
                      ref={deliveryInputRef}
                      required
                      placeholder="Saisir l'adresse d'arrivée"
                      className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm pr-10 placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                      autoComplete="off"
                      onInput={(e) => {
                        if (!e.currentTarget.value) { deliveryPlaceRef.current = null; setRouteInfo(null); }
                      }}
                    />
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#c4c7c8] text-lg">flag</span>
                  </div>
                </div>

                {/* Route result */}
                {routeLoading && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <span className="text-[#949493] text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Calcul de l&apos;itinéraire…
                    </span>
                  </div>
                )}
                {routeInfo && !routeLoading && (
                  <div className="flex items-center gap-5 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#949493] text-base">route</span>
                      <div>
                        <p className="text-[10px] text-[#949493] uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>Distance</p>
                        <p className="text-white text-sm font-bold" style={{ fontFamily: "Inter, sans-serif" }}>{routeInfo.distance}</p>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#949493] text-base">schedule</span>
                      <div>
                        <p className="text-[10px] text-[#949493] uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>Durée estimée</p>
                        <p className="text-white text-sm font-bold" style={{ fontFamily: "Inter, sans-serif" }}>{routeInfo.duration}</p>
                      </div>
                    </div>
                    <span className="ml-auto text-[10px] text-[#444748] uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      via Google Maps
                    </span>
                  </div>
                )}

                {/* Date & time */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Date</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-[0.5px] focus:ring-white [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Heure</label>
                    <div className="relative">
                      <select
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm appearance-none pr-8 focus:outline-none focus:ring-[0.5px] focus:ring-white"
                      >
                        <option value="">— Heure —</option>
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-3 text-[#949493] text-base pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tarif estimé — affiché après calcul de distance */}
            {routeInfo && !routeLoading && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tarif estimé</h3>
                  {pricing && (
                    <span className="text-[10px] text-[#949493] uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {pricing.tranche}
                    </span>
                  )}
                </div>

                {selectedLevel === "sur_mesure" || pricing?.surDevis ? (
                  /* Sur Mesure ou Grande distance : pas de tarif fixe */
                  <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#949493] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        payments
                      </span>
                      <div>
                        <p className="text-white text-sm font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
                          {selectedLevel === "sur_mesure" ? "Sur Mesure" : "Grande distance"} — Tarif sur devis
                        </p>
                        <p className="text-[10px] text-[#949493] mt-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          Contactez-nous pour un tarif personnalisé
                        </p>
                      </div>
                    </div>
                    <a
                      href="mailto:contact@motorsline.fr?subject=Demande de devis"
                      className="shrink-0 px-4 py-2 bg-white text-[#0A0A0A] text-xs font-bold rounded-lg hover:bg-zinc-100 active:scale-95 transition-all"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Demander un devis
                    </a>
                  </div>
                ) : (
                  /* Prix fixe selon niveau sélectionné */
                  <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#949493] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        payments
                      </span>
                      <div>
                        <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {selectedLevel === "essentiel" ? "Essentiel — Convoyage point à point" : "Premium — Livraison avec mise en main"}
                        </p>
                        <p className="text-[11px] text-[#666]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {selectedLevel === "essentiel"
                            ? `Premium disponible à ${pricing!.premium}€ HT`
                            : `Essentiel disponible à ${pricing!.essentiel}€ HT`}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-white text-3xl font-bold" style={{ fontFamily: "Inter, sans-serif" }}>
                      {selectedPrice}€
                      <span className="text-[#949493] text-sm font-normal ml-1">HT</span>
                    </span>
                  </div>
                )}
              </section>
            )}

            {/* Notes */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Notes logistiques</h3>
                <span className="material-symbols-outlined text-[#c4c7c8] text-sm">sticky_note_2</span>
              </div>
              <div className="bg-[#1A1A1A] p-5 rounded-xl">
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions particulières pour le transporteur, accès site, contact sur place..."
                  className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm resize-none placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                />
              </div>
            </section>

            {/* Client assignment (admin only) */}
            {userRole === "admin" && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Client</h3>
                  <span className="material-symbols-outlined text-[#c4c7c8] text-sm">domain</span>
                </div>
                <div className="bg-[#1A1A1A] p-5 rounded-xl">
                  <div className="relative">
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm appearance-none pr-10 focus:outline-none focus:ring-[0.5px] focus:ring-white"
                    >
                      <option value="">— Sans client assigné —</option>
                      {clientOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.company_name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#949493] text-lg pointer-events-none">expand_more</span>
                  </div>
                </div>
              </section>
            )}

            {/* Error */}
            {error && (
              <p className="text-[#ffb4ab] text-sm text-center" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {error}
              </p>
            )}

            {/* CTA Desktop (inline) */}
            <div className="hidden md:block pb-10">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-full font-bold text-base text-[#0A0A0A] shadow-[0_8px_32px_rgba(255,255,255,0.1)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(to right, #949493, #E0E0E0, #949493)" }}
              >
                {loading ? "Création..." : "Créer la mission"}
              </button>
            </div>

          </main>

          {/* CTA Mobile (fixed) */}
          <div className="md:hidden fixed bottom-24 left-0 w-full px-6 z-40 pointer-events-none">
            <div className="max-w-lg mx-auto pointer-events-auto">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-full font-bold text-base text-[#0A0A0A] shadow-[0_8px_32px_rgba(255,255,255,0.1)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(to right, #949493, #E0E0E0, #949493)" }}
              >
                {loading ? "Création..." : "Créer la mission"}
              </button>
            </div>
          </div>
        </form>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0A]/80 backdrop-blur-xl z-50 rounded-t-2xl border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.05)]">
          <div className="flex justify-around items-center pt-3 pb-6 px-4 max-w-lg mx-auto">
            {[
              { icon: "dashboard", label: "Dashboard", href: "/dashboard", active: false },
              { icon: "local_shipping", label: "Missions", href: "/missions", active: false },
              { icon: "add_circle", label: "Nouveau", href: "/missions/new", active: true },
              { icon: "person", label: "Profil", href: "#", active: false },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center transition-colors ${item.active ? "text-white scale-110" : "text-[#949493] hover:text-white"}`}
              >
                <span className="material-symbols-outlined mt-1" style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.icon}
                </span>
                <span className="font-medium text-[10px] uppercase tracking-widest mt-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

      </div>
    </div>
  );
}
