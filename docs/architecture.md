# Arquitectura implementada

```text
UI (App Router, Server Components + componentes interactivos)
  → Server Actions / Route Handlers con sesión
  → CatalogService / QuotationService / casos de backup
  → GlassRepository / BaseCatalogRepository / AluminumCatalogRepository / QuotationRepository / JsonStore
  → VercelBlob*Repository / VercelBlobStore
  → Vercel Blob privado
```

El punto de composición `src/application/container.ts` conecta las interfaces a las implementaciones. Fuera de ese punto los casos de uso no importan infraestructura. El dominio contiene esquemas, estados, descripción de productos y el único cálculo monetario. La UI nunca importa el SDK Blob. `server-only` protege configuración, autenticación y composición.

## Lecturas y escritura

Cada lectura de servidor exige sesión y consulta Blob sin caché de SDK. La navegación cliente puede reutilizar una pantalla durante 30 segundos; la acción `Actualizar` solicita datos recientes. Las páginas protegidas son dinámicas. Las Server Actions vuelven a autenticar, validan con Zod y revalidan las vistas después de guardar. El endpoint PDF responde 401 sin sesión y usa Cache-Control privado/no-store.

El catálogo de vidrios y sus bases se almacenan como un agregado `data/v1/catalog.json`. Esto permite comprobar SKU únicos, referencias y versiones en una escritura condicional.

Cada registro tiene `revision`. El cliente devuelve la revisión editada. La operación lee el último ETag, valida, escribe con `ifMatch`; ante conflicto relee y reintenta hasta 20 veces. Si la revisión de ese registro cambió, informa conflicto en español. Ediciones simultáneas de registros diferentes se combinan; nunca se pierden cambios silenciosamente.

El catálogo de aluminio usa un agregado independiente, `data/v1/aluminum-catalog.json`, con el mismo protocolo ETag. Esto mantiene la unicidad de códigos y la relación perfil–familia–precios por color en una única escritura condicional. La carga inicial es idempotente cuando ya coincide y se niega a mezclar o sobrescribir datos parciales.

La versión de código que incorpora historial guarda el estado anterior de un catálogo existente en `data/history/v1/catalogs/glass/` o `data/history/v1/catalogs/aluminum/` antes de sobrescribirlo. Cubre ediciones web, cargas y restauraciones hechas con ese código; no puede recuperar cambios anteriores a su despliegue. Las cotizaciones quedan fuera porque son inmutables. Restaurar exige `--confirm` y aprobación explícita del ambiente; antes también se captura el estado activo.

Las lecturas privadas usan `useCache: false` y `Accept-Encoding: identity`. En la verificación real, respuestas comprimidas de Blob devolvían un ETag débil (`W/`) que no satisface `ifMatch`. Solicitar la representación sin compresión conserva el cuerpo y su ETag fuerte juntos; nunca se sustituye por el ETag de otra lectura. También se reintenta la colisión si dos dispositivos crean el catálogo inicial simultáneamente.

## Confirmación

El servidor acepta solo IDs, modalidad, medidas para pie² o centímetros para perfiles por medida, cantidades, condiciones y un ID de solicitud. Exige entre 1 y 200 ítems sin IDs repetidos, cliente válido y condiciones de hasta 2,000 caracteres. Relee productos y catálogos base activos, llama al cálculo de dominio y crea el snapshot. Lista cotizaciones, elige máximo + 1 y crea un archivo sin overwrite ni sufijo aleatorio. Ante colisión relee y reintenta. El ID de solicitud permite recuperar el resultado tras perder una respuesta y evita duplicar un mismo intento concurrente. El folio que aparece en borrador es provisional.

Para perfiles el servidor relee además perfil, familia, color y precio por barra. Las nuevas ventas por medida ingresan centímetros y el dominio los convierte a metros para calcular; históricos que conservaron metros siguen siendo compatibles. Barra completa no usa medida de corte. Ninguna salida vuelve a calcular. El subtotal y total se forman sobre la unión de ítems de vidrio y aluminio.

