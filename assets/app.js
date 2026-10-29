'use strict';
const $=id=>document.getElementById(id),esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let off=new Set();
function render(t,box,withOff){
 const r=analyze(t,off,ext(t)),lv=LV[r.level];let h='';
 const ix={none:0,review:1,high:2,critical:3}[r.level],lit=ix===3?4:ix;
 h+=`<div class="lvl L-${r.level}"><div class="mt">${[0,1,2,3].map(i=>`<i class="${i<lit?'on':''}"></i>`).join('')}</div><b>${lv[0]}</b><br>${lv[2]}</div>`;
 h+='<div class="tiles">'+Object.keys(CR).map(k=>`<div class="tile${r.cats.has(k)?' on':''}"><b>${k}</b> ${CR[k]}</div>`).join('')+'</div>';
 let p=0,x='';for(const m of r.f){x+=esc(t.slice(p,m.s))+`<mark class="m${m.cat[1]}" title="${T[m.ty][1]}">${esc(m.txt)}</mark>`;p=m.e}
 h+=`<h2>Текст с отметками</h2><div class="hl">${x+esc(t.slice(p))}</div>`;
 if(r.f.length||r.warns.length){h+='<h2>Что не так</h2>';
  r.warns.forEach(w=>h+=`<div class="card"><b>${CR[w[0]]}: ${w[1]}</b><br>${w[2]}<br><em>Что делать:</em> ${w[3]}</div>`);
  r.f.forEach(m=>{const i=T[m.ty];h+=`<div class="card"><b>${CR[m.cat]}</b> (${m.cat}) — ${i[1]}: <q>${esc(m.txt)}</q><br>${i[2]}<br><em>Что делать:</em> ${i[3]}<br><small>Источник: ${m.src||'правила'} · уверенность: ${m.conf}. Анализатор может ошибаться.</small>${withOff?` <button class="btn secondary" data-off="${m.s}-${m.e}">Это не риск</button>`:''}</div>`})
  const st=safeText(t,r.f);
  h+=`<h2>Более безопасный вариант</h2><div class="safe">${esc(st)}</div><p class="sub">Шаблонная редакция: заменены только распознанные фрагменты. Это не гарантирует анонимность, проверьте текст сами и уберите лишние подробности.</p><div class="row"><button class="btn secondary" id="cp">Скопировать</button><button class="btn secondary" id="dl">Скачать .txt</button><button class="btn secondary" id="pr">Печать / PDF</button></div>`}
 box.innerHTML=h;return r}
function run(){const t=$('inp').value;if(!t.trim()){$('res').innerHTML='<p class="sub">Введите текст запроса.</p>';return}
 const r=render(t,$('res'),true);const dl=$('dl');if(dl)dl.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([safeText(t,r.f)],{type:'text/plain;charset=utf-8'}));a.download='bezopasnyj-prompt.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1e3)};const pr=$('pr');if(pr)pr.onclick=()=>window.print();const cp=$('cp');if(cp)cp.onclick=()=>navigator.clipboard?navigator.clipboard.writeText(safeText(t,r.f)).then(()=>toast('Скопировано'),()=>toast('Не удалось скопировать',1)):toast('Копирование недоступно',1)}
$('go').onclick=()=>{off=new Set();run()};
$('res').onclick=e=>{const k=e.target.dataset&&e.target.dataset.off;if(k){off.add(k);run()}};
$('clr').onclick=()=>{$('inp').value='';$('res').innerHTML='';off=new Set();$('cnt').textContent='0 символов'};
let ei=1;$('ex').onclick=()=>{const c=CASES[ei++%CASES.length][1];$('inp').value=c;$('cnt').textContent=c.length+' символов'};
let tm;$('inp').oninput=()=>{$('cnt').textContent=$('inp').value.length+' символов';if($('live').checked){clearTimeout(tm);tm=setTimeout(()=>{off=new Set();run()},450)}};
$('inp').onkeydown=e=>{if(e.ctrlKey&&e.key==='Enter'){off=new Set();run()}};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.setAttribute('aria-selected',x===b));['a','b','c','d'].forEach(i=>$(i).hidden=i!==b.dataset.t)});
$('cs').innerHTML=CASES.map((c,i)=>`<option value="${i}">${i+1}. ${c[0]}</option>`).join('');
$('cks').innerHTML=Object.keys(CR).map(k=>`<label class="ck"><input type="checkbox" value="${k}"> ${k}. ${CR[k]}</label>`).join('');
const showCase=()=>{$('mine').value='';$('mres').innerHTML='';$('ctext').textContent=CASES[$('cs').value][1];$('cres').innerHTML='';document.querySelectorAll('#cks input').forEach(i=>i.checked=false)};
$('cs').onchange=showCase;showCase();
$('cmp').onclick=()=>{const t=CASES[$('cs').value][1],a=analyze(t,undefined,ext(t)),mine=new Set([...document.querySelectorAll('#cks input:checked')].map(i=>i.value));
 let hit=0,h='';Object.keys(CR).forEach(k=>{const A=a.cats.has(k),M=mine.has(k);if(A===M)hit++;h+=`<div class="card"><b>${k}. ${CR[k]}</b>: вы — ${M?'да':'нет'}, анализатор — ${A?'да':'нет'} <span class="${A===M?'ok':'no'}">${A===M?'совпало':'расходится'}</span></div>`});
 h=`<h2>Сравнение: совпало ${hit} из 7</h2>`+h+'<p class="sub">Расхождение не всегда значит ошибку: анализатор опирается на словари и может промахнуться, а вы можете учесть контекст.</p>';
 const d=document.createElement('div');$('cres').innerHTML=h;$('cres').appendChild(d);render(t,d,false)};

