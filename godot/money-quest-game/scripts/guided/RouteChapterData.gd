class_name RouteChapterData
extends Resource
## RouteChapterData — one chapter (level) of the guided adventure: a short
## run of missions that belong together (GuidedRoute plays them in order).

@export var chapter_id: String = ""
@export var order: int = 0
@export var title_key: String = ""
## The chapter as a picture (MissionStrip tokens).
@export var icons: Array[String] = []
@export var steps: Array[MissionStepData] = []
