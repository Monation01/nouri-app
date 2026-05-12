// ─── NOURI APP — MAIN ROUTER ──────────────────────────────────
import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthScreen from "./screens/AuthScreen";
import { logOut } from "./firebase/services";

export const T = {
  pageBg:"#F4F6F4",cardBg:"#FFFFFF",inputBg:"#F2F4F2",
  primary:"#1E4D2B",primaryMid:"#2D6A3F",primarySoft:"#E6F0E9",primaryMint:"#4CAF72",
  textDark:"#1A1A1A",textMid:"#444444",textMuted:"#888888",textLight:"#BBBBBB",
  border:"#E8EBE8",borderMid:"#D4DAD4",
  gold:"#F5A623",blue:"#4A90D9",red:"#E05252",white:"#FFFFFF",
};

if(!document.getElementById("nouri-fonts")){
  const fl=document.createElement("link");fl.id="nouri-fonts";fl.rel="stylesheet";
  fl.href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap";
  document.head.appendChild(fl);
}

function AppInner(){
  const {user,profile,loading}=useAuth();
  if(loading) return(
    <div style={{minHeight:"100vh",background:T.pageBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{width:56,height:56,borderRadius:18,background:T.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:20}}>🥗</div>
      <div style={{fontSize:16,fontWeight:600,color:T.textDark,marginBottom:16}}>Nouri</div>
      <div style={{width:40,height:40,borderRadius:"50%",border:`3px solid ${T.primarySoft}`,borderTopColor:T.primary,animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if(!user) return <AuthScreen/>;
  // Once logged in, import NouriApp dynamically
  const NouriApp = require("./NouriApp").default;
  return <NouriApp user={user} profile={profile} onSignOut={logOut}/>;
}

export default function App(){
  return <AuthProvider><AppInner/></AuthProvider>;
}
