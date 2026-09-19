# Arquitectura implementada

```text
UI (App Router, Server Components + componentes interactivos)
  → Server Actions / Route Handlers con sesión
  → CatalogService / QuotationService / casos de backup
  → GlassRepository / BaseCatalogRepository / QuotationRepository / JsonStore
  → VercelBlob*Repository / VercelBlobStore
  → Vercel Blob privado
```

El punto de composición `src/application/container.ts` conecta las interfaces a las implementaciones. Fuera de ese punto los casos de uso no importan infraestructura. El dominio contiene esquemas, estados, descripción de productos y el único cálculo monetario. La UI nunca importa el SDK Blob. `server-only` protege configuración, autenticación y composición.

## Lecturas y escritura

Cada lectura de pantalla exige sesión en el servidor y obtiene datos frescos. Las páginas protegidas son dinámicas. Las Server Actions vuelven a autenticar, validan con Zod y revalidan las vistas después de guardar. El endpoint PDF responde 401 sin sesión y usa Cache-Control privado/no-store.

El catálogo pequeño se almacena como un agregado `data/v1/catalog.json`. Esta decisión permite comprobar SKU únicos, referencias y versiones dentro de una única escritura condicional. Separar cada producto en archivos independientes necesitaría un protocolo adicional para asegurar unicidad al cambiar códigos. La especificación ofrece la distribución por registro como recomendación, no obligación.

Cada registro tiene `revision`. El cliente devuelve la revisión editada. La operación lee el último ETag, valida, escribe con `ifMatch`; ante conflicto relee y reintenta hasta 20 veces. Si la revisión de ese registro cambió, informa conflicto en español. Ediciones simultáneas de registros diferentes se combinan; nunca se pierden cambios silenciosamente.

Las lecturas privadas usan `useCache: false` y `Accept-Encoding: identity`. En la verificación real, respuestas comprimidas de Blob devolvían un ETag débil (`W/`) que no satisface `ifMatch`. Solicitar la representación sin compresión conserva el cuerpo y su ETag fuerte juntos; nunca se sustituye por el ETag de otra lectura. También se reintenta la colisión si dos dispositivos crean el catálogo inicial simultáneamente.

## Confirmación

El servidor acepta solo IDs, modalidad, medidas para pie², cantidades, condiciones y un ID de solicitud. Relee productos y catálogos base activos, llama al cálculo de dominio y crea el snapshot. Lista cotizaciones, elige máximo + 1 y crea un archivo sin overwrite ni sufijo aleatorio. Ante colisión relee y reintenta. El ID de solicitud permite recuperar el resultado tras perder una respuesta y evita duplicar un mismo intento concurrente. El folio que aparece en borrador es provisional.

El histórico tiene un archivo por cotización. La fecha se almacena ISO UTC junto con `timezone: America/Lima`; UI, mensajes y documentos la presentan en Lima. Las salidas usan el snapshot, sin consultar precios actuales ni repetir fórmulas. No hay endpoint de edición/eliminación de cotizaciones.

## Interfaz

`Brand`, `PageHeader`, `Panel`, `Button`, `Notice`, `StatusBadge`, `Dialog` y `EmptyState` son compartidos. `QuantityControl`, `ItemForm`, `QuotationSummary`, `ShareActions` y `PrintButton` cubren cotización y salidas. `quotationItemDetail` conserva la descripción simple para documentos del cliente; `quotationTechnicalDetail` genera exclusivamente la línea gris de cotización e histórico. El voucher interno usa un helper separado que nunca expone importes. El modal usa `<dialog>` con foco nativo y cierre Escape. Los controles están etiquetados y los errores se anuncian con `role=alert`.

El borrador usa un store de UI con `useSyncExternalStore` y copia temporal validada con Zod en `sessionStorage`, por usuario y pestaña. Guarda entradas, formulario incompleto, edición y requestId; no guarda precios, totales ni credenciales. Las escrituras son sincrónicas con cada cambio para no perder el último campo al navegar. Confirmar, descartar o cerrar sesión limpia la copia. Si el almacenamiento falla se conserva memoria durante navegación y se avisa antes de recargar/cerrar. El servidor sigue siendo autoritativo al confirmar, y los precios se recalculan desde el catálogo vigente. Las acciones se deshabilitan durante confirmación.

## Seguridad y límites

Scrypt y comparación constante para contraseña; JWT HS256 restringido por algoritmo, emisor y audiencia. Sesión HttpOnly. Next Server Actions verifica origen. Todo acceso a repositorios se realiza detrás de sesión; no hay rutas públicas para datos. Secretos validados al usarse, permitiendo construir sin credenciales de negocio. No hay credenciales predeterminadas versionadas.

Es un MVP de catálogo pequeño: listar histórico lee snapshots con concurrencia limitada a 20. Si crece sustancialmente, implementar paginación/indexación en un nuevo repositorio. Blob no proporciona transacciones entre documentos ni restauración multiarchivo atómica. El servicio requiere conexión; otro dispositivo refleja cambios al abrir o refrescar.

## Modalidades de venta

`calculation.ts` mantiene la fórmula oficial por pie² y `calculateSheet` para precio de plancha × cantidad. `priceDraft` selecciona el cálculo y valida producto/referencias activas y precio de la modalidad mayor que cero, tanto en UI como en confirmación del servidor. PDF, ticket y mensajes usan los importes y modalidad del snapshot. Precios de catálogo vacíos se normalizan a `0.00`; no se migran ni sobrescriben históricos. El esquema admite ítems antiguos sin modalidad como pie² y conserva su JSON para backups idempotentes.

### Navegación y datos recientes

Los enlaces principales precargan sus pantallas; el Router Cache de Next reutiliza sus respuestas privadas en memoria durante 30 segundos. No se guardan catálogos ni históricos en sessionStorage/localStorage. `Actualizar` solicita los datos recientes en la pantalla actual, conservando el borrador. Las mutaciones mantienen revalidación y la confirmación relee precios en servidor. La primera visita o un caché vencido aún puede requerir espera de red. El número provisional se obtiene de los nombres de archivos, sin descargar snapshots; la reserva definitiva y el control de concurrencia permanecen sin cambios.
