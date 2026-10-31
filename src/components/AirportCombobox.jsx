import { useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";

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
  compact = false,
}) {
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const normalizedAirports = airports.map(normalizeAirport);
  const open = active;

  const selectedAirport = normalizedAirports.find(
    (airport) => Number(airport.id) === Number(value)
  );

  // Búsqueda insensible a mayúsculas y acentos.
  const normalize = (text) =>
    String(text ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const filteredAirports = normalizedAirports.filter((airport) =>
    normalize(
      `${airport.iata} ${airport.ciudad} ${airport.pais} ${airport.nombre}`
    ).includes(normalize(query.trim()))
  );

  const selectAirport = (airport) => {
    onChange(Number(airport.id));
    setQuery("");
    // No llamar a onClose aquí: FlightSearch decide si abre Destino o Salida.
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
      className={`relative w-full min-w-0 ${open ? "z-40" : "z-0"}`}
    >
      {/* Campo principal de 64 px */}
      <div
        onClick={startEditing}
        className={`
          flex h-[64px] min-h-0 w-full min-w-0 box-border
          items-center gap-3 rounded-2xl border bg-white
          ${compact ? "px-3" : "px-4"}
          cursor-text transition-all duration-200
          ${
            open
              ? "border-[#333399] ring-2 ring-[#333399]/10"
              : "border-[#DCE3EF] hover:border-[#333399]"
          }
          ${disabled ? "cursor-not-allowed opacity-50" : ""}
        `}
      >
        <Icon
          className={`${compact ? "h-6 w-6" : "h-7 w-7"} shrink-0 text-[#455675]`}
        />

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0 flex-1">
            <span className="mb-0.5 block text-xs font-normal leading-tight text-[#8292B0]">
              {label}
            </span>

            {!open && selectedAirport ? (
              <span className="block truncate whitespace-nowrap text-[14px] font-semibold leading-tight text-[#101936]">
                {selectedAirport.ciudad ||
                  selectedAirport.nombre ||
                  selectedAirport.iata}
              </span>
            ) : (
              <input
                ref={searchRef}
                id={`airport-${label}`}
                type="text"
                value={query}
                disabled={disabled}
                autoComplete="off"
                placeholder={open ? "Buscar ciudad o código..." : placeholder}
                onFocus={() => {
                  if (!active) {
                    setQuery("");
                    onFocus?.();
                  }
                }}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setQuery(event.target.value)}
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
                className="block w-full min-w-0 bg-transparent text-[14px] font-semibold leading-tight text-[#101936] outline-none placeholder:text-[#64748B]"
              />
            )}
          </div>

          {!open && selectedAirport && (
            <span className="shrink-0 rounded-md bg-[#EEEDFF] px-1.5 py-1 text-[11px] font-bold tracking-wide text-[#333399]">
              {selectedAirport.iata}
            </span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 pointer-events-none text-[#455675] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Lista de aeropuertos */}
      {open && (
        <div
          role="dialog"
          aria-label={`Seleccionar ${label.toLowerCase()}`}
          className="
            absolute left-0 top-full z-50 mt-2
            w-full min-w-full sm:w-[420px]
            max-w-[calc(100vw-2rem)]
            rounded-2xl border border-[#DCE3EF]
            bg-white p-3
            shadow-[0_15px_40px_rgba(51,51,153,0.20)]
          "
        >
          <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-[#8292B0]">
            AEROPUERTOS
          </p>

          <div className="max-h-60 space-y-1 overflow-y-auto">
            {filteredAirports.map((airport) => {
              const selected = Number(airport.id) === Number(value);

              return (
                <button
                  key={airport.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectAirport(airport)}
                  className={`
                    flex w-full items-center gap-3
                    rounded-xl px-3 py-3
                    text-left cursor-pointer
                    transition-colors
                    focus-visible:outline-2 focus-visible:outline-[#333399]
                    ${
                      selected
                        ? "bg-[#EEEDFF] text-[#333399]"
                        : "text-[#101936] hover:bg-[#F5F4FF]"
                    }
                  `}
                >
                  <MapPin
                    className={`h-4 w-4 shrink-0 ${
                      selected ? "text-[#3333CC]" : "text-[#64748B]"
                    }`}
                    aria-hidden="true"
                  />

                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {airport.ciudad || airport.nombre || "Aeropuerto"}
                  </span>

                  <span
                    className={`shrink-0 text-xs ${
                      selected ? "text-[#333399]" : "text-[#64748B]"
                    }`}
                  >
                    {airport.iata}
                  </span>

                  {selected && (
                    <Check
                      className="h-4 w-4 shrink-0 text-[#3333CC]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}

            {filteredAirports.length === 0 && (
              <p className="py-5 text-center text-sm text-[#64748B]">
                No se encontraron aeropuertos
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
