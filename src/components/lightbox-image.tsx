"use client";

import { useState } from "react";

type LightboxImageProps = {
  src: string;
  alt: string;
  thumbClassName?: string;
  wrapperClassName?: string;
};

export default function LightboxImage({
  src,
  alt,
  thumbClassName = "h-full w-full object-cover",
  wrapperClassName = "block h-full w-full",
}: LightboxImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={wrapperClassName}
        aria-label="Ver imagen completa"
      >
        <img src={src} alt={alt} className={thumbClassName} />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/50 text-xl leading-none text-white hover:bg-black/70"
              aria-label="Cerrar vista completa"
            >
              x
            </button>
            <img
              src={src}
              alt={alt}
              className="max-h-[85vh] w-full rounded-lg border border-white/20 bg-[#f6f0e5] object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}