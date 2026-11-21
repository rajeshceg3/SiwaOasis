/* Siwa Walk - world builder.
   Patterns (palm generator, creature helpers, dove builder) adapted from the
   earlier DuneWalker/Sahara code; terrain, salt lake, spring, Shali, oracle,
   olives, egrets and dragonflies are new for Siwa. */
import * as T from 'three';
export function buildWorld(scene){
let seed=733;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646},range=(a,b)=>a+(b-a)*rand();
const v=(x,y,z)=>new T.Vector3(x,y,z);
const mat=(color,roughness=.92,flat=true)=>new T.MeshStandardMaterial({color,roughness,flatShading:flat});
const M4=(x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0)=>new T.Matrix4().compose(v(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),v(sx,sy,sz));
function paint(geo,fn){const p=geo.attributes.position,n=p.count,col=new Float32Array(n*3),c=new T.Color(),q=new T.Vector3();for(let i=0;i<n;i++){q.fromBufferAttribute(p,i);fn(q,c,i);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}geo.setAttribute('color',new T.BufferAttribute(col,3));return geo;}
function mergeParts(parts){const Ps=[],Ns=[],Cs=[],UVs=[],vs=new T.Vector3(),ns=new T.Vector3(),nm=new T.Matrix3(),cc=new T.Color();
for(const part of parts){const g=part.geo.index?part.geo.toNonIndexed():part.geo.clone();const p=g.attributes.position,n2=g.attributes.normal;nm.getNormalMatrix(part.m);
for(let i=0;i<p.count;i++){vs.fromBufferAttribute(p,i).applyMatrix4(part.m);Ps.push(vs.x,vs.y,vs.z);ns.fromBufferAttribute(n2,i).applyMatrix3(nm).normalize();Ns.push(ns.x,ns.y,ns.z);const uv=g.attributes.uv;UVs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
if(typeof part.c==='function')part.c(vs,cc,i);else if(part.c!=null)cc.set(part.c);else if(g.attributes.color)cc.setRGB(g.attributes.color.getX(i),g.attributes.color.getY(i),g.attributes.color.getZ(i));else cc.set('#ffffff');Cs.push(cc.r,cc.g,cc.b);}}
const out=new T.BufferGeometry();out.setAttribute('position',new T.BufferAttribute(new Float32Array(Ps),3));out.setAttribute('normal',new T.BufferAttribute(new Float32Array(Ns),3));out.setAttribute('color',new T.BufferAttribute(new Float32Array(Cs),3));out.setAttribute('uv',new T.BufferAttribute(new Float32Array(UVs),2));return out;}
function taperTube(pts,rFn,sides=9,opts={}){const curve=new T.CatmullRomCurve3(pts);const segs=Math.max(10,pts.length*5);const frames=curve.computeFrenetFrames(segs,false);const P=[],N=[],I=[];
const UV=[];const up=new T.Vector3(0,1,0),tan=new T.Vector3();
for(let i=0;i<=segs;i++){const t=i/segs,c=curve.getPoint(t),r=rFn(t);let nrm,bin;
if(opts.flat){curve.getTangent(t,tan);nrm=new T.Vector3().crossVectors(up,tan);if(nrm.lengthSq()<.01)nrm.set(1,0,0);nrm.normalize();bin=new T.Vector3().crossVectors(tan,nrm).normalize();}
else{nrm=frames.normals[i];bin=frames.binormals[i];}
for(let s=0;s<sides;s++){const a=s/sides*Math.PI*2,nx=Math.cos(a),ny=Math.sin(a);
P.push(c.x+(nrm.x*nx+bin.x*ny)*r,c.y+(nrm.y*nx+bin.y*ny)*r,c.z+(nrm.z*nx+bin.z*ny)*r);
N.push(nrm.x*nx+bin.x*ny,nrm.y*nx+bin.y*ny,nrm.z*nx+bin.z*ny);UV.push(t*8,s/sides);}}
for(let i=0;i<segs;i++)for(let s=0;s<sides;s++){const a=i*sides+s,b=i*sides+(s+1)%sides,c2=(i+1)*sides+s,d=(i+1)*sides+(s+1)%sides;I.push(a,c2,b,b,c2,d);}
const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(P),3));g.setAttribute('normal',new T.BufferAttribute(new Float32Array(N),3));g.setAttribute('uv',new T.BufferAttribute(new Float32Array(UV),2));g.setIndex(I);return g;}
function furTex(streak,alpha=.12,strokes=1100){const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,128,128);x.strokeStyle=streak;x.lineWidth=.8;for(let i=0;i<strokes;i++){x.globalAlpha=alpha*(.4+Math.random());const px=Math.random()*128,py=Math.random()*128,l=2+Math.random()*4,a=Math.PI/2+(Math.random()-.5)*.8;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke();}const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
function featherGeo(len,wid){const s=new T.Shape();s.moveTo(len*.08,-wid*.30);s.quadraticCurveTo(-len*.30,-wid*.62,-len*.70,-wid*.46);s.quadraticCurveTo(-len*.96,-wid*.28,-len,0);s.quadraticCurveTo(-len*.96,wid*.28,-len*.70,wid*.46);s.quadraticCurveTo(-len*.30,wid*.62,len*.08,wid*.30);s.quadraticCurveTo(len*.16,0,len*.08,-wid*.30);const g=new T.ExtrudeGeometry(s,{depth:.004,bevelEnabled:false});g.rotateX(-Math.PI/2);return g;}
function strandTex(streak,alpha=.5,strokes=1500){const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,128,128);x.strokeStyle=streak;x.lineWidth=.9;for(let i=0;i<strokes;i++){x.globalAlpha=alpha*(.4+Math.random());const px=Math.random()*128,py=Math.random()*128,l=2.5+Math.random()*5,a=Math.PI/2+(Math.random()-.5)*.9;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke();}const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
const creatureMat=(rough=.9,map=null,extra={})=>{
const{rim,rimColor,...rest}=extra;const m=new T.MeshStandardMaterial(Object.assign({vertexColors:true,map,roughness:rough},rest));
if(rim){m.onBeforeCompile=sh=>{sh.uniforms.uRimC={value:new T.Color(rimColor||'#ffdcae')};sh.uniforms.uRimI={value:rim};
sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uRimC;uniform float uRimI;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float rimF=pow(1.0-saturate(dot(normal,normalize(vViewPosition))),3.0);totalEmissiveRadiance+=uRimC*(rimF*uRimI);}');};
m.customProgramCacheKey=()=>'rim'+(rimColor||'')+rim;}
return m;}
function barbBumpTex(){const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,128,128);
for(let i=-16;i<144;i+=4){x.strokeStyle=i%8?'rgba(60,60,60,.5)':'rgba(200,200,200,.45)';x.lineWidth=1.1;x.beginPath();x.moveTo(i,0);x.lineTo(i+26,128);x.stroke();}
const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
const smoothU=t=>t*t*(3-2*t);
const sstep=(a,b,x)=>smoothU(Math.min(1,Math.max(0,(x-a)/(b-a))));

/* ---------- Sky ---------- */
const skyU={top:{value:new T.Color('#377eaa')},hor:{value:new T.Color('#b3c6c5')},sunDir:{value:new T.Vector3(-.82,.15,-.25)},glow:{value:new T.Color('#ff9e4e')},glowAmt:{value:1.15}};
const skyDome=new T.Mesh(new T.SphereGeometry(980,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:skyU,vertexShader:`varying vec3 vd;void main(){vd=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vd;uniform vec3 top,hor,glow,sunDir;uniform float glowAmt;void main(){vec3 d=normalize(vd);vec3 col=mix(hor,top,pow(max(d.y,0.),.5));col=mix(col,vec3(.68,.64,.53),pow(max(1.-abs(d.y),0.),6.)*.08);float s=max(dot(d,normalize(sunDir)),0.);col+=glow*(pow(s,24.)*1.1+pow(s,4.)*.25)*glowAmt;gl_FragColor=vec4(col,1.);}`}));
skyDome.frustumCulled=false;const skyRig=new T.Group();skyRig.add(skyDome);scene.add(skyRig);
const radTex=(inner,mid)=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,'+inner+')');g.addColorStop(.55,'rgba(255,255,255,'+mid+')');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c);};
const sun=new T.Mesh(new T.CircleGeometry(30,32),new T.MeshBasicMaterial({color:0xfff2d0,fog:false,transparent:true,alphaMap:radTex(1,.7)}));skyRig.add(sun);
const halo=new T.Mesh(new T.CircleGeometry(120,32),new T.MeshBasicMaterial({color:0xffe2b0,fog:false,transparent:true,opacity:.22,depthWrite:false,alphaMap:radTex(.9,.4)}));skyRig.add(halo);
/* High drifting clouds: canvas-painted billboards, warm-lit underneath. */
const clouds=[];
{const cc=document.createElement('canvas');cc.width=256;cc.height=128;const cx=cc.getContext('2d');
for(let i=0;i<26;i++){const px=30+Math.random()*196,py=44+Math.random()*44,r=14+Math.random()*26;const g=cx.createRadialGradient(px,py,2,px,py,r);g.addColorStop(0,'rgba(255,236,214,.55)');g.addColorStop(.7,'rgba(250,214,182,.28)');g.addColorStop(1,'rgba(250,214,182,0)');cx.fillStyle=g;cx.beginPath();cx.arc(px,py,r,0,7);cx.fill();}
const ctex=new T.CanvasTexture(cc);
for(let i=0;i<5;i++){const sm=new T.SpriteMaterial({map:ctex,transparent:true,opacity:.5+rand()*.25,depthWrite:false,fog:false,color:new T.Color().setHSL(.07,.5,.78+rand()*.1)});
const sp=new T.Sprite(sm);const a=rand()*6.28,r=520+rand()*260;sp.position.set(Math.sin(a)*r,105+rand()*70,Math.cos(a)*r);sp.scale.set(190+rand()*140,58+rand()*34,1);skyRig.add(sp);clouds.push(sp);}}

