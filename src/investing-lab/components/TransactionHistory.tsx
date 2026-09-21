"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/currency/format";
import type { DisplayCompany } from "../localized-types";
import type { Transaction } from "../types";

const MAX_SHOWN = 10;

interface TransactionHistoryProps {
  transactions: Transaction[];
  companies: DisplayCompany[];
  currencyCode: string;
}

export function TransactionHistory({ transactions, companies, currencyCode }: TransactionHistoryProps) {
  const t = useTranslations();
  const uiLocale = useLocale();

  if (transactions.length === 0) {
    return <p className="text-sm text-ink/60">{t("investingLab.noTransactionsYet")}</p>;
  }

  return (
    <ul className="grid gap-3xs">
      {transactions.slice(0, MAX_SHOWN).map((tx) => {
        const company = companies.find((c) => c.id === tx.companyId);
        const label = tx.type === "buy" ? t("investingLab.transactionBuyLine", { shares: tx.shares, company: company?.name ?? tx.companyId }) : t("investingLab.transactionSellLine", { shares: tx.shares, company: company?.name ?? tx.companyId });
        return (
          <li key={tx.id} className="flex items-center justify-between text-sm text-ink/70">
            <span>{label}</span>
            <span className="font-medium text-ink">{formatCurrency(tx.totalMinorUnits, currencyCode, uiLocale)}</span>
          </li>
        );
      })}
    </ul>
  );
}
