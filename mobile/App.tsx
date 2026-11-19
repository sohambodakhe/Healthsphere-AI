import React, {useEffect, useState} from "react";
import { Alert, ScrollView, Text, View, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import Svg, {Path, Circle} from "react-native-svg";
import { api, setToken, getToken, startOffline, goOffline } from "./src/api";
import { C } from "./src/theme";
import { Card, Heading, Button, Field, Pill, SelectField, s } from "./src/components";

type AuthUser = {name:string; email:string};
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Screen({children}: {children:React.ReactNode}) {
  return <ScrollView style={{flex:1,backgroundColor:C.bg}} contentContainerStyle={{paddingHorizontal:19,paddingTop:17,paddingBottom:35}} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}
function Top({eyebrow, title, sub}:any) {
  return <View style={{marginBottom:19}}><Text style={{color:C.teal,fontSize:11,fontWeight:"800",letterSpacing:1.7,marginBottom:8}}>{eyebrow}</Text><Text style={s.heading}>{title}</Text>{sub ? <Text style={s.sub}>{sub}</Text>:null}</View>;
}
function AuthScreen({onLogin}: {onLogin:(u:AuthUser)=>void}) {
  const [mode,setMode]=useState<"login"|"register">("register");
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(){
    if(!email.trim() || !password){Alert.alert("Missing details","Enter your email and password.");return;}
    if(mode==="register" && !name.trim()){Alert.alert("Your name","Please enter your name.");return;}
    setBusy(true);
    try {
      const res=await api.post(mode==="register"?"/auth/register":"/auth/login", mode==="register"?{name,email,password}:{email,password});
      await setToken(res.data.access_token); onLogin(res.data.user);
    } catch(e:any){Alert.alert("Couldn't continue",e?.response?.data?.detail || "Check that the backend is running and try again.");}
    finally{setBusy(false);}
  }
  return <KeyboardAvoidingView style={{flex:1,backgroundColor:C.bg}} behavior={Platform.OS==="ios"?"padding":undefined}>
    <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:"center",padding:25}}>
      <View style={{width:58,height:58,borderRadius:19,backgroundColor:C.teal,alignItems:"center",justifyContent:"center",marginBottom:24}}>
        <Text style={{fontSize:27,color:C.bg,fontWeight:"900"}}>H</Text>
      </View>
      <Text style={{color:C.teal,fontSize:12,fontWeight:"800",letterSpacing:2}}>HEALTHSPHERE AI</Text>
      <Text style={{color:C.text,fontSize:32,fontWeight:"900",marginTop:8}}>Wellness, in{"\n"}your orbit.</Text>
      <Text style={[s.sub,{marginBottom:27,maxWidth:290}]}>Your personal space for everyday movement, nutrition and healthier habits.</Text>
      <Card>
        <Text style={{color:C.text,fontSize:19,fontWeight:"800",marginBottom:17}}>{mode==="register"?"Create your account":"Welcome back"}</Text>
        {mode==="register" && <Field label="YOUR NAME" value={name} onChangeText={setName}/>}
        <Field label="EMAIL ADDRESS" value={email} onChangeText={setEmail} keyboardType="email-address"/>
        <Field label="PASSWORD" value={password} onChangeText={setPassword} secureTextEntry/>
        <Button title={busy?"Please wait…":mode==="register"?"Create account":"Sign in"} onPress={submit} disabled={busy}/>
        <TouchableOpacity onPress={()=>setMode(mode==="register"?"login":"register")} style={{padding:14,alignItems:"center"}}>
          <Text style={{color:C.muted,fontSize:13}}>{mode==="register"?"Already have an account? ":"New to HealthSphere? "}<Text style={{color:C.teal,fontWeight:"800"}}>{mode==="register"?"Sign in":"Create account"}</Text></Text>
        </TouchableOpacity>
      </Card>
      <Button title="Continue offline on this device" secondary onPress={async()=>{try{const localUser=await startOffline(name);onLogin(localUser);}catch{Alert.alert("Couldn't start offline mode","Please try again.");}}}/>
      <Text style={{color:C.muted,fontSize:11,textAlign:"center",lineHeight:17}}>HealthSphere AI offers general wellness information, not medical diagnosis or treatment.</Text>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Home({user}:any) {
  const [profile,setProfile]=useState<any>(null); const [game,setGame]=useState<any>({xp:0,level:1,streak:0}); const [bmi,setBmi]=useState<any>(null);
  const [refresh,setRefresh]=useState(0);
  useFocusEffect(React.useCallback(()=>{(async()=>{try{const [p,g,b]=await Promise.all([api.get("/profile"),api.get("/gamification"),api.post("/health/bmi")]);setProfile(p.data);setGame(g.data);setBmi(b.data);}catch{}})();},[refresh]));
  return <Screen>
    <Top eyebrow="YOUR WELLNESS SPACE" title={`Good to see you, ${user?.name?.split(" ")[0] || "there"}.`} sub="Small, steady habits make a meaningful difference."/>
    <Card style={{backgroundColor:"#123A43",borderColor:"#24645F"}}>
      <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
        <View style={{flex:1}}><Pill text="TODAY'S OVERVIEW"/><Text style={{color:C.text,fontSize:19,fontWeight:"800",marginTop:12}}>Your journey, your pace.</Text><Text style={[s.sub,{maxWidth:210}]}>Explore movement, nourishing food and rest.</Text></View>
        <View style={{width:74,height:74,borderRadius:37,borderWidth:6,borderColor:C.teal,alignItems:"center",justifyContent:"center"}}><Text style={{color:C.text,fontWeight:"900",fontSize:20}}>{game.level || 1}</Text><Text style={{color:C.muted,fontSize:9}}>LEVEL</Text></View>
      </View>
    </Card>
    <View style={{flexDirection:"row",gap:10}}>
      <Card style={{flex:1}}><Text style={s.muted}>BMI SCREENING</Text><Text style={s.metric}>{bmi?.bmi ?? "—"}</Text><Text style={{color:C.teal,fontSize:11,fontWeight:"700",marginTop:3}}>{bmi?.category || (bmi?.age_aware?"Age-aware assessment":"")}</Text><Text style={s.muted}>{bmi?.interpretation || "Complete your profile to view an assessment."}</Text></Card>
      <Card style={{flex:1}}><Text style={s.muted}>XP POINTS</Text><Text style={s.metric}>{game.xp ?? 0}</Text><Text style={s.muted}>Level {game.level ?? 1}</Text></Card>
    </View>
    <View style={{flexDirection:"row",gap:10}}>
      <Card style={{flex:1}}><Text style={s.muted}>STREAK</Text><Text style={s.metric}>{game.streak ?? 0} <Text style={{fontSize:14,color:C.orange}}>days</Text></Text><Text style={s.muted}>Keep showing up</Text></Card>
      <Card style={{flex:1}}><Text style={s.muted}>CURRENT GOAL</Text><Text style={{color:C.text,fontSize:17,fontWeight:"800",marginTop:7}}>{(profile?.goal || "Wellness").replaceAll("_"," ")}</Text><Text style={s.muted}>Your focus</Text></Card>
    </View>
    <Heading title="Your daily toolkit" subtitle="Jump back into the areas that matter."/>
    {["Build a balanced meal plan","Explore a movement plan","Chat with your wellness assistant"].map((t,i)=><Card key={t} style={{flexDirection:"row",alignItems:"center",gap:12}}><View style={{width:42,height:42,borderRadius:14,backgroundColor:[ "#183E42","#263657","#3A3157"][i],alignItems:"center",justifyContent:"center"}}><Text style={{color:C.teal,fontSize:20}}>{["◒","↗","✦"][i]}</Text></View><View style={{flex:1}}><Text style={{color:C.text,fontWeight:"800"}}>{t}</Text><Text style={s.muted}>Personalized to your preferences</Text></View><Text style={{color:C.teal,fontSize:20}}>›</Text></Card>)}
    <Button title="Refresh overview" secondary onPress={()=>setRefresh(x=>x+1)}/>
  </Screen>;
}

