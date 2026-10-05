// Money Quest World — gentle foliage sway (trees, willow fronds, flowers).
// Colour comes from the vertex colour baked by MeshMerger, so one material
// serves every leaf colour. Movement grows with height above the node's
// ground, so trunks and stems stay planted while crowns and flower heads
// move a little. `motion` is 1.0 normally and 0.0 with Reduced Motion
// (set by AmbientDirector) — the geometry then holds perfectly still.
shader_type spatial;

uniform float motion = 1.0;
uniform float amplitude = 0.05;
uniform float speed = 0.9;
uniform float height_start = 0.8;
uniform float height_full = 3.5;

vec3 srgb_to_linear(vec3 c) {
	return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

void vertex() {
	vec3 world = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float h = smoothstep(height_start, height_full, world.y - MODEL_MATRIX[3].y);
	float phase = dot(world.xz, vec2(0.31, 0.47));
	float t = TIME * speed;
	float sway = sin(t + phase) + 0.4 * sin(t * 2.3 + phase * 1.9);
	VERTEX.x += sway * amplitude * h * motion;
	VERTEX.z += cos(t * 0.8 + phase) * amplitude * 0.6 * h * motion;
}

void fragment() {
	ALBEDO = srgb_to_linear(COLOR.rgb);
	ROUGHNESS = 1.0;
	SPECULAR = 0.2;
}
