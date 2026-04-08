"use client";

import Link from "next/link";

const steps = [
  {
    id: 1,
    title: "Prise en charge effectuée",
    subtitle: "Périgueux - Centre Logistique",
    time: "14:02",
    state: "done",
  },
  {
    id: 2,
    title: "Transit autoroutier A89",
    subtitle: "En mouvement · 110 km/h",
    time: "LIVE",
    state: "active",
  },
  {
    id: 3,
    title: "Livraison prévue",
    subtitle: "Bordeaux - Agence Motors Line",
    time: "14:38",
    state: "pending",
  },
];

export default function LiveTrackingPage() {
  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen pb-20" style={{ fontFamily: "Montserrat, sans-serif" }}>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="flex justify-between items-center px-6 h-16 w-full">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="active:scale-95 duration-200 text-white">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            </Link>
            <h3
              className="font-semibold tracking-tight text-white text-lg"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Suivi en direct
            </h3>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#353534] flex items-center justify-center overflow-hidden border border-[#444748]/20">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYWkRKnA364nn5ZTXsTdKxl5vxFT49LDurVVuAqAXr80hbZD1vgu5JsLV7wuALvIHKthpa5m0TT8RJcZ5I7ce3hKTAmUYJNwUAxXz5jvNnVO5hvGEoIfi3IpU7K-8Efqn-2VNOo7IACuP5Sp9nsCjds2jK1NO335IldPEVYLNwfph2dDEFz0euzdTPpmMmifpYUDTTsMMIdhFz0-qpBJGWPBbKzQPwHFbttc-FSx2V54I6qt4-_2cLTQkx4EEL69vjJW3Ql4pCf8A"
              alt="User Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      <main className="pt-16 pb-20">
        {/* Map section */}
        <section className="relative h-[442px] w-full overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[#0e0e0e]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDB888U_d88qIvxm54DXZHnnbF-uCa2hcKFhFcWGZhOpn_oeiBzqH06ErVMQPuwongW-T7ha1_DuOgeauiQhHaP4mPdUl2qx_4TsyiLQ1bufNwCaFYzWKq9h8dzgTrhAqFzuSwYPxO4fN1EkYV7aQBIUeCuRx2Np0N5CWQO_GzsgSvqIuSByrBeyV6ez-H2AovsMjZb4x0cuSwSw4vlyW7sDPOjhqcbFHCQEkZUnaGDfRQpGIFKcJq-j3Ooy6SfTC3-oXQ0N9dGGs8"
              alt="Dark map"
              className="w-full h-full object-cover opacity-60 grayscale brightness-50 contrast-125"
            />
            {/* Route SVG */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
              viewBox="0 0 400 400"
              preserveAspectRatio="none"
            >
              <path
                d="M 50 350 L 150 250 L 250 200 L 320 80"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeDasharray="8 4"
                strokeLinecap="round"
              />
              <circle cx="50" cy="350" r="6" fill="#4CAF50" />
              <circle cx="320" cy="80" r="6" fill="white" />
            </svg>
            {/* Pulsing convoy marker */}
            <div className="absolute left-[200px] top-[225px] -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-4 h-4 bg-white rounded-full border-2 border-[#0A0A0A] animate-[pulse-white_2s_infinite]" />
            </div>
          </div>
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10,10,10,0.8) 0%, rgba(10,10,10,0) 20%, rgba(10,10,10,0) 80%, rgba(10,10,10,1) 100%)",
            }}
          />
        </section>

        {/* Mission Intelligence Canvas */}
        <section className="px-6 -mt-8 relative z-20 space-y-6">
          {/* Main info card */}
          <div className="bg-[#1A1A1A] rounded-2xl p-6 shadow-2xl border-t border-white/5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Véhicule assigné
                </p>
                <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                  Hyundai Tucson · AB-123-CD
                </h2>
              </div>
              <div className="bg-white text-zinc-950 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse" />
                En route
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1c1b1b] p-4 rounded-xl border border-white/5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Convoyeur
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-lg">person</span>
                  </div>
                  <span className="text-white font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
                    Jérémy
                  </span>
                </div>
              </div>
              <div className="bg-[#1c1b1b] p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Distance restante
                </p>
                <p className="text-white text-lg font-bold tracking-tighter" style={{ fontFamily: "Inter, sans-serif" }}>
                  ~12 km
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Départ
                  </p>
                  <p className="text-zinc-300 font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                    14:02
                  </p>
                </div>
                <div className="flex-1 px-4">
                  <div className="h-[2px] bg-zinc-800 relative rounded-full overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-2/3 bg-white" />
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Arrivée estimée
                  </p>
                  <p className="text-white font-bold" style={{ fontFamily: "Inter, sans-serif" }}>
                    14:38
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 gap-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`rounded-2xl p-5 flex items-center gap-5 border ${
                  step.state === "active"
                    ? "bg-[#201f1f] border-white/10 scale-[1.02] shadow-xl"
                    : step.state === "done"
                    ? "bg-[#1c1b1b] border-white/5"
                    : "bg-[#0e0e0e] border-transparent opacity-40"
                }`}
              >
                <div className="flex flex-col items-center">
                  {step.state === "done" && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-[#66ff8e] shadow-[0_0_12px_rgba(102,255,142,0.3)]" />
                      <div className="w-[2px] h-10 bg-zinc-800" />
                    </>
                  )}
                  {step.state === "active" && (
                    <>
                      <div className="w-[2px] h-5 bg-zinc-800" />
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-zinc-950 animate-pulse" />
                      </div>
                      <div className="w-[2px] h-5 bg-zinc-900" />
                    </>
                  )}
                  {step.state === "pending" && (
                    <>
                      <div className="w-[2px] h-10 bg-zinc-900" />
                      <div className="w-3 h-3 rounded-full border border-zinc-700" />
                    </>
                  )}
                </div>
                <div>
                  <h4
                    className={`font-semibold text-sm ${step.state === "active" ? "font-bold text-white" : step.state === "done" ? "text-white" : "text-zinc-300"}`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {step.title}
                  </h4>
                  <p className={`text-xs ${step.state === "active" ? "text-zinc-400" : "text-zinc-500"}`}>
                    {step.subtitle}
                  </p>
                </div>
                <div className={`ml-auto text-[10px] font-mono ${step.state === "active" ? "text-white font-bold" : "text-zinc-500"}`}>
                  {step.time}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full h-20 bg-neutral-950/80 backdrop-blur-xl flex justify-around items-center px-4 pb-4 z-50 rounded-t-2xl shadow-[0_-4px_24px_rgba(255,255,255,0.02)]">
        {[
          { icon: "dashboard", label: "Dashboard", href: "/dashboard", active: true },
          { icon: "local_shipping", label: "Missions", href: "/missions", active: false },
          { icon: "receipt_long", label: "Facturation", href: "#", active: false },
          { icon: "settings", label: "Paramètres", href: "#", active: false },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center transition-colors ${item.active ? "text-white scale-110" : "text-zinc-600 hover:text-zinc-300"}`}
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
