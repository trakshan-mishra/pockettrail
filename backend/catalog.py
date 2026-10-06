"""Original outdoor activities. Model output cannot invent places or routes."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Activity:
    id: str
    title: str
    instruction: str
    prompt: str
    sense: str
    interests: tuple[str, ...]
    settings: tuple[str, ...] = ("park", "garden", "neighborhood")
    needs: tuple[str, ...] = ()
    conditions: tuple[str, ...] = ("daytime",)


CATALOG = [
    Activity("sound-map", "Listen beyond the obvious", "Find a comfortable place to pause. Listen for one nearby sound and one distant sound. Notice how they change when you give them your attention.", "What sound would you usually miss?", "Listen", ("calm", "curious"), conditions=("daytime", "evening", "rainy")),
    Activity("leaf-shapes", "Find three different shapes", "Look at leaves on plants or already on the ground. Compare three outlines without picking anything. Notice edges, symmetry, and the spaces between them.", "Which shape surprised you?", "Look", ("curious", "create"), ("park", "garden")),
    Activity("color-palette", "Collect a palette, not objects", "Choose a small area you can see from where you are. Find three natural colors, then look for a softer or darker version of each. Leave everything where it is.", "Name your three colors.", "Look", ("create", "curious")),
    Activity("sky-window", "Give the sky a few minutes", "Look at a comfortable patch of sky, away from the sun. Notice its color and the movement of clouds, if there are any. Let your attention stay there for a little while.", "What changed while you watched?", "Look", ("calm", "curious")),
    Activity("shadow-patterns", "Notice the moving shadows", "Look for a patch of shade near you. Notice the patterns made by branches, leaves, or nearby structures. Compare one soft edge with one sharp edge.", "Describe one pattern you found.", "Look", ("create", "curious")),
    Activity("small-movement", "Wait for a tiny movement", "Watch one small area without approaching or disturbing animals. Look for a moving leaf, an insect passing through, or a bird in the distance. Describe what you see without naming a species.", "What moved first?", "Look", ("curious", "calm")),
    Activity("texture-eye", "Read the textures around you", "Observe a tree, a leaf, or a stone from a comfortable distance. Notice ridges, smooth patches, and repeating marks. Imagine how you would describe the texture using just three words.", "What are your three words?", "Look", ("curious", "create")),
    Activity("wind-notice", "Watch the wind at work", "Pause and notice what the air is moving: leaves, grass, clouds, or loose fabric nearby. Look for something that moves differently from everything else.", "How could you tell the air was moving?", "Feel", ("calm", "curious")),
    Activity("two-scales", "Look close, then look wide", "First notice a small detail within view. Then look at the wider scene around it. Move your attention between the two and notice what you missed at each scale.", "What did the wider view add?", "Look", ("curious", "create")),
    Activity("bird-listen", "Listen without needing a name", "Stay still and listen for animal sounds, if any are present. Notice their rhythm, pitch, and pauses. There is no need to identify the animal; the pattern itself is enough.", "Describe a rhythm, or the quiet.", "Listen", ("curious", "calm"), conditions=("daytime", "evening")),
    Activity("green-edges", "Find where green meets the city", "From your current spot, look for a plant growing beside a path, wall, fence, or building. Notice how its shape contrasts with the straight edges around it.", "Where did you notice a contrast?", "Look", ("curious", "create")),
    Activity("quiet-minute", "Take one unhurried pause", "Choose a comfortable place outdoors. Let your gaze rest on something natural. Notice a sound, a color, and the feeling of the air, without needing to change anything.", "What feels different after the pause?", "Feel", ("calm", "curious")),
    Activity("memory-sketch", "Sketch what stays with you", "Choose a leaf, branch, cloud, or another natural detail within view. Look at it, then make a quick sketch on paper. Simple lines are enough; this is about noticing, not drawing well.", "Which detail made it into your sketch?", "Create", ("create", "curious"), needs=("drawing",)),
    Activity("photo-detail", "Frame one overlooked detail", "If you brought a camera and want to use it, frame one natural detail without approaching or disturbing wildlife. Take one photo, then put the camera away and look at the same scene again.", "What did you notice after putting the camera away?", "Create", ("create", "curious"), needs=("camera",)),
    Activity("same-spot", "See a familiar place again", "Pick a small outdoor scene you know well. Look at it as if you were visiting for the first time. Find one detail you could describe to someone who has never been here.", "What would you tell a first-time visitor?", "Look", ("curious", "create", "calm")),
    Activity("evening-rhythm", "Hear the evening settle", "Pause in a familiar, comfortable spot. Listen for a repeating sound and the quiet between repetitions. Notice what is close and what seems far away; there is no need to find its source.", "What rhythm stayed with you?", "Listen", ("calm", "curious", "create"), conditions=("evening",)),
    Activity("evening-sky", "Let the evening sky be enough", "From a familiar, comfortable spot, look at a patch of evening sky you can already see. Notice light, darkness, or clouds, if visible. If the sky is hidden, simply listen to the space beyond your view.", "What could you notice without bright light?", "Look", ("calm", "curious", "create"), conditions=("evening",)),
    Activity("evening-air", "Notice the air at dusk", "Stay in your comfortable spot. Notice whether the air feels still or moving, cool or warm. Keep your attention on that small sensation for a moment, then notice one nearby sound.", "How would you describe the evening air?", "Feel", ("calm", "curious", "create"), conditions=("evening",)),
    Activity("rain-rhythm", "Find a rhythm in the rain", "Stay dry in a sheltered spot. Listen to rain on a roof, leaves, or a nearby surface, if audible. Notice a steady rhythm and a change in it. If the rain is quiet, listen to the sheltered space around you.", "Which rain sound caught your attention?", "Listen", ("calm", "curious", "create"), conditions=("rainy",)),
    Activity("rain-contrast", "Listen on either side of shelter", "Stay comfortably sheltered and dry. Compare the closest sound with one from farther away. Notice how shelter changes what you hear, without moving out into the rain.", "What sounded different from your sheltered spot?", "Listen", ("calm", "curious", "create"), conditions=("rainy",)),
    Activity("rain-description", "Give the rain three words", "From a dry, sheltered spot, listen to rain or the quiet around it. Choose three words for its rhythm, softness, or pauses. Say the words to yourself; you do not need a camera or paper.", "What were your three words?", "Create", ("create", "calm", "curious"), conditions=("rainy",)),
    Activity("window-sound", "Listen from your own little corner", "Stay comfortably inside by a window or on a sheltered balcony. Listen for one sound from outside, if audible, and one nearer to you. If the window keeps outside sounds away, notice the quiet between nearby sounds instead.", "What reached you from your little corner?", "Listen", ("calm", "curious"), ("window",), conditions=("daytime", "evening", "rainy")),
    Activity("window-air", "Feel a small change in the air", "Stay in your comfortable window or balcony spot. Notice whether the air around you feels cool or warm, still or moving. You can keep the window closed and stay indoors; there is nothing you need to reach for or change.", "How did the air feel where you were?", "Feel", ("calm", "curious"), ("window",), conditions=("daytime", "evening", "rainy")),
    Activity("window-words", "Describe the world from here", "From inside by a window or a sheltered balcony, choose three words for a sound outside, the quiet, or the feeling of the air. Say them to yourself. There is no need to go outside, open the window, use a camera, or write anything down.", "Which three words fit this moment?", "Create", ("create", "calm", "curious"), ("window",), conditions=("daytime", "evening", "rainy")),
    Activity("window-outline", "Find a shape beyond the glass", "Stay inside or comfortably back from the balcony edge. Look for an outline already in view: a tree, a cloud, or a patch of sky. If your view is mostly buildings, notice the shape of the sky between them. Keep your gaze away from the sun.", "Which outline would you remember?", "Look", ("curious", "create"), ("window",), conditions=("daytime",)),
    Activity("window-evening", "Notice the evening from here", "From your comfortable indoor or sheltered balcony spot, notice a patch of sky, if visible. Compare where it looks lighter and darker without needing to see stars. If the sky is hidden, notice one distant sound instead. Keep your window as it is.", "What made this moment feel like evening?", "Look", ("calm", "curious", "create"), ("window",), conditions=("evening",)),
    Activity("window-rain", "Let the rain come to you", "Stay dry inside by a closed window or on a sheltered balcony. Listen for rain, if you can hear it. Notice one rhythm and one pause; if no rain is audible, listen to the quiet around your window. There is no need to step out or open it.", "What could you hear while staying dry?", "Listen", ("calm", "curious", "create"), ("window",), conditions=("rainy",)),
]
BY_ID = {item.id: item for item in CATALOG}


def eligible(request):
    constraints = request.constraints.lower()
    banned = set(request.avoid)
    if any(term in constraints for term in ("no camera", "no photo", "without photo", "without taking photo", "without a camera", "avoid photo")):
        banned.add("camera")
    if any(term in constraints for term in ("no drawing", "no sketch", "without drawing", "no paper")):
        banned.add("drawing")
    # Requirements must be opted into; a calm walk never silently needs equipment.
    if request.interest != "create":
        banned.update(("camera", "drawing"))
    return [a for a in CATALOG if request.setting in a.settings and request.condition in a.conditions and not banned.intersection(a.needs)]


def prompt_catalog(request):
    return [{"id": a.id, "title": a.title, "sense": a.sense, "interests": a.interests, "instruction": a.instruction} for a in eligible(request)]
