"use client";

import Link from "next/link";

type Mission = {
  id: number;
  vehicle: string;
  plate: string;
  from: string;
  to: string;
  time: string;
  status: "en-cours" | "planifie" | "demain";
  icon: "schedule" | "event";
};

const missions: Mission[] = [
  {
    id: 1,
    vehicle: "Porsche 911 Carrera",
    plate: "AA-123-BB",
    from: "Paris, France",
    to: "Lyon, France",
    time: "14:30",
    status: "en-cours",
    icon: "schedule",
  },
  {
    id: 2,
    vehicle: "BMW M4 Competition",
    plate: "TR-888-ZZ",
    from: "Bordeaux, France",
    to: "Paris, France",
    time: "18:45",
    status: "planifie",
    icon: "schedule",
  },
];

const upcoming: Mission[] = [
  {
    id: 3,
    vehicle: "Audi RS6 Avant",
    plate: "MM-001-RS",
    from: "Marseille, France",
    to: "Monaco",
    time: "25 Mai • 09:00",
    status: "demain",
    icon: "event",
  },
];

function StatusBadge({ status }: { status: Mission["status"] }) {
  if (status === "en-cours") {
    return (
      <span className="bg-white text-[#0A0A0A] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">
        En cours
      </span>
    );
  }
  return (
    <span className="bg-[#1A1A1A] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border border-white/10">
      {status === "planifie" ? "Planifié" : "Demain"}
    </span>
  );
}

function MissionCard({ mission }: { mission: Mission }) {
  return (
    <div className="bg-[#1c1b1b] rounded-xl p-5 mb-4 border border-white/5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4
            className="text-white font-bold text-lg mb-1"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {mission.vehicle}
          </h4>
          <span
            className="text-[#949493] text-xs tracking-widest"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {mission.plate}
          </span>
        </div>
        <StatusBadge status={mission.status} />
      </div>

      {/* Route timeline */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex flex-col items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-white" />
          <div className="w-0.5 h-6 bg-[#353534] rounded-full" />
          <div className="w-2 h-2 border border-[#949493] rounded-full" />
        </div>
        <div className="flex flex-col gap-2">
          <span
            className="text-[#E0E0E0] text-sm"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {mission.from}
          </span>
          <span
            className="text-[#E0E0E0] text-sm"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {mission.to}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#949493] text-sm">
            {mission.icon}
          </span>
          <span
            className="text-[#949493] text-xs"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {mission.time}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="bg-[#0A0A0A] min-h-screen pb-24">
      {/* TopAppBar */}
      <header className="bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-40 border-b border-transparent">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-md mx-auto">
          <span
            className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#949493] via-[#E0E0E0] to-[#949493]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Motors Line
          </span>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-white cursor-pointer">
              notifications
            </span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#2A2A2A]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJ4vMht0YM2X2xyEQwwE8wzuMfwhxgHsliDyJVKJ8HMawilIjOqH-b2mr4W97ddGZfHvlJqmUFzw1by3sXPivvwrljJv_ViiZ6lwNtEuYq0tYqdw8Rhh1LG9lcDaC_Ncn1jtkLwXP_duB1WNlEW89TNk1xuFrCsz5xpGwRF3K6bZ9Et_JVgsdBoVaZRse161csoSv_EC4QUR3D9QmUeoZkwHpOGft-x26o0Yzs5s-NpIYkoCTv7RDCAK6NV6kIllsGoD_j9z1i-7M"
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-6">
        {/* Greeting */}
        <section className="mb-8">
          <h2
            className="text-[26px] font-semibold text-white leading-tight"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Bonjour, Marc
          </h2>
          <p
            className="text-[#949493] text-sm mt-1"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Lundi 24 Mai 2024
          </p>
        </section>

        {/* Stats cards */}
        <section className="mb-10 overflow-x-auto flex gap-4 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { label: "Missions du mois", value: "12", unit: "" },
            { label: "Km parcourus", value: "847", unit: "km" },
            { label: "Ce mois", value: "1 240", unit: "€" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="min-w-[160px] bg-[#1A1A1A] p-5 rounded-lg flex flex-col justify-between h-32 border border-white/5 shrink-0"
            >
              <span
                className="text-[#949493] text-xs uppercase tracking-wider"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {stat.label}
              </span>
              <span
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {stat.value}{" "}
                {stat.unit && (
                  <span className="text-sm font-normal text-[#949493]">
                    {stat.unit}
                  </span>
                )}
              </span>
            </div>
          ))}
        </section>

        {/* Aujourd'hui */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3
              className="text-[20px] font-bold text-white"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Aujourd&apos;hui
            </h3>
            <span
              className="text-xs text-[#949493]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              2 missions
            </span>
          </div>
          {missions.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
        </section>

        {/* À venir */}
        <section className="mb-12">
          <h3
            className="text-[20px] font-bold text-white mb-6"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            À venir
          </h3>
          {upcoming.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="bg-[#0A0A0A]/80 backdrop-blur-xl fixed bottom-0 w-full z-50 rounded-t-2xl border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.05)]">
        <div className="flex justify-around items-center pt-3 pb-6 px-4 max-w-md mx-auto">
          {/* Dashboard — active */}
          <Link
            href="/dashboard"
            className="flex flex-col items-center text-white scale-110 transition-transform"
          >
            <span
              className="material-symbols-outlined mb-1"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              dashboard
            </span>
            <span className="font-medium text-[10px] uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
              Dashboard
            </span>
          </Link>

          {/* Missions */}
          <Link
            href="/missions"
            className="flex flex-col items-center text-[#949493] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined mb-1">local_shipping</span>
            <span className="font-medium text-[10px] uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
              Missions
            </span>
          </Link>

          {/* New mission FAB */}
          <Link
            href="/missions/new"
            className="flex flex-col items-center text-[#949493] hover:text-white transition-colors relative -top-4"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 duration-200 ease-out">
              <span className="material-symbols-outlined text-[#0A0A0A] text-3xl">add</span>
            </div>
            <span className="font-medium text-[10px] uppercase tracking-widest mt-5" style={{ fontFamily: "Inter, sans-serif" }}>
              Nouveau
            </span>
          </Link>

          {/* Profil */}
          <Link
            href="/profile"
            className="flex flex-col items-center text-[#949493] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined mb-1">person</span>
            <span className="font-medium text-[10px] uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
              Profil
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
