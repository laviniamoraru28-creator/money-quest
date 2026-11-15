import { ComicOverlayPOC } from "@/components/lesson/ComicOverlayPOC";

/**
 * Temporary, unlinked test route for the comic text-overlay proof of
 * concept (see this round's final report). Not part of the product —
 * remove once the approach is accepted or rejected.
 */
export default function ComicOverlayPocPage() {
  return (
    <main id="main-content" className="mx-auto max-w-screen-sm px-sm py-md">
      <h1 className="font-display text-xl font-bold">Comic text-overlay POC</h1>
      <ComicOverlayPOC />
    </main>
  );
}
