import { useState } from "react";
import FlightSearchModal from "./FlightSearchModal";
import { 
  Calendar, 
  Search,
  ChevronDown, 
  PlaneLanding 
} from 'lucide-react';
import { airports } from "../data/airports";

export default function FlightSearch() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tripTypeOpen, setTripTypeOpen] = useState(false);

  const [searchData, setSearchData] = useState({
    tripType: "round",
    origin: "GUA",
    destination: "MIA",
    departureDate: "",
    returnDate: "",
    passengers: 1,
    seatClass: "Economica",
  });

  const updateSearch = (field, value) => { 
    setSearchData((prev) => ({
        ...prev, [field]: value, 
    }));
  };

  const handleSearch = () => {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      tripType,
    } = searchData;

    if (origin === destination) {
      alert("El origen y el destino deben ser diferentes.");
      return;
    }

    if (!departureDate) {
      alert("Debes seleccionar una fecha de salida.");
      return;
    }

    const today = new Date();
    const todayLocal = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    if (departureDate < todayLocal) {
      alert("La fecha de salida no puede ser anterior a hoy.");
      return;
    }

    if (tripType === "round") {
      if (!returnDate) {
        alert("Debes seleccionar una fecha de regreso.");
        return;
      }

      if (returnDate < departureDate) {
        alert("El regreso no puede ser anterior a la salida.");
        return;
      }
    }

    setModalOpen(true);
  };

  return (
    <>
      <div>
      {/* Search Widget */}
      <div className="max-w-7xl mx-auto relative z-20 -mt-20 shadow-[0_15px_40px_rgba(59,43,122,0.18)] px-4 sm:px-6 lg:px-0">
        <div className="bg-white rounded-4xl p-6 py-4 shadow-2xl">
          {/* Top Row: Selectors */}
          <div className="flex gap-3 mb-4 border-b border-gray-100 pb-4">
            <div className="relative">
              <button
                onClick={() => setTripTypeOpen(!tripTypeOpen)}
                className="bg-[#4a4a8a] text-white px-6 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 "
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
                <div className="absolute left-0 top-full mt-2 w-48 bg-purple-50 rounded-2xl shadow-xl border border-purple-300 py-2 z-50"> 
                <button type="button" onClick={() => {updateSearch("tripType", "round"); setTripTypeOpen(false);

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
            
            {/* Pasajeros */}
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
            </div>

            {/* Clase */}
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

          </div>

          {/* Bottom Row: Inputs */}
          <div className="flex flex-col lg:flex-row items-center gap-4 px-2 sm:px-4 lg:px-0">
            {/* Origen */}
            <div className="flex-1 w-full border border-gray-200 rounded-2xl p-3">
                <label
                    htmlFor="flight-origin"
                    className="block text-xs text-slate-500 mb-1"
                >
                    Origen
                </label>

                <select
                    id="flight-origin"
                    value={searchData.origin}
                    onChange={(e) => updateSearch("origin", e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold
                            text-slate-800 outline-none cursor-pointer"
                >
                    {airports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                        {airport.city} ({airport.code})
                    </option>
                    ))}
                </select>
                </div>

            
                {/* Destino */}
                <div className="flex-1 w-full border border-gray-200 rounded-2xl p-3 flex items-center gap-3 hover:border-violet-400 transition-colors">

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
                    value={searchData.destination}
                    onChange={(e) =>
                        updateSearch("destination", e.target.value)
                    }
                    className="w-full bg-transparent text-sm font-semibold
                                text-slate-800 outline-none cursor-pointer"
                    >
                    {airports.map((airport) => (
                        <option key={airport.code} value={airport.code}>
                        {airport.city} ({airport.code})
                        </option>
                    ))}
                    </select>
                </div>
                </div>


            
                {/* Salida */}
                <div className="flex-1 w-full border border-gray-200 rounded-2xl p-3 flex items-center gap-3">

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
                    value={searchData.departureDate}
                    onChange={(e) =>
                        updateSearch("departureDate", e.target.value)
                    }
                    className="w-full bg-transparent text-sm font-semibold
                                text-slate-800 outline-none"
                    />
                </div>
                </div>

                {/* Regreso: solamente para ida y vuelta */}
                {searchData.tripType === "round" && (
                <div className="flex-1 w-full border border-gray-200 rounded-2xl p-3 flex items-center gap-3">

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
                        value={searchData.returnDate}
                        onChange={(e) =>
                        updateSearch("returnDate", e.target.value)
                        }
                        className="w-full bg-transparent text-sm font-semibold
                                text-slate-800 outline-none"
                    />
                    </div>
                </div>
                )}

            {/* Botón Buscar */}
            <button 
              onClick={() => handleSearch(true)}
              className="w-full lg:w-auto bg-[#3b3b7a] hover:bg-[#2c2c5c] text-white rounded-full p-4 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-900/20 whitespace-nowrap">
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
      />
    </>
  );
}
