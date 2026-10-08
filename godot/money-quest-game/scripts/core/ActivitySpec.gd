class_name ActivitySpec
extends Resource
## ActivitySpec — what an activity is, as data: the competencies it
## develops, which one sets its challenge level, its information layers
## (InfoLayers) and its quality checklist (ActivityChecklist). Every major
## activity has one (data/activities/*_spec.tres) and registers it with
## Competency, so it can be audited and scaled the same way as the others.

@export var activity_id: String = ""
## Competency ids (Competency.ALL) this activity develops.
@export var competencies: Array[String] = []
## The competency whose level sets the challenge ("" = the lowest listed).
@export var primary_competency: String = ""
## Optional deeper information: an InfoLayers topic id ("" = none).
@export var info_topic: String = ""
## The quality checklist (ActivityChecklist.CRITERIA ids → "auto" when an
## automated test covers it, "manual" when a person must judge it, or a
## short note). Filled in when the activity is reviewed.
@export var checklist: Dictionary = {}
