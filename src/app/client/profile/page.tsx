"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CLIENT_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/client/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/client/missions" },
  { icon: "add_circle", label: "Nouvelle", href: "/client/missions/new" },
  { icon: "receipt_long", label: "Facturation", href: "/client/billing" },
  { icon: "person", label: "Profil", href: "/client/profile" },
];

export default function ClientProfilePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notificationsEmail, setNotificationsEmail] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/client/login"); return; }

      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, company, notifications_email")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setCompany(data.company ?? "");
        setNotificationsEmail(data.notifications_email ?? true);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [router]);

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    setInfoError(null);
    setInfoSuccess(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone: phone || null, company: company || null, notifications_email: notificationsEmail })
      .eq("id", user.id);

    setSavingInfo(false);
    if (error) { setInfoError(error.message); }
    else { setInfoSuccess(true); setTimeout(() => setInfoSuccess(false), 3000); }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) { setPasswordError(error.message); }
    else {
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "user-role=; path=/; Max-Age=0";
    router.push("/client/login");
  }

  const inputClass = "w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444748] focus:outline-none focus:border-white/30 transition-colors";
  const labelClass = "block text-[10px] text-[#949493] uppercase tracking-widest mb-1.5 font-semibold";

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen antialiased">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#0A0A0A] border-r border-[#2A2A2A] z-50 py-8 px-4">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text" style={{ fontFamily: "Inter, sans-serif" }}>
            Motors Line
          </h1>
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
                item.href === "/client/profile" ? "bg-white/10 text-white" : "text-[#949493] hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={item.href === "/client/profile" ? { fontVariationSettings: "'FILL' 1" } : undefined}
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
          <h1
            className="text-xl font-bold tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Motors Line
          </h1>
          <div className="w-10 h-10 rounded-full border border-white/10 bg-[#1A1A1A] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#c4c7c8] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          </div>
        </header>

        <main className="pt-24 md:pt-8 pb-8 px-4 md:px-6 max-w-lg md:max-w-2xl mx-auto">

          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
              Profil
            </h2>
            <p className="text-[#949493] text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {loading ? "Chargement..." : email}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <span className="text-[#949493] text-sm">Chargement...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6">

              {/* ── Informations personnelles ── */}
              <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Informations personnelles
                </h3>
                <form onSubmit={handleSaveInfo} className="flex flex-col gap-4">
                  <div>
                    <label className={labelClass} style={{ fontFamily: "Montserrat, sans-serif" }}>Nom complet</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jean Dupont"
                      className={inputClass}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontFamily: "Montserrat, sans-serif" }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className={`${inputClass} opacity-50 cursor-not-allowed`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontFamily: "Montserrat, sans-serif" }}>Téléphone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+33 6 00 00 00 00"
                      className={inputClass}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontFamily: "Montserrat, sans-serif" }}>Entreprise / Raison sociale</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Nom de votre entreprise"
                      className={inputClass}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>

                  {infoError && (
                    <p className="text-[#ffb4ab] text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>{infoError}</p>
                  )}
                  {infoSuccess && (
                    <p className="text-[#66ff8e] text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>Informations enregistrées.</p>
                  )}

                  <button
                    type="submit"
                    disabled={savingInfo}
                    className="mt-1 px-6 py-3 bg-white text-[#0A0A0A] rounded-xl text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {savingInfo ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </form>
              </section>

              {/* ── Sécurité ── */}
              <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Sécurité
                </h3>
                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  <div>
                    <label className={labelClass} style={{ fontFamily: "Montserrat, sans-serif" }}>Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontFamily: "Montserrat, sans-serif" }}>Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>

                  {passwordError && (
                    <p className="text-[#ffb4ab] text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>{passwordError}</p>
                  )}
                  {passwordSuccess && (
                    <p className="text-[#66ff8e] text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>Mot de passe mis à jour.</p>
                  )}

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="mt-1 px-6 py-3 bg-white text-[#0A0A0A] rounded-xl text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {savingPassword ? "Mise à jour…" : "Modifier le mot de passe"}
                  </button>
                </form>
              </section>

              {/* ── Préférences ── */}
              <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Préférences
                </h3>
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>Notifications email</p>
                      <p className="text-[#949493] text-xs mt-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>Recevoir les mises à jour de vos missions par email</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const next = !notificationsEmail;
                        setNotificationsEmail(next);
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) await supabase.from("profiles").update({ notifications_email: next }).eq("id", user.id);
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${notificationsEmail ? "bg-white" : "bg-[#353534]"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[#0A0A0A] rounded-full shadow transition-transform ${notificationsEmail ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>Langue</p>
                      <p className="text-[#949493] text-xs mt-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>Français</p>
                    </div>
                    <span className="text-[#444748] text-xs uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>Bientôt</span>
                  </div>
                </div>
              </section>
</div>
          )}
        </main>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-4 pb-4 bg-neutral-950/80 backdrop-blur-xl rounded-t-2xl z-50 shadow-[0_-4px_24px_rgba(255,255,255,0.02)]">
          {CLIENT_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-center transition-all ${item.href === "/client/profile" ? "text-white scale-110" : "text-zinc-600 hover:text-zinc-300"}`}
            >
              <span className="material-symbols-outlined" style={item.href === "/client/profile" ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {item.icon}
              </span>
            </Link>
          ))}
        </nav>

      </div>
    </div>
  );
}
