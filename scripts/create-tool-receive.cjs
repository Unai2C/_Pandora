const fs=require('fs')
const source='assets/scene/modelos/animaciones/Hold_Tool_emote.glb',output='assets/scene/modelos/animaciones/Receive_Tool_emote.glb'
const b=fs.readFileSync(source),jsonLength=b.readUInt32LE(12),doc=JSON.parse(b.subarray(20,20+jsonLength)),original=b.subarray(28+jsonLength),clip=doc.animations[0]
const size={SCALAR:1,VEC3:3,VEC4:4}
function first(index){const a=doc.accessors[index],v=doc.bufferViews[a.bufferView];return Array.from({length:size[a.type]},(_,i)=>original.readFloatLE((v.byteOffset||0)+(a.byteOffset||0)+i*4))}
const poses=doc.nodes.map(n=>({translation:n.translation??[0,0,0],rotation:n.rotation??[0,0,0,1],scale:n.scale??[1,1,1]}))
for(const c of clip.channels)poses[c.target.node][c.target.path]=first(clip.samplers[c.sampler].output)
const parents={};doc.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>parents[c]=i))
const mul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]
const inv=q=>[-q[0],-q[1],-q[2],q[3]],norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)},rot=(q,v)=>mul(mul(q,[...v,0]),inv(q)).slice(0,3),sub=(a,b)=>a.map((v,i)=>v-b[i])
function world(i,p){const pose=p[i];if(parents[i]===undefined)return {q:pose.rotation,p:pose.translation};const parent=world(parents[i],p),offset=rot(parent.q,pose.translation);return {q:mul(parent.q,pose.rotation),p:parent.p.map((v,k)=>v+offset[k])}}
function align(a,b){a=norm(a);b=norm(b);return norm([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0],1+a.reduce((s,v,i)=>s+v*b[i],0)])}
function slerp(a,b,t){let d=a.reduce((s,v,i)=>s+v*b[i],0);if(d<0){b=b.map(x=>-x);d=-d}if(d>.9995)return norm(a.map((v,i)=>v+(b[i]-v)*t));const angle=Math.acos(Math.min(1,d)),s=Math.sin(angle);return a.map((v,i)=>(v*Math.sin((1-t)*angle)+b[i]*Math.sin(t*angle))/s)}
const raised=structuredClone(poses),arm=doc.nodes.findIndex(n=>n.name==='Avatar_RightArm'),forearm=doc.nodes.findIndex(n=>n.name==='Avatar_RightForeArm'),hand=doc.nodes.findIndex(n=>n.name==='Avatar_RightHand')
if([arm,forearm,hand].includes(-1))throw Error('Missing right-arm bones')
const before=world(hand,poses).p
const side=before[0]<world(doc.nodes.findIndex(n=>n.name==='Avatar_Hips'),poses).p[0]?-1:1
for(const [joint,child,direction]of [[arm,forearm,[side*.3,.95,.08]],[forearm,hand,[side*.04,.99,.12]]]){
 const current=world(joint,raised),to=world(child,raised),delta=align(sub(to.p,current.p),direction),parent=world(parents[joint],raised)
 raised[joint].rotation=norm(mul(inv(parent.q),mul(delta,current.q)))
}
const after=world(hand,raised).p
if(after[1]<before[1]+.45)throw Error('Receive animation does not raise the hand enough')
const chunks=[original],times=Array.from({length:79},(_,i)=>i/30)
let length=original.length
function accessor(values,type){const bytes=Buffer.alloc(values.length*4);values.forEach((v,i)=>bytes.writeFloatLE(v,i*4));const view=doc.bufferViews.length;doc.bufferViews.push({buffer:0,byteOffset:length,byteLength:bytes.length});chunks.push(bytes);length+=bytes.length;const a=doc.accessors.length;doc.accessors.push({bufferView:view,componentType:5126,count:values.length/size[type],type,...(type==='SCALAR'?{min:[0],max:[2.6]}:{})});return a}
const input=accessor(times,'SCALAR'),samplers=[],channels=[]
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)}
for(const c of clip.channels){const {node,path}=c.target,values=[];for(const time of times){const t=time<.3?0:time<1?ease((time-.3)/.7):time<1.8?1:1-ease((time-1.8)/.8);values.push(...(path==='rotation'?slerp(poses[node].rotation,raised[node].rotation,t):poses[node][path]))}samplers.push({input,output:accessor(values,path==='rotation'?'VEC4':'VEC3'),interpolation:'LINEAR'});channels.push({sampler:samplers.length-1,target:{node,path}})}
doc.animations=[{name:'Receive_Tool_Avatar',samplers,channels}];doc.buffers=[{byteLength:length}]
let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)])
let binary=Buffer.concat(chunks);binary=Buffer.concat([binary,Buffer.alloc((4-binary.length%4)%4)])
const header=Buffer.alloc(20);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+binary.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16)
const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(binary.length);binHeader.writeUInt32LE(0x004e4942,4)
fs.writeFileSync(output,Buffer.concat([header,json,binHeader,binary]))
console.log(JSON.stringify({output,seconds:2.6,handBefore:before,handRaised:after,images:doc.images?.length??0,meshes:doc.meshes?.length??0}))