function Profile({user,onLogout}:any) {
  const [p,setP]=useState<any>({age:"18",height_cm:"170",weight_kg:"65",goal:"general_wellness",activity_level:"moderate",dietary_preference:"no_preference",allergies:"",restrictions:"",experience_level:"beginner",equipment:"bodyweight",workout_days:"3"});
  const [bmi,setBmi]=useState<any>(null);
  const [busy,setBusy]=useState(false);
  useFocusEffect(React.useCallback(()=>{let active=true;Promise.all([api.get("/profile"),api.post("/health/bmi")]).then(([r,b])=>{if(active&&r.data)setP(Object.fromEntries(Object.entries(r.data).map(([k,v])=>[k,String(v??"")])));if(active)setBmi(b.data);}).catch(()=>{});return()=>{active=false;};},[]));
  const update=(k:string,v:string)=>setP((old:any)=>({...old,[k]:v}));
  async function save(){setBusy(true);try{const body={...p,age:Number(p.age),height_cm:Number(p.height_cm),weight_kg:Number(p.weight_kg),workout_days:Number(p.workout_days)};await api.put("/profile",body);const bmiResponse=await api.post("/health/bmi");setBmi(bmiResponse.data);Alert.alert("Saved","Your profile and BMI screening have been updated.");}catch(e:any){Alert.alert("Could not save",e?.response?.data?.detail||"Check your entries.");}finally{setBusy(false);}}
  async function remove(){Alert.alert("Delete account?","This permanently deletes your prototype account and its associated data.",[{text:"Cancel",style:"cancel"},{text:"Delete",style:"destructive",onPress:async()=>{try{await api.delete("/account");await setToken(null);onLogout();}catch{Alert.alert("Error","Could not delete account.");}}}]);}
  return <Screen><Top eyebrow="YOUR DETAILS" title="Profile & preferences" sub={`Signed in as ${user?.email || ""}`}/>
    <Card>
      <Field label="NAME" value={user?.name || ""} onChangeText={()=>{}}/>
      <Field label="AGE" value={p.age} onChangeText={(v:string)=>update("age",v)} keyboardType="numeric"/>
      <Field label="HEIGHT (CM)" value={p.height_cm} onChangeText={(v:string)=>update("height_cm",v)} keyboardType="numeric"/>
      <Field label="CURRENT WEIGHT (KG)" value={p.weight_kg} onChangeText={(v:string)=>update("weight_kg",v)} keyboardType="numeric"/>
      <View style={{backgroundColor:C.panel2,borderRadius:12,padding:13,marginBottom:14}}><Text style={s.muted}>BMI SCREENING</Text><Text style={{color:C.text,fontSize:21,fontWeight:"800",marginTop:4}}>{bmi?.bmi ?? "Update your measurements to calculate"}</Text>{bmi?.category?<Text style={{color:C.teal,fontWeight:"700",marginTop:3}}>{bmi.category}</Text>:null}<Text style={s.sub}>{bmi?.interpretation || "BMI is a screening measure, not a diagnosis."}</Text></View>
      <SelectField label="FITNESS GOAL" value={p.goal} onChange={(v:string)=>update("goal",v)} options={[{label:"General wellness",value:"general_wellness"},{label:"Build strength",value:"build_strength"},{label:"Improve endurance",value:"improve_endurance"},{label:"Increase mobility",value:"increase_mobility"},{label:"Feel more energetic",value:"more_energy"}]}/>
      <SelectField label="ACTIVITY LEVEL" value={p.activity_level} onChange={(v:string)=>update("activity_level",v)} options={[{label:"Mostly sitting",value:"sedentary"},{label:"Light activity",value:"light"},{label:"Moderate activity",value:"moderate"},{label:"Very active",value:"very_active"}]}/>
      <SelectField label="DIETARY PREFERENCE" value={p.dietary_preference} onChange={(v:string)=>update("dietary_preference",v)} options={[{label:"No preference",value:"no_preference"},{label:"Vegetarian",value:"vegetarian"},{label:"Vegan",value:"vegan"},{label:"Pescatarian",value:"pescatarian"},{label:"Dairy-free",value:"dairy_free"},{label:"Gluten-free",value:"gluten_free"}]}/>
      <Field label="ALLERGIES" value={p.allergies} onChangeText={(v:string)=>update("allergies",v)} placeholder="List any allergies"/>
      <Field label="OTHER FOOD RESTRICTIONS" value={p.restrictions} onChangeText={(v:string)=>update("restrictions",v)}/>
      <SelectField label="WORKOUT EXPERIENCE" value={p.experience_level} onChange={(v:string)=>update("experience_level",v)} options={[{label:"Beginner",value:"beginner"},{label:"Some experience",value:"intermediate"},{label:"Experienced",value:"advanced"}]}/>
      <Field label="AVAILABLE EQUIPMENT" value={p.equipment} onChangeText={(v:string)=>update("equipment",v)}/>
      <Field label="WORKOUT DAYS PER WEEK" value={p.workout_days} onChangeText={(v:string)=>update("workout_days",v)} keyboardType="numeric"/>
      <Button title={busy?"Saving…":"Save profile"} onPress={save} disabled={busy}/>
    </Card>
    <Button title="Sign out" secondary onPress={async()=>{await setToken(null);onLogout();}}/>
    <Button title="Delete account and data" secondary onPress={remove}/>
  </Screen>;
}

