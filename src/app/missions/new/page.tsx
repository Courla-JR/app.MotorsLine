"use client";

import Link from "next/link";

const missionTypes = ["Transfer", "Delivery", "Concierge"];

export default function NewMissionPage() {
  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen pb-40" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* TopAppBar */}
      <header className="bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-40">
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

      <main className="max-w-lg mx-auto px-6 mt-6 space-y-8">
        {/* Mission type */}
        <section className="space-y-3">
          <label className="text-[10px] uppercase tracking-widest font-medium text-[#c4c7c8] ml-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Type de Mission
          </label>
          <div className="flex flex-wrap gap-2">
            {missionTypes.map((t, i) => (
              <button
                key={t}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-transform active:scale-95 ${
                  i === 0
                    ? "bg-white text-[#0A0A0A]"
                    : "bg-[#2a2a2a] text-white font-medium border border-white/5 hover:bg-[#3a3939]"
                }`}
              >
                {t}
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
              {[
                { label: "Marque", placeholder: "ex: Porsche" },
                { label: "Modèle", placeholder: "ex: 911 GT3" },
              ].map((f) => (
                <div key={f.label} className="space-y-1.5">
                  <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {f.label}
                  </label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Immatriculation", placeholder: "AA-123-BB", mono: true },
                { label: "Couleur", placeholder: "Noir Intense" },
              ].map((f) => (
                <div key={f.label} className="space-y-1.5">
                  <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {f.label}
                  </label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    className={`w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white ${f.mono ? "font-mono" : ""}`}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Numéro VIN (Optionnel)
              </label>
              <input
                type="text"
                placeholder="WPOZZZ..."
                className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm font-mono placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
              />
            </div>
          </div>
        </section>

        {/* Client */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Client</h3>
            <span className="material-symbols-outlined text-[#c4c7c8] text-sm">person</span>
          </div>
          <div className="bg-[#1A1A1A] p-5 rounded-xl space-y-4">
            <div className="relative">
              <select className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:ring-[0.5px] focus:ring-white">
                <option>Sélectionner un client existant</option>
                <option>Garage du Centre (Pro)</option>
                <option>Jean Dupont (Particulier)</option>
                <option>Motors Racing Team</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-[#c4c7c8] pointer-events-none">
                expand_more
              </span>
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined text-lg">person_add</span>
              Nouveau client
            </button>
          </div>
        </section>

        {/* Route */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Itinéraire</h3>
            <span className="material-symbols-outlined text-[#c4c7c8] text-sm">route</span>
          </div>
          <div className="bg-[#1A1A1A] p-5 rounded-xl space-y-6 relative overflow-hidden">
            {/* Track decoration */}
            <div className="absolute left-9 top-14 bottom-32 w-[2px] bg-[#353534] rounded-full" />
            <div className="space-y-4">
              {/* Departure */}
              <div className="relative pl-10">
                <div className="absolute left-3 top-2 w-3 h-3 rounded-full border-2 border-white bg-[#1A1A1A] z-10" />
                <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Départ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Saisir l'adresse de départ"
                    className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm pr-10 placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#c4c7c8] text-lg">location_on</span>
                </div>
              </div>
              {/* Arrival */}
              <div className="relative pl-10">
                <div className="absolute left-3 top-2 w-3 h-3 rounded-full bg-white z-10" />
                <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Arrivée
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Saisir l'adresse d'arrivée"
                    className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm pr-10 placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#c4c7c8] text-lg">flag</span>
                </div>
              </div>
            </div>
            {/* Date / Time */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              {[
                { label: "Date", type: "date" },
                { label: "Heure", type: "time" },
              ].map((f) => (
                <div key={f.label} className="space-y-1.5">
                  <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-[0.5px] focus:ring-white"
                  />
                </div>
              ))}
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
              placeholder="Instructions particulières pour le transporteur, accès site, contact sur place..."
              className="w-full bg-[#131313] border-none rounded-lg p-3 text-white text-sm resize-none placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            />
          </div>
        </section>
      </main>

      {/* Create Mission CTA */}
      <div className="fixed bottom-24 left-0 w-full px-6 z-40 pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <button
            className="w-full h-14 rounded-full font-bold text-base text-[#0A0A0A] shadow-[0_8px_32px_rgba(255,255,255,0.1)] active:scale-95 transition-all"
            style={{ background: "linear-gradient(to right, #949493, #E0E0E0, #949493)" }}
          >
            Créer la mission
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#0A0A0A]/80 backdrop-blur-xl z-50 rounded-t-2xl border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.05)]">
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
              <span
                className="material-symbols-outlined mt-1"
                style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium text-[10px] uppercase tracking-widest mt-1">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
