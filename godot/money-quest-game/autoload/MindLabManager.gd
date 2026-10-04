extends Node
## MindLabManager — the registry for every real MindLabEntryData entry,
## loaded the same data-driven way LibraryManager/MuseumManager load
## books/mentors/exhibits: dropping a new .tres into data/mindlab/ is the
## whole job of adding entry N, never a script edit. See
## docs/money-quest-world-architecture.md Section 7/11.

const ENTRIES_DIR: String = "res://data/mindlab/"

var _entry_registry: Dictionary = {}   # entry_id -> MindLabEntryData


func _ready() -> void:
	var dir := DirAccess.open(ENTRIES_DIR)
	if dir == null:
		push_warning("MindLabManager: could not open %s" % ENTRIES_DIR)
		return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if file_name.ends_with(".tres"):
			var entry: MindLabEntryData = load(ENTRIES_DIR + file_name)
			if entry != null:
				_entry_registry[entry.entry_id] = entry
		file_name = dir.get_next()
	dir.list_dir_end()


func get_entry(entry_id: String) -> MindLabEntryData:
	return _entry_registry.get(entry_id)


func get_all_entries() -> Array:
	return _entry_registry.values()
