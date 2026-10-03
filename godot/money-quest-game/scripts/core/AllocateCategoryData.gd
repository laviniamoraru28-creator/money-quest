class_name AllocateCategoryData
extends Resource
## AllocateCategoryData — one category in an ALLOCATE-kind quest's budget
## mini-game (e.g. Leadership Quest's "The Deadline", splitting a fixed
## amount of time across tasks). `target_amount`/`tolerance_amount` define
## a passing RANGE, not one rigid split — AllocatePanel checks every
## category is within its own tolerance AND the full total is allocated,
## same contract the website's own AllocateMechanic uses. Plain integers,
## no currency formatting — Leadership Quest's allocation is time
## (minutes), not money.

@export var category_key: String = ""
@export var label_key: String = ""
@export var target_amount: int = 0
@export var tolerance_amount: int = 0
