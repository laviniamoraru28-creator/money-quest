@tool
class_name AmbientPart
extends RefCounted
## AmbientPart — helper for building one small, separately moving piece of
## a landmark (a globe, a clock hand, a page...) and registering it with
## the scene's AmbientDirector. The piece is still built with MeshMerger
## (so it is one or two draw calls), placed at its pivot, and tagged with
## how it moves:
##   "spin"  — continuous slow rotation around `axis` (speed in rad/s)
##   "sweep" — slow back-and-forth rotation of ±amplitude radians
##   "nod"   — rests, then occasionally lifts by up to amplitude radians
##   "bob"   — slow up-and-down of ±amplitude metres
## With Reduced Motion the director returns it to exactly this pose.


static func make(parent: Node3D, node_name: String, m: MeshMerger, pivot: Transform3D, kind: String, speed: float, amplitude: float = 0.0, axis: Vector3 = Vector3.UP, phase: float = 0.0) -> MeshInstance3D:
	var mi: MeshInstance3D = m.commit_to(parent, node_name, true)
	mi.transform = pivot
	mi.set_meta("mq_kind", kind)
	mi.set_meta("mq_speed", speed)
	mi.set_meta("mq_amp", amplitude)
	mi.set_meta("mq_axis", axis.normalized())
	mi.set_meta("mq_phase", phase)
	mi.add_to_group("mq_ambient")
	return mi
