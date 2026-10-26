import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import AccountLayout from "../components/account/AccountLayout";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
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
    <AccountLayout>
      <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(51,45,120,0.10)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">Tu cuenta</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">Mi perfil</h1>
        <form onSubmit={save} className="mt-7 grid gap-4">
          <label className="text-sm font-semibold text-slate-700">Nombre<input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-violet-500" /></label>
          <label className="text-sm font-semibold text-slate-700">Apellido<input value={form.apellido} onChange={(event) => setForm({ ...form, apellido: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-violet-500" /></label>
          <label className="text-sm font-semibold text-slate-700">Correo<input disabled value={client?.email || client?.correo || ""} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-slate-500" /></label>
          <button className="mt-2 rounded-xl bg-violet-700 py-3 font-semibold text-white transition hover:bg-violet-800">Guardar cambios</button>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </form>
        <Link to="/reservas" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-violet-700">Ver mis viajes <ArrowRight size={17} /></Link>
      </section>
    </AccountLayout>
  );
}
