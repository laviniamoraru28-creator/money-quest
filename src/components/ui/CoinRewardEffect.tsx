"use client";
import {useEffect, useRef, useState} from "react";
import {useLocale} from "next-intl";
import {reviewsCopy} from "@/content/reviews-copy";
import {isSupportedLocale, type Locale} from "@/i18n/config";
import {formatLocalizedText} from "@/lib/i18n/format-text";
import {Coin} from "./Coin";
import {formatCurrency} from "@/lib/currency/format";
import {useAccessibilityPrefs} from "@/lib/accessibility/use-accessibility-preferences";

type Award = {amount: number; currency: string; key: number};
export function CoinRewardEffect() {
  const [award, setAward] = useState<Award | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  const {reducedMotion} = useAccessibilityPrefs();
  const uiLocale = useLocale();
  const locale: Locale = isSupportedLocale(uiLocale) ? uiLocale : "en";

  useEffect(() => {
    const receive = (event: Event) => {
      const value = (event as CustomEvent<{amount?: number; currency?: string}>).detail;
      if (!value || !Number.isSafeInteger(value.amount) || (value.amount ?? 0) <= 0 ||
          typeof value.currency !== "string" || !/^[A-Z]{3}$/.test(value.currency)) return;
      sequence.current += 1;
      setAward({amount: value.amount as number, currency: value.currency, key: sequence.current});
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setAward(null), 2400);
    };
    window.addEventListener("moneyquest-coin-award", receive);
    return () => {
      window.removeEventListener("moneyquest-coin-award", receive);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center" aria-live="polite" aria-atomic="true">
    {award && <div key={award.key} data-coin-award data-reduced-motion={reducedMotion ? "true" : "false"}
      className="mq-coin-celebration relative flex max-w-[min(90vw,25rem)] flex-col items-center rounded-3xl border-2 border-gold bg-white/95 px-6 py-5 text-center shadow-floating">
      <div aria-hidden="true" className="relative h-28 w-40">
        <span className="mq-coin-fly mq-coin-fly-left absolute left-1 top-9"><Coin size="sm"/></span>
        <span className="mq-coin-fly mq-coin-fly-right absolute right-1 top-9"><Coin size="sm"/></span>
        <span className="mq-coin-fly mq-coin-fly-top absolute left-[43%] top-1"><Coin size="sm"/></span>
        <span className="mq-coin-main absolute left-1/2 top-8 -translate-x-1/2"><Coin/></span>
        <span className="mq-coin-spark absolute left-3 top-1 text-xl">✦</span>
        <span className="mq-coin-spark absolute right-3 top-3 text-xl">✦</span>
      </div>
      <p className="text-xl font-bold text-teal-text">
        {formatLocalizedText(reviewsCopy[locale].coins, locale, {amount: formatCurrency(award.amount, award.currency, locale)})}
      </p>
    </div>}
  </div>;
}
