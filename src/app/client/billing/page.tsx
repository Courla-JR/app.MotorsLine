"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Invoice = {
  id: string;
  amount: number;
  date: string;
  file_url: string;
  file_name: string | null;
  created_at: string;
};

const CLIENT_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/client/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/client/missions" },
  { icon: "add_circle", label: "Nouvelle", href: "/client/missions/new" },
  { icon: "receipt_long", label: "Facturation", href: "/client/billing" },
  { icon: "person", label: "Profil", href: "/client/profile" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default function ClientBillingPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/client/login"); return; }

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!client) { setLoading(false); return; }

      const { data } = await supabase
        .from("invoices")
        .select("id, amount, date, file_url, file_name, created_at")
        .eq("client_id", client.id)
        .order("date", { ascending: false });

      setInvoices((data as Invoice[]) ?? []);
      setLoading(false);
    }
    fetchInvoices();
  }, [router]);

  async function handleDownload(inv: Invoice) {
    setDownloadingId(inv.id);
    const res = await fetch(`/api/billing/download-invoice?invoice_id=${inv.id}`);
    setDownloadingId(null);
    if (!res.ok) return;
    const { url } = await res.json();
    const newWindow = window.open(url, '_blank');
    if (!newWindow || newWindow.closed) {
      window.location.href = url;
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "user-role=; path=/; Max-Age=0";
    router.push("/client/login");
  }

  const totalDue = invoices.reduce((s, inv) => s + inv.amount, 0);

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen antialiased">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#0A0A0A] border-r border-[#2A2A2A] z-50 py-8 px-4">
        <div className="mb-10 px-2">
          <Link href="/client/dashboard" className="cursor-pointer">
            <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text overflow-visible pr-1" style={{ fontFamily: "Inter, sans-serif" }}>
              Motors Line
            </h1>
          </Link>
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
                item.href === "/client/billing" ? "bg-white/10 text-white" : "text-[#949493] hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={item.href === "/client/billing" ? { fontVariationSettings: "'FILL' 1" } : undefined}
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
      <div className="md:ml-60 pb-28 md:pb-10">

        {/* TopAppBar (mobile only) */}
        <header className="md:hidden fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-xl flex justify-between items-center px-6 h-16">
          <Link href="/client/dashboard" className="cursor-pointer">
            <h1
              className="text-xl font-bold tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400 overflow-visible pr-1"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Motors Line
            </h1>
          </Link>
        </header>

        <main className="pt-24 md:pt-8 px-6 max-w-lg md:max-w-3xl mx-auto">

          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: "Inter, sans-serif" }}>
              Facturation
            </h2>
            <p className="text-[#949493] text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Vos factures de convoyage
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <span className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Chargement…</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[#111] rounded-2xl border border-white/5">
              <span className="material-symbols-outlined text-[#444748] text-5xl">receipt_long</span>
              <p className="text-white font-semibold text-lg" style={{ fontFamily: "Inter, sans-serif" }}>
                Aucune facture
              </p>
              <p className="text-[#949493] text-sm text-center max-w-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Vos factures apparaîtront ici dès qu'elles seront disponibles.
              </p>
            </div>
          ) : (
            <>
              {/* Summary card */}
              <div className="bg-[#1c1b1b] rounded-2xl p-6 mb-6 border border-white/[0.03] flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Total facturé
                  </p>
                  <p className="text-3xl font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                    {formatAmount(totalDue)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/60">receipt_long</span>
                </div>
              </div>

              {/* Invoice list */}
              <div className="flex flex-col gap-3">
                {invoices.map((inv) => (
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
                          {inv.file_name ?? "Facture"}
                        </p>
                        <p className="text-[#949493] text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {formatDate(inv.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      <span className="text-white font-bold text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                        {formatAmount(inv.amount)}
                      </span>
                      <button
                        onClick={() => handleDownload(inv)}
                        disabled={downloadingId === inv.id}
                        className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white transition-colors uppercase tracking-widest disabled:opacity-40"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {downloadingId === inv.id ? "hourglass_empty" : "download"}
                        </span>
                        <span className="hidden sm:inline">
                          {downloadingId === inv.id ? "…" : "Télécharger"}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0A]/80 backdrop-blur-xl rounded-t-2xl z-50 border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.02)]">
          <div className="flex justify-around items-center h-16 px-4">
            {CLIENT_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-center transition-colors ${item.href === "/client/billing" ? "text-white" : "text-[#949493] hover:text-white"}`}
              >
                <span className="material-symbols-outlined" style={item.href === "/client/billing" ? { fontVariationSettings: "'FILL' 1" } : undefined}>
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
