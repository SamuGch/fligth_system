import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react";
import AccountLayout from "../components/account/AccountLayout";

const faqs = [
  {
    question: "¿Cómo puedo modificar mi búsqueda?",
    answer:
      "Regresa a la pantalla de vuelos desde el botón “Modificar búsqueda” y elige una nueva ruta, fecha o cantidad de pasajeros.",
  },
  {
    question: "¿Dónde puedo consultar mis reservas?",
    answer:
      "Ingresa a tu cuenta y abre la sección “Mis viajes” para consultar el estado, los detalles y los documentos de tus reservas.",
  },
  {
    question: "¿Cómo funciona el proceso de pago?",
    answer:
      "Después de elegir tu vuelo y asientos, confirma los datos de los pasajeros y completa el pago desde nuestro flujo seguro de checkout.",
  },
  {
    question: "¿Necesito una cuenta para buscar vuelos?",
    answer:
      "No. Puedes buscar vuelos y revisar las opciones disponibles sin iniciar sesión. Necesitarás una cuenta para completar y administrar tus reservas.",
  },
];

const supportChannels = [
  {
    icon: MessageCircle,
    title: "Chat de soporte",
    description: "Estamos disponibles para orientarte durante tu compra.",
    detail: "Respuesta en pocos minutos",
  },
  {
    icon: Mail,
    title: "Correo electrónico",
    description: "Envíanos tu consulta y te responderemos con detalle.",
    detail: "soporte@airtravel.com",
  },
  {
    icon: Phone,
    title: "Atención telefónica",
    description: "Habla con un especialista sobre tu próximo viaje.",
    detail: "+502 2290 0000",
  },
];

function SupportCard({ channel }) {
  const Icon = channel.icon;

  return (
    <article className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_16px_45px_rgba(47,43,122,0.10)] backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/90 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f0ecfa] text-[#3b2b7a]">
          <Icon size={21} />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900">{channel.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{channel.description}</p>
          <p className="mt-3 text-sm font-bold text-[#3b2b7a]">{channel.detail}</p>
        </div>
      </div>
    </article>
  );
}

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSubmitted(false);
  };

  const submitForm = (event) => {
    event.preventDefault();
    setSubmitted(true);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <AccountLayout>
        <main className="mx-auto w-full max-w-7xl pb-12">
          <section className="mx-auto max-w-3xl text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#3b2b7a] text-white shadow-lg shadow-[#3b2b7a]/20">
              <HelpCircle size={28} />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-[#3b2b7a]">
              Centro de ayuda
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              ¿En qué podemos ayudarte?
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
              Encuentra respuestas rápidas sobre tus vuelos, reservas y pagos.
              Si necesitas más ayuda, nuestro equipo está listo para acompañarte.
            </p>
          </section>

          <section className="mx-auto mt-9 max-w-2xl rounded-2xl border border-white/80 bg-white/80 p-2 shadow-[0_16px_45px_rgba(47,43,122,0.10)] backdrop-blur-md">
            <label className="flex items-center gap-3 px-3 text-slate-500">
              <Search size={20} aria-hidden="true" />
              <span className="sr-only">Buscar en ayuda</span>
              <input
                type="search"
                placeholder="Busca una pregunta o tema"
                className="w-full bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
          </section>

          <section className="mt-10 grid gap-4 md:grid-cols-3">
            {supportChannels.map((channel) => (
              <SupportCard key={channel.title} channel={channel} />
            ))}
          </section>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_16px_45px_rgba(47,43,122,0.10)] backdrop-blur-md sm:p-7">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f0ecfa] text-[#3b2b7a]">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3b2b7a]">Preguntas frecuentes</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Resuelve tus dudas</h2>
                </div>
              </div>
              <div className="mt-6 divide-y divide-slate-200/80">
                {faqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div key={faq.question}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? -1 : index)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold text-slate-800 transition hover:text-[#3b2b7a]"
                      >
                        {faq.question}
                        {isOpen ? <ChevronUp size={18} className="shrink-0" /> : <ChevronDown size={18} className="shrink-0" />}
                      </button>
                      {isOpen && <p className="pb-4 pr-8 text-sm leading-6 text-slate-600">{faq.answer}</p>}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_45px_rgba(47,43,122,0.10)] backdrop-blur-md sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3b2b7a]">Contacto</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Escríbenos</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Cuéntanos qué necesitas y simularemos el envío de tu solicitud.</p>
              <form onSubmit={submitForm} className="mt-5 grid gap-3">
                <label className="text-sm font-semibold text-slate-700">
                  Nombre
                  <input required name="name" value={form.name} onChange={updateField} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white/80 p-3 outline-none transition focus:border-[#3b2b7a] focus:ring-2 focus:ring-[#3b2b7a]/15" />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Correo electrónico
                  <input required type="email" name="email" value={form.email} onChange={updateField} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white/80 p-3 outline-none transition focus:border-[#3b2b7a] focus:ring-2 focus:ring-[#3b2b7a]/15" />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Asunto
                  <input required name="subject" value={form.subject} onChange={updateField} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white/80 p-3 outline-none transition focus:border-[#3b2b7a] focus:ring-2 focus:ring-[#3b2b7a]/15" />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Mensaje
                  <textarea required name="message" rows="4" value={form.message} onChange={updateField} className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white/80 p-3 outline-none transition focus:border-[#3b2b7a] focus:ring-2 focus:ring-[#3b2b7a]/15" />
                </label>
                <button type="submit" className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#3b2b7a] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#2b205c] hover:shadow-lg">
                  <Mail size={17} />
                  Enviar consulta
                </button>
                {submitted && (
                  <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={18} />
                    ¡Listo! Recibimos tu consulta y te contactaremos pronto.
                  </p>
                )}
              </form>
            </section>
          </div>

          <section className="mt-6 flex flex-col gap-4 rounded-3xl border border-white/20 bg-slate-950/80 p-5 text-white shadow-[0_12px_30px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="shrink-0 text-violet-200" size={24} />
              <p className="text-sm leading-6 text-slate-200">Tus datos se mantienen protegidos durante toda tu experiencia con Air Travel.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-300">
              <Clock3 size={17} />
              Atención 24/7
            </div>
          </section>
        </main>
    </AccountLayout>
  );
}
