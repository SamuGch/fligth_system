import { useState } from "react";
import {
    X, 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    LogIn } from "lucide-react";

export default function LoginModal({ isOpen, onClose }) {
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-purple-300/10 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4
                     w-9 h-9
                     flex items-center justify-center
                     rounded-full
                     bg-purple-500/10
                     hover:bg-purple-500/20
                     transition"
        >
          <X className="w-5 h-5 text-purple-600" />
        </button>


        {/* Encabezado */}
        <div className="text-center mb-8">

          <div
            className="mx-auto mb-4
                       w-14 h-14
                       flex items-center justify-center
                       rounded-2xl
                       bg-violet-500/10"
          >
            <LogIn className="w-7 h-7 text-purple-600" />
          </div>

          <h2 className="text-2xl font-bold text-violet-300">
            Bienvenido
          </h2>

          <p className="text-sm text-purple-200 mt-2">
            Inicia sesión para continuar
          </p>

        </div>


        {/* Formulario */}
        <form className="space-y-5">

          {/* Correo */}
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Correo electrónico
            </label>

            <div className="relative">

              <Mail
                className="absolute left-4 top-1/2
                           -translate-y-1/2
                           w-5 h-5 text-purple-900"
              />

              <input
                type="email"
                placeholder="correo@ejemplo.com"
                className="w-full
                           pl-12 pr-4 py-3
                           rounded-2xl
                           bg-white/70
                           border border-gray-200
                           outline-none
                           text-purple-800
                           placeholder:text-purple-500
                           focus:border-purple-400
                           focus:ring-4
                           focus:ring-purple-500/10
                           transition"
              />

            </div>
          </div>    


          {/* Contraseña */}
          <div>

            <label className="block text-sm font-medium text-purple-200 mb-2">
              Contraseña
            </label>

            <div className="relative">

              <Lock
                className="absolute left-4 top-1/2
                           -translate-y-1/2
                           w-5 h-5 text-purple-900"
              />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full
                           pl-12 pr-12 py-3
                           rounded-2xl
                           bg-white/70
                           border border-gray-200
                           outline-none
                           text-purple-800
                           placeholder:text-purple-500
                           focus:border-purple-400
                           focus:ring-4
                           focus:ring-purple-500/10
                           transition"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2
                           -translate-y-1/2
                           text-purple-900
                           hover:text-purple-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>

            </div>

          </div>


          {/* Recordarme / recuperar */}
          <div className="flex items-center justify-between text-sm">

            <label className="flex items-center gap-2 text-purple-200">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-purple-300
                           text-purple-600 focus:ring-purple-500"
              />

              Recordarme
            </label>

            <button
              type="button"
              className="text-purple-600 hover:text-purple-700
                         font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>

          </div>


          {/* Botón */}
          <button
            type="submit"
            className="w-full
                       py-3.5
                       rounded-2xl
                       bg-purple-600
                       hover:bg-purple-700
                       text-white
                       font-semibold
                       shadow-lg shadow-purple-600/20
                       transition-all
                       hover:-translate-y-0.5"
          >
            Iniciar sesión
          </button>

        </form>


        {/* Registro */}
        <p className="text-center text-sm text-purple-500 mt-6">

          ¿No tienes una cuenta?

          <button
            className="ml-1
                       text-purple-600
                       font-semibold
                       hover:text-purple-700"
          >
            Crear cuenta
          </button>

        </p>

      </div>

    </div>
  );
}