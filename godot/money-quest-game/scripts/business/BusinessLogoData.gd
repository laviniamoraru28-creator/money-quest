class_name BusinessLogoData
extends Resource
## BusinessLogoData — the 3 independent choices behind a child's
## Entrepreneur Quest BUILD logo (ports the real website's lightweight
## logo builder: shape x color x symbol, rendered as a plain procedural
## shape here — see LogoBuilderPanel.gd — never an image file).

@export var shape: String = "circle"       # one of "circle"/"square"/"hexagon"/"star"
@export var color_key: String = "teal"     # one of "teal"/"coral"/"gold"/"soft-blue"
@export var symbol: String = "🚀"
