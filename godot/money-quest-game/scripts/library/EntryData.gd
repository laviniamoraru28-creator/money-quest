class_name EntryData
extends Resource
## EntryData — base shape shared by Library books, Museum exhibits, and
## Library mentors: a "walk up, discover a real piece of content" entry,
## with no choice-and-consequence of its own (that's what QuestData/
## DialogueChoice are for — see docs/money-quest-world-architecture.md
## Section 6). Subclassed by BookData/ExhibitData/MentorData, never used
## directly.
##
## First real content was added once explicitly approved and supplied
## with official sources (see data/library/, data/mentors/) — see the
## sourcing fields below, added at that point (project brief Section 22).
## Still invention-blocked: every field stays empty until a real,
## verifiable entry with its own source is approved — never filled with
## placeholder content.

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

## Sourcing system (project brief Section 22) — every populated entry
## must carry where its facts came from, so the project stays factually
## accountable. Not shown to young children by default (the UI keeps
## these behind an optional "About this" / "Source" toggle) but always
## present for anyone who wants to check. Left empty only while the
## entry itself is still empty/unapproved.
@export var source_name: String = ""          # e.g. "DK (Dorling Kindersley)", "NASA"
@export var source_type: String = ""          # "official_publisher" | "museum" | "government" | "university" | "reputable_organization"
@export var verification_date: String = ""    # "YYYY-MM-DD" — when the source_url was last checked
