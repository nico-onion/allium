import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getPresupuesto, getPresupuestoItems } from "@/lib/cotizaciones/queries";
import { PresupuestoPdf } from "@/lib/pdf/PresupuestoPdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const presupuesto = await getPresupuesto(supabase, id);
  if (!presupuesto) {
    return NextResponse.json({ error: "Presupuesto no encontrado." }, { status: 404 });
  }

  const items = await getPresupuestoItems(supabase, id);

  const buffer = await renderToBuffer(
    <PresupuestoPdf presupuesto={presupuesto} items={items} />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="presupuesto-${presupuesto.numero}.pdf"`,
    },
  });
}
