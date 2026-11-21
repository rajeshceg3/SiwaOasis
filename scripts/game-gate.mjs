import './serve.mjs';
import puppeteer from 'puppeteer-core';import fs from 'node:fs';
const out='verification';fs.mkdirSync(out,{recursive:true});const checks=[];
const ok=(name,pass,detail='')=>{checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail);};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--hide-scrollbars']});
try{
for(const [w,h] of (process.env.WIDTHS||'390,320,1280,1440').split(',').map(Number).map(w=>[w,w===390?844:w===320?740:w===1280?800:900])){
 const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.setViewport({width:w,height:h,hasTouch:true});await p.goto('http://127.0.0.1:8794/?mute=1');await p.waitForFunction(()=>window.__game);await sleep(1200);
 await p.screenshot({path:`${out}/start-${w}.png`});
 ok(`begin focused ${w}`,await p.evaluate(()=>document.activeElement.id==='beginBtn'));
 if(w===320)await p.touchscreen.tap(...await p.$eval('#beginBtn',e=>{const r=e.getBoundingClientRect();return[r.x+r.width/2,r.y+r.height/2]}));else await p.click('#beginBtn');
 await p.waitForFunction(()=>document.querySelector('#start').hidden);await sleep(600);
 ok(`begin via ${w===320?'real touch':'real mouse'} ${w}`,await p.$eval('#start',e=>e.hidden));
 await p.screenshot({path:`${out}/walk-${w}.png`});
 ok(`no overflow ${w}`,await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
 ok(`bottom-right clearance ${w}`,await p.evaluate(()=>![...document.querySelectorAll('button')].some(e=>{const r=e.getBoundingClientRect();return r.width&&r.top>innerHeight*.65&&r.right>innerWidth-196}))); // no persistent lower-right controls
 if(w===390&&process.env.STAGE!=='sites'){
  const pos=()=>p.evaluate(()=>({x:__game.pos().x,z:__game.pos().z}));const before=await pos();
  await p.keyboard.down('KeyW');await sleep(2000);await p.keyboard.up('KeyW');const after=await pos();
  ok('WASD movement',Math.hypot(after.x-before.x,after.z-before.z)>1,JSON.stringify({before,after}));
  ok('footprints',await p.evaluate(()=>__game.printCount()>1));
  const yawBefore=await p.evaluate(()=>__game.camera.quaternion.toArray());await p.mouse.move(280,360);await p.mouse.down();await p.mouse.move(100,360,{steps:12});await p.mouse.up();await sleep(800);
  ok('mouse look',JSON.stringify(yawBefore)!==JSON.stringify(await p.evaluate(()=>__game.camera.quaternion.toArray())));
  const cd=await p.createCDPSession();const tb=await pos();
  await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:90,y:650}]});
  await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:90,y:590}]});await sleep(2100);
  await p.screenshot({path:`${out}/touch-stick-390.png`});
  await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const ta=await pos();
  ok('trusted CDP touch joystick walks',Math.hypot(ta.x-tb.x,ta.z-tb.z)>1,JSON.stringify({tb,ta}));
  const yb=await p.evaluate(()=>__game.camera.quaternion.toArray());
  await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:310,y:420}]});await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:210,y:420}]});await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(900);
  ok('trusted touch look',JSON.stringify(yb)!==JSON.stringify(await p.evaluate(()=>__game.camera.quaternion.toArray())));
  await p.click('#pauseBtn');const pb=await pos();await p.keyboard.down('KeyW');await sleep(600);await p.keyboard.up('KeyW');const pa=await pos();ok('pause stops player',Math.hypot(pa.x-pb.x,pa.z-pb.z)<.01);await p.click('#pauseBtn');
 }
 if(w===390&&process.env.STAGE!=='controls'){
  // Site hooks isolate discovery and camera compositions, not evidence of full route traversal.
  for(const [name,x,z,yaw] of [['grove',15,25,Math.PI],['spring',24,48,Math.PI],['lake',-36,10,-Math.PI/2],['oracle',85,-47,Math.PI],['dunes',105,105,-2.4],['shali',0,-88,Math.PI]]){
   await p.evaluate((x,z,yaw)=>__game.teleport(x,z,yaw),x,z,yaw);await sleep(1000);await p.screenshot({path:`${out}/${name}-390.png`});
   ok(`discovery ${name}`,await p.evaluate(name=>__game.found.has(name),name));
  }
  ok('completion dialog after six',await p.$eval('#done',e=>!e.hidden));
  ok('completion focused',await p.evaluate(()=>document.activeElement.id==='againBtn'));
  await p.keyboard.press('Tab');ok('completion focus trap',await p.evaluate(()=>document.activeElement.id==='againBtn'));await p.click('#againBtn');await sleep(200);
  ok('reset clears discoveries',await p.evaluate(()=>__game.found.size===0));
 }
 if(w===1440||w===320){await p.evaluate(()=>__game.teleport(24,48,Math.PI));await sleep(1200);await p.screenshot({path:`${out}/spring-${w}.png`});}
 ok(`zero browser errors ${w}`,errs.length===0,errs.join(' | '));await p.close();
}
if(!process.env.SKIP_REDUCED){const p=await b.newPage();await p.setViewport({width:390,height:844});await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await p.goto('http://127.0.0.1:8794/?play=1&mute=1');await p.waitForFunction(()=>window.__game);await sleep(500);
const snap=()=>p.evaluate(()=>({pool:__game.W.pool.material.uniforms.time.value,lake:__game.W.lake.material.uniforms.time.value,bird:__game.W.flyEgret.position.toArray()}));const a=await snap();await sleep(500);const c=await snap();ok('reduced motion freezes ambient',JSON.stringify(a)===JSON.stringify(c));const z=await p.evaluate(()=>__game.pos().z);await p.keyboard.down('KeyW');await sleep(1000);await p.keyboard.up('KeyW');ok('reduced motion playable',Math.abs(await p.evaluate(()=>__game.pos().z)-z)>.5);await p.screenshot({path:`${out}/reduced-390.png`});await p.close();}
}catch(e){checks.push({name:'uncaught test error',pass:false,detail:String(e.stack)});console.error(e);}finally{await b.close();fs.writeFileSync(`${out}/pass3-results-${process.env.STAGE||'all'}-${process.env.WIDTHS||'all'}.json`,JSON.stringify(checks,null,2));console.log('RESULT',checks.filter(x=>x.pass).length,'/',checks.length);process.exit(checks.every(c=>c.pass)?0:1);}
