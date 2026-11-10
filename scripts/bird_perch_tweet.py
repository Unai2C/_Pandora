# Builds assets/scene/modelos/fx/Bird_Perch_Tweet.glb from the Meshy "Turquoise Tweet" bird: a small rig (Root at the
# feet, Body at the hip, Head at the neck, Tail, and a bone per folded wing) and the four clips the bird code plays in a
# loop: Fly (1 s loop: flapping in place while the code moves it through the air), Land (2 s: flaps down its last half
# metre and folds its wings on touchdown), Perch (6 s loop: pecks at the ground, looks around, hops) and TakeOff (2 s:
# jumps and flaps up half a metre, still in flight). The bird never shrinks away: the code carries it between the
# clips, so it stays visible the whole time. The source .blend is never saved.
# Run: blender --background --factory-startup "<Meshy_AI_Turquoise_Tweet_...blend>" --python scripts/bird_perch_tweet.py
import bpy, math, os
from mathutils import Vector
OUT = r'C:/Users/Imagine To Create/Desktop/dcl/_Pandora/assets/scene/modelos/fx/Bird_Perch_Tweet.glb'
FPS = 24
# The Meshy bird faces -Y (glTF +Z) with its feet at z=0 and is 0.17 m long; twice that matches the previous perch bird.
SIZE = 2.0
bird = bpy.data.objects['geometry_0']
bird.name = 'Bird_Perch'
bpy.context.scene.render.fps = FPS
# A tiny bird on screen needs a 256 px texture, not the 2048 px original.
for image in bpy.data.images:
    if image.size[0] > 256: image.scale(256, 256)
# Weights: legs stay on Root, the head turns about the neck, the tail flicks about its base, the rest follows the body.
def smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
groups = {n: bird.vertex_groups.new(name=n) for n in ('Root', 'Body', 'Head', 'Tail', 'WingL', 'WingR')}
for v in bird.data.vertices:
    x, y, z = v.co
    legs = 1 - smooth(.022, .034, z)
    head = smooth(.068, .082, z) * (1 - smooth(-.005, .012, y)) * (1 - legs)
    tail = smooth(.03, .045, y) * (1 - legs)
    # The folded wings are the outer layer of the flanks, from the shoulder back to the rump.
    wing = smooth(.027, .037, abs(x)) * smooth(.022, .032, z) * (1 - smooth(.085, .095, z)) * (1 - smooth(.03, .045, y)) * (1 - head) * (1 - legs)
    body = max(0.0, 1 - legs - head - tail - wing)
    for name, w in (('Root', legs), ('Body', body), ('Head', head), ('Tail', tail), ('WingL' if x > 0 else 'WingR', wing)):
        if w > 1e-4: groups[name].add([v.index], w, 'REPLACE')
arm_data = bpy.data.armatures.new('Armature'); rig = bpy.data.objects.new('Armature', arm_data)
bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
def bone(name, head, tail, parent=None):
    b = arm_data.edit_bones.new(name); b.head = Vector(head); b.tail = Vector(tail)
    if parent: b.parent = arm_data.edit_bones[parent]
    return b
bone('Root', (0, 0, 0), (0, 0, .02))
bone('Body', (0, .005, .034), (0, -.02, .06), 'Root')
bone('Head', (0, -.028, .074), (0, -.04, .1), 'Body')
bone('Tail', (0, .038, .052), (0, .08, .058), 'Body')
# Wing bones lie along the top of the back pointing forward (-y), so turning about their own axis swings the wing out
# and up; stretching them sideways opens the folded wing.
bone('WingL', (.01, .03, .084), (.01, -.02, .084), 'Body')
bone('WingR', (-.01, .03, .084), (-.01, -.02, .084), 'Body')
bpy.ops.object.mode_set(mode='OBJECT')
bird.parent = rig; mod = bird.modifiers.new('Armature', 'ARMATURE'); mod.object = rig
rig.scale = (SIZE, SIZE, SIZE)
pb = rig.pose.bones
for p in pb: p.rotation_mode = 'XYZ'
# Which way round each wing bone turns to lift its wing: try +30 degrees and see whether the outermost wing vertex rises.
WING_SIGN = {}
for name in ('WingL', 'WingR'):
    side = 1 if name == 'WingL' else -1
    tip = max((v for v in bird.data.vertices if side * v.co.x > .036), key=lambda v: side * v.co.x).index
    def tip_z(angle):
        pb[name].rotation_euler = (0, math.radians(angle), 0); bpy.context.view_layer.update()
        return bird.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh().vertices[tip].co.z
    WING_SIGN[name] = 1 if tip_z(30) > tip_z(0) else -1
    pb[name].rotation_euler = (0, 0, 0)