/* ---------- Terrain: oasis depression, salt-lake basin, Shali and Oracle hills, Great Sand Sea ---------- */
const LAKE=v(-100,0,10),GROVE=v(15,0,25),SPRING=v(28,0,40),SHALI=v(0,0,-110),ORACLE=v(85,0,-55);
const LAKE_Y=-1.15;
function ridge(t){t=t-Math.floor(t);return Math.pow(Math.sin(Math.PI*Math.pow(t,.72)),1.15);}
function terrain(x,z){
let h=1.1*Math.sin(x*.021+1.3)*Math.sin(z*.019)+.5*Math.sin(x*.05+2.)*Math.sin(z*.043)+.18*Math.sin(x*.3+Math.sin(z*.28))*Math.sin(z*.31);
{const dx=x-0,dz=z-20;h-=1.8*Math.exp(-(dx*dx+dz*dz)/(2*85*85));}               // oasis depression
{const dx=x-LAKE.x,dz=z-LAKE.z,d2=dx*dx+dz*dz;h-=3.6*Math.exp(-d2/(2*30*30));}      // lake basin
{const dx=x-SHALI.x,dz=z-SHALI.z,a=Math.atan2(dx,dz);const d=Math.hypot(dx,dz)*(1+.065*Math.sin(a*3)+.035*Math.cos(a*7));h+=16.2*Math.exp(-Math.pow(d/32,3.0));h+=Math.sin(a*11+d*.22)*.32*sstep(10,22,d)*(1-sstep(40,58,d));} // Shali plateau
{const d=Math.hypot(x-ORACLE.x,z-ORACLE.z);h+=8.5*(1-sstep(9,26,d));}             // Oracle hill
{const m=sstep(52,140,(x+z)/2)*sstep(-20,30,x)*sstep(-20,30,z);                   // Great Sand Sea, SE
 const u1=(x*.86+z*.5)*.016+.5*Math.sin(z*.006),u2=(x*.5-z*.86)*.012;
 h+=m*(15*ridge(u1)+8*ridge(u2));}
return h;}
function meshHeight(x,z){
const CS=760/300,gx=(x+380)/CS,gz=(z+380)/CS;
const ix=Math.max(0,Math.min(299,Math.floor(gx))),iz=Math.max(0,Math.min(299,Math.floor(gz)));
const fx=gx-ix,fz=gz-iz,x0=-380+ix*CS,z0=-380+iz*CS;
const h00=terrain(x0,z0),h10=terrain(x0+CS,z0),h01=terrain(x0,z0+CS),h11=terrain(x0+CS,z0+CS);
return fx>=fz?h00+(h10-h00)*fx+(h11-h10)*fz:h00+(h11-h01)*fx+(h01-h00)*fz;}
const geo=new T.PlaneGeometry(760,760,300,300);geo.rotateX(-Math.PI/2);
{const p=geo.attributes.position;let hmin=1e9,hmax=-1e9;const hs=new Float32Array(p.count);
for(let i=0;i<p.count;i++){const h=terrain(p.getX(i),p.getZ(i));hs[i]=h;p.setY(i,h);if(h<hmin)hmin=h;if(h>hmax)hmax=h;}
geo.computeVertexNormals();const n=geo.attributes.normal,colors=new Float32Array(p.count*3);
const base=new T.Color('#d3b080'),dark=new T.Color('#8d795e'),light=new T.Color('#eddbb6'),green=new T.Color('#8a8a4e'),salt=new T.Color('#efe6d2'),c=new T.Color();
for(let i=0;i<p.count;i++){const px=p.getX(i),pz=p.getZ(i),t=(hs[i]-hmin)/(hmax-hmin),ny=n.getY(i);
c.copy(base).lerp(dark,Math.min(.72,Math.max(0,(1-ny)*2.4)));
c.lerp(light,Math.max(0,Math.min(1,(t-.6)*2.2))*.7);
const dg=Math.hypot(px-GROVE.x,pz-GROVE.z);
if(dg<48)c.lerp(green,(1-dg/48)*.20*(0.6+0.4*Math.sin(px*.9)*Math.sin(pz*.8)));
const ds=Math.hypot(px-SPRING.x,pz-SPRING.z);if(ds<10)c.lerp(new T.Color('#5f6250'),(1-sstep(5.8,10,ds))*.72);   // grove floor, vegetated
const dl=Math.hypot((px-LAKE.x)/1.35,(pz-LAKE.z));
if(dl<62)c.lerp(salt,sstep(58,40,dl)*.85);                                        // salt ring around the lake
const v2=1+.05*Math.sin(px*.02)*Math.sin(pz*.017);
colors[i*3]=c.r*v2;colors[i*3+1]=c.g*v2;colors[i*3+2]=c.b*v2;}
geo.setAttribute('color',new T.BufferAttribute(colors,3));}
const cv=document.createElement('canvas');cv.width=cv.height=512;const cx=cv.getContext('2d');
const id=cx.createImageData(512,512);for(let y=0;y<512;y++)for(let x=0;x<512;x++){const n=125+Math.sin(y*.29+Math.sin(x*.014)*5)*12+Math.random()*22;const k=(y*512+x)*4;id.data[k]=id.data[k+1]=id.data[k+2]=n;id.data[k+3]=255;}cx.putImageData(id,0,0);
const sandTex=new T.CanvasTexture(cv);sandTex.wrapS=sandTex.wrapT=T.RepeatWrapping;sandTex.repeat.set(95,95);
const sandMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.96,bumpMap:sandTex,bumpScale:.13});
const floor=new T.Mesh(geo,sandMat);floor.receiveShadow=true;scene.add(floor);
const colliders=[];
const dummy=new T.Object3D(),up=v(0,1,0);
const batches={};function inst(key,geoI,color,max=3000,opts={}){if(!batches[key]){const mesh=new T.InstancedMesh(geoI,mat(color,opts.rough??.92),max);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=true;scene.add(mesh);batches[key]=mesh;}return batches[key];}
function stamp(key,geoI,color,p,s,rot){const b=inst(key,geoI,color);dummy.position.copy(p);dummy.scale.copy(s);dummy.quaternion.copy(rot||new T.Quaternion());dummy.updateMatrix();b.setMatrixAt(b.count++,dummy.matrix);}
/* Rocks and dry shrubs on the open ground. */
const rockGeo=new T.IcosahedronGeometry(1,4);
{const rp=rockGeo.attributes.position;for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),s=1+Math.sin(x*5+z*7)*Math.sin(y*6)*.14+Math.sin(x*17+y*11+z*9)*.035;rp.setXYZ(i,x*s,y*s,z*s);}rockGeo.computeVertexNormals();}
const shrubGeo=new T.IcosahedronGeometry(.5,1);
{const sp=shrubGeo.attributes.position;
for(let i=0;i<sp.count;i++){const px=sp.getX(i),py=sp.getY(i),pz=sp.getZ(i);const j=.75+(Math.sin(px*41.3+py*27.7+pz*33.1)*.5+.5)*.7;sp.setXYZ(i,px*j*1.3,Math.max(py*j*.6,-.05),pz*j*1.3);}
shrubGeo.computeVertexNormals();}
function farFromSites(x,z){return Math.hypot(x-GROVE.x,z-GROVE.z)>46&&Math.hypot((x-LAKE.x)/1.35,z-LAKE.z)>66&&Math.hypot(x-SHALI.x,z-SHALI.z)>30&&Math.hypot(x-ORACLE.x,z-ORACLE.z)>20;}
for(let i=0;i<110;i++){const a=range(0,6.28),r=range(18,158),x=Math.sin(a)*r,z=Math.cos(a)*r;if(!farFromSites(x,z)||Math.hypot(x,z-76)<14)continue;const s=range(.3,1.4);stamp('rock',rockGeo,i%3?'#8a6a4c':'#6e5238',v(x,terrain(x,z)-s*.35,z),v(s*1.3,s*.7,s),new T.Quaternion().setFromEuler(new T.Euler(range(0,3),range(0,3),range(0,3))));}
for(let i=0;i<90;i++){const a=range(0,6.28),r=range(24,158),x=Math.sin(a)*r,z=Math.cos(a)*r;if(!farFromSites(x,z))continue;const s=range(.4,.9);for(let k=0;k<3;k++){stamp('shrub',rockGeo,k?'#7d6b3f':'#6b5c33',v(x+range(-.4,.4),terrain(x,z)+.16*s,z+range(-.4,.4)),v(s*.45,s*.18,s*.45),new T.Quaternion().setFromEuler(new T.Euler(range(-.15,.15),range(0,6),range(-.15,.15))));}}
/* Salt crust mounds along the lake shore. */
const saltGeo=new T.IcosahedronGeometry(.6,1);
{const sp=saltGeo.attributes.position;for(let i=0;i<sp.count;i++){const px=sp.getX(i),py=sp.getY(i),pz=sp.getZ(i);const j=.8+.45*Math.sin(px*23+py*31+pz*27);sp.setXYZ(i,px*j,Math.abs(py*j)*.55,pz*j);}saltGeo.computeVertexNormals();}
for(let i=0;i<48;i++){const a=range(0,6.28),r=range(40,58),x=LAKE.x+Math.sin(a)*r*1.35,z=LAKE.z+Math.cos(a)*r;const s=range(.3,1.1);stamp('salt',saltGeo,i%4?'#f4eee0':'#e6dcc4',v(x,terrain(x,z)+.05,z),v(s,s*.6,s),new T.Quaternion().setFromEuler(new T.Euler(0,range(0,6),0)));}

