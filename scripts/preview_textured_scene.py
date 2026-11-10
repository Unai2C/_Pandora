import bpy,json,math
from mathutils import Vector
# Relink texture files for the render without saving the original blend.
import os
texture_root=r'C:/Users/Imagine To Create/Desktop/dcl/_Pandora/assets/scene/modelos/pandora-v0-20261031/textures'
for image in bpy.data.images:
 if image.source=='FILE' and image.size[0]==0:
  name=image.filepath.replace('\\','/').split('/')[-1]
  if 'PP_Color_Palette' in image.name:name='PP_Color_Palette.png'
  if image.name.lower().startswith('aquatex'):name='aquaTex.png'
  candidate=os.path.join(texture_root,name)
  if os.path.isfile(candidate):image.filepath=candidate;image.reload()
for material in bpy.data.materials:
 if material.use_nodes:
  images=[node for node in material.node_tree.nodes if node.type=='TEX_IMAGE']
  if images:material.node_tree.nodes.active=images[0]
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
scene.display.shading.color_type='TEXTURE'
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
scene.render.filepath=r'C:/Users/Imagine To Create/Desktop/dcl_Pandora/output/pandora-v0-textured-preview.png'
bpy.ops.render.render(write_still=True)
