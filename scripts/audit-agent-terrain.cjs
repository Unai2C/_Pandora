const fs=require('fs');
function load(file){const b=fs.readFileSync(file),n=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+n)),bin=b.subarray(28+n);return {j,bin}}
function data(g,i){const a=g.j.accessors[i],v=g.j.bufferViews[a.bufferView],size={SCALAR:1,VEC3:3}[a.type],bytes={5123:2,5125:4,5126:4}[a.componentType],out=[];for(let k=0;k<a.count;k++){const row=[];for(let c=0;c<size;c++){const o=(v.byteOffset||0)+(a.byteOffset||0)+k*(v.byteStride||size*bytes)+c*bytes;row.push(a.componentType===5126?g.bin.readFloatLE(o):bytes===2?g.bin.readUInt16LE(o):g.bin.readUInt32LE(o))}out.push(size===1?row[0]:row)}return out}
function triangles(file){const g=load(file),out=[];for(const node of g.j.nodes){if(node.mesh===undefined)continue;if(node.translation||node.rotation||node.scale||node.matrix)throw Error('Unexpected node transform');for(const p of g.j.meshes[node.mesh].primitives){const v=data(g,p.attributes.POSITION),idx=p.indices===undefined?v.map((_,i)=>i):data(g,p.indices);for(let i=0;i<idx.length;i+=3)out.push({name:node.name,v:idx.slice(i,i+3).map(k=>[81.55+v[k][0]*.94,.5+v[k][1]*.94,79.94+v[k][2]*.94])})}}return out}
function height(tris,x,z){const hits=[];for(const {name,v:[a,b,c]} of tris){const d=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(d)<1e-8)continue;const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/d,w=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/d;if(u>=0&&w>=0&&u+w<=1)hits.push({y:u*a[1]+w*b[1]+(1-u-w)*c[1],name})}return hits.sort((a,b)=>b.y-a.y)[0]}
const base=triangles('assets/scene/modelos/pandora-v1-20261103/base.glb'),water=triangles('assets/scene/modelos/pandora-v1-20261103/water.glb');
const ts=require('typescript'),vm=require('vm'),cache={};
function loadShared(name){if(cache[name])return cache[name];const exports={};cache[name]=exports;vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/shared/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:id=>loadShared(id.replace('./',''))});return exports}
const {SENTINELS,inVillageSafeZone}=loadShared('testEnemy');
for(const enemy of SENTINELS.slice(8)){
 for(let segment=0;segment<enemy.route.length;segment++){
  const a=enemy.route[segment],b=enemy.route[(segment+1)%enemy.route.length];
  for(let k=0;k<=10;k++){
   const x=a.x+(b.x-a.x)*k/10,z=a.z+(b.z-a.z)*k/10,ground=height(base,x,z),wet=height(water,x,z);
   if(!ground||inVillageSafeZone({x,z})||(wet&&wet.y>=ground.y-.05)||ground.y>a.y-.65)throw Error(enemy.id+' invalid terrain at '+x+','+z)
  }
 }
 console.log(enemy.id+': dry terrain validated along the full patrol route')
}
