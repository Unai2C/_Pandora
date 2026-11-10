const fs=require('fs')
function mp3Seconds(file){
 const b=fs.readFileSync(file);let offset=0,seconds=0,frames=0
 if(b.toString('ascii',0,3)==='ID3')offset=10+((b[6]&127)*2097152+(b[7]&127)*16384+(b[8]&127)*128+(b[9]&127))
 while(offset+4<=b.length){
  const h=b.readUInt32BE(offset),version=(h>>>19)&3,layer=(h>>>17)&3,bitrateIndex=(h>>>12)&15,sampleIndex=(h>>>10)&3
  if((h>>>21)!==2047||version===1||layer!==1||bitrateIndex===0||bitrateIndex===15||sampleIndex===3){offset++;continue}
  const bitrate=(version===3?[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320]:[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160])[bitrateIndex]
  const rate=[44100,48000,32000][sampleIndex]/(version===3?1:version===2?2:4)
  const length=Math.floor((version===3?144:72)*bitrate*1000/rate)+((h>>>9)&1)
  if(offset+length>b.length)break
  seconds+=(version===3?1152:576)/rate;frames++;offset+=length
 }
 if(frames<10)throw Error('No valid MP3 frames: '+file)
 return Number(seconds.toFixed(3))
}
if(require.main===module)for(const f of fs.readdirSync('assets/sounds').filter(f=>f.endsWith('.mp3')))console.log(f,mp3Seconds('assets/sounds/'+f))
module.exports={mp3Seconds}
