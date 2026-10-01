class_name DialogueLine
extends Resource
## DialogueLine — one line of character or narrator speech.
##
## `speaker_id` is a structural id (e.g. "maya", "" for narrator captions)
## that a scene's NPC registry resolves to a display name/portrait —
## exactly the same "character id is structural, display name is
## translated" split the website's Leadership Quest content already uses
## for its own DialogueLine concept.

@export var speaker_id: String = ""
@export var text_key: String = ""
