extends Node
## BusinessBuilder — the single global entry point for the real
## website's Entrepreneur Quest BUILD stepper
## (src/app/[locale]/entrepreneur-quest/build/page.tsx): one linear,
## resumable sequence of all 18 real BUILD stages that builds ONE
## persistent `BusinessProfileData`, ending at a final pitch. This is
## the first Entrepreneur Quest feature with its own multi-step
## persistent state — every other zone so far ports one self-contained
## CHALLENGE quest (see docs/money-quest-world-architecture.md Section
## 3 for why that's been enough until now).
##
## Stages whose real content is already a ported CHALLENGE quest
## (`research-demand`, `test-the-idea`, `create-your-marketing`,
## `handle-competition`, `handle-a-customer-problem` [2 quests],
## `make-a-business-decision` [2 quests], `grow-your-business`) are NOT
## duplicated here — `_run_stage()` calls `QuestManager.start_quest()`
## for those, reusing the exact same already-built, already-translated
## content exactly once; if a quest was already completed via its own
## zone NPC, it's skipped rather than replayed. Every other stage needs
## a UI shape the quest system doesn't have — see the 6 new panels this
## phase adds (TextInputPanel, LogoBuilderPanel, CategoryPickerPanel,
## NumericInputPanel, SimulatorPanel, PitchDisplayPanel).

const STAGE_IDS: Array[String] = [
	"find-a-problem", "create-an-idea", "research-demand", "test-the-idea",
	"name-your-business", "create-your-logo", "choose-your-product",
	"choose-your-customer", "understand-costs", "set-your-price",
	"create-your-marketing", "make-your-first-sale", "calculate-your-profit",
	"handle-competition", "handle-a-customer-problem", "make-a-business-decision",
	"grow-your-business", "create-your-final-pitch",
]

const EQ_PRODUCT_CATEGORY_IDS: Array = ["food", "art", "crafts", "games", "pets", "sports", "fashion", "technology", "education", "environment", "helping-people", "other"]
const EQ_CUSTOMER_CATEGORY_IDS: Array = ["kids", "families", "teens", "adults", "school-community", "neighbors", "animal-lovers", "other"]
const EQ_MARKETING_APPROACH_IDS: Array = ["poster", "social-style-advert", "word-of-mouth", "school-community-idea", "special-offer"]

## Major-unit equivalents of the real site's own minor-unit constants
## (EQ_STARTING_MONEY_MINOR_UNITS=5000, EQ_TOTAL_POTENTIAL_CUSTOMERS=20)
## — see BusinessProfileData's own comment on why this project never
## applies minor-unit/currency formatting to its business-economy numbers.
const STARTING_MONEY: int = 50
const TOTAL_POTENTIAL_CUSTOMERS: int = 20

signal profile_changed

var profile: BusinessProfileData = BusinessProfileData.new()
var _active: bool = false


## Starts or resumes the Build-Your-Business flow — called by the
## Startup Mentor NPC. Walks every remaining stage in order; once every
## stage is done, shows the pitch (re-viewable any time after that),
## matching the real website's `/entrepreneur-quest/pitch` being
## reachable whenever `pitchCompleted` is true. Mirrors
## `QuestManager.start_quest()`'s own "only one flow at a time" guard —
## a second call while already building is ignored rather than
## overlapping two panel flows.
func start_building() -> void:
	if _active:
		push_warning("BusinessBuilder: already building, ignoring a second start_building() call")
		return
	_active = true

	if profile.completed_stage_ids.is_empty():
		await DialogueBox.show_text("eq_build.intro_greeting")

	while profile.completed_stage_ids.size() < STAGE_IDS.size():
		var stage_id: String = STAGE_IDS[profile.completed_stage_ids.size()]
		await _run_stage(stage_id)
		profile.completed_stage_ids.append(stage_id)
		profile_changed.emit()

	profile.pitch_completed = true
	profile_changed.emit()

	await PitchDisplayPanel.show_pitch(profile)
	_active = false


