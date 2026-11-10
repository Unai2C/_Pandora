// Finds the dirt paths on the exported terrain: the walkable (near-horizontal) triangles of the ground mesh (PP_PLANE;
// brown mountain tops are not paths) whose UVs sample the brown cells of the shared colour palette. Exports onPath(x, z) in scene coordinates and, run directly, prints a coarse map.
// Usage: const {onPath}=require('./scripts/path-mask.cjs')   or   node scripts/path-mask.cjs
const fs=require('fs'),zlib=require('zlib'),path=require('path')
const {root,glb}=require('./world-terrain.cjs')
const layout=fs.readFileSync(path.join(root,'src/shared/worldLayout.ts'),'utf8'),baseFile=layout.match(/WORLD_BASE = "([^"]+)"/)[1]
// Minimal PNG reader for the 8-bit, non-interlaced palette texture.
function png(file){
 const b=fs.readFileSync(file);let pos=8,idat=[],w,h,type
 while(pos<b.length){const len=b.readUInt32BE(pos),kind=b.toString('ascii',pos+4,pos+8),d=b.subarray(pos+8,pos+8+len);if(kind==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);type=d[9];if(d[8]!==8||d[12])throw Error('unsupported PNG')}if(kind==='IDAT')idat.push(d);pos+=12+len}
 const ch={2:3,6:4}[type];if(!ch)throw Error('unsupported PNG colour type '+type)
 const raw=zlib.inflateSync(Buffer.concat(idat)),out=Buffer.alloc(w*h*ch),stride=w*ch
 for(let y=0;y<h;y++){const f=raw[y*(stride+1)],line=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1))
  for(let x=0;x<stride;x++){const a=x>=ch?out[y*stride+x-ch]:0,up=y?out[(y-1)*stride+x]:0,c=x>=ch&&y?out[(y-1)*stride+x-ch]:0
   const p=a+up-c,pa=Math.abs(p-a),pb=Math.abs(p-up),pc=Math.abs(p-c)
   out[y*stride+x]=(line[x]+[0,a,up,(a+up)>>1,pa<=pb&&pa<=pc?a:pb<=pc?up:c][f])&255}}
 return {w,h,ch,at(u,v){const x=Math.min(w-1,Math.max(0,Math.floor((u-Math.floor(u))*w))),y=Math.min(h-1,Math.max(0,Math.floor((v-Math.floor(v))*h))),i=(y*w+x)*ch;return [out[i],out[i+1],out[i+2]]}}
}
function read(g,i){const a=g.j.accessors[i],v=g.j.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3}[a.type],sz={5121:1,5123:2,5125:4,5126:4}[a.componentType],stride=v.byteStride||n*sz,base=(v.byteOffset||0)+(a.byteOffset||0)
 return Array.from({length:a.count},(_,e)=>{const row=Array.from({length:n},(_,k)=>{const at=base+e*stride+k*sz;return a.componentType===5126?g.bin.readFloatLE(at):sz===1?g.bin.readUInt8(at):sz===2?g.bin.readUInt16LE(at):g.bin.readUInt32LE(at)});return n===1?row[0]:row})}
const g=glb(baseFile)
// Brown dirt: red clearly above green, green above blue (grass is green-dominant, rock grey).
const dirt=([r,gr,b])=>r>gr+20&&gr>b+12&&r>90
const tris=[],palettes=new Map()
for(const node of g.j.nodes.filter(n=>n.mesh!==undefined&&/^PP_PLANE/.test(n.name)))for(const prim of g.j.meshes[node.mesh].primitives){
 const tex=g.j.materials[prim.material]?.pbrMetallicRoughness?.baseColorTexture;if(!tex||prim.attributes.TEXCOORD_0===undefined)continue
 const uri=g.j.images[g.j.textures[tex.index].source].uri;if(!uri)continue
 if(!palettes.has(uri))palettes.set(uri,png(path.join(root,path.dirname(baseFile),uri)));const palette=palettes.get(uri)
 const P=read(g,prim.attributes.POSITION),UV=read(g,prim.attributes.TEXCOORD_0),I=read(g,prim.indices)
 for(let i=0;i<I.length;i+=3){const k=[I[i],I[i+1],I[i+2]],[a,b,c]=k.map(j=>P[j])
  // Only faces you walk on: the normal points mostly up.
  const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],nx=e1[1]*e2[2]-e1[2]*e2[1],ny=e1[2]*e2[0]-e1[0]*e2[2],nz=e1[0]*e2[1]-e1[1]*e2[0]
  if(Math.abs(ny)<.7*Math.hypot(nx,ny,nz))continue
  const u=(UV[k[0]][0]+UV[k[1]][0]+UV[k[2]][0])/3,v=(UV[k[0]][1]+UV[k[1]][1]+UV[k[2]][1])/3
  if(dirt(palette.at(u,v)))tris.push(k.map(j=>[81.55+P[j][0]*.94,79.94+P[j][2]*.94]))}}
