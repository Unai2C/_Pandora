import bpy,json,math
from mathutils import Vector
root=r'C:/Users/Imagine To Create/Desktop/dcl/_Pandora/assets/scene/modelos/pandora-v0-20261031'
with open(root+'/export-report.json',encoding='utf8') as f:report=json.load(f)
keep={x['on'] for x in report}
keep.update(o.name for o in bpy.data.collections['Pangea_Scene_BASE'].all_objects)
keep.add('PP_Central_Tree_01')
for o in bpy.context.scene.objects:
 o.hide_set(False);o.hide_render=o.name not in keep
scene=bpy.context.scene
scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.light='STUDIO'
scene.display.shading.color_type='MATERIAL'
scene.display.shading.show_shadows=True
scene.display.shading.show_cavity=True
scene.display.shading.background_type='WORLD'
scene.world.color=(.025,.035,.05)
camera=bpy.data.objects.new('Export_Review_Camera',bpy.data.cameras.new('Export_Review_Camera'))
scene.collection.objects.link(camera)
camera.location=(135,-165,160)
camera.rotation_euler=(Vector((0,0,4))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=235
scene.camera=camera
scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=r'C:/Users/Imagine To Create/Desktop/dcl_Pandora/output/pandora-v0-scene-preview.png'
bpy.ops.render.render(write_still=True)
