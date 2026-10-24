const CATS={housing:["🏠","#f59e0b","#fdecec"],food:["🛒","#2563eb","#e3ecfb"],transport:["🚗","#10b981","#dcf5ec"],subs:["📄","#7c3aed","#ece4fb"],leisure:["🎉","#ef4444","#fde4e7"],other:["📦","#94a3b8","#eceff3"]};
const T={
fr:{salary:"Salaire du mois",total:"Total des charges",savings:"Épargne",rest:"Reste",over:"Découvert",split:"Répartition du salaire",charges:"Mes charges du mois",add:"+ Ajouter",evolution:"Évolution du salaire",hint:"Touchez un point pour modifier le salaire du mois.",home:"Accueil",annualTab:"Salaire annuel",housing:"Logement",food:"Courses",transport:"Transport",subs:"Abonnements",leisure:"Loisirs",other:"Autres",save:"Enregistrer",del:"Supprimer",cancel:"Annuler",label:"Nom",amount:"Montant (€)",category:"Catégorie",newCharge:"Nouvelle charge",editCharge:"Modifier la charge",editSalary:"Salaire du mois",editSavings:"Épargne du mois",copy:"Copier les charges du mois précédent",empty:"Aucune charge ce mois-ci."},
en:{salary:"Monthly salary",total:"Total expenses",savings:"Savings",rest:"Left over",over:"Overdraft",split:"Salary breakdown",charges:"This month's expenses",add:"+ Add",evolution:"Salary over time",hint:"Tap a point to edit that month's salary.",home:"Home",annualTab:"Yearly salary",housing:"Housing",food:"Groceries",transport:"Transport",subs:"Subscriptions",leisure:"Leisure",other:"Other",save:"Save",del:"Delete",cancel:"Cancel",label:"Name",amount:"Amount (€)",category:"Category",newCharge:"New expense",editCharge:"Edit expense",editSalary:"Monthly salary",editSavings:"Monthly savings",copy:"Copy last month's expenses",empty:"No expenses this month."},
ar:{salary:"راتب الشهر",total:"إجمالي المصاريف",savings:"الادخار",rest:"المتبقي",over:"عجز",split:"توزيع الراتب",charges:"مصاريف الشهر",add:"+ إضافة",evolution:"تطور الراتب",hint:"اضغط على نقطة لتعديل راتب الشهر.",home:"الرئيسية",annualTab:"الراتب السنوي",housing:"السكن",food:"المشتريات",transport:"النقل",subs:"الاشتراكات",leisure:"الترفيه",other:"أخرى",save:"حفظ",del:"حذف",cancel:"إلغاء",label:"الاسم",amount:"المبلغ (€)",category:"الفئة",newCharge:"مصروف جديد",editCharge:"تعديل المصروف",editSalary:"راتب الشهر",editSavings:"ادخار الشهر",copy:"نسخ مصاريف الشهر السابق",empty:"لا توجد مصاريف هذا الشهر."}};

const KEY="budget-app-v1";
const $=s=>document.querySelector(s);
const def={lang:"fr",salaries:{},savings:{},charges:{}};
let S;try{S={...def,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{S={...def}}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}};
const now=new Date();let Y=now.getFullYear(),M=now.getMonth(),view="home";
const key=(y,m)=>`${y}-${String(m+1).padStart(2,"0")}`;
const t=k=>T[S.lang][k]||k;
const loc=()=>S.lang+"-u-nu-latn";
const eur=n=>new Intl.NumberFormat(loc(),{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function salaryOf(y,m){ // dernier salaire connu jusqu'à ce mois
  for(let i=0;i<36;i++){const d=new Date(y,m-i,1);const v=S.salaries[key(d.getFullYear(),d.getMonth())];if(v!=null)return v}
  return 0;
}
const chargesOf=k=>S.charges[k]||[];

function render(){
  document.documentElement.lang=S.lang;document.documentElement.dir=S.lang==="ar"?"rtl":"ltr";
  $("#lang").value=S.lang;
  document.querySelectorAll("[data-t]").forEach(e=>e.textContent=t(e.dataset.t));
  $("#add").textContent=t("add");$("#copy").textContent=t("copy");
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.view===view));
  $("#home").hidden=view!=="home";$("#annual").hidden=view!=="annual";
  $("#prev,#next").hidden=false;
  if(view==="home")renderHome();else renderAnnual();
}

