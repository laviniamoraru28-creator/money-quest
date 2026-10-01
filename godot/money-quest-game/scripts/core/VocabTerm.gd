class_name VocabTerm
extends Resource
## VocabTerm — one lesson-scoped vocabulary entry, matching the website's
## LessonVocabTerm shape ({term, definition}) exactly. Lesson-scoped, not a
## global glossary — same as the real curriculum (see docs/
## godot-architecture-plan.md Section 1.1: 77 terms across 30 lessons,
## each owned by its own lesson, not a shared table).

@export var term_key: String = ""
@export var definition_key: String = ""
