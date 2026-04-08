"use client";

import Link from "next/link";

type MissionStatus = "en-cours" | "planifiee" | "terminee";

type Mission = {
  id: number;
  vehicle: string;
  plate: string;
  plateColor?: string;
  from: string;
  to: string;
  time: string;
  timeIcon: string;
  status: MissionStatus;
  img: string;
  actionLabel: string;
  actionIcon: string;
  opacity?: boolean;
};

const missions: Mission[] = [
  {
    id: 1,
    vehicle: "Porsche 911 Carrera S",
    plate: "GE-911-RS",
    plateColor: "green",
    from: "Genève, CH",
    to: "Paris, FR",
    time: "Aujourd'hui, 14:30",
    timeIcon: "schedule",
    status: "en-cours",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2vdaP52hKM2FmyF0Zt_MioJdkIsAAEgY-5rsaoLwtUCH08n-OclCkTW4smds37rJITB2zny33j0IH65FyQOJvx6VePD62sUtcODGtQXzoJQ0tSABtWcyt1uuxQvpDPTQCb1xi9ZRts4kZE_NQuFUN24OUK8AJiA5ezTOi-Uu6AwJIeWdsgVhNFPWid_bXStnlvWhhndp_6Zk_S_k2lKi--cc6eWHBklIn3xghcT0duWXhAfpaiej-hfJdZCrXT37wZWbAwbaQgKo",
    actionLabel: "Détails",
    actionIcon: "chevron_right",
  },
  {
    id: 2,
    vehicle: "Mercedes-AMG GT",
    plate: "MA-750-GT",
    plateColor: "gray",
    from: "Monaco, MC",
    to: "Milan, IT",
    time: "12 Oct. 2023, 09:00",
    timeIcon: "calendar_month",
    status: "planifiee",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNULo4Jj4F7M15Y1S3zhGJcxmp8KHWc5YDbwglbs8PG6EibzWRJhNIhsCO4kSkf-upbQK0Khh01C1palf-4B6rujNy_P59B5maBLlCB7_HxKuuU2Ot_7f7KjAmGadJUvGOGRt13kfzalAZjAPRKmLQphCD55Qr7RLB2I5AtB3DScyDFCWsLBdrbv3In5TijIyJaSdMAG2C8xyWQVf9HzcAHs_m1q_6pI1bBAzySGJTfc2he6wku-WSXxYkHxhwHK-8oz31GNnYCRs",
    actionLabel: "Détails",
    actionIcon: "chevron_right",
    opacity: true,
  },
  {
    id: 3,
    vehicle: "Audi RS6 Avant",
    plate: "RS-600-AV",
    plateColor: "green",
    from: "Lyon, FR",
    to: "Bordeaux, FR",
    time: "Livré le 05 Oct. 2023",
    timeIcon: "check_circle",
    status: "terminee",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGu4WGwDm9jVetuZZJtWZyZNM5QS2-sJtq8kxnxGPD7s60iEAUEZsDSAyVUUGrPItW0ytKRVtEfR2Fnzwc2V7hnAWRrhylq7haWAehOmGkYYBnzilWXWrih6XqL2z4FFUEuTDq6HhzGUdthvGrpJbUCE9vfJl5ddiSsggNicNhVSeFpaB2n3jEBHZhoUbgCPj-OOJr0bOoCeUe3BNe6dxfv3qU6N9FENUgYpDDYKt8UcCmWPvE-FByX_igkY26572l20pzSDswiQo",
    actionLabel: "Facture",
    actionIcon: "receipt_long",
  },
];

function StatusBadge({ status }: { status: MissionStatus }) {
  if (status === "en-cours")
    return (
      <span className="px-3 py-1 rounded-full bg-white text-[#0A0A0A] text-[10px] font-bold uppercase tracking-wider">
        En cours
      </span>
    );
  if (status === "planifiee")
    return (
      <span className="px-3 py-1 rounded-full bg-[#353534] text-[#c4c7c8] text-[10px] font-bold uppercase tracking-wider">
        Planifiée
      </span>
    );
  return (
    <span className="px-3 py-1 rounded-full bg-[#353534] text-[#66ff8e] text-[10px] font-bold uppercase tracking-wider">
      Terminée
    </span>
  );
}

