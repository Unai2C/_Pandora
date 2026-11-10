// Builds Agent_Rings_Friendly.glb and Agent_Rings_Corrupt.glb: the ring meshes of Friendly_Rings / Corrupt_Rings with one
// looping "Hover" clip in which the five rings stay stacked and only breathe slightly, so the lift never vanishes.
// Run from the project root: node scripts/agent-rings.cjs
const fs=require('fs')
const DIR='assets/scene/modelos/fx/',PERIOD=2.4,KEYS=24
function build(source,target){
 const b=fs.readFileSync(DIR+source),len=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+len))
 let bin=b.subarray(28+len,28+len+b.readUInt32LE(20+len))
 const rings=j.nodes.map((n,i)=>({n,i})).filter(({n})=>/^Energy_Ring_\d$/.test(n.name))
 const times=Array.from({length:KEYS+1},(_,k)=>k*PERIOD/KEYS)
 const chunks=[],add=(floats,type,count,minmax)=>{
  const offset=bin.length+chunks.reduce((s,c)=>s+c.length,0),buf=Buffer.alloc(floats.length*4);floats.forEach((v,i)=>buf.writeFloatLE(v,i*4));chunks.push(buf)
  j.bufferViews.push({buffer:0,byteOffset:offset,byteLength:buf.length})
  j.accessors.push({bufferView:j.bufferViews.length-1,componentType:5126,count,type,...minmax});return j.accessors.length-1
 }
 const input=add(times,'SCALAR',times.length,{min:[0],max:[PERIOD]})
 const samplers=[],channels=[]
 rings.forEach(({i},r)=>{
  const base=.5+.1*r,y=.1+.2*r,phase=r*.9
  const scale=times.flatMap(t=>{const s=base*(1+.07*Math.sin(2*Math.PI*t/PERIOD+phase));return [s,s,s]})
  const move=times.flatMap(t=>[0,y+.015*Math.sin(2*Math.PI*t/PERIOD+phase),0])
  samplers.push({input,output:add(scale,'VEC3',times.length),interpolation:'LINEAR'});channels.push({sampler:samplers.length-1,target:{node:i,path:'scale'}})
  samplers.push({input,output:add(move,'VEC3',times.length),interpolation:'LINEAR'});channels.push({sampler:samplers.length-1,target:{node:i,path:'translation'}})
 })
 j.animations=[{name:'Hover',samplers,channels}]
 bin=Buffer.concat([bin,...chunks]);j.buffers[0].byteLength=bin.length
 let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,0x20)])
 const pad=Buffer.alloc((4-bin.length%4)%4);bin=Buffer.concat([bin,pad]);j.buffers[0].byteLength=bin.length-pad.length
 json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,0x20)])
 const head=Buffer.alloc(20);head.writeUInt32LE(0x46546C67,0);head.writeUInt32LE(2,4);head.writeUInt32LE(20+json.length+8+bin.length,8);head.writeUInt32LE(json.length,12);head.writeUInt32LE(0x4E4F534A,16)
 const binHead=Buffer.alloc(8);binHead.writeUInt32LE(bin.length,0);binHead.writeUInt32LE(0x004E4942,4)
 fs.writeFileSync(DIR+target,Buffer.concat([head,json,binHead,bin]))
 console.log(target,rings.length+' rings')
}
build('Friendly_Rings.glb','Agent_Rings_Friendly.glb')
build('Corrupt_Rings.glb','Agent_Rings_Corrupt.glb')
