import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { registrarFuentesPdf } from "./fonts";
import { CONDICIONES_PAGO, POLITICA_CANCELACION } from "@/lib/cotizaciones/constants";
import { calcularVencimiento } from "@/lib/cotizaciones/fecha";
import { tipoLabel } from "@/lib/eventos/constants";

registrarFuentesPdf();

const COLOR_BORDO = "#5e1a28";
const COLOR_BORDO_OSCURO = "#43121c";
const COLOR_BARRA = "#e4e4e7";
const COLOR_TEXTO = "#27272a";
const COLOR_TEXTO_SUAVE = "#71717a";
const COLOR_BORDE = "#e4e4e7";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Inter",
    fontSize: 9,
    color: COLOR_TEXTO,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  logoBox: {
    backgroundColor: COLOR_BARRA,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoTexto: {
    fontFamily: "Hanken Grotesk",
    fontWeight: 700,
    fontSize: 24,
    color: "#18181b",
  },
  logoSubtitulo: {
    fontSize: 6,
    letterSpacing: 1.5,
    color: COLOR_TEXTO_SUAVE,
    marginTop: 3,
  },
  headerDerecha: {
    alignItems: "flex-end",
  },
  tituloPdf: {
    fontFamily: "Hanken Grotesk",
    fontWeight: 700,
    fontSize: 14,
    color: COLOR_BORDO_OSCURO,
  },
  emailPdf: {
    fontSize: 8,
    fontStyle: "italic",
    color: COLOR_TEXTO_SUAVE,
    marginTop: 2,
  },
  infoTabla: {
    marginTop: 8,
    gap: 2,
  },
  infoFila: {
    flexDirection: "row",
    gap: 6,
  },
  infoLabel: {
    fontWeight: 700,
    fontSize: 8.5,
  },
  infoValor: {
    fontSize: 8.5,
  },
  infoValorDestacado: {
    fontSize: 8.5,
    fontWeight: 700,
    color: COLOR_BORDO,
  },
  barraSeccion: {
    backgroundColor: COLOR_BARRA,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginTop: 10,
  },
  barraSeccionTexto: {
    fontFamily: "Hanken Grotesk",
    fontWeight: 700,
    fontSize: 8,
    letterSpacing: 0.5,
    color: COLOR_BORDO_OSCURO,
  },
  campoFila: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR_BORDE,
    paddingVertical: 3.5,
    paddingHorizontal: 2,
  },
  campoLabel: {
    width: 150,
    fontWeight: 700,
    fontSize: 8.5,
  },
  campoValor: {
    flex: 1,
    fontSize: 8.5,
  },
  tablaHeaderFila: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginTop: 2,
  },
  tablaFila: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR_BORDE,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  colItem: { width: 28, fontSize: 8.5, textAlign: "center" },
  colDescripcion: { flex: 1, fontSize: 8.5 },
  colCantidad: { width: 50, fontSize: 8.5, textAlign: "center" },
  colPrecio: { width: 80, fontSize: 8.5, textAlign: "right" },
  tablaHeaderTexto: { fontWeight: 700 },
  totalBarra: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLOR_BARRA,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginTop: 10,
  },
  totalLabel: {
    fontFamily: "Hanken Grotesk",
    fontWeight: 700,
    fontSize: 10,
    color: COLOR_BORDO_OSCURO,
  },
  totalValor: {
    fontFamily: "Hanken Grotesk",
    fontWeight: 700,
    fontSize: 11,
    color: COLOR_BORDO_OSCURO,
  },
  bullet: {
    fontSize: 8.5,
    paddingVertical: 2,
    paddingHorizontal: 2,
    color: COLOR_TEXTO,
  },
  footer: {
    marginTop: 18,
    alignItems: "center",
  },
  footerValidez: {
    fontSize: 8,
    fontStyle: "italic",
    color: COLOR_TEXTO_SUAVE,
  },
  footerFirma: {
    fontSize: 8.5,
    fontWeight: 700,
    color: COLOR_BORDO_OSCURO,
    marginTop: 4,
  },
});

