// ─── Geo ──────────────────────────────────────────────────────────────────────
export interface Pais {
  id_pais: number;
  nombre_pais: string;
}

export interface Region {
  id_region: number;
  nombre_region: string;
}

export interface Ciudad {
  id_ciudad: number;
  nombre_ciudad: string;
}

export interface Comuna {
  id_comuna: number;
  nombre_comuna: string;
}

// ─── Usuario ──────────────────────────────────────────────────────────────────
export interface Usuario {
  run_usuario: number;
  dvrun_usuario: string;
  pri_nom_usuario: string;
  seg_nom_usuario?: string | null;
  pri_ape_usuario: string;
  seg_ape_usuario?: string | null;
  correo_usuario: string;
  num_tel_usuario: number;
  fecha_nac_usuario: string;
  fecha_reg_usuario: string;
  // Ubicación (opcional en respuesta, presente al registrar)
  id_comuna?: number | null;
  nombre_comuna?: string | null;
  nombre_ciudad?: string | null;
  nombre_region?: string | null;
  nombre_pais?: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthState {
  jwt: string | null;
  usuario: Usuario | null;
  loading: boolean;
}

// ─── Producto ─────────────────────────────────────────────────────────────────
export type TipoProducto = 'Alimento' | 'Bebida' | 'Lácteo' | 'Congelado' | 'Otro';
export type EstadoVencimiento = 'ok' | 'proximo' | 'vencido';

export interface Producto {
  id_producto: number;
  nombre_producto: string;
  marca_producto: string;
  cod_barra_producto?: string | null;
  fecha_vencimiento: string;
  cantidad_unidad: number;
  tipo_producto: TipoProducto;
  peso_gramos?: number | null;
  mililitros?: number | null;
  fecha_apertura?: string | null;
  nombre_categoria?: string | null;
  tipo_almacenaje?: string | null;
}

// ─── Patología ────────────────────────────────────────────────────────────────
export type TipoPatologia = 'Crónica' | 'Alérgica' | 'Intolerancia' | 'Otra';

export interface Patologia {
  id_patologias: number;
  nombre_patologia: string;
  tipo_patologia: TipoPatologia;
  fecha_diagnostico?: string | null;
  patologia_activa: boolean;
}

// ─── Lista de Compras ─────────────────────────────────────────────────────────
export interface ItemLista {
  id_lista: number;
  fecha_lista: string;
  estado_lista: boolean;
  cantidad_producto: number;
  tipo_lista: 'AUTOMATICA' | 'MANUAL';
  nombre_producto: string;
  marca_producto: string;
}

// ─── Métricas del Dashboard ───────────────────────────────────────────────────
export interface MetricasDashboard {
  total_productos: number;
  proximos_vencer: number;
  vencidos: number;
  items_lista_pendiente: number;
}

// ─── Filtros de Inventario ────────────────────────────────────────────────────
export interface FiltrosInventario {
  busqueda: string;
  tipo: string;
  estado: string;
}
