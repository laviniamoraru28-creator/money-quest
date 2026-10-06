class_name AnswerOrder
extends RefCounted
## AnswerOrder — the one place that decides in which order answer choices
## appear, for every question in the game (quizzes, choices, "what would
## you do?" cards, spot-the-problem and sorting items).
##
## It never moves text away from its meaning: it returns a shuffled list of
## the ORIGINAL indices (display slot -> data index). Panels show
## options[order[slot]] and judge an answer by that data index, so the
## correct answer stays the correct answer wherever it lands.
##
## Randomisation: a Fisher–Yates shuffle with its own RandomNumberGenerator
## seeded from the system at start-up — uniform, so no position (first or
## otherwise) is favoured and no pattern can be learned.
##
## Resuming: while a question is on screen and not yet answered, its order
## is remembered under a stable question id (ProgressManager activity state,
## which is saved), so closing and reopening the game — or reopening the
## same question before answering — shows it in the same order. Once the
## question is answered (answered()), the next time it appears it is
## shuffled afresh.

const STATE_ID: String = "answer-orders"

static var _rng: RandomNumberGenerator


static func rng() -> RandomNumberGenerator:
	if _rng == null:
		_rng = RandomNumberGenerator.new()
		_rng.randomize()
	return _rng


## A fresh uniform shuffle of 0..count-1.
static func shuffled(count: int) -> Array[int]:
	var order: Array[int] = []
	for i in count:
		order.append(i)
	for i in range(count - 1, 0, -1):
		var j: int = rng().randi_range(0, i)
		var t: int = order[i]
		order[i] = order[j]
		order[j] = t
	return order


## The order to show `count` options of question `question_id` in: the
## remembered order if this question is still waiting for an answer,
## otherwise a new shuffle (which is then remembered until answered()).
static func order_for(question_id: String, count: int) -> Array[int]:
	var pending: Variant = ProgressManager.get_activity_state(STATE_ID, question_id, null)
	if pending is Array and (pending as Array).size() == count and _is_permutation(pending, count):
		var kept: Array[int] = []
		for v in pending:
			kept.append(int(v))
		return kept
	var order: Array[int] = shuffled(count)
	ProgressManager.set_activity_state(STATE_ID, question_id, order)
	return order


## The question was answered: forget its order (next time is a new shuffle).
static func answered(question_id: String) -> void:
	var state: Variant = ProgressManager.activity_state.get(STATE_ID, null)
	if state is Dictionary and (state as Dictionary).has(question_id):
		(state as Dictionary).erase(question_id)
		ProgressManager.activity_changed.emit(STATE_ID)


## A stable id for a question from its text keys (same question = same id).
static func question_id(prompt_key: String, option_keys: Array) -> String:
	return "%s|%s" % [prompt_key, str(option_keys).sha1_text().substr(0, 10)]


static func _is_permutation(values: Array, count: int) -> bool:
	var seen := {}
	for v in values:
		var i: int = int(v)
		if i < 0 or i >= count or seen.has(i):
			return false
		seen[i] = true
	return true
