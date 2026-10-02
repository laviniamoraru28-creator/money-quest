class_name BookData
extends EntryData
## BookData — one Library book entry. No books or authors are invented for
## this architecture: `author_key` and `source_url` (inherited) stay empty
## placeholders until a real, verifiable title is approved and added as
## content — see docs/money-quest-world-architecture.md Section 6 and
## Section 9 of the original brief ("Do not invent books. Do not invent
## authors.").

@export var author_key: String = ""
## "explorer" | "builder" | "strategist" — same age bands as LessonData,
## so a book can be shown alongside the lessons it suits.
@export var recommended_age_band: String = ""
