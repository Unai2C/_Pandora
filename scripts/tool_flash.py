# Builds assets/scene/modelos/fx/Tool_Flash.glb: the flash a received tool vanishes in. A warm white core and four thin
# star rays swell and close again in 0.45 s (clip 'Flash'); emissive material, no textures, about 120 triangles.
# Run: blender --background --factory-startup --python scripts/tool_flash.py
import bpy, math
OUT = r'C:/Users/Imagine To Create/Desktop/dcl/_Pandora/assets/scene/modelos/fx/Tool_Flash.glb'
FPS = 30
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = FPS
mat = bpy.data.materials.new('Flash'); mat.use_nodes = True
bsdf = mat.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (1, .93, .7, 1)
bsdf.inputs['Emission Color'].default_value = (1, .9, .6, 1); bsdf.inputs['Emission Strength'].default_value = 6
root = bpy.data.objects.new('Tool_Flash', None); bpy.context.scene.collection.objects.link(root)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=.16)
core = bpy.context.active_object; core.name = 'Core'; core.data.materials.append(mat); core.parent = root
rays = []
for i in range(4):
    bpy.ops.mesh.primitive_cube_add(size=1)
    ray = bpy.context.active_object; ray.name = 'Ray%d' % i; ray.data.materials.append(mat); ray.parent = root
    ray.scale = (.03, .03, .6); ray.rotation_euler = (math.radians(90), math.radians(45 * i), 0)
    rays.append(ray)
def key(obj, frame, scale, spin=None):
    obj.scale = scale; obj.keyframe_insert('scale', frame=frame)
    if spin is not None: obj.rotation_euler[1] = spin; obj.keyframe_insert('rotation_euler', frame=frame)
# 0.45 s: swell to full by 0.12 s, then close to nothing.
for frame, s in ((1, 0), (4, 1.25), (8, .9), (14, 0)):
    key(core, frame, (s, s, s))
for i, ray in enumerate(rays):
    base = math.radians(45 * i)
    for frame, s, extra in ((1, 0, 0), (5, 1, 10), (9, .7, 20), (14, 0, 30)):
        key(ray, frame, (.03 * min(1, s * 2), .03 * min(1, s * 2), .6 * s), base + math.radians(extra))
for obj in [core] + rays:
    for fc in obj.animation_data.action.fcurves if hasattr(obj.animation_data.action, 'fcurves') else []:
        for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'
for obj in [core] + rays:
    track = obj.animation_data.nla_tracks.new(); track.name = 'Flash'
    track.strips.new('Flash', 1, obj.animation_data.action); obj.animation_data.action = None
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=True,
                          export_animation_mode='NLA_TRACKS', export_merge_animation='NLA_TRACK', export_cameras=False, export_lights=False)
print('FLASH_DONE')
