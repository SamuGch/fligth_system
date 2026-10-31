import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Minus, Plus, Users, X } from "lucide-react";
import { obtenerTiposAsiento } from "../services/asientoService";

const MAX_PASSENGERS = 10;
const DEFAULT_DETAILS = { adults: 1, children: 0, infants: 0 };
const FALLBACK_CLASS = { id: null, name: "Económica" };

function compactClassName(value) {
  if (/econ/i.test(value)) return "Eco";
  if (/ejec|business/i.test(value)) return "Ejec";
  if (/prefer/i.test(value)) return "Pref";
  if (/primera|first/i.test(value)) return "Prim";
  return value;
}

function getClassName(item) {
  return item?.nombre ?? item?.name ?? item?.descripcion ?? "Clase de cabina";
}

function normalizeClasses(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      id: item?.id ?? item?.tipoAsientoId ?? null,
      name: getClassName(item),
    }))
    .filter((item) => item.name);
}

function findEconomy(classes) {
  return (
    classes.find((item) =>
      /econ|economy/i.test(item.name)
    ) ?? classes[0] ?? FALLBACK_CLASS
  );
}

function getSelection(value) {
  const details = {
    ...DEFAULT_DETAILS,
    ...(value?.passengerDetails ?? {}),
  };
  const totalPassengers =
    Number(value?.totalPassengers) ||
    details.adults + details.children + details.infants;

  return {
    passengerDetails: {
      adults: Math.max(1, Number(details.adults) || 1),
      children: Math.max(0, Number(details.children) || 0),
      infants: Math.max(0, Number(details.infants) || 0),
    },
    totalPassengers: Math.max(1, Math.min(MAX_PASSENGERS, totalPassengers)),
    seatTypeId: value?.seatTypeId ?? null,
    seatClassName: value?.seatClassName ?? FALLBACK_CLASS.name,
  };
}

