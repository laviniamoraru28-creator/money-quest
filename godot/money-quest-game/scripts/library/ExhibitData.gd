class_name ExhibitData
extends EntryData
## ExhibitData — one Museum exhibit entry (Money Through Time, Business
## Stories, Great Ideas, Financial Mistakes, Famous Failures, Leadership
## Stories, Innovation — see the original brief's Section 11). No
## historical story is invented for this architecture: every populated
## entry is real and verifiable, with its own source (inherited
## `source_name`/`source_type`/`source_url`/`verification_date`) — see
## data/museum/ for the first real entries and
## data/schemas/ENTRY_DATA_FORMAT.md for the rule.
##
## The four `what_*`/`what_we_learn_key` fields below are only set for a
## Failure Museum exhibit specifically (`exhibit_category ==
## "failure-museum"`) — they map directly to the brief's required
## structure for that category: factual, never glorifying the failure and
## never shaming the people involved.

@export var exhibit_category: String = ""   # "money-through-time" | "business-stories" | "failure-museum" | "great-ideas" | "leadership-stories" | "innovation"

@export_group("Failure Museum fields (only set when exhibit_category == \"failure-museum\")")
@export var what_happened_key: String = ""
@export var what_went_wrong_key: String = ""
@export var what_could_differ_key: String = ""
@export var what_we_learn_key: String = ""

## A Hub zone id for "Explore this in ___" (reuses WorldManager.travel_to()
## directly, same pattern as BookData/MentorData) — "" when no existing
## zone is a strong enough fit (project brief Section 29).
@export var cross_link_zone_id: String = ""

## A QuestData id for a small follow-up decision after reading this
## exhibit — e.g. the Museum of Mistakes' "Change the idea? Try again?
## Ask for feedback? Stop?" choice, whose real historical outcome is then
## revealed in the consequence text (never changed by which option the
## child picks). "" when no follow-up exists for this exhibit.
@export var followup_quest_id: String = ""
