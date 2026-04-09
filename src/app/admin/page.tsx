"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────

type MissionStatus = "a_faire" | "en_cours" | "terminee" | "annulee";

type Mission = {
  id: string;
  status: MissionStatus;
  type: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_image_url?: string | null;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  convoyeur_id: string | null;
  client_id: string | null;
  clients: { company_name: string } | null;
  profiles: { full_name: string | null } | null;
};

type Client = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
};

type Tab = "missions" | "clients";
type Filter = "toutes" | "a_faire" | "en_cours" | "terminee" | "annulee";

type CreateClientForm = {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
};

// ─── Helpers ──────────────────────────────────────────────

const STATUS_LABELS: Record<MissionStatus, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

const STATUS_CLASSES: Record<MissionStatus, string> = {
  a_faire: "bg-[#2a2a2a] text-[#c4c7c8]",
  en_cours: "bg-white text-[#0A0A0A]",
  terminee: "bg-[#66ff8e]/10 text-[#66ff8e]",
  annulee: "bg-[#ffb4ab]/10 text-[#ffb4ab]",
};

function StatusBadge({ status }: { status: MissionStatus }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ─── Main Component ───────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("missions");
  const [filter, setFilter] = useState<Filter>("toutes");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [createClientForm, setCreateClientForm] = useState<CreateClientForm>({
    company_name: "", contact_name: "", email: "", phone: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingMission, setDeletingMission] = useState<string | null>(null);

  // Stats
  const stats = {
    total: missions.length,
    en_cours: missions.filter((m) => m.status === "en_cours").length,
    a_faire: missions.filter((m) => m.status === "a_faire").length,
    terminee: missions.filter((m) => m.status === "terminee").length,
  };

  const filtered = filter === "toutes" ? missions : missions.filter((m) => m.status === filter);

  useEffect(() => {
    async function bootstrap() {
      // Guard: must be admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") { router.push("/dashboard"); return; }

      await Promise.all([fetchMissions(), fetchClients()]);
      setLoading(false);
    }
    bootstrap();
  }, [router]);

  async function fetchMissions() {
    const withImg = `id, status, type, vehicle_brand, vehicle_model, vehicle_plate, vehicle_image_url, pickup_address, delivery_address, pickup_date, convoyeur_id, client_id, clients ( company_name ), profiles ( full_name )`;
    const withoutImg = `id, status, type, vehicle_brand, vehicle_model, vehicle_plate, pickup_address, delivery_address, pickup_date, convoyeur_id, client_id, clients ( company_name ), profiles ( full_name )`;

    let { data, error } = await supabase.from("missions").select(withImg).order("created_at", { ascending: false });

    if (error) {
      const fallback = await supabase.from("missions").select(withoutImg).order("created_at", { ascending: false });
      data = fallback.data as any;
    }

    setMissions((data as unknown as Mission[]) ?? []);
  }

  async function fetchClients() {
    const { data } = await supabase
      .from("clients")
      .select("id, company_name, contact_name, email, phone")
      .order("company_name");
    setClients((data as Client[]) ?? []);
  }

  async function updateStatus(missionId: string, status: MissionStatus) {
    await supabase.from("missions").update({ status }).eq("id", missionId);
    await fetchMissions();
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    const res = await fetch("/api/invite-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createClientForm),
    });
    const json = await res.json();

    if (!res.ok) {
      setCreateError(json.error ?? "Erreur lors de la création.");
    } else {
      setCreateSuccess(`Invitation envoyée à ${createClientForm.email}.`);
      setCreateClientForm({ company_name: "", contact_name: "", email: "", phone: "" });
      await fetchClients();
      setTimeout(() => {
        setShowCreateClient(false);
        setCreateSuccess(null);
      }, 2000);
    }
    setCreating(false);
  }

  async function handleDeleteMission(missionId: string, label: string) {
    if (!window.confirm(`Supprimer cette mission ?\n\n${label}\n\nCette action est irréversible.`)) return;
    setDeletingMission(missionId);
    await supabase.from("missions").delete().eq("id", missionId);
    await fetchMissions();
    setDeletingMission(null);
  }

  async function handleDeleteClient(c: Client) {
    if (!window.confirm(`Supprimer ce client ?\n\n${c.company_name} — ${c.email ?? ""}\n\nCette action est irréversible.`)) return;

    setDeleting(c.id);

    await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: c.id }),
    });

    await fetchClients();
    setDeleting(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen pb-10" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#1c1b1b]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#949493] via-[#E0E0E0] to-[#949493]">
              Motors Line
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#444748] font-medium px-2 py-0.5 rounded border border-[#2a2a2a]">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-[#1c1b1b] border border-white/10 text-[#c4c7c8] rounded-full text-sm font-semibold hover:text-white hover:border-white/20 transition-colors"
            >
              <span className="material-symbols-outlined text-base">swap_horiz</span>
              Espace convoyeur
            </Link>
            <Link
              href="/missions/new"
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#0A0A0A] rounded-full text-sm font-bold hover:bg-zinc-100 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Nouvelle mission
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-[#949493] hover:text-white transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8">

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total", value: stats.total, color: "text-white" },
            { label: "À faire", value: stats.a_faire, color: "text-[#c4c7c8]" },
            { label: "En cours", value: stats.en_cours, color: "text-white" },
            { label: "Terminées", value: stats.terminee, color: "text-[#66ff8e]" },
          ].map((s) => (
            <div key={s.label} className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
              <p className="text-[#949493] text-xs uppercase tracking-widest mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {s.label}
              </p>
              <p className={`text-3xl font-bold ${s.color}`}>
                {loading ? "—" : s.value}
              </p>
            </div>
          ))}
        </section>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-[#1c1b1b]">
          {(["missions", "clients"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "text-white border-white"
                  : "text-[#949493] border-transparent hover:text-white"
              }`}
            >
              {t === "missions" ? `Missions${!loading ? ` (${stats.total})` : ""}` : `Clients${!loading ? ` (${clients.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* ── MISSIONS TAB ── */}
        {tab === "missions" && (
          <>
            {/* Filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-6">
              {(["toutes", "a_faire", "en_cours", "terminee", "annulee"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap font-semibold transition-all ${
                    filter === f ? "bg-white text-[#0A0A0A]" : "bg-[#1c1b1b] text-[#c4c7c8] hover:bg-[#2a2a2a]"
                  }`}
                >
                  {f === "toutes" ? "Toutes" : STATUS_LABELS[f as MissionStatus]}
                </button>
              ))}
            </div>

            {loading && (
              <div className="flex justify-center py-20">
                <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Chargement...</p>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center py-20 gap-3">
                <span className="material-symbols-outlined text-[#444748] text-5xl">local_shipping</span>
                <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Aucune mission</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((m) => (
                <div key={m.id} className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors cursor-pointer" onClick={() => router.push(`/admin/missions/${m.id}`)}>
                  {m.vehicle_image_url && (
                    <div className="h-36 w-full overflow-hidden relative">
                      <img src={m.vehicle_image_url} alt={`${m.vehicle_brand} ${m.vehicle_model}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1A1A1A]/70" />
                    </div>
                  )}
                  <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-bold text-base">
                          {m.vehicle_brand} {m.vehicle_model}
                        </h3>
                        <span className="text-[10px] font-mono text-[#949493] bg-[#131313] px-2 py-0.5 rounded">
                          {m.vehicle_plate}
                        </span>
                        <StatusBadge status={m.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#949493]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        <span>{m.clients?.company_name ?? "—"}</span>
                        <span>·</span>
                        <span className="capitalize">{m.type}</span>
                        {m.pickup_date && (
                          <>
                            <span>·</span>
                            <span>{formatDate(m.pickup_date)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status select */}
                      <div className="relative">
                        <select
                          value={m.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => { e.stopPropagation(); updateStatus(m.id, e.target.value as MissionStatus); }}
                          className="bg-[#131313] border border-[#2a2a2a] text-white text-xs rounded-lg px-3 py-2 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20"
                        >
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-2 text-[#949493] text-sm pointer-events-none">
                          expand_more
                        </span>
                      </div>
                      {/* Delete mission */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMission(m.id, `${m.vehicle_brand} ${m.vehicle_model}`); }}
                        disabled={deletingMission === m.id}
                        title="Supprimer cette mission"
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-[#444748] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-base">
                          {deletingMission === m.id ? "hourglass_empty" : "delete"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-3 mb-4 text-sm">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      <div className="w-px h-4 bg-[#353534]" />
                      <div className="w-1.5 h-1.5 rounded-full border border-[#949493]" />
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <span className="text-[#e5e2e1] truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>{m.pickup_address}</span>
                      <span className="text-[#e5e2e1] truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>{m.delivery_address}</span>
                    </div>
                  </div>

                  {/* Convoyeur assigné */}
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <span className="material-symbols-outlined text-[#949493] text-sm">person_pin</span>
                    <span className="text-[#949493] text-xs shrink-0" style={{ fontFamily: "Montserrat, sans-serif" }}>Convoyeur :</span>
                    <span className="text-white text-xs font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>Jeremy Courla</span>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── CLIENTS TAB ── */}
        {tab === "clients" && (
          <>
            {/* Create client button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => { setShowCreateClient((v) => !v); setCreateError(null); setCreateSuccess(null); }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#0A0A0A] rounded-full text-sm font-bold hover:bg-zinc-100 transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                Inviter un client
              </button>
            </div>

            {/* Create client form */}
            {showCreateClient && (
              <div className="mb-8 bg-[#141414] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold text-base mb-5" style={{ fontFamily: "Inter, sans-serif" }}>
                  Nouveau client
                </h3>
                <form onSubmit={handleCreateClient} className="grid gap-4 sm:grid-cols-2">
                  {/* Company name */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-[#949493]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Raison sociale *
                    </label>
                    <input
                      type="text"
                      required
                      value={createClientForm.company_name}
                      onChange={(e) => setCreateClientForm((f) => ({ ...f, company_name: e.target.value }))}
                      placeholder="Acme SAS"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/20 text-sm placeholder:text-zinc-600"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    />
                  </div>
                  {/* Contact name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-[#949493]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Nom du contact
                    </label>
                    <input
                      type="text"
                      value={createClientForm.contact_name}
                      onChange={(e) => setCreateClientForm((f) => ({ ...f, contact_name: e.target.value }))}
                      placeholder="Jean Dupont"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/20 text-sm placeholder:text-zinc-600"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    />
                  </div>
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-[#949493]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={createClientForm.phone}
                      onChange={(e) => setCreateClientForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+33 6 00 00 00 00"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/20 text-sm placeholder:text-zinc-600"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    />
                  </div>
                  {/* Email */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-[#949493]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Email d'invitation *
                    </label>
                    <input
                      type="email"
                      required
                      value={createClientForm.email}
                      onChange={(e) => setCreateClientForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="contact@acme.fr"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/20 text-sm placeholder:text-zinc-600"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    />
                  </div>

                  {createError && (
                    <p className="sm:col-span-2 text-[#ffb4ab] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {createError}
                    </p>
                  )}
                  {createSuccess && (
                    <p className="sm:col-span-2 text-[#66ff8e] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {createSuccess}
                    </p>
                  )}

                  <div className="sm:col-span-2 flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 bg-white text-[#0A0A0A] font-bold py-3 rounded-full text-sm hover:bg-zinc-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? "Envoi…" : "Créer et envoyer l'invitation"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateClient(false)}
                      className="px-5 py-3 bg-[#1A1A1A] text-[#949493] font-semibold rounded-full text-sm hover:text-white transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading && (
              <div className="flex justify-center py-20">
                <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Chargement...</p>
              </div>
            )}

            {!loading && clients.length === 0 && (
              <div className="flex flex-col items-center py-20 gap-3">
                <span className="material-symbols-outlined text-[#444748] text-5xl">domain</span>
                <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Aucun client</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {clients.map((c) => {
                const clientMissions = missions.filter((m) => m.client_id === c.id);
                return (
                  <div key={c.id} className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-bold text-base mb-0.5">{c.company_name}</h3>
                        {c.contact_name && (
                          <p className="text-[#949493] text-xs" style={{ fontFamily: "Montserrat, sans-serif" }}>{c.contact_name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#949493] bg-[#131313] px-2 py-0.5 rounded">
                          {clientMissions.length} mission{clientMissions.length !== 1 ? "s" : ""}
                        </span>
                        <button
                          onClick={() => handleDeleteClient(c)}
                          disabled={deleting === c.id}
                          title="Supprimer ce client"
                          className="flex items-center justify-center w-7 h-7 rounded-lg text-[#444748] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-base">
                            {deleting === c.id ? "hourglass_empty" : "delete"}
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-[#949493]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {c.email && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">mail</span>
                          <span>{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">phone</span>
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </div>
                    {clientMissions.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/5 flex gap-2 flex-wrap">
                        {clientMissions.slice(0, 3).map((m) => (
                          <StatusBadge key={m.id} status={m.status} />
                        ))}
                        {clientMissions.length > 3 && (
                          <span className="text-[10px] text-[#949493]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            +{clientMissions.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
