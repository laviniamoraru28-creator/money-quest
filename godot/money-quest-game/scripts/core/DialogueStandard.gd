class_name DialogueStandard
extends RefCounted
## DialogueStandard — the dialogue rules every lesson is measured against,
## as one reusable check (see docs/money-quest-world-architecture.md,
## "Dialogue standard"). The child should learn by seeing, choosing and
## doing; words help, they are never the thing the child must read to play.
##
##   LINE      a spoken / narrated line         <= 12 words (aim for 8)
##   QUESTION  a choice or quiz question        <= 12 words
##   CHOICE    an answer on a button            <= 4 words
##   FEEDBACK  what happened (consequence,      <= 6 words
##             right / not yet, reward)
##   PICTURES  (visual-first) every line, question, answer and result has
##             pictures, so the beat still works with words off.
##
## Long text is not lost: a visual-first lesson keeps its full explanation
## as "More" (InfoLayers), which is never required and never measured here.
## Hidden curriculum fields (learning objective, key concept, vocabulary)
## are not on screen in play and are not measured either.
##
## check(lesson) returns every problem found. A lesson that has been brought
## up to the standard (visual_first) must have none; other lessons are
## reported, not failed — so the check can grow lesson by lesson.

const MAX_WORDS: Dictionary = {"line": 12, "question": 12, "choice": 4, "feedback": 6}
const AIM_LINE_WORDS: int = 8


## Words as a child reads them: "pop-up" and "Mum's" are one word each;
## "..." and "!" are not words.
static func word_count(text: String) -> int:
	var n: int = 0
	var letters := RegEx.create_from_string("[\\p{L}\\p{N}]")
	for w in text.strip_edges().split(" ", false):
		if letters.search(w):
			n += 1
	return n


## Everything the child sees in a lesson, as {kind, key, text, icons, where}.
static func beats(lesson: LessonData) -> Array:
	var out: Array = []
	for line in lesson.intro_dialogue:
		out.append(_beat("line", line.text_key, line.icons, "intro"))
	if lesson.choice_point:
		var cp: DialogueChoice = lesson.choice_point
		out.append(_beat("question", cp.situation_text_key, cp.situation_icons, "choice"))
		for o in cp.options:
			out.append(_beat("choice", o.label_key, [o.icon] if not o.icon.is_empty() else [], "choice"))
			if o.consequence:
				var c: ConsequenceEffect = o.consequence
				out.append(_beat("feedback", c.consequence_text_key, c.icons, "consequence"))
	if lesson.visual_first:
		for line in lesson.explanation_lines:
			out.append(_beat("line", line.text_key, line.icons, "explain"))
		for r in lesson.practice_rounds:
			out.append(_beat("question", String(r.get("question_key", "")), r.get("icons", []), "practice"))
			var opts: Array = r.get("options", [])
			var pics: Array = r.get("option_icons", [])
			for i in opts.size():
				out.append(_beat("choice", String(opts[i]), [pics[i]] if i < pics.size() else [], "practice"))
	if not lesson.quiz_question_key.is_empty():
		out.append(_beat("question", lesson.quiz_question_key, lesson.quiz_question_icons, "quiz"))
		for i in lesson.quiz_option_keys.size():
			var pic: Array = [lesson.quiz_option_icons[i]] if i < lesson.quiz_option_icons.size() else []
			out.append(_beat("choice", lesson.quiz_option_keys[i], pic, "quiz"))
		out.append(_beat("feedback", lesson.quiz_success_feedback_key, lesson.quiz_success_icons, "quiz"))
		out.append(_beat("feedback", lesson.quiz_retry_feedback_key, lesson.quiz_retry_icons, "quiz"))
	out.append(_beat("feedback", lesson.reward_message_key, ["coin"], "reward"))  # RewardPopup shows the coins
	return out.filter(func(b): return not String(b.key).is_empty())


static func _beat(kind: String, key: String, icons: Array, where: String) -> Dictionary:
	return {"kind": kind, "key": key, "text": Localization.t(key), "icons": icons, "where": where}


## Problems in one lesson (current locale): too many words, missing text,
## and — for a visual-first lesson — a beat with no pictures.
static func check(lesson: LessonData) -> Array:
	var problems: Array = []
	for b in beats(lesson):
		var text: String = b.text
		if text.is_empty() or text == b.key:
			problems.append({"rule": "missing_text", "key": b.key, "where": b.where, "text": text})
			continue
		var words: int = word_count(text)
		var limit: int = MAX_WORDS[b.kind]
		if words > limit:
			problems.append({"rule": "too_long_" + String(b.kind), "key": b.key, "where": b.where,
				"words": words, "max": limit, "text": text})
		if lesson.visual_first and (b.icons as Array).is_empty():
			problems.append({"rule": "no_pictures", "key": b.key, "where": b.where, "text": text})
	return problems


## True when this lesson must pass (it has been brought up to the standard).
static func is_strict(lesson: LessonData) -> bool:
	return lesson.visual_first


static func describe(p: Dictionary) -> String:
	if p.has("words"):
		return "%s %s (%d > %d words): %s" % [p.rule, p.key, p.words, p.max, p.text]
	return "%s %s: %s" % [p.rule, p.key, p.get("text", "")]
