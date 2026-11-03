"use client";
import { useState } from "react";
import { certificateCopy } from "@/content/certificate-copy";
import type { Locale } from "@/i18n/config";
import type { AgeBand } from "@/types/database.types";

export function CertificateDownload({band, locale, date, onPrepared}: {
  band: AgeBand; locale: Locale; date?: string; onPrepared?: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const copy = certificateCopy[locale];
  async function download() {
    setBusy(true);setError(false);
    try {
      const {generateCertificatePdf} = await import("@/lib/certificates/pdf");
      const bytes = await generateCertificatePdf(band,locale,date,async path=>{
        const response=await fetch(path);
        if(!response.ok)throw new Error("Certificate asset unavailable");
        return new Uint8Array(await response.arrayBuffer());
      });
      const url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:"application/pdf"}));
      const anchor=document.createElement("a");
      anchor.href=url;anchor.download=`Money-Quest-${band}-${locale}.pdf`;
      document.body.appendChild(anchor);anchor.click();anchor.remove();
      if(onPrepared)onPrepared(url);
      else window.setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch{setError(true);}finally{setBusy(false);}
  }
  return <div>
    <button type="button" disabled={busy} onClick={download} className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-teal px-6 py-3 font-semibold text-white disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal">
      {busy?copy.preparing:copy.download}
    </button>
    <p role="status" aria-live="polite" className="mt-2 text-sm">{error?copy.error:busy?copy.preparing:""}</p>
  </div>;
}
