"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";

/**
 * Feedback is stored ONLY on this device (its own localStorage key,
 * separate from moneyquest_local_progress_v1 — see this file's own
 * "clearly separate parent feedback from children's learning
 * interactions" requirement). There is no backend to send it to: this
 * app has no server, no database, no account system. Rather than fake
 * a submission or quietly do nothing, the UI says exactly this, so a
 * parent filling it in isn't misled about where their words go. If a
 * real feedback channel is added later, this is the one place that
 * would need to change — the interface itself doesn't need to.
 */
const FEEDBACK_STORAGE_KEY = "moneyquest_feedback_v1";

interface StoredFeedback {
  rating: number;
  comment: string;
  submittedAt: string;
}

function readStoredFeedback(): StoredFeedback[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStoredFeedback(entries: StoredFeedback[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export default function FeedbackPage() {
  const t = useTranslations();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  function handleSubmit() {
    if (rating === 0) return;
    const existing = readStoredFeedback();
    const success = writeStoredFeedback([...existing, { rating, comment: comment.trim(), submittedAt: new Date().toISOString() }]);
    setSaveFailed(!success);
    setIsSubmitted(true);
  }

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-fog px-sm py-lg">
      <main className="mx-auto max-w-[600px]">
        <Link href="/" className="text-sm text-teal hover:underline">
          ← {t("common.moneyQuest")}
        </Link>
        <h1 className="mt-2xs font-display text-2xl font-bold">{t("feedback.title")}</h1>
        <p className="mt-2xs text-base text-ink/70">{t("feedback.privacyNote")}</p>

        <Card variant="place" className="mt-md">
          {isSubmitted ? (
            <div className="text-center">
              <p aria-hidden="true" className="text-3xl">🌟</p>
              <p className="mt-2xs font-display text-lg font-bold text-teal">{t("feedback.thankYouTitle")}</p>
              <p className="mt-2xs text-sm text-ink/70">
                {saveFailed ? t("feedback.saveFailedNote") : t("feedback.savedLocallyNote")}
              </p>
            </div>
          ) : (
            <>
              <p className="text-lg font-medium">{t("feedback.ratingQuestion")}</p>
              <div className="mt-2xs">
                <StarRating value={rating} onChange={setRating} label={t("feedback.ratingLabel")} />
              </div>

              <label htmlFor="feedback-comment" className="mt-md block text-base font-medium">
                {t("feedback.commentLabel")}
              </label>
              <textarea
                id="feedback-comment"
                value={comment}
                onChange={(e: { target: { value: string } }) => setComment(e.target.value)}
                rows={4}
                placeholder={t("feedback.commentPlaceholder")}
                className="mt-2xs w-full rounded-md border border-ink/20 bg-white p-sm text-base"
              />

              <Button
                variant="quest-primary"
                size="large"
                className="mt-md w-full"
                disabled={rating === 0}
                onClick={handleSubmit}
              >
                {t("feedback.submitButton")}
              </Button>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
