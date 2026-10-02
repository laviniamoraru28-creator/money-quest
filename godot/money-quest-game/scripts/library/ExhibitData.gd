class_name ExhibitData
extends EntryData
## ExhibitData — one Museum exhibit entry (Money Through Time, Business
## Stories, Great Ideas, Financial Mistakes, Famous Failures, Leadership
## Stories, Innovation — see the original brief's Section 11). No
## historical story is invented for this architecture — this is schema
## only; a real, verified story is a future, explicitly-approved content
## addition.
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
