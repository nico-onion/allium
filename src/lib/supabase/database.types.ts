// Tipos generados a mano a partir de supabase/migrations/20260712140252_initial_schema.sql.
// Si se instala el Supabase CLI más adelante, este archivo puede reemplazarse por
// `supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts`
// manteniendo la misma forma (Database.public.Tables...).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EventoEstado =
  | "cotizado"
  | "confirmado"
  | "en_curso"
  | "realizado"
  | "cancelado"
  | "postergado";

export type PersonalRol = "cocina" | "mozo" | "logistica";

export type InsumoUnidad = "kg" | "g" | "l" | "ml" | "unidad" | "docena";

export type MovimientoTipo = "ingreso" | "egreso";

export type MovimientoOrigen = "BILL" | "manual";

export type TipoMovimientoStock = "compra" | "uso_evento" | "ajuste" | "merma";

export type InsumoTipoAlmacenamiento = "seco" | "refrigerado";

export type PresupuestoEstado =
  | "enviado"
  | "aceptado"
  | "aceptado_con_cambios"
  | "en_evaluacion"
  | "rechazado";

export type MarcacionTipo = "entrada" | "salida";

export type CostoHistorialOrigen = "compra" | "manual";

export type ClienteTipo = "persona" | "empresa";

export type CompraEstado = "borrador" | "confirmada";

export type CompraOrigen = "manual" | "bill";

export type CompraLineaDestino = "insumo" | "gasto";

export type GastoCategoria =
  | "mercaderia"
  | "descartables"
  | "combustible"
  | "mano_obra"
  | "transporte"
  | "alquiler"
  | "imprevisto"
  | "otro";

export type CobroTipo = "sena" | "saldo" | "otro";

export type CobroMedio = "transferencia" | "efectivo" | "tarjeta" | "qr" | "otro";

export type ClienteOrigen =
  | "instagram"
  | "meta_ads"
  | "whatsapp"
  | "referido"
  | "google"
  | "evento"
  | "otro";

