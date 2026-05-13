import { useState, useEffect, useRef } from "react";
import { logMeal, logWeight, saveOnboarding } from "./firebase/services";

const T = {
  pageBg:"#F4F6F4", cardBg:"#FFFFFF", inputBg:"#F2F4F2",
  primary:"#1E4D2B", primaryMid:"#2D6A3F", primarySoft:"#E6F0E9", primaryMint:"#4CAF72",
  textDark:"#1A1A1A", textMid:"#444444", textMuted:"#888888", textLight:"#BBBBBB",
  border:"#E8EBE8", borderMid:"#D4DAD4",
  gold:"#F5A623", blue:"#4A90D9", red:"#E05252", white:"#FFFFFF",
};

(() => {
  if (document.getElementById("nouri-fonts")) return;
  const fl = document.createElement("link"); fl.id = "nouri-fonts"; fl.rel = "stylesheet";
  fl.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap";
  document.head.appendChild(fl);
  const se = document.createElement("style"); se.id = "nouri-styles";
  se.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:0;}
    @keyframes fadeUp  {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
    @keyframes blink   {0%,80%,100%{opacity:.2}40%{opacity:1}}
    @keyframes pulse   {0%{transform:scale(1);opacity:.6}100%{transform:scale(1.5);opacity:0}}
    @keyframes spin    {to{transform:rotate(360deg)}}
    @keyframes vp      {0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
    .rh:hover{background:${T.primarySoft}!important;border-color:#4CAF7244!important;}
    .chip:hover{background:${T.primarySoft}!important;border-color:#4CAF72!important;color:${T.primary}!important;}
    .qa:hover{transform:scale(1.04);} .qa:active{transform:scale(0.95);}
    .tab:active{opacity:.7;}
    .obopt:hover{border-color:${T.primary}!important;background:${T.primarySoft}!important;}
    .ghost:hover{background:${T.primarySoft}!important;}
  `;
  document.head.appendChild(se);
})();

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const WD = ["M","T","W","T","F","S","S"];

const WEEK_PLAN = {
  Mon:{label:"Monday",meals:[
    {type:"Breakfast",name:"Oats with banana & almond",       kcal:450,protein:15,cost:800, time:"7:00 AM",emoji:"🥣",tag:"Low Cal",    logged:true},
    {type:"Lunch",    name:"Grilled chicken with jollof rice",kcal:650,protein:40,cost:1800,time:"1:00 PM",emoji:"🍛",tag:"High Protein",logged:true},
    {type:"Dinner",   name:"Afang soup with pounded yam",     kcal:550,protein:38,cost:1500,time:"7:30 PM",emoji:"🫕",tag:"Nigerian",   logged:false},
  ]},
  Tue:{label:"Tuesday",meals:[
    {type:"Breakfast",name:"Akara & pap (ogi)",               kcal:380,protein:12,cost:600, time:"7:00 AM",emoji:"🫓",tag:"Nigerian",   logged:false},
    {type:"Lunch",    name:"Jollof rice & fried plantain",    kcal:680,protein:22,cost:1400,time:"1:00 PM",emoji:"🍚",tag:"Classic",    logged:false},
    {type:"Dinner",   name:"Efo riro with semovita",          kcal:490,protein:30,cost:1200,time:"7:30 PM",emoji:"🥬",tag:"High Protein",logged:false},
  ]},
  Wed:{label:"Wednesday",meals:[
    {type:"Breakfast",name:"Boiled yam & egg sauce",          kcal:520,protein:18,cost:700, time:"7:00 AM",emoji:"🍳",tag:"Filling",    logged:false},
    {type:"Lunch",    name:"Moi moi & fish stew",             kcal:440,protein:28,cost:1300,time:"1:00 PM",emoji:"🟤",tag:"Nigerian",   logged:false},
    {type:"Dinner",   name:"Pepper soup with assorted meat",  kcal:380,protein:42,cost:2000,time:"7:30 PM",emoji:"🍲",tag:"Low Cal",    logged:false},
  ]},
  Thu:{label:"Thursday",meals:[
    {type:"Breakfast",name:"Smoothie bowl with tiger nuts",   kcal:320,protein:10,cost:900, time:"7:00 AM",emoji:"🥤",tag:"Light",      logged:false},
    {type:"Lunch",    name:"Ofada rice & ayamase stew",       kcal:720,protein:35,cost:1600,time:"1:00 PM",emoji:"🍛",tag:"Nigerian",   logged:false},
    {type:"Dinner",   name:"Grilled tilapia & ukazi soup",    kcal:420,protein:44,cost:2200,time:"7:30 PM",emoji:"🐟",tag:"High Protein",logged:false},
  ]},
  Fri:{label:"Friday",meals:[
    {type:"Breakfast",name:"Plantain pancakes & honey",       kcal:410,protein:9, cost:700, time:"7:00 AM",emoji:"🥞",tag:"Weekend",    logged:false},
    {type:"Lunch",    name:"Suya skewers & coleslaw",         kcal:580,protein:48,cost:2500,time:"1:00 PM",emoji:"🍢",tag:"Grilled",    logged:false},
    {type:"Dinner",   name:"Egusi soup with fufu",            kcal:620,protein:32,cost:1400,time:"7:30 PM",emoji:"🫕",tag:"Nigerian",   logged:false},
  ]},
  Sat:{label:"Saturday",meals:[
    {type:"Breakfast",name:"Fried eggs, toast & avocado",     kcal:490,protein:22,cost:1000,time:"8:30 AM",emoji:"🥑",tag:"Weekend",    logged:false},
    {type:"Lunch",    name:"Nkwobi & mocktail",               kcal:540,protein:30,cost:3000,time:"2:00 PM",emoji:"🫙",tag:"Nigerian",   logged:false},
    {type:"Dinner",   name:"Banga soup with starch",          kcal:590,protein:28,cost:1500,time:"8:00 PM",emoji:"🍲",tag:"Delta",      logged:false},
  ]},
  Sun:{label:"Sunday",meals:[
    {type:"Breakfast",name:"Tuwo shinkafa & miyan kuka",      kcal:460,protein:16,cost:800, time:"9:00 AM",emoji:"🥣",tag:"Northern",   logged:false},
    {type:"Lunch",    name:"Ogbono soup & pounded yam",       kcal:630,protein:34,cost:1600,time:"2:00 PM",emoji:"🫕",tag:"Nigerian",   logged:false},
    {type:"Dinner",   name:"Grilled chicken & garden salad",  kcal:420,protein:46,cost:1800,time:"7:30 PM",emoji:"🥗",tag:"Light",      logged:false},
  ]},
};

const TC = {
  "High Protein":{bg:"#E8F5E9",text:"#2E7D32"}, "Low Cal":{bg:"#E3F2FD",text:"#1565C0"},
  "Nigerian":    {bg:"#FFF3E0",text:"#E65100"}, "Classic":{bg:"#F3E5F5",text:"#6A1B9A"},
  "Grilled":     {bg:"#FCE4EC",text:"#AD1457"}, "Light":  {bg:"#E0F7FA",text:"#00695C"},
  "Filling":     {bg:"#FFF8E1",text:"#F57F17"}, "Weekend":{bg:"#EDE7F6",text:"#4527A0"},
  "Delta":       {bg:"#E8F5E9",text:"#1B5E20"}, "Northern":{bg:"#FBE9E7",text:"#BF360C"},
};

const FOODS_DB = [
  {name:"Jollof rice",      kcal:320,protein:8, emoji:"🍚",per:"1 cup"},
  {name:"Pounded yam",      kcal:280,protein:3, emoji:"🫕",per:"medium ball"},
  {name:"Fried plantain",   kcal:150,protein:1, emoji:"🍌",per:"3 pieces"},
  {name:"Egusi soup",       kcal:380,protein:18,emoji:"🥣",per:"1 cup"},
  {name:"Grilled chicken",  kcal:220,protein:35,emoji:"🍗",per:"1 piece"},
  {name:"Boiled eggs",      kcal:155,protein:13,emoji:"🥚",per:"2 eggs"},
  {name:"Moi moi",          kcal:180,protein:10,emoji:"🟤",per:"1 wrap"},
  {name:"Akara",            kcal:120,protein:5, emoji:"🫓",per:"3 pieces"},
  {name:"Oats with fruits", kcal:380,protein:12,emoji:"🥣",per:"1 bowl"},
  {name:"Suya",             kcal:280,protein:32,emoji:"🍢",per:"1 skewer"},
  {name:"Efo riro",         kcal:210,protein:14,emoji:"🥬",per:"1 cup"},
  {name:"Beans porridge",   kcal:310,protein:16,emoji:"🫘",per:"1 bowl"},
];

const RECIPES_DB = {
  "Afang soup with pounded yam":{
    steps:[
      {title:"Season meat",      desc:"Wash goat meat, season with salt, pepper, onion slices, 2 seasoning cubes. Rest 10 mins.",min:10},
      {title:"Cook meat",        desc:"Add 2 cups water, cook on medium until tender ~25 mins. Reserve stock.",min:25},
      {title:"Fry pepper base",  desc:"Blend tomatoes and red pepper. Fry in palm oil 5 mins until reduced.",min:5},
      {title:"Add seafood",      desc:"Add stockfish, dry fish, crayfish. Stir and simmer 3 mins.",min:3},
      {title:"Add vegetables",   desc:"Add afang (ukazi) and waterleaf. Stir gently, simmer 4 mins — don't overcook.",min:4},
      {title:"Pounded yam",      desc:"Boil yam cubes until soft ~15 mins. Pound until smooth and stretchy. Serve alongside.",min:15},
    ],
    ingredients:["Afang/ukazi leaves — 150g","Waterleaf — 100g","Goat meat — 200g","Stockfish — 1 piece","Dry fish — 1 piece","Palm oil — 3 tbsp","Crayfish — 1 tbsp","Red pepper — 2","Onion — 1","Yam — 300g","Salt & seasoning cubes"],
    tip:"Don't add extra water when adding vegetables — afang releases its own moisture.",
  },
  default:{
    steps:[
      {title:"Prep ingredients", desc:"Wash and chop all vegetables. Season proteins with salt, pepper, and spices.",min:10},
      {title:"Heat oil",         desc:"Heat palm oil or vegetable oil over medium heat until hot.",min:3},
      {title:"Fry base",         desc:"Fry onions until translucent, add blended pepper. Cook until reduced.",min:8},
      {title:"Add protein",      desc:"Add seasoned meat or fish. Stir and cook 5 mins.",min:5},
      {title:"Season & simmer",  desc:"Add crayfish, seasoning cubes, salt to taste. Add stock and simmer.",min:15},
      {title:"Finish & serve",   desc:"Adjust seasoning, add remaining ingredients, and serve hot.",min:5},
    ],
    ingredients:["Main protein — 200g","Palm oil — 2–3 tbsp","Onion — 1","Tomatoes — 2","Red pepper — to taste","Crayfish — 1 tbsp","Seasoning cubes — 2","Salt — to taste"],
    tip:"Always taste and adjust seasoning at the end before serving.",
  },
};

const BUDGET_MEALS = [
  {name:"Beans porridge & plantain",kcal:510,cost:1200,protein:22,emoji:"🫘",tag:"Budget Pick"},
  {name:"Egg & veggie sauce",       kcal:380,cost:900, protein:18,emoji:"🍳",tag:"Quick"},
  {name:"Chicken & jollof rice",    kcal:620,cost:1800,protein:40,emoji:"🍛",tag:"Filling"},
  {name:"Moi moi with ogi",         kcal:350,cost:700, protein:14,emoji:"🟤",tag:"Budget Pick"},
  {name:"Pepper soup (light)",      kcal:260,cost:1500,protein:32,emoji:"🍲",tag:"Low Cal"},
  {name:"Akara & custard",          kcal:400,cost:600, protein:12,emoji:"🫓",tag:"Budget Pick"},
];

const PANTRY_ITEMS = [
  {name:"Tomatoes",      qty:"4 pcs",   risk:"fresh",   emoji:"🍅"},
  {name:"Spinach (Ugu)", qty:"1 bunch", risk:"use soon",emoji:"🥬"},
  {name:"Eggs",          qty:"6 pcs",   risk:"fresh",   emoji:"🥚"},
  {name:"Chicken",       qty:"~500g",   risk:"use soon",emoji:"🍗"},
  {name:"Onions",        qty:"3 pcs",   risk:"fresh",   emoji:"🧅"},
  {name:"Bell Pepper",   qty:"2 pcs",   risk:"fresh",   emoji:"🫑"},
  {name:"Crayfish",      qty:"small",   risk:"fresh",   emoji:"🦐"},
  {name:"Palm Oil",      qty:"half btl",risk:"fresh",   emoji:"🫙"},
];

const RC = {"fresh":{bg:"#E8F5E9",text:"#2E7D32"},"use soon":{bg:"#FFF3E0",text:"#E65100"}};

const OB_STEPS = [
  {id:"goal",title:"What's your main goal?",subtitle:"We'll personalise your meal plan.",type:"single",
   options:[{label:"Lose weight",emoji:"⚖️"},{label:"Build muscle",emoji:"💪"},{label:"Eat healthier",emoji:"🥗"},{label:"Maintain weight",emoji:"✅"},{label:"Save on food",emoji:"💰"}]},
  {id:"diet",title:"Any dietary needs?",subtitle:"Select all that apply.",type:"multi",
   options:[{label:"No restrictions",emoji:"🍽️"},{label:"No pork",emoji:"🚫"},{label:"No beef",emoji:"🐄"},{label:"Vegetarian",emoji:"🌿"},{label:"Gluten-free",emoji:"🌾"},{label:"Dairy-free",emoji:"🥛"}]},
  {id:"cuisine",title:"Favourite cuisines?",subtitle:"Your plans will feature these.",type:"multi",
   options:[{label:"Nigerian",emoji:"🇳🇬"},{label:"Continental",emoji:"🍝"},{label:"West African",emoji:"🌍"},{label:"Asian",emoji:"🍜"},{label:"Mediterranean",emoji:"🫒"},{label:"East African",emoji:"🥘"}]},
  {id:"budget",title:"Weekly food budget?",subtitle:"We'll keep meals affordable.",type:"single",
   options:[{label:"Under ₦5,000",emoji:"💸"},{label:"₦5k – ₦10k",emoji:"💵"},{label:"₦10k – ₦20k",emoji:"💰"},{label:"₦20k – ₦40k",emoji:"🏦"},{label:"No limit",emoji:"💎"}]},
  {id:"activity",title:"How active are you?",subtitle:"Sets your calorie targets.",type:"single",
   options:[{label:"Sedentary",emoji:"🛋️",sub:"Mostly sitting"},{label:"Lightly active",emoji:"🚶",sub:"1–3 days/week"},{label:"Moderately active",emoji:"🏃",sub:"3–5 days/week"},{label:"Very active",emoji:"🏋️",sub:"6–7 days/week"}]},
];

const SYSTEM_PROMPT = `You are Nouri, an AI food and wellness assistant for a Nigerian-first health app. You act as a nutritionist, chef, budget advisor, and wellness coach.
- Deep knowledge of Nigerian/African foods: jollof rice, amala, egusi, efo riro, moi moi, akara, nkwobi, suya, pounded yam, afang soup, banga soup, pepper soup, ofada rice, tuwo shinkafa, etc.
- Always estimate calories and macros when recommending food. Use ₦ for Naira.
- Keep responses concise for mobile. Use bullet points and **bold** for key terms.
- Be warm, encouraging, culturally relevant. Max 4 sentences for simple questions, up to 8 bullets for plans.`;

const QP = [
  {label:"🍛 Cook with rice & chicken",text:"What can I cook with rice and chicken?"},
  {label:"💪 Cheap high-protein meal", text:"I need a cheap high-protein Nigerian meal under ₦2,000"},
  {label:"⚡ Post-gym food",           text:"What should I eat after gym to build muscle?"},
  {label:"⏱ Quick 20-min meal",        text:"I only have 20 minutes to cook. What's quick and healthy?"},
  {label:"🌿 Light dinner",            text:"Suggest a light Nigerian dinner under 500 calories"},
  {label:"💰 ₦5k for the week",        text:"I have ₦5,000 for food this week. Plan my meals"},
];

const nowT = () => new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});

/* ─── ICONS ──────────────────────────────────────────────────── */
const Icon = ({name,size=20,color="currentColor",sw=1.8}) => {
  const p = {
    home:   <><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></>,
    plan:   <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    scan:   <><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><path d="M7 12h10"/></>,
    budget: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    chart:  <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    chat:   <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
    profile:<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    users:  <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    send:   <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    mic:    <><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
    arrow:  <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    back:   <><polyline points="15 18 9 12 15 6"/></>,
    check:  <><polyline points="20 6 9 17 4 12"/></>,
    refresh:<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
    drop:   <><path d="M12 2L6 10a6 6 0 1012 0L12 2z"/></>,
    zap:    <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    bell:   <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    plus:   <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    clock:  <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    camera: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
    grocery:<><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>,
    swap:   <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></>,
    edit:   <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    alert:  <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    heart:  <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></>,
    share:  <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    star:   <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>;
};

/* ─── SHARED COMPONENTS ──────────────────────────────────────── */
function PBar({pct,color}){
  const [w,setW]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setW(Math.min(pct,1)*100),260);return()=>clearTimeout(t);},[pct]);
  return <div style={{height:"100%",width:`${w}%`,borderRadius:99,background:color||`linear-gradient(90deg,${T.primary},${T.primaryMint})`,transition:"width 1.1s cubic-bezier(0.16,1,0.3,1)"}}/>;
}

function MBW({label,value,max,unit}){
  const [w,setW]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setW(Math.min(value/max,1)*100),220);return()=>clearTimeout(t);},[]);
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.55)"}}>{label}</span>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.85)",fontWeight:500}}>{value}{unit}<span style={{opacity:.5}}>/{max}{unit}</span></span>
      </div>
      <div style={{height:5,background:"rgba(255,255,255,0.15)",borderRadius:99,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:99,background:"rgba(255,255,255,0.85)",width:`${w}%`,transition:"width 1s cubic-bezier(0.16,1,0.3,1)"}}/>
      </div>
    </div>
  );
}

function CRing({consumed,goal,size=118}){
  const r=(size-14)/2,circ=2*Math.PI*r,pct=Math.min(consumed/goal,1);
  const [anim,setAnim]=useState(0);
  useEffect(()=>{
    let raf,start=null;
    const run=ts=>{if(!start)start=ts;const p=Math.min((ts-start)/1100,1);setAnim((1-Math.pow(1-p,3))*pct);if(p<1)raf=requestAnimationFrame(run);};
    raf=requestAnimationFrame(run);return()=>cancelAnimationFrame(raf);
  },[pct]);
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={8}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth={8} strokeLinecap="round" strokeDasharray={`${anim*circ} ${circ}`}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:20,fontWeight:700,color:"#fff",lineHeight:1}}>{consumed.toLocaleString()}</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.55)",marginTop:2}}>of {goal.toLocaleString()} kcal</div>
      </div>
    </div>
  );
}

function WDots({filled,total}){
  return <div style={{display:"flex",gap:4}}>{Array.from({length:total}).map((_,i)=><div key={i} style={{width:24,height:28,borderRadius:6,background:i<filled?T.primarySoft:T.inputBg,border:`1.5px solid ${i<filled?T.primaryMint:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>{i<filled?"💧":""}</div>)}</div>;
}

function Tag({label,bg,text}){
  return <span style={{fontSize:10,fontWeight:700,background:bg||T.primarySoft,color:text||T.primary,borderRadius:6,padding:"2px 8px",flexShrink:0}}>{label}</span>;
}

function Sheet({children,onClose,maxH="82%"}){
  const [vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),20);},[]);
  const close=()=>{setVis(false);setTimeout(onClose,280);};
  return(
    <div style={{position:"absolute",inset:0,zIndex:50,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={close} style={{position:"absolute",inset:0,background:vis?"rgba(0,0,0,0.35)":"rgba(0,0,0,0)",transition:"background 0.28s"}}/>
      <div style={{position:"relative",zIndex:1,background:T.white,borderRadius:"28px 28px 0 0",maxHeight:maxH,overflowY:"auto",transform:vis?"translateY(0)":"translateY(100%)",transition:"transform 0.32s cubic-bezier(0.32,0.72,0,1)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 14px"}}><div style={{width:36,height:4,borderRadius:99,background:T.borderMid}}/></div>
        {children}
        <div style={{height:28}}/>
      </div>
    </div>
  );
}

function FS({children,onClose,title,emoji}){
  return(
    <div style={{position:"absolute",inset:0,zIndex:80,background:T.pageBg,display:"flex",flexDirection:"column",animation:"fadeIn 0.25s ease"}}>
      <div style={{padding:"12px 18px",background:T.white,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button onClick={onClose} style={{width:36,height:36,borderRadius:10,background:T.inputBg,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="back" size={18} color={T.textMid}/></button>
        <div style={{flex:1,fontSize:15,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>{title}</div>
        {emoji&&<span style={{fontSize:22}}>{emoji}</span>}
      </div>
      <div style={{flex:1,overflowY:"auto",paddingBottom:20}}>{children}</div>
    </div>
  );
}

function BNav({active,setActive}){
  const tabs=[
    {id:"home",        icon:"home",   label:"Home"},
    {id:"plan",        icon:"plan",   label:"Plan"},
    {id:"scan",        icon:"scan",   label:"Scan"},
    {id:"marketplace", icon:"grocery",label:"Market"},
    {id:"community",   icon:"users",  label:"Social"},
    {id:"profile",     icon:"profile",label:"Profile"},
  ];
  return(
    <div style={{position:"absolute",bottom:0,left:0,right:0,background:T.white,borderTop:`1px solid ${T.border}`,display:"flex",padding:"6px 0 20px",zIndex:20}}>
      {tabs.map(t=>(
        <button key={t.id} className="tab" onClick={()=>setActive(t.id)} style={{flex:1,background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 2px",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          <div style={{width:32,height:28,borderRadius:9,background:active===t.id?T.primarySoft:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.2s"}}>
            <Icon name={t.icon} size={17} color={active===t.id?T.primary:T.textLight} sw={active===t.id?2.2:1.8}/>
          </div>
          <span style={{fontSize:8.5,color:active===t.id?T.primary:T.textLight,fontWeight:active===t.id?700:400}}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ══ ONBOARDING ══════════════════════════════════════════════ */
function OnboardingScreen({onComplete}){
  const [step,setStep]=useState(0);
  const [answers,setAnswers]=useState({});
  const [name,setName]=useState("");
  const [nameStep,setNameStep]=useState(true);
  const s=OB_STEPS[step];
  const toggle=(id,val)=>{
    if(s.type==="single") setAnswers(p=>({...p,[id]:val}));
    else setAnswers(p=>{const c=p[id]||[];return{...p,[id]:c.includes(val)?c.filter(x=>x!==val):[...c,val]};});
  };
  const canNext=nameStep?(name.trim().length>1):(s.type==="multi"?(answers[s.id]||[]).length>0:!!answers[s.id]);
  const next=()=>{
    if(nameStep){setNameStep(false);return;}
    if(step<OB_STEPS.length-1)setStep(p=>p+1);
    else onComplete({name,answers});
  };
  if(nameStep) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"40px 28px 32px",animation:"fadeIn 0.4s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:48}}>
        <div style={{width:40,height:40,borderRadius:14,background:T.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🥗</div>
        <span style={{fontSize:22,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Nouri</span>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:28,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",lineHeight:1.25,marginBottom:10}}>Your personal<br/><span style={{color:T.primary}}>AI food coach</span> 🤖</div>
        <div style={{fontSize:14,color:T.textMuted,marginBottom:40,lineHeight:1.6}}>Meal plans, nutrition tracking, and budget-smart eating — built around Nigerian & African food.</div>
        <div style={{fontSize:13,fontWeight:600,color:T.textMid,marginBottom:10}}>What should we call you?</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your first name"
          style={{width:"100%",padding:"14px 16px",fontSize:15,background:T.inputBg,border:`1.5px solid ${T.border}`,borderRadius:14,color:T.textDark,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",transition:"border-color 0.2s"}}
          onFocus={e=>e.target.style.borderColor=T.primaryMint} onBlur={e=>e.target.style.borderColor=T.border}/>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:28}}>
          {["🇳🇬 Nigerian foods","💰 Budget-aware","🤖 AI-powered","📊 Nutrition tracking","👥 Community"].map(f=>(
            <span key={f} style={{background:T.primarySoft,color:T.primary,fontSize:12,fontWeight:600,borderRadius:20,padding:"6px 12px"}}>{f}</span>
          ))}
        </div>
      </div>
      <button onClick={next} disabled={!canNext} style={{width:"100%",background:canNext?T.primary:"#ccc",border:"none",borderRadius:16,padding:"16px",fontSize:15,fontWeight:700,color:"#fff",cursor:canNext?"pointer":"default",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"background 0.2s"}}>Get Started →</button>
    </div>
  );
  const sel=answers[s.id]||(s.type==="single"?null:[]);
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"28px 24px 24px",animation:"fadeIn 0.3s ease"}}>
      <div style={{marginBottom:28}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={step===0?()=>setNameStep(true):()=>setStep(p=>p-1)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Icon name="back" size={20} color={T.textMid}/></button>
          <span style={{fontSize:12,color:T.textMuted,fontWeight:600}}>{step+1} of {OB_STEPS.length}</span>
        </div>
        <div style={{height:5,background:T.inputBg,borderRadius:99,overflow:"hidden"}}><PBar pct={(step+1)/OB_STEPS.length}/></div>
      </div>
      <div style={{fontSize:22,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:6,lineHeight:1.3}}>{s.title}</div>
      <div style={{fontSize:13,color:T.textMuted,marginBottom:24}}>{s.subtitle}</div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:10,overflowY:"auto"}}>
        {s.options.map(opt=>{
          const isSel=s.type==="multi"?sel.includes(opt.label):sel===opt.label;
          return(
            <button key={opt.label} className={`obopt${isSel?" sel":""}`} onClick={()=>toggle(s.id,opt.label)}
              style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:isSel?T.primarySoft:T.cardBg,border:`1.5px solid ${isSel?T.primary:T.border}`,borderRadius:16,cursor:"pointer",textAlign:"left",transition:"all 0.18s",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              <span style={{fontSize:24,flexShrink:0}}>{opt.emoji}</span>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.textDark}}>{opt.label}</div>{opt.sub&&<div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{opt.sub}</div>}</div>
              <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${isSel?T.primary:T.borderMid}`,background:isSel?T.primary:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.18s"}}>
                {isSel&&<Icon name="check" size={12} color="#fff" sw={3}/>}
              </div>
            </button>
          );
        })}
      </div>
      <button onClick={next} disabled={!canNext} style={{marginTop:20,width:"100%",background:canNext?T.primary:"#D4D4D4",border:"none",borderRadius:16,padding:"15px",fontSize:15,fontWeight:700,color:"#fff",cursor:canNext?"pointer":"default",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"background 0.2s"}}>
        {step===OB_STEPS.length-1?"Let's Go 🚀":"Continue →"}
      </button>
    </div>
  );
}

/* ══ RECIPE DETAIL ═══════════════════════════════════════════ */
function RecipeScreen({meal,onClose}){
  const [step,setStep]=useState(0);
  const [timerSec,setTimerSec]=useState(null);
  const [timerActive,setTimerActive]=useState(false);
  const ivRef=useRef(null);
  const recipe=RECIPES_DB[meal?.name]||RECIPES_DB.default;
  const cur=recipe.steps[step];
  const isLast=step===recipe.steps.length-1;
  useEffect(()=>{
    if(timerActive&&timerSec>0){ivRef.current=setInterval(()=>setTimerSec(s=>s-1),1000);}
    else if(timerSec===0){clearInterval(ivRef.current);setTimerActive(false);}
    return()=>clearInterval(ivRef.current);
  },[timerActive,timerSec]);
  const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  if(!meal) return null;
  return(
    <FS onClose={onClose} title={meal.name} emoji={meal.emoji}>
      <div style={{padding:"16px 22px 0"}}>
        <div style={{background:T.primary,borderRadius:20,padding:"16px 20px",marginBottom:16,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:-20,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {[{l:"Calories",v:`${meal.kcal} kcal`},{l:"Protein",v:`${meal.protein}g`},{l:"Time",v:`${recipe.steps.reduce((s,r)=>s+r.min,0)} min`},{l:"Cost",v:`₦${(meal.cost||1500).toLocaleString()}`}].map((s,i,arr)=>(
              <div key={s.l} style={{textAlign:"center",borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.1)":"none",flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{s.v}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{fontSize:14,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:10}}>Ingredients</div>
        <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,marginBottom:14,overflow:"hidden"}}>
          {recipe.ingredients.map((ing,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:i<recipe.ingredients.length-1?`1px solid ${T.border}`:"none"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:T.primary,flexShrink:0}}/><span style={{fontSize:13,color:T.textMid}}>{ing}</span>
            </div>
          ))}
        </div>
        {recipe.tip&&<div style={{background:"#FFFBF0",border:"1px solid #F5C06640",borderRadius:12,padding:"11px 14px",fontSize:12,color:T.textMid,marginBottom:14}}>💡 <strong>Tip:</strong> {recipe.tip}</div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Step-by-step</div>
          <span style={{fontSize:12,color:T.textMuted}}>Step {step+1} / {recipe.steps.length}</span>
        </div>
        <div style={{display:"flex",gap:5,marginBottom:14}}>
          {recipe.steps.map((_,i)=><div key={i} onClick={()=>setStep(i)} style={{flex:1,height:4,borderRadius:99,background:i===step?T.primary:i<step?T.primaryMint:T.inputBg,cursor:"pointer",transition:"background 0.2s"}}/>)}
        </div>
        <div style={{background:T.primary,borderRadius:20,padding:"22px",marginBottom:14,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,bottom:-20,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",letterSpacing:"0.1em",marginBottom:6,textTransform:"uppercase"}}>Step {step+1}</div>
          <div style={{fontSize:17,fontWeight:700,color:"#fff",fontFamily:"'Lora',serif",marginBottom:10}}>{cur.title}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",lineHeight:1.6,marginBottom:16}}>{cur.desc}</div>
          {timerSec!==null?(
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:12,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:24,fontWeight:700,color:"#fff"}}>{fmt(timerSec)}</span>
              <button onClick={()=>setTimerActive(p=>!p)} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,color:"#fff",cursor:"pointer"}}>{timerActive?"Pause":"Resume"}</button>
            </div>
          ):(
            <button onClick={()=>{setTimerSec(cur.min*60);setTimerActive(true);}} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:12,padding:"10px 16px",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
              <Icon name="clock" size={15} color="#fff"/>Start {cur.min}-min timer
            </button>
          )}
        </div>
        <div style={{display:"flex",gap:10}}>
          {step>0&&<button onClick={()=>{setStep(s=>s-1);setTimerSec(null);setTimerActive(false);}} style={{flex:1,background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"13px",fontSize:13,fontWeight:600,color:T.textMid,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Prev</button>}
          {!isLast
            ?<button onClick={()=>{setStep(s=>s+1);setTimerSec(null);setTimerActive(false);}} style={{flex:1,background:T.primary,border:"none",borderRadius:14,padding:"13px",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Next →</button>
            :<button onClick={onClose} style={{flex:1,background:T.primaryMint,border:"none",borderRadius:14,padding:"13px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✓ Done Cooking!</button>
          }
        </div>
      </div>
    </FS>
  );
}

/* ══ VOICE CHEF ══════════════════════════════════════════════ */
function VoiceScreen({meal,onClose}){
  const [step,setStep]=useState(0);
  const [listening,setListening]=useState(false);
  const [speaking,setSpeaking]=useState(true);
  const recipe=RECIPES_DB[meal?.name]||RECIPES_DB.default;
  const cur=recipe.steps[step];
  useEffect(()=>{setSpeaking(true);const t=setTimeout(()=>setSpeaking(false),2200);return()=>clearTimeout(t);},[step]);
  if(!meal) return null;
  return(
    <FS onClose={onClose} title="Voice Chef" emoji="🎙️">
      <div style={{padding:"20px 22px 0",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{position:"relative",marginBottom:24}}>
          <div style={{width:100,height:100,borderRadius:"50%",background:T.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,boxShadow:`0 0 0 ${speaking?16:8}px ${T.primarySoft}`,transition:"box-shadow 0.3s"}}>🤖</div>
          {speaking&&[1,2,3].map(i=><div key={i} style={{position:"absolute",inset:-i*12,borderRadius:"50%",border:`2px solid ${T.primaryMint}`,opacity:1-i*0.3,animation:"pulse 1.5s ease-out infinite",animationDelay:`${i*0.3}s`}}/>)}
        </div>
        <div style={{background:T.primary,borderRadius:"20px 20px 20px 4px",padding:"16px 20px",marginBottom:20,maxWidth:280,alignSelf:"flex-start"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:6}}>Step {step+1} of {recipe.steps.length}</div>
          <div style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:"'Lora',serif",marginBottom:6}}>{cur.title}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.5}}>{cur.desc}</div>
          {speaking&&<div style={{display:"flex",gap:4,marginTop:8,alignItems:"center"}}>{[0,1,2,3].map(i=><div key={i} style={{width:4,height:4+i*4,borderRadius:2,background:"rgba(255,255,255,0.5)",animation:"blink 1s infinite",animationDelay:`${i*0.15}s`}}/>)}</div>}
        </div>
        <div style={{width:"100%",display:"flex",gap:5,marginBottom:20}}>
          {recipe.steps.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:99,background:i===step?T.primary:i<step?T.primaryMint:T.inputBg,transition:"background 0.3s"}}/>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:20}}>
          <button onClick={()=>setListening(p=>!p)} style={{width:80,height:80,borderRadius:"50%",background:listening?T.red:T.primary,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:`0 8px 24px ${listening?T.red+"40":T.primary+"40"}`,animation:listening?"vp 1s ease-in-out infinite":"none",transition:"background 0.2s"}}>
            <Icon name="mic" size={32} color="#fff" sw={1.5}/>
          </button>
          <div style={{fontSize:12,color:T.textMuted,marginTop:10}}>{listening?"Listening… say a command":"Tap to speak"}</div>
        </div>
        <div style={{width:"100%",background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"14px",marginBottom:16}}>
          <div style={{fontSize:11,color:T.textMuted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Voice Commands</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {["next step","previous","repeat","done"].map(c=>(
              <span key={c} style={{background:T.primarySoft,color:T.primary,fontSize:12,fontWeight:600,borderRadius:20,padding:"5px 12px",cursor:"pointer"}}
                onClick={()=>{if(c==="next step")setStep(s=>Math.min(s+1,recipe.steps.length-1));if(c==="previous")setStep(s=>Math.max(s-1,0));if(c==="done")onClose();}}>
                "{c}"
              </span>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:10,width:"100%"}}>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"13px",fontSize:13,fontWeight:600,color:T.textMid,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Prev</button>}
          {step<recipe.steps.length-1
            ?<button onClick={()=>setStep(s=>s+1)} style={{flex:1,background:T.primary,border:"none",borderRadius:14,padding:"13px",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Next →</button>
            :<button onClick={onClose} style={{flex:1,background:T.primaryMint,border:"none",borderRadius:14,padding:"13px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✓ Done!</button>
          }
        </div>
      </div>
    </FS>
  );
}

/* ══ MEAL LOG SHEET ══════════════════════════════════════════ */
function LogSheet({onClose,uid}){
  const [query,setQuery]=useState("");
  const [sel,setSel]=useState(null);
  const [portion,setPortion]=useState(1);
  const [saving,setSaving]=useState(false);
  const filtered=FOODS_DB.filter(f=>f.name.toLowerCase().includes(query.toLowerCase()));
  const handleLog=async()=>{
    if(!sel||saving)return;
    setSaving(true);
    try{if(uid)await logMeal(uid,{name:sel.name,emoji:sel.emoji,kcal:Math.round(sel.kcal*portion),protein:Math.round(sel.protein*portion),portion});}catch(e){console.error(e);}
    setSaving(false);
    onClose();
  };
  return(
    <Sheet onClose={onClose} maxH="92%">
      <div style={{padding:"0 22px 4px"}}>
        <div style={{fontSize:17,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:14}}>Log a Meal</div>
        <div style={{position:"relative",marginBottom:14}}>
          <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}><Icon name="search" size={16} color={T.textMuted}/></div>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Nigerian foods…"
            style={{width:"100%",padding:"11px 12px 11px 38px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:12,fontSize:14,color:T.textDark,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none"}}
            onFocus={e=>e.target.style.borderColor=T.primaryMint} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        {sel&&(
          <div style={{background:T.primary,borderRadius:16,padding:"16px",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <span style={{fontSize:28}}>{sel.emoji}</span>
              <div><div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{sel.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.6)"}}>{sel.per}</div></div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              {[{l:"Calories",v:`${Math.round(sel.kcal*portion)} kcal`},{l:"Protein",v:`${Math.round(sel.protein*portion)}g`}].map(s=>(
                <div key={s.l} style={{flex:1,background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{s.v}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 14px",marginBottom:12}}>
              <span style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>Portions</span>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <button onClick={()=>setPortion(p=>Math.max(0.5,p-0.5))} style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                <span style={{fontSize:15,fontWeight:700,color:"#fff",minWidth:24,textAlign:"center"}}>{portion}</span>
                <button onClick={()=>setPortion(p=>p+0.5)} style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
            </div>
            <button onClick={handleLog} disabled={saving} style={{width:"100%",background:T.primaryMint,border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,color:"#fff",cursor:saving?"default":"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{saving?"Saving…":`✓ Log ${sel.name}`}</button>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:280,overflowY:"auto"}}>
          {filtered.map((f,i)=>(
            <div key={i} onClick={()=>{setSel(f);setPortion(1);}} className="rh"
              style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,background:sel?.name===f.name?T.primarySoft:T.inputBg,border:`1px solid ${sel?.name===f.name?T.primaryMint+"44":T.border}`,cursor:"pointer",transition:"all 0.15s"}}>
              <span style={{fontSize:20,flexShrink:0}}>{f.emoji}</span>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.textDark}}>{f.name}</div><div style={{fontSize:11,color:T.textMuted}}>{f.kcal} kcal · {f.protein}g protein · {f.per}</div></div>
              {sel?.name===f.name&&<Icon name="check" size={16} color={T.primary} sw={2.5}/>}
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/* ══ HOME SCREEN ═════════════════════════════════════════════ */
function HomeScreen({navigate,user,onBell,unread}){
  const [greeting]=useState(()=>{const h=new Date().getHours();return h<12?"Good morning":h<17?"Good afternoon":"Good evening";});
  const name=user?.name||"Tobi";
  const [recipe,setRecipe]=useState(null);
  const [showLog,setShowLog]=useState(false);
  const meals=[
    {type:"Breakfast",name:"Oats with banana & almond",  kcal:380,protein:14,cost:800, emoji:"🥣",logged:true},
    {type:"Lunch",    name:"Grilled chicken with jollof", kcal:650,protein:42,cost:1800,emoji:"🍛",logged:true},
    {type:"Dinner",   name:"Afang soup with pounded yam", kcal:550,protein:38,cost:1500,emoji:"🫕",logged:false},
    {type:"Snack",    name:"Garden egg & groundnut",      kcal:120,protein:6, cost:300, emoji:"🥜",logged:false},
  ];
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:90,position:"relative"}}>
      <div style={{padding:"18px 22px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:13,color:T.textMuted,marginBottom:2}}>{greeting} 👋</div>
          <div style={{fontSize:24,color:T.textDark,fontWeight:700,fontFamily:"'Lora',serif"}}>{name}</div>
          <div style={{fontSize:12,color:T.textMuted,marginTop:2}}>Ready to fuel your body?</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{background:"#FFF8EC",border:"1px solid #F5C06640",borderRadius:10,padding:"6px 10px",display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:14}}>🔥</span><span style={{fontSize:13,color:T.gold,fontWeight:700}}>7</span>
          </div>
          <div onClick={onBell} style={{width:38,height:38,borderRadius:12,background:T.cardBg,border:`1px solid ${unread>0?T.primaryMint:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
            <Icon name="bell" size={17} color={unread>0?T.primary:T.textMid}/>
            {unread>0&&<div style={{position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:"50%",background:T.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",border:`2px solid ${T.pageBg}`}}>{unread}</div>}
          </div>
        </div>
      </div>
      <div style={{padding:"16px 22px 0"}}>
        <div style={{background:T.primary,borderRadius:24,padding:"20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-30,top:-30,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",letterSpacing:"0.1em",marginBottom:14,textTransform:"uppercase"}}>Today's Plan</div>
          <div style={{display:"flex",gap:16,alignItems:"center"}}>
            <CRing consumed={1030} goal={1650}/>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
              <MBW label="Protein" value={84}  max={105} unit="g"/>
              <MBW label="Carbs"   value={148} max={200} unit="g"/>
              <MBW label="Fat"     value={38}  max={55}  unit="g"/>
            </div>
          </div>
          <div style={{marginTop:16,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.12)",display:"flex",justifyContent:"space-between"}}>
            {[{l:"Remaining",v:"620 kcal"},{l:"Logged",v:"2 / 4"},{l:"Water",v:"5 / 8"}].map(s=>(
              <div key={s.l} style={{textAlign:"center"}}>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",marginBottom:3}}>{s.l}</div>
                <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{padding:"12px 22px 0"}}>
        <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:38,height:38,borderRadius:11,background:"#EAF4FD",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="drop" size={17} color={T.blue}/></div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,fontWeight:600,color:T.textDark}}>Hydration</span><span style={{fontSize:12,color:T.blue,fontWeight:600}}>5 / 8 glasses</span></div>
            <WDots filled={5} total={8}/>
          </div>
        </div>
      </div>
      <div style={{padding:"12px 22px 0"}}>
        <div style={{background:"#FFFBF0",border:"1px solid #F5C06640",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:"#FFF3D0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="zap" size={15} color={T.gold}/></div>
          <div><div style={{fontSize:11,color:T.gold,fontWeight:700,marginBottom:3}}>AI Insight</div><div style={{fontSize:13,color:T.textMid,lineHeight:1.45}}>You eat more carbs at night. Try lighter dinner — afang soup without fufu saves ~200 kcal.</div></div>
        </div>
      </div>
      <div style={{padding:"18px 22px 0"}}>
        <div style={{fontSize:11,color:T.textMuted,fontWeight:600,letterSpacing:"0.08em",marginBottom:11,textTransform:"uppercase"}}>Quick Actions</div>
        <div style={{display:"flex",gap:8}}>
          {[{e:"📷",l:"Scan Pantry",a:()=>navigate("scan")},{e:"🤖",l:"AI Chef",a:()=>navigate("chat")},{e:"📝",l:"Log Meal",a:()=>setShowLog(true)},{e:"💰",l:"Budget",a:()=>navigate("budget")},{e:"👥",l:"Community",a:()=>navigate("community")}].map(x=>(
            <button key={x.l} className="qa" onClick={x.a} style={{flex:1,background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"11px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer",transition:"transform 0.12s",boxShadow:"0 1px 3px #0000000A",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              <div style={{width:36,height:36,borderRadius:10,background:T.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{x.e}</div>
              <span style={{fontSize:9,color:T.textMid,fontWeight:500,textAlign:"center",lineHeight:1.3}}>{x.l}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"20px 22px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:15,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Today's Meals</div>
          <button onClick={()=>navigate("plan")} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T.primary,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>See all →</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {meals.map((m,i)=>(
            <div key={m.type} className="rh" onClick={()=>setRecipe(m)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:14,background:T.cardBg,border:`1px solid ${T.border}`,cursor:"pointer",animation:`slideIn 0.35s ease both`,animationDelay:`${i*70}ms`,transition:"background 0.2s,border-color 0.2s"}}>
              <div style={{width:44,height:44,borderRadius:12,background:T.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{m.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <span style={{fontSize:10,fontWeight:600,color:T.primary,background:T.primarySoft,borderRadius:6,padding:"2px 7px"}}>{m.type}</span>
                  {m.logged&&<span style={{width:16,height:16,borderRadius:"50%",background:T.primary,display:"inline-flex",alignItems:"center",justifyContent:"center"}}><Icon name="check" size={10} color="#fff" sw={2.5}/></span>}
                </div>
                <div style={{fontSize:13,fontWeight:600,color:T.textDark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.name}</div>
                <div style={{fontSize:11,color:T.textMuted,marginTop:1}}>{m.kcal} kcal · {m.protein}g protein</div>
              </div>
              <Icon name="arrow" size={15} color={T.textLight}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"16px 22px 0"}}>
        <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:20,padding:"18px",cursor:"pointer"}} onClick={()=>navigate("budget")}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div><div style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Weekly Budget</div><div style={{fontSize:22,fontWeight:700,color:T.textDark}}>₦15,000</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Remaining</div><div style={{fontSize:22,fontWeight:700,color:T.primary}}>₦7,800</div></div>
          </div>
          <div style={{height:7,background:T.inputBg,borderRadius:99,overflow:"hidden",marginBottom:6}}><PBar pct={0.48}/></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:T.textMuted}}>Spent: ₦7,200</span><span style={{fontSize:11,color:T.primary,fontWeight:600}}>View budget →</span></div>
        </div>
      </div>
      <div style={{height:16}}/>
      {recipe&&<RecipeScreen meal={recipe} onClose={()=>setRecipe(null)}/>}
      {showLog&&<LogSheet onClose={()=>setShowLog(false)} uid={user?.uid}/>}
    </div>
  );
}

/* ══ PLAN SCREEN ═════════════════════════════════════════════ */
function PlanScreen({uid}){
  const [activeDay,setActiveDay]=useState(0);
  const [animKey,setAnimKey]=useState(0);
  const [detailMeal,setDetailMeal]=useState(null);
  const [swapMeal,setSwapMeal]=useState(null);
  const [showGrocery,setShowGrocery]=useState(false);
  const [recipe,setRecipe]=useState(null);
  const [voice,setVoice]=useState(null);
  const [showLog,setShowLog]=useState(false);
  const [checked,setChecked]=useState({});
  const dayKey=DAYS[activeDay];
  const dayData=WEEK_PLAN[dayKey];
  const GROCERY=[
    {cat:"Proteins",  list:["Chicken breast (1kg)","Goat meat (500g)","Stock fish (1 pack)","Eggs (1 crate)","Tilapia (2 fish)"]},
    {cat:"Vegetables",list:["Afang leaves","Efo riro (spinach)","Ukazi leaves","Garden eggs (500g)","Tomatoes (500g)"]},
    {cat:"Staples",   list:["Basmati rice (2kg)","Yam (1 tuber)","Semovita (1 pack)","Rolled oats (500g)","Plantain (5)"]},
    {cat:"Seasonings",list:["Palm oil (1 bottle)","Crayfish (100g)","Ogiri (1 wrap)","Pepper (assorted)"]},
  ];
  const allItems=GROCERY.reduce((s,c)=>s+c.list.length,0);
  const doneItems=Object.values(checked).filter(Boolean).length;
  const SWAPS={
    Breakfast:[{name:"Akara & pap",kcal:340,emoji:"🫓"},{name:"Boiled yam & egg",kcal:490,emoji:"🍳"},{name:"Plantain pancakes",kcal:380,emoji:"🥞"}],
    Lunch:    [{name:"Beans & plantain",kcal:510,emoji:"🫘"},{name:"Ofada rice",kcal:680,emoji:"🍛"},{name:"Moi moi & fish",kcal:420,emoji:"🟤"}],
    Dinner:   [{name:"Efo riro & semo",kcal:490,emoji:"🥬"},{name:"Ogbono & eba",kcal:580,emoji:"🫕"},{name:"Pepper soup",kcal:280,emoji:"🍲"}],
  };
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:90,position:"relative"}}>
      <div style={{padding:"16px 22px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:11,color:T.textMuted,marginBottom:3,letterSpacing:"0.04em"}}>THIS WEEK</div><div style={{fontSize:22,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Meal Plan</div></div>
        <button onClick={()=>setShowGrocery(true)} style={{width:38,height:38,borderRadius:12,background:T.cardBg,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="grocery" size={17} color={T.textMid}/></button>
      </div>
      <div style={{padding:"14px 0 0"}}>
        <div style={{display:"flex",gap:6,overflowX:"auto",padding:"0 22px",scrollbarWidth:"none"}}>
          {DAYS.map((d,i)=>{const isA=i===activeDay;return(
            <button key={d} onClick={()=>{setActiveDay(i);setAnimKey(k=>k+1);}}
              style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"10px 14px",borderRadius:14,background:isA?T.primary:T.cardBg,border:`1px solid ${isA?T.primary:T.border}`,cursor:"pointer",transition:"all 0.2s",fontFamily:"'Plus Jakarta Sans',sans-serif",minWidth:52}}>
              <span style={{fontSize:11,fontWeight:600,color:isA?"rgba(255,255,255,0.7)":T.textMuted}}>{d}</span>
              <span style={{fontSize:16,fontWeight:700,color:isA?"#fff":T.textDark}}>{i+14}</span>
              <div style={{width:5,height:5,borderRadius:"50%",background:isA?"rgba(255,255,255,0.7)":T.border}}/>
            </button>
          );})}
        </div>
      </div>
      <div style={{padding:"16px 22px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:17,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>{dayData.label}</div><div style={{fontSize:12,color:T.textMuted,marginTop:2}}>Total: {dayData.meals.reduce((s,m)=>s+m.kcal,0).toLocaleString()} kcal · ₦{dayData.meals.reduce((s,m)=>s+m.cost,0).toLocaleString()}</div></div>
        {activeDay===0&&<span style={{background:T.primarySoft,color:T.primary,fontSize:11,fontWeight:700,borderRadius:8,padding:"4px 10px"}}>Today</span>}
      </div>
      <div key={animKey} style={{padding:"14px 22px 0",display:"flex",flexDirection:"column",gap:12}}>
        {dayData.meals.map((meal,i)=>{const tc=TC[meal.tag]||TC["Nigerian"];return(
          <div key={i} className="rh" onClick={()=>setDetailMeal(meal)}
            style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:18,overflow:"hidden",cursor:"pointer",animation:`slideIn 0.35s ease both`,animationDelay:`${i*70}ms`,boxShadow:"0 1px 4px #00000008",transition:"box-shadow 0.2s,border-color 0.2s"}}>
            <div style={{padding:"10px 16px 8px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:meal.logged?T.primary:T.textLight}}/>
                <span style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.07em"}}>{meal.type}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><Icon name="clock" size={12} color={T.textLight}/><span style={{fontSize:11,color:T.textMuted}}>{meal.time}</span><span style={{fontSize:11,color:T.primaryMint,fontWeight:600}}>₦{meal.cost.toLocaleString()}</span></div>
            </div>
            <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:52,height:52,borderRadius:14,background:`linear-gradient(135deg,${T.primarySoft},#F0FAF3)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{meal.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:T.textDark,marginBottom:5,lineHeight:1.35}}>{meal.name}</div>
                <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}><span style={{fontSize:12,color:T.textMuted}}>{meal.kcal} kcal</span><span style={{color:T.border}}>·</span><span style={{fontSize:12,color:T.textMuted}}>{meal.protein}g protein</span><Tag label={meal.tag} bg={tc.bg} text={tc.text}/></div>
              </div>
              {meal.logged?<div style={{width:28,height:28,borderRadius:"50%",background:T.primary,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="check" size={13} color="#fff" sw={2.5}/></div>:<Icon name="arrow" size={16} color={T.textLight}/>}
            </div>
          </div>
        );})}
      </div>
      <div style={{padding:"18px 22px 0"}}>
        <div style={{background:T.primary,borderRadius:20,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.55)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Week Summary</div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {[{l:"Avg Kcal",v:"1,650"},{l:"Avg Protein",v:"105g"},{l:"On track",v:"5/7"}].map(s=>(
              <div key={s.l} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:"#fff",lineHeight:1}}>{s.v}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:4}}>{s.l}</div></div>
            ))}
          </div>
        </div>
      </div>
      <div style={{padding:"14px 22px 0"}}>
        <button className="ghost" style={{width:"100%",background:"transparent",border:`1.5px solid ${T.primary}`,borderRadius:16,padding:"14px",fontSize:14,fontWeight:700,color:T.primary,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"background 0.2s"}}>
          <Icon name="refresh" size={16} color={T.primary}/>Regenerate Plan
        </button>
      </div>
      {detailMeal&&!swapMeal&&(
        <Sheet onClose={()=>setDetailMeal(null)}>
          <div style={{margin:"0 22px 14px",background:`linear-gradient(135deg,${T.primarySoft},#F0FAF3)`,borderRadius:20,height:100,display:"flex",alignItems:"center",justifyContent:"center",fontSize:50}}>{detailMeal.emoji}</div>
          <div style={{padding:"0 22px"}}>
            {(()=>{const tc=TC[detailMeal.tag]||{};return <div style={{display:"flex",gap:8,marginBottom:10}}><Tag label={detailMeal.type}/><Tag label={detailMeal.tag} bg={tc.bg} text={tc.text}/></div>;})()}
            <div style={{fontSize:18,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:14,lineHeight:1.3}}>{detailMeal.name}</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[{l:"Calories",v:`${detailMeal.kcal} kcal`},{l:"Protein",v:`${detailMeal.protein}g`},{l:"Cost",v:`₦${detailMeal.cost?.toLocaleString()}`}].map(s=>(
                <div key={s.l} style={{flex:1,background:T.inputBg,borderRadius:12,padding:"10px",textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:T.textDark}}>{s.v}</div><div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{s.l}</div></div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={()=>setSwapMeal(detailMeal)} style={{flex:1,background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:12,padding:"11px",fontSize:12,fontWeight:600,color:T.textMid,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="swap" size={14} color={T.textMid}/>Swap</button>
              <button onClick={()=>{setDetailMeal(null);setRecipe(detailMeal);}} style={{flex:1,background:T.primarySoft,border:"none",borderRadius:12,padding:"11px",fontSize:12,fontWeight:600,color:T.primary,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="clock" size={14} color={T.primary}/>Cook</button>
              <button onClick={()=>{setDetailMeal(null);setVoice(detailMeal);}} style={{flex:1,background:T.primarySoft,border:"none",borderRadius:12,padding:"11px",fontSize:12,fontWeight:600,color:T.primary,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="mic" size={14} color={T.primary}/>Voice</button>
              <button onClick={()=>{setDetailMeal(null);setShowLog(true);}} style={{flex:"0 0 100%",background:T.primary,border:"none",borderRadius:12,padding:"12px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="check" size={14} color="#fff" sw={2.5}/>Log this meal</button>
            </div>
          </div>
        </Sheet>
      )}
      {swapMeal&&(
        <Sheet onClose={()=>{setSwapMeal(null);setDetailMeal(null);}}>
          <div style={{padding:"0 22px 8px"}}>
            <div style={{fontSize:17,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:4}}>Swap {swapMeal.type}</div>
            <div style={{fontSize:12,color:T.textMuted,marginBottom:16}}>AI-suggested alternatives</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {(SWAPS[swapMeal.type]||SWAPS.Dinner).map((alt,i)=>(
                <button key={i} onClick={()=>{setSwapMeal(null);setDetailMeal(null);}}
                  style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=T.primarySoft;e.currentTarget.style.borderColor="#4CAF7244";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=T.inputBg;e.currentTarget.style.borderColor=T.border;}}>
                  <div style={{width:44,height:44,borderRadius:12,background:T.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{alt.emoji}</div>
                  <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.textDark}}>{alt.name}</div><div style={{fontSize:12,color:T.textMuted,marginTop:2}}>{alt.kcal} kcal</div></div>
                  <Icon name="arrow" size={16} color={T.textLight}/>
                </button>
              ))}
            </div>
          </div>
        </Sheet>
      )}
      {showGrocery&&(
        <Sheet onClose={()=>setShowGrocery(false)}>
          <div style={{padding:"0 22px 4px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:17,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Grocery List</div>
              <span style={{fontSize:12,color:T.primary,fontWeight:600}}>{doneItems}/{allItems}</span>
            </div>
            <div style={{height:5,background:T.inputBg,borderRadius:99,overflow:"hidden",marginBottom:18}}><PBar pct={doneItems/allItems}/></div>
            {GROCERY.map(cat=>(
              <div key={cat.cat} style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{cat.cat}</div>
                {cat.list.map(item=>{const key=`${cat.cat}-${item}`;const done=checked[key];return(
                  <div key={item} onClick={()=>setChecked(p=>({...p,[key]:!p[key]}))} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}>
                    <div style={{width:22,height:22,borderRadius:6,flexShrink:0,background:done?T.primary:"transparent",border:`2px solid ${done?T.primary:T.borderMid}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>{done&&<Icon name="check" size={12} color="#fff" sw={3}/>}</div>
                    <span style={{fontSize:13,color:done?T.textLight:T.textMid,textDecoration:done?"line-through":"none"}}>{item}</span>
                  </div>
                );})}
              </div>
            ))}
          </div>
        </Sheet>
      )}
      {recipe&&<RecipeScreen meal={recipe} onClose={()=>setRecipe(null)}/>}
      {voice&&<VoiceScreen meal={voice} onClose={()=>setVoice(null)}/>}
      {showLog&&<LogSheet onClose={()=>setShowLog(false)} uid={uid}/>}
    </div>
  );
}

/* ══ SCAN SCREEN ═════════════════════════════════════════════ */
function ScanScreen({navigate}){
  const [phase,setPhase]=useState("idle");
  const [progress,setProgress]=useState(0);
  const SUGG=[{name:"Spinach & egg stir-fry",kcal:320,time:"15 min",emoji:"🍳",match:"High match"},{name:"Tomato & chicken stew",kcal:480,time:"35 min",emoji:"🍲",match:"High match"},{name:"Veggie pepper soup",kcal:260,time:"20 min",emoji:"🫕",match:"Good match"}];
  const startScan=()=>{setPhase("scanning");setProgress(0);let p=0;const iv=setInterval(()=>{p+=Math.random()*18;if(p>=100){p=100;clearInterval(iv);setTimeout(()=>setPhase("results"),400);}setProgress(Math.min(p,100));},200);};
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
      <div style={{padding:"16px 22px 0"}}><div style={{fontSize:11,color:T.textMuted,marginBottom:3,letterSpacing:"0.04em"}}>AI-POWERED</div><div style={{fontSize:22,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Pantry Scanner</div></div>
      <div style={{padding:"16px 22px 0"}}>
        <div style={{background:"#1A1A1A",borderRadius:24,height:210,overflow:"hidden",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:80,opacity:phase==="idle"?.12:phase==="scanning"?.35:.55,transition:"opacity 0.5s"}}>🧊</div>
          {[{t:12,l:12},{t:12,r:12},{b:12,l:12},{b:12,r:12}].map((pos,i)=><div key={i} style={{position:"absolute",...pos,width:24,height:24,borderTop:pos.t!==undefined?`2px solid ${T.primaryMint}`:"none",borderBottom:pos.b!==undefined?`2px solid ${T.primaryMint}`:"none",borderLeft:pos.l!==undefined?`2px solid ${T.primaryMint}`:"none",borderRight:pos.r!==undefined?`2px solid ${T.primaryMint}`:"none"}}/>)}
          {phase==="scanning"&&<div style={{position:"absolute",left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${T.primaryMint},transparent)`,top:`${progress}%`,transition:"top 0.2s",boxShadow:`0 0 12px ${T.primaryMint}`}}/>}
          {phase==="idle"&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}><div style={{width:56,height:56,borderRadius:18,background:"rgba(78,189,114,0.2)",border:"1px solid rgba(78,189,114,0.4)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="camera" size={26} color={T.primaryMint}/></div><span style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>Tap to scan your fridge</span></div>}
          {phase==="scanning"&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><div style={{width:44,height:44,borderRadius:"50%",border:`3px solid transparent`,borderTopColor:T.primaryMint,animation:"spin 0.8s linear infinite"}}/><span style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>Scanning… {Math.round(progress)}%</span></div>}
          {phase==="results"&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}><div style={{width:44,height:44,borderRadius:"50%",background:`${T.primaryMint}30`,border:`2px solid ${T.primaryMint}`,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="check" size={22} color={T.primaryMint} sw={2.5}/></div><span style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>Scan complete!</span></div>}
        </div>
        <button onClick={phase==="results"?()=>setPhase("idle"):startScan} disabled={phase==="scanning"} style={{width:"100%",marginTop:12,background:T.primary,border:"none",borderRadius:14,padding:"14px",fontSize:14,fontWeight:700,color:"#fff",cursor:phase==="scanning"?"default":"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:phase==="scanning"?.5:1}}>
          <Icon name="camera" size={16} color="#fff"/>{phase==="results"?"Rescan":phase==="scanning"?"Scanning…":"Scan Pantry"}
        </button>
      </div>
      {phase==="results"&&(<>
        <div style={{padding:"20px 22px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div style={{fontSize:15,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>AI Detected</div><div style={{fontSize:12,color:T.textMuted,marginTop:1}}>{PANTRY_ITEMS.length} ingredients found</div></div><span style={{background:T.primarySoft,color:T.primary,fontSize:11,fontWeight:700,borderRadius:8,padding:"4px 10px"}}>✓ Scanned</span></div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {PANTRY_ITEMS.map((item,i)=>{const rc=RC[item.risk]||RC.fresh;return(
              <div key={i} style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:12,padding:"8px 12px",display:"flex",alignItems:"center",gap:8,animation:`fadeUp 0.3s ease both`,animationDelay:`${i*50}ms`}}>
                <span style={{fontSize:16}}>{item.emoji}</span>
                <div><div style={{fontSize:12,fontWeight:600,color:T.textDark}}>{item.name}</div><div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}><span style={{fontSize:10,color:T.textMuted}}>{item.qty}</span><span style={{fontSize:10,fontWeight:600,background:rc.bg,color:rc.text,borderRadius:4,padding:"1px 5px"}}>{item.risk}</span></div></div>
              </div>
            );})}
          </div>
        </div>
        <div style={{padding:"20px 22px 0"}}>
          <div style={{fontSize:15,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:4}}>Cook Now 🍳</div>
          <div style={{fontSize:12,color:T.textMuted,marginBottom:12}}>Recipes using what you have</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {SUGG.map((r,i)=>(
              <div key={i} className="rh" style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"all 0.2s",animation:`slideIn 0.35s ease both`,animationDelay:`${i*80}ms`}}>
                <div style={{width:48,height:48,borderRadius:13,background:T.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{r.emoji}</div>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.textDark,marginBottom:4}}>{r.name}</div><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:11,color:T.textMuted}}>{r.kcal} kcal · {r.time}</span><Tag label={r.match}/></div></div>
                <Icon name="arrow" size={16} color={T.textLight}/>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:"14px 22px 0"}}><button onClick={()=>navigate("chat")} style={{width:"100%",background:T.primarySoft,border:"none",borderRadius:14,padding:"14px",fontSize:13,fontWeight:700,color:T.primary,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Icon name="chat" size={16} color={T.primary}/>Ask AI Chef for more ideas</button></div>
      </>)}
    </div>
  );
}

/* ══ BUDGET SCREEN ═══════════════════════════════════════════ */
function BudgetScreen(){
  const [budget,setBudget]=useState(15000);
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState("15000");
  const [tab,setTab]=useState("overview");
  const DS=[{day:"Mon",s:4100},{day:"Tue",s:3200},{day:"Wed",s:3700},{day:"Thu",s:0},{day:"Fri",s:0},{day:"Sat",s:0},{day:"Sun",s:0}];
  const totalSpent=DS.reduce((a,d)=>a+d.s,0);
  const remaining=budget-totalSpent;
  const pct=Math.min(totalSpent/budget,1);
  const dailyB=Math.round(budget/7);
  const daysLeft=DS.filter(d=>d.s===0).length;
  const maxS=Math.max(...DS.map(d=>d.s),1);
  const isOver=remaining<0;
  const save=()=>{const v=parseInt(draft.replace(/,/g,""));if(!isNaN(v)&&v>0)setBudget(v);setEditing(false);};
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
      <div style={{padding:"16px 22px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>THIS WEEK</div><div style={{fontSize:22,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Budget Planner</div></div>
        <button onClick={()=>{setDraft(budget.toString());setEditing(true);}} style={{width:38,height:38,borderRadius:12,background:T.cardBg,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="edit" size={17} color={T.textMid}/></button>
      </div>
      <div style={{padding:"14px 22px 0"}}>
        <div style={{background:T.primary,borderRadius:24,padding:"22px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:-20,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",letterSpacing:"0.1em",marginBottom:4,textTransform:"uppercase"}}>Weekly Budget</div>
          {editing?(
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <span style={{fontSize:22,color:"rgba(255,255,255,0.7)",fontWeight:700}}>₦</span>
              <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onBlur={save} onKeyDown={e=>e.key==="Enter"&&save()}
                style={{fontSize:30,fontWeight:700,color:"#fff",background:"transparent",border:"none",borderBottom:"2px solid rgba(255,255,255,0.5)",outline:"none",width:160,fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
            </div>
          ):(
            <div style={{fontSize:34,fontWeight:700,color:"#fff",marginBottom:6}}>₦{budget.toLocaleString()}</div>
          )}
          <div style={{height:6,background:"rgba(255,255,255,0.15)",borderRadius:99,overflow:"hidden",marginBottom:14}}>
            <div style={{height:"100%",width:`${pct*100}%`,borderRadius:99,background:isOver?"#E05252":"rgba(255,255,255,0.85)",transition:"width 1s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {[{l:"Spent",v:`₦${totalSpent.toLocaleString()}`},{l:"Remaining",v:`₦${Math.abs(remaining).toLocaleString()}`,alert:isOver},{l:"Daily avg",v:`₦${Math.round(totalSpent/Math.max(DS.filter(d=>d.s>0).length,1)).toLocaleString()}`}].map(s=>(
              <div key={s.l} style={{textAlign:"center"}}><div style={{fontSize:15,fontWeight:700,color:s.alert?"#FCA5A5":"#fff"}}>{s.v}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:3}}>{s.l}</div></div>
            ))}
          </div>
        </div>
      </div>
      <div style={{padding:"14px 22px 0"}}>
        <div style={{display:"flex",background:T.inputBg,borderRadius:12,padding:4}}>
          {["overview","meals","breakdown"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px 0",background:tab===t?T.primary:"transparent",border:"none",borderRadius:9,fontSize:12,fontWeight:tab===t?700:500,color:tab===t?"#fff":T.textMuted,cursor:"pointer",transition:"all 0.2s",fontFamily:"'Plus Jakarta Sans',sans-serif",textTransform:"capitalize"}}>{t}</button>
          ))}
        </div>
      </div>
      {tab==="overview"&&(<>
        <div style={{padding:"14px 22px 0"}}>
          <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:18,padding:"18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Daily Spending</div><span style={{fontSize:12,color:T.primary,fontWeight:600}}>Target ₦{dailyB.toLocaleString()}/day</span></div>
            <div style={{display:"flex",alignItems:"flex-end",gap:8,height:90}}>
              {DS.map((d,i)=>{const h=d.s>0?Math.max((d.s/maxS)*70,12):0;const isToday=i===2;return(
                <div key={d.day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  {d.s>0&&<span style={{fontSize:9,color:isToday?T.primary:T.textMuted,fontWeight:isToday?700:400}}>₦{(d.s/1000).toFixed(1)}k</span>}
                  <div style={{width:"100%",background:isToday?T.primary:d.s>0?T.primarySoft:T.inputBg,borderRadius:"6px 6px 0 0",height:d.s>0?h:6,transition:"height 0.8s ease",border:isToday?"none":`1px solid ${T.border}`}}/>
                  <span style={{fontSize:9,color:isToday?T.primary:T.textMuted,fontWeight:isToday?700:400}}>{d.day}</span>
                </div>
              );})}
            </div>
          </div>
        </div>
        <div style={{padding:"12px 22px 0",display:"flex",gap:10}}>
          {[{l:"Days left",v:daysLeft},{l:"Daily budget",v:`₦${dailyB.toLocaleString()}`},{l:"% used",v:`${Math.round(pct*100)}%`}].map(s=>(
            <div key={s.l} style={{flex:1,background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"13px 10px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:T.textDark}}>{s.v}</div><div style={{fontSize:10,color:T.textMuted,marginTop:3}}>{s.l}</div></div>
          ))}
        </div>
        <div style={{padding:"12px 22px 0"}}>
          <div style={{background:"#FFFBF0",border:"1px solid #F5C06640",borderRadius:14,padding:"13px 16px",display:"flex",gap:10}}>
            <div style={{width:32,height:32,borderRadius:10,background:"#FFF3D0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="zap" size={14} color={T.gold}/></div>
            <div><div style={{fontSize:11,color:T.gold,fontWeight:700,marginBottom:2}}>Budget Insight</div><div style={{fontSize:13,color:T.textMid,lineHeight:1.45}}>₦{remaining.toLocaleString()} left for {daysLeft} days — ₦{Math.round(remaining/Math.max(daysLeft,1)).toLocaleString()}/day. Try beans porridge (₦1,200) to stay on track.</div></div>
          </div>
        </div>
      </>)}
      {tab==="meals"&&(
        <div style={{padding:"14px 22px 0"}}>
          <div style={{fontSize:13,color:T.textMuted,marginBottom:14}}>Affordable meals fitting your remaining budget</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {BUDGET_MEALS.map((m,i)=>(
              <div key={i} className="rh" style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"all 0.2s",animation:`slideIn 0.35s ease both`,animationDelay:`${i*60}ms`}}>
                <div style={{width:48,height:48,borderRadius:13,background:T.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{m.emoji}</div>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.textDark,marginBottom:5}}>{m.name}</div><div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}><span style={{fontSize:13,fontWeight:700,color:T.primary}}>₦{m.cost.toLocaleString()}</span><span style={{color:T.border}}>·</span><span style={{fontSize:11,color:T.textMuted}}>{m.kcal} kcal · {m.protein}g protein</span><Tag label={m.tag}/></div></div>
                <Icon name="plus" size={18} color={T.primary}/>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==="breakdown"&&(
        <div style={{padding:"14px 22px 0"}}>
          <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:18,padding:"18px",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:16}}>Spending by Category</div>
            {[{cat:"Proteins",s:4200,b:6000,e:"🍗"},{cat:"Vegetables",s:1800,b:3000,e:"🥬"},{cat:"Staples",s:2100,b:4000,e:"🍚"},{cat:"Seasonings",s:900,b:2000,e:"🫙"}].map(c=>(
              <div key={c.cat} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{c.e}</span><span style={{fontSize:13,fontWeight:600,color:T.textDark}}>{c.cat}</span></div><div><span style={{fontSize:13,fontWeight:700,color:T.primary}}>₦{c.s.toLocaleString()}</span><span style={{fontSize:11,color:T.textMuted}}> / ₦{c.b.toLocaleString()}</span></div></div>
                <div style={{height:6,background:T.inputBg,borderRadius:99,overflow:"hidden"}}><PBar pct={c.s/c.b}/></div>
              </div>
            ))}
          </div>
          <div style={{background:T.primarySoft,border:`1px solid ${T.primaryMint}44`,borderRadius:16,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:12,color:T.textMuted,marginBottom:2}}>Total this week</div><div style={{fontSize:20,fontWeight:700,color:T.primary}}>₦{totalSpent.toLocaleString()}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:12,color:T.textMuted,marginBottom:2}}>vs last week</div><div style={{fontSize:16,fontWeight:700,color:T.primaryMint}}>↓ ₦1,200</div></div>
          </div>
        </div>
      )}
      <div style={{height:16}}/>
    </div>
  );
}

/* ══ PROGRESS SCREEN ═════════════════════════════════════════ */
function ProgressScreen({uid}){
  const [tab,setTab]=useState("overview");
  const [mood,setMood]=useState(null);
  const [showWeightInput,setShowWeightInput]=useState(false);
  const [weightInput,setWeightInput]=useState("");
  const [savingWeight,setSavingWeight]=useState(false);
  const handleLogWeight=async()=>{
    const w=parseFloat(weightInput);
    if(!w||w<20||w>500)return;
    setSavingWeight(true);
    try{if(uid)await logWeight(uid,w);}catch(e){console.error(e);}
    setSavingWeight(false);
    setShowWeightInput(false);
    setWeightInput("");
  };
  const CALS=[1420,1680,1550,1700,1480,1620,1030];
  const GOAL=1650;
  const avg=Math.round(CALS.reduce((a,b)=>a+b,0)/CALS.length);
  const maxC=Math.max(...CALS);
  const WL=[{d:"1",w:82},{d:"3",w:81.5},{d:"5",w:81},{d:"7",w:80.2},{d:"9",w:79.8},{d:"11",w:79.1}];
  const minW=Math.min(...WL.map(d=>d.w)),maxW=Math.max(...WL.map(d=>d.w)),wR=maxW-minW||1,cH=70;
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
      <div style={{padding:"16px 22px 0"}}><div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>THIS WEEK</div><div style={{fontSize:22,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Progress</div></div>
      <div style={{padding:"14px 22px 0",display:"flex",gap:9}}>
        {[{l:"Day streak",v:7,i:"🔥",c:T.gold},{l:"Goals hit",v:"5/7",i:"🎯",c:T.primary},{l:"Meals logged",v:18,i:"📝",c:T.blue},{l:"Water days",v:6,i:"💧",c:T.blue}].map(s=>(
          <div key={s.l} style={{flex:1,background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"12px 6px",textAlign:"center"}}><div style={{fontSize:18,marginBottom:3}}>{s.i}</div><div style={{fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:T.textMuted,marginTop:2,lineHeight:1.3}}>{s.l}</div></div>
        ))}
      </div>
      <div style={{padding:"12px 22px 0"}}>
        <div style={{display:"flex",background:T.inputBg,borderRadius:12,padding:4}}>
          {["overview","nutrition","body","habits"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px 0",background:tab===t?T.primary:"transparent",border:"none",borderRadius:9,fontSize:11,fontWeight:tab===t?700:500,color:tab===t?"#fff":T.textMuted,cursor:"pointer",transition:"all 0.2s",fontFamily:"'Plus Jakarta Sans',sans-serif",textTransform:"capitalize"}}>{t}</button>
          ))}
        </div>
      </div>
      {tab==="overview"&&(<>
        <div style={{padding:"14px 22px 0"}}>
          <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:18,padding:"18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Calories This Week</div><span style={{fontSize:12,color:T.primary,fontWeight:600}}>Avg {avg}</span></div>
            <div style={{display:"flex",alignItems:"flex-end",gap:6,height:90}}>
              {CALS.map((c,i)=>{const h=Math.max((c/maxC)*76,4);const isT=i===6;const ok=Math.abs(c-GOAL)<100;return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{width:"100%",borderRadius:"5px 5px 0 0",height:h,background:isT?T.primary:ok?T.primarySoft:T.inputBg,border:`1px solid ${isT?T.primary:ok?T.primaryMint+"44":T.border}`,transition:"height 0.8s ease"}}/>
                  <span style={{fontSize:9,color:isT?T.primary:T.textMuted,fontWeight:isT?700:400}}>{WD[i]}</span>
                </div>
              );})}
            </div>
            <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,borderTop:`1px dashed ${T.primaryMint}`}}/><span style={{fontSize:10,color:T.primaryMint,fontWeight:600}}>Goal: {GOAL}</span><div style={{flex:1,borderTop:`1px dashed ${T.primaryMint}`}}/></div>
          </div>
        </div>
        <div style={{padding:"12px 22px 0"}}>
          <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"16px"}}>
            <div style={{fontSize:13,fontWeight:700,color:T.textDark,marginBottom:4}}>How are you feeling today?</div>
            <div style={{fontSize:11,color:T.textMuted,marginBottom:12}}>Mood affects eating habits — we track patterns</div>
            <div style={{display:"flex",justifyContent:"space-around"}}>
              {["😩","😕","😐","🙂","😄"].map((m,i)=><button key={i} onClick={()=>setMood(i)} style={{fontSize:28,background:mood===i?T.primarySoft:"transparent",border:"none",cursor:"pointer",padding:"6px",borderRadius:12,transform:mood===i?"scale(1.3)":"scale(1)",transition:"all 0.2s"}}>{m}</button>)}
            </div>
            {mood!==null&&<div style={{marginTop:10,fontSize:12,color:T.primary,fontWeight:600,textAlign:"center"}}>{mood>=3?"Great energy today! 🌟":"Rest well and eat nourishing food today 💚"}</div>}
          </div>
        </div>
        <div style={{padding:"12px 22px 0"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:12}}>AI Insights</div>
          {["🌙 You eat 340 more calories after 8pm. Try moving dinner earlier.","💪 Protein intake improved 18% this week. Keep it up!","💧 You hit your water goal 6 out of 7 days — excellent!","⚠️ Wednesday is your lowest-calorie day. Add a healthy snack."].map((ins,i)=>(
            <div key={i} style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"flex-start",gap:10,marginBottom:9}}><span style={{fontSize:18,flexShrink:0}}>{ins.slice(0,2)}</span><span style={{fontSize:13,color:T.textMid,lineHeight:1.5}}>{ins.slice(2)}</span></div>
          ))}
        </div>
      </>)}
      {tab==="nutrition"&&(
        <div style={{padding:"14px 22px 0"}}>
          <div style={{fontSize:13,color:T.textMuted,marginBottom:14}}>7-day average vs your daily goals</div>
          {[{label:"Protein",a:88,g:105,u:"g",c:T.primary},{label:"Carbs",a:162,g:200,u:"g",c:"#7B9EE8"},{label:"Fat",a:44,g:55,u:"g",c:"#D47BB0"},{label:"Calories",a:avg,g:GOAL,u:"kcal",c:T.primaryMint}].map(m=>(
            <div key={m.label} style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:14,fontWeight:700,color:T.textDark}}>{m.label}</span><div><span style={{fontSize:16,fontWeight:700,color:m.c}}>{m.a}{m.u}</span><span style={{fontSize:11,color:T.textMuted}}> / {m.g}{m.u}</span></div></div>
              <div style={{height:8,background:T.inputBg,borderRadius:99,overflow:"hidden",marginBottom:6}}><PBar pct={m.a/m.g} color={m.c}/></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:T.textMuted}}>{Math.round((m.a/m.g)*100)}% of goal</span><span style={{fontSize:11,color:m.a>=m.g*0.9?T.primaryMint:T.gold,fontWeight:600}}>{m.a>=m.g*0.9?"✓ On track":"↑ Need more"}</span></div>
            </div>
          ))}
        </div>
      )}
      {tab==="body"&&(
        <div style={{padding:"14px 22px 0"}}>
          <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:18,padding:"18px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Weight Trend</div><div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:700,color:T.primary}}>79.1 kg</div><div style={{fontSize:11,color:T.primaryMint}}>↓ 2.9 kg this month</div></div></div>
            <svg width="100%" height={cH+24} viewBox={`0 0 300 ${cH+24}`} preserveAspectRatio="none">
              <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.primary} stopOpacity="0.15"/><stop offset="100%" stopColor={T.primary} stopOpacity="0"/></linearGradient></defs>
              <path d={`M ${WL.map((d,i)=>{const x=i*(300/(WL.length-1));const y=cH-((d.w-minW)/wR)*cH+12;return`${x},${y}`;}).join(" L ")} L 300,${cH+12} L 0,${cH+12} Z`} fill="url(#wg)"/>
              <polyline points={WL.map((d,i)=>{const x=i*(300/(WL.length-1));const y=cH-((d.w-minW)/wR)*cH+12;return`${x},${y}`;}).join(" ")} fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              {WL.map((d,i)=>{const x=i*(300/(WL.length-1));const y=cH-((d.w-minW)/wR)*cH+12;return <circle key={i} cx={x} cy={y} r={i===WL.length-1?5:3} fill={i===WL.length-1?T.primary:T.primarySoft} stroke={T.primary} strokeWidth="1.5"/>;} )}
            </svg>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>{WL.map(d=><span key={d.d} style={{fontSize:9,color:T.textMuted}}>May {d.d}</span>)}</div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:12}}>
            {[{l:"Start",v:"82 kg"},{l:"Current",v:"79.1 kg"},{l:"Goal",v:"75 kg"}].map(s=>(
              <div key={s.l} style={{flex:1,background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"13px 10px",textAlign:"center"}}><div style={{fontSize:15,fontWeight:700,color:T.textDark}}>{s.v}</div><div style={{fontSize:10,color:T.textMuted,marginTop:3}}>{s.l}</div></div>
            ))}
          </div>
          <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"16px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:13,fontWeight:600,color:T.textDark}}>Goal progress</span><span style={{fontSize:13,fontWeight:700,color:T.primary}}>41%</span></div>
            <div style={{height:8,background:T.inputBg,borderRadius:99,overflow:"hidden",marginBottom:6}}><PBar pct={0.41}/></div>
            <div style={{fontSize:11,color:T.textMuted}}>4.1 kg lost · 3.9 kg to go · ~6 weeks at current pace</div>
          </div>
          {showWeightInput?(
            <div style={{display:"flex",gap:8}}>
              <input value={weightInput} onChange={e=>setWeightInput(e.target.value)} placeholder="e.g. 79.5" type="number" min="20" max="500" step="0.1"
                style={{flex:1,padding:"13px 14px",fontSize:14,background:T.inputBg,border:`1.5px solid ${T.border}`,borderRadius:14,color:T.textDark,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none"}}
                onFocus={e=>e.target.style.borderColor=T.primaryMint} onBlur={e=>e.target.style.borderColor=T.border}/>
              <button onClick={handleLogWeight} disabled={savingWeight||!weightInput}
                style={{flex:1,background:T.primary,border:"none",borderRadius:14,padding:"13px",fontSize:14,fontWeight:700,color:"#fff",cursor:savingWeight?"default":"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                {savingWeight?"Saving…":"Save"}
              </button>
            </div>
          ):(
            <button onClick={()=>setShowWeightInput(true)} style={{width:"100%",background:T.primary,border:"none",borderRadius:16,padding:"14px",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Icon name="plus" size={16} color="#fff"/>Log Today's Weight</button>
          )}
        </div>
      )}
      {tab==="habits"&&(
        <div style={{padding:"14px 22px 0"}}>
          <div style={{fontSize:13,color:T.textMuted,marginBottom:14}}>Your eating patterns this week</div>
          {[{l:"Breakfast consistency",d:[true,true,false,true,true,true,true],i:"🌅"},{l:"Hitting protein goal",d:[true,false,true,true,false,true,false],i:"💪"},{l:"Drinking 8 glasses",d:[true,true,true,false,true,true,false],i:"💧"},{l:"No late-night eating",d:[false,true,true,true,false,true,true],i:"🌙"},{l:"Logged all meals",d:[true,true,false,true,true,false,true],i:"📝"}].map(h=>{
            const done=h.d.filter(Boolean).length;
            return(
              <div key={h.l} style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 16px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{h.i}</span><span style={{fontSize:13,fontWeight:600,color:T.textDark}}>{h.l}</span></div><span style={{fontSize:12,fontWeight:700,color:done>=5?T.primaryMint:done>=3?T.gold:T.red}}>{done}/7</span></div>
                <div style={{display:"flex",gap:5}}>
                  {h.d.map((d,i)=><div key={i} style={{flex:1,height:26,borderRadius:6,background:d?T.primary:T.inputBg,border:`1px solid ${d?T.primary:T.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>{d?<Icon name="check" size={11} color="#fff" sw={2.5}/>:<span style={{fontSize:8,color:T.textLight}}>{WD[i]}</span>}</div>)}
                </div>
              </div>
            );
          })}
          <div style={{background:"#FEF2F2",border:"1px solid #FCA5A560",borderRadius:14,padding:"13px 16px",display:"flex",gap:10}}><span style={{fontSize:20,flexShrink:0}}>⚠️</span><div><div style={{fontSize:12,fontWeight:700,color:T.red,marginBottom:3}}>Late-night eating detected</div><div style={{fontSize:12,color:"#7F1D1D",lineHeight:1.5}}>You ate after 9pm on 3 nights this week. Try herbal tea as a substitute.</div></div></div>
        </div>
      )}
      <div style={{height:16}}/>
    </div>
  );
}

/* ══ COMMUNITY SCREEN ════════════════════════════════════════ */
function CommunityScreen(){
  const [tab,setTab]=useState("feed");
  const [liked,setLiked]=useState({});
  const POSTS=[
    {id:1,user:"Amaka O.",handle:"@amaka_eats",av:"👩🏾",time:"2h",text:"Made the jollof rice from my Nouri plan today — PERFECT 😭🍛 The trick is parboiling the rice first!",img:"🍛",likes:34,comments:8,tags:["#JollofRice","#NouriRecipe"]},
    {id:2,user:"Chidi K.",handle:"@fitchidi",av:"👨🏿",time:"4h",text:"Week 3 update: down 2.1kg following my Nouri meal plan consistently. Protein is everything 💪",img:null,likes:67,comments:21,tags:["#NouriJourney","#FitNaija"]},
    {id:3,user:"Funmi A.",handle:"@funmi_cooks",av:"👩🏽",time:"6h",text:"Budget tip: I spent only ₦8,200 this week and still hit all my nutrition goals! Here's how 👇",img:"🥗",likes:112,comments:45,tags:["#BudgetEating","#NaijaFit"]},
    {id:4,user:"Emeka B.",handle:"@emeka_wellness",av:"👨🏾",time:"1d",text:"Afang soup is one of the most nutrient-dense Nigerian dishes. High protein, rich in minerals. Nouri finally has the recipe right 🙌",img:"🫕",likes:89,comments:19,tags:["#AfangSoup","#NigerianFood"]},
  ];
  const RECIPES=[
    {n:"Smoky Jollof Rice",a:"Amaka O.",e:"🍛",likes:234,time:"45 min",tag:"Nigerian"},
    {n:"Light Pepper Soup", a:"Dr. Chidi",e:"🍲",likes:178,time:"25 min",tag:"Low Cal"},
    {n:"Akara Bowl",        a:"Funmi A.", e:"🫓",likes:145,time:"20 min",tag:"Budget"},
    {n:"Suya Salad",        a:"Emeka B.", e:"🥗",likes:98, time:"15 min",tag:"Grilled"},
  ];
  const CHALLENGES=[
    {t:"7-Day Protein Challenge",d:"Hit 100g protein daily for a week",j:234,e:"💪",c:T.primary},
    {t:"Budget Week",             d:"Feed yourself under ₦8k this week",j:189,e:"💰",c:"#7C3AED"},
    {t:"No Junk October",         d:"30 days of clean eating",          j:412,e:"🥗",c:T.blue},
  ];
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
      <div style={{padding:"16px 22px 0"}}><div style={{fontSize:22,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Community</div><div style={{fontSize:12,color:T.textMuted,marginTop:2}}>Nigerian food lovers & wellness warriors</div></div>
      <div style={{padding:"12px 22px 0"}}>
        <div style={{display:"flex",background:T.inputBg,borderRadius:12,padding:4}}>
          {["feed","recipes","challenges"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px 0",background:tab===t?T.primary:"transparent",border:"none",borderRadius:9,fontSize:12,fontWeight:tab===t?700:500,color:tab===t?"#fff":T.textMuted,cursor:"pointer",transition:"all 0.2s",fontFamily:"'Plus Jakarta Sans',sans-serif",textTransform:"capitalize"}}>{t}</button>
          ))}
        </div>
      </div>
      {tab==="feed"&&(
        <div style={{padding:"14px 22px 0"}}>
          <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"14px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:T.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>👤</div>
            <div style={{flex:1,background:T.inputBg,borderRadius:20,padding:"10px 14px",fontSize:13,color:T.textLight,cursor:"pointer"}}>Share a meal, tip, or progress…</div>
            <button style={{width:36,height:36,borderRadius:10,background:T.primary,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="camera" size={16} color="#fff"/></button>
          </div>
          {POSTS.map(post=>(
            <div key={post.id} style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:18,padding:"16px",marginBottom:12,animation:"slideIn 0.35s ease both"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:T.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{post.av}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.textDark}}>{post.user}</div><div style={{fontSize:11,color:T.textMuted}}>{post.handle} · {post.time} ago</div></div>
                <button style={{background:"none",border:"none",cursor:"pointer",fontSize:16}}>⋯</button>
              </div>
              <div style={{fontSize:13,color:T.textMid,lineHeight:1.55,marginBottom:post.img?12:10}}>{post.text}</div>
              {post.img&&<div style={{background:`linear-gradient(135deg,${T.primarySoft},#F0FAF3)`,borderRadius:14,height:110,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,marginBottom:12}}>{post.img}</div>}
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{post.tags.map(t=><span key={t} style={{fontSize:11,color:T.primary,fontWeight:600}}>{t}</span>)}</div>
              <div style={{display:"flex",gap:0,borderTop:`1px solid ${T.border}`,paddingTop:10}}>
                <button onClick={()=>setLiked(p=>({...p,[post.id]:!p[post.id]}))} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"6px 0",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  <Icon name="heart" size={16} color={liked[post.id]?T.red:T.textMuted} sw={liked[post.id]?2.5:1.8}/>
                  <span style={{fontSize:12,color:liked[post.id]?T.red:T.textMuted,fontWeight:liked[post.id]?700:400}}>{post.likes+(liked[post.id]?1:0)}</span>
                </button>
                <button style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"6px 0"}}><Icon name="chat" size={16} color={T.textMuted}/><span style={{fontSize:12,color:T.textMuted}}>{post.comments}</span></button>
                <button style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"6px 0"}}><Icon name="share" size={16} color={T.textMuted}/><span style={{fontSize:12,color:T.textMuted}}>Share</span></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab==="recipes"&&(
        <div style={{padding:"14px 22px 0"}}>
          <div style={{fontSize:13,color:T.textMuted,marginBottom:14}}>Community favourites this week</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {RECIPES.map((r,i)=>{const tc=TC[r.tag]||{};return(
              <div key={i} className="rh" style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden",cursor:"pointer",animation:`slideIn 0.35s ease both`,animationDelay:`${i*70}ms`,transition:"all 0.2s"}}>
                <div style={{background:`linear-gradient(135deg,${T.primarySoft},#EEF9F2)`,height:76,display:"flex",alignItems:"center",justifyContent:"center",fontSize:38}}>{r.e}</div>
                <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:T.textDark,marginBottom:4}}>{r.n}</div><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:11,color:T.textMuted}}>by {r.a} · {r.time}</span><Tag label={r.tag} bg={tc.bg} text={tc.text}/></div></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><Icon name="heart" size={14} color={T.red} sw={2}/><span style={{fontSize:12,color:T.textMuted,fontWeight:600}}>{r.likes}</span></div>
                </div>
              </div>
            );})}
          </div>
        </div>
      )}
      {tab==="challenges"&&(
        <div style={{padding:"14px 22px 0"}}>
          <div style={{fontSize:13,color:T.textMuted,marginBottom:14}}>Join a challenge and stay accountable</div>
          {CHALLENGES.map((c,i)=>(
            <div key={i} style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:18,padding:"18px",marginBottom:12,animation:`slideIn 0.35s ease both`,animationDelay:`${i*80}ms`}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                <div style={{width:52,height:52,borderRadius:16,background:c.c+"15",border:`1px solid ${c.c}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{c.e}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:4}}>{c.t}</div>
                  <div style={{fontSize:12,color:T.textMuted,marginBottom:10}}>{c.d}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{display:"flex"}}>{["👤","👤","👤"].map((u,j)=><div key={j} style={{width:22,height:22,borderRadius:"50%",background:T.primarySoft,border:`2px solid ${T.white}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,marginLeft:j?-6:0}}>{u}</div>)}</div>
                    <span style={{fontSize:11,color:T.textMuted}}>{c.j.toLocaleString()} joined</span>
                  </div>
                </div>
              </div>
              <button style={{width:"100%",marginTop:14,background:c.c,border:"none",borderRadius:12,padding:"12px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Join Challenge →</button>
            </div>
          ))}
          <div style={{background:T.primary,borderRadius:18,padding:"18px"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",fontFamily:"'Lora',serif",marginBottom:12}}>🏆 This Week's Leaderboard</div>
            {[{rank:1,n:"Funmi A.",pts:980,e:"👩🏽"},{rank:2,n:"Chidi K.",pts:870,e:"👨🏿"},{rank:3,n:"Amaka O.",pts:820,e:"👩🏾"}].map(u=>(
              <div key={u.rank} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <span style={{fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.5)",width:20}}>{u.rank}</span>
                <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{u.e}</div>
                <span style={{flex:1,fontSize:13,fontWeight:600,color:"#fff"}}>{u.n}</span>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.7)",fontWeight:600}}>{u.pts} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{height:16}}/>
    </div>
  );
}

/* ══ PROFILE SCREEN ══════════════════════════════════════════ */
function ProfileScreen({navigate,user,offlineMode,setOfflineMode}){
  const name=user?.name||"Tobi";
  const GOALS=[{l:"Daily Calories",v:"1,650 kcal",i:"🔥",p:0.78},{l:"Protein Goal",v:"105g / day",i:"💪",p:0.84},{l:"Water Goal",v:"8 glasses",i:"💧",p:0.63},{l:"Weight Goal",v:"Lose 5kg",i:"🎯",p:0.41}];
  const PREFS=[{l:"Main Goal",v:user?.answers?.goal||"Lose weight"},{l:"Weekly Budget",v:user?.answers?.budget||"₦10k – ₦20k"},{l:"Cuisine",v:(user?.answers?.cuisine||["Nigerian"]).join(", ")},{l:"Activity",v:user?.answers?.activity||"Moderately active"},{l:"Diet",v:(user?.answers?.diet||["No restrictions"]).join(", ")}];
  const SETTINGS=[{l:"Meal reminders",v:"On"},{l:"Water reminders",v:"On"},{l:"Budget alerts",v:"On"},{l:"Units",v:"Metric (kg)"},{l:"Language",v:"English"},{l:"Data & Privacy",v:""}];
  return(
    <div style={{flex:1,overflowY:"auto",paddingBottom:90}}>
      <div style={{background:T.primary,padding:"28px 22px 24px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-30,top:-30,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:64,height:64,borderRadius:20,background:"rgba(255,255,255,0.15)",border:"2px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>👤</div>
          <div>
            <div style={{fontSize:20,fontWeight:700,color:"#fff",fontFamily:"'Lora',serif"}}>{name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:3}}>{name.toLowerCase()}@nouri.app</div>
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <span style={{background:"rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.9)",fontSize:11,fontWeight:600,borderRadius:8,padding:"3px 10px"}}>🔥 7-day streak</span>
              <span style={{background:"rgba(255,193,7,0.2)",color:"#FFC107",fontSize:11,fontWeight:600,borderRadius:8,padding:"3px 10px"}}>⭐ Pro</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",marginTop:20,background:"rgba(255,255,255,0.08)",borderRadius:16,overflow:"hidden"}}>
          {[{l:"Days Active",v:"23"},{l:"Meals Logged",v:"68"},{l:"Goals Hit",v:"87%"}].map((s,i,arr)=>(
            <div key={s.l} style={{flex:1,padding:"14px 0",textAlign:"center",borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.1)":"none"}}><div style={{fontSize:20,fontWeight:700,color:"#fff"}}>{s.v}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:3}}>{s.l}</div></div>
          ))}
        </div>
      </div>
      <div style={{padding:"20px 22px 0"}}>
        <div style={{fontSize:15,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:14}}>My Goals</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {GOALS.map(g=>(
            <div key={g.l} style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{g.i}</span><span style={{fontSize:13,fontWeight:600,color:T.textDark}}>{g.l}</span></div><span style={{fontSize:12,color:T.primary,fontWeight:600}}>{Math.round(g.p*100)}%</span></div>
              <div style={{height:5,background:T.inputBg,borderRadius:99,overflow:"hidden",marginBottom:4}}><PBar pct={g.p}/></div>
              <div style={{fontSize:11,color:T.textMuted}}>{g.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"20px 22px 0"}}>
        <div style={{fontSize:15,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:12}}>Preferences</div>
        <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden"}}>
          {PREFS.map((p,i)=>(
            <div key={p.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",borderBottom:i<PREFS.length-1?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:13,color:T.textMid}}>{p.l}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,fontWeight:600,color:T.textDark,maxWidth:160,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.v}</span><Icon name="arrow" size={13} color={T.textLight}/></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"16px 22px 0"}}>
        <div style={{fontSize:15,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:12}}>Settings</div>
        <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden"}}>
          {SETTINGS.map((s,i)=>(
            <div key={s.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",borderBottom:i<SETTINGS.length-1?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:13,color:T.textMid}}>{s.l}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>{s.v&&<span style={{fontSize:12,fontWeight:600,color:T.primary}}>{s.v}</span>}<Icon name="arrow" size={13} color={T.textLight}/></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"14px 22px 0",display:"flex",gap:10}}>
        <button onClick={()=>navigate("progress")} style={{flex:1,background:T.primarySoft,border:"none",borderRadius:14,padding:"13px",fontSize:13,fontWeight:600,color:T.primary,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><Icon name="chart" size={15} color={T.primary}/>Progress</button>
        <button onClick={()=>navigate("marketplace")} style={{flex:1,background:T.primarySoft,border:"none",borderRadius:14,padding:"13px",fontSize:13,fontWeight:600,color:T.primary,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><Icon name="grocery" size={15} color={T.primary}/>Market</button>
      </div>
      {/* Offline mode toggle */}
      <div style={{padding:"12px 22px 0"}}>
        <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:T.textDark}}>Offline Mode</div>
            <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{offlineMode?"Using cached data — meals & plan available":"Data synced · tap to enable offline access"}</div>
          </div>
          <div onClick={()=>setOfflineMode&&setOfflineMode(p=>!p)}
            style={{width:44,height:26,borderRadius:13,background:offlineMode?T.primary:T.borderMid,cursor:"pointer",position:"relative",transition:"background 0.25s",flexShrink:0}}>
            <div style={{position:"absolute",top:3,left:offlineMode?20:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.25s",boxShadow:"0 1px 4px #00000020"}}/>
          </div>
        </div>
      </div>
      <div style={{padding:"12px 22px 0"}}><button style={{width:"100%",background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:14,padding:"14px",fontSize:13,fontWeight:700,color:"#DC2626",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Sign Out</button></div>
      <div style={{height:16}}/>
    </div>
  );
}

/* ══ AI CHAT SCREEN ══════════════════════════════════════════ */
function ChatScreen(){
  const [messages,setMessages]=useState([{id:1,role:"assistant",time:nowT(),content:"Hi! 👋\n\nI'm **Nouri**, your personal AI food coach. I know Nigerian and African food deeply.\n\nWhat can I help you with today?"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [showQuick,setShowQuick]=useState(true);
  const bottomRef=useRef(null);
  const histRef=useRef([]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);
  const send=async(text)=>{
    const msg=(text||input).trim();if(!msg||loading)return;
    setInput("");setShowQuick(false);
    setMessages(p=>[...p,{id:Date.now(),role:"user",content:msg,time:nowT()}]);
    setLoading(true);
    histRef.current=[...histRef.current,{role:"user",content:msg}];
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-version":"2023-06-01","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY||""},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:SYSTEM_PROMPT,messages:histRef.current})});
      const data=await res.json();
      const reply=data.content?.[0]?.text||"Sorry, couldn't respond. Try again.";
      histRef.current=[...histRef.current,{role:"assistant",content:reply}];
      if(histRef.current.length>20)histRef.current=histRef.current.slice(-20);
      setMessages(p=>[...p,{id:Date.now()+1,role:"assistant",content:reply,time:nowT()}]);
    }catch{setMessages(p=>[...p,{id:Date.now()+1,role:"assistant",content:"Connection error. Please try again. 🔄",time:nowT()}]);}
    setLoading(false);
  };
  const rc=(text,isUser)=>text.split("\n").map((line,i)=>{
    if(line.startsWith("• ")||line.startsWith("- "))return<div key={i} style={{display:"flex",gap:8,marginTop:4}}><span style={{color:isUser?"rgba(255,255,255,0.6)":T.primaryMint,flexShrink:0}}>•</span><span style={{fontSize:13,lineHeight:1.5,color:isUser?"#fff":T.textMid}} dangerouslySetInnerHTML={{__html:line.replace(/^[•\-] /,"").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}}/></div>;
    if(line.trim()==="")return<div key={i} style={{height:5}}/>;
    return<div key={i} style={{fontSize:13,lineHeight:1.6,color:isUser?"#fff":T.textMid}} dangerouslySetInnerHTML={{__html:line.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}}/>;
  });
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"12px 20px",background:T.white,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div style={{position:"relative",flexShrink:0}}>
          <div style={{position:"absolute",inset:-4,borderRadius:"50%",border:`2px solid ${T.primaryMint}`,animation:"pulse 2s ease-out infinite"}}/>
          <div style={{width:40,height:40,borderRadius:14,background:T.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🤖</div>
        </div>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Nouri</div><div style={{display:"flex",alignItems:"center",gap:5,marginTop:1}}><div style={{width:7,height:7,borderRadius:"50%",background:T.primaryMint}}/><span style={{fontSize:11,color:T.textMuted}}>AI Food Coach · Online</span></div></div>
        <button onClick={()=>{setMessages([{id:1,role:"assistant",time:nowT(),content:"Hi again! 👋 Ready to help. What do you need?"}]);histRef.current=[];setShowQuick(true);}} style={{width:36,height:36,borderRadius:10,background:T.inputBg,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="refresh" size={16} color={T.textMid}/></button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 0"}}>
        {messages.map(msg=>{const isUser=msg.role==="user";return(
          <div key={msg.id} style={{display:"flex",flexDirection:isUser?"row-reverse":"row",alignItems:"flex-end",gap:8,marginBottom:14,animation:"fadeUp 0.3s ease both"}}>
            {!isUser&&<div style={{width:30,height:30,borderRadius:10,flexShrink:0,background:T.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,marginBottom:2}}>🤖</div>}
            <div style={{maxWidth:"78%"}}>
              <div style={{background:isUser?T.primary:T.white,border:isUser?"none":`1px solid ${T.border}`,borderRadius:isUser?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"11px 14px",boxShadow:isUser?"none":"0 1px 4px #00000008"}}>{rc(msg.content,isUser)}</div>
              <div style={{fontSize:10,color:T.textLight,marginTop:3,textAlign:isUser?"right":"left"}}>{msg.time}{isUser&&" ✓✓"}</div>
            </div>
          </div>
        );})}
        {loading&&(
          <div style={{display:"flex",alignItems:"flex-end",gap:8,marginBottom:14,animation:"fadeUp 0.3s ease"}}>
            <div style={{width:30,height:30,borderRadius:10,flexShrink:0,background:T.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🤖</div>
            <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:"18px 18px 18px 4px",padding:"12px 16px"}}><div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:T.textMuted,animation:"blink 1.2s infinite",animationDelay:`${i*0.2}s`}}/>)}</div></div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      {showQuick&&(
        <div style={{padding:"10px 16px 8px",background:T.pageBg,borderTop:`1px solid ${T.border}`,flexShrink:0}}>
          <div style={{fontSize:10,color:T.textMuted,fontWeight:600,letterSpacing:"0.08em",marginBottom:8,textTransform:"uppercase"}}>Quick questions</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{QP.map((q,i)=><button key={i} className="chip" onClick={()=>send(q.text)} style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:20,padding:"7px 12px",fontSize:12,fontWeight:500,color:T.textMid,cursor:"pointer",transition:"all 0.18s",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{q.label}</button>)}</div>
        </div>
      )}
      <div style={{padding:"10px 14px",background:T.white,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"flex-end",gap:10,paddingBottom:84,flexShrink:0}}>
        <button onClick={()=>setShowQuick(p=>!p)} style={{width:40,height:40,borderRadius:12,flexShrink:0,background:showQuick?T.primarySoft:T.inputBg,border:`1px solid ${showQuick?T.primaryMint+"44":T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s"}}><Icon name="plus" size={16} color={showQuick?T.primary:T.textMuted}/></button>
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Ask anything…" rows={1}
          style={{flex:1,resize:"none",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"10px 14px",fontSize:14,color:T.textDark,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none",lineHeight:1.45,maxHeight:100,overflowY:"auto",transition:"border-color 0.2s"}}
          onFocus={e=>e.target.style.borderColor=T.primaryMint} onBlur={e=>e.target.style.borderColor=T.border}/>
        {input.trim()
          ?<button onClick={()=>send()} disabled={loading} style={{width:40,height:40,borderRadius:12,flexShrink:0,background:T.primary,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",opacity:loading?.6:1}} onMouseEnter={e=>e.currentTarget.style.background=T.primaryMid} onMouseLeave={e=>e.currentTarget.style.background=T.primary}><Icon name="send" size={16} color="#fff" sw={2}/></button>
          :<button style={{width:40,height:40,borderRadius:12,flexShrink:0,background:T.inputBg,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="mic" size={17} color={T.textMuted}/></button>
        }
      </div>
    </div>
  );
}

/* ══ GROCERY MARKETPLACE SCREEN ══════════════════════════════ */
function MarketplaceScreen({navigate}){
  const [tab,setTab]=useState("shop");
  const [cart,setCart]=useState({});
  const [activeVendor,setActiveVendor]=useState(null);
  const [orderPlaced,setOrderPlaced]=useState(false);
  const [search,setSearch]=useState("");

  const VENDORS=[
    {id:"super",  name:"Shoprite",       type:"Supermarket",  emoji:"🏪", rating:4.7, delivery:"30–45 min", fee:500,  badge:"Fast"},
    {id:"local",  name:"Mile 12 Market", type:"Local Vendor",  emoji:"🛒", rating:4.9, delivery:"45–60 min", fee:300,  badge:"Cheapest"},
    {id:"runner", name:"MarketRunner",   type:"Market Runner", emoji:"🏃", rating:4.8, delivery:"60–90 min", fee:200,  badge:"Personal"},
    {id:"fresh",  name:"FreshMart NG",   type:"Supermarket",  emoji:"🥬", rating:4.5, delivery:"25–35 min", fee:600,  badge:"Organic"},
  ];

  const PRODUCTS=[
    {id:1,  name:"Basmati Rice (5kg)",    cat:"Staples",    price:6500,  emoji:"🍚", vendor:"super",  inStock:true},
    {id:2,  name:"Chicken (1kg, frozen)", cat:"Proteins",   price:3200,  emoji:"🍗", vendor:"super",  inStock:true},
    {id:3,  name:"Afang Leaves (bunch)",  cat:"Vegetables", price:800,   emoji:"🥬", vendor:"local",  inStock:true},
    {id:4,  name:"Palm Oil (5L)",         cat:"Staples",    price:4200,  emoji:"🫙", vendor:"local",  inStock:true},
    {id:5,  name:"Eggs (crate of 30)",    cat:"Proteins",   price:4500,  emoji:"🥚", vendor:"fresh",  inStock:true},
    {id:6,  name:"Plantain (bunch)",      cat:"Fruits",     price:1200,  emoji:"🍌", vendor:"local",  inStock:true},
    {id:7,  name:"Crayfish (500g)",       cat:"Seasonings", price:1800,  emoji:"🦐", vendor:"local",  inStock:false},
    {id:8,  name:"Tomatoes (basket)",     cat:"Vegetables", price:2200,  emoji:"🍅", vendor:"runner", inStock:true},
    {id:9,  name:"Semovita (2kg)",        cat:"Staples",    price:2100,  emoji:"🌾", vendor:"super",  inStock:true},
    {id:10, name:"Goat Meat (500g)",      cat:"Proteins",   price:3800,  emoji:"🥩", vendor:"runner", inStock:true},
    {id:11, name:"Onions (5kg)",          cat:"Vegetables", price:1500,  emoji:"🧅", vendor:"local",  inStock:true},
    {id:12, name:"Yam (tuber)",           cat:"Staples",    price:1800,  emoji:"🍠", vendor:"runner", inStock:true},
  ];

  const SMART_LIST=[
    {name:"Afang Leaves",   qty:"1 bunch",  price:800,  emoji:"🥬"},
    {name:"Goat Meat",      qty:"500g",     price:3800, emoji:"🥩"},
    {name:"Stockfish",      qty:"1 piece",  price:2500, emoji:"🐟"},
    {name:"Crayfish",       qty:"100g",     price:400,  emoji:"🦐"},
    {name:"Palm Oil",       qty:"500ml",    price:900,  emoji:"🫙"},
    {name:"Basmati Rice",   qty:"2kg",      price:2800, emoji:"🍚"},
    {name:"Eggs",           qty:"6 pcs",    price:900,  emoji:"🥚"},
  ];

  const addToCart=(id,price)=>setCart(p=>({...p,[id]:(p[id]||0)+1}));
  const removeFromCart=(id)=>setCart(p=>{const n={...p};if(n[id]>1)n[id]--;else delete n[id];return n;});
  const cartTotal=Object.entries(cart).reduce((s,[id,qty])=>{const p=PRODUCTS.find(p=>p.id===parseInt(id));return s+(p?p.price*qty:0);},0);
  const cartCount=Object.values(cart).reduce((a,b)=>a+b,0);

  const filtered=PRODUCTS.filter(p=>{
    const matchSearch=p.name.toLowerCase().includes(search.toLowerCase());
    const matchVendor=!activeVendor||p.vendor===activeVendor;
    return matchSearch&&matchVendor;
  });

  const CATS=["All",...new Set(PRODUCTS.map(p=>p.cat))];
  const [activeCat,setActiveCat]=useState("All");
  const catFiltered=activeCat==="All"?filtered:filtered.filter(p=>p.cat===activeCat);

  if(orderPlaced) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 32px",textAlign:"center"}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:T.primarySoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,marginBottom:24}}>✅</div>
      <div style={{fontSize:22,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif",marginBottom:8}}>Order Placed!</div>
      <div style={{fontSize:14,color:T.textMuted,lineHeight:1.6,marginBottom:8}}>Your groceries are being picked up from <strong>{VENDORS.find(v=>v.id===activeVendor)?.name||"your vendor"}</strong>.</div>
      <div style={{background:T.primarySoft,borderRadius:14,padding:"12px 20px",marginBottom:32}}>
        <div style={{fontSize:13,color:T.primary,fontWeight:600}}>Estimated arrival: 45–60 minutes 🚴</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%"}}>
        <button onClick={()=>{setOrderPlaced(false);setCart({});setActiveVendor(null);}} style={{width:"100%",background:T.primary,border:"none",borderRadius:16,padding:"14px",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Continue Shopping</button>
        <button onClick={()=>navigate("home")} style={{width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"14px",fontSize:14,fontWeight:600,color:T.textMid,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Back to Home</button>
      </div>
    </div>
  );

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"14px 22px 0",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><div style={{fontSize:11,color:T.textMuted,marginBottom:2,letterSpacing:"0.04em"}}>DELIVERY IN 30–60 MIN</div><div style={{fontSize:22,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Marketplace</div></div>
          {cartCount>0&&(
            <button onClick={()=>setTab("cart")} style={{background:T.primary,border:"none",borderRadius:12,padding:"8px 14px",display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              <Icon name="grocery" size={15} color="#fff"/>
              <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{cartCount}</span>
              <span style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>· ₦{cartTotal.toLocaleString()}</span>
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div style={{display:"flex",background:T.inputBg,borderRadius:12,padding:4,marginBottom:12}}>
          {[{id:"shop",l:"Shop"},{id:"smart",l:"Smart List"},{id:"cart",l:`Cart${cartCount>0?` (${cartCount})`:""}`}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"8px 0",background:tab===t.id?T.primary:"transparent",border:"none",borderRadius:9,fontSize:12,fontWeight:tab===t.id?700:500,color:tab===t.id?"#fff":T.textMuted,cursor:"pointer",transition:"all 0.2s",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* ── SHOP TAB ── */}
      {tab==="shop"&&(
        <div style={{flex:1,overflowY:"auto",paddingBottom:20}}>
          {/* Vendor selector */}
          <div style={{padding:"0 22px 12px"}}>
            <div style={{fontSize:11,color:T.textMuted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Choose Vendor</div>
            <div style={{display:"flex",gap:9,overflowX:"auto",scrollbarWidth:"none",paddingBottom:4}}>
              {VENDORS.map(v=>(
                <button key={v.id} onClick={()=>setActiveVendor(activeVendor===v.id?null:v.id)}
                  style={{flexShrink:0,background:activeVendor===v.id?T.primary:T.cardBg,border:`1.5px solid ${activeVendor===v.id?T.primary:T.border}`,borderRadius:16,padding:"10px 14px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",fontFamily:"'Plus Jakarta Sans',sans-serif",minWidth:130}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                    <span style={{fontSize:18}}>{v.emoji}</span>
                    <span style={{fontSize:11,fontWeight:700,background:activeVendor===v.id?"rgba(255,255,255,0.2)":T.primarySoft,color:activeVendor===v.id?"#fff":T.primary,borderRadius:6,padding:"2px 7px"}}>{v.badge}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:activeVendor===v.id?"#fff":T.textDark}}>{v.name}</div>
                  <div style={{fontSize:11,color:activeVendor===v.id?"rgba(255,255,255,0.7)":T.textMuted,marginTop:2}}>{v.delivery}</div>
                  <div style={{fontSize:11,color:activeVendor===v.id?"rgba(255,255,255,0.6)":T.textLight,marginTop:1}}>Delivery: ₦{v.fee}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{padding:"0 22px 12px",position:"relative"}}>
            <div style={{position:"absolute",left:34,top:"50%",transform:"translateY(-55%)"}}><Icon name="search" size={16} color={T.textMuted}/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search groceries…"
              style={{width:"100%",padding:"11px 12px 11px 38px",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:12,fontSize:14,color:T.textDark,fontFamily:"'Plus Jakarta Sans',sans-serif",outline:"none"}}
              onFocus={e=>e.target.style.borderColor=T.primaryMint} onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>

          {/* Category filter */}
          <div style={{display:"flex",gap:8,overflowX:"auto",padding:"0 22px 14px",scrollbarWidth:"none"}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setActiveCat(c)} style={{flexShrink:0,background:activeCat===c?T.primary:T.cardBg,border:`1px solid ${activeCat===c?T.primary:T.border}`,borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:activeCat===c?700:500,color:activeCat===c?"#fff":T.textMid,cursor:"pointer",transition:"all 0.2s",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{c}</button>
            ))}
          </div>

          {/* Product grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,padding:"0 22px"}}>
            {catFiltered.map(prod=>{
              const qty=cart[prod.id]||0;
              return(
                <div key={prod.id} style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden",opacity:prod.inStock?1:0.5}}>
                  <div style={{background:`linear-gradient(135deg,${T.primarySoft},#EEF9F2)`,height:80,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,position:"relative"}}>
                    {prod.emoji}
                    {!prod.inStock&&<div style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.textMuted}}>Out of stock</div>}
                  </div>
                  <div style={{padding:"10px 12px"}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.textDark,marginBottom:2,lineHeight:1.3}}>{prod.name}</div>
                    <div style={{fontSize:11,color:T.textMuted,marginBottom:8}}>{prod.cat}</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:13,fontWeight:700,color:T.primary}}>₦{prod.price.toLocaleString()}</span>
                      {prod.inStock&&(qty>0?(
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <button onClick={()=>removeFromCart(prod.id)} style={{width:24,height:24,borderRadius:"50%",background:T.inputBg,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:T.textMid}}>−</button>
                          <span style={{fontSize:13,fontWeight:700,color:T.textDark,minWidth:16,textAlign:"center"}}>{qty}</span>
                          <button onClick={()=>addToCart(prod.id,prod.price)} style={{width:24,height:24,borderRadius:"50%",background:T.primary,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:"#fff"}}>+</button>
                        </div>
                      ):(
                        <button onClick={()=>addToCart(prod.id,prod.price)} style={{width:28,height:28,borderRadius:8,background:T.primarySoft,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                          <Icon name="plus" size={14} color={T.primary}/>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SMART LIST TAB ── */}
      {tab==="smart"&&(
        <div style={{flex:1,overflowY:"auto",padding:"0 22px 20px"}}>
          <div style={{background:T.primarySoft,border:`1px solid ${T.primaryMint}44`,borderRadius:14,padding:"12px 16px",marginBottom:16,display:"flex",gap:10}}>
            <span style={{fontSize:18,flexShrink:0}}>🤖</span>
            <div><div style={{fontSize:12,fontWeight:700,color:T.primary,marginBottom:2}}>AI-generated from your meal plan</div><div style={{fontSize:12,color:T.textMid,lineHeight:1.4}}>Based on Monday's afang soup & pounded yam. Add all to cart with one tap.</div></div>
          </div>

          {/* Price comparison */}
          <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"14px",marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textDark,marginBottom:10}}>Price Comparison</div>
            {[{v:"Mile 12 Market",total:9400,badge:"Cheapest 🏆"},{v:"MarketRunner",total:10100,badge:""},{v:"Shoprite",total:11800,badge:""}].map(r=>(
              <div key={r.v} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:13,color:T.textMid}}>{r.v}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {r.badge&&<span style={{fontSize:10,background:T.primarySoft,color:T.primary,fontWeight:700,borderRadius:6,padding:"2px 7px"}}>{r.badge}</span>}
                  <span style={{fontSize:13,fontWeight:700,color:T.textDark}}>₦{r.total.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {SMART_LIST.map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,marginBottom:9}}>
              <span style={{fontSize:22,flexShrink:0}}>{item.emoji}</span>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.textDark}}>{item.name}</div><div style={{fontSize:11,color:T.textMuted,marginTop:1}}>{item.qty}</div></div>
              <span style={{fontSize:13,fontWeight:700,color:T.primary}}>₦{item.price.toLocaleString()}</span>
            </div>
          ))}

          <div style={{marginTop:8,background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:14,padding:"12px 16px",display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:600,color:T.textDark}}>Total estimate</span>
            <span style={{fontSize:14,fontWeight:700,color:T.primary}}>₦{SMART_LIST.reduce((s,i)=>s+i.price,0).toLocaleString()}</span>
          </div>

          <button onClick={()=>{SMART_LIST.forEach((_,i)=>setCart(p=>({...p,[i+100]:1})));setActiveVendor("local");setTab("cart");}}
            style={{width:"100%",background:T.primary,border:"none",borderRadius:16,padding:"15px",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Icon name="grocery" size={16} color="#fff"/>Add All to Cart · ₦{SMART_LIST.reduce((s,i)=>s+i.price,0).toLocaleString()}
          </button>
        </div>
      )}

      {/* ── CART TAB ── */}
      {tab==="cart"&&(
        <div style={{flex:1,overflowY:"auto",padding:"0 22px 20px"}}>
          {cartCount===0?(
            <div style={{textAlign:"center",paddingTop:60}}>
              <div style={{fontSize:48,marginBottom:16}}>🛒</div>
              <div style={{fontSize:16,fontWeight:600,color:T.textDark,marginBottom:8}}>Your cart is empty</div>
              <div style={{fontSize:13,color:T.textMuted,marginBottom:24}}>Add items from the Shop or Smart List</div>
              <button onClick={()=>setTab("shop")} style={{background:T.primary,border:"none",borderRadius:14,padding:"13px 28px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Browse Shop</button>
            </div>
          ):(
            <>
              {/* Vendor selector for cart */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:T.textMuted,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:10}}>Deliver from</div>
                <div style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none"}}>
                  {VENDORS.map(v=>(
                    <button key={v.id} onClick={()=>setActiveVendor(v.id)}
                      style={{flexShrink:0,display:"flex",alignItems:"center",gap:7,padding:"8px 14px",background:activeVendor===v.id?T.primary:T.cardBg,border:`1px solid ${activeVendor===v.id?T.primary:T.border}`,borderRadius:12,cursor:"pointer",transition:"all 0.2s",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                      <span style={{fontSize:16}}>{v.emoji}</span>
                      <div style={{textAlign:"left"}}>
                        <div style={{fontSize:12,fontWeight:700,color:activeVendor===v.id?"#fff":T.textDark}}>{v.name}</div>
                        <div style={{fontSize:10,color:activeVendor===v.id?"rgba(255,255,255,0.6)":T.textMuted}}>{v.delivery} · ₦{v.fee} delivery</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart items */}
              {Object.entries(cart).filter(([,qty])=>qty>0).map(([id,qty])=>{
                const prod=PRODUCTS.find(p=>p.id===parseInt(id));
                if(!prod) return null;
                return(
                  <div key={id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,marginBottom:9}}>
                    <span style={{fontSize:24,flexShrink:0}}>{prod.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.textDark,marginBottom:2}}>{prod.name}</div>
                      <div style={{fontSize:12,color:T.primary,fontWeight:600}}>₦{(prod.price*qty).toLocaleString()}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <button onClick={()=>removeFromCart(parseInt(id))} style={{width:28,height:28,borderRadius:"50%",background:T.inputBg,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:T.textMid}}>−</button>
                      <span style={{fontSize:13,fontWeight:700,color:T.textDark,minWidth:20,textAlign:"center"}}>{qty}</span>
                      <button onClick={()=>addToCart(parseInt(id),prod.price)} style={{width:28,height:28,borderRadius:"50%",background:T.primary,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:"#fff"}}>+</button>
                    </div>
                  </div>
                );
              })}

              {/* Order summary */}
              <div style={{background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:16,padding:"16px",marginTop:6,marginBottom:14}}>
                {[{l:"Subtotal",v:`₦${cartTotal.toLocaleString()}`},{l:"Delivery fee",v:`₦${(activeVendor?VENDORS.find(v=>v.id===activeVendor)?.fee:500)||500}`},{l:"Service fee",v:"₦150"}].map(r=>(
                  <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
                    <span style={{fontSize:13,color:T.textMuted}}>{r.l}</span>
                    <span style={{fontSize:13,color:T.textDark,fontWeight:500}}>{r.v}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",paddingTop:10}}>
                  <span style={{fontSize:14,fontWeight:700,color:T.textDark}}>Total</span>
                  <span style={{fontSize:14,fontWeight:700,color:T.primary}}>₦{(cartTotal+(activeVendor?VENDORS.find(v=>v.id===activeVendor)?.fee||500:500)+150).toLocaleString()}</span>
                </div>
              </div>

              <button onClick={()=>{if(activeVendor)setOrderPlaced(true);else setActiveVendor("local");}}
                style={{width:"100%",background:activeVendor?T.primary:"#ccc",border:"none",borderRadius:16,padding:"15px",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {activeVendor?"Place Order 🛒":"Select a vendor first"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ══ NOTIFICATIONS PANEL ══════════════════════════════════════ */
function NotificationsPanel({notifications,onClose,onMarkAllRead,setNotifications}){
  const [vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),20);},[]);
  const close=()=>{setVis(false);setTimeout(onClose,280);};

  const ICONS={meal:"🍽️",water:"💧",budget:"💰",insight:"🤖",community:"👥"};
  const COLORS={meal:T.primary,water:T.blue,budget:T.gold,insight:"#7C3AED",community:T.primaryMint};

  const markRead=(id)=>setNotifications(p=>p.map(n=>n.id===id?{...n,read:true}:n));

  return(
    <div style={{position:"absolute",inset:0,zIndex:90,display:"flex",flexDirection:"column"}}>
      <div onClick={close} style={{position:"absolute",inset:0,background:vis?"rgba(0,0,0,0.4)":"rgba(0,0,0,0)",transition:"background 0.28s"}}/>
      <div style={{position:"relative",zIndex:1,background:T.white,borderRadius:"0 0 28px 28px",transform:vis?"translateY(0)":"translateY(-100%)",transition:"transform 0.32s cubic-bezier(0.32,0.72,0,1)",maxHeight:"75%",display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{padding:"20px 22px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          <div style={{fontSize:17,fontWeight:700,color:T.textDark,fontFamily:"'Lora',serif"}}>Notifications</div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={onMarkAllRead} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T.primary,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Mark all read</button>
            <button onClick={close} style={{width:30,height:30,borderRadius:8,background:T.inputBg,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:T.textMid}}>✕</button>
          </div>
        </div>

        {/* Notification list */}
        <div style={{overflowY:"auto",flex:1}}>
          {notifications.map(n=>(
            <div key={n.id} onClick={()=>markRead(n.id)}
              style={{display:"flex",gap:12,padding:"14px 22px",borderBottom:`1px solid ${T.border}`,background:n.read?"transparent":"#F8FBF8",cursor:"pointer",transition:"background 0.2s"}}>
              <div style={{width:40,height:40,borderRadius:12,background:COLORS[n.type]+"15",border:`1px solid ${COLORS[n.type]}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{ICONS[n.type]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
                  <div style={{fontSize:13,fontWeight:n.read?500:700,color:T.textDark,lineHeight:1.3}}>{n.title}</div>
                  {!n.read&&<div style={{width:8,height:8,borderRadius:"50%",background:T.primary,flexShrink:0,marginTop:3,marginLeft:8}}/>}
                </div>
                <div style={{fontSize:12,color:T.textMuted,lineHeight:1.4,marginBottom:4}}>{n.body}</div>
                <div style={{fontSize:10,color:T.textLight}}>{n.time}</div>
              </div>
            </div>
          ))}
          {notifications.every(n=>n.read)&&(
            <div style={{textAlign:"center",padding:"32px 22px"}}>
              <div style={{fontSize:36,marginBottom:10}}>✅</div>
              <div style={{fontSize:14,color:T.textMuted}}>You're all caught up!</div>
            </div>
          )}
        </div>

        {/* Notification settings */}
        <div style={{padding:"14px 22px",borderTop:`1px solid ${T.border}`,flexShrink:0}}>
          <div style={{fontSize:12,fontWeight:600,color:T.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:10}}>Notification Settings</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {[{l:"Meal reminders",on:true},{l:"Water alerts",on:true},{l:"Budget alerts",on:true},{l:"Community",on:false},{l:"AI insights",on:true}].map(s=>(
              <div key={s.l} style={{display:"flex",alignItems:"center",gap:6,background:s.on?T.primarySoft:T.inputBg,borderRadius:20,padding:"5px 12px",border:`1px solid ${s.on?T.primaryMint+"44":T.border}`}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:s.on?T.primaryMint:T.textLight}}/>
                <span style={{fontSize:11,fontWeight:500,color:s.on?T.primary:T.textMuted}}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ ROOT APP ════════════════════════════════════════════════ */
export default function NouriApp({ user: firebaseUser, profile, onSignOut }){
  const uid=firebaseUser?.uid||null;
  const [onboarded,setOnboarded]=useState(profile?.onboarded??false);
  const [user,setUser]=useState(profile?{name:profile.name,uid}:null);
  const [screen,setScreen]=useState("home");
  const [showNotifications,setShowNotifications]=useState(false);
  const [offlineMode,setOfflineMode]=useState(false);
  const [notifications,setNotifications]=useState([
    {id:1,type:"meal",    read:false,time:"8:00 AM",title:"Breakfast reminder 🥣",  body:"Time for oats with banana & almond. Stay on track!"},
    {id:2,type:"water",   read:false,time:"10:30 AM",title:"Hydration check 💧",    body:"You've had 2 glasses. Goal is 8 — keep sipping!"},
    {id:3,type:"budget",  read:true, time:"Yesterday",title:"Budget alert 💰",       body:"You've spent ₦11,200 this week — ₦3,800 remaining."},
    {id:4,type:"insight", read:true, time:"Yesterday",title:"Weekly insight 🤖",     body:"You hit your protein goal 5 out of 7 days this week. Great progress!"},
    {id:5,type:"community",read:true,time:"2 days ago",title:"Community 👥",         body:"Funmi A. liked your meal post. Check it out!"},
    {id:6,type:"meal",    read:true, time:"2 days ago",title:"Lunch reminder 🍛",    body:"It's 1pm — time for grilled chicken with jollof rice."},
  ]);
  const unread=notifications.filter(n=>!n.read).length;
  const markAllRead=()=>setNotifications(p=>p.map(n=>({...n,read:true})));

  // Simulate offline mode toggle
  useEffect(()=>{
    const cached={meals:WEEK_PLAN,lastSync:new Date().toISOString()};
    window.__nouriCache=cached;
  },[]);

  return(
    <div style={{minHeight:"100vh",background:"#E8EDE8",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"32px 16px 48px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{width:"100%",maxWidth:390,minHeight:844,background:T.pageBg,borderRadius:48,overflow:"hidden",boxShadow:"0 32px 80px #00000022, 0 0 0 1px #D8DDD8",display:"flex",flexDirection:"column",position:"relative"}}>

        {/* Status bar */}
        <div style={{display:"flex",justifyContent:"space-between",padding:"14px 28px 0",fontSize:12,color:T.textMuted,fontWeight:500,flexShrink:0}}>
          <span>9:41</span>
          <div style={{display:"flex",gap:8,alignItems:"center",fontSize:11}}>
            {offlineMode&&<span style={{fontSize:10,background:"#FEF2F2",color:T.red,fontWeight:700,borderRadius:6,padding:"2px 6px"}}>OFFLINE</span>}
            <span>●●●</span><span>WiFi</span><span>🔋</span>
          </div>
        </div>

        {/* App screens */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {!onboarded?(
            <OnboardingScreen onComplete={async d=>{
              if(uid){try{await saveOnboarding(uid,d.answers,d.name);}catch(e){console.error(e);}}
              setUser({name:d.name,uid});
              setOnboarded(true);
            }}/>
          ):(
            <>
              {screen==="home"        &&<HomeScreen        navigate={setScreen} user={user} onBell={()=>setShowNotifications(true)} unread={unread}/>}
              {screen==="plan"        &&<PlanScreen        navigate={setScreen} uid={uid}/>}
              {screen==="scan"        &&<ScanScreen        navigate={setScreen}/>}
              {screen==="budget"      &&<BudgetScreen      navigate={setScreen}/>}
              {screen==="progress"    &&<ProgressScreen    navigate={setScreen} uid={uid}/>}
              {screen==="community"   &&<CommunityScreen   navigate={setScreen}/>}
              {screen==="chat"        &&<ChatScreen        navigate={setScreen}/>}
              {screen==="profile"     &&<ProfileScreen     navigate={setScreen} user={user} offlineMode={offlineMode} setOfflineMode={setOfflineMode}/>}
              {screen==="marketplace" &&<MarketplaceScreen navigate={setScreen}/>}
            </>
          )}
        </div>

        {onboarded&&<BNav active={screen} setActive={setScreen}/>}

        {/* Notification panel */}
        {showNotifications&&(
          <NotificationsPanel
            notifications={notifications}
            onClose={()=>setShowNotifications(false)}
            onMarkAllRead={markAllRead}
            setNotifications={setNotifications}
          />
        )}
      </div>
    </div>
  );
}
