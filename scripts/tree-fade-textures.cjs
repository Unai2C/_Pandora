// Copies each central tree's embedded base-colour JPEG to its own file. The tree change cross-fades the two trees with a
// translucent material override, and an override can only use a texture by file path. They load only during the change.
// Run from the project root: node scripts/tree-fade-textures.cjs
const fs=require('fs'),DIR='assets/scene/modelos/arbol-central/'
fs.mkdirSync(DIR+'fade',{recursive:true})
for(const k of [1,2,3,4]){
 const b=fs.readFileSync(`${DIR}Tree_0${k}_anim.glb`),len=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+len)),bin=b.subarray(28+len)
 const image=j.images[j.textures[j.materials[0].pbrMetallicRoughness.baseColorTexture.index].source],view=j.bufferViews[image.bufferView]
 const out=`${DIR}fade/Tree_0${k}_base.jpg`
 fs.writeFileSync(out,bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength))
 console.log(out,image.mimeType,view.byteLength+' bytes')
}
