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

export type EventoTipo =
  | "cena_pasos"
  | "asado"
  | "finger_food"
  | "combo"
  | "maridaje"
  | "pizzas"
  | "box";

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
          notas: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          telefono?: string | null;
          email?: string | null;
          instagram?: string | null;
          notas?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          telefono?: string | null;
          email?: string | null;
          instagram?: string | null;
          notas?: string | null;
          creado_en?: string;
        };
        Relationships: [];
      };
      eventos: {
        Row: {
          id: string;
          cliente_id: string;
          nombre: string;
          tipo: EventoTipo;
          fecha: string;
          invitados: number;
          estado: EventoEstado;
          ubicacion: string | null;
          precio_por_persona: number | null;
          precio_total: number | null;
          margen_objetivo: number | null;
          link_cotizacion: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          nombre: string;
          tipo: EventoTipo;
          fecha: string;
          invitados: number;
          estado?: EventoEstado;
          ubicacion?: string | null;
          precio_por_persona?: number | null;
          precio_total?: number | null;
          margen_objetivo?: number | null;
          link_cotizacion?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string;
          nombre?: string;
          tipo?: EventoTipo;
          fecha?: string;
          invitados?: number;
          estado?: EventoEstado;
          ubicacion?: string | null;
          precio_por_persona?: number | null;
          precio_total?: number | null;
          margen_objetivo?: number | null;
          link_cotizacion?: string | null;
          created_at?: string;
          updated_at?: string;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          categoria?: string | null;
          porcion_base?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          categoria?: string | null;
          porcion_base?: number;
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
          costo_unitario: number;
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
          costo_unitario?: number;
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
          costo_unitario?: number;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          rol: PersonalRol;
          telefono?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          rol?: PersonalRol;
          telefono?: string | null;
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
          confirmado: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          evento_id: string;
          personal_id: string;
          rol_en_evento: string;
          confirmado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          evento_id?: string;
          personal_id?: string;
          rol_en_evento?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
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
