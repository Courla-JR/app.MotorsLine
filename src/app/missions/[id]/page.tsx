"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type MissionStatus = "a_faire" | "prise_en_charge" | "en_cours" | "terminee" | "annulee";

type Mission = {
  id: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string | null;
  vehicle_image_url: string | null;
  status: MissionStatus;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  delivery_date: string | null;
  notes: string | null;
  price: number | null;
  service_level: string | null;
  distance_km: string | null;
  duration: string | null;
  mileage_start: number | null;
  mileage_end: number | null;
  fuel_level_start: string | null;
  fuel_level_end: string | null;
};

const CONVOYEUR_NAV = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "local_shipping", label: "Missions", href: "/missions" },
  { icon: "add_circle", label: "Nouvelle mission", href: "/missions/new?from=convoyeur" },
  { icon: "receipt_long", label: "Facturation", href: "/billing" },
  { icon: "person", label: "Profil", href: "/profile" },
];

const STATUS_CONFIG: Record<MissionStatus, { label: string; color: string; bg: string; icon: string }> = {
  a_faire:         { label: "Planifiée",       color: "text-[#c4c7c8]",    bg: "bg-[#353534]",      icon: "schedule"       },
  prise_en_charge: { label: "Prise en charge", color: "text-[#93c5fd]",    bg: "bg-[#3b82f6]/20",   icon: "car_rental"     },
  en_cours:        { label: "En cours",        color: "text-[#002109]",    bg: "bg-[#66ff8e]",      icon: "local_shipping" },
  terminee:        { label: "Terminée",        color: "text-[#c4c7c8]/60", bg: "bg-[#2a2a2a]/40",   icon: "check_circle"   },
  annulee:         { label: "Annulée",         color: "text-[#ffb4ab]",    bg: "bg-[#ffb4ab]/10",   icon: "cancel"         },
};

const SERVICE_LABELS: Record<string, string> = {
  essentiel:  "Essentiel",
  premium:    "Premium",
  sur_mesure: "Sur Mesure",
};

type PhotoType = "before" | "after";

type SlotKey = "face_avant" | "cote_gauche" | "cote_droit" | "face_arriere" | "pare_brise" | "compteur";

type MissionPhoto = {
  id: string;
  mission_id: string;
  photo_url: string;
  type: PhotoType;
  caption: string | null;
  slot: SlotKey | null;
  created_at: string;
};

const SLOTS: { key: SlotKey; label: string; icon: string }[] = [
  { key: "face_avant",   label: "Face avant",  icon: "directions_car"  },
  { key: "cote_gauche",  label: "Côté gauche", icon: "arrow_back"      },
  { key: "cote_droit",   label: "Côté droit",  icon: "arrow_forward"   },
  { key: "face_arriere", label: "Face arrière", icon: "settings_backup_restore" },
  { key: "pare_brise",   label: "Pare-brise",  icon: "window"          },
  { key: "compteur",     label: "Compteur",    icon: "speed"           },
];

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

const STEPS = ["Planifiée", "Prise en charge", "En transit", "Livrée"] as const;

