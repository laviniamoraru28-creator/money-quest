class_name BookData
extends EntryData
## BookData — one Library book entry. No books or authors are invented for
## this architecture: `author_key` and `source_url` (inherited) stay empty
## placeholders until a real, verifiable title is approved and added as
## content — see docs/money-quest-world-architecture.md Section 6 and
## Section 9 of the original brief ("Do not invent books. Do not invent
## authors."). The first real books were added once explicitly supplied
## by name/author/publisher/official source — see data/library/.

@export var author_key: String = ""
## "explorer" | "builder" | "strategist" — same age bands as LessonData,
## so a book can be shown alongside the lessons it suits.
@export var recommended_age_band: String = ""

## 3-5 short translation keys for the compact "What you'll discover"
## bullets shown on the book's card (never copied book text — short,
## original framing lines written for this project).
@export var discover_point_keys: Array[String] = []

## A Hub zone id to travel to for "Explore this topic in Money Quest" —
## "" when no corresponding Quest-track zone exists yet. Reuses
## WorldManager.travel_to() directly rather than inventing a new
## book-to-quest linking system.
@export var cross_link_zone_id: String = ""