print('WING_SIGN', WING_SIGN)
def key(frame, **pose):
    # pose: bone=(loc, rot_degrees, scale) with any of them None to leave at rest.
    for name in ('WingL', 'WingR'):
        # Wings take one number: how far they are raised, in degrees (0 folded); a raised wing is also spread wider.
        lift = pose.get('wings', 0); p = pb[name]
        p.rotation_euler = (0, math.radians(lift * WING_SIGN[name]), 0); p.keyframe_insert('rotation_euler', frame=frame)
        spread = 1 + .9 * min(1, lift / 70); p.scale = (spread, 1, spread); p.keyframe_insert('scale', frame=frame)
    for name in ('Root', 'Body', 'Head', 'Tail'):
        loc, rot, scl = pose.get(name, (None, None, None))
        p = pb[name]
        # Poses are written in scene axes (x, -y forward, z up; pitch, roll, yaw); bones point up, so their local Y is
        # scene Z and local Z is scene -Y.
        p.location = Vector((loc[0], loc[2], -loc[1])) / SIZE if loc else Vector()
        p.rotation_euler = [math.radians(a) for a in (rot[0], rot[2], rot[1])] if rot else (0, 0, 0)
        p.scale = scl if scl else (1, 1, 1)
        for path in ('location', 'rotation_euler', 'scale'): p.keyframe_insert(path, frame=frame)
def action(name, keys):
    rig.animation_data_create(); act = bpy.data.actions.new(name); rig.animation_data.action = act
    for t, pose in keys: key(round(t * FPS) + 1, **pose)
    track = rig.animation_data.nla_tracks.new(); track.name = name
    track.strips.new(name, int(act.frame_range[0]), act); rig.animation_data.action = None
# Bone-local axes: the bones point up/forward, so rotation X pitches the body or head (positive = nose down).
REST = {}
PECK_DOWN = {'Body': (None, (38, 0, 0), None), 'Head': (None, (30, 0, 0), None), 'Tail': (None, (-20, 0, 0), None)}
def flying(start, end, root_at, body, tail, last=None):
    # Wing beats every 1/12 s (6 per second) between start and end; root_at(t) gives the flight path.
    keys, t, up = [], start, True
    while t < end - 1e-6:
        keys.append((t, {'Root': (root_at(t), None, None), 'Body': (None, (body, 0, 0), None), 'Tail': (None, (tail, 0, 0), None), 'wings': 70 if up else 5}))
        t += 1 / 12; up = not up
    return keys
def lerp3(a, b, k):
    k = k * k * (3 - 2 * k); return tuple(a[i] + (b[i] - a[i]) * k for i in range(3))
# Fly: whole beats over exactly one second, so the loop closes on the same raised-wing pose.
action('Fly', flying(0, 1, lambda t: (0, 0, .02 * math.sin(t * 2 * math.pi * 3)), -8, -10) + [
    (1, {'Root': ((0, 0, 0), None, None), 'Body': (None, (-8, 0, 0), None), 'Tail': (None, (-10, 0, 0), None), 'wings': 70})])
# Land starts where the flight hands over, half a metre above the spot.
action('Land', flying(0, 1.1, lambda t: lerp3((0, 0, .5), (0, 0, .06), t / 1.1), -20, -24) + [
    (1.25, {'Root': ((0, 0, 0), None, None), 'Body': (None, (-10, 0, 0), (1.1, 1.1, .85)), 'wings': 20}),
    (1.45, {'Body': (None, (6, 0, 0), (.95, .95, 1.06))}),
    (1.7, {'Head': (None, (0, 0, 25), None)}),
    (2, REST),
])
perch = [(0, REST)]
def peck(t):
    perch.extend([(t, REST), (t + .12, PECK_DOWN), (t + .24, REST)])
peck(.5); peck(.85)
perch += [(1.4, REST), (1.7, {'Head': (None, (0, 0, 40), None)}), (2.2, {'Head': (None, (0, 0, 40), None)}),
          (2.45, {'Head': (None, (0, 0, -35), None)}), (2.9, {'Head': (None, (0, 0, -35), None)}), (3.1, REST),
          (3.2, {'Tail': (None, (-25, 0, 0), None)}), (3.35, REST),
          # A small hop forward, turning a little; the second hop at the end brings it back to the start.
          (3.55, {'Body': (None, (0, 0, 0), (1.05, 1.05, .9))}),
          (3.7, {'Root': ((0, -.08, .07), (0, 0, 15), None), 'Tail': (None, (-15, 0, 0), None)}),
          (3.85, {'Root': ((0, -.13, 0), (0, 0, 25), None)})]
for t in (4.15, 4.45, 4.75):
    hop = {'Root': ((0, -.13, 0), (0, 0, 25), None)}
    perch += [(t, hop), (t + .12, {**PECK_DOWN, **hop}), (t + .24, hop)]
perch += [(5.4, {'Root': ((0, -.13, 0), (0, 0, 25), None), 'Body': (None, None, (1.05, 1.05, .9))}),
          (5.6, {'Root': ((0, -.06, .07), (0, 0, 10), None)}), (5.75, REST), (6, REST)]
action('Perch', perch)
action('TakeOff', [
    (0, REST), (.25, {'Body': (None, (-8, 0, 0), (1.1, 1.1, .82)), 'Tail': (None, (-20, 0, 0), None), 'wings': 25})]
    + flying(.33, 2, lambda t: lerp3((0, 0, .1), (0, 0, .5), (t - .33) / 1.67), -12, -14) + [
    # Ends airborne half a metre up with the wings raised, where the Fly clip takes over.
    (2, {'Root': ((0, 0, .5), None, None), 'Body': (None, (-8, 0, 0), None), 'Tail': (None, (-10, 0, 0), None), 'wings': 70}),
])
bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); bird.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=True,
                          export_animation_mode='NLA_TRACKS', export_image_format='JPEG', export_jpeg_quality=85,
                          export_cameras=False, export_lights=False, export_extras=False)
print('BIRD_DONE', os.path.getsize(OUT))