/* ---------- The salt lake ---------- */
const lake=new T.Mesh(new T.CircleGeometry(1,64),new T.ShaderMaterial({uniforms:{time:{value:0},ctr:{value:new T.Vector2(LAKE.x,LAKE.z)},sunDir:{value:skyU.sunDir.value}},
vertexShader:`varying vec3 w;void main(){w=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`varying vec3 w;uniform float time;uniform vec2 ctr;uniform vec3 sunDir;
void main(){vec2 p=w.xz-ctr;float d=length(p*vec2(1.,1.35))/58.;
float q=sin(w.x*.9+time*.5)*sin(w.z*1.2+time*.4);
vec3 col=mix(vec3(.05,.36,.4),vec3(.32,.72,.66),smoothstep(.1,.9,d));       // deep teal to turquoise shelf
col+=vec3(.12,.2,.18)*q*.25;
vec2 sd2=normalize(sunDir.xz);vec2 pp=vec2(dot(p,sd2),dot(p,vec2(-sd2.y,sd2.x)));
float band=exp(-pp.y*pp.y/240.);
float tw=pow(max(0.,sin(w.x*9.+time*2.2)*sin(w.z*7.5-time*1.7)),20.);
col+=vec3(1.,.85,.6)*tw*band*2.2;                                            // sun glitter toward the west
col+=vec3(1.,.9,.7)*band*.10;
col=mix(col,vec3(.93,.9,.8),smoothstep(.88,1.,d));                           // salty rim
gl_FragColor=vec4(col,1.);}`}));
lake.rotation.x=-Math.PI/2;lake.scale.set(58,42,1);lake.position.set(LAKE.x,LAKE_Y,LAKE.z);scene.add(lake);

/* ---------- Cleopatra's Bath: the spring pool ---------- */
const springY=terrain(SPRING.x,SPRING.z);
const spring=new T.Group();
{const stone=mat('#c9b490',.9),stoneD=mat('#a8906a',.95);
const spGeo=new T.BoxGeometry(.72,.23,.38,3,2,2);
{const pp=spGeo.attributes.position;for(let i=0;i<pp.count;i++){const xx=pp.getX(i),yy=pp.getY(i),zz=pp.getZ(i);const jitter=Math.sin(xx*33+yy*29+zz*17)*.017;pp.setXYZ(i,xx+jitter,yy+jitter*.45,zz+jitter);}spGeo.computeVertexNormals();}
const spParts=[];
for(let row=0;row<5;row++)for(let s=0;s<48;s++){const a=(s+(row%2)*.5)/48*Math.PI*2,r=5.55;
spParts.push({geo:spGeo,m:M4(Math.sin(a)*r,.10+row*.23,Math.cos(a)*r,1,1,1,0,a,0),c:row===4?'#b9a582':s%3?'#c6b99c':'#aa9a7e'});}
const wall=new T.Mesh(mergeParts(spParts),new T.MeshStandardMaterial({vertexColors:true,roughness:.94}));wall.castShadow=wall.receiveShadow=true;spring.add(wall);
for(let i=0;i<3;i++){const st=new T.Mesh(new T.BoxGeometry(1.6-i*.3,.22,1.0),i%2?stone:stoneD);st.position.set(-4.4+i*.62,.9-i*.3,1.2);st.rotation.y=.35;st.castShadow=st.receiveShadow=true;spring.add(st);}}
spring.position.set(SPRING.x,springY,SPRING.z);scene.add(spring);
const pool=new T.Mesh(new T.CircleGeometry(5.35,36),new T.ShaderMaterial({transparent:true,uniforms:{time:{value:0},ctr:{value:new T.Vector2(SPRING.x,SPRING.z)}},
vertexShader:`varying vec3 w;void main(){w=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`varying vec3 w;uniform float time;uniform vec2 ctr;
void main(){vec2 p=w.xz-ctr;float d=length(p)/5.35;
float q=sin(w.x*1.7+time*.9)*sin(w.z*1.9+time*.7);float c=pow(max(0.,q),3.);
vec3 col=mix(vec3(.1,.4,.42),vec3(.5,.82,.74),c*.6+.25);
col=mix(col,vec3(.78,.94,.86),smoothstep(.7,1.,d)*.45);
float bub=pow(max(0.,sin(w.x*7.+time*2.6)*sin(w.z*6.2-time*2.)),24.);
col+=vec3(.9,1.,.95)*bub*.5*smoothstep(.6,.1,d);                            // spring bubbling up
col+=vec3(.05,.08,.06)*sin(d*30.-time*2.4)*smoothstep(.9,.3,d);
float g=pow(max(0.,sin(w.x*6.5+time*1.7)*sin(w.z*5.7-time*1.3)),22.);
col+=vec3(1.,.98,.88)*g*.3;
gl_FragColor=vec4(col,.96);}`}));
pool.rotation.x=-Math.PI/2;pool.position.set(SPRING.x,springY+.82,SPRING.z);scene.add(pool);

/* ---------- Date palms (Siwa's palm sea), merged into one mesh ---------- */
{const P=[],Cc=[],I=[];let vi=0;const tc=new T.Color(),tc2=new T.Color();
const pushV=(p,c)=>{P.push(p.x,p.y,p.z);Cc.push(c.r,c.g,c.b);return vi++;};
function addGeo(g,m4,color){const pa=g.attributes.position,nv=pa.count,base=vi,ve=new T.Vector3();tc.set(color);for(let i=0;i<nv;i++){ve.fromBufferAttribute(pa,i).applyMatrix4(m4);pushV(ve,tc);}const ia=g.index;if(ia)for(let i=0;i<ia.count;i++)I.push(base+ia.getX(i));else for(let i=0;i<nv;i++)I.push(base+i);}
function frond(top,yaw0,e0,e1,L,w0,c0,c1){
const dx=Math.cos(yaw0),dz=Math.sin(yaw0),px=-dz,pz=dx;
const path=[];let x=top.x,y=top.y,z=top.z;const S=24;
for(let k=0;k<=S;k++){path.push(v(x,y,z));const t=k/S,a=e0+(e1-e0)*t*t*(3-2*t);x+=dx*Math.cos(a)*L/S;y+=Math.sin(a)*L/S;z+=dz*Math.cos(a)*L/S;}
for(let k=0;k<S;k++){
 const t=k/S,A=path[k],B=path[k+1];tc.copy(c0).lerp(c1,t);tc2.copy(tc).multiplyScalar(.75);
 const rr=.018*(1-t)+.003;
 const i0=pushV(v(A.x+px*rr,A.y,A.z+pz*rr),tc),i1=pushV(v(A.x-px*rr,A.y,A.z-pz*rr),tc2),i2=pushV(v(B.x+px*rr,B.y,B.z+pz*rr),tc),i3=pushV(v(B.x-px*rr,B.y,B.z-pz*rr),tc2);I.push(i0,i1,i2,i1,i3,i2);
 if(k<2)continue;
 for(const side of [-1,1]){
  const len=(.27+Math.sin(Math.PI*t)*.66)*(L/3.6),ww=.088*(1-t*.42),bend=.04+len*.20;
  const tip=v(A.x+px*len*side-dx*len*.28,A.y-bend,A.z+pz*len*side-dz*len*.28);
  const mid=v((A.x+tip.x)*.5,(A.y+tip.y)*.5+.035,(A.z+tip.z)*.5);
  const root=pushV(A,tc),l=pushV(v(mid.x-dx*ww,mid.y,mid.z-dz*ww),tc2),ridge=pushV(v(mid.x,mid.y+.025,mid.z),tc),r=pushV(v(mid.x+dx*ww,mid.y,mid.z+dz*ww),tc2),end=pushV(tip,tc2);
  I.push(root,l,ridge,root,ridge,r,l,end,ridge,ridge,end,r);
 }
}}
function palm(x,z,h,leanA,leanAmt,sd){
const y0=terrain(x,z)-.15;colliders.push({x,z,r:.48});
const rings=60,sides=12;let prev=null;
for(let r=0;r<=rings;r++){const t=r/rings,cx=x+Math.cos(leanA)*leanAmt*t*t*h,cz=z+Math.sin(leanA)*leanAmt*t*t*h,y=y0+t*h,rad=(.25-.10*t)*(1+.035*Math.sin(t*150+sd*7)),ring=[];
for(let s=0;s<sides;s++){const a=s/sides*Math.PI*2;tc.setHSL(.07,.33,.30+.038*Math.sin(t*150+sd*7)+.018*Math.sin(s*3));ring.push(pushV(v(cx+Math.cos(a)*rad,y,cz+Math.sin(a)*rad),tc));}
if(prev)for(let s=0;s<sides;s++){const s2=(s+1)%sides;I.push(prev[s],prev[s2],ring[s],prev[s2],ring[s2],ring[s]);}prev=ring;}
const top=v(x+Math.cos(leanA)*leanAmt*h,y0+h,z+Math.sin(leanA)*leanAmt*h),g0=new T.Color('#244a27'),g1=new T.Color('#8ba557'),b0=new T.Color('#8a6a3c'),b1=new T.Color('#4a3418');
const NF=37;
for(let j=0;j<NF;j++){const yaw=j/NF*6.28+sd+range(-.12,.12),tier=j%3;
if(tier===0)frond(top,yaw,1.15,.15,(2.6+.9*rand())*(h/5),.24,g0,g1);
else if(tier===1)frond(top,yaw,.72,-.5,(2.8+1.0*rand())*(h/5),.26,g0,g1);
else frond(top,yaw,.3,-1.25,(2.9+1.1*rand())*(h/5),.28,g0,g1);}
for(let j=0;j<8;j++)frond(top,j/8*6.28+sd+.3,-.55,-2.05,1.7*(h/5),.13,b0,b1);
if(rand()<.75){const m=new T.Matrix4();for(const [bx2,bz2] of [[.16,.05],[-.13,-.14]])for(let d=0;d<16;d++){const a=range(0,6.28),rr=range(.04,.24);m.makeTranslation(top.x+bx2+Math.cos(a)*rr,top.y-range(.15,.62),top.z+bz2+Math.sin(a)*rr);addGeo(new T.SphereGeometry(.078,5,4),m,rand()<.3?'#d8902e':'#c8781e');}}}
/* the grove: dense date palms around the heart of the oasis */
let placed=0,guard=0;
while(placed<68&&guard++<400){const a=range(0,6.28),r=6+Math.pow(rand(),.7)*38,x=GROVE.x+Math.sin(a)*r,z=GROVE.z+Math.cos(a)*r;
if(Math.hypot(x-SPRING.x,z-SPRING.z)<9.5)continue;
palm(x,z,range(4.8,7.6),range(0,6.28),range(.05,.18),range(0,6.28));placed++;}
/* a few along the path north toward Shali and by the lake shore */
for(const [x,z] of [[-8,66],[-4,92],[6,88],[-30,-18],[-42,-4],[44,-8],[52,10],[-58,32],[40,70],[58,42],[70,24],[24,-30],
[-19,-60],[-23,-56],[-15,-65],[-21,-68],[61,87],[67,93],[57,96],[-71,-27],[-66,-33],[-76,-23],[31,-53],[35,-57],[46,62],[50,58],[-88,44],[-84,50],[118,58],[124,64]]){
palm(x+range(-2,2),z+range(-2,2),range(4.6,6.6),range(0,6.28),range(.06,.16),range(0,6.28));}
/* two landmark leaners over the spring */
palm(22,35,6.4,Math.atan2(40-35,28-22),.24,3.3);
palm(34,46,5.8,Math.atan2(40-46,28-34)+.4,.2,1.7);
const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(new Float32Array(P),3));pg.setAttribute('color',new T.BufferAttribute(new Float32Array(Cc),3));pg.setIndex(I);pg.computeVertexNormals();
const pm=new T.MeshStandardMaterial({vertexColors:true,roughness:.91,side:T.DoubleSide});
var palmTime={value:0};pm.onBeforeCompile=sh=>{sh.uniforms.palmTime=palmTime;sh.fragmentShader=sh.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nfloat cameraFade=smoothstep(2.5,4.7,length(vViewPosition));float screenPattern=fract(dot(floor(gl_FragCoord.xy),vec2(.75487766,.56984029)));if(screenPattern>cameraFade)discard;');sh.vertexShader='uniform float palmTime;\nvarying float vLeafHash;\n'+sh.vertexShader;sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat swayWeight=smoothstep(1.0,7.5,position.y);transformed.x+=sin(palmTime*.48+position.z*.21)*swayWeight*.065;transformed.z+=cos(palmTime*.38+position.x*.19)*swayWeight*.045;vLeafHash=fract(sin(dot(floor(position.xz*2.3)+floor(position.y*3.1),vec2(12.9898,78.233)))*43758.5453);');sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float palmTime;\nvarying float vLeafHash;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=1.+.055*sin(palmTime*1.7+vLeafHash*6.283);');};
const palms=new T.Mesh(pg,pm);palms.castShadow=true;scene.add(palms);}

/* ---------- Olive rows between grove and lake ---------- */
{const trunkGeo=new T.CylinderGeometry(.14,.22,1.4,7);
const blobGeo=new T.IcosahedronGeometry(1,1);
{const sp=blobGeo.attributes.position;for(let i=0;i<sp.count;i++){const px=sp.getX(i),py=sp.getY(i),pz=sp.getZ(i);const j=.8+.35*Math.sin(px*17+py*23+pz*19);sp.setXYZ(i,px*j,py*j*.72,pz*j);}blobGeo.computeVertexNormals();}
for(let gx=0;gx<5;gx++)for(let gz=0;gz<5;gz++){
if(rand()<.18)continue;
const x=-52+gx*7.5+range(-1.2,1.2),z=38+gz*7.5+range(-1.2,1.2),y=terrain(x,z);
const lean=range(0,6.28);
stamp('otrun',trunkGeo,'#6e5238',v(x,y+.6,z),v(1,range(.8,1.15),1),new T.Quaternion().setFromEuler(new T.Euler(Math.cos(lean)*.14,range(0,6),Math.sin(lean)*.14)));
const s=range(1.3,2.1);
stamp('ocan',blobGeo,rand()<.5?'#7d8a58':'#8a9660',v(x+Math.cos(lean)*.3,y+1.55,z+Math.sin(lean)*.3),v(s,s*.72,s),new T.Quaternion().setFromEuler(new T.Euler(0,range(0,6),0)));
if(rand()<.6)stamp('ocan',blobGeo,'#748150',v(x-Math.cos(lean)*.5,y+1.2,z-Math.sin(lean)*.4),v(s*.6,s*.45,s*.6),new T.Quaternion().setFromEuler(new T.Euler(0,range(0,6),0)));}}

/* ---------- Shali: the mud-and-salt fortress on its hill ---------- */
const shaliBase=terrain(SHALI.x,SHALI.z);
const lanterns=[];const cameraSolids=[];const shaliGlows=[];
{const mudA='#b59a6e',mudB='#a3854f',mudC='#8f7346';
const mc=document.createElement('canvas');mc.width=mc.height=256;const mx=mc.getContext('2d'),mi=mx.createImageData(256,256);
for(let yy=0;yy<256;yy++)for(let xx=0;xx<256;xx++){const i=(yy*256+xx)*4,j=190+Math.random()*50-((yy%16<1&&Math.random()<.8)?28:0)-((xx%24===Math.floor(yy/16)%2*12)?12:0);mi.data[i]=mi.data[i+1]=mi.data[i+2]=j;mi.data[i+3]=255;}mx.putImageData(mi,0,0);const mudTex=new T.CanvasTexture(mc);mudTex.wrapS=mudTex.wrapT=T.RepeatWrapping;mudTex.repeat.set(2,2);
const windowCuts=[],windowNormals=[];
const mudMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.98,bumpMap:mudTex,bumpScale:.001});
mudMat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 wallPos;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nwallPos=(modelMatrix*vec4(transformed,1.)).xyz;');sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 wallPos;').replace('#include <color_fragment>','#include <color_fragment>\n\nfloat erosion=sin(wallPos.x*11.+sin(wallPos.y*13.))*sin(wallPos.z*15.+wallPos.y*9.);float weather=sin(wallPos.x*.8+wallPos.y*1.9)*sin(wallPos.z*1.2);float wornY=wallPos.y+sin(wallPos.x*1.7+wallPos.z*.8)*.065+sin(wallPos.z*3.1)*.025;float course=smoothstep(.40,.5,abs(fract(wornY*1.9)-.5))*(.35+.65*smoothstep(-.6,.6,weather));float brickX=wallPos.x+wallPos.z+mod(floor(wallPos.y*1.9),2.)*.53;float joint=smoothstep(.44,.5,abs(fract(brickX*.85)-.5));float fleck=pow(max(0.,erosion),8.);float brickValue=fract(sin(dot(vec2(floor(brickX*.85),floor(wallPos.y*1.9)),vec2(13.13,71.79)))*43758.54);float plaster=smoothstep(-.28,.12,sin(wallPos.x*.43+wallPos.y*.37+sin(wallPos.z*.91))*cos(wallPos.z*.29-wallPos.y*.81+sin(wallPos.x*.72)));diffuseColor.rgb*=(.92+brickValue*.08+erosion*.003+weather*.05)*(1.-course*.065*(1.-plaster*.95)-joint*.025*(1.-plaster*.95));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.52,.40,.25),plaster*.26);diffuseColor.rgb+=vec3(.009,.007,.004)*fleck;');};
const apertures=[];
const wallParts=[];
/* Mud-brick coursing, salt-darkened base, pale crumbled crown. */
function mudPaint(g,h){paint(g,(q,c)=>{c.set(mudA);const t=q.y/h+.5;c.lerp(new T.Color('#7c6440'),(1-t)*.21);if(t>.84)c.lerp(new T.Color('#d8c49c'),(t-.84)*1.2);});}
function kershef(x,z,w,h,d,ry,tilt){
 if(z>SHALI.z-10&&Math.abs(x-SHALI.x)<3.2)x=SHALI.x+(x<SHALI.x?-1:1)*(4.6+w*.45);
 colliders.push({x,z,r:Math.min(w,d)*.46});
 const baseY=Math.min(terrain(x,z),terrain(x+w*.4,z+d*.4),terrain(x-w*.4,z-d*.4));
 const g=new T.BoxGeometry(w,h,d,2,3,2);const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),pz=p.getZ(i);
  const melt=(py/h+.5);const j=1+.012*Math.sin(py*.65+x)-melt*.08;  // walls narrow and slump toward the top
  p.setXYZ(i,px*j*(1-.14*melt*melt),py,pz*j*(1-.12*melt*melt));}
 g.computeVertexNormals();
 mudPaint(g,h);
 const transform=M4(x,baseY+h/2-.55,z,1,1,1,tilt||0,ry,0);wallParts.push({geo:g,m:transform,c:null});
