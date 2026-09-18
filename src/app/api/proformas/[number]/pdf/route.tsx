import { renderToBuffer } from "@react-pdf/renderer";
import { session } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { numberSchema } from "@/domain/quotation/models";
import { QuotationPdf } from "@/lib/quotation-pdf";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  if (!(await session()))
    return new Response("Sesión requerida", { status: 401 });
  const { number } = await params;
  if (!numberSchema.safeParse(number).success)
    return new Response("Número inválido", { status: 400 });
  try {
    const quotation = await services().quotations.find(number);
    if (!quotation)
      return new Response("Proforma inexistente", { status: 404 });
    const buffer = await renderToBuffer(<QuotationPdf quotation={quotation} />);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Error generando PDF. Vuelve a intentarlo.", {
      status: 500,
    });
  }
}
