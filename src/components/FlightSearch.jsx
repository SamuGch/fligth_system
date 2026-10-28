import { useEffect, useState, useRef } from "react";
import FlightSearchModal from "./FlightSearchModal";
import {
  Calendar,
  Search,
  ChevronDown,
  PlaneTakeoff,
  PlaneLanding
} from 'lucide-react';
import { obtenerAeropuertos } from "../services/aeropuertoService";
import * as Api from "../tools/Api";
import AirportCombobox from "./AirportCombobox";

export default function FlightSearch() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tripTypeOpen, setTripTypeOpen] = useState(false);
  const [airports, setAirports] = useState([]);
  const [loadingAirports, setLoadingAirports] = useState(true);
  const [airportsError, setAirportsError] = useState("");
  const [data, setData] = useState({})

  const departureRef = useRef(null);
  const returnRef = useRef(null);


  const openSelect = (ref) => {
    const element = ref.current;

    if (!element || element.disabled) return;

    element.focus();

    if (typeof element.showPicker === "function") {
      try {
        element.showPicker();
      } catch {
        // navegador podría no permitir
      }
    }
  };

  const openDatePicker = (ref) => {
    const element = ref.current;

    if (!element || element.disabled) return;

    element.focus();

    if (typeof element.showPicker === "function") {
      try {
        element.showPicker();
      } catch {
        // si el selector no puede abrirse
      }
    }
  };


  const [searchData, setSearchData] = useState({
    tripType: "round",
    OrigenID: 0,
    DestinationID: 0,
    departureDate: "",
    returnDate: ""
  });

  const updateSearch = (event) => {
    const { name, value } = event.target;

    // Logs de la rama HEAD
    console.log({ name }, { value });
    console.log({ event });

    // Actualización de estado funcional de la rama responsive2
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
    console.log({ searchData })

    const response = await Api.post("/vuelo/buscar", searchData);

    console.log({ response })
    setData(response)

    setModalOpen(true);
  };

  return (
    <>
      <div>
        {/* Search Widget */}
        <div className="relative z-20 -mt-42 sm:-mt-8 md:-mt-16 lg:-mt-23 mx-4 sm:mx-6 lg:mx-12 xl:mx-25">
          <div className="bg-white rounded-4xl p-5 py-5 shadow-[0_15px_45px_rgba(51,51,153,0.25),0_0_35px_rgba(140,155,255,0.25)] border border-white/70">
            {/* Top Row: Selectors */}
            <div className="flex items-center mb-4 gap-3 border-b border-gray-100 pb-4">
              <div className="relative inline-block">
                <button
                  onClick={() => setTripTypeOpen((open) => !open)}
                  aria-expanded={tripTypeOpen}
                  className="bg-[#333399] text-white px-6 py-2 rounded-full text-sm font-medium flex items-center justify-between gap-5 min-w-[180px] hover:bg-[#2c2c5c] transition-colors"
                >
                  {searchData.tripType === "round" ? "Ida y vuelta" : "Solo ida"}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${tripTypeOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {tripTypeOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 flex w-48 flex-col rounded-2xl border border-purple-300 bg-purple-50 py-2 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchData((current) => ({ ...current, tripType: "round" }));
                        setTripTypeOpen(false);
                      }}
                      className="min-h-11 px-4 text-left hover:bg-violet-100"
                    >
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

                    className={`w-5 h-5 transition-transform ${tripTypeOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {tripTypeOpen && (
                  <div className="absolute left-0 top-full mt-2 w-43 bg-purple-50 rounded-[10px] shadow-xl border border-purple-300 py-2 z-50 flex flex-col">
                    <button type="button" onClick={() => {
                      updateSearch("tripType", "round"); setTripTypeOpen(false);
                    }}
                    >
                      Ida y vuelta
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateSearch("tripType", "one");
                        setTripTypeOpen(false);
                      }}
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
            <div
              className={`grid grid-cols-1 md:grid-cols-2 items-center gap-3 ${searchData.tripType === "round"
                ? "xl:grid-cols-[1.5fr_1.5fr_1fr_1fr_auto]"
                : "xl:grid-cols-[1.5fr_1.5fr_1fr_auto]"
                }`}
            >
              {/* Origen */}
              <AirportCombobox
                label="Origen"
                icon={PlaneTakeoff}
                airports={airports}
                value={searchData.OrigenID}
                placeholder={
                  loadingAirports
                    ? "Cargando aeropuertos..."
                    : "Selecciona origen"
                }
                disabled={loadingAirports || Boolean(airportsError)}
                onChange={(airportId) => {
                  setSearchData((current) => ({
                    ...current,
                    OrigenID: airportId,
                    DestinationID:
                      Number(current.DestinationID) === Number(airportId)
                        ? 0
                        : current.DestinationID,
                  }));
                }}
              />


              {/* Destino */}
              <AirportCombobox
                label="Destino"
                icon={PlaneLanding}
                airports={airports.filter(
                  (airport) =>
                    Number(airport.id) !== Number(searchData.OrigenID)
                )}
                value={searchData.DestinationID}
                placeholder={
                  loadingAirports
                    ? "Cargando aeropuertos..."
                    : "Selecciona destino"
                }
                disabled={loadingAirports || Boolean(airportsError)}
                onChange={(airportId) => {
                  setSearchData((current) => ({
                    ...current,
                    DestinationID: airportId,
                  }));
                }}
              />

              {/* Salida */}
              <div onClick={(event) => { if (event.target.tagName === "INPUT") return; openDatePicker(departureRef); }} className="cursor-pointer min-w-0 w-full border border-gray-200 rounded-2xl p-3 flex items-center gap-5 hover:border-violet-400 transition-colors pl-5 pr-5 hover:border-[#3333CC] hover:bg-indigo-50/30 focus-within:border-[#3333CC] focus-within:ring-2 focus-within:ring-[#3333CC]/10 transition-all duration-200">

                <Calendar className="w-8 h-8 text-slate-600 shrink-0" />

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
                    ref={departureRef}
                    value={searchData.departureDate}
                    onChange={updateSearch}

                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Regreso: solamente para ida y vuelta */}
              {searchData.tripType === "round" && (
                <div onClick={(event) => { if (event.target.tagName === "INPUT") return; openDatePicker(returnRef); }} className="cursor-pointer min-w-0 w-full border border-gray-200 rounded-2xl p-3 flex items-center gap-5 hover:border-violet-400 transition-colors pl-5 pr-5 hover:border-[#3333CC] hover:bg-indigo-50/30 focus-within:border-[#3333CC] focus-within:ring-2 focus-within:ring-[#3333CC]/10 transition-all duration-200">

                  <Calendar className="w-8 h-8 text-slate-600 shrink-0" />

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
                      ref={returnRef}
                      value={searchData.returnDate}
                      onChange={updateSearch}
                      className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </div>
              )}


              {/* Botón Buscar */}
              <button
                onClick={handleSearch}
                className="w-full xl:w-auto bg-[#333399] hover:bg-[#2c2c5c] text-white rounded-full p-4 flex items-center justify-center gap-3 transition-colors shadow-lg shadow-indigo-900/20 whitespace-nowrap pl-5 pr-6 "  >
                <Search className="w-5 h-5" />
                <span className="font-semibold">Buscar vuelos</span>
              </button>
            </div>
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
