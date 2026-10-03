class_name SortBucketData
extends Resource
## SortBucketData — one destination bucket for a SORT-kind quest's sorting
## mini-game (e.g. Leadership Quest's "The Pressure Test", sorting problems
## into "Deal with first / Deal with next / Can wait"). Tap-select-then-
## tap-bucket, never drag — same accessibility rationale as the website's
## own SortMechanic ("every drag interaction needs a non-drag alternative,
## so this mechanic simply never uses drag at all").

@export var bucket_key: String = ""
@export var label_key: String = ""
