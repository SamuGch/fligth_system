import MainNavbar from "../MainNavbar";

export default function AccountLayout({ children }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#f5f6fb] font-sans">
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-52 h-96 w-96 rounded-full bg-blue-200/35 blur-3xl" />
      <MainNavbar />
      <main className="relative z-10 mx-4 pb-14 pt-8 sm:mx-6 sm:pt-11 lg:mx-12 xl:mx-25">
        {children}
      </main>
    </div>
  );
}
