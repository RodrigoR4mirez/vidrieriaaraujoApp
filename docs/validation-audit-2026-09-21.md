# Auditoría de validación — 21 de septiembre de 2026

## Alcance

Se revisó la rama `catalogos-importacion` contrastando el dominio, casos de uso, modelos, persistencia Blob y componentes de cotización con la documentación vigente. La revisión cubre la fórmula, catálogos, perfiles, confirmación, históricos, borrador, numeración, backups y salidas compartidas.

## Resultado de consistencia

| Área | Evidencia de implementación | Estado |
|---|---|---|
| Fórmula por pie² | `calculateItem` convierte cm a pulgadas, aplica merma, calcula área, precio unitario e importe. | Conforme |
| Total final | `roundQuotationTotal` redondea hacia arriba a un decimal y conserva dos decimales de presentación. | Conforme |
| Venta por plancha | `calculateSheet` multiplica precio por plancha × cantidad, sin cálculo de área ni merma. | Conforme |
| Precio `0.00` | El catálogo lo admite; `isQuotable` impide cotizar la modalidad cuyo precio no sea mayor que cero. | Conforme |
| Perfiles | Nuevos cortes se ingresan en centímetros; el dominio convierte a metros. Históricos en metros siguen siendo legibles. Barra completa usa precio por barra. | Conforme |
| Cotización mixta | `priceDraft` une ítems de vidrio, plancha y perfiles antes de subtotal y total. | Conforme |
| Confirmación | El servidor relee catálogo, no acepta totales del cliente, exige nombre, evita IDs repetidos y conserva snapshot inmutable. | Conforme |
| Numeración y concurrencia | Las nuevas cotizaciones usan `COT-XXXXX`; Blob crea sin sobrescritura y reintenta colisiones. El `requestId` evita duplicar reintentos. | Conforme |
| Históricos | Precio, descripción y medidas se congelan en snapshot; cambios posteriores del catálogo no los recalculan. | Conforme |
| Borrador | Solo se conserva temporalmente en `sessionStorage`; Blob sigue siendo la fuente de verdad al confirmar. | Conforme |
| Salidas | PDF, WhatsApp, ticket y voucher usan el snapshot ya calculado; la línea técnica solo corresponde a cotizador e histórico. | Conforme |

## Verificaciones ejecutadas

| Comando | Resultado |
|---|---|
| `npm run lint` | Correcto, sin errores reportados. |
| `npm run typecheck` | Correcto; tipos de rutas y TypeScript generados sin errores. |
| `npm run test` | Correcto: 9 archivos y 81 pruebas aprobadas. |
| `npm run build` | Correcto: compilación, tipos, datos de páginas y optimización finalizados. |
| `npm run test:e2e` | Correcto: 4 escenarios críticos aprobados contra el store Preview privado. |

## Cobertura relevante confirmada por pruebas

- Casos oficiales: `100 × 80 cm` produce subtotal `S/ 62.24` y total `S/ 62.30`; `120 × 80 cm` produce subtotal `S/ 208.08` y total `S/ 208.10`.
- Merma en pulgadas, incluyendo el límite exacto de `0.5″`.
- Total final y ajuste visible de redondeo.
- Perfil por centímetros, perfil histórico por metros y barra completa.
- Cotización mixta de vidrio y perfil.
- Precio `0.00`, productos/referencias ocultas y validación de disponibilidad por modalidad.
- Históricos sin modalidad, snapshots, PDF/WhatsApp/ticket basados en snapshot.
- Concurrencia de numeración, idempotencia por `requestId`, ETag y cotizaciones inmutables.
- Backups, rutas permitidas, referencias y restauración condicional.

## Hallazgos

### Incidencia resuelta: stores de Vercel Blob

El upgrade de Vercel reactivó los stores privados `vidrieria-araujo-preview` y `vidrieria-araujo-production`. Se verificó la lectura privada de los catálogos y se ejecutaron los cuatro escenarios E2E en Preview con éxito. La prueba mutable no usa Production.

Las pruebas E2E fueron alineadas a dos comportamientos vigentes: la selección de familia previa al vidrio y las solicitudes RSC normales de Next.js durante navegación. Se conserva la comprobación relevante: el borrador sigue presente y `Actualizar datos` no lo pierde.

## Conclusión

El código revisado es consistente con las reglas de negocio documentadas para los flujos críticos. Lint, tipos, pruebas unitarias e integración, build y los cuatro escenarios E2E aprobados no presentan bloqueos para una futura integración o despliegue.
