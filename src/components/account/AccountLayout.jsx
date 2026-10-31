import MainNavbar from "../MainNavbar";

export default function AccountLayout({ children }) {
  return (
    <div
      className="relative min-h-dvh overflow-x-hidden bg-cover bg-center bg-fixed font-sans"
      style={{ backgroundImage: 'url("/font.jpeg")' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-white/35 backdrop-blur-md" />
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-52 h-96 w-96 rounded-full bg-blue-200/35 blur-3xl" />
      <MainNavbar className="!fixed !left-4 !right-4 !top-3 !mx-0 sm:!left-6 sm:!right-6 sm:!top-5 lg:!left-12 lg:!right-12 xl:!left-25 xl:!right-25" />
      <main className="relative z-10 mx-4 pb-14 pt-24 sm:mx-6 sm:pt-28 lg:mx-12 xl:mx-25">
        {children}
      </main>
    </div>
  );
}