function activeStep(status: MissionStatus): number {
  if (status === "a_faire")         return 0;
  if (status === "prise_en_charge") return 1;
  if (status === "en_cours")        return 2;
  if (status === "terminee")        return 3;
  return -1;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ConvoyeurMissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const missionId = params.id as string;

  const [mission,   setMission]   = useState<Mission | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [isAdmin,   setIsAdmin]   = useState(false);

  // ── Photos ──
  const [photos,        setPhotos]        = useState<MissionPhoto[]>([]);
  const [photoTab,      setPhotoTab]      = useState<PhotoType>("before");
  const [uploading,     setUploading]     = useState<string | null>(null); // slot key or "free" or null
  const [uploadingSlot, setUploadingSlot] = useState<{ type: PhotoType; slot: SlotKey | null } | null>(null);
  const fileInputRef  = useRef<HTMLInputElement | null>(null);

  // ── Expenses ──
  const [expenses,        setExpenses]        = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expType,         setExpType]         = useState<ExpenseType>("carburant");
  const [expAmount,       setExpAmount]       = useState("");
  const [expDesc,         setExpDesc]         = useState("");
  const [expReceipt,      setExpReceipt]      = useState<File | null>(null);
  const [savingExp,       setSavingExp]       = useState(false);
  const [deletingExpId,   setDeletingExpId]   = useState<string | null>(null);
  const expReceiptRef = useRef<HTMLInputElement | null>(null);

  // ── Vehicle state (mileage + fuel) ──
  const [mileageStart,   setMileageStart]   = useState("");
  const [mileageEnd,     setMileageEnd]     = useState("");
  const [fuelLevelStart, setFuelLevelStart] = useState("");
  const [fuelLevelEnd,   setFuelLevelEnd]   = useState("");

  // ── Status update ──
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ── Geolocation tracking ──
  const [isTracking, setIsTracking] = useState(false);
  const positionRef = useRef<GeolocationCoordinates | null>(null);
  const watchIdRef  = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startTracking() {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => { positionRef.current = pos.coords; },
      (err) => console.error("[tracking] watchPosition error:", err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
    intervalRef.current = setInterval(async () => {
      if (!positionRef.current || !missionId) return;
      const { latitude, longitude, speed, heading } = positionRef.current;
      const { error } = await supabase.from("mission_tracking").upsert(
        { mission_id: missionId, latitude, longitude, speed: speed ?? null, heading: heading ?? null, updated_at: new Date().toISOString() },
        { onConflict: "mission_id" }
      );
      if (error) console.error("[tracking] upsert error:", error.message);
    }, 10_000);
    setIsTracking(true);
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
  }

  // Auto-stop tracking when status becomes terminee or component unmounts
  useEffect(() => {
    if (mission?.status === "terminee") stopTracking();
  }, [mission?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { stopTracking(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Photo helpers ──────────────────────────────────────────────────────────

  async function fetchPhotos() {
    const { data } = await supabase
      .from("mission_photos")
      .select("*")
      .eq("mission_id", missionId)
      .order("created_at", { ascending: true });
    setPhotos((data ?? []) as MissionPhoto[]);
  }

  useEffect(() => {
    if (missionId) fetchPhotos();
  }, [missionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Expense helpers ────────────────────────────────────────────────────────

  async function fetchExpenses() {
    const { data } = await supabase
      .from("mission_expenses")
      .select("*")
      .eq("mission_id", missionId)
      .order("created_at", { ascending: true });
    setExpenses((data ?? []) as Expense[]);
  }

  useEffect(() => {
    if (missionId) fetchExpenses();
  }, [missionId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expAmount || isNaN(parseFloat(expAmount))) return;
    setSavingExp(true);
    try {
      let receipt_url: string | null = null;
      if (expReceipt) {
        const ext  = expReceipt.name.split(".").pop() ?? "jpg";
        const path = `${missionId}/receipts/${Date.now()}.${ext}`;
        const { error: storageErr } = await supabase.storage
          .from("mission-photos")
          .upload(path, expReceipt, { upsert: false });
        if (!storageErr) {
          const { data: urlData } = supabase.storage.from("mission-photos").getPublicUrl(path);
          receipt_url = urlData.publicUrl;
        }
      }
      await supabase.from("mission_expenses").insert({
        mission_id:  missionId,
        type:        expType,
        amount:      parseFloat(expAmount),
        description: expDesc || null,
        receipt_url,
      });
      setExpAmount("");
      setExpDesc("");
      setExpReceipt(null);
      setShowExpenseForm(false);
      await fetchExpenses();
    } finally {
      setSavingExp(false);
    }
  }

  async function handleDeleteExpense(id: string) {
    setDeletingExpId(id);
    await supabase.from("mission_expenses").delete().eq("id", id);
    await fetchExpenses();
    setDeletingExpId(null);
  }

  async function uploadPhoto(file: File, type: PhotoType, slot: SlotKey | null) {
    const key = slot ?? "free";
    setUploading(key);
    try {
      const ext  = file.name.split(".").pop() ?? "jpg";
      const slotPath = slot ? slot : `free_${Date.now()}`;
      const path = `${missionId}/${type}/${slotPath}.${ext}`;
      const { error: storageErr } = await supabase.storage
        .from("mission-photos")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (storageErr) throw storageErr;

      const { data: { publicUrl } } = supabase.storage
        .from("mission-photos")
        .getPublicUrl(path);

      // If slot already has a photo, delete the old DB row first
      if (slot) {
        const existing = photos.find(p => p.type === type && p.slot === slot);
        if (existing) {
          await supabase.from("mission_photos").delete().eq("id", existing.id);
        }
      }

      const { error: dbErr } = await supabase
        .from("mission_photos")
        .insert({ mission_id: missionId, photo_url: publicUrl, type, slot: slot ?? null });
      if (dbErr) throw dbErr;

      await fetchPhotos();
    } catch (err) {
      console.error("[photos] upload error:", err);
    } finally {
      setUploading(null);
    }
  }

  async function deletePhoto(photo: MissionPhoto) {
    const marker = "/mission-photos/";
    const idx    = photo.photo_url.indexOf(marker);
    if (idx !== -1) {
      const storagePath = photo.photo_url.slice(idx + marker.length);
      await supabase.storage.from("mission-photos").remove([storagePath]);
    }
    await supabase.from("mission_photos").delete().eq("id", photo.id);
    await fetchPhotos();
  }

  function triggerSlotUpload(type: PhotoType, slot: SlotKey | null) {
    setUploadingSlot({ type, slot });
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadingSlot) return;
    uploadPhoto(file, uploadingSlot.type, uploadingSlot.slot);
    setUploadingSlot(null);
    e.target.value = "";
  }

  useEffect(() => {
    async function fetchMission() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || (profile.role !== "convoyeur" && profile.role !== "admin")) {
        router.push("/login");
        return;
      }
      setIsAdmin(profile.role === "admin");

      const { data, error: missionError } = await supabase
        .from("missions")
        .select("*")
        .eq("id", missionId)
        .single();

      if (missionError) {
        console.error("[mission detail convoyeur] fetch error:", missionError.message, missionError.code);
      }
      if (!data) { router.push("/missions"); return; }
      setMission(data as Mission);
      setMileageStart(data.mileage_start != null ? String(data.mileage_start) : "");
      setMileageEnd(data.mileage_end != null ? String(data.mileage_end) : "");
      setFuelLevelStart(data.fuel_level_start ?? "");
      setFuelLevelEnd(data.fuel_level_end ?? "");
      setLoading(false);
    }
    fetchMission();
  }, [missionId, router]);

  async function handleUpdateStatus(newStatus: MissionStatus) {
    if (!mission) return;
    setUpdatingStatus(true);
    const { error } = await supabase
      .from("missions")
      .update({ status: newStatus })
      .eq("id", missionId);
    if (!error) {
      setMission({ ...mission, status: newStatus });
      try {
        await fetch("/api/missions/status-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mission_id: missionId, new_status: newStatus }),
        });
      } catch (err) {
        console.error("[status-notification] fetch error:", err);
      }
    }
    setUpdatingStatus(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "user-role=; path=/; Max-Age=0";
    router.push("/login");
  }

  const statusCfg = mission ? STATUS_CONFIG[mission.status] : null;
  const step = mission ? activeStep(mission.status) : -1;

  return (
    <div className="bg-[#0A0A0A] text-[#e5e2e1] min-h-screen antialiased">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#0A0A0A] border-r border-[#2A2A2A] z-50 py-8 px-4">
        <div className="mb-10 px-2">
          <Link href="/dashboard" className="cursor-pointer">
            <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text overflow-visible pr-1" style={{ fontFamily: "Inter, sans-serif" }}>
              Motors Line
            </h1>
          </Link>
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
                item.href === "/missions" ? "bg-white/10 text-white" : "text-[#949493] hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={item.href === "/missions" ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{item.label}</span>
            </Link>
          ))}
        </nav>
        {isAdmin && (
          <Link href="/admin" className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#949493] hover:text-white hover:bg-white/5 transition-colors mt-1">
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
      <div className="md:ml-60 pb-32 md:pb-24">

        {/* TopAppBar (mobile only) */}
        <header className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/missions">
              <span className="material-symbols-outlined text-white cursor-pointer active:opacity-70 active:scale-95 duration-150">
                arrow_back
              </span>
            </Link>
            <Link href="/dashboard" className="cursor-pointer">
              <h1 className="text-xl font-bold tracking-tighter italic silver-gradient-text overflow-visible pr-1" style={{ fontFamily: "Inter, sans-serif" }}>
                Motors Line
              </h1>
            </Link>
          </div>
          <Link href="/profile" className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center hover:bg-[#3a3939] transition-colors">
            <span className="material-symbols-outlined text-[#c4c7c8]">person</span>
          </Link>
        </header>

        <main className="pt-24 md:pt-8 pb-8 px-4 md:px-6 max-w-lg md:max-w-3xl mx-auto">

          {/* Back (desktop) */}
          <Link
            href="/missions"
            className="hidden md:inline-flex items-center gap-2 text-[#949493] hover:text-white text-sm mb-8 transition-colors"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Retour aux missions
          </Link>

          {/* Hidden file input for camera capture */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <span className="text-[#949493] text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>Chargement...</span>
            </div>
          ) : mission && statusCfg ? (
            <div className="flex flex-col gap-6">

              {/* ── Header ── */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-semibold text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
                    {mission.vehicle_brand} {mission.vehicle_model}
                  </h2>
                  <p className="text-xs font-mono uppercase tracking-widest text-[#c4c7c8] mt-1">
                    {mission.vehicle_plate}
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.color}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>
                    {statusCfg.icon}
                  </span>
                  {statusCfg.label}
                </span>
              </div>

              {/* ── Changer le statut ── */}
              {mission.status !== "annulee" && mission.status !== "terminee" && (
                <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                  <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Avancer la mission
                  </h3>
                  <div className="flex flex-col gap-3">
                    {mission.status === "a_faire" && (
                      <button
                        onClick={() => handleUpdateStatus("prise_en_charge")}
                        disabled={updatingStatus}
                        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm bg-[#3b82f6]/20 border border-[#3b82f6]/30 text-[#93c5fd] hover:bg-[#3b82f6]/30 active:scale-[0.98] transition-all disabled:opacity-50"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>car_rental</span>
                        {updatingStatus ? "Mise à jour..." : "Prendre en charge le véhicule"}
                      </button>
                    )}
                    {mission.status === "prise_en_charge" && (
                      <button
                        onClick={() => handleUpdateStatus("en_cours")}
                        disabled={updatingStatus}
                        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm bg-white text-[#0A0A0A] hover:bg-[#e5e2e1] active:scale-[0.98] transition-all disabled:opacity-50"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                        {updatingStatus ? "Mise à jour..." : "Démarrer le transport"}
                      </button>
                    )}
                    {mission.status === "en_cours" && (
                      <button
                        onClick={() => handleUpdateStatus("terminee")}
                        disabled={updatingStatus}
                        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm bg-[#66ff8e]/10 border border-[#66ff8e]/30 text-[#66ff8e] hover:bg-[#66ff8e]/20 active:scale-[0.98] transition-all disabled:opacity-50"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        {updatingStatus ? "Mise à jour..." : "Marquer comme livré"}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* ── Partage de position (en_cours seulement) ── */}
              {mission.status === "en_cours" && (
                <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Partage de position
                    </h3>
                    {isTracking && (
                      <span className="flex items-center gap-1.5 text-[10px] text-[#66ff8e] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#66ff8e] animate-pulse" />
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#949493] mb-5 leading-relaxed" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    {isTracking
                      ? "Votre position est partagée avec le client en temps réel (toutes les 10 s)."
                      : "Activez le partage pour que le client suive votre progression en temps réel."}
                  </p>
                  <button
                    onClick={isTracking ? stopTracking : startTracking}
                    className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      isTracking
                        ? "bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] hover:bg-[#ffb4ab]/20"
                        : "bg-white text-[#0A0A0A] hover:bg-[#e5e2e1] active:scale-[0.98]"
                    }`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isTracking ? "location_off" : "my_location"}
                    </span>
                    {isTracking ? "Arrêter le partage" : "Partager ma position"}
                  </button>
                </section>
              )}

              {/* ── Avancement ── */}
              {mission.status !== "annulee" && (
                <section className="bg-[#1c1b1b] rounded-2xl px-5 py-5 border border-white/[0.04]">
                  <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Avancement
                  </h3>
                  <div className="flex flex-col gap-0">
                    {STEPS.map((label, i) => {
                      const isDone   = i < step;
                      const isActive = i === step;
                      const isFuture = i > step;
                      return (
                        <div key={label} className="flex items-start gap-3">
                          <div className="flex flex-col items-center shrink-0">
                            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                              isDone   ? "bg-white"                                                       :
                              isActive ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] animate-pulse" :
                                         "bg-[#2a2a2a] border border-[#3a3a3a]"
                            }`} />
                            {i < STEPS.length - 1 && (
                              <div className="w-0.5 h-5 rounded-full mt-0.5">
                                <div className={`h-full w-full rounded-full transition-all duration-500 ${isDone ? "bg-white/40" : "bg-[#2a2a2a]"}`} />
                              </div>
                            )}
                          </div>
                          <p className={`text-[9px] font-semibold uppercase tracking-wide leading-none pt-0.5 whitespace-nowrap ${
                            isFuture ? "text-[#444748]" : "text-white"
                          }`} style={{ fontFamily: "Montserrat, sans-serif" }}>
                            {label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── État du véhicule (photos) ── */}
              {mission.status !== "annulee" && (() => {
                const canUpload =
                  photoTab === "before"
                    ? mission.status === "en_cours"
                    : mission.status === "en_cours" || mission.status === "terminee";

                const tabPhotos = photos.filter(p => p.type === photoTab);
                const freePhotos = tabPhotos.filter(p => !p.slot);

                return (
                  <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                    {/* Header + tabs */}
                    <div className="flex flex-col gap-3 mb-5">
                      <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold whitespace-nowrap" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        État du véhicule
                      </h3>
                      <div className="flex gap-1 bg-[#111] rounded-lg p-0.5 self-start">
                        {(["before", "after"] as PhotoType[]).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setPhotoTab(tab)}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                              photoTab === tab ? "bg-white text-[#0A0A0A]" : "text-[#949493] hover:text-white"
                            }`}
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                          >
                            {tab === "before" ? "Prise en charge" : "Livraison"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Kilométrage & Carburant */}
                    <div className="grid grid-cols-2 gap-3 mb-5 pb-5 border-b border-white/[0.04]">
                      <div>
                        <label className="block text-[10px] text-[#949493] uppercase tracking-widest mb-1.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {photoTab === "before" ? "Km départ" : "Km arrivée"}
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={photoTab === "before" ? mileageStart : mileageEnd}
                          onChange={(e) => photoTab === "before" ? setMileageStart(e.target.value) : setMileageEnd(e.target.value)}
                          onBlur={async (e) => {
                            const raw = e.target.value.trim();
                            const val = raw !== "" ? parseInt(raw, 10) : null;
                            const field = photoTab === "before" ? "mileage_start" : "mileage_end";
                            console.log("[mileage save]", { field, raw, val });
                            const { error } = await supabase.from("missions").update({ [field]: val }).eq("id", missionId);
                            if (error) console.error("[mileage save] supabase error:", error.message, error);
                            else console.log("[mileage save] ok");
                          }}
                          placeholder="ex. 45000"
                          className="w-full bg-[#111] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-[0.5px] focus:ring-white/30 placeholder:text-[#444]"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#949493] uppercase tracking-widest mb-1.5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          Carburant
                        </label>
                        <div className="relative">
                          <select
                            value={photoTab === "before" ? fuelLevelStart : fuelLevelEnd}
                            onChange={async (e) => {
                              const val = e.target.value;
                              const field = photoTab === "before" ? "fuel_level_start" : "fuel_level_end";
                              if (photoTab === "before") setFuelLevelStart(val);
                              else setFuelLevelEnd(val);
                              await supabase.from("missions").update({ [field]: val || null }).eq("id", missionId);
                            }}
                            className="w-full bg-[#111] rounded-lg px-3 py-2.5 text-white text-sm appearance-none pr-7 focus:outline-none focus:ring-[0.5px] focus:ring-white/30"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            <option value="">—</option>
                            <option value="1/4">1/4</option>
                            <option value="1/2">1/2</option>
                            <option value="3/4">3/4</option>
                            <option value="Plein">Plein</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-2 top-2.5 text-[#949493] text-sm pointer-events-none">expand_more</span>
                        </div>
                      </div>
                    </div>

                    {/* Slot grid — 6 predefined */}
                    <div className="grid grid-cols-3 gap-2">
                      {SLOTS.map((slot) => {
                        const photo = tabPhotos.find(p => p.slot === slot.key);
                        const isUploading = uploading === slot.key;
                        return (
                          <div key={slot.key} className="flex flex-col gap-1">
                            <div className="relative aspect-square">
                              {photo ? (
                                <>
                                  <img
                                    src={photo.photo_url}
                                    alt={slot.label}
                                    className="w-full h-full object-cover rounded-xl"
                                  />
                                  {canUpload && (
                                    <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity bg-black/50 flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => triggerSlotUpload(photoTab, slot.key)}
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                                        title="Reprendre"
                                      >
                                        <span className="material-symbols-outlined text-white" style={{ fontSize: "16px" }}>photo_camera</span>
                                      </button>
                                      <button
                                        onClick={() => deletePhoto(photo)}
                                        className="w-8 h-8 rounded-full bg-[#ffb4ab]/30 hover:bg-[#ffb4ab]/60 flex items-center justify-center transition-colors"
                                        title="Supprimer"
                                      >
                                        <span className="material-symbols-outlined text-white" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}>close</span>
                                      </button>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() => canUpload && triggerSlotUpload(photoTab, slot.key)}
                                  disabled={!canUpload || isUploading}
                                  className={`w-full h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all duration-150 ${
                                    canUpload
                                      ? "border-[#2a2a2a] hover:border-white/30 hover:bg-white/[0.03] cursor-pointer"
                                      : "border-[#1e1e1e] cursor-default"
                                  } disabled:opacity-40`}
                                >
                                  {isUploading ? (
                                    <span className="material-symbols-outlined text-[#949493] animate-spin" style={{ fontSize: "22px" }}>progress_activity</span>
                                  ) : (
                                    <span className="material-symbols-outlined text-[#444748]" style={{ fontSize: "22px", fontVariationSettings: "'FILL' 0" }}>{slot.icon}</span>
                                  )}
                                </button>
                              )}
                            </div>
                            <p className="text-[9px] text-[#555] text-center uppercase tracking-wide truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>{slot.label}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Free photos row */}
                    {(freePhotos.length > 0 || canUpload) && (
                      <div className="mt-4 pt-4 border-t border-white/[0.04]">
                        <p className="text-[9px] text-[#555] uppercase tracking-widest mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Photos libres</p>
                        <div className="grid grid-cols-4 gap-2">
                          {freePhotos.map((photo) => (
                            <div key={photo.id} className="relative aspect-square group">
                              <img src={photo.photo_url} alt="Photo libre" className="w-full h-full object-cover rounded-lg" />
                              {canUpload && (
                                <button
                                  onClick={() => deletePhoto(photo)}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ffb4ab]/80"
                                >
                                  <span className="material-symbols-outlined text-white" style={{ fontSize: "12px", fontVariationSettings: "'FILL' 1" }}>close</span>
                                </button>
                              )}
                            </div>
                          ))}
                          {canUpload && (
                            <button
                              onClick={() => triggerSlotUpload(photoTab, null)}
                              disabled={uploading === "free"}
                              className="aspect-square rounded-lg border-2 border-dashed border-[#2a2a2a] flex flex-col items-center justify-center hover:border-white/30 hover:bg-white/[0.03] transition-all disabled:opacity-40"
                            >
                              {uploading === "free" ? (
                                <span className="material-symbols-outlined text-[#949493] animate-spin" style={{ fontSize: "20px" }}>progress_activity</span>
                              ) : (
                                <span className="material-symbols-outlined text-[#555]" style={{ fontSize: "20px" }}>add</span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })()}

              {/* ── Véhicule ── */}
              <section className="bg-[#1c1b1b] rounded-2xl overflow-hidden border border-white/[0.04]">
                {mission.vehicle_image_url && mission.vehicle_image_url.trim() !== "" && (
                  <img
                    src={mission.vehicle_image_url}
                    alt={`${mission.vehicle_brand} ${mission.vehicle_model}`}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Véhicule
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Marque</p>
                      <p className="text-white font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{mission.vehicle_brand || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Modèle</p>
                      <p className="text-white font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{mission.vehicle_model || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Immatriculation</p>
                      <p className="text-white font-medium text-sm font-mono uppercase">{mission.vehicle_plate || "—"}</p>
                    </div>
                    {mission.vehicle_color && (
                      <div>
                        <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Couleur</p>
                        <p className="text-white font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{mission.vehicle_color}</p>
                      </div>
                    )}
                    {mission.mileage_start != null && (
                      <div>
                        <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Km départ</p>
                        <p className="text-white font-medium text-sm font-mono">{mission.mileage_start.toLocaleString("fr-FR")} km</p>
                      </div>
                    )}
                    {mission.fuel_level_start && (
                      <div>
                        <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Carburant départ</p>
                        <p className="text-white font-medium text-sm">{mission.fuel_level_start}</p>
                      </div>
                    )}
                    {mission.status === "terminee" && mission.mileage_end != null && (
                      <div>
                        <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Km arrivée</p>
                        <p className="text-white font-medium text-sm font-mono">{mission.mileage_end.toLocaleString("fr-FR")} km</p>
                      </div>
                    )}
                    {mission.status === "terminee" && mission.fuel_level_end && (
                      <div>
                        <p className="text-[10px] text-[#949493] uppercase tracking-widest mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Carburant arrivée</p>
                        <p className="text-white font-medium text-sm">{mission.fuel_level_end}</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ── Itinéraire ── */}
              <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-5" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Itinéraire
                </h3>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center pt-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    <div className="w-0.5 flex-1 bg-[#353534] rounded-full my-2" style={{ minHeight: "40px" }} />
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-[#949493]" />
                  </div>
                  <div className="flex flex-col gap-6 flex-1">
                    <div>
                      <p className="text-[10px] text-[#c4c7c8] uppercase tracking-widest font-medium mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Départ</p>
                      <p className="text-white font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{mission.pickup_address}</p>
                      {mission.pickup_date && (
                        <p className="text-[#949493] text-xs font-mono mt-1 capitalize">{formatDate(mission.pickup_date)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-[#c4c7c8] uppercase tracking-widest font-medium mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>Arrivée</p>
                      <p className="text-white font-medium text-sm" style={{ fontFamily: "Inter, sans-serif" }}>{mission.delivery_address}</p>
                      {mission.delivery_date && (
                        <p className="text-[#949493] text-xs font-mono mt-1 capitalize">{formatDate(mission.delivery_date)}</p>
                      )}
                      {(mission.distance_km || mission.duration) && (
                        <p className="text-[#949493] text-xs mt-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {[mission.distance_km, mission.duration ? `~${mission.duration}` : null].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Tarif ── */}
              <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Tarif
                </h3>
                {mission.price ? (
                  <div className="flex items-end gap-3">
                    <p className="text-3xl font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                      {mission.price}€
                      <span className="text-base font-medium text-[#949493] ml-1">HT</span>
                    </p>
                    {mission.service_level && (
                      <span className="mb-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#c4c7c8]">
                        {SERVICE_LABELS[mission.service_level] ?? mission.service_level}
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>Sur devis</p>
                    <p className="text-xs text-[#949493] mt-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Contactez votre gestionnaire pour les détails tarifaires
                    </p>
                  </div>
                )}
              </section>

              {/* ── Notes ── */}
              {mission.notes && (
                <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                  <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Notes logistiques
                  </h3>
                  <p className="text-[#c4c7c8] text-sm leading-relaxed" style={{ fontFamily: "Montserrat, sans-serif" }}>{mission.notes}</p>
                </section>
              )}

              {/* ── Frais de mission ── */}
              <section className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/[0.04]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Frais de mission
                  </h3>
                  {mission.status !== "annulee" && mission.status !== "terminee" && (
                    <button
                      onClick={() => { setShowExpenseForm((v) => !v); }}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#949493] hover:text-white transition-colors"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                        {showExpenseForm ? "close" : "add"}
                      </span>
                      {showExpenseForm ? "Annuler" : "Ajouter"}
                    </button>
                  )}
                </div>

                {/* Add form */}
                {showExpenseForm && (
                  <form onSubmit={handleAddExpense} className="mb-4 bg-[#131313] rounded-xl p-4 space-y-3 border border-white/[0.06]">
                    {/* Type + Montant */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-[#949493] uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>Type</label>
                        <div className="relative">
                          <select
                            value={expType}
                            onChange={(e) => setExpType(e.target.value as ExpenseType)}
                            className="w-full bg-[#1c1b1b] rounded-lg px-3 py-2.5 text-white text-sm appearance-none pr-7 focus:outline-none focus:ring-[0.5px] focus:ring-white"
                          >
                            {(Object.keys(EXPENSE_LABELS) as ExpenseType[]).map((t) => (
                              <option key={t} value={t}>{EXPENSE_LABELS[t]}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-2 top-2.5 text-[#949493] pointer-events-none" style={{ fontSize: "14px" }}>expand_more</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-[#949493] uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>Montant (€)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={expAmount}
                          onChange={(e) => setExpAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#1c1b1b] rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                        />
                      </div>
                    </div>
                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-[#949493] uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>Description (optionnel)</label>
                      <input
                        type="text"
                        value={expDesc}
                        onChange={(e) => setExpDesc(e.target.value)}
                        placeholder="Ex: A7 Autoroute du soleil"
                        className="w-full bg-[#1c1b1b] rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-[#444748] focus:outline-none focus:ring-[0.5px] focus:ring-white"
                      />
                    </div>
                    {/* Receipt photo */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-[#949493] uppercase tracking-widest" style={{ fontFamily: "Montserrat, sans-serif" }}>Photo du ticket (optionnel)</label>
                      <input
                        ref={expReceiptRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setExpReceipt(e.target.files?.[0] ?? null)}
                      />
                      <button
                        type="button"
                        onClick={() => expReceiptRef.current?.click()}
                        className="flex items-center gap-2 text-sm text-[#949493] hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                          {expReceipt ? "check_circle" : "attach_file"}
                        </span>
                        <span style={{ fontFamily: "Montserrat, sans-serif" }} className="text-[11px]">
                          {expReceipt ? expReceipt.name : "Joindre un ticket"}
                        </span>
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={savingExp}
                      className="w-full h-10 rounded-full font-bold text-sm text-[#0A0A0A] disabled:opacity-50 transition-all active:scale-95"
                      style={{ background: "linear-gradient(to right, #949493, #E0E0E0, #949493)", fontFamily: "Montserrat, sans-serif" }}
                    >
                      {savingExp ? "Enregistrement…" : "Enregistrer le frais"}
                    </button>
                  </form>
                )}

                {/* Expense list */}
                {expenses.length === 0 ? (
                  <p className="text-[#444748] text-xs text-center py-4" style={{ fontFamily: "Montserrat, sans-serif" }}>Aucun frais enregistré</p>
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
                        {mission.status !== "annulee" && mission.status !== "terminee" && (
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            disabled={deletingExpId === exp.id}
                            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors disabled:opacity-40"
                          >
                            <span className="material-symbols-outlined text-[#949493]" style={{ fontSize: "14px" }}>delete</span>
                          </button>
                        )}
                      </div>
                    ))}
                    {/* Total */}
                    <div className="flex justify-between items-center pt-2 border-t border-white/[0.06] mt-2">
                      <span className="text-[10px] text-[#949493] uppercase tracking-widest font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>Total frais</span>
                      <span className="text-white font-bold text-base" style={{ fontFamily: "Inter, sans-serif" }}>
                        {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                )}
              </section>

            </div>
          ) : null}
        </main>

        {/* Bottom Nav (mobile only) */}
        <nav className="md:hidden bg-[#0A0A0A]/80 backdrop-blur-xl fixed bottom-0 w-full z-50 rounded-t-2xl border-t border-[#2A2A2A] shadow-[0_-4px_24px_rgba(255,255,255,0.05)]">
          <div className="flex justify-around items-center h-16 px-4">
            {CONVOYEUR_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center transition-colors ${item.href === "/missions" ? "text-white" : "text-[#949493] hover:text-white"}`}
              >
                <span className="material-symbols-outlined" style={item.href === "/missions" ? { fontVariationSettings: "'FILL' 1" } : undefined}>
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