export default function ClientMissionsPage() {
  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen pb-32 antialiased">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-4">
          <button className="text-white active:scale-95 duration-200 hover:opacity-80 transition-opacity">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1
            className="text-xl font-bold tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            PRECISION
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-[#2a2a2a] overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCI1S9usHgs0PeX3MdW3qWzyHUek1gp8ufn7NenvBAK8oYfkhA4y3tBYgQUkUX8w5_x8Ki3Iq9Fa-D7ch2OBjL12dm-tnHKeaMhNbr3mJUf0hxCG_JLjP0uj9zGexAM7fsauKVVN97GYag6E7Q12hOS2f5-YCXCEEMwsNpMpkNloZQIlG236eyHJuUhZvVlKuzSCZwQsfGTQn8uUiYfxoVhvOvCvdTB067kz-MUequNgo0kG4sr595p00cLIz7edZuQLNRxybQSjwM"
            alt="User Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      <main className="pt-24 pb-32 px-4 max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-4xl font-semibold text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
              Missions
            </h2>
            <p className="text-[#c4c7c8] text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Gérez vos transports de véhicules
            </p>
          </div>
          <button className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-white active:scale-95 transition-all">
            <span className="material-symbols-outlined">calendar_today</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-6">
          {["Toutes", "En cours", "Planifiées", "Terminées"].map((f, i) => (
            <button
              key={f}
              className={`px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                i === 0
                  ? "bg-white text-[#0A0A0A]"
                  : "bg-[#1c1b1b] border border-[#444748]/20 text-[#c4c7c8] hover:bg-[#2a2a2a]"
              }`}
              style={{ fontFamily: i === 0 ? "Inter, sans-serif" : "Montserrat, sans-serif" }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Mission cards */}
        <div className="grid gap-6">
          {missions.map((m) => (
            <div key={m.id} className={`relative group ${m.opacity ? "opacity-70" : ""}`}>
              {m.status === "en-cours" && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500" />
              )}
              <div className="relative bg-[#1c1b1b] rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-[#0e0e0e] shrink-0">
                  <img src={m.img} alt={m.vehicle} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                        {m.vehicle}
                      </h3>
                      <p
                        className={`text-xs font-bold tracking-widest px-2 py-0.5 rounded inline-block mt-1 uppercase ${
                          m.plateColor === "green"
                            ? "text-[#66ff8e] bg-[#66ff8e]/10"
                            : "text-zinc-500 bg-zinc-800"
                        }`}
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                      >
                        {m.plate}
                      </p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {[
                      { label: "Départ", value: m.from, dot: m.status !== "planifiee" ? "green" : "gray" },
                      { label: "Arrivée", value: m.to, dot: m.status === "terminee" ? "green" : "gray" },
                    ].map((loc) => (
                      <div key={loc.label} className="flex items-center gap-3">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            loc.dot === "green"
                              ? "bg-[#66ff8e] shadow-[0_0_8px_#66ff8e]"
                              : "bg-[#444748]"
                          }`}
                        />
                        <div>
                          <p className="text-[10px] text-[#c4c7c8] uppercase tracking-widest font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            {loc.label}
                          </p>
                          <p className="text-sm text-white font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                            {loc.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined text-lg ${m.status === "terminee" ? "text-[#66ff8e]" : "text-zinc-500"}`}
                        style={m.status === "terminee" ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {m.timeIcon}
                      </span>
                      <span className="text-xs text-[#c4c7c8]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        {m.time}
                      </span>
                    </div>
                    <button className="text-xs font-bold text-white uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1" style={{ fontFamily: "Inter, sans-serif" }}>
                      {m.actionLabel}
                      <span className="material-symbols-outlined align-middle text-sm">{m.actionIcon}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-4 pb-4 bg-neutral-950/80 backdrop-blur-xl rounded-t-2xl z-50 shadow-[0_-4px_24px_rgba(255,255,255,0.02)]">
        {[
          { icon: "dashboard", label: "Dashboard", href: "/client/dashboard", active: false },
          { icon: "local_shipping", label: "Missions", href: "/client/missions", active: true },
          { icon: "receipt_long", label: "Facturation", href: "#", active: false },
          { icon: "settings", label: "Paramètres", href: "#", active: false },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center transition-all ${item.active ? "text-white scale-110" : "text-zinc-600 hover:text-zinc-300"}`}
          >
            <span className="material-symbols-outlined mb-1" style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              {item.icon}
            </span>
            <span className="font-medium text-[10px] uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif" }}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