El histórico tiene un archivo por cotización. La fecha se almacena ISO UTC junto con `timezone: America/Lima`; UI, mensajes y documentos la presentan en Lima. Las salidas usan el snapshot, sin consultar precios actuales ni repetir fórmulas. No hay endpoint de edición/eliminación de cotizaciones.

## Interfaz

`Brand`, `PageHeader`, `Panel`, `Button`, `Notice`, `StatusBadge`, `Dialog` y `EmptyState` son compartidos. `QuantityControl`, `ItemForm`, `QuotationSummary`, `ShareActions` y `PrintButton` cubren cotización y salidas. `quotationItemDetail` conserva la descripción simple para documentos del cliente; `quotationTechnicalDetail` genera exclusivamente la línea gris de cotización e histórico. El voucher interno usa un helper separado que nunca expone importes. El modal usa `<dialog>` con foco nativo y cierre Escape. Los controles están etiquetados y los errores se anuncian con `role=alert`.

El borrador usa un store de UI con `useSyncExternalStore` y copia temporal validada con Zod en `sessionStorage`, por usuario y pestaña. Guarda entradas, formulario incompleto, edición y requestId; no guarda precios, totales ni credenciales. Las escrituras son sincrónicas con cada cambio para no perder el último campo al navegar. Confirmar, descartar o cerrar sesión limpia la copia. Si el almacenamiento falla se conserva memoria durante navegación y se avisa antes de recargar/cerrar. El servidor sigue siendo autoritativo al confirmar, y los precios se recalculan desde el catálogo vigente. Las acciones se deshabilitan durante confirmación.

## Seguridad y límites

Scrypt y comparación constante para contraseña; JWT HS256 restringido por algoritmo, emisor y audiencia. Sesión HttpOnly. Next Server Actions verifica origen. Todo acceso a repositorios se realiza detrás de sesión; no hay rutas públicas para datos. Secretos validados al usarse, permitiendo construir sin credenciales de negocio. No hay credenciales predeterminadas versionadas.

Es un MVP de catálogo pequeño: listar histórico lee snapshots con concurrencia limitada a 20. Si crece sustancialmente, implementar paginación/indexación en un nuevo repositorio. Blob no proporciona transacciones entre documentos ni restauración multiarchivo atómica. El servicio requiere conexión; otro dispositivo refleja cambios al abrir o refrescar.

El build de Vercel incluye explícitamente las fuentes estándar de PDFKit en el trace del PDF; `npm run test:bundle` comprueba ese paquete aislado antes de publicar cambios que afecten PDF o dependencias.

## Modalidades de venta

`calculation.ts` mantiene la fórmula oficial por pie² y `calculateSheet` para precio de plancha × cantidad. `priceDraft` selecciona el cálculo y valida producto/referencias activas y precio de la modalidad mayor que cero, tanto en UI como en confirmación del servidor. PDF, ticket y mensajes usan los importes y modalidad del snapshot. Precios de catálogo vacíos se normalizan a `0.00`; no se migran ni sobrescriben históricos. El esquema admite ítems antiguos sin modalidad como pie² y conserva su JSON para backups idempotentes.

### Navegación y datos recientes

Los enlaces principales precargan sus pantallas; el Router Cache de Next reutiliza sus respuestas privadas en memoria durante 30 segundos. No se guardan catálogos ni históricos en sessionStorage/localStorage. `Actualizar` solicita los datos recientes en la pantalla actual, conservando el borrador. Las mutaciones mantienen revalidación y la confirmación relee precios en servidor. La primera visita o un caché vencido aún puede requerir espera de red. El número provisional se obtiene de los nombres de archivos, sin descargar snapshots; la reserva definitiva y el control de concurrencia permanecen sin cambios.
