// Money Quest World — calm stylised water (fountain basins, Calm World
// stream and ponds). Flat geometry; a soft interference pattern drifts
// across it, nudging brightness and gloss by a few percent so the surface
// feels alive without sparkle, flicker or transparency. `motion` = 0.0
// with Reduced Motion freezes the pattern (a still, readable surface).
shader_type spatial;

uniform vec4 water_color : source_color = vec4(0.29, 0.62, 0.72, 1.0);
uniform float motion = 1.0;
uniform float speed = 0.6;
uniform float scale = 1.4;
uniform float strength = 0.06;

void fragment() {
	vec3 world = (INV_VIEW_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float t = TIME * speed * motion;
	float r = sin(world.x * scale + t) * sin(world.z * scale * 0.8 - t * 0.7)
		+ 0.5 * sin((world.x + world.z) * scale * 1.9 + t * 1.3);
	ALBEDO = water_color.rgb * (1.0 + r * strength);
	ROUGHNESS = 0.3 + 0.06 * r;
	SPECULAR = 0.35;
}
