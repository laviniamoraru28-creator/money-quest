"use client";
import {useRef, useState} from "react";
import {useTranslations} from "next-intl";
import {amountInPence} from "@/lib/support/validation";
import {validatedCheckoutUrl} from "@/lib/commerce/client-messages";

export function SupportForm({locale, enabled}: {locale: string; enabled: boolean}) {
  const t = useTranslations("support");
  const [choice, setChoice] = useState("2");
  const [custom, setCustom] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef("");
  const submitting = useRef(false);
  const amount = choice === "custom" ? custom : choice;
  let pence = 0;
  try {pence = amountInPence(amount);} catch {/* Invalid custom amount is explained on submit. */}
  function changed() {requestId.current = ""; setError("");}
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (!pence || !adult) {setError(t("invalid")); return;}
    submitting.current = true; setBusy(true); setError("");
    requestId.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/api/support/checkout", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({amount, adult, locale, requestId: requestId.current})});
      const data = await response.json();
      if (!response.ok) {setError(t(data.code === "invalid" ? "invalid" : data.code === "rate" ? "rate" : "unavailable")); return;}
      window.location.assign(validatedCheckoutUrl(data.url));
    } catch {setError(t("unavailable"));}
    finally {submitting.current = false; setBusy(false);}
  }
  return <form onSubmit={submit} className="mt-6 rounded-2xl border border-teal/20 bg-white p-5" aria-busy={busy}>
    <fieldset disabled={busy}>
      <legend className="text-lg font-bold">{t("amount")}</legend>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["2", "5", "10", "custom"].map(value => <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border-2 p-3 ${choice === value ? "border-teal bg-cream" : "border-ink/20"}`}>
          <input type="radio" name="amount-choice" value={value} checked={choice === value} onChange={() => {setChoice(value); changed();}} className="accent-teal"/>
          <span>{value === "custom" ? t("custom") : `£${value}`}</span>
        </label>)}
      </div>
      {choice === "custom" && <div className="mt-4">
        <label htmlFor="support-amount" className="block font-bold">{t("custom")} (GBP)</label>
        <input id="support-amount" type="text" inputMode="decimal" maxLength={6} value={custom} onChange={event => {setCustom(event.target.value); changed();}} aria-describedby="support-limits" className="mt-2 min-h-12 w-full rounded-lg border border-ink/40 bg-white px-3 text-ink"/>
      </div>}
      <p id="support-limits" className="mt-3 text-sm">{t("limits")}</p>
      <p className="mt-4 text-lg font-bold" aria-live="polite">{t("selected")}: {pence ? `£${(pence / 100).toFixed(2)} GBP` : "…"}</p>
      <p className="mt-2">{t("once")}</p>
      <label className="mt-4 flex min-h-12 items-center gap-3"><input type="checkbox" checked={adult} onChange={event => setAdult(event.target.checked)} className="h-5 w-5 accent-teal"/>{t("adult")}</label>
      <button type="submit" disabled={!enabled || busy} className="mt-4 min-h-12 w-full rounded-xl bg-teal px-4 py-3 font-bold text-white disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal">{t("pay")}{busy ? "…" : ""}</button>
    </fieldset>
    {!enabled && <p className="mt-3" role="status">{t("unavailable")}</p>}
    {error && <p className="mt-3 font-bold" role="alert">{error}</p>}
  </form>;
}
