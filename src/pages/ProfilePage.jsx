import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import AccountLayout from "../components/account/AccountLayout";
import { useAuth } from "../context/AuthContext";
import { NAME_MAX_LENGTH, filterNameInput, nameValidationError, normalizeName } from "../tools/formValidation";

export default function ProfilePage() {
  const { client, updateProfile } = useAuth();
  const [form, setForm] = useState(() => ({
    nombre: client?.nombre || client?.first_name || "",
    apellido: client?.apellido || client?.last_name || "",
  }));
  const [message, setMessage] = useState("");

  const save = async (event) => {
    event.preventDefault();
    const validationError = nameValidationError(form.nombre, "El nombre") || nameValidationError(form.apellido, "El apellido");
    if (validationError) {
      setMessage(validationError);
      return;
    }
    try {
      await updateProfile({ nombre: normalizeName(form.nombre), apellido: normalizeName(form.apellido) });
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
          <label className="text-sm font-semibold text-slate-700">Nombre<input maxLength={NAME_MAX_LENGTH} value={form.nombre} onChange={(event) => setForm({ ...form, nombre: filterNameInput(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-violet-500" /></label>
          <label className="text-sm font-semibold text-slate-700">Apellido<input maxLength={NAME_MAX_LENGTH} value={form.apellido} onChange={(event) => setForm({ ...form, apellido: filterNameInput(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-violet-500" /></label>
          <label className="text-sm font-semibold text-slate-700">Correo<input disabled value={client?.email || client?.correo || ""} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-slate-500" /></label>
          <button className="btn-primary mt-2 rounded-xl py-3 font-semibold">Guardar cambios</button>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </form>
        <Link to="/reservas" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-violet-700">Ver mis viajes <ArrowRight size={17} /></Link>
      </section>
    </AccountLayout>
  );
}
