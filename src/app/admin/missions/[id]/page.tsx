"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type MissionStatus = "a_faire" | "prise_en_charge" | "en_cours" | "terminee" | "annulee";

const STATUS_LABELS: Record<MissionStatus, string> = {
  a_faire: "À faire",
  prise_en_charge: "Prise en charge",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

type Client = { id: string; company_name: string };

type ExpenseType = "carburant" | "peage" | "parking" | "repas" | "hotel" | "autre";

type Expense = {
  id: string;
  mission_id: string;
  type: ExpenseType;
  amount: number;
  description: string | null;
  receipt_url: string | null;
  created_at: string;
};

const EXPENSE_LABELS: Record<ExpenseType, string> = {
  carburant: "Carburant",
  peage:     "Péage",
  parking:   "Parking",
  repas:     "Repas",
  hotel:     "Hôtel",
  autre:     "Autre",
};

const EXPENSE_ICONS: Record<ExpenseType, string> = {
  carburant: "local_gas_station",
  peage:     "toll",
  parking:   "local_parking",
  repas:     "restaurant",
  hotel:     "hotel",
  autre:     "receipt",
};

const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (let m = 0; m < 60; m += 15) {
    if (h === 22 && m > 0) break;
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

export default function AdminEditMissionPage() {
  const router = useRouter();
  const params = useParams();
  const missionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Form fields
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [color, setColor] = useState("");
  const [vin, setVin] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [status, setStatus] = useState<MissionStatus>("a_faire");
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function bootstrap() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") { router.push("/dashboard"); return; }

      const [{ data: mission }, { data: clientsData }, { data: expensesData }] = await Promise.all([
        supabase
          .from("missions")
          .select("*")
          .eq("id", missionId)
          .single(),
        supabase.from("clients").select("id, company_name").order("company_name"),
        supabase.from("mission_expenses").select("*").eq("mission_id", missionId).order("created_at", { ascending: true }),
      ]);

      if (!mission) { router.push("/admin"); return; }

      setBrand(mission.vehicle_brand ?? "");
      setModel(mission.vehicle_model ?? "");
      setPlate(mission.vehicle_plate ?? "");
      setColor(mission.vehicle_color ?? "");
      setVin(mission.vehicle_vin ?? "");
      setPickupAddress(mission.pickup_address ?? "");
      setDeliveryAddress(mission.delivery_address ?? "");
      setStatus(mission.status ?? "a_faire");
      setClientId(mission.client_id ?? "");
      setNotes(mission.notes ?? "");

      if (mission.pickup_date) {
        const d = new Date(mission.pickup_date);
        setPickupDate(d.toISOString().slice(0, 10));
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        setPickupTime(`${hh}:${mm}`);
      }

      setClients((clientsData as Client[]) ?? []);
      setExpenses((expensesData as Expense[]) ?? []);
      setLoading(false);
    }
    bootstrap();
  }, [missionId, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const pickupDatetime = pickupDate && pickupTime
      ? new Date(`${pickupDate}T${pickupTime}`).toISOString()
      : pickupDate ? new Date(pickupDate).toISOString() : null;

    const { error: updateError } = await supabase
      .from("missions")
      .update({
        vehicle_brand: brand,
        vehicle_model: model,
        vehicle_plate: plate,
        vehicle_color: color || null,
        vehicle_vin: vin || null,
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress,
        pickup_date: pickupDatetime,
        status,
        client_id: clientId || null,
        notes: notes || null,
      })
      .eq("id", missionId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // Notify client of status change
    console.log("AVANT FETCH NOTIFICATION", { missionId, status });
    try {
      const res = await fetch("/api/missions/status-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission_id: missionId, new_status: status }),
      });
      const json = await res.json();
      console.log("APRÈS FETCH NOTIFICATION", json);
    } catch (err) {
      console.error("[status-notification] fetch error:", err);
    }

    router.push("/admin");
  }

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#1c1b1b]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/admin" className="shrink-0">
              <span className="material-symbols-outlined text-[#949493] hover:text-white cursor-pointer transition-colors">
                arrow_back
              </span>
            </Link>
            <Link href="/admin" className="cursor-pointer shrink-0">
              <span className="text-base sm:text-xl font-bold italic tracking-tighter silver-gradient-text overflow-visible pr-1">
                Motors Line
              </span>
            </Link>
            <span className="text-[10px] uppercase tracking-widest text-[#444748] font-medium px-1.5 py-0.5 rounded border border-[#2a2a2a] shrink-0">
              Admin
            </span>
          </div>
          <h1 className="text-sm font-semibold text-[#949493] truncate">Modifier la mission</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Chargement…</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">

            {/* Véhicule */}
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#949493] text-sm">directions_car</span>
                Véhicule
              </h2>
              <div className="bg-[#1A1A1A] p-5 rounded-xl space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Marque</label>
                    <input required value={brand} onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-[#131313] rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-[0.5px] focus:ring-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Modèle</label>
                    <input required value={model} onChange={(e) => setModel(e.target.value)}
                      className="w-full bg-[#131313] rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-[0.5px] focus:ring-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Immatriculation</label>
                    <input required value={plate} onChange={(e) => setPlate(e.target.value)}
                      className="w-full bg-[#131313] rounded-lg p-3 text-white text-sm font-mono focus:outline-none focus:ring-[0.5px] focus:ring-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Couleur</label>
                    <input value={color} onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-[#131313] rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-[0.5px] focus:ring-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Numéro VIN</label>
                  <input value={vin} onChange={(e) => setVin(e.target.value)}
                    className="w-full bg-[#131313] rounded-lg p-3 text-white text-sm font-mono focus:outline-none focus:ring-[0.5px] focus:ring-white" />
                </div>
              </div>
            </section>

            {/* Itinéraire */}
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#949493] text-sm">route</span>
                Itinéraire
              </h2>
              <div className="bg-[#1A1A1A] p-5 rounded-xl space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Adresse de départ</label>
                  <input required value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full bg-[#131313] rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-[0.5px] focus:ring-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Adresse d'arrivée</label>
                  <input required value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-[#131313] rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-[0.5px] focus:ring-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Date</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-[#131313] rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-[0.5px] focus:ring-white [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#c4c7c8] uppercase font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>Heure</label>
                    <div className="relative">
                      <select
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full bg-[#131313] rounded-lg p-3 text-white text-sm appearance-none pr-8 focus:outline-none focus:ring-[0.5px] focus:ring-white"
                      >
                        <option value="">— Heure —</option>
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-3 text-[#949493] text-base pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Statut */}
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Statut</h2>
              <div className="bg-[#1A1A1A] p-5 rounded-xl">
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MissionStatus)}
                    className="w-full bg-[#131313] rounded-lg p-3 text-white text-sm appearance-none pr-8 focus:outline-none focus:ring-[0.5px] focus:ring-white"
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-3 text-[#949493] text-base pointer-events-none">expand_more</span>
                </div>
              </div>
            </section>

            {/* Client */}
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#949493] text-sm">domain</span>
                Client
              </h2>
              <div className="bg-[#1A1A1A] p-5 rounded-xl">
                <div className="relative">
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-[#131313] rounded-lg p-3 text-white text-sm appearance-none pr-8 focus:outline-none focus:ring-[0.5px] focus:ring-white"
                  >
                    <option value="">— Sans client —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-3 text-[#949493] text-base pointer-events-none">expand_more</span>
                </div>
              </div>
            </section>

            {/* Notes */}
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#949493] text-sm">sticky_note_2</span>
                Notes logistiques
              </h2>
              <div className="bg-[#1A1A1A] p-5 rounded-xl">
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions, accès site, contact sur place..."
                  className="w-full bg-[#131313] rounded-lg p-3 text-white text-sm resize-none placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                />
              </div>
            </section>

            {/* Frais de mission (read-only) */}
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#949493] text-sm">receipt_long</span>
                Frais de mission
              </h2>
              <div className="bg-[#1A1A1A] p-5 rounded-xl">
                {expenses.length === 0 ? (
                  <p className="text-[#444748] text-xs text-center py-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Aucun frais enregistré</p>
                ) : (
                  <div className="space-y-2">
                    {expenses.map((exp) => (
                      <div key={exp.id} className="flex items-center gap-3 bg-[#131313] rounded-xl px-4 py-3">
                        <span className="material-symbols-outlined text-[#949493] shrink-0" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>
                          {EXPENSE_ICONS[exp.type as ExpenseType]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                            {EXPENSE_LABELS[exp.type as ExpenseType]}
                            {exp.description && <span className="text-[#949493] font-normal"> · {exp.description}</span>}
                          </p>
                          {exp.receipt_url && (
                            <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#949493] underline" style={{ fontFamily: "Montserrat, sans-serif" }}>
                              Voir le ticket
                            </a>
                          )}
                        </div>
                        <p className="text-white font-bold text-sm shrink-0" style={{ fontFamily: "Inter, sans-serif" }}>
                          {exp.amount.toFixed(2)} €
                        </p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
                      <span className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>Total frais</span>
                      <span className="text-white font-bold text-base" style={{ fontFamily: "Inter, sans-serif" }}>
                        {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {error && (
              <p className="text-[#ffb4ab] text-sm text-center" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {error}
              </p>
            )}

            <div className="flex gap-3 pb-10">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-14 rounded-full font-bold text-base text-[#0A0A0A] active:scale-95 transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(to right, #949493, #E0E0E0, #949493)" }}
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              <Link
                href="/admin"
                className="px-8 h-14 flex items-center justify-center rounded-full bg-[#1A1A1A] text-[#949493] font-semibold text-sm hover:text-white transition-colors"
              >
                Annuler
              </Link>
            </div>

          </form>
        )}
      </main>
    </div>
  );
}
