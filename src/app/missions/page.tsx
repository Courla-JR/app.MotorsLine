"use client";

import Link from "next/link";

type MissionStatus = "en-cours" | "a-faire" | "terminee";

type Mission = {
  id: number;
  vehicle: string;
  plate: string;
  status: MissionStatus;
  img: string;
  from: string;
  to: string;
  timeFrom: string;
  timeTo: string;
  initials: string;
  showTimeTo?: boolean;
};

const missions: Mission[] = [
  {
    id: 1,
    vehicle: "Porsche 911 GT3",
    plate: "AA-123-BC",
    status: "en-cours",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-NuduL7Y1uxKtOIfYXMaRR1xTRcEoLvZAEnhOq-UJ6__KIVo-NoE5ELunjK-Z6MPc_NL0iTP-MuwDVnsESEm6VUr3Frfj5VZ64ju_j-774Tzo3RfENIx0y_4sKkaay0rdQAqp4RkNDPY6FohlAuOB1T-fu3OPp0UYsFSx6e1-CERujO8elg-lKO7abIIN5i04glXhzgGrvmIqoIzEqK8UfU4RA0pHn0_pPR1b4Ggju7ACtsBW8xzy56dfqzi52fd6xXCxgich1No",
    from: "Paris, FR",
    to: "Monaco, MC",
    timeFrom: "10:30 AM",
    timeTo: "17:45 PM",
    initials: "JD",
    showTimeTo: true,
  },
  {
    id: 2,
    vehicle: "Land Rover Defender",
    plate: "XZ-998-MM",
    status: "a-faire",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBypIQzfLZF6f-TG5SHhobu2N6AppbbLyEe77WHkHPZV8QIL_UAhiZTx-OOZv0A4ifm9Jt9AR8uV9ec6MaE6xsoiiZ8BxVpT5Y6AjFJ0tSGxd4lbWzCfZNgRyKTHRAQDIcOW8CfMffJa942ymDmVM5jK87vinISYIyLuZvntNl0SQGqkF4PtHLmb3VCqr46ok4HetH-RkZW8BYm21M_cWbJQKdWsSLt82BzYv9TKK8DAf0JJvnaDm1feYGDVviqS9vEeaKDI1mW9fQ",
    from: "Lyon, FR",
    to: "Geneva, CH",
    timeFrom: "Demain, 08:00",
    timeTo: "Demain, 12:30",
    initials: "PL",
    showTimeTo: true,
  },
  {
    id: 3,
    vehicle: "Tesla Model S",
    plate: "BE-445-RT",
    status: "terminee",
    img: "",
    from: "Bordeaux, FR",
    to: "Madrid, ES",
    timeFrom: "",
    timeTo: "",
    initials: "",
    showTimeTo: false,
  },
];

function StatusBadge({ status }: { status: MissionStatus }) {
  if (status === "en-cours")
    return (
      <span className="px-3 py-1 rounded-full bg-[#66ff8e] text-[#002109] font-bold text-[10px] uppercase tracking-wider">
        En cours
      </span>
    );
  if (status === "a-faire")
    return (
      <span className="px-3 py-1 rounded-full bg-[#2a2a2a] text-[#c4c7c8] font-bold text-[10px] uppercase tracking-wider">
        À faire
      </span>
    );
  return (
    <span className="px-3 py-1 rounded-full bg-[#2a2a2a]/40 text-[#c4c7c8]/50 font-bold text-[10px] uppercase tracking-wider">
      Terminées
    </span>
  );
}

