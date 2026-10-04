extends Node
## MuseumManager — the registry for every real ExhibitData entry, loaded
## the same data-driven way LibraryManager loads books/mentors and
## QuestManager/WorldManager load quests/zones: dropping a new .tres into
## data/museum/ is the whole job of adding exhibit N, never a script
## edit. See docs/money-quest-world-architecture.md Section 6/11.
##
## A separate autoload from LibraryManager (rather than one more registry
## bolted onto it) because Museum is its own destination with its own
## content type — mirrors why Library and Museum are separate Hub
## portals/zones in the first place.

const EXHIBITS_DIR: String = "res://data/museum/"

var _exhibit_registry: Dictionary = {}   # entry_id -> ExhibitData


func _ready() -> void:
	var dir := DirAccess.open(EXHIBITS_DIR)
	if dir == null:
		push_warning("MuseumManager: could not open %s" % EXHIBITS_DIR)
		return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if file_name.ends_with(".tres"):
			var exhibit: ExhibitData = load(EXHIBITS_DIR + file_name)
			if exhibit != null:
				_exhibit_registry[exhibit.entry_id] = exhibit
		file_name = dir.get_next()
	dir.list_dir_end()


func get_exhibit(entry_id: String) -> ExhibitData:
	return _exhibit_registry.get(entry_id)


func get_all_exhibits() -> Array:
	return _exhibit_registry.values()
