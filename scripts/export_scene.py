import bpy,json,os,re,math,sys
from mathutils import Vector,Matrix
ROOT=r'C:/Users/Imagine To Create/Desktop/dcl/_Pandora'
def arg(name,default):return sys.argv[sys.argv.index(name)+1] if name in sys.argv else default
# Output folder, e.g. --out pandora-v1-20261103. Textures always resolve from one shared folder (--textures), so a new
# export references the same texture files instead of adding copies.
FOLDER=arg('--out','pandora-v0-20261031');TEXTURES=arg('--textures','pandora-v0-20261031')
OUT=os.path.join(ROOT,'assets/scene/modelos',FOLDER);REL='assets/scene/modelos/'+FOLDER+'/'
os.makedirs(OUT,exist_ok=True)
# Resolve the recoverable palette without changing the source file.
for image in bpy.data.images:
 if image.source=='FILE' and image.size[0]==0:
  filename=image.filepath.replace('\\','/').split('/')[-1]
  if 'PP_Color_Palette' in image.name:filename='PP_Color_Palette.png'
  if image.name.lower().startswith('aquatex'):filename='aquaTex.png'
  candidates=[os.path.join(ROOT,'assets/scene/modelos',TEXTURES,'textures',filename),os.path.join(os.path.dirname(bpy.data.filepath),filename)]
  for candidate in candidates:
   if os.path.isfile(candidate):
    image.filepath=candidate;image.reload();break
missing=[{'name':i.name,'path':i.filepath} for i in bpy.data.images if i.source=='FILE' and i.size[0]==0]
with open(os.path.join(OUT,'missing-textures.json'),'w') as f:json.dump(missing,f,indent=2)
# Environment surfaces should be lit by the scene, with only a very weak self-emission.
for material in bpy.data.materials:
 if material.use_nodes:
  for node in material.node_tree.nodes:
   if node.type=='BSDF_PRINCIPLED' and 'Emission Strength' in node.inputs:
    node.inputs['Emission Strength'].default_value=min(node.inputs['Emission Strength'].default_value,0.3)
    base=node.inputs.get('Base Color')
    emission=node.inputs.get('Emission Color')
    if base and emission and base.is_linked and not emission.is_linked:
     material.node_tree.links.new(base.links[0].from_socket,emission)
# Objects hidden in the view layer (drafts, template backups) are not part of the scene.
objects=[o for o in bpy.context.scene.objects if o.visible_get()]
visible=set(objects)
def bounds(o):
 pts=[o.matrix_world@Vector(c) for c in o.bound_box]
 return Vector(tuple(min(p[i] for p in pts) for i in range(3))),Vector(tuple(max(p[i] for p in pts) for i in range(3)))
def anchor(o):
 lo,hi=bounds(o);return Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
def objs(c):return list(bpy.data.collections[c].all_objects)
# Exports run in a separate scene; the source .blend is never saved or modified on disk.
scene=bpy.data.scenes.new('Pandora_Export')
bpy.context.window.scene=scene
report=[]
def export(filename,source,origin=None,template=False):
 if '--palette-only' in sys.argv and os.path.exists(os.path.join(OUT,filename)):
  usesPalette=any(slot.material and slot.material.use_nodes and any(n.type=='TEX_IMAGE' and n.image and 'PP_Color_Palette' in n.image.name for n in slot.material.node_tree.nodes) for o in source for slot in o.material_slots)
  if not usesPalette:return REL+filename
 if '--textures-only' in sys.argv and os.path.exists(os.path.join(OUT,filename)):
  usesNewTexture=any(slot.material and slot.material.use_nodes and any(n.type=='TEX_IMAGE' and n.image and ('texture_gradient' in n.image.name or n.image.name.lower().startswith('aquatex')) for n in slot.material.node_tree.nodes) for o in source for slot in o.material_slots)
  if not usesNewTexture:return REL+filename
 copies=[]
 for o in source:
  n=o.copy();n.data=o.data
  scene.collection.objects.link(n);n.parent=None;n.matrix_world=o.matrix_world.copy()
  if origin is not None:
   if template:n.matrix_world.translation-=anchor(o)
   else:n.matrix_world.translation-=origin
  n.hide_viewport=False;n.hide_render=False;n.hide_set(False);n.select_set(True);copies.append(n)
 bpy.context.view_layer.objects.active=copies[0]
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,filename),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=False)
 for n in copies:bpy.data.objects.remove(n,do_unlink=True)
 return REL+filename
