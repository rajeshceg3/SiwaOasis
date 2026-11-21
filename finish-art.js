import * as T from 'three';
import { Water } from 'three/addons/objects/Water.js';
export function finishArt(scene,W){
// High frequency sand grain, larger aeolian ripples and soft albedo variations.
const n=512,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d'),im=x.createImageData(n,n),rough=x.createImageData(n,n);
for(let y=0;y<n;y++)for(let xx=0;xx<n;xx++){const k=(y*n+xx)*4;const rip=Math.sin(y*.24+Math.sin(xx*.012)*2.8+Math.sin(y*.018)*2);const grain=Math.random();const patches=Math.sin(xx*.027)*Math.cos(y*.019)*5;const b=209+rip*7+patches+grain*20;im.data[k]=b;im.data[k+1]=b-5;im.data[k+2]=b-13;im.data[k+3]=255;rough.data[k]=rough.data[k+1]=rough.data[k+2]=205+grain*45;rough.data[k+3]=255;}
x.putImageData(im,0,0);const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(100,100);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
const rc=document.createElement('canvas');rc.width=rc.height=n;rc.getContext('2d').putImageData(rough,0,0);const rt=new T.CanvasTexture(rc);rt.wrapS=rt.wrapT=T.RepeatWrapping;rt.repeat.set(100,100);
W.sandMat.map=tex;W.sandMat.roughnessMap=rt;W.sandMat.bumpScale=.22;W.sandMat.needsUpdate=true;
// Small smoothly warped water normals, created locally. No downloaded texture.
const data=new Uint8Array(128*128*4);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const dx=Math.cos(x*.39+y*.13)*.18+Math.cos(x*.17-y*.32)*.10,dz=Math.sin(y*.34+x*.11)*.18+Math.cos(x*.3+y*.28)*.10;const k=(y*128+x)*4;data[k]=(dx*.5+.5)*255;data[k+1]=(dz*.5+.5)*255;data[k+2]=248;data[k+3]=255;}
const normals=new T.DataTexture(data,128,128,T.RGBAFormat);normals.wrapS=normals.wrapT=T.RepeatWrapping;normals.needsUpdate=true;
const waters=[];
for(const [key,color,size,dist] of [['pool',0x17796e,2.5,1.2]]){
 const old=W[key];const water=new Water(old.geometry.clone(),{textureWidth:innerWidth<600?256:512,textureHeight:innerWidth<600?256:512,waterNormals:normals,sunDirection:new T.Vector3(-.82,.23,-.25).normalize(),sunColor:0xffdfb0,waterColor:color,distortionScale:dist,alpha:1,fog:true});
 water.material.fragmentShader=water.material.fragmentShader.replace('float rf0 = 0.3;', 'float rf0 = 0.035;').replace('reflectionSample * specularLight', 'reflectionSample * min(specularLight, vec3(.7))').replace('vec3 outgoingLight = albedo;', 'vec3 outgoingLight = mix(albedo, waterColor * 1.65, .38);').replace('scatter ) * getShadowMask()', 'scatter * 1.65 ) * getShadowMask()');
 water.position.copy(old.position);water.rotation.copy(old.rotation);water.scale.copy(old.scale);water.material.uniforms.size.value=size*1.8;
 // Avoid recursive mirror rendering when both the pool and lake are in view.
 const render=water.onBeforeRender;let reflectFrame=0;water.onBeforeRender=function(...args){
 const cam=args[2],range=key==='pool'?75:145;if(cam.position.distanceTo(water.position)>range||(++reflectFrame%3!==1))return;const states=waters.map(w=>w.visible);waters.forEach(w=>w.visible=false);render.apply(this,args);waters.forEach((w,i)=>w.visible=states[i]);};
 scene.remove(old);scene.add(water);W[key]=water;waters.push(water);
}
// Very quiet salt-white scallop where the lake meets land, and wet gravel outside the spring.
const ring=new T.Mesh(new T.RingGeometry(5.77,6.75,72),new T.MeshStandardMaterial({color:'#605c43',roughness:.98,transparent:true,opacity:.4,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(W.SPRING.x,W.springY+.025,W.SPRING.z);scene.add(ring);
// A thin broken spring-water line against the stone, not surf in a still pool.
const line=new T.Mesh(new T.TorusGeometry(5.32,.012,4,96),new T.MeshBasicMaterial({color:'#d8e4d5',transparent:true,opacity:.45}));line.rotation.x=Math.PI/2;line.position.copy(W.pool.position).y+=.008;scene.add(line);
const motesGeo=new T.BufferGeometry(),pts=[];for(let i=0;i<90;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*28;pts.push(W.GROVE.x+Math.sin(a)*r,W.terrain(W.GROVE.x,W.GROVE.z)+Math.random()*5+.5,W.GROVE.z+Math.cos(a)*r);}
motesGeo.setAttribute('position',new T.Float32BufferAttribute(pts,3));const dc=document.createElement('canvas');dc.width=dc.height=32;const dx=dc.getContext('2d'),gr=dx.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'white');gr.addColorStop(1,'transparent');dx.fillStyle=gr;dx.fillRect(0,0,32,32);const mt=new T.CanvasTexture(dc);
const motes=new T.Points(motesGeo,new T.PointsMaterial({map:mt,color:0xffe8b4,size:.035,transparent:true,opacity:.48,depthWrite:false,blending:T.AdditiveBlending}));scene.add(motes);
return {tick(t){motes.rotation.y=Math.sin(t*.04)*.001;}};
}
