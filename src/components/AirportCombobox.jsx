
import { useEffect, useRef, useState } from "react";
import {
  Search,
  MapPin,
  Check,
  ChevronDown
} from "lucide-react";

export default function AirportCombobox({
  label,
  icon: Icon,
  airports = [],
  value,
  onChange,
  placeholder = "Selecciona aeropuerto",
  disabled = false
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Aeropuerto seleccionado
  const selectedAirport = airports.find(
    (airport) => Number(airport.id) === Number(value)
  );

  // buscar sin importar acentos
  const normalize = (text) =>
    String(text ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  // Filtrar por ciudad o IATA
  const filteredAirports = airports.filter((airport) =>
    normalize(`${airport.city} ${airport.code}`).includes(
      normalize(query.trim())
    )
  );

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!open) return;

    const handleOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Enfocar el buscador al abrir
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const selectAirport = (airport) => {
    onChange(Number(airport.id));
    setQuery("");
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-w-0 ${
        open ? "z-40" : "z-0"
      }`}
    >
      {/* Campo principal */}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className="
          w-full min-w-0
          flex items-center gap-4
          rounded-2xl
          border border-[#DCE3EF]
          bg-white
          px-5 py-3
          text-left
          cursor-pointer
          hover:border-[#3333CC]
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#3333CC]/20
          transition-all duration-200
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
      >
        <Icon className="w-8 h-8 shrink-0 text-slate-600" />

        <div className="flex-1 min-w-0">
          <span className="block text-xs text-slate-400 mb-1">
            {label}
          </span>

          <span className="block truncate text-sm sm:text-base font-semibold text-[#101936]">
            {selectedAirport
              ? `${selectedAirport.city} (${selectedAirport.code})`
              : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 shrink-0 text-[#455675] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Lista personalizada */}
      {open && (
        <div
          role="dialog"
          aria-label={`Seleccionar ${label.toLowerCase()}`}
          className="
            absolute left-0 right-0 top-full
            z-50 mt-2
            rounded-2xl
            border border-[#DCE3EF]
            bg-white
            p-3
            shadow-[0_15px_40px_rgba(51,51,153,0.20)]
          "
        >
          {/* Buscador */}
          <div className="flex items-center gap-3 rounded-xl border border-[#DCE3EF] px-3 py-2">
            <Search className="w-5 h-5 shrink-0 text-slate-500" />

            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar ciudad o código..."
              aria-label="Buscar aeropuerto"
              className="w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          <p className="px-2 py-3 text-[11px] font-semibold tracking-wider text-slate-400">
            AEROPUERTOS
          </p>

          {/* Resultados */}
          <div className="max-h-60 overflow-y-auto space-y-1">
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
                    w-full flex items-center gap-3
                    rounded-xl px-3 py-3
                    text-left cursor-pointer
                    transition-colors
                    focus-visible:outline-2
                    focus-visible:outline-[#3333CC]
                    ${
                      selected
                        ? "bg-[#EEEDFF] text-[#3333CC]"
                        : "text-[#101936] hover:bg-[#F5F4FF]"
                    }
                  `}
                >
                  <MapPin className="w-4 h-4 shrink-0" />

                  <span className="flex-1 min-w-0 truncate text-sm font-medium">
                    {airport.city}
                  </span>

                  <span className="text-xs text-slate-500">
                    {airport.code}
                  </span>

                  {selected && (
                    <Check className="w-4 h-4 shrink-0 text-[#3333CC]" />
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