func _run_stage(stage_id: String) -> void:
	match stage_id:
		"find-a-problem":
			await DialogueBox.show_text("eq_stage.find_a_problem.learn_text")
			profile.problem = await TextInputPanel.show_text_input(
				"eq_stage.find_a_problem.field_label", "eq_stage.find_a_problem.placeholder",
				profile.problem, true, 200)
		"create-an-idea":
			await DialogueBox.show_text("eq_stage.create_an_idea.learn_text")
			profile.idea_description = await TextInputPanel.show_text_input(
				"eq_stage.create_an_idea.field_label", "eq_stage.create_an_idea.placeholder",
				profile.idea_description, true, 200)
		"research-demand":
			await _run_existing_quest("eq-research-demand-quest")
		"test-the-idea":
			await _run_existing_quest("eq-test-the-idea-quest")
		"name-your-business":
			await DialogueBox.show_text("eq_stage.name_your_business.learn_text")
			profile.business_name = await TextInputPanel.show_text_input(
				"eq_stage.name_your_business.field_label", "eq_stage.name_your_business.placeholder",
				profile.business_name, false, 40, "eq_build.safety_hint")
		"create-your-logo":
			await DialogueBox.show_text("eq_stage.create_your_logo.learn_text")
			profile.slogan = await LogoBuilderPanel.show_logo_builder(profile.logo, profile.slogan)
		"choose-your-product":
			await DialogueBox.show_text("eq_stage.choose_your_product.learn_text")
			var product_result: Dictionary = await CategoryPickerPanel.show_category_picker(
				"eq_stage.choose_your_product.category_label", EQ_PRODUCT_CATEGORY_IDS,
				"eq_build.category.product", true,
				"eq_stage.choose_your_product.description_label", "eq_stage.choose_your_product.description_placeholder",
				profile.product_category, profile.product_description)
			profile.product_category = product_result["category"]
			profile.product_description = product_result["description"]
		"choose-your-customer":
			await DialogueBox.show_text("eq_stage.choose_your_customer.learn_text")
			var customer_result: Dictionary = await CategoryPickerPanel.show_category_picker(
				"", EQ_CUSTOMER_CATEGORY_IDS,
				"eq_build.category.customer", false, "", "",
				profile.customer_category, "")
			profile.customer_category = customer_result["category"]
		"understand-costs":
			await DialogueBox.show_text("eq_stage.understand_costs.learn_text")
			profile.cost_per_unit = await NumericInputPanel.show_numeric_input(
				"eq_stage.understand_costs.field_label", "eq_stage.understand_costs.help_text", profile.cost_per_unit)
		"set-your-price":
			await DialogueBox.show_text("eq_stage.set_your_price.learn_text")
			profile.price = await NumericInputPanel.show_numeric_input(
				"eq_stage.set_your_price.field_label", "eq_stage.set_your_price.help_text", profile.price)
		"create-your-marketing":
			await DialogueBox.show_text("eq_stage.create_your_marketing.learn_text")
			var marketing_result: Dictionary = await CategoryPickerPanel.show_category_picker(
				"", EQ_MARKETING_APPROACH_IDS,
				"eq_build.category.marketing", false, "", "",
				profile.marketing_approach, "")
			profile.marketing_approach = marketing_result["category"]
			await _run_existing_quest("eq-create-your-marketing-quest")
		"make-your-first-sale":
			await DialogueBox.show_text("eq_stage.make_your_first_sale.learn_text")
			var run: Dictionary = await SimulatorPanel.show_simulator(
				profile.cost_per_unit, profile.price, STARTING_MONEY, TOTAL_POTENTIAL_CUSTOMERS)
			profile.has_simulator_run = true
			profile.last_units_made = run["units_made"]
			profile.last_units_sold = run["units_sold"]
			profile.last_sales = run["sales"]
			profile.last_costs = run["costs"]
			profile.last_profit = run["profit"]
			profile.last_remaining_money = run["remaining"]
		"calculate-your-profit":
			await DialogueBox.show_text("eq_stage.calculate_your_profit.learn_text")
			if profile.has_simulator_run:
				await DialogueBox.show_text("eq_stage.calculate_your_profit.result_hint")
				await DialogueBox.show_text("eq_stage.calculate_your_profit.profit_amount", {"amount": profile.last_profit})
			else:
				await DialogueBox.show_text("eq_stage.calculate_your_profit.no_run_yet_hint")
		"handle-competition":
			await _run_existing_quest("eq-handle-competition-quest")
		"handle-a-customer-problem":
			await _run_existing_quest("eq-handle-rising-costs-quest")
			await _run_existing_quest("eq-handle-a-customer-problem-quest")
		"make-a-business-decision":
			await _run_existing_quest("eq-make-a-business-decision-quest")
			await _run_existing_quest("eq-teammate-wants-change-quest")
		"grow-your-business":
			await _run_existing_quest("eq-grow-your-business-quest")
		"create-your-final-pitch":
			await DialogueBox.show_text("eq_stage.create_your_final_pitch.learn_text")
			profile.why_choose_us = await TextInputPanel.show_text_input(
				"eq_stage.create_your_final_pitch.why_choose_label", "eq_stage.create_your_final_pitch.why_choose_placeholder",
				profile.why_choose_us, true, 200)
			profile.next_step = await TextInputPanel.show_text_input(
				"eq_stage.create_your_final_pitch.next_step_label", "eq_stage.create_your_final_pitch.next_step_placeholder",
				profile.next_step, true, 200)


## Runs a quest already built by another Entrepreneur Quest zone,
## skipping it if the child already completed it there — never
## replayed twice.
func _run_existing_quest(quest_id: String) -> void:
	if not QuestManager.is_quest_completed(quest_id):
		await QuestManager.start_quest(quest_id)
