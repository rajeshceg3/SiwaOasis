/* Siwa Walk - a quiet evening walk through Siwa Oasis: a sea of date palms,
   the Spring of the Sun, a salt lake, the Oracle of Amun, the Great Sand Sea,
   and Shali fortress melting back into the earth. */
import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { buildWorld } from './world.js';
import { createTraveler } from './traveler.js';
import { finishArt } from './finish-art.js';
import { createSoundscape } from './soundscape/soundscape-engine.js';
import gameProgram from './soundscape/program.js';

const $=s=>document.querySelector(s), canvas=$('#scene');
const qs=new URLSearchParams(location.search);
const CLEAN=qs.get('clean')==='1', AUTOPLAY=qs.get('play')==='1', MUTED=qs.get('mute')==='1';
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');let reduced=motionPreference.matches;motionPreference.addEventListener('change',e=>{reduced=e.matches;});

let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){$('#fallback').style.display='grid';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=T.PCFSoftShadowMap;

const scene=new T.Scene(), camera=new T.PerspectiveCamera(60,innerWidth/innerHeight,.12,1600);
scene.background=new T.Color('#f6c384');
scene.fog=new T.FogExp2('#c8c6b5',.0020);

/* Golden hour, fixed: sun low in the west, long warm shadows. */
const hemi=new T.HemisphereLight(0xd3e4ef,0x6e614b,1.65);scene.add(hemi);
const sunlight=new T.DirectionalLight(0xffd6a0,3.4);sunlight.castShadow=true;
sunlight.shadow.mapSize.set(2048,2048);
Object.assign(sunlight.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:8,far:380});
sunlight.shadow.bias=-.0006;sunlight.shadow.normalBias=.06;sunlight.shadow.radius=3;
scene.add(sunlight);scene.add(sunlight.target);
const SUN_DIR=new T.Vector3(-.82,.23,-.25).normalize();

const W=buildWorld(scene);
const art=finishArt(scene,W);
const {terrain,meshHeight,v,seq,easeU,ahr}=W;
const GROVE=W.GROVE,SPRING=W.SPRING,LAKE=W.LAKE,SHALI=W.SHALI,ORACLE=W.ORACLE;

/* Sky + sun sprite fixed to the evening hour (palette lives in world.js). */
W.skyU.sunDir.value.copy(SUN_DIR);
W.sun.position.copy(SUN_DIR).multiplyScalar(900);W.sun.lookAt(0,0,0);
W.halo.position.copy(SUN_DIR).multiplyScalar(880);W.halo.lookAt(0,0,0);