function renderHome(){
  const k=key(Y,M),sal=salaryOf(Y,M),list=chargesOf(k),tot=list.reduce((a,c)=>a+c.amount,0),sv=S.savings[k]||0,rest=sal-tot-sv;
  $("#title").textContent=new Intl.DateTimeFormat(loc(),{month:"long",year:"numeric"}).format(new Date(Y,M,1));
  $("#salary").textContent=eur(sal);$("#total").textContent=eur(tot);$("#savings").textContent=eur(sv);
  $("#rest").textContent=eur(rest);$("#restLabel").textContent=t(rest<0?"over":"rest");
  $("#restTile").classList.toggle("neg",rest<0);
  const pc=n=>sal>0?Math.round(n/sal*100):0;
  $("#pct").textContent=pc(tot+sv)+" %";
  // regroupe par catégorie
  const by={};list.forEach(c=>by[c.cat]=(by[c.cat]||0)+c.amount);
  const parts=Object.keys(CATS).filter(c=>by[c]).map(c=>({n:t(c),v:by[c],col:CATS[c][1]}));
  if(sv)parts.push({n:t("savings"),v:sv,col:"#0ea5e9"});
  $("#legend").innerHTML=parts.map(p=>`<li><i style="background:${p.col}"></i>${esc(p.n)}<b>${pc(p.v)} %</b></li>`).join("");
  const seg=[...parts];if(rest>0)seg.push({v:rest,col:"#e2e8f0"});
  const sum=seg.reduce((a,p)=>a+p.v,0)||1,R=46,C=2*Math.PI*R;let off=0;
  $("#donut").innerHTML=(seg.length?seg:[{v:1,col:"#e2e8f0"}]).map(p=>{const l=p.v/sum*C,s=`<circle cx="60" cy="60" r="${R}" fill="none" stroke="${p.col}" stroke-width="20" stroke-dasharray="${l} ${C-l}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>`;off+=l;return s}).join("")
    +`<text x="60" y="58" text-anchor="middle" font-size="13" font-weight="700" fill="${rest<0?"#d61f2c":"#13804f"}">${eur(rest)}</text><text x="60" y="73" text-anchor="middle" font-size="8" fill="#6b7a90">${t(rest<0?"over":"rest")}</text>`;
  $("#list").innerHTML=list.length?list.map(c=>`<li><button data-id="${c.id}"><span class="em" style="background:${CATS[c.cat][2]}">${CATS[c.cat][0]}</span><span class="n">${esc(c.label||t(c.cat))}</span><span class="a">${eur(c.amount)}</span><span class="muted">${S.lang==="ar"?"‹":"›"}</span></button></li>`).join(""):`<li class="empty">${t("empty")}</li>`;
  const prev=chargesOf(key(...(M?[Y,M-1]:[Y-1,11])));
  $("#copy").hidden=list.length>0||prev.length===0;
}

function renderAnnual(){
  $("#title").textContent=t("annualTab");$("#year").textContent=Y;
  const vals=[...Array(12)].map((_,m)=>salaryOf(Y,m)),max=Math.max(3000,Math.ceil(Math.max(...vals)/500)*500);
  const L=44,Rr=330,Tp=20,B=190,x=i=>L+i*(Rr-L)/11,y=v=>B-(v/max)*(B-Tp);
  let g="";for(let v=0;v<=max;v+=500)g+=`<line x1="${L}" x2="${Rr}" y1="${y(v)}" y2="${y(v)}" stroke="#e6ebf2"/><text x="${L-6}" y="${y(v)+3}" text-anchor="end">${eur(v)}</text>`;
  const names=[...Array(12)].map((_,m)=>new Intl.DateTimeFormat(loc(),{month:"short"}).format(new Date(Y,m,1)));
  g+=names.map((n,i)=>`<text x="${x(i)}" y="208" text-anchor="middle">${esc(n.replace(".",""))}</text>`).join("");
  g+=`<polyline fill="none" stroke="#1a6cff" stroke-width="2.5" stroke-linejoin="round" points="${vals.map((v,i)=>x(i)+","+y(v)).join(" ")}"/>`;
  g+=vals.map((v,i)=>`<g class="pt" data-m="${i}" tabindex="0" role="button" aria-label="${esc(names[i])} ${eur(v)}"><circle cx="${x(i)}" cy="${y(v)}" r="12" fill="transparent"/><circle cx="${x(i)}" cy="${y(v)}" r="${i===M?5:3.5}" fill="#fff" stroke="#1a6cff" stroke-width="2"/></g>`).join("");
  g+=`<line x1="${x(M)}" x2="${x(M)}" y1="${y(vals[M])}" y2="${B}" stroke="#1a6cff" stroke-dasharray="3 3"/><rect x="${x(M)-28}" y="${y(vals[M])-26}" width="56" height="18" rx="5" fill="#1a6cff"/><text x="${x(M)}" y="${y(vals[M])-14}" text-anchor="middle" fill="#fff" style="fill:#fff;font-weight:700">${eur(vals[M])}</text>`;
  $("#chart").innerHTML=g;
}