export type PresupuestoItemCategoria =
  | "comida"
  | "bebida"
  | "personal"
  | "alquiler"
  | "logistica"
  | "decoracion"
  | "otro";

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string;
          nombre: string;
          telefono: string | null;
          email: string | null;
          instagram: string | null;
          ruc_ci: string | null;
          notas: string | null;
          tipo: ClienteTipo;
          origen: ClienteOrigen | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          telefono?: string | null;
          email?: string | null;
          instagram?: string | null;
          ruc_ci?: string | null;
          notas?: string | null;
          tipo?: ClienteTipo;
          origen?: ClienteOrigen | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          telefono?: string | null;
          email?: string | null;
          instagram?: string | null;
          ruc_ci?: string | null;
          notas?: string | null;
          tipo?: ClienteTipo;
          origen?: ClienteOrigen | null;
          creado_en?: string;
        };
        Relationships: [];
      };
      eventos: {
        Row: {
          id: string;
          cliente_id: string;
          nombre: string;
          tipo: string;
          fecha: string;
          invitados: number;
          estado: EventoEstado;
          ubicacion: string | null;
          precio_por_persona: number | null;
          precio_total: number | null;
          margen_objetivo: number | null;
          link_cotizacion: string | null;
          costo_cotizado: number | null;
          created_at: string;
          updated_at: string;
          codigo: string | null;
          resena_enviada_en: string | null;
          cerrado_en: string | null;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          nombre: string;
          tipo: string;
          fecha: string;
          invitados: number;
          estado?: EventoEstado;
          ubicacion?: string | null;
          precio_por_persona?: number | null;
          precio_total?: number | null;
          margen_objetivo?: number | null;
          link_cotizacion?: string | null;
          costo_cotizado?: number | null;
          created_at?: string;
          updated_at?: string;
          codigo?: string | null;
          resena_enviada_en?: string | null;
          cerrado_en?: string | null;
        };
        Update: {
          id?: string;
          cliente_id?: string;
          nombre?: string;
          tipo?: string;
          fecha?: string;
          invitados?: number;
          estado?: EventoEstado;
          ubicacion?: string | null;
          precio_por_persona?: number | null;
          precio_total?: number | null;
          margen_objetivo?: number | null;
          link_cotizacion?: string | null;
          costo_cotizado?: number | null;
          created_at?: string;
          updated_at?: string;
          codigo?: string | null;
          resena_enviada_en?: string | null;
          cerrado_en?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "eventos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      menus: {
        Row: {
          id: string;
          evento_id: string;
          nombre: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          evento_id: string;
          nombre: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string;
          nombre?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menus_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_items: {
        Row: {
          id: string;
          menu_id: string;
          receta_id: string;
          cantidad_porciones: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          menu_id: string;
          receta_id: string;
          cantidad_porciones: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          menu_id?: string;
          receta_id?: string;
          cantidad_porciones?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_items_receta_id_fkey";
            columns: ["receta_id"];
            isOneToOne: false;
            referencedRelation: "recetas";
            referencedColumns: ["id"];
          },
        ];
      };
      recetas: {
        Row: {
          id: string;
          nombre: string;
          categoria: string | null;
          porcion_base: number;
          es_subreceta: boolean;
          rendimiento_unidad: InsumoUnidad | null;
          pct_varios: number;
          precio_venta: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          categoria?: string | null;
          porcion_base?: number;
          es_subreceta?: boolean;
          rendimiento_unidad?: InsumoUnidad | null;
          pct_varios?: number;
          precio_venta?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          categoria?: string | null;
          porcion_base?: number;
          es_subreceta?: boolean;
          rendimiento_unidad?: InsumoUnidad | null;
          pct_varios?: number;
          precio_venta?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      receta_insumos: {
        Row: {
          id: string;
          receta_id: string;
          insumo_id: string;
          cantidad: number;
          unidad: InsumoUnidad;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          receta_id: string;
          insumo_id: string;
          cantidad: number;
          unidad: InsumoUnidad;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          receta_id?: string;
          insumo_id?: string;
          cantidad?: number;
          unidad?: InsumoUnidad;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receta_insumos_receta_id_fkey";
            columns: ["receta_id"];
            isOneToOne: false;
            referencedRelation: "recetas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "receta_insumos_insumo_id_fkey";
            columns: ["insumo_id"];
            isOneToOne: false;
            referencedRelation: "insumos";
            referencedColumns: ["id"];
          },
        ];
      };
      insumos: {
        Row: {
          id: string;
          nombre: string;
          categoria: string | null;
          unidad: InsumoUnidad;
          tipo_almacenamiento: InsumoTipoAlmacenamiento | null;
          costo_unitario: number;
          costo_contable: number;
          merma_pct: number | null;
          marca_preferida: string | null;
          marca_alternativa: string | null;
          stock_actual: number;
          stock_minimo: number;
          proveedor_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          categoria?: string | null;
          unidad: InsumoUnidad;
          tipo_almacenamiento?: InsumoTipoAlmacenamiento | null;
          costo_unitario?: number;
          costo_contable?: number;
          merma_pct?: number | null;
          marca_preferida?: string | null;
          marca_alternativa?: string | null;
          stock_actual?: number;
          stock_minimo?: number;
          proveedor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          categoria?: string | null;
          unidad?: InsumoUnidad;
          tipo_almacenamiento?: InsumoTipoAlmacenamiento | null;
          costo_unitario?: number;
          costo_contable?: number;
          merma_pct?: number | null;
          marca_preferida?: string | null;
          marca_alternativa?: string | null;
          stock_actual?: number;
          stock_minimo?: number;
          proveedor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "insumos_proveedor_id_fkey";
            columns: ["proveedor_id"];
            isOneToOne: false;
            referencedRelation: "proveedores";
            referencedColumns: ["id"];
          },
        ];
      };
      proveedores: {
        Row: {
          id: string;
          nombre: string;
          contacto: string | null;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          contacto?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          contacto?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      personal: {
        Row: {
          id: string;
          nombre: string;
          rol: PersonalRol;
          telefono: string | null;
          costo_referencia: number | null;
          auth_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          rol: PersonalRol;
          telefono?: string | null;
          costo_referencia?: number | null;
          auth_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          rol?: PersonalRol;
          telefono?: string | null;
          costo_referencia?: number | null;
          auth_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      turnos: {
        Row: {
          id: string;
          evento_id: string;
          personal_id: string;
          rol_en_evento: string;
          costo: number | null;
          costo_referencia: number | null;
          confirmado: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          evento_id: string;
          personal_id: string;
          rol_en_evento: string;
          costo?: number | null;
          costo_referencia?: number | null;
          confirmado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string;
          personal_id?: string;
          rol_en_evento?: string;
          costo?: number | null;
          costo_referencia?: number | null;
          confirmado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "turnos_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "turnos_personal_id_fkey";
            columns: ["personal_id"];
            isOneToOne: false;
            referencedRelation: "personal";
            referencedColumns: ["id"];
          },
        ];
      };
      movimientos_financieros: {
        Row: {
          id: string;
          evento_id: string | null;
          tipo: MovimientoTipo;
          monto: number;
          categoria: string | null;
          fecha: string;
          origen: MovimientoOrigen;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          evento_id?: string | null;
          tipo: MovimientoTipo;
          monto: number;
          categoria?: string | null;
          fecha?: string;
          origen?: MovimientoOrigen;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string | null;
          tipo?: MovimientoTipo;
          monto?: number;
          categoria?: string | null;
          fecha?: string;
          origen?: MovimientoOrigen;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "movimientos_financieros_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id"];
          },
        ];
      };
      ordenes_compra: {
        Row: {
          id: string;
          evento_id: string;
          reconciliado: boolean;
          reconciliado_en: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          evento_id: string;
          reconciliado?: boolean;
          reconciliado_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string;
          reconciliado?: boolean;
          reconciliado_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ordenes_compra_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: true;
            referencedRelation: "eventos";
            referencedColumns: ["id"];
          },
        ];
      };
      orden_compra_items: {
        Row: {
          id: string;
          orden_compra_id: string;
          insumo_id: string;
          cantidad: number;
          cantidad_usada: number | null;
          unidad: InsumoUnidad;
          created_at: string;
        };
        Insert: {
          id?: string;
          orden_compra_id: string;
          insumo_id: string;
          cantidad: number;
          cantidad_usada?: number | null;
          unidad: InsumoUnidad;
          created_at?: string;
        };
        Update: {
          id?: string;
          orden_compra_id?: string;
          insumo_id?: string;
          cantidad?: number;
          cantidad_usada?: number | null;
          unidad?: InsumoUnidad;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orden_compra_items_orden_compra_id_fkey";
            columns: ["orden_compra_id"];
            isOneToOne: false;
            referencedRelation: "ordenes_compra";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orden_compra_items_insumo_id_fkey";
            columns: ["insumo_id"];
            isOneToOne: false;
            referencedRelation: "insumos";
            referencedColumns: ["id"];
          },
        ];
      };
      movimientos_stock: {
        Row: {
          id: string;
          insumo_id: string;
          tipo: TipoMovimientoStock;
          cantidad: number;
          unidad: InsumoUnidad;
          evento_id: string | null;
          compra_id: string | null;
          nota: string | null;
          verificado: boolean;
          nota_verificacion: string | null;
          costo_unitario: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          insumo_id: string;
          tipo: TipoMovimientoStock;
          cantidad: number;
          unidad: InsumoUnidad;
          evento_id?: string | null;
          compra_id?: string | null;
          nota?: string | null;
          verificado?: boolean;
          nota_verificacion?: string | null;
          costo_unitario?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          insumo_id?: string;
          tipo?: TipoMovimientoStock;
          cantidad?: number;
          unidad?: InsumoUnidad;
          evento_id?: string | null;
          compra_id?: string | null;
          nota?: string | null;
          verificado?: boolean;
          nota_verificacion?: string | null;
          costo_unitario?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "movimientos_stock_insumo_id_fkey";
            columns: ["insumo_id"];
            isOneToOne: false;
            referencedRelation: "insumos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "movimientos_stock_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "movimientos_stock_compra_id_fkey";
            columns: ["compra_id"];
            isOneToOne: false;
            referencedRelation: "compras";
            referencedColumns: ["id"];
          },
        ];
      };
      compras: {
        Row: {
          id: string;
          proveedor_id: string | null;
          fecha: string;
          numero_factura: string | null;
          created_at: string;
          estado: CompraEstado;
          origen: CompraOrigen;
          evento_id: string | null;
          total: number | null;
          proveedor_texto: string | null;
          ruc_proveedor: string | null;
          comprobante_url: string | null;
          confirmada_en: string | null;
        };
        Insert: {
          id?: string;
          proveedor_id?: string | null;
          fecha?: string;
          numero_factura?: string | null;
          created_at?: string;
          estado?: CompraEstado;
          origen?: CompraOrigen;
          evento_id?: string | null;
          total?: number | null;
          proveedor_texto?: string | null;
          ruc_proveedor?: string | null;
          comprobante_url?: string | null;
          confirmada_en?: string | null;
        };
        Update: {
          id?: string;
          proveedor_id?: string | null;
          fecha?: string;
          numero_factura?: string | null;
          created_at?: string;
          estado?: CompraEstado;
          origen?: CompraOrigen;
          evento_id?: string | null;
          total?: number | null;
          proveedor_texto?: string | null;
          ruc_proveedor?: string | null;
          comprobante_url?: string | null;
          confirmada_en?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "compras_proveedor_id_fkey";
            columns: ["proveedor_id"];
            isOneToOne: false;
            referencedRelation: "proveedores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id"];
          },
        ];
      };
      presupuestos: {
        Row: {
          id: string;
          numero: number;
          cliente_id: string | null;
          fecha_emision: string;
          validez_dias: number;
          tipo_evento: string;
          fecha_evento: string | null;
          horario: string | null;
          lugar_direccion: string | null;
          cantidad_personas: number | null;
          incluye: string | null;
          no_incluye: string;
          estado: PresupuestoEstado;
          evento_id: string | null;
          margen_objetivo_pct: number | null;
          pct_imprevistos: number;
          costo_congelado_en: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero?: number;
          cliente_id?: string | null;
          fecha_emision?: string;
          validez_dias?: number;
          tipo_evento: string;
          fecha_evento?: string | null;
          horario?: string | null;
          lugar_direccion?: string | null;
          cantidad_personas?: number | null;
          incluye?: string | null;
          no_incluye?: string;
          estado?: PresupuestoEstado;
          evento_id?: string | null;
          margen_objetivo_pct?: number | null;
          pct_imprevistos?: number;
          costo_congelado_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numero?: number;
          cliente_id?: string | null;
          fecha_emision?: string;
          validez_dias?: number;
          tipo_evento?: string;
          fecha_evento?: string | null;
          horario?: string | null;
          lugar_direccion?: string | null;
          cantidad_personas?: number | null;
          incluye?: string | null;
          no_incluye?: string;
          estado?: PresupuestoEstado;
          evento_id?: string | null;
          margen_objetivo_pct?: number | null;
          pct_imprevistos?: number;
          costo_congelado_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "presupuestos_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "presupuestos_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id"];
          },
        ];
      };
      presupuesto_items: {
        Row: {
          id: string;
          presupuesto_id: string;
          receta_id: string | null;
          cantidad: number;
          precio_unitario: number;
          descripcion: string | null;
          categoria: PresupuestoItemCategoria;
          costo_unitario: number | null;
          personal_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          presupuesto_id: string;
          receta_id?: string | null;
          cantidad: number;
          precio_unitario?: number;
          descripcion?: string | null;
          categoria?: PresupuestoItemCategoria;
          costo_unitario?: number | null;
          personal_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          presupuesto_id?: string;
          receta_id?: string | null;
          cantidad?: number;
          precio_unitario?: number;
          descripcion?: string | null;
          categoria?: PresupuestoItemCategoria;
          costo_unitario?: number | null;
          personal_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "presupuesto_items_presupuesto_id_fkey";
            columns: ["presupuesto_id"];
            isOneToOne: false;
            referencedRelation: "presupuestos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "presupuesto_items_receta_id_fkey";
            columns: ["receta_id"];
            isOneToOne: false;
            referencedRelation: "recetas";
            referencedColumns: ["id"];
          },
        ];
      };
      app_admins: {
        Row: {
          id: string;
          auth_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      marcaciones: {
        Row: {
          id: string;
          personal_id: string;
          tipo: MarcacionTipo;
          marcado_en: string;
          latitud: number | null;
          longitud: number | null;
          foto_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          personal_id: string;
          tipo: MarcacionTipo;
          marcado_en?: string;
          latitud?: number | null;
          longitud?: number | null;
          foto_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          personal_id?: string;
          tipo?: MarcacionTipo;
          marcado_en?: string;
          latitud?: number | null;
          longitud?: number | null;
          foto_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marcaciones_personal_id_fkey";
            columns: ["personal_id"];
            isOneToOne: false;
            referencedRelation: "personal";
            referencedColumns: ["id"];
          },
        ];
      };
      rendimientos: {
        Row: {
          id: string;
          insumo_id: string;
          fecha: string;
          peso_inicial: number;
          peso_perdida: number;
          peso_aprovechado: number;
          nota: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          insumo_id: string;
          fecha?: string;
          peso_inicial: number;
          peso_perdida: number;
          peso_aprovechado?: number;
          nota?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          insumo_id?: string;
          fecha?: string;
          peso_inicial?: number;
          peso_perdida?: number;
          peso_aprovechado?: number;
          nota?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rendimientos_insumo_id_fkey";
            columns: ["insumo_id"];
            isOneToOne: false;
            referencedRelation: "insumos";
            referencedColumns: ["id"];
          },
        ];
      };
      receta_subrecetas: {
        Row: {
          id: string;
          receta_id: string;
          subreceta_id: string;
          cantidad: number;
          unidad: InsumoUnidad;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          receta_id: string;
          subreceta_id: string;
          cantidad: number;
          unidad: InsumoUnidad;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          receta_id?: string;
          subreceta_id?: string;
          cantidad?: number;
          unidad?: InsumoUnidad;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receta_subrecetas_receta_id_fkey";
            columns: ["receta_id"];
            isOneToOne: false;
            referencedRelation: "recetas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "receta_subrecetas_subreceta_id_fkey";
            columns: ["subreceta_id"];
            isOneToOne: false;
            referencedRelation: "recetas";
            referencedColumns: ["id"];
          },
        ];
      };
      costo_historial: {
        Row: {
          id: string;
          insumo_id: string;
          costo_anterior: number;
          costo_nuevo: number;
          origen: CostoHistorialOrigen;
          compra_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          insumo_id: string;
          costo_anterior: number;
          costo_nuevo: number;
          origen: CostoHistorialOrigen;
          compra_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          insumo_id?: string;
          costo_anterior?: number;
          costo_nuevo?: number;
          origen?: CostoHistorialOrigen;
          compra_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "costo_historial_insumo_id_fkey";
            columns: ["insumo_id"];
            isOneToOne: false;
            referencedRelation: "insumos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "costo_historial_compra_id_fkey";
            columns: ["compra_id"];
            isOneToOne: false;
            referencedRelation: "compras";
            referencedColumns: ["id"];
          },
        ];
      };
      cierres_mensuales: {
        Row: {
          id: string;
          periodo: string;
          cerrado_en: string;
        };
        Insert: {
          id?: string;
          periodo: string;
          cerrado_en?: string;
        };
        Update: {
          id?: string;
          periodo?: string;
          cerrado_en?: string;
        };
        Relationships: [];
      };
      cierre_insumos: {
        Row: {
          cierre_id: string;
          insumo_id: string;
          costo_contable: number;
        };
        Insert: {
          cierre_id: string;
          insumo_id: string;
          costo_contable: number;
        };
        Update: {
          cierre_id?: string;
          insumo_id?: string;
          costo_contable?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cierre_insumos_cierre_id_fkey";
            columns: ["cierre_id"];
            isOneToOne: false;
            referencedRelation: "cierres_mensuales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cierre_insumos_insumo_id_fkey";
            columns: ["insumo_id"];
            isOneToOne: false;
            referencedRelation: "insumos";
            referencedColumns: ["id"];
          },
        ];
      };
      lotes_stock: {
        Row: {
          id: string;
          insumo_id: string;
          compra_linea_id: string | null;
          fecha_ingreso: string;
          fecha_vencimiento: string | null;
          cantidad_inicial: number;
          cantidad_restante: number;
          nota: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          insumo_id: string;
          compra_linea_id?: string | null;
          fecha_ingreso?: string;
          fecha_vencimiento?: string | null;
          cantidad_inicial: number;
          cantidad_restante: number;
          nota?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          insumo_id?: string;
          compra_linea_id?: string | null;
          fecha_ingreso?: string;
          fecha_vencimiento?: string | null;
          cantidad_inicial?: number;
          cantidad_restante?: number;
          nota?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lotes_stock_insumo_id_fkey";
            columns: ["insumo_id"];
            isOneToOne: false;
            referencedRelation: "insumos";
            referencedColumns: ["id"];
          },
        ];
      };
      compra_lineas: {
        Row: {
          id: string;
          compra_id: string;
          orden: number;
          descripcion: string;
          cantidad: number;
          unidad: InsumoUnidad;
          precio_unitario: number;
          subtotal: number;
          destino: CompraLineaDestino | null;
          insumo_id: string | null;
          factor: number | null;
          tasa_iva: number;
          fecha_vencimiento: string | null;
          categoria_gasto: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          compra_id: string;
          orden?: number;
          descripcion: string;
          cantidad: number;
          unidad?: InsumoUnidad;
          precio_unitario: number;
          subtotal: number;
          destino?: CompraLineaDestino | null;
          insumo_id?: string | null;
          factor?: number | null;
          tasa_iva?: number;
          fecha_vencimiento?: string | null;
          categoria_gasto?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          compra_id?: string;
          orden?: number;
          descripcion?: string;
          cantidad?: number;
          unidad?: InsumoUnidad;
          precio_unitario?: number;
          subtotal?: number;
          destino?: CompraLineaDestino | null;
          insumo_id?: string | null;
          factor?: number | null;
          tasa_iva?: number;
          fecha_vencimiento?: string | null;
          categoria_gasto?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compra_lineas_compra_id_fkey";
            columns: ["compra_id"];
            isOneToOne: false;
            referencedRelation: "compras";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compra_lineas_insumo_id_fkey";
            columns: ["insumo_id"];
            isOneToOne: false;
            referencedRelation: "insumos";
            referencedColumns: ["id"];
          },
        ];
      };
      alias_compras: {
        Row: {
          id: string;
          clave_proveedor: string;
          descripcion_normalizada: string;
          destino: CompraLineaDestino;
          insumo_id: string | null;
          categoria_gasto: string | null;
          factor: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clave_proveedor: string;
          descripcion_normalizada: string;
          destino: CompraLineaDestino;
          insumo_id?: string | null;
          categoria_gasto?: string | null;
          factor?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clave_proveedor?: string;
          descripcion_normalizada?: string;
          destino?: CompraLineaDestino;
          insumo_id?: string | null;
          categoria_gasto?: string | null;
          factor?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alias_compras_insumo_id_fkey";
            columns: ["insumo_id"];
            isOneToOne: false;
            referencedRelation: "insumos";
            referencedColumns: ["id"];
          },
        ];
      };
      gastos_evento: {
        Row: {
          id: string;
          evento_id: string;
          fecha: string;
          categoria: GastoCategoria;
          descripcion: string;
          monto: number;
          compra_linea_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          evento_id: string;
          fecha?: string;
          categoria: GastoCategoria;
          descripcion: string;
          monto: number;
          compra_linea_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string;
          fecha?: string;
          categoria?: GastoCategoria;
          descripcion?: string;
          monto?: number;
          compra_linea_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gastos_evento_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gastos_evento_compra_linea_id_fkey";
            columns: ["compra_linea_id"];
            isOneToOne: false;
            referencedRelation: "compra_lineas";
            referencedColumns: ["id"];
          },
        ];
      };
      cobros: {
        Row: {
          id: string;
          evento_id: string;
          tipo: CobroTipo;
          monto: number;
          fecha: string;
          medio: CobroMedio;
          comprobante: string | null;
          nota: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          evento_id: string;
          tipo: CobroTipo;
          monto: number;
          fecha?: string;
          medio?: CobroMedio;
          comprobante?: string | null;
          nota?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string;
          tipo?: CobroTipo;
          monto?: number;
          fecha?: string;
          medio?: CobroMedio;
          comprobante?: string | null;
          nota?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cobros_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id"];
          },
        ];
      };
      facturas_venta: {
        Row: {
          id: string;
          evento_id: string;
          numero: string;
          fecha: string;
          monto: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          evento_id: string;
          numero: string;
          fecha?: string;
          monto: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string;
          numero?: string;
          fecha?: string;
          monto?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "facturas_venta_evento_id_fkey";
            columns: ["evento_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id"];
          },
        ];
      };
      parametros_tipo_evento: {
        Row: {
          tipo: string;
          margen_objetivo_pct: number;
          pct_imprevistos: number;
          updated_at: string;
        };
        Insert: {
          tipo: string;
          margen_objetivo_pct?: number;
          pct_imprevistos?: number;
          updated_at?: string;
        };
        Update: {
          tipo?: string;
          margen_objetivo_pct?: number;
          pct_imprevistos?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      cerrar_mes_costos: {
        Args: { p_periodo: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
