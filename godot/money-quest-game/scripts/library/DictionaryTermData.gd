class_name DictionaryTermData
extends Resource
## DictionaryTermData — one entry in the Financial/Business Dictionary.
## Deliberately NOT an EntryData subclass — a dictionary term has a
## simpler shape than a book/exhibit/mentor (no source_url, no icon, no
## "read more" detail): just a term, its definition, and which lessons use
## it.
##
## Unlike books/exhibits/mentors, Dictionary content is NOT invention-
## blocked: it is explicitly sourced from the real curriculum's own
## vocabulary (LessonData.vocabulary / VocabTerm) — the 77 terms already
## authored across the 30 real lessons are the correct starting set, never
## new definitions invented for Godot World (see docs/money-quest-world-
## architecture.md Section 6). `data/dictionary/goal.tres` and
## `data/dictionary/trade-off.tres` reuse builder_saving_l1's own
## vocabulary keys verbatim as the first worked examples.

@export var term_key: String = ""
@export var definition_key: String = ""
@export var related_lesson_ids: Array[String] = []