function formatFechaDDMMYYYY(fecha: string): string {
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

function formatMonto(monto: number): string {
  return new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(monto);
}

function Bullets({ texto }: { texto: string | null }) {
  const lineas = (texto ?? "")
    .split("\n")
    .map((linea) => linea.replace(/^[•\s-]+/, "").trim())
    .filter(Boolean);

  if (lineas.length === 0) return null;

  return (
    <>
      {lineas.map((linea, i) => (
        <Text key={i} style={styles.bullet}>
          • {linea}
        </Text>
      ))}
    </>
  );
}

export type PresupuestoPdfProps = {
  presupuesto: {
    numero: number;
    fecha_emision: string;
    validez_dias: number;
    tipo_evento: string;
    fecha_evento: string | null;
    horario: string | null;
    lugar_direccion: string | null;
    cantidad_personas: number | null;
    incluye: string | null;
    no_incluye: string;
    clientes: { nombre: string; email: string | null; telefono: string | null } | null;
  };
  items: {
    receta_id: string;
    cantidad: number;
    precio_unitario: number;
    recetas: { nombre: string } | null;
  }[];
};

export function PresupuestoPdf({ presupuesto, items }: PresupuestoPdfProps) {
  const total = items.reduce(
    (acc, item) => acc + Number(item.cantidad) * Number(item.precio_unitario),
    0,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoTexto}>onion</Text>
            <Text style={styles.logoSubtitulo}>ESTUDIO GASTRONÓMICO</Text>
          </View>
          <View style={styles.headerDerecha}>
            <Text style={styles.tituloPdf}>PRESUPUESTO DE SERVICIO</Text>
            <Text style={styles.emailPdf}>nicolas.casabianca@onion.com.py</Text>
            <View style={styles.infoTabla}>
              <View style={styles.infoFila}>
                <Text style={styles.infoLabel}>N° Presupuesto:</Text>
                <Text style={styles.infoValorDestacado}>{presupuesto.numero}</Text>
              </View>
              <View style={styles.infoFila}>
                <Text style={styles.infoLabel}>Fecha de emisión:</Text>
                <Text style={styles.infoValor}>
                  {formatFechaDDMMYYYY(presupuesto.fecha_emision)}
                </Text>
              </View>
              <View style={styles.infoFila}>
                <Text style={styles.infoLabel}>Válido por (días):</Text>
                <Text style={styles.infoValorDestacado}>
                  {presupuesto.validez_dias}
                </Text>
                <Text style={styles.infoValor}>
                  Vence:{" "}
                  {formatFechaDDMMYYYY(
                    calcularVencimiento(
                      presupuesto.fecha_emision,
                      presupuesto.validez_dias,
                    ),
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.barraSeccion}>
          <Text style={styles.barraSeccionTexto}>DATOS DEL CLIENTE</Text>
        </View>
        <View style={styles.campoFila}>
          <Text style={styles.campoLabel}>Nombre / Empresa:</Text>
          <Text style={styles.campoValor}>{presupuesto.clientes?.nombre ?? "-"}</Text>
        </View>
        <View style={styles.campoFila}>
          <Text style={styles.campoLabel}>Email:</Text>
          <Text style={styles.campoValor}>{presupuesto.clientes?.email ?? "-"}</Text>
        </View>
        <View style={styles.campoFila}>
          <Text style={styles.campoLabel}>Teléfono:</Text>
          <Text style={styles.campoValor}>{presupuesto.clientes?.telefono ?? "-"}</Text>
        </View>

        <View style={styles.barraSeccion}>
          <Text style={styles.barraSeccionTexto}>DATOS DEL EVENTO</Text>
        </View>
        <View style={styles.campoFila}>
          <Text style={styles.campoLabel}>Tipo de evento:</Text>
          <Text style={styles.campoValor}>{tipoLabel(presupuesto.tipo_evento)}</Text>
        </View>
        <View style={styles.campoFila}>
          <Text style={styles.campoLabel}>Fecha del evento:</Text>
          <Text style={styles.campoValor}>
            {presupuesto.fecha_evento
              ? formatFechaDDMMYYYY(presupuesto.fecha_evento)
              : "-"}
          </Text>
        </View>
        <View style={styles.campoFila}>
          <Text style={styles.campoLabel}>Horario:</Text>
          <Text style={styles.campoValor}>{presupuesto.horario ?? "-"}</Text>
        </View>
        <View style={styles.campoFila}>
          <Text style={styles.campoLabel}>Lugar / Dirección:</Text>
          <Text style={styles.campoValor}>{presupuesto.lugar_direccion ?? "-"}</Text>
        </View>
        <View style={styles.campoFila}>
          <Text style={styles.campoLabel}>Cantidad de personas:</Text>
          <Text style={styles.campoValor}>
            {presupuesto.cantidad_personas ?? "-"}
          </Text>
        </View>

        <View style={styles.barraSeccion}>
          <Text style={styles.barraSeccionTexto}>DETALLE DE COSTOS</Text>
        </View>
        <View style={styles.tablaHeaderFila}>
          <Text style={[styles.colItem, styles.tablaHeaderTexto]}>Ítem</Text>
          <Text style={[styles.colDescripcion, styles.tablaHeaderTexto]}>
            Descripción
          </Text>
          <Text style={[styles.colCantidad, styles.tablaHeaderTexto]}>Cant.</Text>
          <Text style={[styles.colPrecio, styles.tablaHeaderTexto]}>
            Precio unit.
          </Text>
        </View>
        {items.map((item, i) => (
          <View key={item.receta_id + i} style={styles.tablaFila}>
            <Text style={styles.colItem}>{i + 1}</Text>
            <Text style={styles.colDescripcion}>
              {item.recetas?.nombre ?? "Receta"}
            </Text>
            <Text style={styles.colCantidad}>{item.cantidad}</Text>
            <Text style={styles.colPrecio}>{formatMonto(item.precio_unitario)}</Text>
          </View>
        ))}

        <View style={styles.totalBarra}>
          <Text style={styles.totalLabel}>TOTAL A COBRAR (Gs.)</Text>
          <Text style={styles.totalValor}>{formatMonto(total)}</Text>
        </View>

        <View style={styles.barraSeccion}>
          <Text style={styles.barraSeccionTexto}>INCLUYE</Text>
        </View>
        <Bullets texto={presupuesto.incluye} />

        <View style={styles.barraSeccion}>
          <Text style={styles.barraSeccionTexto}>NO INCLUYE</Text>
        </View>
        <Bullets texto={presupuesto.no_incluye} />

        <View style={styles.barraSeccion}>
          <Text style={styles.barraSeccionTexto}>CONDICIONES DE PAGO</Text>
        </View>
        {CONDICIONES_PAGO.map((linea, i) => (
          <Text key={i} style={styles.bullet}>
            • {linea}
          </Text>
        ))}

        <View style={styles.barraSeccion}>
          <Text style={styles.barraSeccionTexto}>POLÍTICA DE CANCELACIÓN</Text>
        </View>
        {POLITICA_CANCELACION.map((linea, i) => (
          <Text key={i} style={styles.bullet}>
            • {linea}
          </Text>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerValidez}>
            Este presupuesto tiene validez de {presupuesto.validez_dias} días a
            partir de la fecha de emisión.
          </Text>
          <Text style={styles.footerFirma}>
            Nicolás Casabianca | Onion Catering | nicolas.casabianca@onion.com.py
          </Text>
        </View>
      </Page>
    </Document>
  );
}
