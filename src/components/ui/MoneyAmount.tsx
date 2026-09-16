import { formatCurrency } from "@/lib/currency/format";
import { Coin } from "./Coin";

interface MoneyAmountProps {
  amountMinorUnits: number;
  currencyCode: string;
  /** The UI's currently selected language — deliberately a required
   * prop, not read via a hook inside this component, since MoneyAmount
   * is used from both Server Components (which resolve it via
   * next-intl/server's getLocale()) and Client Components (via
   * next-intl's useLocale()) — a hook here would force this component
   * to pick one and break the other. */
  uiLocale: string;
  showCoinIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const TEXT_SIZE: Record<NonNullable<MoneyAmountProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-3xl",
};

/**
 * Every fictional amount shown to a child or parent renders through this
 * component (or directly through formatCurrency for contexts where the
 * coin icon isn't wanted, e.g. a Parent Portal table cell) — never a
 * hand-built "£" + number string anywhere else in the app.
 */
export function MoneyAmount({
  amountMinorUnits,
  currencyCode,
  uiLocale,
  showCoinIcon = false,
  size = "md",
  className = "",
}: MoneyAmountProps) {
  return (
    <span className={["inline-flex items-center gap-2xs font-bold tabular-nums", TEXT_SIZE[size], className].join(" ")}>
      {showCoinIcon && <Coin size={size} />}
      {formatCurrency(amountMinorUnits, currencyCode, uiLocale)}
    </span>
  );
}
