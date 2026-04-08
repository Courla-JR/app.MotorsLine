"use client";

import Link from "next/link";

const upcomingMissions = [
  { id: 1, vehicle: "Tesla Model 3", when: "Prévue pour demain • 09:00" },
  { id: 2, vehicle: "Audi RS6 Avant", when: "Jeudi 27 Mai • 14:15" },
];

export default function ClientDashboardPage() {
  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen pb-24 antialiased">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-neutral-950/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="flex items-center gap-4">
          <button className="text-white active:scale-95 duration-200 cursor-pointer">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1
            className="text-xl font-bold tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            PRECISION
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center overflow-hidden active:scale-95 duration-200 hover:opacity-80">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBopMjt_KZSTfXZsppOpEt4XR53nM2fX33ut3fN5e-E0F44rb_IdDhRDuDzvKGHVUmb52DLJa3eyuT6YwwKXVEeAFHDScYGoXgKmBzHWf-1NYtuGWm_58w-ote-F1YdlIjO8nphC4JayiHD4f1zKOUw6tXot8pFIk28GceO-h5ULZ1HsNQnun1CbuPgk5jdSpRiUNEvCl2o4zXwyXBZN0aDBdZU58BdaeBVrq1C5IYX-DlYvuFFDCQJN3wbMX9RrRzDNubacFktF2A"
            alt="User Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      <main className="pt-24 px-6 max-w-5xl mx-auto">
        {/* Welcome */}
        <section className="mb-10">
          <h2
            className="text-3xl font-semibold tracking-tight text-white mb-1"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Bonjour, Motors Line
          </h2>
          <p className="text-[#949493] text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Lundi 24 Mai 2024
          </p>
        </section>

        {/* Stats Bento */}
        <section className="grid grid-cols-1 gap-4 mb-12 sm:grid-cols-3">
          {[
            { label: "Missions ce mois", value: "8", gradient: false },
            { label: "En cours", value: "2", gradient: false },
            { label: "Budget mensuel", value: "780 €", gradient: true },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#1A1A1A] p-6 rounded-2xl flex flex-col justify-between h-32 border border-white/[0.03]"
            >
              <span
                className="text-[#949493] text-xs uppercase tracking-widest font-semibold"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {stat.label}
              </span>
              <span
                className={`text-4xl font-bold ${stat.gradient ? "silver-gradient-text" : "text-white"}`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {stat.gradient ? stat.value.replace(" €", "") : stat.value}
                {stat.gradient && (
                  <span className="silver-gradient-text"> €</span>
                )}
              </span>
            </div>
          ))}
        </section>

        {/* Active Mission */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold tracking-tight text-white" style={{ fontFamily: "Inter, sans-serif" }}>
              Missions en cours
            </h3>
            <span className="text-xs text-white/40 uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
              En direct
            </span>
          </div>
          <div className="bg-[#1c1b1b] rounded-3xl p-6 border border-white/[0.05] relative overflow-hidden">
            {/* Decorative car image */}
            <div className="absolute -right-12 -top-4 w-64 h-40 opacity-40 blur-sm pointer-events-none">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYLPcKpUjjcEhL4gk3r3IST0ieT8QMU677IerKzrTlr79Fg4pNn-gcEArVJjI3h3u8UYDXU_zmhrUKWsjaNBrfPAC6_2pIRBrtbMSEtk-LoaTfg_ZCK0oRIh8HJpf0-JxCPjeEzgcxxVyUO8iOoT0ZZlNGR2bEWv4TjPfJgOMvRp1KmIL6sdFYV8j4rxcACitsn_auz9kRlZRNDci4hMKuceKTOcl_aZC1qUtTJHWstkXWgLDVKy35Pcfr2w6rweR0_uMxFu-gpOo"
                alt="Vehicle"
                className="w-full h-full object-cover transform rotate-12"
              />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                      Porsche 911 Carrera
                    </span>
                    <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      En cours
                    </span>
                  </div>
                  <p className="text-[#949493] font-medium text-sm tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    AA-123-BC
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-semibold text-[#E0E0E0] mb-3 uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
                    <span>Lyon Nord</span>
                    <span>Paris XVI</span>
                  </div>
                  <div className="h-1 bg-[#2A2A2A] w-full rounded-full relative">
                    <div className="absolute top-1/2 left-[65%] -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                    <div className="h-full bg-white/40 rounded-full w-[65%]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#949493] text-sm">schedule</span>
                  <span className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Arrivée estimée : <strong className="text-white">14:38</strong>
                  </span>
                </div>
                <Link
                  href="/missions/tracking"
                  className="bg-transparent border border-[#2A2A2A] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Suivre en direct
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming */}
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
                      {m.vehicle}
                    </p>
                    <p className="text-[11px] text-[#949493] uppercase tracking-tighter" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {m.when}
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