function Planner({kind}: {kind:"diet"|"workout"}) {
  const [result,setResult]=useState(""); const [busy,setBusy]=useState(false); const [generatedProfile,setGeneratedProfile]=useState("");
  useFocusEffect(React.useCallback(()=>{let active=true;api.get("/profile").then(r=>{if(!active||!result)return;const profile=r.data||{};const key=JSON.stringify(kind==="diet"?[profile.age,profile.height_cm,profile.weight_kg,profile.goal,profile.activity_level,profile.dietary_preference,profile.allergies,profile.restrictions]:[profile.age,profile.goal,profile.activity_level,profile.experience_level,profile.equipment,profile.workout_days]);if(!generatedProfile||key!==generatedProfile){setResult("");setGeneratedProfile("");}}).catch(()=>{});return()=>{active=false;};},[kind,generatedProfile,result]));
  async function generate(){setBusy(true);setResult("");try{const p=await api.get("/profile");const profile=p.data||{};const key=JSON.stringify(kind==="diet"?[profile.age,profile.height_cm,profile.weight_kg,profile.goal,profile.activity_level,profile.dietary_preference,profile.allergies,profile.restrictions]:[profile.age,profile.goal,profile.activity_level,profile.experience_level,profile.equipment,profile.workout_days]);const r=await api.post(`/plans/${kind}`);setResult(r.data.plan);setGeneratedProfile(key);}catch(e:any){Alert.alert("Couldn't generate",e?.response?.data?.detail||"Check your connection and profile.");}finally{setBusy(false);}}
  return <Screen><Top eyebrow={kind==="diet"?"NUTRITION":"MOVEMENT"} title={kind==="diet"?"A little more balance.":"Move in your own way."} sub={kind==="diet"?"Meal inspiration shaped around your food preferences and allergies.":"An adaptable weekly movement plan based on your experience and equipment."}/>
    <Card><Pill text="PERSONALIZED PLAN"/><Text style={{color:C.text,fontSize:17,fontWeight:"800",marginTop:12}}>{kind==="diet"?"Your balanced meal inspiration":"Your movement outline"}</Text><Text style={s.sub}>{kind==="diet"?"A flexible starting point, not a strict diet.":"Adjust activities to your comfort. Stop if something hurts."}</Text><Button title={busy?"Creating your plan…":`Generate ${kind} plan`} onPress={generate} disabled={busy}/></Card>
    {busy?<ActivityIndicator color={C.teal} style={{margin:20}}/>:null}
    {result?<Card><View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><Text style={{color:C.text,fontWeight:"800",fontSize:17}}>Your plan</Text><Button title="Generate again" secondary onPress={generate} disabled={busy}/></View><Text style={{color:C.text,fontSize:14,lineHeight:23,marginTop:13}}>{result}</Text></Card>:null}
  </Screen>;
}

