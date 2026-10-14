import { formatCantidad, formatFecha } from "@/lib/format";
import type { OrdenCompra } from "./queries";
import { textoMarca } from "@/lib/insumos/marca";

type EventoParaEmail = { nombre: string; fecha: string; invitados: number };

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function construirAsuntoOrdenCompra(evento: EventoParaEmail): string {
  return `Orden de compra — ${evento.nombre}`;
}

export function construirHtmlOrdenCompra(
  evento: EventoParaEmail,
  orden: OrdenCompra,
): string {
  const filas = orden.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;">${escapeHtml(item.insumoNombre)}${
            textoMarca(item.marcaPreferida, item.marcaAlternativa)
              ? `<br /><span style="font-size:12px;color:#71717a;">${escapeHtml(textoMarca(item.marcaPreferida, item.marcaAlternativa)!)}</span>`
              : ""
          }</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;text-align:right;">${formatCantidad(item.cantidad)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;color:#71717a;">${escapeHtml(item.unidad)}</td>
        </tr>`,
    )
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1015;max-width:480px;margin:0 auto;">
      <h2 style="color:#7a2334;margin:0 0 4px;">Orden de compra</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#52525b;">
        <strong>${escapeHtml(evento.nombre)}</strong><br />
        ${formatFecha(evento.fecha)} &middot; ${evento.invitados} invitados
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#fafafa;text-align:left;">
            <th style="padding:8px 12px;border-bottom:1px solid #e4e4e7;">Insumo</th>
            <th style="padding:8px 12px;border-bottom:1px solid #e4e4e7;text-align:right;">Cantidad</th>
            <th style="padding:8px 12px;border-bottom:1px solid #e4e4e7;">Unidad</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
  `;
}
