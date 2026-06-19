import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { createApiClient } from '../api/mobileApiClient';

const C = {
  bg: '#F4F7F5', surface: '#FFFFFF', border: '#E2E8F0',
  text: '#1A1A2E', muted: '#6B7280',
  p800: '#2D6A4F', p600: '#52B788', p50: '#F0FDF4',
  danger: '#EF4444', dangerBg: '#FEF2F2',
};

const TIPOS = ['Crónica', 'Alérgica', 'Intolerancia', 'Otra'];
const TIPO_COLORES = {
  'Crónica':      { bg: '#FEE2E2', color: '#991B1B' },
  'Alérgica':     { bg: '#FEF9C3', color: '#92400E' },
  'Intolerancia': { bg: '#DBEAFE', color: '#1E40AF' },
  'Otra':         { bg: '#F3E8FF', color: '#6B21A8' },
};

export default function PatologiasScreen({ route, navigation }) {
  const { jwt } = route.params;
  const api = createApiClient(jwt);

  const [patologias, setPatologias] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [nombre, setNombre]         = useState('');
  const [tipo, setTipo]             = useState('Crónica');
  const [guardando, setGuardando]   = useState(false);

  const cargar = useCallback(async () => {
    try { setPatologias(await api.getPatologias()); }
    catch { Alert.alert('Error', 'No se pudieron cargar las patologías.'); }
    finally { setLoading(false); }
  }, [jwt]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleCrear() {
    if (!nombre.trim()) { Alert.alert('Campo requerido', 'Ingresa el nombre de la patología.'); return; }
    setGuardando(true);
    try {
      const nueva = await api.crearPatologia({ nombre_patologia: nombre.trim(), tipo_patologia: tipo, patologia_activa: true });
      setPatologias(prev => [nueva, ...prev]);
      setModal(false); setNombre(''); setTipo('Crónica');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setGuardando(false); }
  }

  async function handleToggle(id, activa) {
    setPatologias(prev => prev.map(p => p.id_patologias === id ? { ...p, patologia_activa: !activa } : p));
    try { await api.togglePatologia(id, !activa); }
    catch {
      setPatologias(prev => prev.map(p => p.id_patologias === id ? { ...p, patologia_activa: activa } : p));
      Alert.alert('Error', 'No se pudo actualizar.');
    }
  }

  async function handleEliminar(id) {
    Alert.alert('Eliminar', '¿Eliminar esta patología?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await api.eliminarPatologia(id);
          setPatologias(prev => prev.filter(p => p.id_patologias !== id));
        } catch { Alert.alert('Error', 'No se pudo eliminar.'); }
      }},
    ]);
  }

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.titulo}>🩺 Patologías</Text>
        <TouchableOpacity onPress={() => setModal(true)} style={s.addBtn}>
          <Text style={s.addTxt}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={C.p600} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {patologias.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🩺</Text>
              <Text style={s.emptyTitle}>Sin patologías</Text>
              <Text style={s.emptyDesc}>Toca "+ Nueva" para registrar una condición de salud.</Text>
            </View>
          ) : (
            patologias.map(p => {
              const col = TIPO_COLORES[p.tipo_patologia] ?? TIPO_COLORES['Otra'];
              return (
                <View key={p.id_patologias} style={[s.card, !p.patologia_activa && s.cardDim]}>
                  <View style={[s.badge, { backgroundColor: col.bg }]}>
                    <Text style={[s.badgeTxt, { color: col.color }]}>{p.tipo_patologia}</Text>
                  </View>
                  <View style={s.cardInfo}>
                    <Text style={s.cardNombre}>{p.nombre_patologia}</Text>
                    {p.fecha_diagnostico && (
                      <Text style={s.cardFecha}>
                        Diagnóstico: {new Date(p.fecha_diagnostico).toLocaleDateString('es-CL')}
                      </Text>
                    )}
                  </View>
                  {/* Toggle */}
                  <TouchableOpacity onPress={() => handleToggle(p.id_patologias, p.patologia_activa)} style={[s.toggle, p.patologia_activa && s.toggleOn]}>
                    <View style={[s.toggleThumb, p.patologia_activa && s.toggleThumbOn]} />
                  </TouchableOpacity>
                  {/* Eliminar */}
                  <TouchableOpacity onPress={() => handleEliminar(p.id_patologias)} style={s.delBtn}>
                    <Text style={s.delTxt}>🗑</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal nueva patología */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Nueva patología</Text>

            <Text style={s.label}>Nombre *</Text>
            <TextInput
              style={s.input} placeholder="Ej: Diabetes tipo 2"
              value={nombre} onChangeText={setNombre}
              autoFocus placeholderTextColor={C.muted}
            />

            <Text style={s.label}>Tipo *</Text>
            <View style={s.tipoRow}>
              {TIPOS.map(t => (
                <TouchableOpacity key={t} onPress={() => setTipo(t)} style={[s.tipoPill, tipo === t && s.tipoPillOn]}>
                  <Text style={[s.tipoPillTxt, tipo === t && s.tipoPillTxtOn]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => { setModal(false); setNombre(''); setTipo('Crónica'); }} style={s.btnSecondary}>
                <Text style={s.btnSecondaryTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCrear} disabled={guardando} style={[s.btnPrimary, guardando && s.btnDisabled]}>
                {guardando ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnPrimaryTxt}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen:        { flex:1, backgroundColor:C.bg },
  header:        { flexDirection:'row', alignItems:'center', backgroundColor:C.p800, paddingTop:52, paddingBottom:16, paddingHorizontal:20 },
  backBtn:       { marginRight:12 },
  backTxt:       { color:'#fff', fontSize:22 },
  titulo:        { flex:1, color:'#fff', fontSize:20, fontWeight:'800' },
  addBtn:        { backgroundColor:'rgba(255,255,255,0.2)', paddingHorizontal:12, paddingVertical:6, borderRadius:20 },
  addTxt:        { color:'#fff', fontWeight:'700', fontSize:14 },
  list:          { padding:16, paddingBottom:32 },
  card:          { backgroundColor:C.surface, borderRadius:16, padding:14, marginBottom:10, flexDirection:'row', alignItems:'center', gap:10, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:8, elevation:2 },
  cardDim:       { opacity:0.55 },
  badge:         { paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  badgeTxt:      { fontSize:11, fontWeight:'700' },
  cardInfo:      { flex:1 },
  cardNombre:    { fontSize:14, fontWeight:'700', color:C.text },
  cardFecha:     { fontSize:12, color:C.muted, marginTop:2 },
  toggle:        { width:42, height:24, borderRadius:12, backgroundColor:'#D1D5DB', justifyContent:'center', padding:2 },
  toggleOn:      { backgroundColor:C.p600 },
  toggleThumb:   { width:18, height:18, borderRadius:9, backgroundColor:'#fff', shadowColor:'#000', shadowOpacity:0.2, shadowRadius:2 },
  toggleThumbOn: { alignSelf:'flex-end' },
  delBtn:        { padding:6 },
  delTxt:        { fontSize:16 },
  empty:         { alignItems:'center', paddingTop:60 },
  emptyEmoji:    { fontSize:48, marginBottom:12 },
  emptyTitle:    { fontSize:18, fontWeight:'800', color:C.text, marginBottom:6 },
  emptyDesc:     { fontSize:13, color:C.muted, textAlign:'center', lineHeight:20 },
  // Modal
  modalOverlay:  { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalCard:     { backgroundColor:C.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:28, paddingBottom:40 },
  modalTitle:    { fontSize:18, fontWeight:'800', color:C.text, marginBottom:20 },
  label:         { fontSize:13, fontWeight:'600', color:C.text, marginBottom:4, marginTop:12 },
  input:         { borderWidth:1.5, borderColor:C.border, borderRadius:10, padding:12, fontSize:14, color:C.text, backgroundColor:C.bg },
  tipoRow:       { flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:4 },
  tipoPill:      { paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1.5, borderColor:C.border, backgroundColor:C.bg },
  tipoPillOn:    { backgroundColor:C.p800, borderColor:C.p800 },
  tipoPillTxt:   { fontSize:13, fontWeight:'600', color:C.muted },
  tipoPillTxtOn: { color:'#fff' },
  modalBtns:     { flexDirection:'row', gap:12, marginTop:24 },
  btnSecondary:  { flex:1, padding:14, borderRadius:12, backgroundColor:'#F3F4F6', alignItems:'center' },
  btnSecondaryTxt:{ fontWeight:'700', color:C.text },
  btnPrimary:    { flex:1, padding:14, borderRadius:12, backgroundColor:C.p800, alignItems:'center' },
  btnPrimaryTxt: { fontWeight:'700', color:'#fff' },
  btnDisabled:   { opacity:0.6 },
});
