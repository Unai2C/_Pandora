// Builds Sword_Attack_Back_emote.glb: Sword_Attack_Fast played backwards, so the blade returns along the opposite arc,
// then retimed so the blow lands at the same moment as the forward swing (289 ms of 845 ms).
// Run from the project root: node scripts/sword-backswing.cjs
const fs=require('fs'),DIR='assets/scene/modelos/animaciones/'
const IMPACT=.289
const b=fs.readFileSync(DIR+'Sword_Attack_Fast_emote.glb'),len=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+len))
const binStart=28+len,bin=Buffer.from(b.subarray(binStart,binStart+b.readUInt32LE(20+len)))
const view=i=>{const a=j.accessors[i],v=j.bufferViews[a.bufferView],n={SCALAR:1,VEC3:3,VEC4:4}[a.type];return {a,n,base:(v.byteOffset||0)+(a.byteOffset||0),stride:v.byteStride||n*4}}
const read=i=>{const {a,n,base,stride}=view(i);return Array.from({length:a.count},(_,e)=>Array.from({length:n},(_,c)=>bin.readFloatLE(base+e*stride+c*4)))}
const write=(i,rows)=>{const {n,base,stride}=view(i);rows.forEach((row,e)=>{for(let c=0;c<n;c++)bin.writeFloatLE(row[c],base+e*stride+c*4)})}
const anim=j.animations[0],duration=Math.max(...anim.samplers.map(s=>j.accessors[s.input].max[0]))
// Reversed, the original impact frame falls at duration - IMPACT; warp time so it lands at IMPACT again.
const pivot=duration-IMPACT,warp=t=>t<=pivot?t*IMPACT/pivot:IMPACT+(t-pivot)*(duration-IMPACT)/(duration-pivot)
for(const i of new Set(anim.samplers.map(s=>s.input))){
 const times=read(i).map(r=>r[0]),next=times.map((_,e)=>[Math.max(0,warp(duration-times[times.length-1-e]))])
 write(i,next);j.accessors[i].min=[next[0][0]];j.accessors[i].max=[next[next.length-1][0]]
}
for(const o of new Set(anim.samplers.map(s=>s.output)))write(o,read(o).reverse())
anim.name='Attack_Sword_Back_Avatar'
let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,0x20)])
const rest=b.subarray(binStart+bin.length)
const out=Buffer.concat([Buffer.alloc(20),json,b.subarray(20+len,binStart),bin,rest])
out.writeUInt32LE(0x46546C67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4E4F534A,16)
fs.writeFileSync(DIR+'Sword_Attack_Back_emote.glb',out)
console.log('Sword_Attack_Back_emote.glb',duration.toFixed(3)+' s, impact at '+IMPACT+' s')
