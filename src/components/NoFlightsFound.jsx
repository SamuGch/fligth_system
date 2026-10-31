
import { Search } from "lucide-react";

export default function NoFlightsFound({
  onModifySearch,
  imageSrc = "/no-flights.png",
}) {
  return (
    <div
      className="
        flex min-h-[420px] w-full flex-col
        items-center justify-center
        rounded-3xl bg-[#f7f7f8]
        px-5 py-10 text-center
        sm:min-h-[520px] sm:px-10 sm:py-14
      "
    >
      {/* Imagen de vuelos no disponibles */}
      <div className="mb-7 flex w-full items-center justify-center">
        <img
          src={imageSrc}
          alt="No hay vuelos disponibles para la fecha seleccionada"
          className="
            h-auto w-full max-w-[260px]
            object-contain
            sm:max-w-[330px]
            lg:max-w-[380px]
          "
          loading="lazy"
        />
      </div>

      {/* Mensaje principal */}
      <h3
        className="
          max-w-xl text-xl font-bold
          tracking-tight text-[#303030]
          sm:text-2xl
        "
      >
        No hay vuelos disponibles para esta fecha
      </h3>

      {/* Descripción */}
      <p
        className="
          mt-4 max-w-lg
          text-sm leading-7 text-slate-500
          sm:text-base
        "
      >
        Cambia la fecha o el destino para realizar una nueva búsqueda.
      </p>

      {/* Botón para modificar búsqueda */}
      <button
        type="button"
        onClick={onModifySearch}
        className="
          mt-9 inline-flex min-h-12
          items-center justify-center gap-3
          rounded-full bg-[#3b2b7a]
          px-8 py-3 text-sm font-semibold
          text-white shadow-md
          transition-all duration-200
          hover:-translate-y-0.5
          hover:bg-[#2b205c]
          hover:shadow-lg
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-violet-700
          cursor-pointer
        "
      >
        <Search size={18} />
        Modificar búsqueda
      </button>
    </div>
  );
}
