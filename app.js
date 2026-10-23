const state = {
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
  current: new Date(2026, 9, 1)
};

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
    </div>`).join(""):`<p style="color:#697586;font-size:14px">Aucune charge pour ce mois.</p>`;
  document.querySelectorAll(".edit").forEach(b=>b.onclick=()=>openCharge(+b.dataset.i));
  document.querySelectorAll(".delete").forEach(b=>b.onclick=()=>{m.charges.splice(+b.dataset.i,1);render()});
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

$("editSalary").onclick=()=>{const m=ensureMonth();$("salaryInput").value=m.salary;$("salaryDialog").showModal()};
$("salaryForm").addEventListener("submit",e=>{if(e.submitter?.value==="ok"){ensureMonth().salary=Math.max(0,Number($("salaryInput").value)||0);render();}});
$("editSaving").onclick=()=>{const m=ensureMonth();$("savingInput").value=m.saving;$("savingDialog").showModal()};
$("savingForm").addEventListener("submit",e=>{if(e.submitter?.value==="ok"){ensureMonth().saving=Math.max(0,Number($("savingInput").value)||0);render();}});
$("addCharge").onclick=()=>openCharge(-1);
function openCharge(i){
  const m=ensureMonth(), c=i>=0?m.charges[i]:{name:"",amount:""};
  $("chargeDialogTitle").textContent=i>=0?"Modifier la charge":"Ajouter une charge";
  $("chargeName").value=c.name;$("chargeAmount").value=c.amount;$("chargeIndex").value=i;
  $("chargeDialog").showModal();setTimeout(()=>$("chargeName").focus(),50);
}
$("chargeForm").addEventListener("submit",e=>{
  if(e.submitter?.value!=="ok")return;
  const m=ensureMonth(), name=$("chargeName").value.trim(), amount=Math.max(0,Number($("chargeAmount").value)||0), i=Number($("chargeIndex").value);
  if(!name)return;
  const icons=["⌂","🛒","🚗","▤","🍴","•••"];
  if(i>=0)m.charges[i]={...m.charges[i],name,amount};else m.charges.push({name,amount,icon:icons[m.charges.length%icons.length]});
  render();
});
$("prevMonth").onclick=()=>{state.current.setMonth(state.current.getMonth()-1);render()};
$("nextMonth").onclick=()=>{state.current.setMonth(state.current.getMonth()+1);render()};
$("saveMonth").onclick=()=>showToast("Mois enregistré");
function showToast(t){const el=$("toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1800)}
render();

function showPage(page){
  const home=$("homePage"), chargesPage=$("chargesPage"), settingsPage=$("settingsPage");
  home.classList.toggle("hidden",page!=="home");
  chargesPage.classList.toggle("hidden",page!=="charges");
  settingsPage.classList.toggle("hidden",page!=="settings");
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  if(page==="charges") renderChargesPage();
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
    </div>`).join(""):`<p style="color:#697586;font-size:14px">Aucune charge pour ce mois.</p>`;
  document.querySelectorAll(".edit-page").forEach(b=>b.onclick=()=>openCharge(+b.dataset.i));
  document.querySelectorAll(".delete-page").forEach(b=>b.onclick=()=>{m.charges.splice(+b.dataset.i,1);render();renderChargesPage()});
}
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.querySelectorAll(".back-btn").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$("addChargePage").onclick=()=>openCharge(-1);
