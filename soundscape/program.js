import {windNoise,whistleWind,lapping,rustle,coos,bubbles,bells} from './soundscape-layers.js';
const mk=render=>({render,seconds:12});
export default {defaultScene:'trek',layers:{
wind:mk(c=>windNoise(c,{color:.03,gustDepth:.45,base:.4,seed:721})),
whistle:mk(c=>whistleWind(c,{fMin:320,fMax:650,q:6,gain:.08,seed:722})),
water:mk(c=>lapping(c,{gain:.3,period:3,depth:.4,seed:723})),
leaves:mk(c=>rustle(c,{gain:.2,period:2,depth:.7,seed:724})),
birds:mk(c=>coos(c,{count:3,f:540,gain:.14,seed:725})),
spring:mk(c=>bubbles(c,{count:22,gain:.1,seed:726})),
chimes:mk(c=>bells(c,{count:4,f:660,gain:.07,seed:727,minGap:2.2}))},
scenes:{trek:[{layer:'wind',gain:.5},{layer:'whistle',gain:.15}],grove:[{layer:'wind',gain:.15},{layer:'leaves',gain:.7},{layer:'birds',gain:.4},{layer:'water',gain:.35},{layer:'spring',gain:.3}],lake:[{layer:'wind',gain:.3},{layer:'water',gain:.7}],shali:[{layer:'wind',gain:.2},{layer:'chimes',gain:.5},{layer:'birds',gain:.2}]}};
