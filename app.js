
const translations = {
  fr: {
    home:"Accueil", annual:"Salaire annuel", monthlySalary:"Salaire du mois",
    totalCharges:"Total des charges", savings:"Épargne", remaining:"Reste",
    salaryDistribution:"Répartition du salaire", salary:"Salaire", myCharges:"Mes charges",
    add:"+ Ajouter", monthlySavings:"Épargne mensuelle", saveMonth:"Enregistrer le mois",
    annualTotalLabel:"Salaire cumulé", monthlyAverage:"Moyenne mensuelle",
    monthByMonth:"Salaires mois par mois", salaryEvolution:"Évolution du salaire",
    addSalaries:"Ajoute tes salaires", cancel:"Annuler", save:"Enregistrer",
    addCharge:"Ajouter une charge", editCharge:"Modifier la charge", name:"Nom",
    amount:"Montant (€)", monthSaved:"Mois enregistré", noCharges:"Aucune charge pour ce mois."
  },
  en: {
    home:"Home", annual:"Annual salary", monthlySalary:"Monthly salary",
    totalCharges:"Total expenses", savings:"Savings", remaining:"Remaining",
    salaryDistribution:"Salary breakdown", salary:"Salary", myCharges:"My expenses",
    add:"+ Add", monthlySavings:"Monthly savings", saveMonth:"Save month",
    annualTotalLabel:"Total salary", monthlyAverage:"Monthly average",
    monthByMonth:"Salary by month", salaryEvolution:"Salary evolution",
    addSalaries:"Add your salaries", cancel:"Cancel", save:"Save",
    addCharge:"Add an expense", editCharge:"Edit expense", name:"Name",
    amount:"Amount (€)", monthSaved:"Month saved", noCharges:"No expenses for this month."
  }
};
function currentLang(){return localStorage.getItem("budgetLanguage")||"fr";}
function t(key){return translations[currentLang()][key]||translations.fr[key]||key;}
function applyLanguage(){
  const lang=currentLang();
  $("languageSelect").value=lang;
  document.documentElement.lang=lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key=el.dataset.i18n;
    if(translations[lang][key]) el.textContent=translations[lang][key];
  });
  $("monthTitle").textContent=monthName(state.current).replace(/^./,x=>x.toUpperCase());
  if($("chargeDialogTitle")) $("chargeDialogTitle").textContent=t("addCharge");
  document.querySelectorAll('button[value="cancel"]').forEach(b=>b.textContent=t("cancel"));
  document.querySelectorAll('button[value="ok"]').forEach(b=>{
    b.textContent = $("chargeDialog")?.open ? t("save") : "Valider";
  });
  if($("chargeName")) $("chargeName").placeholder="";
  render();
  applyLanguage();
}
$("languageSelect").addEventListener("change",e=>{
  localStorage.setItem("budgetLanguage",e.target.value);
  applyLanguage();
});

const savedBudget = JSON.parse(localStorage.getItem("monBudgetData") || "null");
const state = savedBudget || {
  months: {
    "2026-10": {
      salary: 2400,
      saving: 400,
      charges: [
        {name:"Logement", amount:850, icon:"⌂"},
        {name:"Courses", amount:250, icon:"🛒"},
        {name:"Transport", amount:120, icon:"🚗"},
        {name:"Abonnements", amount:90, icon:"▤"},
        {name:"Loisirs", amount:200, icon:"🍴"},
        {name:"Autres", amount:180, icon:"•••"}
      ]
    }
  },
  current: "2026-10"
};
state.current = new Date(state.current);
function persist(){localStorage.setItem("monBudgetData",JSON.stringify({months:state.months,current:keyOf(state.current)}));}

const fmt = n => new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.max(0,n)) + " €";
const keyOf = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const monthName = d => d.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
const $ = id => document.getElementById(id);