/* Filmic chain: render -> soft bloom on the low sun -> output. */
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.3,.45,1.5);
composer.addPass(bloom);
/* Heat shimmer: thin animated refraction band hugging the horizon line. */
const ShimmerShader={
 uniforms:{tDiffuse:{value:null},time:{value:0},horizonY:{value:.5},amt:{value:0}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;uniform sampler2D tDiffuse;uniform float time,horizonY,amt;
 void main(){vec2 uv=vUv;
  float g=exp(-pow((uv.y-horizonY)/.06,2.))*amt;
  float n1=sin(uv.y*230.+time*2.7+sin(uv.x*32.+time*.9)*3.2);
  float n2=sin(uv.y*141.-time*2.1+uv.x*57.+1.7);
  uv.x+=(n1*.65+n2*.35)*.0019*g;uv.y+=n2*.0011*g;
  gl_FragColor=texture2D(tDiffuse,clamp(uv,0.,1.));}`};
const shimmer=new ShaderPass(ShimmerShader);
composer.addPass(shimmer);
/* Gentle vignette + warm grade. */
const GradeShader={
 uniforms:{tDiffuse:{value:null}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;uniform sampler2D tDiffuse;
 void main(){vec4 c=texture2D(tDiffuse,vUv);
 float d=distance(vUv,vec2(.5));c.rgb*=1.-d*d*.38;
 c.rgb*=vec3(1.01,1.,.99);
 gl_FragColor=c;}`};
composer.addPass(new ShaderPass(GradeShader));
composer.addPass(new OutputPass());
const fxaa=new ShaderPass(FXAAShader);fxaa.material.uniforms.resolution.value.set(1/(innerWidth*renderer.getPixelRatio()),1/(innerHeight*renderer.getPixelRatio()));composer.addPass(fxaa);
const _fwd=new T.Vector3(),_hp=new T.Vector3();

sunlight.position.copy(SUN_DIR).multiplyScalar(140);
let lastShadowAt=-1;
function keepShadowsNear(p){const time=performance.now();if(time-lastShadowAt<120)return;lastShadowAt=time;renderer.shadowMap.needsUpdate=true;sunlight.position.set(p.x+SUN_DIR.x*140,p.y+SUN_DIR.y*140,p.z+SUN_DIR.z*140);sunlight.target.position.set(p.x,p.y,p.z);}

/* ---------- The traveler ---------- */
const {player,tick:tickTraveler}=createTraveler();scene.add(player);

/* Sand close-up detail: sun sparkle over the vertex-colored terrain. */
const sparkU={value:0};
{
  W.sandMat.onBeforeCompile=sh=>{
    sh.uniforms.uSpark=sparkU;
    sh.vertexShader=sh.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vSparkPos;')
      .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvSparkPos=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader=sh.fragmentShader
      .replace('#include <common>','#include <common>\nvarying vec3 vSparkPos;\nuniform float uSpark;')
      .replace('#include <map_fragment>',`#include <map_fragment>\nfloat hillQuiet=1.-smoothstep(30.,66.,length(vSparkPos.xz-vec2(0.,-110.)));diffuseColor.rgb=mix(diffuseColor.rgb,vColor*vec3(.95,.90,.80),hillQuiet*.87);`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
{vec2 sp2=vSparkPos.xz*14.0;vec2 cell=floor(sp2);float h=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);float tw=.5+.5*sin(uSpark*2.6+h*80.);float dot2=smoothstep(.22,.05,length(fract(sp2)-.5));float fade=clamp(1.0-length(vViewPosition)/55.,0.,1.);float glint=step(.993,h)*tw*dot2*fade;totalEmissiveRadiance+=vec3(1.,.88,.62)*glint*.8;}`);
  };
  W.sandMat.needsUpdate=true;
}


let mixer=null;const travelerModel=null;

/* ---------- Footprints ---------- */
const PRINTS=900;
const printCanvas=document.createElement('canvas');printCanvas.width=64;printCanvas.height=128;const pc=printCanvas.getContext('2d');pc.fillStyle='black';pc.fillRect(0,0,64,128);pc.fillStyle='white';pc.beginPath();pc.ellipse(32,38,19,27,0,0,Math.PI*2);pc.fill();pc.beginPath();pc.ellipse(32,88,15,20,0,0,Math.PI*2);pc.fill();const pi=pc.getImageData(0,0,64,128);for(let i=0;i<pi.data.length;i+=4){const a=.45+Math.random()*.55;pi.data[i]*=a;pi.data[i+1]*=a;pi.data[i+2]*=a;}pc.putImageData(pi,0,0);const printTex=new T.CanvasTexture(printCanvas);

const printGeo=new T.CircleGeometry(.09,10);printGeo.rotateX(-Math.PI/2);printGeo.scale(1,1,1.55);
const printMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:1,alphaMap:printTex,transparent:true,opacity:.30,depthWrite:false});
const prints=new T.InstancedMesh(printGeo,printMat,PRINTS);prints.count=0;prints.frustumCulled=false;scene.add(prints);
const printAge=new Float32Array(PRINTS),printCol=new T.Color(),sandCol=new T.Color('#e2a869'),freshCol=new T.Color('#695b44'),ghostCol=new T.Color('#a18b65');
let printHead=0;
const _pm=new T.Matrix4(),_pq=new T.Quaternion(),_pe=new T.Euler(),_ps=new T.Vector3(1,1,1),_pp=new T.Vector3();
const _up=new T.Vector3(0,1,0),_qn=new T.Vector3(),_qt=new T.Quaternion();
function addPrint(x,z,heading,side){
  const y=meshHeight(x,z)+.045;
  const e=.35,hx=meshHeight(x+e,z)-meshHeight(x-e,z),hz=meshHeight(x,z+e)-meshHeight(x,z-e);
  _qn.set(-hx/(2*e),1,-hz/(2*e)).normalize();
  _qt.setFromUnitVectors(_up,_qn);
  _pe.set(0,heading,0);_pq.setFromEuler(_pe);_pq.premultiply(_qt);
  _pp.set(x+Math.cos(heading)*side*.13,y,z-Math.sin(heading)*side*.13);
  _ps.set(1,1,1);_pm.compose(_pp,_pq,_ps);
  const i=printHead%PRINTS;prints.setMatrixAt(i,_pm);prints.setColorAt(i,freshCol);printAge[i]=0;
  if(printHead>=PRINTS)prints.count=PRINTS;else prints.count=printHead+1;
  printHead++;prints.instanceMatrix.needsUpdate=true;if(prints.instanceColor)prints.instanceColor.needsUpdate=true;
}
function agePrints(dt){
  for(let i=0;i<prints.count;i++){if(printAge[i]>300)continue;printAge[i]+=dt;const t=Math.min(1,printAge[i]/300);printCol.copy(freshCol).lerp(ghostCol,t);prints.setColorAt(i,printCol);}
  if(prints.instanceColor)prints.instanceColor.needsUpdate=true;
}

/* ---------- Dust kicked at the heels ---------- */
const DUST=160;
const dustGeo=new T.BufferGeometry();
const dustPos=new Float32Array(DUST*3),dustVel=new Float32Array(DUST*3),dustLife=new Float32Array(DUST);
dustGeo.setAttribute('position',new T.BufferAttribute(dustPos,3));
const dcv=document.createElement('canvas');dcv.width=dcv.height=64;const dcx=dcv.getContext('2d');
const dg=dcx.createRadialGradient(32,32,2,32,32,30);dg.addColorStop(0,'rgba(255,255,255,.9)');dg.addColorStop(1,'rgba(255,255,255,0)');
dcx.fillStyle=dg;dcx.fillRect(0,0,64,64);
const dustTex=new T.CanvasTexture(dcv);
const dust=new T.Points(dustGeo,new T.PointsMaterial({color:0xe9cd96,size:.14,map:dustTex,transparent:true,opacity:.18,depthWrite:false}));
dust.frustumCulled=false;scene.add(dust);let dustHead=0;
function puff(x,y,z){
  for(let k=0;k<4;k++){const i=dustHead%DUST;dustHead++;
    dustPos[i*3]=x+(Math.random()-.5)*.2;dustPos[i*3+1]=y+.05;dustPos[i*3+2]=z+(Math.random()-.5)*.2;
    dustVel[i*3]=(Math.random()-.5)*.5;dustVel[i*3+1]=.4+Math.random()*.5;dustVel[i*3+2]=(Math.random()-.5)*.5;
    dustLife[i]=1;}
}
function tickDust(dt){
  for(let i=0;i<DUST;i++){if(dustLife[i]<=0){dustPos[i*3+1]=-99;continue;}
    dustLife[i]-=dt*1.4;dustPos[i*3]+=dustVel[i*3]*dt;dustPos[i*3+1]+=dustVel[i*3+1]*dt;dustPos[i*3+2]+=dustVel[i*3+2]*dt;
    dustVel[i*3+1]-=dt*.9;}
  dustGeo.attributes.position.needsUpdate=true;
}

/* ---------- Discoveries ---------- */

const SITES=[
  {id:'grove',name:'A sea of date palms',p:v(GROVE.x,0,GROVE.z),r:16},
  {id:'spring',name:"Cleopatra's Pool",p:v(SPRING.x,0,SPRING.z),r:10},
  {id:'lake',name:'The salt lake',p:v(-36,0,10),r:12},
  {id:'oracle',name:'The Oracle of Amun',p:v(ORACLE.x,0,ORACLE.z),r:11},
  {id:'dunes',name:'The Great Sand Sea',p:v(105,0,105),r:13},
  {id:'shali',name:'Shali Fortress',p:v(SHALI.x,0,SHALI.z+19.5),r:4.5},
];
const found=new Set();const dots=[...document.querySelectorAll('#dots i')];
const card=$('#card');let cardTimer=0;
function showCard(text){card.textContent=text;card.classList.add('show');clearTimeout(cardTimer);cardTimer=setTimeout(()=>card.classList.remove('show'),3400);}
function checkSites(pos){
  if(doneShown||!begun)return;
  for(const s of SITES){if(found.has(s.id))continue;
    const dx=pos.x-s.p.x,dz=pos.z-s.p.z;
    if(dx*dx+dz*dz<s.r*s.r){found.add(s.id);dots[SITES.indexOf(s)].classList.add('on');
      showCard(s.name);if(found.size===SITES.length)finish();break;}}
}

/* ---------- Audio ---------- */
const soundscape=createSoundscape(gameProgram,{masterGain:.85});
let audioOn=false;
async function startAudio(){if(audioOn||MUTED)return;audioOn=true;try{await soundscape.start('trek');}catch(e){}}

/* ---------- Input: touch joystick + look drag, keys + mouse ---------- */
const keys={};
addEventListener('keydown',e=>{keys[e.code]=true;});
addEventListener('keyup',e=>{keys[e.code]=false;});
const joyEl=$('#joy'),nub=$('#nub');
let joyId=null,joyOx=0,joyOy=0,joyX=0,joyY=0,lookId=null,lookLx=0,lookLy=0;
let camYaw=Math.PI,camPitch=.12,camYawSm=Math.PI;
function ptInLeft(x){return x<innerWidth*.5;}
canvas.style.touchAction='none';
addEventListener('pointerdown',e=>{
  if(e.target&&e.target.closest&&e.target.closest('button,#start,#done'))return;
  if(e.pointerType==='mouse'){if(lookId===null){lookId=e.pointerId;lookLx=e.clientX;lookLy=e.clientY;}return;}
  if(ptInLeft(e.clientX)&&joyId===null){joyId=e.pointerId;joyOx=e.clientX;joyOy=e.clientY;joyX=joyY=0;
    joyEl.style.display='block';joyEl.style.left=(joyOx-60)+'px';joyEl.style.top=(joyOy-60)+'px';}
  else if(lookId===null){lookId=e.pointerId;lookLx=e.clientX;lookLy=e.clientY;}
});
addEventListener('pointermove',e=>{
  if(e.pointerId===joyId){const dx=e.clientX-joyOx,dy=e.clientY-joyOy,m=Math.hypot(dx,dy),cl=Math.min(m,52);
    const a=Math.atan2(dy,dx);joyX=Math.cos(a)*cl/52;joyY=Math.sin(a)*cl/52;
    nub.style.transform=`translate(calc(-50% + ${Math.cos(a)*cl}px),calc(-50% + ${Math.sin(a)*cl}px))`;}
  else if(e.pointerId===lookId){const dx=e.clientX-lookLx,dy=e.clientY-lookLy;lookLx=e.clientX;lookLy=e.clientY;
    camYaw+=dx*.0038;camPitch=Math.max(-.12,Math.min(.55,camPitch+dy*.004));}
});
function releasePointer(e){
  if(e.pointerId===joyId){joyId=null;joyX=joyY=0;joyEl.style.display='none';nub.style.transform='translate(-50%,-50%)';}
  if(e.pointerId===lookId)lookId=null;
}
addEventListener('pointerup',releasePointer);addEventListener('pointercancel',releasePointer);

/* ---------- Movement state ---------- */
const spawnQ=(qs.get('spawn')||'').split(',').map(Number);
const pos=v(spawnQ[0]||0,0,spawnQ[1]||76);
if(qs.get('yaw')!=null)camYaw=+qs.get('yaw');
pos.y=meshHeight(pos.x,pos.z);
let heading=camYaw,stride=0,dist=0,started=performance.now();
const vel=v(0,0,0);
const WALK=5.0;
let paused=false,begun=false,doneShown=false,camSnap=true,hideStart=false,travelerReady=true,hideStartAt=0;

/* ---------- Overlay wiring ---------- */
const startEl=$('#start'),beginBtn=$('#beginBtn'),pauseBtn=$('#pauseBtn');
function begin(){
  begun=true;pauseBtn.hidden=CLEAN;
  $('#soundBtn').hidden=false;$('#hint').hidden=false;setTimeout(()=>$('#hint').hidden=true,7500);started=performance.now();hideStart=true;hideStartAt=performance.now();camSnap=true;
}
beginBtn.addEventListener('click',begin);
startEl.addEventListener('keydown',e=>{if(e.key==='Escape')beginBtn.focus();});
beginBtn.focus();
if(AUTOPLAY)begin();
pauseBtn.addEventListener('click',()=>{paused=!paused;pauseBtn.setAttribute('aria-pressed',String(paused));pauseBtn.setAttribute('aria-label',paused?'Resume':'Pause');});
document.addEventListener('visibilitychange',()=>{last=performance.now();soundscape.handleVisibility();});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);fxaa.material.uniforms.resolution.value.set(1/(innerWidth*renderer.getPixelRatio()),1/(innerHeight*renderer.getPixelRatio()));});

function finish(){
  if(doneShown)return;doneShown=true;
  const secs=Math.round((performance.now()-started)/1000),mm=Math.floor(secs/60),ss=String(secs%60).padStart(2,'0');
  $('#doneStats').textContent=`${found.size} of ${SITES.length} found, ${Math.round(dist)} metres walked, ${mm}:${ss} in the evening light.`;
  $('#done').hidden=false;$('#againBtn').focus();
}
document.addEventListener('keydown',e=>{
  const d=$('#done');if(d.hidden)return;
  if(e.key==='Tab'){e.preventDefault();$('#againBtn').focus();}
  if(e.key==='Escape'){e.preventDefault();}
});
document.addEventListener('focusin',e=>{
  const d=$('#done');if(d.hidden)return;
  if(!d.contains(e.target))$('#againBtn').focus();
});
$('#againBtn').addEventListener('click',()=>{$('#done').hidden=true;doneShown=false;player.position.set(0,meshHeight(0,76),76);pos.set(0,meshHeight(0,76),76);dist=0;found.clear();dots.forEach(d=>d.classList.remove('on'));prints.count=0;printHead=0;vel.set(0,0,0);started=performance.now();camYaw=Math.PI;camYawSm=Math.PI;camSnap=true;});

/* ---------- Creature life (functions of elapsed; frozen when paused/reduced) ---------- */
function tickAnimals(t,dt){
  {const fen=W.fennec,u=fen.userData;
   const [fs,fu]=seq(t+3.5,[10,7,5.5,7]);
   const alert=fs===1?ahr(fu,.18,.25):0,dig=fs===2?ahr(fu,.2,.3):0;
   u.head.rotation.y=alert*Math.sin(fu*Math.PI*2)*.55;
   u.head.rotation.x=dig*.5-alert*.12;
   fen.scale.y=1.5*(1+Math.sin(t*2.2)*.012*(1-alert));}
  for(let i=0;i<W.doves.length;i++){const d=W.doves[i],a=t*.14+i*1.256;
    const r=16+Math.sin(t*.05+i)*3;
    d.position.set(GROVE.x+Math.sin(a)*r,terrain(GROVE.x,GROVE.z)+8+Math.sin(t*.5+i)*1.4,GROVE.z+Math.cos(a)*r);
    d.rotation.y=a+Math.PI/2;
    const flap=Math.sin(t*9+i*2)*.55;
    d.userData.wingL.rotation.z=flap;d.userData.wingR.rotation.z=-flap;}
  for(let i=0;i<W.perchedDoves.length;i++){const d=W.perchedDoves[i];
    const [ps,pu]=seq(t+i*4.3,[3.2,1.4,4.5,2.2]);
    const peck=ps===1?ahr(pu,.3,.3):0,preen=ps===3?ahr(pu,.25,.3):0;
    d.rotation.x=peck*.5;d.rotation.z=preen*.35;}
  for(let i=0;i<W.egrets.length;i++){const g=W.egrets[i];
    const [es,eu]=seq(t+g.userData.ph,[6,2.2,5,1.4]);
    const dip=es===1?ahr(eu,.3,.35):0,step2=es===3?ahr(eu,.4,.4):0;
    g.userData.body.rotation.z=dip*.5;
    g.position.y=Math.max(terrain(g.position.x,g.position.z),W.LAKE_Y)+Math.abs(Math.sin(t*2.4+i))*.01*step2;}
  {const f=W.flyEgret,a=t*.09;
   const cx2=LAKE.x+10,cz2=LAKE.z,r=34;
   f.position.set(cx2+Math.sin(a)*r,7.5+Math.sin(t*.4)*1.5,cz2+Math.cos(a)*r*.72);
   f.rotation.y=a+Math.PI/2+Math.PI;
   const gate=Math.sin(t*.17)>0?0:1;
   const flap=Math.sin(t*7)*.5*gate+.14*(1-gate);
   f.userData.wingL.rotation.z=flap;f.userData.wingR.rotation.z=-flap;}
  for(let i=0;i<W.dragonflies.length;i++){const d=W.dragonflies[i],u=d.userData,a=t*u.sp+u.ph;
    d.position.set(SPRING.x+Math.sin(a*1.7)*u.r,W.springY+1.6+u.h+Math.sin(t*3+u.ph)*.3,SPRING.z+Math.cos(a*1.3)*u.r);
    d.rotation.y=Math.atan2(Math.cos(a*1.7)*1.7,-Math.sin(a*1.3)*1.3);
    u.wings.scale.y=1+Math.sin(t*60+i)*.25;}
}

/* ---------- Ambient ticks ---------- */
function tickAmbient(t,dt){
  art.tick(t);
  W.palmTime.value=t;
  W.pool.material.uniforms.time.value=t;
  W.lake.material.uniforms.time.value=t;
  W.mirage.material.uniforms.time.value=t;
  const sp=W.streaks.geometry.attributes.position;
  for(let i=0;i<sp.count;i++){let x=sp.getX(i)+dt*2.4;if(x>70)x=-70;sp.setX(i,x);}
  sp.needsUpdate=true;
  const cp=W.shaliFlag.geometry.attributes.position;
  for(let i=0;i<cp.count;i++){const bx=cp.getX(i);cp.setZ(i,Math.sin(bx*3.4+t*2.1)*.07*(bx+.7));}
  cp.needsUpdate=true;W.shaliFlag.geometry.computeVertexNormals();
  for(let i=0;i<W.clouds.length;i++){const c=W.clouds[i];c.position.x+=dt*1.1;if(c.position.x>820)c.position.x=-820;}
  for(let i=0;i<W.shafts.length;i++){W.shafts[i].material.opacity=.08+.045*Math.sin(t*.5+i*1.7);}
  for(let i=0;i<W.lanterns.length;i++){const w2=W.lanterns[i];const f=.85+.3*Math.sin(t*7+i*2.3)*Math.sin(t*3.1+i);
    w2.material.color.setRGB(1*f,.76*f,.4*f);}
  for(let i=0;i<W.shaliGlows.length;i++){const g=W.shaliGlows[i];g.material.opacity=(.12+.025*Math.sin(t*5+i*1.9));}
  for(let i=0;i<W.flock.length;i++){const f=W.flock[i],a=t*f.sp2+f.ph;
    f.sp.position.set(f.cx+Math.sin(a)*f.r,f.h+Math.sin(t*.3+i*1.3)*2.2,f.cz+Math.cos(a)*f.r);
    f.sp.scale.y=1.2*(.5+.5*Math.abs(Math.sin(t*4.6+i*2.1)));}
}

/* ---------- Main loop ---------- */
let last=performance.now(),elapsed=0,ambient=0,lastCaptureRender=0;
const camTarget=v(0,0,0),camPos=v(0,0,0),cameraRay=new T.Raycaster(),cameraDirection=v(0,0,0);
function animate(now){
  requestAnimationFrame(animate);
  if(document.hidden)return;
  const dt=Math.min((now-last)/1000,.12);last=now;
  const moving=begun&&!paused&&!doneShown;
  if(moving&&!reduced)elapsed+=dt;else if(moving&&reduced)elapsed+=0;
  if(!paused&&!reduced)ambient+=dt;
  /* input vector */
  let ix=0,iz=0;
  if(moving){
    if(keys.KeyW||keys.ArrowUp)iz+=1;if(keys.KeyS||keys.ArrowDown)iz-=1;
    if(keys.KeyA||keys.ArrowLeft)ix+=1;if(keys.KeyD||keys.ArrowRight)ix-=1;
    ix+=joyX;iz-=joyY;
    const m=Math.hypot(ix,iz);if(m>1){ix/=m;iz/=m;}
  }
  const hasInput=(ix||iz);
  if(hasInput){
    $('#hint').hidden=true;
    const sin=Math.sin(camYaw),cos=Math.cos(camYaw);
    const wx=sin*iz+cos*ix, wz=cos*iz-sin*ix;
    heading=Math.atan2(wx,wz);
    vel.x=wx*WALK;vel.z=wz*WALK;
  }else if(!moving){vel.set(0,0,0);}else{vel.x*=Math.exp(-dt*8);vel.z*=Math.exp(-dt*8);}
  const oldX=pos.x,oldZ=pos.z;
  const nx=pos.x+vel.x*dt,nz=pos.z+vel.z*dt;
  const rr=Math.hypot(nx,nz);
  const blocked=(x,z)=>((((x-LAKE.x)/59)**2+((z-LAKE.z)/43)**2<1&&meshHeight(x,z)<W.LAKE_Y+.3)||Math.hypot(x-SPRING.x,z-SPRING.z)<6.1||W.colliders.some(c=>Math.hypot(x-c.x,z-c.z)<c.r+.28));
  if(!blocked(nx,nz)&&rr<170){pos.x=nx;pos.z=nz;}
  else if(rr<170){if(!blocked(nx,pos.z))pos.x=nx;if(!blocked(pos.x,nz))pos.z=nz;}
  else{const s=170/rr;pos.x=nx*s;pos.z=nz*s;}
  const speed=dt>0?Math.hypot(pos.x-oldX,pos.z-oldZ)/dt:0;
  if(speed>.4){dist+=speed*dt;stride+=speed*dt;
    if(stride>.72){stride=0;addPrint(pos.x,pos.z,heading,(printHead%2?1:-1));if(!reduced)puff(pos.x,pos.y,pos.z);}}
  const groundY=meshHeight(pos.x,pos.z);
  pos.y+=(groundY-pos.y)*Math.min(1,dt*10);
  player.position.copy(pos);
  player.rotation.y=heading;
  /* walk sway */
  const sw=Math.min(1,speed/WALK),sway=reduced?0:Math.sin(elapsed*7)*sw;
  player.position.y=pos.y+Math.abs(sway)*.045*(travelerModel?0:1);
  tickTraveler(elapsed,speed,reduced);
  /* camera */
  sparkU.value=elapsed;
  if(camSnap)camYawSm=camYaw;
  {let dy2=camYaw-camYawSm;dy2=Math.atan2(Math.sin(dy2),Math.cos(dy2));camYawSm+=dy2*(reduced?1:Math.min(1,dt*3.2));}
  // Open the skyline over the final ridge without taking away manual look.
  const homeDistance=Math.hypot(pos.x-SHALI.x,pos.z-SHALI.z);
  const homeReveal=1-T.MathUtils.smoothstep(homeDistance,24,64);
  const entry=T.MathUtils.smoothstep(-pos.z,87,93);
  const cd=6.3+homeReveal*(innerWidth<600?18:6)*(1-entry),ch=2.95+homeReveal*2.2*(1-entry);
  camTarget.set(pos.x,pos.y+1.5+homeReveal*3.0*(1-entry),pos.z);
  camPos.set(pos.x-Math.sin(camYawSm)*cd*Math.cos(camPitch),pos.y+ch+Math.sin(camPitch)*cd,pos.z-Math.cos(camYawSm)*cd*Math.cos(camPitch));
  const cg=meshHeight(camPos.x,camPos.z)+.5;if(camPos.y<cg)camPos.y=cg;
  scene.updateMatrixWorld();
  cameraDirection.subVectors(camPos,camTarget);const desiredDistance=cameraDirection.length();cameraDirection.normalize();
  // Sweep a shoulder-width camera volume, not only its centre ray. Double-sided
  // tests catch a wall even when a look drag begins behind its exterior face.
  const right=v(cameraDirection.z,0,-cameraDirection.x).normalize();let safeDistance=desiredDistance;
  const sides=new Map();for(const obj of W.cameraSolids){const m=obj.material;if(!sides.has(m)){sides.set(m,m.side);m.side=T.DoubleSide;}}
  for(const [sx,sy]of [[0,0],[-.48,0],[.48,0],[0,-.9],[0,.55]]){const origin=camTarget.clone().addScaledVector(right,sx);origin.y+=sy;cameraRay.set(origin,cameraDirection);cameraRay.far=desiredDistance+.7;const hits=cameraRay.intersectObjects(W.cameraSolids,false);if(hits.length)safeDistance=Math.min(safeDistance,Math.max(.7,hits[0].distance-.8));}
  for(const [m,side]of sides)m.side=side;
  const obstructed=safeDistance<desiredDistance;
  camPos.copy(camTarget).addScaledVector(cameraDirection,safeDistance);
  if(camSnap||obstructed){camera.position.copy(camPos);camSnap=false;}
  else{const k=reduced?1:1-Math.exp(-dt*7);camera.position.lerp(camPos,k);}
  camera.lookAt(camTarget);
  keepShadowsNear(pos);
  if(!paused&&!reduced){tickAnimals(elapsed,dt);tickAmbient(ambient,dt);}
  else if(!paused&&reduced){}
  agePrints(dt);tickDust(dt);
  checkSites(pos);
  /* oasis audio crossfade */
  if(audioOn){const dg=Math.hypot(pos.x-GROVE.x,pos.z-GROVE.z);
    const dl=Math.hypot(pos.x-LAKE.x,pos.z-LAKE.z);
    const dsh=Math.hypot(pos.x-SHALI.x,pos.z-SHALI.z);
    const want=dsh<48?'shali':dg<38?'grove':dl<70?'lake':'trek';
    if(soundscape.scene!==want&&soundscape.on!==false)soundscape.setScene(want);}
  camera.getWorldDirection(_fwd);_fwd.y=0;if(_fwd.lengthSq()<1e-6)_fwd.set(1,0,0);_fwd.normalize();
  _hp.copy(camera.position).addScaledVector(_fwd,500);_hp.project(camera);
  shimmer.uniforms.horizonY.value=_hp.y*.5+.5;
  shimmer.uniforms.time.value=ambient;
  shimmer.uniforms.amt.value=(paused||reduced||Math.hypot(pos.x-GROVE.x,pos.z-GROVE.z)<65)?0:.95*(.85+.15*Math.min(3,devicePixelRatio||1));
  // Explicit test mode limits render work only, never input/physics clocks or speed.
  if(qs.get('capture')!=='1'||now-lastCaptureRender>6000){composer.render();lastCaptureRender=now;}
  if(hideStart){startEl.hidden=true;hideStart=false;}
}
tickAnimals(0,0);tickAmbient(0,0);
requestAnimationFrame(animate);
window.__game={player,W,camera,T,pos:()=>pos,found,prints,SITES,teleport:(x,z,yaw)=>{pos.set(x,meshHeight(x,z),z);vel.set(0,0,0);if(yaw!=null){camYaw=yaw;heading=yaw;}camSnap=true;},begin,printCount:()=>prints.count};
// Gate hooks (scene-inspection raycast)
window.__gateScene=scene;window.__gateCamera=camera;


$('#soundBtn').addEventListener('click',async()=>{if(!audioOn)await startAudio();else soundscape.setOn(!soundscape.on);$('#soundBtn').setAttribute('aria-pressed',String(soundscape.on));$('#soundBtn').setAttribute('aria-label',soundscape.on?'Turn sound off':'Turn sound on');});
addEventListener('blur',()=>{Object.keys(keys).forEach(k=>delete keys[k]);joyId=lookId=null;joyX=joyY=0;joyEl.style.display='none';vel.set(0,0,0);});