function Assistant() {
  const [messages,setMessages]=useState<any[]>([{role:"assistant",content:"Hi! I'm your HealthSphere wellness assistant. Ask me about balanced nutrition, enjoyable movement, sleep or everyday healthy habits. I can't diagnose or prescribe, but I can help with general information."}]);
  const [busy,setBusy]=useState(false);
  const suggestedQuestions=["Build me a balanced meal plan","Suggest a gentle movement routine","How can I sleep better?","What can I do to manage stress?","Help me build a healthy habit"];
  async function send(msg:string){if(!msg||busy)return;setMessages(m=>[...m,{role:"user",content:msg}]);setBusy(true);try{const r=await api.post("/assistant/chat",{message:msg});setMessages(m=>[...m,{role:"assistant",content:r.data.reply}]);}catch(e:any){setMessages(m=>[...m,{role:"assistant",content:e?.response?.data?.detail||"I couldn't complete that. Choose one of the suggested questions and try again."}]);}finally{setBusy(false);}}
  return <View style={{flex:1,backgroundColor:C.bg,padding:18}}>
    <Top eyebrow="HEALTHSPHERE AI" title="Your wellness space." sub="Ask questions, explore habits and learn at your pace."/>
    <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom:12}}>
      {messages.map((m,i)=><View key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",backgroundColor:m.role==="user"?"#15564F":C.panel,borderColor:C.line,borderWidth:1,borderRadius:17,padding:13,marginBottom:10,maxWidth:"88%"}}><Text style={{color:C.text,fontSize:14,lineHeight:21}}>{m.content}</Text></View>)}
      {busy?<ActivityIndicator color={C.teal}/>:null}
      <Text style={[s.muted,{marginTop:8,marginBottom:7}]}>PICK A QUESTION</Text>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{suggestedQuestions.map(question=><TouchableOpacity key={question} disabled={busy} onPress={()=>send(question)} style={{borderWidth:1,borderColor:C.teal,borderRadius:14,paddingHorizontal:12,paddingVertical:10,opacity:busy?.55:1}}><Text style={{color:C.teal,fontSize:12,fontWeight:"700"}}>{question}</Text></TouchableOpacity>)}</View>
    </ScrollView>
    <Text style={{color:C.muted,fontSize:10,textAlign:"center",paddingTop:10}}>Offline guidance · General information only · Not a medical service</Text>
  </View>;
}

function Progress() {
  const [data,setData]=useState<any>({weights:[],activities:[]}); const [game,setGame]=useState<any>({xp:0,level:1,streak:0,badges:[],next_milestone_xp:100}); const [weight,setWeight]=useState("");
  const [busy,setBusy]=useState(false);
  async function load(){try{const [r,g]=await Promise.all([api.get("/progress"),api.get("/gamification")]);setData(r.data);setGame(g.data);}catch{}}
  useFocusEffect(React.useCallback(()=>{load();},[]));
  async function log(){const n=Number(weight);if(!n){Alert.alert("Enter a weight","Enter a valid number in kilograms.");return;}setBusy(true);try{await api.post("/progress/weight",{weight_kg:n});let rewarded=true;try{await api.post("/gamification/events",{event_key:"weight-log",event_type:"weight_log"});}catch(e:any){if(e?.response?.status!==409)throw e;rewarded=false;}setWeight("");await load();Alert.alert("Saved",rewarded?"Your check-in is saved and earned 5 XP.":"Your check-in is saved. You already earned today's check-in XP.");}catch(e:any){if(e?.response?.status===409){setWeight("");await load();Alert.alert("Saved","Your check-in is saved. You already earned today's check-in XP.");}else Alert.alert("Couldn't save",e?.response?.data?.detail||"Try again.");}finally{setBusy(false);}}
  async function logWorkout(){setBusy(true);try{const day=new Date().toISOString().slice(0,10);await api.post("/gamification/events",{event_key:`movement-${day}`,event_type:"workout"});await load();Alert.alert("Movement logged","You earned 20 XP for recording today's movement.");}catch(e:any){Alert.alert(e?.response?.status===409?"Already logged today":"Couldn't log activity",e?.response?.data?.detail||"Today's movement XP has already been claimed.");}finally{setBusy(false);}}
  const values=data.weights || [];
  return <Screen><Top eyebrow="YOUR JOURNEY" title="Progress, not perfection." sub="Track your check-ins and celebrate consistency."/>
    <Card><Text style={{color:C.text,fontWeight:"800",fontSize:17}}>Your rewards</Text><View style={{flexDirection:"row",gap:10,marginTop:12}}><View style={{flex:1}}><Text style={s.muted}>TOTAL XP</Text><Text style={s.metric}>{game.xp}</Text></View><View style={{flex:1}}><Text style={s.muted}>CURRENT STREAK</Text><Text style={s.metric}>{game.streak} <Text style={{fontSize:13,color:C.orange}}>days</Text></Text></View></View><Text style={[s.sub,{marginTop:8}]}>Level {game.level} · {Math.max(0,(game.next_milestone_xp||((game.level||1)*100))-game.xp)} XP to next level</Text><View style={{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:10}}>{(game.badges||[]).length?game.badges.map((badge:string)=><Pill key={badge} text={badge}/>):<Text style={s.muted}>Log activities to unlock milestones at 50, 200 and 500 XP, or build a 3-day rhythm.</Text>}</View><Button title={busy?"Saving…":"Log today's movement · +20 XP"} onPress={logWorkout} disabled={busy}/></Card>
    <Card><Text style={{color:C.text,fontWeight:"800",fontSize:17,marginBottom:10}}>Log a check-in</Text><Field label="WEIGHT (KG)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad"/><Button title={busy?"Saving…":"Save check-in"} onPress={log} disabled={busy}/></Card>
    <Card><Text style={{color:C.text,fontWeight:"800",fontSize:17,marginBottom:12}}>Weight history</Text>
      {values.length===0?<Text style={s.sub}>Your check-ins will appear here after your first entry.</Text>:values.slice(-8).map((x:any,i:number)=><View key={i} style={{flexDirection:"row",justifyContent:"space-between",paddingVertical:10,borderBottomWidth:.5,borderBottomColor:C.line}}><Text style={{color:C.muted,fontSize:12}}>{new Date(x.recorded_at).toLocaleDateString()}</Text><Text style={{color:C.text,fontWeight:"800"}}>{x.weight_kg} kg</Text><Text style={{color:C.teal,fontSize:12}}>BMI {x.bmi}</Text></View>)}
    </Card>
    <Card><Text style={{color:C.text,fontWeight:"800",fontSize:17,marginBottom:8}}>Recent activities</Text>{data.activities?.length?data.activities.map((x:any,i:number)=><Text key={i} style={{color:C.muted,paddingVertical:6}}>✦  {x.event_key.replaceAll("-"," ")} · +{x.xp} XP</Text>):<Text style={s.sub}>Completed activities will show up here.</Text>}</Card>
  </Screen>;
}

function MainTabs({user,onLogout}:any) {
  const common={headerShown:false,tabBarStyle:{backgroundColor:"#0C2030",borderTopColor:C.line,height:67,paddingTop:7,paddingBottom:8},tabBarActiveTintColor:C.teal,tabBarInactiveTintColor:C.muted,tabBarLabelStyle:{fontSize:10,fontWeight:"700" as const}};
  return <Tab.Navigator screenOptions={common}>
    <Tab.Screen name="Home">{()=> <Home user={user}/>}</Tab.Screen>
    <Tab.Screen name="Diet">{()=> <Planner kind="diet"/>}</Tab.Screen>
    <Tab.Screen name="Workout">{()=> <Planner kind="workout"/>}</Tab.Screen>
    <Tab.Screen name="Assistant" component={Assistant}/>
    <Tab.Screen name="Progress" component={Progress}/>
    <Tab.Screen name="Profile">{()=> <Profile user={user} onLogout={onLogout}/>}</Tab.Screen>
  </Tab.Navigator>;
}

export default function App() {
  const [user,setUser]=useState<AuthUser|null>(null); const [checking,setChecking]=useState(true);
  useEffect(()=>{(async()=>{try{const token=await getToken();if(token){const r=await api.get("/users/me");setUser(r.data);}}catch{try{const localUser=await goOffline();await setToken(`offline:${localUser.email}`);setUser(localUser);}catch{await setToken(null);}}finally{setChecking(false);}})();},[]);
  if(checking)return <View style={{flex:1,backgroundColor:C.bg,alignItems:"center",justifyContent:"center"}}><ActivityIndicator color={C.teal}/><Text style={{color:C.muted,marginTop:12}}>Preparing your space…</Text></View>;
  const navTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
      ...DefaultTheme.colors,
      primary: C.teal,
      background: C.bg,
      card: "#0C2030",
      text: C.text,
      border: C.line,
      notification: C.teal,
    },
  };

  return <NavigationContainer theme={navTheme}>
    <StatusBar style="light"/>
    <Stack.Navigator screenOptions={{headerShown:false}}>
      {user?<Stack.Screen name="Main">{()=> <MainTabs user={user} onLogout={()=>setUser(null)}/>}</Stack.Screen>:<Stack.Screen name="Auth">{()=> <AuthScreen onLogin={setUser}/>}</Stack.Screen>}
    </Stack.Navigator>
  </NavigationContainer>;
}
