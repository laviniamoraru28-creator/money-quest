class_name EntryData
extends Resource
## EntryData — base shape shared by Library books, Museum exhibits, and
## Library mentors: a "walk up, discover a real piece of content" entry,
## with no choice-and-consequence of its own (that's what QuestData/
## DialogueChoice are for — see docs/money-quest-world-architecture.md
## Section 6). Subclassed by BookData/ExhibitData/MentorData, never used
## directly.
##
## Foundation only this phase: no real book, exhibit, or mentor exists yet
## (see data/library/, data/museum/, both still empty) — the first one is
## a future, explicitly-approved content addition, never invented here.

@export var entry_id: String = ""
@export var title_key: String = ""
@export var summary_key: String = ""
## The fuller text, shown on "read more" — not loaded in the short summary
## view, so a child can skim many entries before reading one in depth.
@export var detail_key: String = ""
## For Library: a REAL, verifiable link to the actual book. "" until a
## real one is approved and added — never a placeholder or invented URL.
@export var source_url: String = ""
@export var icon_key: String = ""
