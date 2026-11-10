"use client";

import { useEffect } from "react";

/*
  Registers public/sw.js, which keeps a copy of the app itself on the phone,
  so CVcraft opens and works with no signal: your CVs and the PDF are made on the device.
  Only on the live site: while developing, a cached copy would hide your changes.
*/
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* the app still works online without it */
    });
  }, []);
  return null;
}
