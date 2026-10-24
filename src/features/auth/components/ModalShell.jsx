import { useEffect } from "react";
import { X, Plane } from "lucide-react";

export default function ModalShell({ children, onClose, titleId }) {
  useEffect(() => {


    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);


  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);


  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="
                    relative
                    my-auto
                    w-full max-w-[520px]
                    max-h-[calc(100dvh-24px)]
                    overflow-y-auto
                    rounded-[24px] sm:rounded-[28px]
                    bg-white
                    p-5 sm:p-8
                    shadow-[0_25px_80px_rgba(18,15,65,0.30)]
                    motion-safe:animate-[authModalEnter_300ms_ease-out_both]
                  "



      >

        

                    
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="
                      absolute right-4 top-4
                      flex items-center justify-center
                      w-9 h-9
                      rounded-full
                      bg-[#F5F4FA]
                      text-[#64748B]
                      hover:bg-[#ECE9FA]
                      hover:text-[#333399]
                      transition-all duration-200
                      cursor-pointer
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-[#3333CC]/40
                    " >
          <X size={20} />
        </button>
        
          {children}
        
      </section>
    </div>
  );
}