for(const side of [-1,1])for(let yy=.9;yy<h-.55;yy+=1.35){const point=v((rand()-.5)*w*.45,yy-h/2,d*.501*side).applyMatrix4(transform);apertures.push({point,rot:ry+(side<0?Math.PI:0),lit:rand()<.2,south:Math.cos(ry+(side<0?Math.PI:0))>.5});}
// Projecting palm-wood roof ends and broad worn plinth, all in the same building frame.
if(h>2.8){for(let beam=0;beam<3;beam++){const local=v((beam-1)*w*.27,h*.48,d*.53).applyMatrix4(transform);wallParts.push({geo:new T.CylinderGeometry(.065,.09,d*.2,7),m:M4(local.x,local.y,local.z,1,1,1,Math.PI/2,ry,0),c:'#574431'});}}
wallParts.push({geo:new T.BoxGeometry(w*1.1,.55,d*1.07),m:M4(x,baseY-.3,z,1,1,1,0,ry,0),c:mudC});
// A parapet and two small worn corner piers add a stepped silhouette.
if(h>2.5){wallParts.push({geo:new T.BoxGeometry(w*.88,.24,.24),m:M4(x,baseY+h-.16-.55,z+d*.4,1,1,1,0,ry,0),c:mudB});}
}
const shaliGroup=new T.Group();
// Side walls bound the courtyard but leave an honest 5m lane through the gate.
for(let z=SHALI.z-8;z<=SHALI.z+15;z+=2.5)for(const side of [-1,1])colliders.push({x:SHALI.x+side*4.4,z,r:1.3});
for(let x=-13;x<=13;x+=2.5)colliders.push({x:SHALI.x+x,z:SHALI.z-12,r:1.6});
/* terraced kershef houses, taller toward the summit, each seated on its own ground */
const ringTown=(n,r0,r1,h0,h1)=>{for(let i=0;i<n;i++){const a=rand()*6.28,r=range(r0,r1);
const x=SHALI.x+Math.sin(a)*r,z=SHALI.z+Math.cos(a)*r*.94;
kershef(x,z,range(2,4.2),range(h0,h1),range(2,3.8),rand()*3.14,range(-.05,.05));}};
ringTown(20,10.2,13.6,2.4,4.2);ringTown(16,6,10,3.2,5.8);ringTown(12,2.6,6,4.4,6.8);
/* the keep: three stepped masses crown the hill */
{const kx=SHALI.x-1.5,kz=SHALI.z-15.5,kb=terrain(kx,kz);
for(const [w,h,d,yo] of [[5.4,4.8,5.2,0],[4.1,3.6,3.9,4.5],[2.9,3.2,2.7,7.8]]){
 const g=new T.BoxGeometry(w,h,d,2,3,2);const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),pz=p.getZ(i);const melt=(py/h+.5);const j=1+.05*Math.sin(px*6+py*4)*(1-melt*.4)-melt*.06;p.setXYZ(i,px*j*(1-.1*melt*melt),py,pz*j*(1-.09*melt*melt));}
 g.computeVertexNormals();mudPaint(g,h);
 wallParts.push({geo:g,m:M4(kx,kb+yo+h/2-.4,kz,1,1,1,.02,.3,0),c:null});
 // crenellated parapet
 const topY=kb+yo+h-.4;
 for(let cx2=0;cx2<Math.floor(w/.7);cx2++)for(const zz of [-d/2+.2,d/2-.2])wallParts.push({geo:new T.BoxGeometry(.4,.42,.3),m:M4(kx-w/2+.5+cx2*.7,topY+.2,kz+zz,1,1,1,0,.3,0),c:rand()<.5?mudA:mudB});
}
for(let yy=1.2;yy<9.6;yy+=1.5){apertures.push({point:v(kx+.8,kb+yy,kz+2.55),rot:.3,lit:yy>3&&rand()<.75,south:true});apertures.push({point:v(kx+2.72,kb+yy,kz-.4),rot:.3+Math.PI/2,lit:rand()<.3,south:false});}}
/* the old mosque's minaret: a tapered square tower with its little dome */
{const mx2=SHALI.x+4.6,mz2=SHALI.z+1.2,mb=terrain(mx2,mz2);
const g=new T.BoxGeometry(1.5,9.6,1.5,2,7,2);const p=g.attributes.position;
for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),pz=p.getZ(i);const t=py/9.6+.5,j=1-.22*t;p.setXYZ(i,px*j,py,pz*j);}
g.computeVertexNormals();mudPaint(g,9.6);
wallParts.push({geo:g,m:M4(mx2,mb+4.55,mz2,1,1,1,0,.4,.03),c:null});
const dome=new T.SphereGeometry(.85,20,12,0,Math.PI*2,0,Math.PI/2);paint(dome,(q,c)=>c.set('#c9b28a'));
wallParts.push({geo:dome,m:M4(mx2+.06,mb+9.08,mz2,1,.8,1,0,0,0),c:null});
apertures.push({point:v(mx2-.5,mb+7.4,mz2+.62),rot:.4,lit:true,south:true});apertures.push({point:v(mx2+.62,mb+6.2,mz2-.5),rot:.4+Math.PI/2,lit:true,south:false});}
/* crumbling enceinte: a ring of wall stubs and round towers at the plateau edge */
for(let i=0;i<22;i++){const a=i/22*Math.PI*2;if(i%5===2||i===0)continue;               // collapsed gaps
 const r=15.1+Math.sin(i*3.7)*.5,x=SHALI.x+Math.sin(a)*r,z=SHALI.z+Math.cos(a)*r*.95,by=terrain(x,z);
 const w=range(3.2,4.6),h=range(2,3.1);colliders.push({x,z,r:w*.34});
 const g=new T.BoxGeometry(w,h,1.1,2,3,1);const p=g.attributes.position;
 for(let k=0;k<p.count;k++){const px=p.getX(k),py=p.getY(k);const melt=py/h+.5;p.setX(k,px*(1+.08*Math.sin(px*5+py*6)-melt*.12));}
 g.computeVertexNormals();mudPaint(g,h);
 wallParts.push({geo:g,m:M4(x,by+h/2-.5,z,1,1,1,range(-.04,.04),a,range(-.03,.03)),c:null});
 if(i%4===0){const th=h+range(.8,2.8);const tg=new T.CylinderGeometry(1.05,1.45,th,9);paint(tg,(q,c)=>{c.set(rand()<.5?mudA:mudB);if(q.y>h*.4)c.lerp(new T.Color(mudC),.5);});
 wallParts.push({geo:tg,m:M4(x,by+th/2-.5,z,1,1,1,0,0,range(-.04,.04)),c:null});
 for(let cx3=0;cx3<6;cx3++){if(cx3%3!==0)continue;const ca=cx3/6*Math.PI*2;wallParts.push({geo:new T.BoxGeometry(.38,.44,.34),m:M4(x+Math.sin(ca)*.95,by+th-.28,z+Math.cos(ca)*.95,1,1,1,0,ca,0),c:cx3%2?mudA:mudB});}}
 // crenellated south parapets readable from the approach slope
 if(false){const top2=by+h-.5;for(let cx3=0;cx3<Math.floor(w/.75);cx3++)wallParts.push({geo:new T.BoxGeometry(.42,.5,.4),m:M4(x+(-w/2+.45+cx3*.75)*Math.cos(a)+.42*Math.sin(a),top2+.22,z-(-w/2+.45+cx3*.75)*Math.sin(a)+.42*Math.cos(a),1,1,1,0,a,0),c:cx3%2?mudB:mudA});}}
/* twin watchtowers rise over the south rim, flanking the gate approach */
for(const s of [-1,1]){const tx=SHALI.x+s*5.8,tz=SHALI.z+12.6,tb=terrain(tx,tz),th=8.0+s*.8;
 colliders.push({x:tx,z:tz,r:1.15});
 const g=new T.BoxGeometry(2.3,th,2.1,2,5,2);const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),pz=p.getZ(i);const melt=py/th+.5;const wear=Math.max(0,melt-.65)*(.9+.45*Math.sin(px*2+pz*3+s));p.setXYZ(i,px*(1-melt*.18)+Math.sin(py*1.7)*.04,py-wear,pz*(1-melt*.16));}
 g.computeVertexNormals();mudPaint(g,th);
 wallParts.push({geo:g,m:M4(tx,tb+th/2-.4,tz,1,1,1,s*.02,s*.24,0),c:null});
 for(let cx3=0;cx3<0;cx3++){wallParts.push({geo:new T.BoxGeometry(.44,.5,.36),m:M4(tx+(-1+cx3*.62)*Math.cos(s*.24)+Math.sin(s*.24),tb+th-.15,tz-(-1+cx3*.62)*Math.sin(s*.24)+Math.cos(s*.24),1,1,1,0,s*.24,0),c:cx3%2?mudA:mudB});wallParts.push({geo:new T.BoxGeometry(.44,.5,.36),m:M4(tx+(-1+cx3*.62)*Math.cos(s*.24)-Math.sin(s*.24),tb+th-.15,tz-(-1+cx3*.62)*Math.sin(s*.24)-Math.cos(s*.24),1,1,1,0,s*.24,0),c:cx3%2?mudB:mudA});}
 // Eroded projecting courses catch the low western light.
 for(let row=0;row<Math.floor((th-1.1)/.58);row++){if(row%3!==1)continue;
  const y=tb+.18+row*.58,t=(y-tb)/th;
  wallParts.push({geo:new T.BoxGeometry(2.3*(1-t*.1),.045,.085),m:M4(tx,y,tz+1.05*(1-t*.09),1,1,1,0,s*.24,0),c:row%3?'#9a7f55':'#c0a779'});
 }
 apertures.push({point:v(tx-s*.3,tb+th-2.1,tz+1.07),rot:s*.24,lit:true,south:true});
 apertures.push({point:v(tx+s*.4,tb+th-3.6,tz+1.06),rot:s*.24,lit:rand()<.5,south:true});}
