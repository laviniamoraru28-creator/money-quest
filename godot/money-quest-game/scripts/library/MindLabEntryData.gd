class_name MindLabEntryData
extends EntryData
## MindLabEntryData — one freestanding, exploration-only Mind Lab entry: a
## calming strategy a child can try in Calm & Reset Lab, or a short "mind
## fact" in the Mind Lab Discovery Room. The same "walk up, discover a
## real piece of content, no choice, no pressure" shape as BookData/
## ExhibitData/MentorData (see docs/money-quest-world-architecture.md
## Section 6) — never wrapped in a QuestData, since nothing here is meant
## to be forced or graded (project brief Sections 3/12).
##
## Where a factual claim is made (e.g. "attention works like a spotlight"),
## the inherited `source_name`/`source_type`/`source_url`/`verification_date`
## fields carry it — honestly left empty when this project's sandboxed
## environment can't independently verify one specific official page,
## never guessed (same discipline as the Museum's M-Pesa/Post-it Note
## entries).

@export var entry_category: String = ""   # "calm-strategy" | "mind-fact"

## A Hub zone id for an optional "Want to explore a calm space?"-style
## button (project brief Section 7) — reuses WorldManager.travel_to()
## directly, same pattern as BookData/ExhibitData. "" when no cross-link
## applies to this entry.
@export var cross_link_zone_id: String = ""
