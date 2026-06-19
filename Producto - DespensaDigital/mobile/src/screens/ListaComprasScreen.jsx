import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createApiClient } from '../api/mobileApiClient';

const C = {
  bg: '#F4F7F5', surface: '#FFFFFF', border: '#E2E8F0',
  text: '#1A1A2E', muted: '#6B7280',
  p800: '#2D6A4F', p600: '#52B788',
  blue: '#1D4ED8', blueBg: '#EFF6FF',
  danger: '#991B1B', dangerBg: '#FEE2E2',
};

export default function ListaComprasScreen({ route, navigation }) {
  const { jwt } = route.params;
  const api = createApiClient(jwt);

  const [items, setItems]         = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [generando, setGenerando] = useState(false);
  const [modal, setModal]         = useState(false);
  const [selProd, setSelProd]     = useState('');
  const [cantidad, setCantidad]   = useState('1');
  const [agregando, setAgregando] = useState(false);
  const [banner, setBanner]       = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [lista, prods] = await Promise.all([api.getLista(), api.getProductos()]);
      setItems(lista); setProductos(prods);
      if (prods.length > 0) setSelProd(String(prods[0].id_producto));
    } catch { Alert.alert('Error', 'No se pudo cargar la lista.'); }
    finally { setLoading(false); }
  }, [jwt]);

  useEffect(() => { cargar(); }, [cargar]);

  function mostrarBanner(msg, tipo = 'ok') {
    setBanner({ msg, tipo });
    setTimeout(() => setBanner(null), 3500);
  }

  async function handleGenerar() {
    setGenerando(true);
    try {
      const res = await api.generarLista();
      await api.getLista().then(setItems);
      if (res.insertados === 0) mostrarBanner('Todos los productos tienen stock suficiente ✅', 'warn');
      else mostrarBanner(`🤖 ${res.insertados} producto(s) agregados automáticamente`);
    } catch { mostrarBanner('Error al generar la lista', 'warn'); }
    finally { setGenerando(false); }
  }

  async function handleAgregar() {
    if (!selProd) return;
    const cant = parseInt(cantidad, 10);
    if (isNaN(cant) || cant < 1) { Alert.alert('Cantidad inválida', 'Ingresa una cantidad mayor a 0.'); return; }
    setAgregando(true);
    try {
      await api.agregarItem(parseInt(selProd, 10), cant);
      await api.getLista().then(setItems);
      setModal(false); setCantidad('1');
      mostrarBanner('✅ Producto agregado a la lista.');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setAgregando(false); }
  }

  async function handleToggle(id, estadoActual) {
    setItems(prev => prev.map(it => it.id_lista === id ? { ...it, estado_lista: !estadoActual } : it));
    try { await api.toggleItem(id, !estadoActual); }
    catch {
      setItems(prev => prev.map(it => it.id_lista === id ? { ...it, estado_lista: estadoActual } : it));
      Alert.alert('Error', 'No se pudo actualizar.');
    }
  }

  async function handleEliminar(id) {
    try {
      await api.eliminarItem(id);
      setItems(prev => prev.filter(it => it.id_lista !== id));
    } catch { Alert.alert('Error', 'No se pudo eliminar.'); }
  }

  async function handleLimpiar() {
    const comp = items.filter(it => it.estado_lista);
    if (comp.length === 0) return;
    Alert.alert('Limpiar', `¿Eliminar ${comp.length} item(s) comprado(s)?`, [
      { text: 'Cancelar', style:'cancel' },
      { text: 'Eliminar', style:'destructive', onPress: async () => {
        try {
          await Promise.all(comp.map(it => api.eliminarItem(it.id_lista)));
          setItems(prev => prev.filter(it => !it.estado_lista));
        } catch { Alert.alert('Error', 'No se pudo limpiar.'); }
      }},
    ]);
  }

  const pendientes = items.filter(it => !it.estado_lista);
  const comprados  = items.filter(it =>  it.estado_lista);

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={s.titulo}>🛒 Lista de compras</Text>
          <Text style={s.subtitulo}>{pendientes.length} pendientes · {comprados.length} comprados</Text>
        </View>
      </View>

      {/* Botones de acción */}
      <View style={s.actionRow}>
        <TouchableOpacity onPress={handleGenerar} disabled={generando} style={[s.btnBlue, generando && s.btnDisabled]}>
          {generando
            ? <ActivityIndicator color={C.blue} size="small" />
            : <Text style={s.btnBlueTxt}>🤖 Generar auto</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModal(true)} style={s.btnGreen}>
          <Text style={s.btnGreenTxt}>+ Agregar</Text>
        </TouchableOpacity>
        {comprados.length > 0 && (
          <TouchableOpacity onPress={handleLimpiar} style={s.btnRed}>
            <Text style={s.btnRedTxt}>🗑 Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Banner */}
      {banner && (
        <View style={[s.banner, banner.tipo === 'warn' && s.bannerWarn]}>
          <Text style={[s.bannerTxt, banner.tipo === 'warn' && s.bannerTxtWarn]}>{banner.msg}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={C.p600} style={{ marginTop:40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🛒</Text>
              <Text style={s.emptyTitle}>Lista vacía</Text>
              <Text style={s.emptyDesc}>Usa "🤖 Generar auto" para detectar productos con stock bajo, o agrega items manualmente.</Text>
            </View>
          ) : (
            <>
              {pendientes.length > 0 && (
                <>
                  <Text style={s.seccion}>POR COMPRAR</Text>
                  {pendientes.map(it => <ItemRow key={it.id_lista} item={it} onToggle={handleToggle} onEliminar={handleEliminar} />)}
                </>
              )}
              {comprados.length > 0 && (
                <>
                  <Text style={[s.seccion, { marginTop:12 }]}>COMPRADOS ✓</Text>
                  {comprados.map(it => <ItemRow key={it.id_lista} item={it} onToggle={handleToggle} onEliminar={handleEliminar} dim />)}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Modal agregar manual */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Agregar producto</Text>
            <Text style={s.label}>Producto</Text>
            {productos.length === 0 ? (
              <Text style={{ color:C.muted, fontSize:13 }}>No tienes productos en el inventario.</Text>
            ) : (
              <View style={s.pickerWrap}>
                <Picker selectedValue={selProd} onValueChange={setSelProd} style={{ color: C.text }}>
                  {productos.map(p => (
                    <Picker.Item key={p.id_producto} label={`${p.nombre_producto} (stock: ${p.cantidad_unidad})`} value={String(p.id_producto)} />
                  ))}
                </Picker>
              </View>
            )}
            <Text style={s.label}>Cantidad</Text>
            <TextInput
              style={s.input} keyboardType="numeric" value={cantidad}
              onChangeText={setCantidad} placeholderTextColor={C.muted}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => setModal(false)} style={s.btnSecondary}>
                <Text style={s.btnSecondaryTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAgregar} disabled={agregando || productos.length===0} style={[s.btnPrimary, (agregando||productos.length===0) && s.btnDisabled]}>
                {agregando ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnPrimaryTxt}>Agregar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ItemRow({ item, onToggle, onEliminar, dim }) {
  const comp = item.estado_lista;
  return (
    <View style={[s.card, dim && s.cardDim]}>
      <TouchableOpacity onPress={() => onToggle(item.id_lista, comp)} style={[s.check, comp && s.checkOn]}>
        {comp && <Text style={s.checkMark}>✓</Text>}
      </TouchableOpacity>
      <View style={{ flex:1 }}>
        <Text style={[s.itemNombre, comp && s.itemNombreComp]}>{item.nombre_producto}</Text>
        <View style={s.itemMeta}>
          <Text style={s.itemSub}>×{item.cantidad_producto}</Text>
          <View style={[s.tag, item.tipo_lista==='AUTOMATICA' && s.tagAuto]}>
            <Text style={[s.tagTxt, item.tipo_lista==='AUTOMATICA' && s.tagTxtAuto]}>
              {item.tipo_lista === 'AUTOMATICA' ? '🤖 Auto' : 'Manual'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => onEliminar(item.id_lista)} style={s.delBtn}>
        <Text style={s.delTxt}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen:         { flex:1, backgroundColor:C.bg },
  header:         { flexDirection:'row', alignItems:'center', backgroundColor:C.p800, paddingTop:52, paddingBottom:16, paddingHorizontal:20 },
  backBtn:        { marginRight:12 },
  backTxt:        { color:'#fff', fontSize:22 },
  titulo:         { color:'#fff', fontSize:20, fontWeight:'800' },
  subtitulo:      { color:'rgba(255,255,255,0.7)', fontSize:12, marginTop:2 },
  actionRow:      { flexDirection:'row', gap:8, padding:14, flexWrap:'wrap' },
  btnBlue:        { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:14, paddingVertical:8, borderRadius:20, backgroundColor:C.blueBg },
  btnBlueTxt:     { color:C.blue, fontWeight:'700', fontSize:13 },
  btnGreen:       { paddingHorizontal:14, paddingVertical:8, borderRadius:20, backgroundColor:C.p800 },
  btnGreenTxt:    { color:'#fff', fontWeight:'700', fontSize:13 },
  btnRed:         { paddingHorizontal:14, paddingVertical:8, borderRadius:20, backgroundColor:C.dangerBg },
  btnRedTxt:      { color:C.danger, fontWeight:'700', fontSize:13 },
  btnDisabled:    { opacity:0.5 },
  banner:         { marginHorizontal:14, marginBottom:4, padding:10, borderRadius:10, backgroundColor:'#F0FDF4', borderWidth:1, borderColor:'#BBF7D0' },
  bannerWarn:     { backgroundColor:'#FFFBEB', borderColor:'#FDE68A' },
  bannerTxt:      { fontSize:13, fontWeight:'600', color:'#166534' },
  bannerTxtWarn:  { color:'#92400E' },
  list:           { padding:14, paddingBottom:32 },
  seccion:        { fontSize:11, fontWeight:'700', color:C.muted, letterSpacing:0.8, marginBottom:6, marginLeft:2 },
  card:           { backgroundColor:C.surface, borderRadius:14, padding:14, marginBottom:8, flexDirection:'row', alignItems:'center', gap:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:6, elevation:2 },
  cardDim:        { opacity:0.55 },
  check:          { width:22, height:22, borderRadius:6, borderWidth:2, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  checkOn:        { backgroundColor:C.p600, borderColor:C.p600 },
  checkMark:      { color:'#fff', fontSize:12, fontWeight:'700' },
  itemNombre:     { fontSize:14, fontWeight:'700', color:C.text },
  itemNombreComp: { color:C.muted, textDecorationLine:'line-through' },
  itemMeta:       { flexDirection:'row', gap:8, alignItems:'center', marginTop:2 },
  itemSub:        { fontSize:12, color:C.muted },
  tag:            { paddingHorizontal:6, paddingVertical:2, borderRadius:8, backgroundColor:'#F3F4F6' },
  tagAuto:        { backgroundColor:'#DBEAFE' },
  tagTxt:         { fontSize:10, fontWeight:'700', color:'#6B7280' },
  tagTxtAuto:     { color:'#1E40AF' },
  delBtn:         { padding:6 },
  delTxt:         { color:C.muted, fontSize:14 },
  empty:          { alignItems:'center', paddingTop:60 },
  emptyEmoji:     { fontSize:48, marginBottom:12 },
  emptyTitle:     { fontSize:18, fontWeight:'800', color:C.text, marginBottom:6 },
  emptyDesc:      { fontSize:13, color:C.muted, textAlign:'center', lineHeight:20, paddingHorizontal:20 },
  // Modal
  modalOverlay:   { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalCard:      { backgroundColor:C.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:28, paddingBottom:40 },
  modalTitle:     { fontSize:18, fontWeight:'800', color:C.text, marginBottom:16 },
  label:          { fontSize:13, fontWeight:'600', color:C.text, marginBottom:4, marginTop:12 },
  pickerWrap:     { borderWidth:1.5, borderColor:C.border, borderRadius:10, backgroundColor:C.bg, overflow:'hidden' },
  input:          { borderWidth:1.5, borderColor:C.border, borderRadius:10, padding:12, fontSize:14, color:C.text, backgroundColor:C.bg },
  modalBtns:      { flexDirection:'row', gap:12, marginTop:24 },
  btnSecondary:   { flex:1, padding:14, borderRadius:12, backgroundColor:'#F3F4F6', alignItems:'center' },
  btnSecondaryTxt:{ fontWeight:'700', color:C.text },
  btnPrimary:     { flex:1, padding:14, borderRadius:12, backgroundColor:C.p800, alignItems:'center' },
  btnPrimaryTxt:  { fontWeight:'700', color:'#fff' },
});
