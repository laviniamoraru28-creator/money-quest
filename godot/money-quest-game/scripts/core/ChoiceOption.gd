class_name ChoiceOption
extends Resource
## ChoiceOption — one selectable option within a DialogueChoice.
##
## No option is flagged "correct" here on purpose — the lesson's
## educational point is made through `consequence`, not through a
## right/wrong judgment on the choice itself (the same "no single correct
## answer" principle the website's `mission` game mechanic uses for
## exactly this kind of situational decision). A SEPARATE quiz step
## (LessonData's quiz_* fields) is where a genuinely factual right/wrong
## check belongs, matching how the website keeps its "mission" choices and
## its "quiz" question as two distinct concepts rather than conflating
## them.

@export var label_key: String = ""
@export var consequence: ConsequenceEffect
