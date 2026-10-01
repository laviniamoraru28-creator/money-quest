class_name DialogueChoice
extends Resource
## DialogueChoice — the single decision beat of a lesson: a short
## situation and 2-4 ChoiceOptions, each with its own ConsequenceEffect.
##
## This is deliberately a SIMPLER model than Leadership Quest's branching
## multi-event missions (see docs/godot-architecture-plan.md Section 9) —
## most of the 30 real curriculum lessons present exactly one central
## decision per lesson (matching their `story`/`interactiveActivity`
## fields), so LessonData holds a single `choice_point` rather than an
## array of chained events. A future lesson that genuinely needs more than
## one sequential decision can extend this to an array without breaking
## existing content, the same additive-schema discipline the website's
## own state modules already follow.

@export var situation_text_key: String = ""
@export var options: Array[ChoiceOption] = []
