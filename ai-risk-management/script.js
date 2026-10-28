const KEY="ai-risk-register-v1";
const SAMPLE=[
 {id:1,title:"Model gives biased hiring recommendations",cat:"Bias & fairness",owner:"Data science",l:4,i:5,mit:"Audit outcomes by group every quarter; add human review.",status:"Mitigating"},
 {id:2,title:"Personal data leaks through model outputs",cat:"Privacy",owner:"Security",l:3,i:5,mit:"Remove personal data from training sets; filter outputs.",status:"Open"},
 {id:3,title:"Prompt injection overrides system rules",cat:"Security",owner:"Platform",l:4,i:4,mit:"Isolate untrusted input; limit tool permissions.",status:"Open"},
 {id:4,title:"Chatbot states wrong facts to customers",cat:"Accuracy",owner:"Product",l:4,i:3,mit:"Ground answers in approved documents; show sources.",status:"Mitigating"},
 {id:5,title:"Model accuracy drifts as data changes",cat:"Reliability",owner:"ML ops",l:3,i:3,mit:"Monitor accuracy weekly; retrain on schedule.",status:"Open"},
 {id:6,title:"System breaks new AI regulation",cat:"Compliance",owner:"Legal",l:2,i:5,mit:"Map the system to applicable rules; keep documentation.",status:"Open"},
 {id:7,title:"Vendor API outage halts the service",cat:"Reliability",owner:"Platform",l:2,i:3,mit:"Add a fallback provider.",status:"Resolved"}
];
const STATUS=["Open","Mitigating","Resolved"];
let risks=load();

function load(){try{const s=localStorage.getItem(KEY);if(s)return JSON.parse(s)}catch(e){}return structuredClone(SAMPLE)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(risks))}catch(e){}}
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function level(score){return score>=15?"Critical":score>=10?"High":score>=5?"Medium":"Low"}
const COLOR={Critical:"var(--crit)",High:"var(--high)",Medium:"var(--med)",Low:"var(--low)"};

["lik","imp"].forEach(id=>{$(id).innerHTML=[1,2,3,4,5].map(n=>`<option value="${n}">${n}</option>`).join("");$(id).value=3});
function preview(){const s=$("lik").value*$("imp").value,lv=level(s);
  $("preview").innerHTML=`Score ${s} → <span class="badge" style="--c:${COLOR[lv]}">${lv}</span>`}
$("lik").onchange=$("imp").onchange=preview;preview();

$("add").onclick=()=>{
  const title=$("title").value.trim();
  if(!title){$("title").focus();$("title").placeholder="Enter a risk title to continue";return}
  risks.push({id:Date.now(),title,cat:$("cat").value,owner:$("owner").value.trim()||"Unassigned",
    l:+$("lik").value,i:+$("imp").value,mit:$("mit").value.trim()||"No mitigation yet",status:"Open"});
  $("title").value="";$("mit").value="";$("owner").value="";save();render();
};
$("reset").onclick=()=>{risks=structuredClone(SAMPLE);save();render()};
$("fLevel").onchange=$("fStatus").onchange=render;

function remove(id){risks=risks.filter(r=>r.id!==id);save();render()}
function cycle(id){const r=risks.find(r=>r.id===id);r.status=STATUS[(STATUS.indexOf(r.status)+1)%3];save();render()}

$("csv").onclick=()=>{
  const q=v=>`"${String(v).replace(/"/g,'""')}"`;
  const lines=[["Risk","Category","Owner","Likelihood","Impact","Score","Level","Mitigation","Status"].join(",")]
    .concat(risks.map(r=>[r.title,r.cat,r.owner,r.l,r.i,r.l*r.i,level(r.l*r.i),r.mit,r.status].map(q).join(",")));
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([lines.join("\n")],{type:"text/csv"}));
  a.download="ai-risk-register.csv";a.click();
};

function render(){
  const all=risks.map(r=>({...r,s:r.l*r.i,lv:level(r.l*r.i)})).sort((a,b)=>b.s-a.s);
  // stats (open + mitigating only)
  const live=all.filter(r=>r.status!=="Resolved");
  $("stats").innerHTML=["Critical","High","Medium","Low"].map(l=>
    `<div class="stat" style="--c:${COLOR[l]}"><b>${live.filter(r=>r.lv===l).length}</b><span>${l} (unresolved)</span></div>`).join("");
  // table
  const fl=$("fLevel").value,fs=$("fStatus").value;
  const shown=all.filter(r=>(!fl||r.lv===fl)&&(!fs||r.status===fs));
  $("rows").innerHTML=shown.map(r=>`<tr>
    <td><strong>${esc(r.title)}</strong><div class="mit">${esc(r.cat)} · ${esc(r.owner)}</div></td>
    <td><span class="badge" style="--c:${COLOR[r.lv]}">${r.s} ${r.lv}</span><div class="mit">L${r.l} × I${r.i}</div></td>
    <td class="mit">${esc(r.mit)}</td>
    <td><button class="link" onclick="cycle(${r.id})" title="Change status">${r.status}</button></td>
    <td><button class="link" onclick="remove(${r.id})" aria-label="Delete risk">Delete</button></td></tr>`).join("");
  $("empty").hidden=shown.length>0;
  // heat map
  let h="";
  for(let i=5;i>=1;i--){
    h+=`<div class="axis">${i}</div>`;
    for(let l=1;l<=5;l++){
      const n=live.filter(r=>r.l===l&&r.i===i).length;
      h+=`<div class="cell" style="background:${COLOR[level(l*i)]}" title="Likelihood ${l}, impact ${i}">${n||""}</div>`;
    }
  }
  h+=`<div></div><div class="axisx">Likelihood →</div>`;
  $("heat").innerHTML=h;
}
render();
