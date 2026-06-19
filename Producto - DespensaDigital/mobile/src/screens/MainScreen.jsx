import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

const C = {
  bg: '#F4F7F5', surface:'#FFFFFF', p800:'#2D6A4F', p50:'#F0FDF4',
  text:'#1A1A2E', muted:'#6B7280', border:'#E2E8F0',
};

const SECCIONES = [
  { emoji:'🩺', label:'Patologías', desc:'Gestiona tus condiciones de salud', screen:'Patologias', color:'#FEE2E2', textColor:'#991B1B' },
  { emoji:'🛒', label:'Lista de compras', desc:'Controla lo que necesitas comprar', screen:'ListaCompras', color:'#DBEAFE', textColor:'#1E40AF' },
];

export default function MainScreen({ route, navigation }) {
  const { jwt, usuario } = route.params;
  const nombre = usuario?.pri_nom_usuario ?? 'Usuario';

  function irA(screen) {
    navigation.navigate(screen, { jwt });
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.p800 }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.saludo}>👋 Hola, {nombre}</Text>
        <Text style={s.subHeader}>¿Qué quieres gestionar hoy?</Text>
      </View>

      {/* Tarjetas */}
      <ScrollView style={s.body} contentContainerStyle={s.bodyContent} showsVerticalScrollIndicator={false}>
        {SECCIONES.map(sec => (
          <TouchableOpacity key={sec.screen} onPress={() => irA(sec.screen)} style={[s.card, { borderLeftColor: sec.textColor, borderLeftWidth:4 }]} activeOpacity={0.85}>
            <View style={[s.cardIcon, { backgroundColor: sec.color }]}>
              <Text style={s.cardEmoji}>{sec.emoji}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={s.cardLabel}>{sec.label}</Text>
              <Text style={s.cardDesc}>{sec.desc}</Text>
            </View>
            <Text style={[s.arrow, { color: sec.textColor }]}>→</Text>
          </TouchableOpacity>
        ))}

        {/* Separador web */}
        <View style={s.divider} />
        <Text style={s.dividerTxt}>Para acceder al inventario completo y el dashboard, usa la versión web.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header:       { backgroundColor:C.p800, paddingHorizontal:24, paddingTop:16, paddingBottom:28 },
  saludo:       { color:'#fff', fontSize:24, fontWeight:'800' },
  subHeader:    { color:'rgba(255,255,255,0.7)', fontSize:14, marginTop:4 },
  body:         { flex:1, backgroundColor:C.bg, borderTopLeftRadius:24, borderTopRightRadius:24, marginTop:-12 },
  bodyContent:  { padding:20, paddingBottom:40 },
  card:         { backgroundColor:C.surface, borderRadius:16, padding:18, flexDirection:'row', alignItems:'center', gap:16, marginBottom:14, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:8, elevation:2 },
  cardIcon:     { width:52, height:52, borderRadius:14, alignItems:'center', justifyContent:'center' },
  cardEmoji:    { fontSize:26 },
  cardLabel:    { fontSize:16, fontWeight:'800', color:C.text },
  cardDesc:     { fontSize:13, color:C.muted, marginTop:2 },
  arrow:        { fontSize:20, fontWeight:'700' },
  divider:      { height:1, backgroundColor:C.border, marginVertical:20 },
  dividerTxt:   { fontSize:12, color:C.muted, textAlign:'center', lineHeight:18, paddingHorizontal:10 },
});
