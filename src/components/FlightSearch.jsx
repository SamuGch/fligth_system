import { useEffect, useState } from "react";
import FlightSearchModal from "./FlightSearchModal";
import { 
  Calendar, 
  Search,
  ChevronDown, 
  PlaneLanding 
} from 'lucide-react';
import { obtenerAeropuertos } from "../services/aeropuertoService";
import * as Api from "../tools/Api";

export default function FlightSearch() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tripTypeOpen, setTripTypeOpen] = useState(false);
  const [airports, setAirports] = useState([]);
  const [loadingAirports, setLoadingAirports] = useState(true);
  const [airportsError, setAirportsError] = useState("");
  const [data, setData] = useState({})

  const [searchData, setSearchData] = useState({
    tripType: "round",
    OrigenID: 0,
    DestinationID: 0,
    departureDate: "",
    returnDate: ""
  });

  const updateSearch = (event) => {
    const { name, value } = event.target;
    setSearchData((current) => ({
      ...current,
      [name]:
        name === "OrigenID" || name === "DestinationID"
          ? Number(value)
          : value,
    }));
  };

  useEffect(() => {
    let active = true;

    async function cargarAeropuertos() {
      try {
        setLoadingAirports(true);
        setAirportsError("");

        const data = await obtenerAeropuertos();

        if (!active) return;

        setAirports(data);
      } catch (error) {
        if (active) {
          setAirportsError(
            error instanceof Error
              ? error.message
              : "No se pudieron obtener los aeropuertos.",
          );
        }
      } finally {
        if (active) setLoadingAirports(false);
      }
    }

    void cargarAeropuertos();

    return () => {
      active = false;
    };
  }, []);

  const handleSearch = async () => {
    console.log({searchData})

    const response = await Api.post("/vuelo/buscar", searchData);

    console.log({response})
    setData(response)

    setModalOpen(true);
  };

  return (
    <>
      <div>
      {/* Search Widget */}
      <div className="relative z-20 mx-4 -mt-8 shadow-[0_15px_40px_rgba(59,43,122,0.18)] sm:mx-6 sm:-mt-12 lg:mx-10 lg:-mt-20 xl:mx-30">
        <div className="rounded-4xl bg-white p-4 shadow-2xl sm:p-7 sm:py-4">
          {/* Top Row: Selectors */}
          <div className="mb-4 flex gap-3 border-b border-gray-100 pb-4">
            <div className="relative inline-block">
              <button
                onClick={() => setTripTypeOpen((open) => !open)}
                aria-expanded={tripTypeOpen}
                className="flex min-h-11 items-center gap-2 rounded-full bg-[#4a4a8a] px-4 py-2.5 text-sm font-medium text-white sm:px-6"
              >
                {searchData.tripType === "round"
                ? "Ida y vuelta" 
                : "Solo ida"}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    tripTypeOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {tripTypeOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 flex w-48 flex-col rounded-2xl border border-purple-300 bg-purple-50 py-2 shadow-xl">
                <button type="button" onClick={() => { setSearchData((current) => ({ ...current, tripType: "round" })); setTripTypeOpen(false); }} className="min-h-11 px-4 text-left hover:bg-violet-100">
                Ida y vuelta
                </button>

                <button
                type="button"
                onClick={() => {
                    setSearchData((current) => ({ ...current, tripType: "one" }));
                    setTripTypeOpen(false);
                }}
                className="min-h-11 px-4 text-left hover:bg-violet-100"
                >
                Solo ida
                </button>

                </div>
              )}
            </div>
            
            {/* Pasajeros 
            <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">
                Pasajeros
            </label>

            <select
                value={searchData.passengers}
                onChange={(e) =>
                updateSearch("passengers", Number(e.target.value))
                }
                className="rounded-full px-4 py-2.5 bg-slate-50
                        text-slate-700 text-sm cursor-pointer"
            >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <option key={number} value={number}>
                    {number}
                </option>
                ))}
            </select>
            </div>*/}

            {/* Clase 
            <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">
                Clase
            </label>

            <select
                value={searchData.seatClass}
                onChange={(e) =>
                updateSearch("seatClass", e.target.value)
                }
                className="rounded-full px-4 py-2.5 bg-slate-50
                        text-slate-700 text-sm cursor-pointer"
            >
                <option value="Economica">Económica</option>
                <option value="Business">Business</option>
            </select>
            </div>

          </div>*/}
          </div>

          {/* Bottom Row: Inputs */}
          <div className="grid grid-cols-1 items-stretch gap-3 px-0 sm:grid-cols-2 sm:gap-4 lg:px-0 xl:grid-cols-5">
            {/* Origen */}
            <div className="min-w-0 w-full rounded-2xl border border-gray-200 p-3">
                <label
                    htmlFor="flight-origin"
                    className="block text-xs text-slate-500 mb-1"
                >
                    Origen
                </label>

                <select
                    id="flight-origin"
                    name="OrigenID"
                    value={searchData.OrigenID}
                    onChange={updateSearch}
                    disabled={loadingAirports || Boolean(airportsError)}
                    className="w-full min-w-0 bg-transparent text-base font-semibold
                            text-slate-800 outline-none cursor-pointer
                            disabled:opacity-50"
                >
                    <option value="">
                      {loadingAirports
                        ? "Cargando aeropuertos..."
                        : "Selecciona origen"}
                    </option>
                    {airports.map((airport) => (
                    <option key={airport.id} value={airport.id}>
                        {airport.city} ({airport.code})
                    </option>
                    ))}
                </select>
                </div>

            
                {/* Destino */}
                <div className="flex min-w-0 w-full items-center gap-3 rounded-2xl border border-gray-200 p-3 transition-colors hover:border-violet-400">

                <PlaneLanding className="w-6 h-6 text-slate-400 shrink-0" />

                <div className="flex-1 min-w-0">
                    <label
                    htmlFor="flight-destination"
                    className="block text-xs text-slate-500 font-medium mb-1"
                    >
                    Destino
                    </label>

                    <select
                    id="flight-destination"
                    value={searchData.DestinationID}
                    name="DestinationID"
                    onChange={updateSearch}
                    disabled={loadingAirports || Boolean(airportsError)}
                    className="w-full min-w-0 bg-transparent text-base font-semibold
                                text-slate-800 outline-none cursor-pointer
                                disabled:opacity-50"
                    >
                    <option value="">
                      {loadingAirports
                        ? "Cargando aeropuertos..."
                        : "Selecciona destino"}
                    </option>
                    {airports.map((airport) => (
                      airport.id !== searchData.OrigenID && (
                        <option key={airport.id} value={airport.id}>
                          {airport.city} ({airport.code})
                        </option>
                      )
                    ))}
                    </select>
                </div>
                </div>

                {/* Salida */}
                <div className="flex min-w-0 w-full items-center gap-3 rounded-2xl border border-gray-200 p-3">

                <Calendar className="w-6 h-6 text-slate-400 shrink-0" />

                <div className="flex-1 min-w-0">
                    <label
                    htmlFor="departure-date"
                    className="block text-xs text-slate-500 mb-1"
                    >
                    Salida
                    </label>

                    <input
                    id="departure-date"
                    type="date"
                    name="departureDate"
                    value={searchData.departureDate}
                    onChange={updateSearch}
                    className="w-full min-w-0 bg-transparent text-base font-semibold
                                text-slate-800 outline-none"
                    />
                </div>
                </div>

                {/* Regreso: solamente para ida y vuelta */}
                {searchData.tripType === "round" && (
                <div className="flex min-w-0 w-full items-center gap-3 rounded-2xl border border-gray-200 p-3">

                    <Calendar className="w-6 h-6 text-slate-400 shrink-0" />

                    <div className="flex-1 min-w-0">
                    <label
                        htmlFor="return-date"
                        className="block text-xs text-slate-500 mb-1"
                    >
                        Regreso
                    </label>

                    <input
                        id="return-date"
                        type="date"
                        min={searchData.departureDate || undefined}
                        name="returnDate"
                        value={searchData.returnDate}
                        onChange={updateSearch}
                        className="w-full min-w-0 bg-transparent text-base font-semibold
                                text-slate-800 outline-none"
                    />
                    </div>
                </div>
                )}

            {/* Botón Buscar */}
            <button 
              onClick={handleSearch}
              className="flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#3b3b7a] p-4 text-white shadow-lg shadow-indigo-900/20 transition-colors hover:bg-[#2c2c5c] xl:w-auto">
              <Search className="w-5 h-5" />
              <span className="font-semibold">Buscar vuelos</span>
            </button>
          </div>
          {airportsError && (
            <p role="alert" className="text-sm text-red-600 mt-3">
              {airportsError}
            </p>
          )}
        </div>
      </div>

      </div>

      <FlightSearchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        searchData={searchData}
        searchResults={data}
      />
    </>
  );
}
