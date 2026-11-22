// Shared by the server layout and the client toggle, so it must not live in a
// "use client" file (a server import of a client module gives a reference,
// not the value).
export const MODE_STORAGE_KEY = "salraza-mode";

/** Runs before paint (loaded from layout.tsx) so there is no flash of the
 * wrong mode. Saved choice wins, otherwise light. */
export const MODE_BOOT_SCRIPT = `try{var d=document.documentElement,m=localStorage.getItem("${MODE_STORAGE_KEY}");if(m!=="light"&&m!=="dark")m="light";d.dataset.mode=m}catch(e){}`;