function form(title,fields,onSave,onDel){
  const f=$("#form");
  f.innerHTML=`<h3>${esc(title)}</h3>`+fields.map(x=>x.type==="select"
    ?`<label>${t("category")}<select name="${x.n}">${Object.keys(CATS).map(c=>`<option value="${c}" ${x.v===c?"selected":""}>${CATS[c][0]} ${t(c)}</option>`).join("")}</select></label>`
    :`<label>${x.l}<input name="${x.n}" type="${x.type}" value="${esc(x.v??"")}" ${x.type==="number"?'min="0" step="any" inputmode="decimal"':""} ${x.req?"required":""}></label>`).join("")
    +`<div class="btns">${onDel?`<button type="button" class="del" value="del">${t("del")}</button>`:""}<button value="cancel" formnovalidate>${t("cancel")}</button><button class="primary" value="ok">${t("save")}</button></div>`;
  f.onsubmit=e=>{if(e.submitter?.value!=="ok")return;const d=Object.fromEntries(new FormData(f));onSave(d);save();render()};
  const del=f.querySelector(".del");if(del)del.onclick=()=>{onDel();save();$("#dlg").close();render()};
  $("#dlg").showModal();
}

function editSalary(m){const k=key(Y,m);form(t("editSalary"),[{n:"v",l:t("amount"),type:"number",v:salaryOf(Y,m),req:1}],d=>{S.salaries[k]=Math.max(0,+d.v||0)})}
function editCharge(id){
  const k=key(Y,M),list=S.charges[k]||(S.charges[k]=[]),c=list.find(x=>x.id==id);
  form(c?t("editCharge"):t("newCharge"),[{n:"label",l:t("label"),type:"text",v:c?.label},{n:"cat",type:"select",v:c?.cat||"housing"},{n:"amount",l:t("amount"),type:"number",v:c?.amount,req:1}],
    d=>{const o={cat:d.cat,label:d.label.trim(),amount:Math.max(0,+d.amount||0)};if(c)Object.assign(c,o);else list.push({id:Date.now(),...o})},
    c&&(()=>{S.charges[k]=list.filter(x=>x.id!=id)}));
}

$("#prev").onclick=()=>{if(view==="annual")Y--;else{M--;if(M<0){M=11;Y--}}render()};
$("#next").onclick=()=>{if(view==="annual")Y++;else{M++;if(M>11){M=0;Y++}}render()};
$("#lang").onchange=e=>{S.lang=e.target.value;save();render()};
$("#editSalary").onclick=()=>editSalary(M);
$("#editSavings").onclick=()=>{const k=key(Y,M);form(t("editSavings"),[{n:"v",l:t("amount"),type:"number",v:S.savings[k]||0,req:1}],d=>{S.savings[k]=Math.max(0,+d.v||0)})};
$("#add").onclick=()=>editCharge();
$("#list").onclick=e=>{const b=e.target.closest("button");if(b)editCharge(b.dataset.id)};
$("#copy").onclick=()=>{const p=chargesOf(key(...(M?[Y,M-1]:[Y-1,11])));S.charges[key(Y,M)]=p.map((c,i)=>({...c,id:Date.now()+i}));save();render()};
$("#chart").onclick=e=>{const g=e.target.closest(".pt");if(g){M=+g.dataset.m;render();editSalary(M)}};
$("#chart").onkeydown=e=>{if(e.key==="Enter"){const g=e.target.closest(".pt");if(g){M=+g.dataset.m;editSalary(M)}}};
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});
render();
