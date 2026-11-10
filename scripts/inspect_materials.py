import bpy,json
out=[]
for name in ['Material.001','AllColors_Material','Material_Transparent','Material_0.007']:
 m=bpy.data.materials.get(name)
 if not m:continue
 out.append({'name':name,'color':list(m.diffuse_color),'nodes':[{'name':n.name,'type':n.type,'image':n.image.name if n.type=='TEX_IMAGE' and n.image else None,'path':n.image.filepath if n.type=='TEX_IMAGE' and n.image else None,'size':list(n.image.size) if n.type=='TEX_IMAGE' and n.image else None,'inputs':{s.name:list(s.default_value) if hasattr(s.default_value,'__len__') else s.default_value for s in n.inputs if hasattr(s,'default_value') and s.type in ['RGBA','VALUE']}} for n in m.node_tree.nodes] if m.use_nodes else [],'links':[(l.from_node.name,l.from_socket.name,l.to_node.name,l.to_socket.name) for l in m.node_tree.links] if m.use_nodes else []})
with open(r'C:/Users/Imagine To Create/Desktop/dcl_Pandora/output/blender-materials.json','w') as f:json.dump(out,f,indent=2)