# Many small decoration pieces become one mesh (one node, one primitive per material) instead of a node each.
# Wind for joined grass: two shape keys bend each piece by the square of its height above its own base, with amplitudes
# sin(p) and cos(p) of a phase p that changes across the meadow. The 'Wind' clip drives their weights as
# (1+sin wt)/2 and (1+cos wt)/2, which adds up to a fixed lean plus a gust travelling over the grass. Weights stay in 0..1.
WIND_DIR=Vector((.8,.6,0)).normalized();WIND_BEND=.14;WIND_PERIOD=4.0;WIND_WAVELENGTH=18.0
def add_wind_keys(o):
 me=o.data;mw=o.matrix_world;inv=mw.to_3x3().inverted()
 world=[mw@v.co for v in me.vertices];low=min(p.z for p in world)
 o.shape_key_add(name='Basis');a=o.shape_key_add(name='WindA');b=o.shape_key_add(name='WindB')
 for i,p in enumerate(world):
  h=min(1.2,p.z-low);phase=2*math.pi*(p.x*WIND_DIR.x+p.y*WIND_DIR.y)/WIND_WAVELENGTH
  bend=WIND_DIR*(WIND_BEND*h*h)
  a.data[i].co=me.vertices[i].co+inv@(bend*(2*math.sin(phase)))
  b.data[i].co=me.vertices[i].co+inv@(bend*(2*math.cos(phase)))
 for k in (a,b):k.slider_min=0;k.slider_max=1
# Many small decoration pieces become one mesh (one node, one primitive per material) instead of a node each.
def export_joined(filename,source,wind=False):
 copies=[]
 for o in source:
  n=o.copy();n.data=o.data.copy()
  scene.collection.objects.link(n);n.parent=None;n.matrix_world=o.matrix_world.copy();n.hide_set(False);copies.append(n)
  if wind:n.shape_key_clear();add_wind_keys(n)
 for n in copies:n.select_set(True)
 bpy.context.view_layer.objects.active=copies[0]
 bpy.ops.object.join();joined=bpy.context.view_layer.objects.active
 if wind:
  keys=joined.data.shape_keys;keys.animation_data_create();action=bpy.data.actions.new('Wind');keys.animation_data.action=action
  fps=bpy.context.scene.render.fps;steps=16
  for i in range(steps+1):
   t=i/steps*WIND_PERIOD;frame=1+t*fps
   for name,value in (('WindA',(1+math.sin(2*math.pi*t/WIND_PERIOD))/2),('WindB',(1+math.cos(2*math.pi*t/WIND_PERIOD))/2)):
    keys.key_blocks[name].value=value;keys.key_blocks[name].keyframe_insert('value',frame=frame)
  track=keys.animation_data.nla_tracks.new();track.name='Wind';track.strips.new('Wind',1,action);keys.animation_data.action=None
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,filename),export_format='GLB',use_selection=True,export_animations=wind,export_animation_mode='NLA_TRACKS',export_morph=wind,export_morph_normal=False,export_cameras=False,export_lights=False,export_extras=False)
 mesh=joined.data;bpy.data.objects.remove(joined,do_unlink=True);bpy.data.meshes.remove(mesh)
 return REL+filename
base=[o for o in objs('Pangea_Scene_BASE') if o in visible];water=[o for o in base if 'water' in o.name.lower()]
# Grass placed inside the base collection is decoration: its own collision-free model, kept out of the terrain.
grassSet=set(objs('Grass')) if 'Grass' in bpy.data.collections else set()
grass=[o for o in base if o in grassSet and o.type=='MESH']
base=[o for o in base if o not in water and o not in grassSet]
basePath=REL+'base.glb' if '--grass-only' in sys.argv else export('base.glb',base)
waterPath=REL+'water.glb' if '--grass-only' in sys.argv else export('water.glb',water)
grassPath=export_joined('grass.glb',grass,wind=True) if grass else None
# --grass-only re-exports just the grass (the layout and every other model stay as they are).
if '--grass-only' in sys.argv:print('PANDORA_GRASS_DONE',len(grass),flush=True);sys.exit(0)
stages=[]
for idx in range(1,5):
 o=bpy.data.objects['PP_Central_Tree_%02d'%idx]
 stages.append({'level':[1,5,9,13][idx-1],'src':'assets/scene/modelos/arbol-central/Tree_%02d_anim.glb'%idx})
ons=[]
for o in objects:
 cs=[c.name.lower().strip() for c in o.users_collection]
 if o.type!='MESH':continue
 if any(c.startswith('bush ') and c.endswith(' on') for c in cs):ons.append((o,'fruit'))
 elif any(c.startswith('trees ') and c.endswith(' on') for c in cs):ons.append((o,'wood'))
 elif 'rocks on' in cs:ons.append((o,'stone'))
offs=[o for o in objects if o.type=='MESH' and any(c.name.lower().strip().endswith('off') for c in o.users_collection)]
def norm(n):return re.sub(r'(?i)[_ ](?:on|off)(?=[_. ]|$)','',n).lower()
woodTemplate=min([o for o in offs if 'tree' in o.name.lower()],key=lambda o:bounds(o)[1].z-bounds(o)[0].z)
stoneTemplate=bpy.data.objects['PP_Stone_Plain_01']
def required_hits(name,kind,width,height):
 name=name.lower()
 if 'big' in name or 'large' in name:return 3
 if any(word in name for word in ['small','log','branch']):return 1
 if any(word in name for word in ['average','avarage','medium']):return 2
 if kind=='stone':return 3 if width>=1.8 else 2 if width>=1 else 1
 return 3 if height>=9 else 2 if height>=5 else 1
