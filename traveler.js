import * as T from 'three';
export function createTraveler(){
const player=new T.Group();
const cv=document.createElement('canvas');cv.width=cv.height=128;const cx=cv.getContext('2d');const img=cx.createImageData(128,128);
for(let y=0;y<128;y++)for(let x=0;x<128;x++){const n=182+((x%3===0)?23:0)+((y%3===0)?18:0)+Math.random()*18;const i=(y*128+x)*4;img.data[i]=img.data[i+1]=img.data[i+2]=n;img.data[i+3]=255;}cx.putImageData(img,0,0);
const weave=new T.CanvasTexture(cv);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(4,4);weave.colorSpace=T.SRGBColorSpace;
const cloth=new T.MeshStandardMaterial({color:'#c7b69b',roughness:.96,map:weave,bumpMap:weave,bumpScale:.012});
const shade=new T.MeshStandardMaterial({color:'#5a4b3c',roughness:.92,map:weave});
const cream=new T.MeshStandardMaterial({color:'#ded3b9',roughness:.95,map:weave,bumpMap:weave,bumpScale:.008});
const leather=new T.MeshStandardMaterial({color:'#493a2b',roughness:.9});
const skin=new T.MeshStandardMaterial({color:'#946b46',roughness:.8});
function rim(m,i=.16,col='#ffdcae'){m.onBeforeCompile=sh=>{sh.uniforms.uRimC={value:new T.Color(col)};sh.uniforms.uRimI={value:i};
sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uRimC;uniform float uRimI;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float rimF=pow(1.0-saturate(dot(normal,normalize(vViewPosition))),3.0);totalEmissiveRadiance+=uRimC*(rimF*uRimI);}');};
m.customProgramCacheKey=()=>'trim'+col+i;return m;}
rim(cloth,.17);rim(cream,.15);rim(skin,.14);
function mesh(geo,mat,pos,parent=player){const o=new T.Mesh(geo,mat);o.position.set(...pos);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
// A continuous, shoulder-shaped garment rather than a cylinder with a head.
const points=[[.08,.22],[.18,.29],[.36,.30],[.58,.27],[.78,.23],[1.0,.205],[1.17,.20],[1.31,.24],[1.40,.26],[1.47,.18],[1.51,.125]];
const profile=[];for(let j=0;j<points.length-1;j++)for(let q=0;q<3;q++){const t=q/3;profile.push([T.MathUtils.lerp(points[j][0],points[j+1][0],t),T.MathUtils.lerp(points[j][1],points[j+1][1],t)]);}profile.push(points.at(-1));
const positions=[],uv=[],ids=[];const N=48;
for(let j=0;j<profile.length;j++){const [y,r]=profile[j];for(let i=0;i<=N;i++){const a=i/N*Math.PI*2;const folds=(Math.sin(a*11+y*.8)*.017+Math.sin(a*19-y)*.006)*(1-Math.min(1,y/1.55)*.45);const r2=r+folds;positions.push(Math.cos(a)*r2,y,Math.sin(a)*r2*.72);uv.push(i/N*2,y*1.1);}}
for(let j=0;j<profile.length-1;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;ids.push(a,b,a+1,b,b+1,a+1);}
const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ids);geo.computeVertexNormals();
const robe=mesh(geo,cloth,[0,0,0]);const base=geo.attributes.position.array.slice();
mesh(new T.CylinderGeometry(.073,.09,.17,12),skin,[0,1.56,0]);
const head=mesh(new T.SphereGeometry(.12,24,18),skin,[0,1.69,.015]);head.scale.set(.91,1.18,.86);
mesh(new T.SphereGeometry(.023,10,8),skin,[0,1.69,.12]);
for(const x of [-.044,.044])mesh(new T.SphereGeometry(.01,8,6),new T.MeshStandardMaterial({color:'#271f17',roughness:.6}),[x,1.725,.103]);
// Overlapping woven bands of a wrapped linen turban, tilted over the crown.
const wrap=mesh(new T.SphereGeometry(.135,24,18),cream,[0,1.79,0]);wrap.scale.set(1,.75,.94);
for(let k=0;k<4;k++){const ring=mesh(new T.TorusGeometry(.119+k*.001,.009,6,32),cream,[0,1.73+k*.024,0]);ring.rotation.set(Math.PI/2-.16,0,.16);ring.scale.set(1,1,.8);}
const tailGeo=new T.PlaneGeometry(.085,.5,4,16);const tp=tailGeo.attributes.position;
for(let i=0;i<tp.count;i++){const yy=tp.getY(i);tp.setZ(i,Math.sin(yy*8)*.016);}
const tail=mesh(tailGeo,new T.MeshStandardMaterial({color:'#ded3b9',map:weave,roughness:.95,side:T.DoubleSide}),[.04,1.43,-.15]);tail.rotation.x=.18;
// Soft dark shoulder shawl lays over the chest and down the back.
const shawlMat=new T.MeshStandardMaterial({color:'#8a7458',roughness:.95,map:weave});rim(shawlMat,.13);
const shawl=mesh(new T.TorusGeometry(.205,.05,8,32,Math.PI*1.9),shawlMat,[0,1.345,0]);shawl.rotation.set(Math.PI/2,.18,.30);shawl.scale.set(1.05,.72,1);
const sash=mesh(new T.TorusGeometry(.211,.027,8,32),leather,[0,1.04,0]);sash.rotation.x=Math.PI/2;sash.scale.set(1,.73,1);
const sashBand=mesh(new T.TorusGeometry(.208,.014,6,32),new T.MeshStandardMaterial({color:'#9a4632',roughness:.9}),[0,1.085,0]);sashBand.rotation.x=Math.PI/2;sashBand.scale.set(1,.735,1);
/* rolled blanket worn diagonally across the back */
const rollCv=document.createElement('canvas');rollCv.width=64;rollCv.height=16;const rx=rollCv.getContext('2d');
rx.fillStyle='#ded3b9';rx.fillRect(0,0,64,16);rx.fillStyle='#9a4632';rx.fillRect(10,0,7,16);rx.fillRect(44,0,7,16);rx.fillStyle='#5a4b3c';rx.fillRect(26,0,3,16);
const rollTex=new T.CanvasTexture(rollCv);rollTex.wrapS=rollTex.wrapT=T.RepeatWrapping;rollTex.colorSpace=T.SRGBColorSpace;
const bedroll=mesh(new T.CapsuleGeometry(.045,.42,4,10),new T.MeshStandardMaterial({color:'#d8caa8',roughness:.94,map:rollTex}),[.015,1.26,-.16]);bedroll.rotation.set(.18,.06,1.12);
const strap=mesh(new T.TorusGeometry(.16,.012,5,24),leather,[-.06,1.24,.02]);strap.rotation.set(.35,1.35,.9);
const pouch=mesh(new T.SphereGeometry(.095,12,10),leather,[-.215,.99,.025]);pouch.scale.set(.62,1.15,.7);
const arms=[];
for(const side of [-1,1]){const pivot=new T.Group();pivot.position.set(side*.245,1.37,0);player.add(pivot);
const sleeve=mesh(new T.CapsuleGeometry(.072,.27,5,12),cloth,[side*.018,-.17,0],pivot);sleeve.rotation.z=side*.12;
mesh(new T.SphereGeometry(.045,12,9),skin,[side*.035,-.39,.015],pivot);pivot.rotation.z=side*.07;arms.push(pivot);}
const staffGeo=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,-.77,0),new T.Vector3(.015,0,.015),new T.Vector3(.03,.62,.035),new T.Vector3(.075,.70,.02)]),24,.018,7,false);
const staff=mesh(staffGeo,new T.MeshStandardMaterial({color:'#55452e',roughness:.93}),[.33,.8,.07]);staff.rotation.z=-.045;
const legs=[];for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.10,.43,0);player.add(leg);mesh(new T.CapsuleGeometry(.048,.25,4,10),shade,[0,-.17,0],leg);const boot=mesh(new T.SphereGeometry(.075,12,8),leather,[0,-.385,.045],leg);boot.scale.set(.72,.62,1.5);legs.push(leg);}
player.userData={robe,head,wrap,tail,sash,armL:arms[0],armR:arms[1],staff,legL:legs[0],legR:legs[1]};
function tick(t,speed,reduced){const amount=Math.min(1,speed/4),walk=reduced?0:Math.sin(t*7.8)*amount;const p=geo.attributes.position;
for(let i=0;i<p.count;i++){const y=base[i*3+1],weight=1-T.MathUtils.smoothstep(y,.15,1.2);p.setX(i,base[i*3]+(reduced?0:(Math.sin(t*3+y*4)*.014+walk*.028))*weight);p.setZ(i,base[i*3+2]+(reduced?0:Math.cos(t*4+y*2)*.014*amount)*weight);}p.needsUpdate=true;
for(let i=0;i<2;i++){const s=i?1:-1;legs[i].rotation.x=walk*.44*s;arms[i].rotation.x=-walk*.24*s;}
tail.rotation.x=.18+(reduced?0:Math.sin(t*2.5)*.05+walk*.08);staff.rotation.x=-walk*.05;}
return {player,tick};
}
