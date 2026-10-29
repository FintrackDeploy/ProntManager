'use strict';
/* Нейросеть Slovnet NER (проект Natasha, MIT): эмбеддинги Navec (PQ) + формы слов → 3 свёрточных слоя → CRF.
   Перенос на JS: вывод только на CPU, без сети. Веса: assets/ner/ner-data.js (tools/export_ner.py). */
const NER=(()=>{
const PS=new Set([...'!#$%&()[]\\/*+,.:;<=>?@^_{|}~-‐−‒⁃–—―`"\'«»„“ʼʻ”№…']);
const up=s=>s===s.toUpperCase()&&s!==s.toLowerCase(),lo=s=>s===s.toLowerCase()&&s!==s.toUpperCase();
const title=w=>w.length>1&&up(w[0])&&lo(w.slice(1));
function outline(w){if(w.length===1)return up(w)?'X':'x';if(up(w))return'XX';if(lo(w))return'xx';if(title(w))return'Xx';
 if(w.includes('-')){const[l,r]=[w.slice(0,w.indexOf('-')),w.slice(w.indexOf('-')+1)];if(title(l)&&title(r))return'Xx-Xx'}return'OTHER'}
function shape(w){let t='OTHER';if(/^[а-яё]+/i.test(w))t='RU';else if(/^[a-z]+/i.test(w))t='EN';else if(/^[+-]?\d+/.test(w))t='NUM';else if(PS.has(w[0]))t='PUNCT';
 if(t==='RU'||t==='EN')return t+'_'+outline(w);if(t==='PUNCT')return'PUNCT_'+(w.length>1||!PS.has(w)?'OTHER':w);return t}
const TOK=/[A-Za-zА-Яа-яЁё]+(?:-[A-Za-zА-Яа-яЁё]+)*|\d+(?:[.,]\d+)?|[^\sA-Za-zА-Яа-яЁё\d]/g;
const SEP=/(?<=[а-яёa-z]{3,}[.!?…])\s+(?=[А-ЯЁA-Z])|\n+/g;
let H=null,W=null,P={},api={ready:false};
function init(src){
 const b=typeof src==='string'?(typeof Buffer!=='undefined'?Buffer.from(src,'base64'):Uint8Array.from(atob(src),c=>c.charCodeAt(0))):src;
 const u=new Uint8Array(b.buffer?b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength):b),hl=new DataView(u.buffer).getUint32(0,true);
 H=JSON.parse(new TextDecoder().decode(u.subarray(4,4+hl)));const blob=u.subarray(4+hl);
 for(const[k,a]of Object.entries(H.arrays)){const n=a.shape.reduce((x,y)=>x*y,1);
  P[k]=k==='idx'?blob.slice(a.off,a.off+n):new Float32Array(blob.slice(a.off,a.off+n*4).buffer)}
 W=new Map(H.words.map((w,i)=>[w,i]));api.ready=true}
function run(words){
 const n=words.length,C=330,X=new Float32Array(n*C),unk=H.words.length-1,sh=new Map(H.shapes.map((s,i)=>[s,i])),oth=sh.get('OTHER');
 words.forEach((w,i)=>{const r=W.has(w.toLowerCase())?W.get(w.toLowerCase()):unk,s=sh.has(shape(w))?sh.get(shape(w)):oth;
  for(let q=0;q<100;q++){const o=(q*256+P.idx[r*100+q])*3;X[i*C+q*3]=P.codes[o];X[i*C+q*3+1]=P.codes[o+1];X[i*C+q*3+2]=P.codes[o+2]}
  for(let d=0;d<30;d++)X[i*C+300+d]=P.shape_emb[s*30+d]});
 let cur=X,cin=C;
 for(let l=0;l<H.layers;l++){const w=P['cw'+l],b=P['cb'+l],g=P['g'+l],bi=P['bi'+l],m=P['m'+l],s=P['s'+l],O=b.length,out=new Float32Array(n*O);
  for(let i=0;i<n;i++)for(let o=0;o<O;o++){let a=b[o];
   for(let k=0;k<3;k++){const j=i+k-1;if(j<0||j>=n)continue;const wo=(o*cin)*3+k,xo=j*cin;for(let c=0;c<cin;c++)a+=w[wo+c*3]*cur[xo+c]}
   a=a>0?a:0;out[i*O+o]=(a-m[o])/s[o]*g[o]+bi[o]}
  cur=out;cin=O}
 const T=P.hb.length,E=new Float32Array(n*T);
 for(let i=0;i<n;i++)for(let t=0;t<T;t++){let a=P.hb[t];for(let c=0;c<cin;c++)a+=cur[i*cin+c]*P.hw[c*T+t];E[i*T+t]=a}
 let sc=Float32Array.from(E.subarray(0,T));const hist=[];
 for(let i=1;i<n;i++){const ns=new Float32Array(T),ix=new Int32Array(T);
  for(let j=0;j<T;j++){let best=-1e30,bk=0;for(let k=0;k<T;k++){const v=sc[k]+P.trans[k*T+j];if(v>best){best=v;bk=k}}ns[j]=best+E[i*T+j];ix[j]=bk}
  sc=ns;hist.push(ix)}
 let bt=0;for(let t=1;t<T;t++)if(sc[t]>sc[bt])bt=t;const tags=[bt];
 for(let i=hist.length-1;i>=0;i--){bt=hist[i][bt];tags.push(bt)}
 tags.reverse();
 const pr=tags.map((t,i)=>{let mx=-1e30;for(let k=0;k<T;k++)mx=Math.max(mx,E[i*T+k]);let z=0;for(let k=0;k<T;k++)z+=Math.exp(E[i*T+k]-mx);return Math.exp(E[i*T+t]-mx)/z});
 return{tg:tags.map(t=>H.tags[t]),pr}}
function spans(text){
 if(!api.ready)return[];const res=[],cuts=[0];let m;SEP.lastIndex=0;
 while((m=SEP.exec(text))){cuts.push(m.index,m.index+m[0].length)}cuts.push(text.length);
 for(let c=0;c<cuts.length;c+=2){const st=cuts[c],seg=text.slice(st,cuts[c+1]),toks=[];TOK.lastIndex=0;let x;
  while((x=TOK.exec(seg)))toks.push([st+x.index,st+x.index+x[0].length,x[0]]);
  if(!toks.length)continue;const o=run(toks.map(t=>t[2])),tg=o.tg;let cur=null;
  tg.forEach((t,i)=>{const[bio,ty]=t.split('-');
   if(bio==='B'||(bio==='I'&&(!cur||cur[2]!==ty))){if(cur)res.push(cur);cur=[toks[i][0],toks[i][1],ty];cur.p=o.pr[i]}
   else if(bio==='I'){cur[1]=toks[i][1];cur.p=Math.min(cur.p,o.pr[i])}else{if(cur)res.push(cur);cur=null}});
  if(cur)res.push(cur)}
 return res}
const MAP={PER:'NAME',LOC:'LOC',ORG:'ORG'};
// Модель обучена на новостях: слово-команда в начале запроса («Составь…») иногда принимается за имя. Отсекаем такие находки.
const IMP=new Set('составь составьте объясни объясните напиши напишите подготовь подготовьте помоги помогите позвони определи придумай сравни реши приведи сделай создай расскажи подскажи проверь оцени поставь дай найди перечисли опиши предложи сформулируй перепиши переведи измени исправь проанализируй разработай подбери выбери запиши'.split(' '));
// Одиночное «имя» принимаем, только если слово похоже на фамилию или стоит после слов вроде «ученик», «коллега».
const SUF=/(?:ов|ев|ёв|ин|ын|ск(?:ий|ая|ого|ой|им)|цк(?:ий|ая)|ук|юк|енко|ич|вна)(?:а|у|ым|ой|е|ом|ем|ых|ы|ю)?$/i,CTX=/(?:ученик[а-я]*|ученица|ученицу|учитель[а-я]*|коллег[а-я]*|мама|папа|мать|отец|зовут|гражданин[а-я]*|господин|госпожа)\s+$/i;
const okSpan=(t,s,e,ty)=>{const w=t.slice(s,e);if(w.replace(/[^A-Za-zА-Яа-яЁё]/g,'').length<2||IMP.has(w.split(/\s+/)[0].toLowerCase()))return false;
 return !(ty==='PER'&&!/\s/.test(w)&&!SUF.test(w)&&!CTX.test(t.slice(Math.max(0,s-25),s)))};
function findings(text){return spans(text).filter(([s,e,ty])=>okSpan(text,s,e,ty)).map(([s,e,t])=>({s,e,ty:MAP[t],cat:T[MAP[t]][0],conf:'средняя',txt:text.slice(s,e),src:'нейросеть'}))}
Object.assign(api,{init,spans,findings});
return api})();
if(typeof module!=='undefined')module.exports=NER;
