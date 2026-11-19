import React from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ViewStyle, Modal } from "react-native";
import { C } from "./theme";

export function Card({children, style}: {children: React.ReactNode; style?: ViewStyle}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Heading({title, subtitle}: {title: string; subtitle?: string}) {
  return <View style={{marginBottom:16}}><Text style={s.heading}>{title}</Text>{subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}</View>;
}
export function Button({title, onPress, secondary=false, disabled=false}: {title:string; onPress:()=>void; secondary?:boolean; disabled?:boolean}) {
  return <TouchableOpacity disabled={disabled} onPress={onPress} style={[s.button, secondary && s.secondary, disabled && {opacity:.5}]}><Text style={[s.buttonText, secondary && {color:C.teal}]}>{title}</Text></TouchableOpacity>;
}
export function Field({label, value, onChangeText, placeholder, secureTextEntry, keyboardType}: any) {
  return <View style={{marginBottom:13}}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder || label} placeholderTextColor={C.muted} secureTextEntry={secureTextEntry} keyboardType={keyboardType} style={s.input}/></View>;
}
export function SelectField({label, value, options, onChange}: {label:string; value:string; options:{label:string;value:string}[]; onChange:(value:string)=>void}) {
  const [open,setOpen]=React.useState(false);
  const selected=options.find(option=>option.value===value)?.label || value;
  return <View style={{marginBottom:13}}>
    <Text style={s.label}>{label}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={()=>setOpen(true)} style={[s.input,{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}]}>
      <Text style={{color:C.text,fontSize:15}}>{selected}</Text><Text style={{color:C.teal,fontWeight:"800"}}>⌄</Text>
    </TouchableOpacity>
    <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
      <TouchableOpacity activeOpacity={1} onPress={()=>setOpen(false)} style={{flex:1,backgroundColor:"rgba(0,0,0,.62)",justifyContent:"center",padding:24}}>
        <View style={{backgroundColor:C.panel,borderColor:C.line,borderWidth:1,borderRadius:16,padding:16,maxHeight:"80%"}}>
          <Text style={{color:C.text,fontWeight:"800",fontSize:17,marginBottom:10}}>{label}</Text>
          {options.map(option=><TouchableOpacity key={option.value} onPress={event=>{event.stopPropagation();onChange(option.value);setOpen(false);}} style={{paddingVertical:13,borderBottomWidth:.5,borderBottomColor:C.line}}><Text style={{color:option.value===value?C.teal:C.text,fontSize:15}}>{option.label}</Text></TouchableOpacity>)}
        </View>
      </TouchableOpacity>
    </Modal>
  </View>;
}
export function Pill({text, color=C.teal}: {text:string; color?:string}) {
  return <View style={[s.pill,{borderColor:color}]}><Text style={{color,fontSize:11,fontWeight:"700"}}>{text}</Text></View>;
}
export const s = StyleSheet.create({
  page:{flex:1,backgroundColor:C.bg,paddingHorizontal:20,paddingTop:16},
  card:{backgroundColor:C.panel,borderRadius:20,padding:17,borderWidth:1,borderColor:C.line,marginBottom:13},
  heading:{color:C.text,fontSize:23,fontWeight:"800",letterSpacing:-.4},
  sub:{color:C.muted,fontSize:13,marginTop:5,lineHeight:19},
  label:{color:C.muted,fontSize:12,fontWeight:"700",marginBottom:7},
  input:{backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,borderRadius:13,paddingHorizontal:14,paddingVertical:13,color:C.text,fontSize:15},
  button:{backgroundColor:C.teal,borderRadius:14,paddingVertical:14,paddingHorizontal:18,alignItems:"center",marginTop:7},
  secondary:{backgroundColor:"transparent",borderWidth:1,borderColor:C.teal},
  buttonText:{color:C.bg,fontSize:14,fontWeight:"800"},
  pill:{alignSelf:"flex-start",borderWidth:1,borderRadius:20,paddingHorizontal:10,paddingVertical:5},
  metric:{color:C.text,fontSize:26,fontWeight:"800"},
  muted:{color:C.muted,fontSize:12},
});
