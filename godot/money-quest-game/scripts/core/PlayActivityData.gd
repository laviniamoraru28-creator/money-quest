class_name PlayActivityData
extends Resource
## PlayActivityData — one Universal Play & Learn activity as data: a list
## of steps that follow SEE → DO → CHOOSE → CONSEQUENCE → (REWARD), run by
## PlayActivity. A new activity (in any district) is a new .tres with steps;
## the runner and the systems it calls do not change.
##
## Each step is a Dictionary {"do": <kind>, ...params}. Kinds (see
## PlayActivity for exactly what each one does):
##   SEE          "highlight" {target}, "unhighlight" {target},
##                "point" {who, target}, "demonstrate_buy" {who, stall, product},
##                "say" {who, key} (optional words / voice — never required)
##   DO           "wait_collect" {targets}, "wait_near" {target, radius},
##                "walk" {who, to}
##   CHOOSE       "choose_purchase" {stall, choices}
##   CONSEQUENCE  "give_coins" {amount, from} (coins fly into the balance)
##   REWARD       "reward" {xp}
##   FLOW         "objective" {id, key, target}, "complete_objective" {id},
##                "wait" {seconds}
## Targets are names the zone gives the runner (its "context").

@export var activity_id: String = ""
## Shown in the help panel's "what you learned" (optional).
@export var learned_key: String = ""
@export var steps: Array[Dictionary] = []