/* two tall houses on the crest itself, dead center over the gate approach */
kershef(SHALI.x-4.0,SHALI.z+9.2,3.1,6.4,3.0,.2,.02);
kershef(SHALI.x+4.0,SHALI.z+8.6,2.8,5.6,2.7,-.18,-.02);
/* rubble slumped at the foot of the walls */
for(let i=0;i<30;i++){const a=rand()*6.28,r=range(12.5,17.5),x=SHALI.x+Math.sin(a)*r,z=SHALI.z+Math.cos(a)*r*.95;
if(Math.abs(x-SHALI.x)<3.0&&z>SHALI.z-3)continue;stamp('rubble',rockGeo,i%3?'#9a7f52':'#84693f',v(x,terrain(x,z)+.06,z),v(range(.5,1.5),range(.2,.5),range(.5,1.4)),new T.Quaternion().setFromEuler(new T.Euler(range(-.2,.2),rand()*6.28,range(-.2,.2))));}
/* Seat decorative caps and crown blocks on a real supporting surface. */
{const supportMaterial=new T.MeshBasicMaterial({side:T.DoubleSide});const meshes=wallParts.map(part=>{const m=new T.Mesh(part.geo,supportMaterial);m.matrix.copy(part.m);m.matrixAutoUpdate=false;m.updateMatrixWorld(true);return m;});const ray=new T.Raycaster();let checked=0,seated=0,removed=0;
for(let i=wallParts.length-1;i>=0;i--){const part=wallParts[i],params=part.geo.parameters||{};const isCap=part.geo.type==='SphereGeometry'&&params.radius===.85;const isCrown=part.geo.type==='BoxGeometry'&&params.height>=.2&&params.height<=.55&&part.m.elements[13]>shaliBase+1;if(!isCap&&!isCrown)continue;checked++;const box=new T.Box3().setFromObject(meshes[i]),centre=box.getCenter(v(0,0,0));ray.set(v(centre.x,box.min.y+.04,centre.z),v(0,-1,0));ray.far=1.2;const hits=ray.intersectObjects(meshes.filter((_,j)=>i!==j),false);if(hits.length){const gap=box.min.y-hits[0].point.y;if(gap>.015){part.m.elements[13]-=gap+.035;seated++;}}else if(isCrown){wallParts.splice(i,1);removed++;}}
shaliGroup.userData.capChecks={checked,seated,removed};}
const shaliMesh=new T.Mesh(mergeParts(wallParts),mudMat);shaliMesh.castShadow=shaliMesh.receiveShadow=true;shaliGroup.add(shaliMesh);cameraSolids.push(shaliMesh);
/* Attach every opening to actual deformed wall pixels with a surface ray. */
const anchorRay=new T.Raycaster();shaliMesh.updateMatrixWorld(true);apertures.sort((a,b)=>Math.hypot(a.point.x,a.point.z+102)-Math.hypot(b.point.x,b.point.z+102));
for(const ap of apertures){const n=v(Math.sin(ap.rot),0,Math.cos(ap.rot));anchorRay.set(ap.point.clone().addScaledVector(n,3.5),n.clone().negate());anchorRay.far=5.0;const hits=anchorRay.intersectObject(shaliMesh,false);if(!hits.length)continue;
const hit=hits[0];if(Math.abs(hit.face.normal.y)>.25||windowCuts.length>=48)continue;
const point=hit.point.clone(),normal=hit.face.normal.clone();normal.y=0;normal.normalize();
if(windowCuts.some(p=>Math.hypot(p.x-point.x,p.y-point.y,p.z-point.z)<1.65))continue;
// Reject edge/corner openings unless their whole rim lands on masonry.
let supported=true;for(const [sx,sy]of [[-.24,0],[.24,0],[0,-.33],[0,.33]]){const origin=point.clone().addScaledVector(normal,.12);origin.x+=normal.z*sx;origin.z-=normal.x*sx;origin.y+=sy;anchorRay.set(origin,normal.clone().negate());anchorRay.far=.3;if(!anchorRay.intersectObject(shaliMesh,false).length){supported=false;break;}}if(!supported||point.y<meshHeight(point.x,point.z)+.55)continue;
const rot=Math.atan2(normal.x,normal.z);windowCuts.push(new T.Vector4(point.x,point.y,point.z,1));windowNormals.push(normal);
const well=new T.Group();well.position.copy(point);well.rotation.y=rot;
const inner=mat(ap.lit?'#a58a64':'#786044',1);
const back=new T.Mesh(new T.PlaneGeometry(.34,.5),new T.MeshBasicMaterial({color:ap.lit?'#b9813e':'#201a14'}));back.position.z=-.26;well.add(back);
for(const side of [-1,1]){const reveal=new T.Mesh(new T.BoxGeometry(.025,.50,.27),inner);reveal.position.set(side*.177,0,-.135);well.add(reveal);}
for(const side of [-1,1]){const reveal=new T.Mesh(new T.BoxGeometry(.36,.025,.27),inner);reveal.position.set(0,side*.255,-.135);well.add(reveal);}
const lintel=new T.Mesh(new T.BoxGeometry(.43,.065,.09),mat('#8d7656'));lintel.position.set(0,.288,-.015);lintel.castShadow=true;well.add(lintel);shaliGroup.add(well);}
/* Subtract each recessed opening from the actual triangle soup. Every generated
   vertex carries interpolated normal, color and UV, so all passes and raycasts
   share exactly the same masonry edge. */
{let g=shaliMesh.geometry;let triangles=[];const attrs=['position','normal','color','uv'];
for(let i=0;i<g.attributes.position.count;i+=3){const t=[];for(let j=0;j<3;j++){const q=[];for(const name of attrs){const a=g.attributes[name];for(let k=0;k<a.itemSize;k++)q.push(a.array[(i+j)*a.itemSize+k]);}t.push(q);}triangles.push(t);}
for(let wi=0;wi<windowCuts.length;wi++){const c=windowCuts[wi],n=windowNormals[wi],tx=n.z,tz=-n.x;
const planes=[[tx,0,tz,tx*c.x+tz*c.z+.17],[-tx,0,-tz,-tx*c.x-tz*c.z+.17],[0,1,0,c.y+.25],[0,-1,0,-c.y+.25],[n.x,0,n.z,n.x*c.x+n.z*c.z+.14],[-n.x,0,-n.z,-n.x*c.x-n.z*c.z+.30]];
const output=[];
for(const tri of triangles){if([0,1,2].some(axis=>Math.min(...tri.map(q=>q[axis]))>c.getComponent(axis)+.65||Math.max(...tri.map(q=>q[axis]))<c.getComponent(axis)-.65)){output.push(tri);continue;}let inside=tri;for(const plane of planes){if(inside.length<3)break;const inn=[],out=[];for(let j=0;j<inside.length;j++){const a=inside[j],b=inside[(j+1)%inside.length];const da=a[0]*plane[0]+a[1]*plane[1]+a[2]*plane[2]-plane[3],db=b[0]*plane[0]+b[1]*plane[1]+b[2]*plane[2]-plane[3];(da<=0?inn:out).push(a);if((da<=0)!==(db<=0)){const f=da/(da-db),q=a.map((x,k)=>x+(b[k]-x)*f);inn.push(q);out.push(q);}}
for(let j=1;j<out.length-1;j++)output.push([out[0],out[j],out[j+1]]);inside=inn;}}triangles=output;}
const arrays=attrs.map(()=>[]);for(const tri of triangles)for(const q of tri){let off=0;attrs.forEach((name,i)=>{const size=g.attributes[name].itemSize;arrays[i].push(...q.slice(off,off+size));off+=size;});}
const carved=new T.BufferGeometry();attrs.forEach((name,i)=>carved.setAttribute(name,new T.Float32BufferAttribute(arrays[i],g.attributes[name].itemSize)));carved.computeBoundingSphere();shaliMesh.geometry=carved;g.dispose();shaliMesh.userData.realWindowCount=windowCuts.length;
const probe=new T.Raycaster();let clear=0,rim=0;for(let i=0;i<windowCuts.length;i++){const c=windowCuts[i],n=windowNormals[i],origin=v(c.x,c.y,c.z).addScaledVector(n,.12);probe.set(origin,n.clone().negate());probe.far=.25;if(!probe.intersectObject(shaliMesh,false).length)clear++;origin.x+=n.z*.24;origin.z-=n.x*.24;probe.set(origin,n.clone().negate());if(probe.intersectObject(shaliMesh,false).length)rim++;}shaliMesh.userData.openingRayChecks={count:windowCuts.length,clear,rim};}
/* gate arch at the south foot of the hill, flanked by broken walls and lit for the evening */
{const stone=new T.MeshStandardMaterial({color:'#bba075',roughness:1,bumpMap:mudTex,bumpScale:.035});
const gate=new T.Group();
const p1=new T.Mesh(new T.BoxGeometry(1.35,5.2,1.35),stone);p1.position.set(-2.1,.6,0);
const p2=p1.clone();p2.position.x=2.1;
for(const m of [p1,p2]){m.castShadow=m.receiveShadow=true;gate.add(m);cameraSolids.push(m);}
const archR=1.65;
for(let k=0;k<11;k++){const angle=(k+.5)/11*Math.PI;const g=new T.BoxGeometry(.66,.55,1.6,2,2,2);const p=g.attributes.position;
for(let i=0;i<p.count;i++){const xx=p.getX(i),yy=p.getY(i),zz=p.getZ(i);p.setXYZ(i,xx+Math.sin(xx*21+yy*19+zz*7+k)*.035,yy,zz+Math.sin(yy*17+k)*.025);}g.computeVertexNormals();mudPaint(g,.55);
const block=new T.Mesh(g,mudMat);block.position.set(Math.cos(angle)*archR,2.05+Math.sin(angle)*archR,0);block.rotation.z=angle-Math.PI/2;block.castShadow=block.receiveShadow=true;gate.add(block);cameraSolids.push(block);}
/* Recessed mud-brick returns make the opening feel thick, not a painted hole. */
for(const side of [-1,1]){const ret=new T.Mesh(new T.BoxGeometry(.45,4.2,2.0),stone);ret.position.set(side*1.62,.35,-.75);ret.castShadow=ret.receiveShadow=true;gate.add(ret);cameraSolids.push(ret);}
for(let row=0;row<8;row++)for(const side of [-1,1]){const course=new T.Mesh(new T.BoxGeometry(1.32,.045,.075),mat(row%3?'#a38b61':'#c1aa82'));course.position.set(side*2.1,-1.9+row*.62,.70);course.castShadow=true;gate.add(course);}
const gy=terrain(SHALI.x,SHALI.z+18);
gate.position.set(SHALI.x,gy+1.8,SHALI.z+18);gate.rotation.y=.1;shaliGroup.add(gate);
/* two lantern posts at the gate */
for(const s of [-1,1]){const lp=new T.Mesh(new T.CylinderGeometry(.05,.07,2.4,6),mat('#5f4026',1));lp.position.set(SHALI.x+s*3.1,gy+1.2,SHALI.z+19.2);lp.castShadow=true;shaliGroup.add(lp);
const lamp=new T.Mesh(new T.SphereGeometry(.16,10,8),new T.MeshStandardMaterial({color:'#e8a850',emissive:'#d98c30',emissiveIntensity:.9,roughness:.6}));lamp.position.set(SHALI.x+s*3.1,gy+2.5,SHALI.z+19.2);shaliGroup.add(lamp);lanterns.push(lamp);
const glow=new T.Sprite(new T.SpriteMaterial({map:radTex(.85,.35),color:'#ffbf6a',transparent:true,opacity:.5,blending:T.AdditiveBlending,depthWrite:false}));glow.scale.set(.95,.95,1);glow.position.copy(lamp.position);shaliGroup.add(glow);shaliGlows.push(glow);}}
/* Courtyard life: objects sit on the same sampled ground as the walker. */
{const jarMat=mat('#99704c'),darkMat=mat('#3c3021');
for(const [x,z,scale]of[[-1.10,-106,.75],[1.2,-110,.85]]){const g=new T.LatheGeometry([new T.Vector2(.12,0),new T.Vector2(.27,.09),new T.Vector2(.33,.38),new T.Vector2(.25,.64),new T.Vector2(.14,.72),new T.Vector2(.14,.81)],20);const jar=new T.Mesh(g,jarMat);jar.position.set(x,meshHeight(x,z),z);jar.scale.setScalar(scale);jar.castShadow=jar.receiveShadow=true;scene.add(jar);const mouth=new T.Mesh(new T.CircleGeometry(.135,16),darkMat);mouth.rotation.x=-Math.PI/2;mouth.position.set(x,jar.position.y+.805*scale,z);mouth.scale.setScalar(scale);scene.add(mouth);}
for(const [x,z]of[[-.9,-101],[.95,-108]]){const rug=new T.Mesh(new T.PlaneGeometry(1.1,1.7,8,10),mat('#9c7956'));rug.rotation.x=-Math.PI/2;rug.position.set(x,meshHeight(x,z)+.035,z);rug.receiveShadow=true;scene.add(rug);for(let stripe=0;stripe<5;stripe++){const line=new T.Mesh(new T.PlaneGeometry(1.06,.045),mat(stripe%2?'#aa9470':'#715d42'));line.rotation.x=-Math.PI/2;line.position.set(x,rug.position.y+.005,z-.65+stripe*.32);scene.add(line);}}
for(let i=0;i<64;i++){const z=-94-rand()*17,x=(i%2?1:-1)*range(1.25,2.7),y=meshHeight(x,z);stamp('courtPebble',rockGeo,'#b09a76',v(x,y+.015,z),v(range(.04,.13),range(.025,.07),range(.05,.15)),new T.Quaternion());}
for(let i=0;i<20;i++){const z=-95-i*.53,x=Math.sin(i*.7)*.12+(i%2?.12:-.12);const print=new T.Mesh(new T.CircleGeometry(.075,10),new T.MeshBasicMaterial({color:'#65513a',transparent:true,opacity:.22,depthWrite:false}));print.rotation.x=-Math.PI/2;print.scale.y=1.8;print.position.set(x,meshHeight(x,z)+.016,z);scene.add(print);}}
/* summit flag */
const pole=new T.Mesh(new T.CylinderGeometry(.04,.055,4.6,7),mat('#5f4026',1));pole.position.set(SHALI.x-2,shaliBase+2.3,SHALI.z+3);pole.castShadow=true;shaliGroup.add(pole);
const bannerCloth=new T.Mesh(new T.PlaneGeometry(1.4,.5,8,2),new T.MeshStandardMaterial({color:'#a33b2a',roughness:.85,side:T.DoubleSide}));
bannerCloth.position.set(SHALI.x-2+.72,shaliBase+4.25,SHALI.z+3);bannerCloth.castShadow=true;shaliGroup.add(bannerCloth);
scene.add(shaliGroup);
var shaliFlag=bannerCloth;}

