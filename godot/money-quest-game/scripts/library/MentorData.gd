class_name MentorData
extends EntryData
## MentorData — one "Meet the Mentors" entry (a real, successful person
## presented as an educational mentor — see the original brief's Section
## 10). No mentor is invented or quoted for this architecture: every field
## below stays an empty placeholder until a real, factual biography is
## approved and added as content. Biographies must stay strictly factual
## when populated — no invented quotes, ever.
##
## Field shape maps directly to the brief's required mentor profile:
## who they are (title_key/summary_key, inherited), what they did
## (summary_key), what they learned (lesson_key), a mistake or challenge
## they faced (mistake_or_challenge_key), and a small challenge for the
## child (small_challenge_key).

@export var known_for_key: String = ""
@export var mistake_or_challenge_key: String = ""
@export var lesson_key: String = ""
@export var small_challenge_key: String = ""
