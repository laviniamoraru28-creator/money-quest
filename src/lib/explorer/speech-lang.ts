import { REGIONAL_LOCALES, isSupportedLocale } from "@/i18n/config";

/**
 * The BCP-47 tag Explorer components' own SpeechSynthesisUtterance calls
 * should use. `document.documentElement.lang` reliably holds the short
 * locale code (e.g. "ro") the <html> tag is set to, but the rest of the
 * app's narration (ReadAloudButton, GuidePanel, etc.) deliberately uses
 * the fuller regional tag (e.g. "ro-RO") via REGIONAL_LOCALES, since the
 * Web Speech API's voice selection on some browsers depends on getting
 * the more specific tag. Falls back to "en-GB" only if the <html> lang
 * is somehow missing or unrecognized.
 */
export function explorerSpeechLang(): string {
  const htmlLang = typeof document === "undefined" ? "" : document.documentElement.lang;
  return (isSupportedLocale(htmlLang) ? REGIONAL_LOCALES[htmlLang] : undefined) || "en-GB";
}
