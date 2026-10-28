
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
        setQuery("");
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



  const selectAirport = (airport) => {
    onChange(Number(airport.id));
    setQuery("");
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-w-0 ${open ? "z-40" : "z-0"
        }`}
    >
      {/* Campo principal con búsqueda integrada */}
      <div
        onClick={() => {
          if (!disabled) searchRef.current?.focus();
        }}
        className={`
    w-full min-w-0
    flex items-center gap-4
    rounded-2xl
    border
    px-5 py-3
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
        <Icon className="w-8 h-8 shrink-0 text-slate-600" />

        <div className="flex-1 min-w-0">
          <label
            htmlFor={`airport-${label}`}
            className="block text-xs text-slate-400 mb-1"
          >
            {label}
          </label>

          <input
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
      ? `${selectedAirport.city} (${selectedAirport.code})`
      : placeholder
}
            onFocus={() => {
              setQuery("");
              setOpen(true);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                setOpen(false);
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
          />
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
                    ${selected
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
