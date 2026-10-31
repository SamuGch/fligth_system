
import { useRef, useState } from "react";
import {
  Check,
  ChevronDown
} from "lucide-react";

function normalizeAirport(item) {
  return {
    ...item,
    id: item.id ?? item.aeropuertoId,
    iata: item.iata ?? item.codigo_iata ?? item.codigoIata ?? item.code ?? "",
    nombre: item.nombre ?? item.name ?? "",
    ciudad: item.ciudad ?? item.city ?? "",
    pais: item.pais ?? item.country ?? "",
  };
}

export default function AirportCombobox({
  label,
  icon: Icon,
  airports = [],
  value,
  onChange,
  onFocus,
  onClose,
  active = false,
  placeholder = "Selecciona aeropuerto",
  disabled = false,
  compact = false
}) {
  const [query, setQuery] = useState("");

  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const normalizedAirports = airports.map(normalizeAirport);

  const open = active;

  // Aeropuerto seleccionado
  const selectedAirport = normalizedAirports.find(
    (airport) => Number(airport.id) === Number(value)
  );

  // buscar sin importar acentos
  const normalize = (text) =>
    String(text ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  // Filtrar por ciudad o IATA
  const filteredAirports = normalizedAirports.filter((airport) =>
    normalize(
      `${airport.iata} ${airport.ciudad} ${airport.pais} ${airport.nombre}`
    ).includes(
      normalize(query.trim())
    )
  );

  // Cerrar al hacer clic fuera o presionar Escape
  const selectAirport = (airport) => {
    onChange(Number(airport.id));
    setQuery("");
    onClose?.();
  };

  const startEditing = () => {
    if (disabled) return;

    setQuery("");
    onFocus?.();
    requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={(event) => event.stopPropagation()}
      className={`relative w-full min-w-0 ${open ? "z-40" : "z-0"
        }`}
    >
      {/* Campo principal con búsqueda integrada */}
      <div
        onClick={startEditing}
        className={`
    w-full min-w-0
    flex items-center     gap-2
    rounded-2xl
    border
    ${compact ? "px-3 py-1.5" : "px-3 py-2"}
    bg-white
    cursor-text
    transition-all duration-200
    ${open
            ? "border-[#3333CC] ring-2 ring-[#3333CC]/10"
            : "border-[#DCE3EF] hover:border-[#3333CC]"
          }
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
  `}
      >
        <Icon className={`${compact ? "h-6 w-6" : "h-8 w-8"} shrink-0 text-slate-600`} />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0 flex-1">
            {!open && selectedAirport && (
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                  {label}
                </span>
                <span className="block truncate text-sm font-bold text-[#101936]">
                  {selectedAirport.iata}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {selectedAirport.ciudad}
                </span>
              </div>
            )}
            {(open || !selectedAirport) && <input
            ref={searchRef}
            id={`airport-${label}`}
            type="text"
            value={query}
            disabled={disabled}
            autoComplete="off"
            placeholder={
              open
                ? ""
                : selectedAirport
                  ? selectedAirport.ciudad
                  : placeholder
            }
            onFocus={() => {
              setQuery("");
              if (!active) onFocus?.();
            }}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                onClose?.();
                setQuery("");
                event.currentTarget.blur();
              }
            }}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-label={`Buscar aeropuerto de ${label.toLowerCase()}`}
            className={`
        w-full min-w-0
        bg-transparent
        outline-none
        text-sm sm:text-base
        font-semibold
        text-[#101936]
        ${selectedAirport
                ? "placeholder:text-[#101936]"
                : "placeholder:text-[#64748B]"
              }
      `}
            />}
          </div>
          {!open && selectedAirport && (
            <span className="shrink-0 rounded-md bg-[#F0F0FF] px-1.5 py-1 text-[11px] font-bold tracking-wide text-[#3333CC]">
              {selectedAirport.iata}
            </span>
          )}
        </div>

        <ChevronDown
          className={`
      w-4 h-4 shrink-0
      text-[#455675]
      pointer-events-none
      transition-transform duration-200
      ${open ? "rotate-180" : ""}
    `}
        />
      </div>

      {/* Lista personalizada */}
      {open && (
        <div
          role="dialog"
          aria-label={`Seleccionar ${label.toLowerCase()}`}
          className="
            absolute left-0 top-full z-50 mt-2
            w-full min-w-full sm:w-[420px]
            max-h-64 overflow-y-auto
            rounded-2xl
            border border-gray-100
            bg-white
            p-2
            shadow-2xl
          "
        >
          <div className="space-y-1">
            {filteredAirports.map((airport) => {
              const selected =
                Number(airport.id) === Number(value);

              return (
                <button
                  key={airport.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectAirport(airport)}
                  className={`
                    relative w-full
                    rounded-xl px-3 py-3
                    text-left cursor-pointer
                    transition-colors
                    focus-visible:outline-2
                    focus-visible:outline-[#3333CC]
                    hover:bg-blue-50/50
                    ${selected
                      ? "bg-blue-50 text-blue-900"
                      : "text-gray-800"
                    }
                  `}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-semibold text-gray-800">
                      {[airport.ciudad, airport.pais].filter(Boolean).join(", ")}
                    </span>
                    <span className="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-900">
                      {airport.iata}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-gray-500">
                    {airport.nombre || "Aeropuerto"}
                  </span>
                  {selected && (
                    <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-800" />
                  )}
                </button>
              );
            })}

            {filteredAirports.length === 0 && (
              <p className="py-5 text-center text-sm text-slate-500">
                No se encontraron aeropuertos
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