# An object duplicated in place (same mesh size and same world bounds as an earlier one) would stack two identical
# resources; only the first by name is kept.
def footprint(o):
 lo,hi=bounds(o);return (len(o.data.polygons),)+tuple(round(v,3) for v in (*lo,*hi))
seen=set();unique=[]
for o,kind in sorted(ons,key=lambda x:x[0].name):
 if footprint(o) in seen:report.append({'skipped':o.name,'reason':'duplicate in place'});continue
 seen.add(footprint(o));unique.append((o,kind))
resources=[]
for index,(o,kind) in enumerate(unique):
 a=anchor(o);lo,hi=bounds(o)
 candidates=[x for x in offs if norm(x.name)==norm(o.name)]
 if not candidates and kind=='fruit':
  candidates=[x for x in offs if 'bush' in x.name.lower() and math.hypot(anchor(x).x-a.x,anchor(x).y-a.y)<2.5]
 off=min(candidates,key=lambda x:(anchor(x)-a).length) if candidates else None
 if off and math.hypot(anchor(off).x-a.x,anchor(off).y-a.y)>4:off=None
 id='world-%s-%03d'%(kind,index+1)
 onpath=export(id+'-on.glb',[o],a)
 if off:
  offpath=export(id+'-off.glb',[off],a)
  offkind='paired'
 else:
  template=woodTemplate if kind=='wood' else stoneTemplate
  offpath=export(id+'-off.glb',[template],a,template=True)
  offkind='template:'+template.name
 # glTF is Y-up: Blender X,Y,Z maps to X,Z,-Y.
 position={'x':round(81.55+a.x*.94,4),'y':round(1.3+a.z*.94,4),'z':round(79.94-a.y*.94,4)}
 resources.append({'id':id,'kind':kind,'position':position,'on':onpath,'off':offpath,'collider':{'x':round(min(3,max(.8,(hi.x-lo.x)*.94)),3),'y':round(min(2.4,max(.8,(hi.z-lo.z)*.94)),3),'z':round(min(3,max(.8,(hi.y-lo.y)*.94)),3)}})
 resources[-1]['hitsRequired']=required_hits(o.name,kind,max(hi.x-lo.x,hi.y-lo.y)*.94,(hi.z-lo.z)*.94)
 resources[-1]['size']=['small','medium','large'][resources[-1]['hitsRequired']-1]
 resources[-1]['sourceName']=o.name
 resources[-1]['visualBounds']={'min':{'x':(lo.x-a.x)*.94,'y':(lo.z-a.z)*.94,'z':-(hi.y-a.y)*.94},'max':{'x':(hi.x-a.x)*.94,'y':(hi.z-a.z)*.94,'z':-(lo.y-a.y)*.94}}
 report.append({'id':id,'on':o.name,'off':off.name if off else offkind})
 print('RESOURCE_EXPORT',index+1,len(ons),o.name,flush=True)
# Keep reviewed gameplay placements when this exporter is explicitly run again. They are keyed by the object name in
# the .blend, since resource ids are renumbered whenever objects are added.
placements_path=os.path.join(ROOT,'design','world-placement-overrides.json')
if os.path.isfile(placements_path) and '--no-placements' not in sys.argv:
 with open(placements_path,encoding='utf8') as f:placements=json.load(f)
 for resource in resources:
  if resource['sourceName'] in placements:resource['position']=placements[resource['sourceName']]
layout={'base':basePath,'water':waterPath,'grass':grassPath,'treeStages':stages,'resources':resources}
with open(os.path.join(OUT,'manifest.json'),'w',encoding='utf8') as f:json.dump(layout,f,indent=2)
with open(os.path.join(OUT,'export-report.json'),'w',encoding='utf8') as f:json.dump(report,f,indent=2)
with open(os.path.join(ROOT,'src/shared/worldLayout.ts'),'w',encoding='utf8') as f:
 f.write('// Generated from '+os.path.basename(bpy.data.filepath)+' by scripts/export_scene.py.\n')
 f.write('export interface WorldResource { id: string; kind: "wood" | "stone" | "fruit"; position: { x: number; y: number; z: number }; on: string; off: string; collider: { x: number; y: number; z: number }; visualBounds?: {min:{x:number;y:number;z:number};max:{x:number;y:number;z:number}}; hitsRequired: number; size: "small" | "medium" | "large"; sourceName: string }\n')
 f.write('export const WORLD_BASE = '+json.dumps(basePath)+'\nexport const WORLD_WATER = '+json.dumps(waterPath)+'\n')
 f.write('export const WORLD_GRASS: string | undefined = '+(json.dumps(grassPath) if grassPath else 'undefined')+'\n')
 f.write('export const TREE_STAGES = '+json.dumps(stages)+'\n')
 f.write('export const WORLD_RESOURCES: WorldResource[] = '+json.dumps(resources,separators=(',',':'))+'\n')
print('PANDORA_EXPORT_DONE',len(resources),len(water),len(grass),flush=True)