export default function MissionsPage() {
  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen pb-32 antialiased">
      {/* TopAppBar */}
      <header className="bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-md mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <span className="material-symbols-outlined text-white cursor-pointer active:opacity-70 active:scale-95 duration-150">
                arrow_back
              </span>
            </Link>
            <h1
              className="text-xl font-bold tracking-tighter text-white bg-clip-text bg-gradient-to-r from-[#949493] via-[#E0E0E0] to-[#949493]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Motors Line
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#c4c7c8]">search</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 mt-6">
        <div className="mb-8">
          <h2 className="text-[26px] font-bold text-white mb-6 tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
            Missions
          </h2>
          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {["Toutes", "À faire", "En cours", "Terminées"].map((f, i) => (
              <button
                key={f}
                className={`px-5 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  i === 0
                    ? "bg-white text-[#0A0A0A] font-bold"
                    : "bg-[#2a2a2a] text-[#c4c7c8] font-medium hover:bg-[#2A2A2A]"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {f}
              </button>
            ))}
          </div>
          {/* Secondary filters */}
          <div className="flex gap-3 mt-2">
            {[
              { icon: "calendar_today", label: "Date" },
              { icon: "domain", label: "Client" },
            ].map((f) => (
              <button
                key={f.label}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1c1b1b] border border-white/5 py-3 rounded-xl text-[#c4c7c8] text-sm font-medium active:scale-95 duration-150"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <span className="material-symbols-outlined text-lg">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mission list */}
        <div className="space-y-6">
          {missions.map((m) => (
            <div
              key={m.id}
              className={`bg-[#1c1b1b] rounded-2xl p-5 relative overflow-hidden group ${
                m.status === "terminee" ? "opacity-60" : ""
              }`}
            >
              <div className="absolute top-0 right-0 p-4">
                <StatusBadge status={m.status} />
              </div>
              <div className="mb-4 z-10">
                <h3
                  className={`text-lg font-bold tracking-tight leading-tight mb-1 ${m.status === "terminee" ? "text-white/50" : "text-white"}`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {m.vehicle}
                </h3>
                <p className={`text-xs font-mono uppercase tracking-widest ${m.status === "terminee" ? "text-[#c4c7c8]/50" : "text-[#c4c7c8]"}`}>
                  {m.plate}
                </p>
              </div>

              {/* Car image */}
              {m.img && (
                <div className="relative mb-6 -mx-5 h-32 overflow-hidden bg-[#0A0A0A]">
                  <img
                    src={m.img}
                    alt={m.vehicle}
                    className="w-full h-full object-cover grayscale opacity-80 group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              )}

              {/* Route */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${m.status === "terminee" ? "bg-white/50" : "bg-white"}`} />
                  <p className={`text-sm font-medium ${m.status === "terminee" ? "text-[#e5e2e1]/50" : "text-[#e5e2e1]"}`} style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {m.from}
                  </p>
                  {m.timeFrom && <span className="text-[#c4c7c8] text-xs font-mono ml-auto">{m.timeFrom}</span>}
                </div>
                {/* Track line */}
                <div className="ml-1 h-8 relative">
                  <div className="absolute left-[3px] top-0 bottom-0 w-1 bg-[#353534] rounded-full" />
                </div>
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${m.status === "terminee" ? "bg-[#8e9192]/50" : "bg-[#8e9192]"}`} />
                  <p className={`text-sm font-medium ${m.status === "terminee" ? "text-[#e5e2e1]/50" : "text-[#e5e2e1]"}`} style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {m.to}
                  </p>
                  {m.showTimeTo && m.timeTo && <span className="text-[#c4c7c8] text-xs font-mono ml-auto">{m.timeTo}</span>}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                {m.status === "terminee" ? (
                  <span className="text-[10px] font-mono text-[#c4c7c8]/40">LIVRÉ LE 12/05/2024</span>
                ) : (
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[10px] font-bold border border-[#0A0A0A]">
                      {m.initials}
                    </div>
                  </div>
                )}
                <button
                  className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${m.status === "terminee" ? "text-white/40" : "text-white"}`}
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

      {/* Bottom Nav */}
      <nav className="bg-[#0A0A0A]/80 backdrop-blur-xl fixed bottom-0 w-full z-50 rounded-t-2xl border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.05)]">
        <div className="flex justify-around items-center pt-3 pb-6 px-4">
          {[
            { icon: "dashboard", label: "Dashboard", href: "/dashboard", active: false },
            { icon: "local_shipping", label: "Missions", href: "/missions", active: true },
            { icon: "add_circle", label: "Nouveau", href: "/missions/new", active: false },
            { icon: "person", label: "Profil", href: "#", active: false },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-colors ${item.active ? "text-white scale-110" : "text-[#949493] hover:text-white"}`}
            >
              <span
                className="material-symbols-outlined mb-1"
                style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium text-[10px] uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
