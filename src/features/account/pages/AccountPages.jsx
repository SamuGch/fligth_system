import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";

function AccountLayout({ title, children }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const leave = async () => {
    await signOut();
    navigate("/", { replace: true, state: { signOutSuccess: true } });
  };

  return (
    <main className="min-h-dvh bg-slate-50 p-5">
      <nav className="mx-auto flex max-w-3xl items-center justify-between">
        <Link to="/">Air Travel</Link>
        <button onClick={() => void leave()} className="text-sm text-violet-700">
          Cerrar sesión
        </button>
      </nav>
      <section className="mx-auto mt-8 max-w-3xl rounded-3xl bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {children}
      </section>
    </main>
  );
}

export function ProfilePage() {
  const { client, updateProfile } = useAuth();
  const [form, setForm] = useState(() => ({
    nombre: client?.nombre || client?.first_name || "",
    apellido: client?.apellido || client?.last_name || "",
  }));
  const [message, setMessage] = useState("");

  const save = async (event) => {
    event.preventDefault();
    try {
      await updateProfile(form);
      setMessage("Perfil actualizado.");
    } catch (profileError) {
      setMessage(profileError.message);
    }
  };

  return (
    <AccountLayout title="Mi perfil">
      <form onSubmit={save} className="mt-6 grid gap-4">
        <label>
          Nombre
          <input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} className="mt-1 w-full rounded-xl border p-3" />
        </label>
        <label>
          Apellido
          <input value={form.apellido} onChange={(event) => setForm({ ...form, apellido: event.target.value })} className="mt-1 w-full rounded-xl border p-3" />
        </label>
        <label>
          Correo
          <input disabled value={client?.email || client?.correo || ""} className="mt-1 w-full rounded-xl border bg-slate-100 p-3" />
        </label>
        <button className="rounded-xl bg-violet-700 py-3 font-semibold text-white">
          Guardar cambios
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
      <div className="mt-6 flex gap-4 text-sm text-violet-700">
        <Link to="/reservas">Mis reservas</Link>
        <Link to="/historial-compras">Historial de compras</Link>
      </div>
    </AccountLayout>
  );
}

export function ReservationsPage({ history = false }) {
  const location = useLocation();
  const flight = location.state?.selectedFlight;

  return (
    <AccountLayout title={history ? "Historial de compras" : "Mis reservas"}>
      {flight ? (
        <p className="mt-5 text-slate-700">
          Seleccionaste el vuelo {flight.flightNumber}. La continuación de
          asientos/compra se conectará aquí cuando el flujo de reservas esté disponible.
        </p>
      ) : (
        <p className="mt-5 text-slate-600">Aún no hay información para mostrar.</p>
      )}
    </AccountLayout>
  );
}