const grid=new Map();for(const t of tris){const xs=t.map(p=>p[0]),zs=t.map(p=>p[1]);for(let x=Math.floor(Math.min(...xs)/4);x<=Math.floor(Math.max(...xs)/4);x++)for(let z=Math.floor(Math.min(...zs)/4);z<=Math.floor(Math.max(...zs)/4);z++){const key=x+':'+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(t)}}
const side=(p,a,b)=>(p[0]-b[0])*(a[1]-b[1])-(a[0]-b[0])*(p[1]-b[1])
function onPath(x,z){for(const [a,b,c] of grid.get(Math.floor(x/4)+':'+Math.floor(z/4))||[]){const p=[x,z],d1=side(p,a,b),d2=side(p,b,c),d3=side(p,c,a);if(!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0)))return true}return false}
// In the Explorer the terrain model shows mirrored east-west about the scene origin (x 81.55) relative to positions set
// from code, so the path a player sees at x lies at 163.1 - x in the exported mesh. Trees are kept off the path as it is
// shown in game; their own model is mirrored the same way, so the trunk offset flips too.
const MIRROR_X=2*81.55
const shownOnPath=(x,z)=>onPath(MIRROR_X-x,z)
// Clearance from the paths: a tree keeps its whole crown off the shown path (trunk at least the crown radius + 0.5 m,
// and never under 3 m); bushes and rocks keep 60% of their radius from the exported path.
const rot=(q,v)=>{const uv=[q[1]*v[2]-q[2]*v[1],q[2]*v[0]-q[0]*v[2],q[0]*v[1]-q[1]*v[0]],uuv=[q[1]*uv[2]-q[2]*uv[1],q[2]*uv[0]-q[0]*uv[2],q[0]*uv[1]-q[1]*uv[0]];return v.map((a,i)=>a+2*(q[3]*uv[i]+uuv[i]))}
const shapes=new Map()
function shape(file){if(shapes.has(file))return shapes.get(file);const m=glb(file),p=[]
 for(const n of m.j.nodes.filter(n=>n.mesh!==undefined)){const t=n.translation||[0,0,0],s=n.scale||[1,1,1],q=n.rotation||[0,0,0,1];for(const pr of m.j.meshes[n.mesh].primitives)for(const v of read(m,pr.attributes.POSITION))p.push(rot(q,[v[0]*s[0],v[1]*s[1],v[2]*s[2]]).map((a,i)=>(a+t[i])*.94))}
 const low=p.filter(v=>v[1]<.6),c=low.length?[low.reduce((s,v)=>s+v[0],0)/low.length,low.reduce((s,v)=>s+v[2],0)/low.length]:[0,0]
 const res={trunk:c,radius:Math.max(...p.map(v=>Math.hypot(v[0]-c[0],v[2]-c[1])))};shapes.set(file,res);return res}
function clearance(r){const s=shape(r.on);return r.kind==='wood'?Math.max(3,s.radius+.5):Math.max(.6,s.radius*.6)}
function pathDistance(x,z,max,test=onPath){for(let d=0;d<=max;d+=.25)for(let a=0;a<24;a++)if(test(x+d*Math.cos(a*Math.PI/12),z+d*Math.sin(a*Math.PI/12)))return d;return Infinity}
function clearOfPath(r,pos=r.position){const s=shape(r.on),need=clearance(r)
 return r.kind==='wood'?pathDistance(pos.x-s.trunk[0],pos.z+s.trunk[1],need,shownOnPath)>=need:pathDistance(pos.x+s.trunk[0],pos.z+s.trunk[1],need)>=need}
module.exports={onPath,shownOnPath,MIRROR_X,triangles:tris,clearOfPath,clearance,pathDistance,shape}
if(require.main===module){console.log(tris.length+' path triangles');const rows=[];for(let z=150;z>=10;z-=4){let r='';for(let x=10;x<=150;x+=2)r+=onPath(x,z)?'#':'.';rows.push(r)}console.log(rows.join('\n'))}
