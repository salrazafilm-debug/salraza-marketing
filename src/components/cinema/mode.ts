// Shared by the server layout and the client toggle, so it must not live in a
// "use client" file (a server import of a client module gives a reference,
// not the value).
export const MODE_STORAGE_KEY = "salraza-mode";

/** The site is always dark (the design is built for it); this also clears any
 * light choice saved by the old light/dark switch. */
export const MODE_BOOT_SCRIPT = `try{document.documentElement.dataset.mode="dark";localStorage.removeItem("${MODE_STORAGE_KEY}")}catch(e){}`;
