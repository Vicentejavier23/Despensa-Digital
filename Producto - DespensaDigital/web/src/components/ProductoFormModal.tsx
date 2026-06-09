import React, { useEffect, useRef, useState } from 'react';
import { productosApi } from '../api/productosApi';
import type { Producto } from '../types';
import './ProductoFormModal.css';

interface FormData {
  nombre_producto:   string;
  marca_producto:    string;
  fecha_vencimiento: string;
  cantidad_unidad:   string;
  tipo_producto:     string;
  medida_valor:      string;
  medida_unidad:     string;
  fecha_apertura:    string;
  nombre_categoria:  string;
  tipo_almacenaje:   string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const TIPOS_PRODUCTO   = ['Alimento', 'Bebida', 'Lácteo', 'Congelado', 'Otro'];
const TIPOS_ALMACENAJE = ['Despensa', 'Refrigerador', 'Congelador', 'Alacena', 'Bodega', 'Baño'];
const CATEGORIAS = [
  'Lácteos', 'Carnes y embutidos', 'Frutas', 'Verduras',
  'Granos y cereales', 'Bebidas', 'Limpieza', 'Higiene personal',
  'Congelados', 'Snacks', 'Condimentos y salsas', 'Panadería', 'Otros',
];

// Unidades separadas por tipo para evitar mezclar peso con volumen
const UNIDADES_PESO   = ['Gramo (g)', 'Kilogramo (kg)'];
const UNIDADES_VOLUMEN = ['Mililitro (ml)', 'Litro (l)'];
const TODAS_UNIDADES  = [...UNIDADES_PESO, ...UNIDADES_VOLUMEN];

const FORM_VACÍO: FormData = {
  nombre_producto:   '',
  marca_producto:    '',
  fecha_vencimiento: '',
  cantidad_unidad:   '1',
  tipo_producto:     '',
  medida_valor:      '',
  medida_unidad:     '',
  fecha_apertura:    '',
  nombre_categoria:  '',
  tipo_almacenaje:   '',
};

interface Props {
  productoEditar?: Producto | null;
  onCerrar:   () => void;
  onGuardado: (p: Producto) => void;
}

export default function ProductoFormModal({ productoEditar, onCerrar, onGuardado }: Props) {
  const overlayRef  = useRef<HTMLDivElement>(null);
  const primerInput = useRef<HTMLInputElement>(null);
  const esEdicion   = !!productoEditar;

  const [form,    setForm]    = useState<FormData>(FORM_VACÍO);
  const [errores, setErrores] = useState<FormErrors>({});
  const [saving,  setSaving]  = useState(false);
  const [errGen,  setErrGen]  = useState('');

  // Pre-llenar al editar
  useEffect(() => {
    if (productoEditar) {
      let medida_valor  = '';
      let medida_unidad = '';
      // Mostrar SOLO el campo que tiene dato — no ambos
      if (productoEditar.peso_gramos) {
        medida_valor  = String(productoEditar.peso_gramos);
        medida_unidad = 'Gramo (g)';
      } else if (productoEditar.mililitros) {
        medida_valor  = String(productoEditar.mililitros);
        medida_unidad = 'Mililitro (ml)';
      }
      setForm({
        nombre_producto:   productoEditar.nombre_producto,
        marca_producto:    productoEditar.marca_producto,
        fecha_vencimiento: productoEditar.fecha_vencimiento?.slice(0, 10) ?? '',
        cantidad_unidad:   String(productoEditar.cantidad_unidad),
        tipo_producto:     productoEditar.tipo_producto,
        medida_valor,
        medida_unidad,
        fecha_apertura:    productoEditar.fecha_apertura?.slice(0, 10) ?? '',
        nombre_categoria:  productoEditar.nombre_categoria ?? '',
        tipo_almacenaje:   productoEditar.tipo_almacenaje  ?? '',
      });
    } else {
      setForm(FORM_VACÍO);
    }
    setErrores({});
    setErrGen('');
  }, [productoEditar]);

  useEffect(() => { setTimeout(() => primerInput.current?.focus(), 80); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCerrar]);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const set = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [k]: e.target.value }));
      if (errores[k]) setErrores(prev => ({ ...prev, [k]: undefined }));
      setErrGen('');
    };

  // Al cambiar unidad, limpiar el valor si cambia de tipo (peso → volumen o viceversa)
  const handleUnidadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevaUnidad = e.target.value;
    const eraVolumen  = UNIDADES_VOLUMEN.includes(form.medida_unidad);
    const esVolumen   = UNIDADES_VOLUMEN.includes(nuevaUnidad);
    // Si cambia de peso a volumen o viceversa, limpiar el valor
    if (eraVolumen !== esVolumen && form.medida_valor) {
      setForm(prev => ({ ...prev, medida_unidad: nuevaUnidad, medida_valor: '' }));
    } else {
      setForm(prev => ({ ...prev, medida_unidad: nuevaUnidad }));
    }
    if (errores.medida_valor) setErrores(prev => ({ ...prev, medida_valor: undefined }));
    setErrGen('');
  };

  function validar(): boolean {
    const errs: FormErrors = {};
    const MAX_INT = 2147483647;

    if (!form.nombre_producto.trim())
      errs.nombre_producto = 'El nombre del producto es obligatorio';

    if (!form.marca_producto.trim())
      errs.marca_producto = 'La marca es obligatoria';

    if (!form.fecha_vencimiento)
      errs.fecha_vencimiento = 'La fecha de vencimiento es obligatoria';
    else if (isNaN(Date.parse(form.fecha_vencimiento)))
      errs.fecha_vencimiento = 'Fecha inválida';

    const cant = parseInt(form.cantidad_unidad, 10);
    if (!form.cantidad_unidad || isNaN(cant) || cant < 1)
      errs.cantidad_unidad = 'La cantidad debe ser mayor a 0';
    else if (cant > MAX_INT)
      errs.cantidad_unidad = 'Cantidad demasiado grande';

    if (!form.tipo_producto)
      errs.tipo_producto = 'Selecciona el tipo de producto';

    // Validar medida solo si se llenó el valor
    if (form.medida_valor && !form.medida_unidad)
      errs.medida_unidad = 'Selecciona la unidad de medida';
    if (form.medida_unidad && !form.medida_valor)
      errs.medida_valor = 'Ingresa la cantidad de la medida';
    if (form.medida_valor && form.medida_unidad) {
      const num = Number(form.medida_valor);
      if (isNaN(num) || num <= 0) errs.medida_valor = 'La medida debe ser mayor a 0';
    }

    if (form.fecha_apertura && isNaN(Date.parse(form.fecha_apertura)))
      errs.fecha_apertura = 'Fecha de apertura inválida';

    setErrores(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    setSaving(true);
    setErrGen('');

    let peso_gramos: number | null = null;
    let mililitros:  number | null = null;

    if (form.medida_valor && form.medida_unidad) {
      const valor = parseFloat(form.medida_valor);
      switch (form.medida_unidad) {
        case 'Gramo (g)':      peso_gramos = Math.round(valor);        break;
        case 'Kilogramo (kg)': peso_gramos = Math.round(valor * 1000); break;
        case 'Mililitro (ml)': mililitros  = Math.round(valor);        break;
        case 'Litro (l)':      mililitros  = Math.round(valor * 1000); break;
      }
    }

    const payload = {
      nombre_producto:   form.nombre_producto.trim(),
      marca_producto:    form.marca_producto.trim(),
      fecha_vencimiento: form.fecha_vencimiento,
      cantidad_unidad:   parseInt(form.cantidad_unidad, 10),
      tipo_producto:     form.tipo_producto as import('../types').TipoProducto,
      peso_gramos,
      mililitros,
      fecha_apertura:    form.fecha_apertura || null,
      nombre_categoria:  form.nombre_categoria || null,
      tipo_almacenaje:   form.tipo_almacenaje  || null,
      cod_barra_producto: null,
    };

    try {
      let resultado: Producto;
      if (esEdicion && productoEditar) {
        resultado = await productosApi.actualizar(productoEditar.id_producto, payload);
      } else {
        resultado = await productosApi.crear(payload as Omit<Producto, 'id_producto'>);
      }
      onGuardado(resultado);
      onCerrar();
    } catch (err: unknown) {
      setErrGen(err instanceof Error ? err.message : 'Error al guardar. Verifica tu conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onCerrar(); }}
      className="producto-modal-overlay"
    >
      <div className="producto-modal-container">

        {/* Header */}
        <div className="producto-modal-header">
          <div>
            <h2>{esEdicion ? 'Editar producto' : 'Agregar producto'}</h2>
            <p>{esEdicion ? 'Modifica los campos que necesites' : 'Completa los datos del nuevo producto'}</p>
          </div>
          <button onClick={onCerrar} className="producto-modal-close" aria-label="Cerrar">✕</button>
        </div>

        {errGen && <div className="producto-modal-error">⚠ {errGen}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="producto-modal-body">

            {/* Nombre + Marca */}
            <div className="producto-modal-row">
              <div className="producto-modal-field" style={{ flex: 2 }}>
                <label>Nombre del producto *</label>
                <input
                  ref={primerInput}
                  type="text"
                  placeholder="Ej: Leche entera"
                  value={form.nombre_producto}
                  onChange={set('nombre_producto')}
                  className={errores.nombre_producto ? 'error-input' : ''}
                  disabled={saving}
                />
                {errores.nombre_producto && <p className="error-text">{errores.nombre_producto}</p>}
              </div>
              <div className="producto-modal-field" style={{ flex: 1 }}>
                <label>Marca *</label>
                <input
                  type="text"
                  placeholder="Ej: Colún"
                  value={form.marca_producto}
                  onChange={set('marca_producto')}
                  className={errores.marca_producto ? 'error-input' : ''}
                  disabled={saving}
                />
                {errores.marca_producto && <p className="error-text">{errores.marca_producto}</p>}
              </div>
            </div>

            {/* Tipo + Categoría */}
            <div className="producto-modal-row">
              <div className="producto-modal-field">
                <label>Tipo *</label>
                <select
                  value={form.tipo_producto}
                  onChange={set('tipo_producto')}
                  className={errores.tipo_producto ? 'error-input' : ''}
                  disabled={saving}
                >
                  <option value="">— Selecciona —</option>
                  {TIPOS_PRODUCTO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errores.tipo_producto && <p className="error-text">{errores.tipo_producto}</p>}
              </div>
              <div className="producto-modal-field">
                <label>Categoría</label>
                <select value={form.nombre_categoria} onChange={set('nombre_categoria')} disabled={saving}>
                  <option value="">— Sin categoría —</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Cantidad + Almacenaje */}
            <div className="producto-modal-row">
              <div className="producto-modal-field">
                <label>Cantidad en stock *</label>
                <input
                  type="number"
                  min={1}
                  placeholder="1"
                  value={form.cantidad_unidad}
                  onChange={set('cantidad_unidad')}
                  className={errores.cantidad_unidad ? 'error-input' : ''}
                  disabled={saving}
                />
                {errores.cantidad_unidad && <p className="error-text">{errores.cantidad_unidad}</p>}
              </div>
              <div className="producto-modal-field">
                <label>Lugar de almacenaje</label>
                <select value={form.tipo_almacenaje} onChange={set('tipo_almacenaje')} disabled={saving}>
                  <option value="">— Sin especificar —</option>
                  {TIPOS_ALMACENAJE.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Fecha vencimiento */}
            <div className="producto-modal-field">
              <label>Fecha de vencimiento *</label>
              <input
                type="date"
                value={form.fecha_vencimiento}
                onChange={set('fecha_vencimiento')}
                className={errores.fecha_vencimiento ? 'error-input' : ''}
                disabled={saving}
              />
              {errores.fecha_vencimiento && <p className="error-text">{errores.fecha_vencimiento}</p>}
            </div>

            {/* Medida — valor + unidad en la misma fila */}
            <div className="producto-modal-section-label">Medida del producto <span className="opcional">(opcional)</span></div>
            <div className="producto-modal-row">
              <div className="producto-modal-field" style={{ flex: 1 }}>
                <label>Cantidad</label>
                <input
                  type="number"
                  min={0.1}
                  step="any"
                  placeholder="Ej: 500"
                  value={form.medida_valor}
                  onChange={set('medida_valor')}
                  className={errores.medida_valor ? 'error-input' : ''}
                  disabled={saving}
                />
                {errores.medida_valor && <p className="error-text">{errores.medida_valor}</p>}
              </div>
              <div className="producto-modal-field" style={{ flex: 1 }}>
                <label>Unidad</label>
                <select
                  value={form.medida_unidad}
                  onChange={handleUnidadChange}
                  className={errores.medida_unidad ? 'error-input' : ''}
                  disabled={saving}
                >
                  <option value="">— Selecciona —</option>
                  <optgroup label="Peso">
                    {UNIDADES_PESO.map(u => <option key={u} value={u}>{u}</option>)}
                  </optgroup>
                  <optgroup label="Volumen">
                    {UNIDADES_VOLUMEN.map(u => <option key={u} value={u}>{u}</option>)}
                  </optgroup>
                </select>
                {errores.medida_unidad && <p className="error-text">{errores.medida_unidad}</p>}
              </div>
            </div>

            {/* Fecha apertura — solo mostrar si es edición o si el usuario ya llenó algo */}
            <div className="producto-modal-field">
              <label>Fecha de apertura <span className="opcional">(opcional)</span></label>
              <input
                type="date"
                value={form.fecha_apertura}
                onChange={set('fecha_apertura')}
                className={errores.fecha_apertura ? 'error-input' : ''}
                disabled={saving}
              />
              {errores.fecha_apertura && <p className="error-text">{errores.fecha_apertura}</p>}
            </div>

          </div>

          {/* Footer */}
          <div className="producto-modal-footer">
            <button type="button" onClick={onCerrar} className="producto-modal-btn producto-modal-btn-cancel" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="producto-modal-btn producto-modal-btn-submit" disabled={saving}>
              {saving
                ? (esEdicion ? 'Guardando...' : 'Agregando...')
                : (esEdicion ? 'Guardar cambios' : 'Agregar producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
