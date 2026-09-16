"use client";

import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/currency/format";
import type { SimEvent } from "../types";

interface EventCardProps {
  event: SimEvent;
  currencyCode: string;
  uiLocale: string;
  onChoose?: (choiceKey: string) => void;
  hasChosen: boolean;
}

const EVENT_ICON: Record<SimEvent["type"], string> = {
  expense: "⚠️",
  opportunity: "🤔",
  milestone: "🎉",
  windfall: "✨",
};

export function EventCard({ event, currencyCode, uiLocale, onChoose, hasChosen }: EventCardProps) {
  const t = useTranslations();
  return (
    <div className="rounded-md border-2 border-gold/40 bg-gold/5 p-sm">
      <p className="text-sm font-medium text-ink/70">
        {EVENT_ICON[event.type]} {t("simulator.somethingHappened")}
      </p>
      <p className="mt-2xs text-lg font-bold">{event.title}</p>
      <p className="mt-2xs text-base text-ink/80">{event.description}</p>

      {event.type === "expense" && event.costMinorUnits !== undefined && (
        <p className="mt-2xs text-sm text-ink/70">
          {t("simulator.costLabel", { amount: formatCurrency(event.costMinorUnits, currencyCode, uiLocale) })}
        </p>
      )}

      {event.type === "opportunity" && event.choices && !hasChosen && (
        <div className="mt-sm grid gap-2xs">
          {event.choices.map((choice) => (
            <button
              key={choice.key}
              type="button"
              onClick={() => onChoose?.(choice.key)}
              className="min-h-touch-min-child rounded-sm border-2 border-ink/20 px-sm py-2xs text-left hover:border-teal"
            >
              <span className="font-medium">{choice.label}</span>
              {choice.costMinorUnits > 0 && (
                <span className="ml-2xs text-sm text-ink/70">({formatCurrency(choice.costMinorUnits, currencyCode, uiLocale)})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
