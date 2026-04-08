"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type MissionType = "transfer" | "delivery" | "concierge";

const missionTypes: { label: string; value: MissionType }[] = [
  { label: "Transfer", value: "transfer" },
  { label: "Delivery", value: "delivery" },
  { label: "Concierge", value: "concierge" },
];

const CONVOYEUR_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/missions" },
  { icon: "add_circle", label: "Nouvelle mission", href: "/missions/new" },
  { icon: "person", label: "Profil", href: "/profile" },
];

export default function NewMissionPage() {
  const router = useRouter();

  const [type, setType] = useState<MissionType>("transfer");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [color, setColor] = useState("");
  const [vin, setVin] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      type,
      status: "a_faire",
      convoyeur_id: user.id,
      vehicle_brand: brand,
      vehicle_model: model,
      vehicle_plate: plate,
      vehicle_color: color || null,
      vehicle_vin: vin || null,
      pickup_address: pickupAddress,
      pickup_date: pickupDatetime,
      delivery_address: deliveryAddress,
      notes: notes || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      router.push("/missions");
    }
  }

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>

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
      </aside>

      {/* ── Main Content ── */}
      <div className="md:ml-60">

        {/* TopAppBar (mobile only) */}
        <header className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 h-16 w-full max-w-lg mx-auto">
            <div className="flex items-center gap-4">
              <Link href="/missions">
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
            <Link href="/missions">
              <span className="material-symbols-outlined text-[#949493] hover:text-white cursor-pointer transition-colors">
                arrow_back
              </span>
            </Link>
            <h1 className="font-semibold text-[24px] text-white">Nouvelle mission</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pb-40 md:pb-10">
          <main className="max-w-lg md:max-w-2xl mx-auto px-6 mt-6 space-y-8">

            {/* Mission type */}
            <section className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-medium text-[#c4c7c8] ml-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Type de Mission
              </label>
              <div className="flex flex-wrap gap-2">
                {missionTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-transform active:scale-95 ${
                      type === t.value
                        ? "bg-white text-[#0A0A0A]"
                        : "bg-[#2a2a2a] text-white font-medium border border-white/5 hover:bg-[#3a3939]"
                    }`}
                  >
                    {t.label}
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
              <div className="bg-[#1A1A1A] p-5 rounded-xl space-y-6 relative overflow-hidden">
                <div className="absolute left-9 top-14 bottom-32 w-[2px] bg-[#353534] rounded-full" />
                <div className="space-y-4">
                  <div className="relative pl-10">
                    <div className="absolute left-3 top-2 w-3 h-3 rounded-full border-2 border-white bg-[#1A1A1A] z-10" />
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Départ</label>
                    <div className="relative">
                      <input
                        required
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Saisir l'adresse de départ"
                        className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm pr-10 placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#c4c7c8] text-lg">location_on</span>
                    </div>
                  </div>
                  <div className="relative pl-10">
                    <div className="absolute left-3 top-2 w-3 h-3 rounded-full bg-white z-10" />
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Arrivée</label>
                    <div className="relative">
                      <input
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Saisir l'adresse d'arrivée"
                        className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm pr-10 placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#c4c7c8] text-lg">flag</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Date</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-[0.5px] focus:ring-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Heure</label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-[0.5px] focus:ring-white"
                    />
                  </div>
                </div>
              </div>
            </section>

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