/* ---------- The Oracle temple of Amun on Aghurmi hill ---------- */
const oracleBase=terrain(ORACLE.x,ORACLE.z);
{const sand1='#cfb287',sand2='#b89a6a';
const stone=mat(sand1,.88),stoneD=mat(sand2,.94);
const tem=new T.Group();
/* two-course platform */
for(const [w,h,d,y] of [[15,1,10.5,.5],[12.6,.9,8.6,1.4]]){
 const b=new T.Mesh(new T.BoxGeometry(w,h,d),y<1?stoneD:stone);b.position.set(0,y,0);b.castShadow=b.receiveShadow=true;tem.add(b);}
/* Eroded sanctuary: tall piers at the entry, thick masonry returns and a roofless cell. */
const blockMat=new T.MeshStandardMaterial({vertexColors:true,color:'#ffffff',roughness:.98});
const masonryParts=[];
function courseWall(x,z,length,height,alongX=true,door=false){
for(let row=0;row<Math.floor(height/.46);row++)for(let col=0;col<Math.ceil(length/.95);col++){
const offset=(col+.5)*.95-length/2+(row%2)*.12;if(door&&Math.abs(offset)<.86&&row<6)continue;
const brokenTop=row>height/.46-2&&Math.sin(col*7+row*3+x)>0.4;if(brokenTop)continue;
const g=new T.BoxGeometry(.92,.44,.74,2,2,2),pp=g.attributes.position;
for(let i=0;i<pp.count;i++){const xx=pp.getX(i),yy=pp.getY(i),zz=pp.getZ(i),j=Math.sin(xx*33+yy*19+zz*27+col)*.025;pp.setXYZ(i,xx+j,yy+j*.5,zz+j);}g.computeVertexNormals();
const c=new T.Color('#bda57e');c.multiplyScalar(.86+rand()*.24);masonryParts.push({geo:g,m:M4(x+(alongX?offset:0),2.05+row*.46,z+(alongX?0:offset),1,1,1,0,alongX?0:Math.PI/2,0),c});
}}
courseWall(0,-3.4,10,4.5,true);courseWall(-4.5,0,6.8,3.7,false);courseWall(4.5,0,6.8,4.1,false);courseWall(0,3.4,10,4.7,true,true);
const masonry=new T.Mesh(mergeParts(masonryParts),blockMat);masonry.castShadow=masonry.receiveShadow=true;tem.add(masonry);
const lintel=new T.Mesh(new T.BoxGeometry(2.6,.54,.98),stoneD);lintel.position.set(0,5.02,3.4);lintel.castShadow=lintel.receiveShadow=true;tem.add(lintel);
// Interior altar is deliberately plain, with no invented hieroglyphic text.
const altar=new T.Mesh(new T.BoxGeometry(1.8,.85,1.25),stone);altar.position.set(.8,2.65,-.6);altar.castShadow=altar.receiveShadow=true;tem.add(altar);
/* fallen drums and scattered blocks */
for(let i=0;i<7;i++){const a=range(0,6.28),r=range(4.5,8);
 const dr=new T.Mesh(new T.CylinderGeometry(.36,.36,range(.5,1.1),9),i%2?stone:stoneD);
 dr.position.set(Math.sin(a)*r,2.1,Math.cos(a)*r);dr.rotation.set(Math.PI/2,0,range(0,3));dr.castShadow=dr.receiveShadow=true;tem.add(dr);}
tem.position.set(ORACLE.x,oracleBase-.2,ORACLE.z);tem.rotation.y=-.5;scene.add(tem);tem.traverse(o=>{if(o.isMesh)cameraSolids.push(o);});}

/* ---------- Path stones to Shali's gate ---------- */
{const stGeo=new T.CylinderGeometry(.5,.55,.14,8);
for(let i=0;i<26;i++){const t=i/25;
const x=GROVE.x-6+(SHALI.x-(GROVE.x-6))*t+Math.sin(t*9)*3.2,z=GROVE.z-6+(SHALI.z+26-(GROVE.z-6))*t+Math.cos(t*7)*2.4;
stamp('path',stGeo,i%2?'#cbb086':'#b89a6a',v(x,meshHeight(x,z)-.08,z),v(range(.8,1.3),1,range(.8,1.2)),new T.Quaternion().setFromUnitVectors(v(0,1,0),v(-(meshHeight(x+.3,z)-meshHeight(x-.3,z))/.6,1,-(meshHeight(x,z+.3)-meshHeight(x,z-.3))/.6).normalize()).multiply(new T.Quaternion().setFromEuler(new T.Euler(0,range(0,3),0))));}}

/* Thin wind-blown path margins make the connections legible without signs. */
{const pebbles=new T.IcosahedronGeometry(.13,1);const routes=[[[15,25],[-30,12]],[[-8,10],[0,-88]],[[0,-88],[85,-47]],[[85,-47],[116,96]]];
for(const [A,B]of routes)for(let k=0;k<60;k++){const t=k/59,dx=B[0]-A[0],dz=B[1]-A[1],len=Math.hypot(dx,dz),side=k%2?1:-1;
const x=A[0]+dx*t+dz/len*(2.1+rand()*.8)*side,z=A[1]+dz*t-dx/len*(2.1+rand()*.8)*side;
if(Math.hypot(x-LAKE.x,z-LAKE.z)<62)continue;const h=meshHeight(x,z);stamp('routePebbles',pebbles,k%4?'#b7a17d':'#8d795b',v(x,h-.01,z),v(range(.5,1.6),range(.25,.65),range(.7,1.9)),new T.Quaternion().setFromEuler(new T.Euler(0,rand()*6.28,0)));}}

/* ---------- Dune crest viewpoint: a half-buried pillar ---------- */
{const px=105,pz=105,py=terrain(px,pz);
const pil=new T.Mesh(new T.CylinderGeometry(.5,.62,3.6,9),mat('#c8a878',.9));
pil.position.set(px,py+1,pz);pil.rotation.z=.22;pil.castShadow=pil.receiveShadow=true;scene.add(pil);
const drum=new T.Mesh(new T.CylinderGeometry(.52,.52,.9,9),mat('#b89a6a',.94));
drum.position.set(px+2.2,py+.4,pz+1);drum.rotation.set(Math.PI/2,0,.7);drum.castShadow=true;scene.add(drum);}

/* ---------- God-ray shafts in the palm grove ---------- */
const shafts=[];
{const cv=document.createElement('canvas');cv.width=32;cv.height=128;const x=cv.getContext('2d');
const g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'rgba(255,240,210,.85)');g.addColorStop(1,'rgba(255,240,210,0)');
x.fillStyle=g;x.fillRect(0,0,32,128);
const tex=new T.CanvasTexture(cv);
const sunD=skyU.sunDir.value.clone().normalize();
for(let i=0;i<7;i++){const m=new T.Mesh(new T.PlaneGeometry(1.6,10),
 new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.09+rand()*.05,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false}));
const a=rand()*6.28,r=6+rand()*26,px=GROVE.x+Math.sin(a)*r,pz=GROVE.z+Math.cos(a)*r;
m.position.set(px,terrain(px,pz)+4.6,pz);
m.rotation.z=-Math.atan2(sunD.y,Math.hypot(sunD.x,sunD.z))*.9*(sunD.x<0?1:-1);
m.rotation.y=Math.atan2(sunD.x,sunD.z)+Math.PI/2+range(-.3,.3);
m.visible=false;shafts.push(m);}}

/* ---------- Distant mesas east (Gebel Dakrur silhouettes) ---------- */
{const mesaMat=new T.MeshBasicMaterial({color:0xc98d5f,fog:true});
for(const [mx,mz,mw,mh] of [[620,-120,260,42],[700,160,220,34],[-640,380,240,30]]){
 const mesa=new T.Mesh(new T.BoxGeometry(mw,mh,60),mesaMat);
 const p=mesa.geometry.attributes.position;
 for(let i=0;i<p.count;i++){if(p.getY(i)>0)p.setX(i,p.getX(i)*(0.55+0.1*Math.sin(i)));}
 mesa.position.set(mx,mh/2-6,mz);mesa.rotation.y=rand()*.8;scene.add(mesa);}}

