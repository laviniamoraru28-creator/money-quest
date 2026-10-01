class_name SavingsAllocationMiniGame
extends MiniGameBase
## SavingsAllocationMiniGame — a richer, week-by-week version of the
## website's "Reach Your Goal" numeric game (see docs/
## godot-architecture-plan.md Section 17). The website's version is a
## single numeric-entry round; this version lets the child make the SAME
## real decision the lesson's own story describes — "some weeks it's
## tempting to spend on small treats instead" — once per week, for
## several weeks, each time seeing a natural-language consequence rather
## than a running number.
##
## This is the lesson's actual "choice and consequence" moment (project
## brief Phase 6) — builder_saving_l1.tres deliberately leaves
## LessonData.choice_point empty and relies on THIS mini-game instead,
## since a single one-off choice would undersell a lesson that's
## specifically about a decision repeated over several weeks.
##
## Reused ChoicePanel/DialogueChoice/ChoiceOption/ConsequenceEffect —
## no bespoke UI was built for this mini-game; it is three ChoicePanel
## prompts in a row, which is exactly the kind of "reuse the existing
## mechanic, don't build a new component" discipline the brief's Phase 8
## asks for.

const ALLOWANCE_PER_WEEK: int = 10
const TREAT_SAVED_AMOUNT: int = 4   # how much of this week's allowance still goes to the goal if she treats herself
const SKETCHBOOK_GOAL: int = 24
const WEEK_COUNT: int = 3

var _saved_toward_goal: int = 0


func run(choice_panel: Node, dialogue_box: Node) -> void:
	await dialogue_box.show_text("lesson.builder_saving_l1.minigame.intro")

	for week in range(1, WEEK_COUNT + 1):
		var choice := DialogueChoice.new()
		choice.situation_text_key = "lesson.builder_saving_l1.minigame.week_prompt"

		var save_option := ChoiceOption.new()
		save_option.label_key = "lesson.builder_saving_l1.minigame.option_save"
		save_option.consequence = ConsequenceEffect.new()
		save_option.consequence.coin_delta = ALLOWANCE_PER_WEEK
		save_option.consequence.consequence_text_key = "lesson.builder_saving_l1.minigame.consequence_save"

		var treat_option := ChoiceOption.new()
		treat_option.label_key = "lesson.builder_saving_l1.minigame.option_treat"
		treat_option.consequence = ConsequenceEffect.new()
		treat_option.consequence.coin_delta = TREAT_SAVED_AMOUNT
		treat_option.consequence.consequence_text_key = "lesson.builder_saving_l1.minigame.consequence_treat"

		choice.options = [save_option, treat_option]

		var chosen: ChoiceOption = await choice_panel.show_choice(choice)
		_saved_toward_goal += chosen.consequence.coin_delta
		GameState.add_coins(chosen.consequence.coin_delta)
		await dialogue_box.show_text(chosen.consequence.consequence_text_key)

	if _saved_toward_goal >= SKETCHBOOK_GOAL:
		await dialogue_box.show_text("lesson.builder_saving_l1.minigame.outcome_success")
		finish("reached_goal")
	else:
		# Never shaming — a short, curious "what could change next time"
		# beat, matching the project's existing "safe place to practise,
		# not a test" principle, then lets the lesson continue normally
		# into its explanation/quiz rather than ending the lesson early.
		await dialogue_box.show_text("lesson.builder_saving_l1.minigame.outcome_short")
		finish("fell_short")
