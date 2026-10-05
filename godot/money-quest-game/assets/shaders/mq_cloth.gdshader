// Money Quest World — banners, flags, awnings and bunting. A slow ripple
// travels across the cloth (no cloth simulation, no physics): vertices
// move a few centimetres along the cloth's facing axis (local Z, the way
// every Landmark builds its banners). Vertex-colour albedo, like
// mq_sway.gdshader. `motion` = 0.0 with Reduced Motion: static cloth.
shader_type spatial;

uniform float motion = 1.0;
uniform float amplitude = 0.045;
uniform float speed = 1.5;

vec3 srgb_to_linear(vec3 c) {
	return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

void vertex() {
	float t = TIME * speed;
	float w = sin(t + VERTEX.x * 3.0 + VERTEX.y * 1.3) + 0.5 * sin(t * 1.7 + VERTEX.x * 5.0 - VERTEX.y);
	VERTEX.z += w * amplitude * motion;
}

void fragment() {
	ALBEDO = srgb_to_linear(COLOR.rgb);
	ROUGHNESS = 1.0;
	SPECULAR = 0.2;
}