/* ---------- Mid-ground landmarks on the long sightlines ---------- */
/* ruined outposts: broken kershef walls far from home */
{const ruinMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.98});
function ruinAt(rx,rz,ry){const parts=[];
for(let s2=0;s2<3;s2++){const len=range(2.2,3.6),h=range(1.2,2.4);
const g=new T.BoxGeometry(len,h,.8,3,2,1);const p=g.attributes.position;
for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i);const melt=py/h+.5;p.setX(i,px*(1+.07*Math.sin(px*6+py*5)) );p.setY(i,py-(px>len*.2?melt*melt*range(.2,.8)*h*.4:0));}
g.computeVertexNormals();paint(g,(q,c)=>{c.set(rand()<.5?'#c2a87c':'#b09468');if(Math.abs(((q.y%.62)/.62)-.5)>.4)c.multiplyScalar(.88);if(q.y<-h*.25)c.lerp(new T.Color('#8a7450'),.3);});
parts.push({geo:g,m:M4(range(-1.5,1.5),h/2-.25,range(-1.5,1.5),1,1,1,range(-.05,.05),range(0,3.14),0),c:null});}
const ruin=new T.Mesh(mergeParts(parts),ruinMat);const by=terrain(rx,rz);
ruin.position.set(rx,by,rz);ruin.rotation.y=ry;ruin.castShadow=ruin.receiveShadow=true;scene.add(ruin);
colliders.push({x:rx,z:rz,r:2.1});cameraSolids.push(ruin);}
ruinAt(-46,-70,.7);ruinAt(54,42,2.1);ruinAt(-30,80,1.2);}
/* a stone well with a trough on the east track */
{const wx=46,wz=64,wy=terrain(wx,wz);
const wellParts=[];
for(let s2=0;s2<14;s2++){const a=s2/14*Math.PI*2;wellParts.push({geo:new T.BoxGeometry(.55,.3,.34),m:M4(wx+Math.sin(a)*.95,wy+.15, wz+Math.cos(a)*.95,1,1,1,0,a,0),c:s2%3?'#c6b99c':'#aa9a7e'});
wellParts.push({geo:new T.BoxGeometry(.55,.3,.34),m:M4(wx+Math.sin(a)*.92,wy+.45,wz+Math.cos(a)*.92,1,1,1,0,a+.11,0),c:s2%2?'#b9a582':'#a8906a'});}
const well=new T.Mesh(mergeParts(wellParts),new T.MeshStandardMaterial({vertexColors:true,roughness:.95}));well.castShadow=well.receiveShadow=true;scene.add(well);cameraSolids.push(well);
for(const s of [-1,1]){const post=new T.Mesh(new T.CylinderGeometry(.05,.06,1.7,6),mat('#5f4026',1));post.position.set(wx+s*.85,wy+.85,wz);post.castShadow=true;scene.add(post);}
const beam=new T.Mesh(new T.CylinderGeometry(.045,.045,2.1,6),mat('#6b5236',1));beam.rotation.z=Math.PI/2;beam.position.set(wx,wy+1.7,wz);beam.castShadow=true;scene.add(beam);
const trough=new T.Mesh(new T.BoxGeometry(1.6,.35,.55),mat('#8a6a4c',.95));trough.position.set(wx+1.8,wy+.18,wz+.5);trough.rotation.y=.4;trough.castShadow=trough.receiveShadow=true;scene.add(trough);
colliders.push({x:wx,z:wz,r:1.5});}
/* larger rock outcrops anchoring the open plain */
for(const [ox,oz,os] of [[70,-20,2.6],[-60,60,3.1],[24,-64,2.2],[-96,66,2.8],[130,40,3.4],[96,130,2.6]]){
const oy=terrain(ox,oz);for(let k=0;k<3;k++){stamp('outcrop',rockGeo,k?'#8a6a4c':'#6e5238',v(ox+range(-2,2)*os*.4,oy+os*.18-k*.3,oz+range(-2,2)*os*.4),v(os*range(.8,1.2),os*range(.5,.7),os*range(.8,1.1)),new T.Quaternion().setFromEuler(new T.Euler(range(0,1),range(0,6),range(0,1))));}
colliders.push({x:ox,z:oz,r:os*1.1});}

/* ---------- A distant circling flock, high and tiny ---------- */
const flock=[];
{const bcv=document.createElement('canvas');bcv.width=64;bcv.height=32;const bx=bcv.getContext('2d');
bx.strokeStyle='rgba(58,42,26,.9)';bx.lineWidth=4;bx.lineCap='round';
bx.beginPath();bx.moveTo(6,26);bx.quadraticCurveTo(20,8,32,20);bx.quadraticCurveTo(44,8,58,26);bx.stroke();
const btex=new T.CanvasTexture(bcv);
for(let i=0;i<9;i++){const sp=new T.Sprite(new T.SpriteMaterial({map:btex,transparent:true,opacity:.6,fog:true,depthWrite:false}));
sp.scale.set(2.4,1.2,1);scene.add(sp);flock.push({sp,ph:range(0,6.28),r:range(55,90),h:range(30,48),sp2:range(.04,.08)*(i%2?1:-1),cx:i<5?-30:60,cz:i<5?-30:40});}}

/* ---------- Creatures ---------- */
const animals=[];
const eyeMat=mat('#241505');
/* Laughing doves (builder from the fleet's Sahara code). */
const doveMat=creatureMat(.85,null,{side:T.DoubleSide,bumpMap:barbBumpTex(),bumpScale:.22,rim:.22});
const D_PINK='#d9a58e',D_BELLY='#eed3b8',D_WING='#8b99b6',D_WINGD='#5a657f',D_TAIL='#9a8472';
function doveBody(perched){const parts=[
{geo:new T.SphereGeometry(1,20,14),m:M4(0,0,0,.30,.135,.112),c:function(q,c){c.set(D_PINK).lerp(new T.Color(D_BELLY),T.MathUtils.clamp((-q.y)*6,0,1));if(q.y>.04)c.lerp(new T.Color(D_TAIL),T.MathUtils.clamp((-q.x)*2.2,0,.85));}},
{geo:paint(taperTube([v(.22,.03,0),v(.28,.10,0)],t=>.055-.012*t,8),(q,c)=>c.set(D_PINK)),m:M4(0,0,0),c:null},
{geo:paint(new T.SphereGeometry(1,12,9),(q,c)=>{c.set(D_PINK);if(q.y>.03)c.lerp(new T.Color('#9aa8bc'),T.MathUtils.clamp((q.y-.03)*9,0,.7));}),m:M4(.285,.135,0,.088,.085,.08),c:null},
{geo:paint(new T.SphereGeometry(1,10,8),(q,c)=>{c.set('#b0764a');const d=Math.sin(q.x*34+q.z*21)*Math.sin(q.y*42-q.z*29);if(d>.05)c.lerp(new T.Color('#3c2210'),.9);}),m:M4(.25,.085,0,.068,.055,.065),c:null},
{geo:new T.ConeGeometry(.016,.055,6),m:M4(.375,.125,0,1,1,1,0,0,-1.65),c:'#1c1210'},
{geo:new T.SphereGeometry(.02,6,5),m:M4(.305,.165,.055),c:'#1c1210'},
{geo:new T.SphereGeometry(.02,6,5),m:M4(.305,.165,-.055),c:'#1c1210'}];
if(perched){
 for(const sw of[-1,1]){parts.push({geo:new T.CylinderGeometry(.009,.007,.075,5),m:M4(.05,-.165,sw*.032),c:'#8a3a2c'});
 for(let toe=-1;toe<=1;toe++)parts.push({geo:new T.CylinderGeometry(.0026,.002,.034,4),m:M4(.064,-.2,sw*.032+toe*.008,1,1,1,0,toe*.3,1.45),c:'#8a3a2c'});}
 for(let k=-2;k<=2;k++)parts.push({geo:paint(featherGeo(.25-Math.abs(k)*.02,.044),(q,c)=>{c.set(D_TAIL);if(Math.abs(k)===2&&q.x<-.205)c.set('#e8e0d0');else if(q.x<-.18)c.lerp(new T.Color('#463b2e'),.55);}),m:M4(-.14,.005,k*.017,1,1,1,0,k*.14,.06),c:null});
 for(const sw of[-1,1]){
 for(let k=0;k<4;k++)parts.push({geo:paint(featherGeo(.26-k*.012,.058),(q,c)=>{c.set(k>1?D_WINGD:(k?'#8fa0bb':D_WING));if(q.x<-.20)c.lerp(new T.Color('#39425a'),.7);}),m:M4(.10-k*.045,.042+k*.004,sw*(.045+k*.024),1,1,1,sw*(.08+k*.04),-sw*(.16+k*.05),-.05),c:null});
 for(let row=0;row<2;row++)for(let j=0;j<5;j++)parts.push({geo:paint(featherGeo(.13-row*.02,.036),(q,c)=>{c.set(j%2?'#a8b6cc':'#8fa0bb');if(Math.abs(q.z)>.013)c.lerp(new T.Color('#3c465e'),.55);}),m:M4(.10-j*.05-row*.01,.058+row*.012,sw*(.052+row*.022),1,1,1,sw*.10,-sw*(.10+row*.06),-.04),c:null});
 for(let k=0;k<3;k++)parts.push({geo:featherGeo(.17-k*.014,.030),m:M4(-.13-k*.03,.036,sw*(.045-k*.012),1,1,1,sw*.05,-sw*(.20+k*.06),-.03),c:k>1?'#43506a':'#5d6a86'});
 }}
else{for(let k=-2;k<=2;k++)parts.push({geo:featherGeo(.24,.048),m:M4(-.36,.012,k*.024,1,1,1,0,k*.13,0),c:(q2,c)=>{c.set(D_TAIL);if(q2.x<-.44)c.set('#463b2e');if(Math.abs(k)===2&&q2.x<-.50)c.set('#e8e0d0');}});}
return mergeParts(parts);}
function doveWing(side){const root=new T.Group();root.position.set(.03,.055,side*.10);
const innerParts=[{geo:featherGeo(.24,.20),m:M4(.03,0,side*.03,1,1,1,0,-side*.10,0),c:(q,c)=>c.set(D_WING).lerp(new T.Color(D_WINGD),T.MathUtils.clamp(Math.abs(q.z)*1.2,0,.55))}];
for(let k=0;k<5;k++)innerParts.push({geo:featherGeo(.19-k*.008,.042),m:M4(-.06-k*.014,.002,side*(.035+k*.030),1,1,1,0,-side*(.10+k*.05),0),c:k%2?D_WING:'#a8b6cc'});
const inner=new T.Mesh(mergeParts(innerParts),doveMat);inner.castShadow=true;root.add(inner);
const outerG=new T.Group();outerG.position.set(-.12,0,side*.155);root.add(outerG);
const outerParts=[];
for(let k=0;k<7;k++)outerParts.push({geo:featherGeo(.235-k*.014,.040),m:M4(-k*.018,0,side*(.004+k*.023),1,1,1,0,-side*(.14+k*.085),0),c:k>3?'#43506a':k>1?'#5d6a86':D_WING});
const outer=new T.Mesh(mergeParts(outerParts),doveMat);outer.castShadow=true;outerG.add(outer);
root.userData.outer=outerG;return root;}
const doves=[];for(let i=0;i<5;i++){const d=new T.Group();const body=new T.Mesh(doveBody(false),doveMat);body.castShadow=true;d.add(body);
const wl=doveWing(1),wr=doveWing(-1);d.add(wl);d.add(wr);d.userData.kind='dove';d.userData.wingL=wl;d.userData.wingR=wr;scene.add(d);doves.push(d);animals.push(d);}
const perchedDoves=[];
{const spots=[[SHALI.x+6,shaliBase+5.4,SHALI.z+8],[SPRING.x-5.2,springY+1.35,SPRING.z+1.6],[ORACLE.x-4.6,oracleBase+5.7,ORACLE.z+2.4]];
for(let i=0;i<spots.length;i++){const d=new T.Group();const body=new T.Mesh(doveBody(true),doveMat);body.castShadow=true;d.add(body);
d.userData.kind='dove';d.position.set(...spots[i]);d.rotation.y=rand()*6.28;scene.add(d);perchedDoves.push(d);animals.push(d);}}