export default function PassengerClassSelector({ value, onChange, onFocus, onClose, active = false, compact = false }) {
  const open = active;
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [draft, setDraft] = useState(() => getSelection(value));
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    let active = true;

    async function loadClasses() {
      try {
        const result = await obtenerTiposAsiento();
        if (!active) return;
        const availableClasses = normalizeClasses(result);
        setClasses(availableClasses.length ? availableClasses : [FALLBACK_CLASS]);
      } catch {
        if (active) setClasses([FALLBACK_CLASS]);
      } finally {
        if (active) setLoadingClasses(false);
      }
    }

    void loadClasses();
    return () => {
      active = false;
    };
  }, []);

  const totalPassengers = Object.values(draft.passengerDetails).reduce(
    (total, count) => total + count,
    0
  );

  const updatePassengerCount = (type, increment) => {
    setDraft((current) => {
      const currentCount = current.passengerDetails[type];
      const nextCount = currentCount + increment;
      if (nextCount < (type === "adults" ? 1 : 0)) return current;

      const nextTotal = totalPassengers - currentCount + nextCount;
      if (nextTotal > MAX_PASSENGERS || nextTotal < 1) return current;

      return {
        ...current,
        totalPassengers: nextTotal,
        passengerDetails: {
          ...current.passengerDetails,
          [type]: nextCount,
        },
      };
    });
  };

  const confirmSelection = () => {
    const selectedClass =
      classes.find((item) => String(item.id) === String(draft.seatTypeId)) ??
      classes.find((item) => item.name === draft.seatClassName) ??
      findEconomy(classes);
    const nextSelection = {
      ...draft,
      totalPassengers,
      seatTypeId: selectedClass.id,
      seatClassName: selectedClass.name,
    };

    onChange(nextSelection);
    onClose?.();
    triggerRef.current?.focus();
  };

  const labels = [
    ["adults", "Adultos", "12 años o más"],
    ["children", "Niños", "De 2 a 11 años"],
    ["infants", "Bebés", "Menores de 2 años"],
  ];

  return (
    <div
      ref={containerRef}
      onClick={(event) => event.stopPropagation()}
      className={`relative w-full min-w-0 ${open ? "z-50" : "z-0"}`}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Pasajeros y clase: ${totalPassengers} ${totalPassengers === 1 ? "pasajero" : "pasajeros"}, ${draft.seatClassName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          if (!active) onFocus?.();
        }}
        className={`flex w-full min-w-0 items-center gap-2 rounded-2xl border bg-white px-3 ${compact ? "py-1.5" : "py-2"} text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#3333CC] ${
          open
            ? "border-[#3333CC] ring-2 ring-[#3333CC]/10"
            : "border-[#DCE3EF] hover:border-[#3333CC]"
        }`}
      >
        <Users className={`${compact ? "h-6 w-6" : "h-8 w-8"} mr-2 shrink-0 text-gray-500`} />
        <span className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider leading-none text-gray-400">
            Pasajeros y clase
          </span>
          <span className="block truncate text-sm font-semibold leading-none text-[#101936]">
            {totalPassengers} pax · {compactClassName(draft.seatClassName)}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#455675] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          id={listId}
          role="dialog"
          aria-label="¿Quiénes vuelan?"
          className="absolute right-0 top-full z-50 mt-2 w-[min(390px,calc(100vw-2rem))] origin-top-right rounded-2xl border border-[#DCE3EF] bg-white p-4 shadow-[0_15px_40px_rgba(51,51,153,0.2)] transition-all duration-200"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#101936]">¿Quiénes vuelan?</h2>
              <p className="mt-1 text-xs text-slate-500">Máximo 10 pasajeros por reserva</p>
            </div>
            <button type="button" aria-label="Cerrar selector" onClick={() => onClose?.()} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {labels.map(([type, label, description]) => {
              const count = draft.passengerDetails[type];
              return (
                <div key={type} className="min-w-0 rounded-lg bg-slate-50 p-2">
                  <div className="mb-1.5">
                    <p className="truncate text-xs font-semibold text-[#101936]">{label}</p>
                    <p className="truncate text-[10px] text-slate-500">{description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <button type="button" aria-label={`Disminuir ${label}`} disabled={count <= (type === "adults" ? 1 : 0)} onClick={() => updatePassengerCount(type, -1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[#DCE3EF] text-[#3333CC] transition hover:bg-[#F5F4FF] disabled:cursor-not-allowed disabled:opacity-40">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-4 text-center text-sm font-bold text-[#101936]">{count}</span>
                    <button type="button" aria-label={`Aumentar ${label}`} disabled={totalPassengers >= MAX_PASSENGERS} onClick={() => updatePassengerCount(type, 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[#3333CC] text-[#3333CC] transition hover:bg-[#F5F4FF] disabled:cursor-not-allowed disabled:opacity-40">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Clase de cabina</p>
            {loadingClasses ? (
              <div className="flex items-center gap-2 py-3 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Consultando clases...</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {classes.map((item) => {
                  const selected = String(item.id) === String(draft.seatTypeId) || item.name === draft.seatClassName;
                  return (
                    <button key={`${item.id}-${item.name}`} type="button" aria-pressed={selected} onClick={() => setDraft((current) => ({ ...current, seatTypeId: item.id, seatClassName: item.name }))} className={`rounded-lg border px-2.5 py-2 text-center text-xs font-medium transition ${selected ? "border-[#3333CC] bg-[#F5F4FF] text-[#3333CC]" : "border-[#DCE3EF] text-[#101936] hover:border-[#3333CC]"}`}>
                      <span className="block truncate">{item.name}</span>
                      {selected && <Check className="mx-auto mt-0.5 h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button type="button" onClick={confirmSelection} className="mt-3 w-full rounded-lg bg-[#3333CC] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2925A8] focus-visible:outline-2 focus-visible:outline-[#3333CC] focus-visible:outline-offset-2">
            Listo
          </button>
        </div>
      )}
    </div>
  );
}
