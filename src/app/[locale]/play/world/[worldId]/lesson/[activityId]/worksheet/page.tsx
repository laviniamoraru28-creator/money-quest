"use client";

import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getLessonStructureById } from "@/content/catalog";
import { getWorksheetFilename } from "@/content/worksheets";

/**
 * A thin, static page: just enough context (which lesson this
 * worksheet belongs to) plus a link straight to the PDF in
 * public/worksheets/{locale}/. The PDF itself is the deliverable —
 * opening it in a new tab gives the browser's own native PDF viewer,
 * which already has Print and Save-as-PDF built in on every desktop
 * and mobile browser, so there's no need for an embedded viewer, a
 * print library, or any JS beyond a plain link. Each locale's edition
 * is generated at build time (scripts/generate-localized-worksheets.py,
 * run as the first step of `npm run build`) from that locale's own
 * lesson story/quiz/challenge text in messages/{locale}.json — not a
 * machine translation of the English PDF, and not English-only.
 */
export default function WorksheetPage() {
  const params = useParams<{ worldId: string; activityId: string }>();
  const t = useTranslations();
  const locale = useLocale();

  const structure = getLessonStructureById(params.activityId);
  const filename = getWorksheetFilename(params.activityId);

  if (!structure || !filename) {
    return (
      <main id="main-content" tabIndex={-1} className="grid min-h-screen place-items-center bg-fog px-sm text-center">
        <div>
          <p className="text-base text-ink/70">{t("play.lessonNotAvailable")}</p>
          <Link href={`/play/world/${params.worldId}`} className="mt-sm inline-block text-teal-text hover:underline">
            {t("play.backToTheWorld")}
          </Link>
        </div>
      </main>
    );
  }

  const lessonTitle = t(`curriculum.${structure.id}.title`);

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[600px]">
        <div className="flex flex-wrap gap-2xs">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal-text transition-colors duration-quick hover:bg-teal/5"
          >
            <span aria-hidden="true">🏠</span> {t("nav.home")}
          </Link>
          <Link
            href={`/play/world/${params.worldId}/lesson/${params.activityId}`}
            className="inline-flex items-center justify-center gap-2xs rounded-sm border-[1.5px] border-teal bg-transparent px-sm py-2xs text-base font-medium text-teal-text transition-colors duration-quick hover:bg-teal/5"
          >
            <span aria-hidden="true">←</span> {t("worksheet.backToLesson")}
          </Link>
        </div>

        <h1 className="mt-sm font-display text-2xl font-bold">{t("worksheet.pageTitle")}</h1>
        <p className="mt-2xs text-base text-ink/70">{lessonTitle}</p>

        <a
          href={`/worksheets/${locale}/${filename}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-md inline-flex min-h-touch-min-child w-full items-center justify-center gap-2xs rounded-lg bg-teal px-md py-xs text-center font-medium text-white shadow-resting hover:bg-teal/90"
        >
          {t("worksheet.openButton")}
        </a>
        <p className="mt-2xs text-sm text-ink/70">{t("worksheet.printHint")}</p>

        <a
          href={`/worksheets/${locale}/money-quest-worksheets-answer-key.pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-md inline-block text-sm text-teal-text hover:underline"
        >
          {t("worksheet.answerKeyLink")}
        </a>
      </main>
    </div>
  );
}
