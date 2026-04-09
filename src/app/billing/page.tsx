"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Client = { id: string; full_name: string | null; company: string | null };
type Invoice = {
  id: string;
  amount: number;
  date: string;
  file_url: string;
  file_name: string | null;
  created_at: string;
  client_id: string;
  client?: { full_name: string | null; company: string | null };
};

const CONVOYEUR_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/missions" },
  { icon: "add_circle", label: "Nouvelle mission", href: "/missions/new" },
  { icon: "receipt_long", label: "Facturation", href: "/billing" },
  { icon: "person", label: "Profil", href: "/profile" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default function BillingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!profile || (profile.role !== "admin" && profile.role !== "convoyeur")) {
        router.push("/dashboard"); return;
      }
      setIsAdmin(profile.role === "admin");

      // Fetch clients (join via profiles for name/company)
      const { data: clientRows } = await supabase
        .from("clients")
        .select("id, profiles(full_name, company)");

      type ProfileRel = { full_name: string | null; company: string | null };
      type ClientRow = { id: string; profiles: ProfileRel | ProfileRel[] | null };
      const mapped: Client[] = (clientRows as ClientRow[] ?? []).map((c) => {
        const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
        return { id: c.id, full_name: prof?.full_name ?? null, company: prof?.company ?? null };
      });
      setClients(mapped);

      await loadInvoices();
      setLoading(false);
    }
    init();
  }, [router]);

  async function loadInvoices() {
    const { data } = await supabase
      .from("invoices")
      .select("id, amount, date, file_url, file_name, created_at, client_id, clients(profiles(full_name, company))")
      .order("date", { ascending: false });

    type InvProfileRel = { full_name: string | null; company: string | null };
    type InvClientsRel = { profiles: InvProfileRel | InvProfileRel[] | null } | null;
    type InvRow = {
      id: string; amount: number; date: string; file_url: string;
      file_name: string | null; created_at: string; client_id: string;
      clients: InvClientsRel;
    };
    const mapped: Invoice[] = (data as InvRow[] ?? []).map((inv) => {
      const clientsRel = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
      const prof = clientsRel
        ? (Array.isArray(clientsRel.profiles) ? clientsRel.profiles[0] : clientsRel.profiles)
        : null;
      return { ...inv, client: { full_name: prof?.full_name ?? null, company: prof?.company ?? null } };
    });
    setInvoices(mapped);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(false);

    if (!selectedClientId || !amount || !date || !file) {
      setUploadError("Tous les champs sont requis.");
      return;
    }

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split(".").pop();
    const path = `${selectedClientId}/${Date.now()}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("invoices")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (storageError) {
      setUploadError(`Erreur upload : ${storageError.message}`);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("invoices").getPublicUrl(path);

    const { error: dbError } = await supabase.from("invoices").insert({
      client_id: selectedClientId,
      amount: parseFloat(amount),
      date,
      file_url: publicUrl,
      file_name: file.name,
      created_by: user.id,
    });

    setUploading(false);

    if (dbError) {
      setUploadError(`Erreur base de données : ${dbError.message}`);
      return;
    }

    setUploadSuccess(true);
    setSelectedClientId("");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowForm(false);
    await loadInvoices();
    setTimeout(() => setUploadSuccess(false), 4000);
  }

  async function handleDownload(inv: Invoice) {
    window.open(inv.file_url, "_blank");
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
          <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text" style={{ fontFamily: "Inter, sans-serif" }}>
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
                item.href === "/billing" ? "bg-white/10 text-white" : "text-[#949493] hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={item.href === "/billing" ? { fontVariationSettings: "'FILL' 1" } : undefined}
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
      <div className="md:ml-60 pb-28 md:pb-10">

        {/* TopAppBar (mobile only) */}
        <header className="md:hidden fixed top-0 w-full z-50 bg-[#0A0A0A]/80 backdrop-blur-xl flex justify-between items-center px-6 h-16">
          <h1 className="text-xl font-bold tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400" style={{ fontFamily: "Inter, sans-serif" }}>
            Motors Line
          </h1>
        </header>

        <main className="pt-24 md:pt-8 px-6 max-w-lg md:max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                Facturation
              </h2>
              <p className="text-[#949493] text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Gérez et envoyez les factures clients
              </p>
            </div>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 bg-white text-[#0A0A0A] px-5 py-2.5 rounded-full text-sm font-bold hover:bg-white/90 transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Ajouter
            </button>
          </div>

          {/* Upload form */}
          {showForm && (
            <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04] mb-8">
              <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Nouvelle facture
              </h3>
              <form onSubmit={handleUpload} className="flex flex-col gap-4">
                <div>
                  <label className={labelClass} style={{ fontFamily: "Montserrat, sans-serif" }}>Client</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className={`${inputClass} cursor-pointer`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company ?? c.full_name ?? c.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} style={{ fontFamily: "Montserrat, sans-serif" }}>Montant (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className={inputClass}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontFamily: "Montserrat, sans-serif" }}>Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={inputClass}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} style={{ fontFamily: "Montserrat, sans-serif" }}>Fichier PDF</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.PDF"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-[#949493] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#2a2a2a] file:text-white file:font-semibold file:text-xs hover:file:bg-[#3a3939] cursor-pointer"
                  />
                </div>

                {uploadError && (
                  <p className="text-[#ffb4ab] text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>{uploadError}</p>
                )}

                <div className="flex gap-3 mt-1">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-6 py-3 bg-white text-[#0A0A0A] rounded-xl text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {uploading ? "Envoi en cours…" : "Envoyer la facture"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 bg-[#2a2a2a] text-[#c4c7c8] rounded-xl text-sm font-bold hover:bg-[#3a3939] transition-colors"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </section>
          )}

          {uploadSuccess && (
            <div className="mb-6 px-5 py-3 bg-[#66ff8e]/10 border border-[#66ff8e]/20 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-[#66ff8e] text-lg">check_circle</span>
              <p className="text-[#66ff8e] text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Facture envoyée avec succès.
              </p>
            </div>
          )}

          {/* Invoice list */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <span className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Chargement…</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <span className="material-symbols-outlined text-[#444748] text-5xl">receipt_long</span>
              <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Aucune facture pour l'instant</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {invoices.map((inv) => {
                const clientName = inv.client?.company ?? inv.client?.full_name ?? "—";
                return (
                  <div
                    key={inv.id}
                    className="bg-[#1c1b1b] rounded-2xl px-5 py-4 flex items-center justify-between gap-4 border border-white/[0.03]"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white/60 text-lg">description</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate" style={{ fontFamily: "Inter, sans-serif" }}>
                          {clientName}
                        </p>
                        <p className="text-[#949493] text-xs truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {inv.file_name ?? "Facture"} · {formatDate(inv.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-white font-bold text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                        {formatAmount(inv.amount)}
                      </span>
                      <button
                        onClick={() => handleDownload(inv)}
                        className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white transition-colors uppercase tracking-widest"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl fixed bottom-0 w-full z-50 rounded-t-2xl border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.05)]">
          <div className="flex justify-around items-center pt-3 pb-6 px-4 max-w-md mx-auto">
            {[
              { icon: "dashboard", href: "/dashboard" },
              { icon: "local_shipping", href: "/missions" },
              { icon: "add_circle", href: "/missions/new" },
              { icon: "receipt_long", href: "/billing" },
              { icon: "person", href: "/profile" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center transition-colors ${item.href === "/billing" ? "text-white scale-110" : "text-[#949493] hover:text-white"}`}
              >
                <span className="material-symbols-outlined" style={item.href === "/billing" ? { fontVariationSettings: "'FILL' 1" } : undefined}>
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