function ensureMonth(){
  const k=keyOf(state.current);
  if(!state.months[k]) state.months[k]={salary:0,saving:0,charges:[]};
  return state.months[k];
}
function totalCharges(){return ensureMonth().charges.reduce((s,c)=>s+Number(c.amount||0),0)}
function remaining(){const m=ensureMonth();return Math.max(0,m.salary-totalCharges()-m.saving)}
function render(){
  const m=ensureMonth(), charges=totalCharges(), rest=remaining();
  $("monthTitle").textContent=monthName(state.current).replace(/^./,x=>x.toUpperCase());
  $("salaryDisplay").textContent=fmt(m.salary);
  $("chargesDisplay").textContent=fmt(charges);
  $("savingDisplay").textContent=fmt(m.saving);
  $("savingRowDisplay").textContent=fmt(m.saving);
  $("remainingDisplay").textContent=fmt(rest);
  $("donutAmount").textContent=fmt(m.salary);
  renderDonut(m,charges,rest);
  renderCharges(m);
  if(!$("chargesPage").classList.contains("hidden")) renderChargesPage();
  if(!$("annualPage").classList.contains("hidden")) renderAnnual();
}
function renderDonut(m,charges,rest){
  const parts=[...m.charges.map(c=>({name:c.name,value:Number(c.amount),color:""})),{name:"Épargne",value:Number(m.saving),color:""}];
  if(rest>0) parts.push({name:"Reste",value:rest});
  const colors=["#f39a19","#1677ee","#14a875","#7655e8","#ef3155","#94a3b8","#0ea5e9","#f97316"];
  const total=Math.max(1,m.salary);
  let start=0, stops=[];
  parts.forEach((p,i)=>{const end=start+(p.value/total)*360;stops.push(`${colors[i%colors.length]} ${start}deg ${end}deg`);start=end});
  $("donut").style.background=`conic-gradient(${stops.join(",")})`;
  $("percentLabel").textContent = m.salary ? `${Math.round((charges+m.saving+rest)/m.salary*100)} %` : "0 %";
  $("legend").innerHTML=parts.filter(p=>p.value>0).map((p,i)=>`
    <div class="legend-row"><span class="dot" style="background:${colors[i%colors.length]}"></span>
    <span>${escapeHtml(p.name)}</span><strong>${fmt(p.value)}</strong><span class="pct">${Math.round(p.value/total*100)} %</span></div>`).join("");
}
function renderCharges(m){
  $("chargesList").innerHTML=m.charges.length?m.charges.map((c,i)=>`
    <div class="charge">
      <span class="charge-icon">${c.icon||"•"}</span>
      <span class="charge-name">${escapeHtml(c.name)}</span>
      <strong class="charge-amount">${fmt(c.amount)}</strong>
      <span><button class="mini edit" data-i="${i}" aria-label="Modifier">✎</button><button class="mini delete" data-i="${i}" aria-label="Supprimer">⌫</button></span>
    </div>`).join(""):`<p style="color:#697586;font-size:14px">${t("noCharges")}</p>`;
  document.querySelectorAll(".edit").forEach(b=>b.onclick=()=>openCharge(+b.dataset.i));
  document.querySelectorAll(".delete").forEach(b=>b.onclick=()=>{m.charges.splice(+b.dataset.i,1);persist();render()});
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

$("editSalary").onclick=()=>{const m=ensureMonth();$("salaryInput").value=m.salary;$("salaryDialog").showModal()};
$("salaryForm").addEventListener("submit",e=>{if(e.submitter?.value==="ok"){ensureMonth().salary=Math.max(0,Number($("salaryInput").value)||0);persist();render();}});
$("editSaving").onclick=()=>{const m=ensureMonth();$("savingInput").value=m.saving;$("savingDialog").showModal()};
$("savingForm").addEventListener("submit",e=>{if(e.submitter?.value==="ok"){ensureMonth().saving=Math.max(0,Number($("savingInput").value)||0);persist();render();}});
$("addCharge").onclick=()=>openCharge(-1);
function openCharge(i){
  const m=ensureMonth(), c=i>=0?m.charges[i]:{name:"",amount:""};
  $("chargeDialogTitle").textContent=i>=0?t("editCharge"):t("addCharge");
  $("chargeName").value=c.name;$("chargeAmount").value=c.amount;$("chargeIndex").value=i;
  $("chargeDialog").showModal();setTimeout(()=>$("chargeName").focus(),50);
}
$("chargeForm").addEventListener("submit",e=>{
  if(e.submitter?.value!=="ok")return;
  const m=ensureMonth(), name=$("chargeName").value.trim(), amount=Math.max(0,Number($("chargeAmount").value)||0), i=Number($("chargeIndex").value);
  if(!name)return;
  const icons=["⌂","🛒","🚗","▤","🍴","•••"];
  if(i>=0)m.charges[i]={...m.charges[i],name,amount};else m.charges.push({name,amount,icon:icons[m.charges.length%icons.length]});
  persist(); render();
});
$("prevMonth").onclick=()=>{state.current.setMonth(state.current.getMonth()-1);persist();render()};
$("nextMonth").onclick=()=>{state.current.setMonth(state.current.getMonth()+1);persist();render()};
$("saveMonth").onclick=()=>showToast(t("monthSaved"));
function showToast(t){const el=$("toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1800)}
render();

function showPage(page){
  const home=$("homePage"), chargesPage=$("chargesPage"), annualPage=$("annualPage");
  home.classList.toggle("hidden",page!=="home");
  chargesPage.classList.toggle("hidden",page!=="charges");
  annualPage.classList.toggle("hidden",page!=="annual");
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  if(page==="charges") renderChargesPage();
  if(page==="annual") renderAnnual();
  window.scrollTo(0,0);
}
function renderChargesPage(){
  const m=ensureMonth(), total=totalCharges();
  $("chargesPageTotal").textContent=fmt(total);
  $("chargesPageList").innerHTML=m.charges.length?m.charges.map((c,i)=>`
    <div class="charge">
      <span class="charge-icon">${c.icon||"•"}</span>
      <span class="charge-name">${escapeHtml(c.name)}</span>
      <strong class="charge-amount">${fmt(c.amount)}</strong>
      <span><button class="mini edit-page" data-i="${i}" aria-label="Modifier">✎</button><button class="mini delete-page" data-i="${i}" aria-label="Supprimer">⌫</button></span>
    </div>`).join(""):`<p style="color:#697586;font-size:14px">${t("noCharges")}</p>`;
  document.querySelectorAll(".edit-page").forEach(b=>b.onclick=()=>openCharge(+b.dataset.i));
  document.querySelectorAll(".delete-page").forEach(b=>b.onclick=()=>{m.charges.splice(+b.dataset.i,1);persist();render();renderChargesPage()});
}

function annualData(){
  const year=state.current.getFullYear();
  const rows=[];
  for(let i=0;i<12;i++){
    const d=new Date(year,i,1), k=keyOf(d), m=state.months[k];
    rows.push({label:d.toLocaleDateString("fr-FR",{month:"short"}).replace(".",""),value:m?Number(m.salary||0):0});
  }
  return rows;
}
function renderAnnual(){
  const rows=annualData(), filled=rows.filter(r=>r.value>0);
  const total=rows.reduce((s,r)=>s+r.value,0), avg=filled.length?total/filled.length:0;
  $("annualYear").textContent=state.current.getFullYear();
  $("annualTotal").textContent=fmt(total);
  $("annualAverage").textContent=fmt(avg);
  if(filled.length>1){
    const delta=filled[filled.length-1].value-filled[0].value;
    $("salaryEvolution").textContent=(delta>=0?"+":"")+fmt(delta)+" depuis le début";
  } else $("salaryEvolution").textContent=t("addSalaries");
  const max=Math.max(1,...rows.map(r=>r.value));
  $("salaryBars").innerHTML=rows.map(r=>`
    <div class="bar-col">
      ${r.value?`<span class="bar-value">${Math.round(r.value)} €</span>`:""}
      <div class="bar" style="height:${r.value?Math.max(3,(r.value/max)*180):2}px;opacity:${r.value?1:.16}"></div>
      <span class="bar-label">${escapeHtml(r.label)}</span>
    </div>`).join("");
  renderSalaryLine(rows,max);
}
function renderSalaryLine(rows,max){
  const svg=$("salaryLineSvg");
  const points=rows.map((r,i)=>({x:12+i*(336/11),y:170-(r.value/max)*135,label:r.label}));
  svg.innerHTML=`
    <line class="line-grid" x1="10" y1="35" x2="350" y2="35"/>
    <line class="line-grid" x1="10" y1="100" x2="350" y2="100"/>
    <line class="line-grid" x1="10" y1="170" x2="350" y2="170"/>
    <polyline class="line-path" points="${points.map(p=>`${p.x},${p.y}`).join(" ")}"/>
    ${points.map(p=>`<circle class="line-dot" cx="${p.x}" cy="${p.y}" r="4"/>`).join("")}
    ${points.map(p=>`<text class="line-text" x="${p.x}" y="187" text-anchor="middle">${escapeHtml(p.label)}</text>`).join("")}`;
}

document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.querySelectorAll(".back-btn").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$("addChargePage").onclick=()=>openCharge(-1);

applyLanguage();
