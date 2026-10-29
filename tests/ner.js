// node tests/ner.js — сверка JS-версии нейросети с эталоном Natasha (Python).
const fs=require('fs'),path=require('path');global.T={NAME:['C1'],LOC:['C2'],ORG:['C2']};
const NER=require('../assets/ner.js');const js=fs.readFileSync(path.join(__dirname,'../assets/ner/ner-data.js'),'utf8');
NER.init(js.slice(js.indexOf('"')+1,js.lastIndexOf('"')));
const ref=JSON.parse(fs.readFileSync(path.join(__dirname,'ner_reference.json'),'utf8'));let tot=0,hit=0,extra=0;
for(const r of ref){const g=NER.spans(r.text).map(x=>x.join('|')),e=r.spans.map(x=>x.join('|'));e.forEach(s=>{tot++;if(g.includes(s))hit++});extra+=g.filter(s=>!e.includes(s)).length}
console.log(`Сверка с Natasha: найдено ${hit} из ${tot} эталонных сущностей, лишних ${extra}`);
if(hit/tot<0.9){console.error('Совпадение ниже 90%');process.exit(1)}
