// Replaces the Open_Ring torus (64 x 8 segments, 1,024 triangles per ring, 5 rings per model) in the ring FX with
// a 28 x 3 torus of the same radius and tube thickness (168 triangles per ring). Nodes, clips, durations, material,
// transparency and every other mesh stay exactly as they were; the binary is repacked so the old geometry is dropped.
// Run from the project root: node scripts/light-rings.cjs   (then node scripts/agent-rings.cjs to refresh the agent copies)
const fs=require('fs'),DIR='assets/scene/modelos/fx/'
const FILES=['Heal_Rings','Corrupt_Rings','LevelUp_Rings','Tree_Transform_Rays','Friendly_Rings']
const MAJOR=28,MINOR=3
function readGlb(file){
 const b=fs.readFileSync(file),len=b.readUInt32LE(12)
 return {j:JSON.parse(b.subarray(20,20+len)),bin:b.subarray(28+len,28+len+b.readUInt32LE(20+len))}
}
function accessorBytes(j,bin,i){
 const a=j.accessors[i],v=j.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],size={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4}[a.componentType]
 const out=Buffer.alloc(a.count*n*size),stride=v.byteStride||n*size,base=(v.byteOffset||0)+(a.byteOffset||0)
 for(let e=0;e<a.count;e++)bin.copy(out,e*n*size,base+e*stride,base+e*stride+n*size)
 return out
}
function torus(majorRadius,minorRadius){
 const pos=[],nor=[],idx=[]
 for(let i=0;i<MAJOR;i++){const phi=i/MAJOR*2*Math.PI
  for(let k=0;k<MINOR;k++){const theta=k/MINOR*2*Math.PI,c=Math.cos(theta)
   pos.push((majorRadius+minorRadius*c)*Math.cos(phi),minorRadius*Math.sin(theta),(majorRadius+minorRadius*c)*Math.sin(phi))
   nor.push(c*Math.cos(phi),Math.sin(theta),c*Math.sin(phi))}}
 for(let i=0;i<MAJOR;i++)for(let k=0;k<MINOR;k++){
  const a=i*MINOR+k,b=((i+1)%MAJOR)*MINOR+k,c=((i+1)%MAJOR)*MINOR+(k+1)%MINOR,d=i*MINOR+(k+1)%MINOR
  idx.push(a,b,c,a,c,d)}
 return {pos,nor,idx}
}
function build(name){
 const file=DIR+name+'.glb',{j,bin}=readGlb(file)
 const ring=j.meshes.findIndex(m=>m.name==='Open_Ring');if(ring<0)throw new Error(name+': no Open_Ring')
 const prim=j.meshes[ring].primitives[0],old=accessorBytes(j,bin,prim.attributes.POSITION)
 // Measure the original radius and tube thickness so the silhouette is unchanged.
 let maxR=0,minR=Infinity,maxY=0
 for(let e=0;e<old.length/12;e++){const x=old.readFloatLE(e*12),y=old.readFloatLE(e*12+4),z=old.readFloatLE(e*12+8),r=Math.hypot(x,z);maxR=Math.max(maxR,r);minR=Math.min(minR,r);maxY=Math.max(maxY,y)}
 // A three-sided tube looks 1.5-1.73 times its radius wide; 1.24x keeps the round tube's apparent 2r thickness.
 const t=torus((maxR+minR)/2,maxY*1.24)
 // Repack every accessor still in use into a fresh buffer, one tightly packed view each.
 const chunks=[],views=[],accessors=[],remap=new Map()
 const push=(data,accessor,target)=>{
  const pad=(4-chunks.reduce((s,c)=>s+c.length,0)%4)%4;if(pad)chunks.push(Buffer.alloc(pad))
  const offset=chunks.reduce((s,c)=>s+c.length,0);chunks.push(data)
  views.push({buffer:0,byteOffset:offset,byteLength:data.length,...(target?{target}:{})})
  accessors.push({...accessor,bufferView:views.length-1,byteOffset:undefined});return accessors.length-1
 }
 const floats=a=>{const b=Buffer.alloc(a.length*4);a.forEach((v,i)=>b.writeFloatLE(v,i*4));return b}
 const ushorts=a=>{const b=Buffer.alloc(a.length*2);a.forEach((v,i)=>b.writeUInt16LE(v,i*2));return b}
 const bounds=(a,n)=>({min:[...Array(n)].map((_,c)=>Math.min(...a.filter((_,i)=>i%n===c))),max:[...Array(n)].map((_,c)=>Math.max(...a.filter((_,i)=>i%n===c)))})
 const keep=i=>{if(!remap.has(i)){const a=j.accessors[i],v=j.bufferViews[a.bufferView];remap.set(i,push(accessorBytes(j,bin,i),a,v.target))}return remap.get(i)}
 j.meshes.forEach((mesh,m)=>mesh.primitives.forEach(p=>{
  if(m===ring){
   p.attributes={POSITION:push(floats(t.pos),{componentType:5126,count:t.pos.length/3,type:'VEC3',...bounds(t.pos,3)},34962),NORMAL:push(floats(t.nor),{componentType:5126,count:t.nor.length/3,type:'VEC3'},34962)}
   p.indices=push(ushorts(t.idx),{componentType:5123,count:t.idx.length,type:'SCALAR'},34963)
  }else{for(const k of Object.keys(p.attributes))p.attributes[k]=keep(p.attributes[k]);if(p.indices!==undefined)p.indices=keep(p.indices)}
 }))
 for(const anim of j.animations||[])for(const s of anim.samplers){s.input=keep(s.input);s.output=keep(s.output)}
 for(const skin of j.skins||[])if(skin.inverseBindMatrices!==undefined)skin.inverseBindMatrices=keep(skin.inverseBindMatrices)
 for(const a of accessors)delete a.byteOffset
 j.accessors=accessors;j.bufferViews=views
 let out=Buffer.concat(chunks);const binPad=Buffer.alloc((4-out.length%4)%4);out=Buffer.concat([out,binPad]);j.buffers=[{byteLength:out.length}]
 let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,0x20)])
 const head=Buffer.alloc(20);head.writeUInt32LE(0x46546C67,0);head.writeUInt32LE(2,4);head.writeUInt32LE(20+json.length+8+out.length,8);head.writeUInt32LE(json.length,12);head.writeUInt32LE(0x4E4F534A,16)
 const binHead=Buffer.alloc(8);binHead.writeUInt32LE(out.length,0);binHead.writeUInt32LE(0x004E4942,4)
 fs.writeFileSync(file,Buffer.concat([head,json,binHead,out]))
 console.log(name,'ring radius',((maxR+minR)/2).toFixed(3),'tube',maxY.toFixed(3),'->',t.idx.length/3,'triangles per ring')
}
for(const name of FILES)build(name)
