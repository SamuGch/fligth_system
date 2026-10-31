import MainNavbar from "../MainNavbar";

export default function AccountLayout({ children }) {
  return (
    <div
      className="relative min-h-dvh overflow-x-hidden bg-cover bg-center bg-fixed font-sans"
      style={{ backgroundImage: 'url("/allFonts.png")' }}
    >
      <MainNavbar className="!fixed !left-4 !right-4 !top-3 !mx-0 sm:!left-6 sm:!right-6 sm:!top-5 lg:!left-12 lg:!right-12 xl:!left-25 xl:!right-25" />
      <main className="relative z-10 px-4 pb-8 pt-24 sm:px-6 lg:pt-32 lg:mx-12 xl:mx-25">
        {children}
      </main>
    </div>
  );
}