/* Little egrets: white, black dagger bill, wading the salt-lake shore. */
const E_WHITE='#f6f2e8',E_SHADE='#d8d2c2';
const egretMat=creatureMat(.8,furTex('#c8c2b0',.06,900),{rim:.3});
function egretBody(){return mergeParts([
{geo:new T.SphereGeometry(1,18,12),m:M4(0,.62,0,.34,.20,.16),c:function(q,c){c.set(E_WHITE);c.lerp(new T.Color(E_SHADE),T.MathUtils.clamp((.55-q.y)*3,0,.5));}},
{geo:paint(taperTube([v(.26,.68,0),v(.38,.86,0),v(.40,1.04,0),v(.48,1.16,0)],t=>.052-.02*t,8),(q,c)=>c.set(E_WHITE)),m:M4(0,0,0),c:null},   // S neck
{geo:new T.SphereGeometry(1,12,9),m:M4(.52,1.18,0,.085,.062,.058),c:E_WHITE},
{geo:new T.ConeGeometry(.018,.17,7),m:M4(.66,1.17,0,1,1,1,0,0,-1.62),c:'#1c1a14'},
{geo:new T.SphereGeometry(.014,6,5),m:M4(.55,1.21,.05),c:'#1a1410'},
{geo:new T.SphereGeometry(.014,6,5),m:M4(.55,1.21,-.05),c:'#1a1410'},
{geo:paint(taperTube([v(-.26,.60,0),v(-.44,.56,0)],t=>.05*(1-t*.5),7),(q,c)=>c.set(E_SHADE)),m:M4(0,0,0,.9,1,1.4),c:null},
{geo:new T.CylinderGeometry(.011,.009,.62,5),m:M4(.08,.31,.055),c:'#211d16'},
{geo:new T.CylinderGeometry(.011,.009,.62,5),m:M4(-.02,.31,-.05,1,1,1,0,0,.06),c:'#211d16'}]);}
const egrets=[];
for(let i=0;i<4;i++){const g=new T.Group();const b=new T.Mesh(egretBody(),egretMat);b.castShadow=true;g.add(b);
const a=range(0,6.28),r=range(46,54),x=LAKE.x+Math.sin(a)*r*1.35,z=LAKE.z+Math.cos(a)*r;
g.position.set(x,Math.max(terrain(x,z),LAKE_Y)+0,z);g.rotation.y=range(0,6.28);
g.userData={kind:'egret',body:b,ph:range(0,6.28),hx:x,hz:z};scene.add(g);egrets.push(g);animals.push(g);}
/* one egret flying a slow low circuit over the lake */
const flyEgret=new T.Group();
{const b=new T.Mesh(doveBody(false),new T.MeshStandardMaterial({vertexColors:true,roughness:.8}));b.traverse(o=>{});b.castShadow=true;
paint(b.geometry,(q,c)=>c.set(E_WHITE));
const wl=doveWing(1),wr=doveWing(-1);
wl.children.forEach(o=>{if(o.material)o.material=o.material.clone();});
const whiteWing=m=>{m.traverse(o=>{if(o.isMesh){o.material=egretMat;paint(o.geometry,(q,c)=>c.set(E_WHITE));}});};
whiteWing(wl);whiteWing(wr);whiteWing(b);
const neck=new T.Mesh(taperTube([v(.2,.05,0),v(.34,.1,0)],t=>.03,6),egretMat);paint(neck.geometry,(q,c)=>c.set(E_WHITE));flyEgret.add(neck);
const legs=new T.Mesh(new T.CylinderGeometry(.012,.012,.5,5),mat('#211d16'));legs.rotation.z=Math.PI/2;legs.position.set(-.34,-.04,0);flyEgret.add(legs);
flyEgret.add(b);flyEgret.add(wl);flyEgret.add(wr);
flyEgret.scale.setScalar(1.5);
flyEgret.userData={kind:'egretFly',wingL:wl,wingR:wr};scene.add(flyEgret);animals.push(flyEgret);}

/* Dragonflies over the spring. */
const dragonflies=[];
{const wingMat=new T.MeshBasicMaterial({color:0xbfe8e0,transparent:true,opacity:.4,side:T.DoubleSide,depthWrite:false});
for(let i=0;i<6;i++){const g=new T.Group();
const body=new T.Mesh(new T.CylinderGeometry(.012,.006,.16,5),new T.MeshStandardMaterial({color:i%2?'#2a6a8a':'#3a8a6a',roughness:.4,metalness:.5}));
body.rotation.z=Math.PI/2;g.add(body);
const wings=new T.Mesh(new T.PlaneGeometry(.1,.05),wingMat);wings.rotation.x=-Math.PI/2;wings.position.y=.015;g.add(wings);
g.userData={kind:'dfly',ph:range(0,6.28),r:range(1.5,4.4),h:range(.4,1.6),sp:range(.6,1.2),wings};
scene.add(g);dragonflies.push(g);animals.push(g);}}

/* Fennec at the dune edge. */
const F_BACK='#dcae72',F_CREAM='#f2e2c4',F_WHITE='#f8f0e0',F_PINK='#e8a58e',F_DARK='#2a1a10';
const fenMat=creatureMat(.94,furTex('#b08248',.08,1300),{rim:.18,emissive:'#3a2410',emissiveIntensity:.85});
const fennec=new T.Group();
{const fenBody=mergeParts([
{geo:new T.SphereGeometry(1,24,18),m:M4(-.10,.25,0,.255,.21,.205),c:function(q,c){c.set(F_BACK).lerp(new T.Color(F_CREAM),T.MathUtils.clamp((.26-q.y)*2.4,0,1));}},
{geo:paint(taperTube([v(-.20,.33,0),v(.04,.40,0),v(.24,.50,0)],t=>.175-.035*t,10),(q,c)=>c.set(F_BACK).lerp(new T.Color(F_CREAM),T.MathUtils.clamp((.44-q.y)*3,0,.9))),m:M4(0,0,0),c:null},
{geo:new T.SphereGeometry(1,12,9),m:M4(.22,.42,0,.17,.19,.15),c:F_CREAM},
{geo:new T.SphereGeometry(1,10,7),m:M4(-.04,.045,.14,.13,.04,.055),c:F_CREAM},
{geo:new T.SphereGeometry(1,10,7),m:M4(-.04,.045,-.14,.13,.04,.055),c:F_CREAM},
{geo:new T.CylinderGeometry(.034,.027,.26,6),m:M4(.26,.20,.085),c:'#ecd9b8'},
{geo:new T.CylinderGeometry(.034,.027,.26,6),m:M4(.26,.20,-.085),c:'#ecd9b8'},
{geo:new T.SphereGeometry(1,7,5),m:M4(.27,.06,.088,.05,.03,.042),c:F_WHITE},
{geo:new T.SphereGeometry(1,7,5),m:M4(.27,.06,-.088,.05,.03,.042),c:F_WHITE}]);
const fenBodyMesh=new T.Mesh(fenBody,fenMat);fenBodyMesh.castShadow=true;fennec.add(fenBodyMesh);
const fenTail=mergeParts([
{geo:paint(taperTube([v(-.26,.14,0),v(-.42,.08,.12),v(-.30,.06,.28),v(-.02,.07,.32)],t=>.05+.035*Math.sin(Math.PI*t),9),(q,c)=>c.set(F_BACK).lerp(new T.Color(F_CREAM),.35)),m:M4(0,0,0),c:null}]);
const fenTailMesh=new T.Mesh(fenTail,fenMat);fenTailMesh.castShadow=true;fennec.add(fenTailMesh);
const fenHead=new T.Group();fenHead.position.set(.30,.64,0);
const fenHeadGeo=mergeParts([
{geo:new T.SphereGeometry(1,20,15),m:M4(0,0,0,.115,.105,.095),c:function(q,c){c.set(F_BACK).lerp(new T.Color(F_CREAM),T.MathUtils.clamp((-q.y+.02)*6,0,.8));}},
{geo:new T.SphereGeometry(1,10,7),m:M4(.10,-.032,0,.068,.045,.045),c:F_WHITE},
{geo:new T.SphereGeometry(.013,6,5),m:M4(.152,-.018,0),c:'#120a06'}]);
const fenHeadMesh=new T.Mesh(fenHeadGeo,fenMat);fenHeadMesh.castShadow=true;fenHead.add(fenHeadMesh);
for(const s of[-1,1]){const e=new T.Mesh(new T.SphereGeometry(.025,8,6),eyeMat);e.position.set(.072,.035,s*.076);fenHead.add(e);}
function fenEar(side){const earG=new T.Group();earG.position.set(-.04,.10,side*.052);
const outer=new T.Mesh(new T.ConeGeometry(.078,.42,10),fenMat);paint(outer.geometry,(q,c)=>c.set(F_BACK).lerp(new T.Color(F_CREAM),T.MathUtils.clamp((.12-q.y)*1.4,0,.7)));
outer.position.set(0,.18,0);outer.scale.set(1,1,.52);earG.add(outer);
const innerM=new T.Mesh(new T.ConeGeometry(.058,.34,8),creatureMat(.55,null,{emissive:'#b04a34',emissiveIntensity:.22}));paint(innerM.geometry,(q,c)=>c.set(F_PINK).lerp(new T.Color(F_WHITE),T.MathUtils.clamp((q.y)*2,0,.5)));
innerM.position.set(.034,.15,0);innerM.scale.set(1,1,.42);earG.add(innerM);
earG.rotation.x=side*.40;earG.rotation.z=-.30;fenHead.add(earG);return earG;}
const earL=fenEar(1),earR=fenEar(-1);
fennec.add(fenHead);
fennec.userData={kind:'fennec',head:fenHead,earL,earR};
const fenX=88,fenZ=118;fennec.scale.setScalar(1.5);
fennec.position.set(fenX,terrain(fenX,fenZ)+.02,fenZ);fennec.rotation.y=2.4;scene.add(fennec);animals.push(fennec);}

/* Heat mirage over the open flat south of the lake. */
const mirage=new T.Mesh(new T.PlaneGeometry(320,10),new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},amt:{value:.3}},vertexShader:`varying vec2 uv2;void main(){uv2=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 uv2;uniform float time;uniform float amt;void main(){float w=sin(uv2.x*90.+time*2.2)*.5+sin(uv2.x*31.-time*1.3)*.5;float a=(.3+.16*w)*(1.-abs(uv2.y-.5)*1.7)*amt;gl_FragColor=vec4(.82,.9,.95,max(0.,a));}`}));mirage.position.set(-40,4,170);mirage.rotation.y=Math.PI;scene.add(mirage);
/* Wind-blown sand streaks. */
const streakGeo=new T.BufferGeometry(),streakPos=new Float32Array(240*3);for(let i=0;i<240;i++){streakPos[i*3]=range(-70,70);streakPos[i*3+1]=range(.2,3.2);streakPos[i*3+2]=range(-70,70);}streakGeo.setAttribute('position',new T.BufferAttribute(streakPos,3));
const streaks=new T.Points(streakGeo,new T.PointsMaterial({color:0xf2d9a8,size:.09,alphaMap:radTex(1,.1),transparent:true,opacity:.13,depthWrite:false}));streaks.position.set(60,0,90);scene.add(streaks);
/* Small curved rushes around damp soil, gathered in clumps rather than a field of spikes. */
{const verts=[],colors=[],inds=[];let n=0;const col=new T.Color();
for(let j=0;j<160;j++){const a=range(0,6.28),r=range(6.2,10.4),x=SPRING.x+Math.sin(a)*r,z=SPRING.z+Math.cos(a)*r;if(Math.sin(a*3)<-.6)continue;
for(let b=0;b<9;b++){const yaw=range(0,6.28),h=range(.12,.43),lean=range(.05,.22),width=range(.008,.022),bx=x+range(-.14,.14),bz=z+range(-.14,.14),by=terrain(bx,bz)-.02;
col.setHSL(.16+rand()*.1,.25+rand()*.2,.21+rand()*.12);
for(let s=0;s<4;s++){const t=s/3,ww=width*(1-t),xx=bx+Math.sin(yaw)*lean*t*t,zz=bz+Math.cos(yaw)*lean*t*t;for(const side of [-1,1]){verts.push(xx+Math.cos(yaw)*ww*side,by+h*t,zz-Math.sin(yaw)*ww*side);colors.push(col.r*(1+t*.35),col.g*(1+t*.35),col.b*(1+t*.35));}}
for(let s=0;s<3;s++){const i=n+s*2;inds.push(i,i+1,i+2,i+1,i+3,i+2);}n+=8;
}}
const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(verts,3));gg.setAttribute('color',new T.Float32BufferAttribute(colors,3));gg.setIndex(inds);gg.computeVertexNormals();const tufts=new T.Mesh(gg,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}));tufts.castShadow=true;scene.add(tufts);}


function seq(t,durs){let tot=0;for(const d of durs)tot+=d;let u=((t%tot)+tot)%tot;for(let i=0;i<durs.length;i++){if(u<durs[i])return[i,u/durs[i]];u-=durs[i];}return[durs.length-1,1];}
const easeU=u=>smoothU(Math.min(1,Math.max(0,u)));
const ahr=(u,a,r)=>u<a?easeU(u/a):u>1-r?easeU((1-u)/r):1;
return { cameraSolids,palmTime,colliders,terrain, meshHeight, floor, sandMat, animals, skyU, skyRig, sun, halo, clouds, lake, pool, mirage, streaks, shafts, lanterns, shaliGlows, flock, doves, perchedDoves, egrets, flyEgret, dragonflies, fennec, LAKE, GROVE, SPRING, SHALI, ORACLE, LAKE_Y, shaliBase, oracleBase, springY, shaliFlag, seq, easeU, ahr, smoothU, v, mat, range, rand };
}
