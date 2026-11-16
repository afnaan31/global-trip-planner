(function () {
"use strict";
const $ = (id) => document.getElementById(id);
const form = $("trip-form");
const currencyMeta = {
 INR:{rates:{budget:[1800,450,350,300],premium:[4500,900,700,700],luxury:[12000,2200,1800,1500]},fuel:105,ticket:1500},
 USD:{rates:{budget:[45,18,12,12],premium:[115,38,30,24],luxury:[300,95,85,55]},fuel:.95,ticket:90},
 GBP:{rates:{budget:[38,16,10,10],premium:[100,35,27,22],luxury:[270,85,75,50]},fuel:1.45,ticket:75},
 EUR:{rates:{budget:[42,17,11,11],premium:[105,36,28,23],luxury:[280,90,78,52]},fuel:1.65,ticket:80},
 AUD:{rates:{budget:[65,25,18,18],premium:[155,55,42,35],luxury:[390,135,115,80]},fuel:1.85,ticket:120},
 CAD:{rates:{budget:[60,23,16,16],premium:[145,50,38,32],luxury:[360,125,105,72]},fuel:1.65,ticket:110},
 JPY:{rates:{budget:[6500,2500,1500,1800],premium:[16000,5500,4000,3500],luxury:[42000,12000,10000,7000]},fuel:175,ticket:12000},
 SGD:{rates:{budget:[85,25,18,18],premium:[190,55,42,38],luxury:[480,140,110,90]},fuel:2.8,ticket:150},
 AED:{rates:{budget:[180,55,35,35],premium:[450,120,90,75],luxury:[1200,300,240,180]},fuel:3,ticket:220},
 CHF:{rates:{budget:[75,28,20,20],premium:[180,65,50,45],luxury:[480,170,140,110]},fuel:1.85,ticket:140},
 NZD:{rates:{budget:[70,27,18,18],premium:[165,58,42,38],luxury:[420,145,110,90]},fuel:2.8,ticket:120},
 THB:{rates:{budget:[1200,450,300,300],premium:[3200,950,700,650],luxury:[9000,2200,1800,1400]},fuel:38,ticket:900},
 IDR:{rates:{budget:[350000,100000,65000,60000],premium:[900000,220000,160000,140000],luxury:[2500000,600000,450000,350000]},fuel:13000,ticket:250000},
 MXN:{rates:{budget:[900,280,180,180],premium:[2300,650,480,400],luxury:[6500,1800,1400,1100]},fuel:25,ticket:1800},
 ZAR:{rates:{budget:[850,260,180,160],premium:[2200,600,450,380],luxury:[6000,1600,1200,950]},fuel:24,ticket:1500}
};
const expenseTypes=[
 {key:"stay",label:"Accommodation",icon:"⌂"},
 {key:"food",label:"Food & dining",icon:"◌"},
 {key:"activities",label:"Activities & experiences",icon:"✳"},
 {key:"transport",label:"Main transport",icon:"↗"},
 {key:"local",label:"Local transport",icon:"⌖"},
 {key:"tolls",label:"Tolls & parking",icon:"▤"}
];
let lastCalculation=null;
let toastTimer=null;

function number(id,fallback){const value=Number($(id).value);return Number.isFinite(value)&&value>=0?value:(fallback||0);}
function formatMoney(value,currencyCode){
 const code=currencyCode||$("currency").value;
 try{return new Intl.NumberFormat(navigator.language||"en",{style:"currency",currency:code,maximumFractionDigits:0}).format(Math.round(value||0));}
 catch(error){return code+" "+Math.round(value||0).toLocaleString();}
}
function currencySymbol(code){
 try{const parts=new Intl.NumberFormat(navigator.language||"en",{style:"currency",currency:code}).formatToParts(1);return parts.find((part)=>part.type==="currency").value;}
 catch(error){return code;}
}
function setCurrencySymbols(){
 const symbol=currencySymbol($("destination-currency").value);
 document.querySelectorAll(".currency-symbol").forEach((node)=>{node.textContent=symbol;});
}
function applySampleRates(){
 const currency=$("destination-currency").value;
 const selected=currencyMeta[currency];
 if(!selected){["stay-rate","food-rate","activity-rate","local-rate","fuel-price","ticket-rate"].forEach((id)=>{$(id).value="";});setCurrencySymbols();showToast("Enter local prices for this currency; no sample preset is available.");return;}
 const rates=selected.rates[$("style").value];
 $("stay-rate").value=rates[0];$("food-rate").value=rates[1];$("activity-rate").value=rates[2];$("local-rate").value=rates[3];
 $("fuel-price").value=selected.fuel;$("ticket-rate").value=selected.ticket;setCurrencySymbols();
}
function setTransportFields(){
 const isCar=$("transport").value==="car";
 $("car-fields").classList.toggle("hidden",!isCar);
 $("other-transport-fields").classList.toggle("hidden",isCar);
}
function calculate(){
 const days=Math.max(1,Math.min(30,Math.round(number("days",3))));
 const travellers=Math.max(1,Math.min(40,Math.round(number("travellers",1))));
 const nights=Math.max(0,days-1);
 const rooms=Math.max(0,Math.min(20,Math.round(number("rooms",Math.ceil(travellers/2)))));
 const transportMode=$("transport").value;
 const stay=nights*rooms*number("stay-rate");
 const food=days*travellers*number("food-rate");
 const activities=days*travellers*number("activity-rate");
 const local=days*number("local-rate");
 let mainTransport=0,tolls=0;
 if(transportMode==="car"){const efficiency=Math.max(.1,number("efficiency",15));mainTransport=(number("distance")/efficiency)*number("fuel-price");tolls=number("tolls");}
 else{mainTransport=travellers*number("ticket-rate");}
 const subtotal=stay+food+activities+mainTransport+local+tolls;
 const buffer=subtotal*.10,total=subtotal+buffer;
 return {days,nights,travellers,rooms,destination:$("destination").value.trim(),origin:$("origin").value.trim(),style:$("style").value,transportMode,tripCurrency:$("destination-currency").value,homeCurrency:$("currency").value,breakdown:{stay,food,activities,transport:mainTransport,local,tolls},subtotal,buffer,total,perPerson:total/travellers,target:number("target-budget")};
}
async function getReferenceRate(from,to){
 if(from===to)return {rate:1,date:null};
 const key="roamora-fx-"+from+"-"+to;
 try{const cached=JSON.parse(localStorage.getItem(key)||"null");if(cached&&cached.rate>0&&cached.date&&(Date.now()-cached.savedAt)<43200000)return cached;}catch(error){}
 const response=await fetch("https://api.frankfurter.dev/v2/rate/"+encodeURIComponent(from)+"/"+encodeURIComponent(to),{headers:{"Accept":"application/json"}});
 if(!response.ok)throw new Error("Reference exchange rate unavailable");
 const data=await response.json();
 if(!Number.isFinite(data.rate)||data.rate<=0||!data.date)throw new Error("Exchange-rate response incomplete");
 const value={rate:data.rate,date:data.date,savedAt:Date.now()};
 try{localStorage.setItem(key,JSON.stringify(value));}catch(error){}
 return value;
}
function displayAmount(value,plan){return plan.fxRate===null?value:value*plan.fxRate;}
function createItinerary(plan){
 const host=$("itinerary-list");host.innerHTML="";
 for(let day=1;day<=plan.days;day++){
  let title="Explore "+plan.destination;
  let detail="Choose one main experience, leave room for a relaxed meal and keep travel between stops realistic.";
  if(plan.days===1){title="One-day escape";detail="Travel to "+plan.destination+", enjoy one or two priority experiences, then return with time to spare.";}
  else if(day===1){title="Arrive & settle in";detail="Travel from "+plan.origin+", check in and explore nearby at an easy pace.";}
  else if(day===plan.days){title="A slow morning & return";detail="Enjoy breakfast, check out and allow a sensible return-travel buffer.";}
  else if(day===2){title="Discover the highlights";detail="Plan your main sightseeing or outdoor experience. Keep a backup option for weather or closures.";}
  else if(day===plan.days-1){title="A little more exploring";detail="Choose a quieter neighbourhood, local food stop or activity you have not tried yet.";}
  const item=document.createElement("div");item.className="itinerary-day";
  const chip=document.createElement("span");chip.className="day-chip";chip.textContent="DAY "+String(day).padStart(2,"0");
  const content=document.createElement("div");
  const heading=document.createElement("strong");heading.textContent=title;
  const text=document.createElement("p");text.textContent=detail;
  content.append(heading,text);item.append(chip,content);host.appendChild(item);
 }
}
function showBreakdown(plan){
 const host=$("cost-breakdown");host.innerHTML="";
 const maxValue=Math.max.apply(null,Object.keys(plan.breakdown).map((key)=>plan.breakdown[key]).concat([1]));
 expenseTypes.forEach((item)=>{
  const value=plan.breakdown[item.key],row=document.createElement("div");row.className="breakdown-row";
  const icon=document.createElement("span");icon.className="breakdown-icon";icon.textContent=item.icon;
  const main=document.createElement("div");main.className="breakdown-main";
  const label=document.createElement("span");label.textContent=item.label;
  const track=document.createElement("div");track.className="breakdown-track";
  const fill=document.createElement("i");fill.style.width=Math.max(value>0?3:0,(value/maxValue)*100)+"%";
  track.appendChild(fill);main.append(label,track);
  const amount=document.createElement("strong");amount.textContent=formatMoney(displayAmount(value,plan),plan.displayCurrency);
  row.append(icon,main,amount);host.appendChild(row);
 });
}
async function renderResults(plan){
 const note=$("fx-note");plan.fxRate=1;plan.fxDate=null;plan.displayCurrency=plan.homeCurrency;
 if(plan.tripCurrency!==plan.homeCurrency){
  note.textContent="Loading a dated reference exchange rate…";
  try{const fx=await getReferenceRate(plan.tripCurrency,plan.homeCurrency);plan.fxRate=fx.rate;plan.fxDate=fx.date;}
  catch(error){plan.fxRate=null;plan.displayCurrency=plan.tripCurrency;}
 }
 lastCalculation=plan;$("results").classList.remove("hidden");
 $("total-cost").textContent=formatMoney(displayAmount(plan.total,plan),plan.displayCurrency);
 $("per-person").textContent=formatMoney(displayAmount(plan.perPerson,plan),plan.displayCurrency);
 $("total-subtitle").textContent=plan.travellers+" traveller"+(plan.travellers===1?"":"s")+" · "+plan.days+" day"+(plan.days===1?"":"s")+" · "+plan.destination;
 if(plan.tripCurrency===plan.homeCurrency)note.textContent="Entered and displayed in "+plan.tripCurrency+". Sample cost assumptions are not live quotes.";
 else if(plan.fxRate!==null)note.textContent="Entered in "+plan.tripCurrency+" · converted to "+plan.homeCurrency+" at "+plan.fxRate.toFixed(5)+" ("+plan.fxDate+"). Daily reference rate, not a bank/card quote.";
 else note.textContent="Exchange-rate service unavailable. Showing totals in "+plan.tripCurrency+"; budget comparison paused until conversion is available.";
 $("buffer-cost").textContent=formatMoney(displayAmount(plan.buffer,plan),plan.displayCurrency);
 $("rooms").value=plan.rooms;
 $("cost-assumption").textContent=plan.rooms+" room"+(plan.rooms===1?"":"s")+" × "+plan.nights+" night"+(plan.nights===1?"":"s")+". Costs entered in "+plan.tripCurrency+" and displayed in "+plan.displayCurrency+".";
 const status=$("budget-status");status.className="budget-status";
 if(plan.fxRate===null&&plan.tripCurrency!==plan.homeCurrency)status.textContent="Budget check needs FX";
 else if(plan.target<=0)status.textContent="Budget not set";
 else{const shown=displayAmount(plan.total,plan);if(shown<=plan.target){status.textContent="Within target by "+formatMoney(plan.target-shown,plan.homeCurrency);status.classList.add("within");}else{status.textContent="Over target by "+formatMoney(shown-plan.target,plan.homeCurrency);status.classList.add("over");}}
 showBreakdown(plan);createItinerary(plan);$("results").scrollIntoView({behavior:"smooth",block:"start"});
}
function makePlanText(plan){
 const code=plan.displayCurrency;
 const lines=["ROAMORA TRIP PLAN","Route: "+plan.origin+" → "+plan.destination,"Duration: "+plan.days+" days ("+plan.nights+" nights)","Travellers: "+plan.travellers,"Style: "+plan.style,"Spending currency: "+plan.tripCurrency,"Display currency: "+code,""];
 expenseTypes.forEach((item)=>lines.push(item.label+": "+formatMoney(displayAmount(plan.breakdown[item.key],plan),code)));
 lines.push("Contingency (10%): "+formatMoney(displayAmount(plan.buffer,plan),code),"Estimated total: "+formatMoney(displayAmount(plan.total,plan),code),"Per person: "+formatMoney(displayAmount(plan.perPerson,plan),code));
 if(plan.fxDate)lines.push("Reference FX date: "+plan.fxDate);
 lines.push("","DAILY OUTLINE");
 for(let day=1;day<=plan.days;day++){let activity="Explore "+plan.destination+" at a comfortable pace.";if(plan.days===1)activity="One-day escape and return.";else if(day===1)activity="Travel, check in and explore nearby.";else if(day===plan.days)activity="Slow morning, check out and return.";lines.push("Day "+day+": "+activity);}
 lines.push("","Planning estimate only. Sample rates are not live quotes or confirmed bookings.");
 return lines.join("\n");
}
function showToast(message){const toast=$("toast");toast.textContent=message;toast.classList.add("show");window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>toast.classList.remove("show"),2600);}

form.addEventListener("submit",async(event)=>{
 event.preventDefault();if(!form.reportValidity())return;
 const button=form.querySelector('button[type="submit"]'),label=button.innerHTML;
 button.disabled=true;button.textContent="Calculating your trip…";
 try{await renderResults(calculate());}finally{button.disabled=false;button.innerHTML=label;}
});
$("style").addEventListener("change",applySampleRates);
$("destination-currency").addEventListener("change",applySampleRates);
$("currency").addEventListener("change",()=>{setCurrencySymbols();});
$("transport").addEventListener("change",setTransportFields);
$("reset-rates").addEventListener("click",()=>{applySampleRates();showToast("Sample cost assumptions reset.");});
$("recalculate-rooms").addEventListener("click",async()=>{if(!lastCalculation)return;await renderResults(calculate());showToast("Stay estimate updated.");});
$("copy-plan").addEventListener("click",async()=>{
 if(!lastCalculation)return;const text=makePlanText(lastCalculation);
 try{await navigator.clipboard.writeText(text);showToast("Trip plan copied.");}
 catch(error){const helper=document.createElement("textarea");helper.value=text;document.body.appendChild(helper);helper.select();document.execCommand("copy");helper.remove();showToast("Trip plan copied.");}
});
$("print-plan").addEventListener("click",()=>window.print());
document.querySelectorAll("[data-destination]").forEach((button)=>button.addEventListener("click",()=>{
 $("destination").value=button.dataset.destination;$("planner").scrollIntoView({behavior:"smooth"});$("destination").focus({preventScroll:true});
}));
$("year").textContent=new Date().getFullYear();applySampleRates();setTransportFields();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
})();