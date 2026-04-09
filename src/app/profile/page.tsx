"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CONVOYEUR_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/missions" },
  { icon: "add_circle", label: "Nouvelle mission", href: "/missions/new" },
  { icon: "receipt_long", label: "Facturation", href: "/billing" },
  { icon: "person", label: "Profil", href: "/profile" },
];

export default function ConvoyeurProfilePage() {
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
  const [isAdmin, setIsAdmin] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, company, notifications_email, role")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setCompany(data.company ?? "");
        setNotificationsEmail(data.notifications_email ?? true);
        setIsAdmin(data.role === "admin");
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
    router.push("/login");
  }

  const inputClass = "w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444748] focus:outline-none focus:border-white/30 transition-colors";
  const labelClass = "block text-[10px] text-[#949493] uppercase tracking-widest mb-1.5 font-semibold";

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen antialiased">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#0A0A0A] border-r border-[#2A2A2A] z-50 py-8 px-4">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text overflow-visible pr-1" style={{ fontFamily: "Inter, sans-serif" }}>
            Motors Line
          </h1>
          <p className="text-[10px] text-[#949493] uppercase tracking-widest mt-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Espace Convoyeur
          </p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {CONVOYEUR_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                item.href === "/profile" ? "bg-white/10 text-white" : "text-[#949493] hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={item.href === "/profile" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{item.label}</span>
            </Link>
          ))}
        </nav>
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#949493] hover:text-white hover:bg-white/5 transition-colors mt-1"
          >
            <span className="material-symbols-outlined text-xl">swap_horiz</span>
            <span className="font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Espace admin</span>
          </Link>
        )}
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
        <header className="md:hidden fixed top-0 w-full z-50 bg-[#0A0A0A]/80 backdrop-blur-xl flex justify-between items-center px-6 h-16">
          <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#949493] via-[#E0E0E0] to-[#949493] pr-1" style={{ fontFamily: "Inter, sans-serif" }}>
            Motors Line
          </span>
        </header>

        <main className="pt-24 md:pt-8 pb-8 px-4 md:px-6 max-w-lg md:max-w-2xl mx-auto">

          <div className="mb-8">
            <h2 className="text-[26px] font-semibold text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
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
                      className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors focus:outline-none ${notificationsEmail ? "bg-white" : "bg-[#353534]"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform ${notificationsEmail ? "translate-x-6 bg-[#0A0A0A]" : "translate-x-0 bg-[#6b6b6a]"}`} />
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

        {/* Logout button (mobile only) */}
        <div className="md:hidden px-6 pb-28 pt-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 rounded-xl border border-[#EF4444] text-[#EF4444] text-sm font-semibold transition-opacity active:opacity-70"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Déconnexion
          </button>
        </div>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl fixed bottom-0 w-full z-50 rounded-t-2xl border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.05)]">
          <div className="flex justify-around items-center pt-3 pb-6 px-4">
            {[
              { icon: "dashboard", href: "/dashboard" },
              { icon: "local_shipping", href: "/missions" },
              { icon: "add_circle", href: "/missions/new" },
              { icon: "person", href: "/profile" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center transition-colors ${item.href === "/profile" ? "text-white scale-110" : "text-[#949493] hover:text-white"}`}
              >
                <span className="material-symbols-outlined" style={item.href === "/profile" ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.icon}
                </span>
              </Link>
            ))}
          </div>
        </nav>

      </div>
    </div>
  );
}