const BS={C1:'Нормативная основа: Закон № 99-З',C2:'Нормативная основа и методическая реализация',C3:'Нормативная основа, зависит от контекста',C4:'Нормативная основа, зависит от контекста',C5:'Принцип минимизации данных и методика',C7:'Законы № 455-З и № 262-З, зависит от контекста',C8:'Методическое дополнение'};
$('crit').innerHTML=Object.keys(CR).map(k=>`<div class="card"><b>${k}. ${CR[k]}</b><br><small>${BS[k]}</small></div>`).join('');
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});

function toast(m,err){const d=document.createElement('div');d.className='toast'+(err?' err':'');d.textContent=m;$('tw').appendChild(d);setTimeout(()=>d.remove(),3500)}
async function readFile(f){
 if(f.size>2e6)throw new Error('Файл больше 2 МБ');
 if(/\.txt$/i.test(f.name))return f.text();
 if(/\.docx$/i.test(f.name)){const z=await JSZip.loadAsync(await f.arrayBuffer()),e=z.file('word/document.xml');if(!e)throw new Error('Не удалось прочитать .docx');
  return(await e.async('string')).replace(/<\/w:p>/g,'\n').replace(/<w:tab\/>/g,'\t').replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&')}
 throw new Error('Поддерживаются только .txt и .docx')}
$('up').onclick=()=>$('fl').click();
$('fl').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{let t=await readFile(f);if(t.length>20000){t=t.slice(0,20000);toast('Текст обрезан до 20 000 символов')}$('inp').value=t;$('cnt').textContent=t.length+' символов';off=new Set();run();toast('Файл прочитан локально')}catch(x){toast(x.message||'Не удалось прочитать файл',1)}};
$('mchk').onclick=()=>{const t=$('mine').value;if(!t.trim()){toast('Введите свою редакцию',1);return}render(t,$('mres'),false)};
document.querySelector('.tabs').onkeydown=e=>{const b=[...document.querySelectorAll('.tabs button')],i=b.indexOf(document.activeElement);if(i<0||!/Arrow(Left|Right)/.test(e.key))return;const n=b[(i+(e.key==='ArrowRight'?1:b.length-1))%b.length];n.focus();n.click()};

function ext(t){return NER.ready&&$('nn').checked?NER.findings(t):null}
function setNn(m,ok){const e=$('nns');e.textContent=m;e.className='pill'+(ok?' ok':'')}
function loadNer(){if(NER.ready||NER.loading)return;NER.loading=true;setNn('Загрузка нейросети…');
 const s=document.createElement('script');s.src='assets/ner/ner-data.js';
 s.onload=()=>{try{NER.init(window.NER_DATA);window.NER_DATA=null;setNn('Нейросеть готова',1);toast('Нейросеть загружена');if($('inp').value.trim())run()}catch(e){NER.loading=false;setNn('Ошибка модели');toast('Не удалось запустить нейросеть',1)}};
 s.onerror=()=>{NER.loading=false;setNn('Только правила');toast('Модель не загружена: работают правила',1)};document.head.appendChild(s)}
$('nn').onchange=()=>{if($('nn').checked)loadNer();else setNn('Нейросеть выключена');if($('inp').value.trim())run()};
if($('nn').checked)setTimeout(loadNer,300);else setNn('Нейросеть выключена');
