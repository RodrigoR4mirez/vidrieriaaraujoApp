# Implementation Spec — Distribuidora Araujo

## 1. Objetivo

Implementar de principio a fin el MVP web de **Distribuidora Araujo – Vidriería & Aluminios**.

Raíz:

`/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/Vidrieria/vidrieriaaraujoApp`

STITCH:

`/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/Vidrieria/vidrieriaaraujoApp/STITCH`

Instrucciones STITCH:

`/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/Vidrieria/vidrieriaaraujoApp/STITCH/instrucciones`

STITCH define principalmente:

- diseño;
- estados;
- secuencia visual;
- interacciones esperadas.

`docs/business-rules.md` define la lógica de negocio.

---

## 2. Stack y versiones

Baseline recomendado:

| Tecnología | Versión / regla |
|---|---|
| Node.js | 24.x LTS |
| Next.js | 16.3.3 o patch estable posterior de 16.3.x |
| React | 19.3.0 |
| React DOM | 19.3.0 |
| TypeScript | 7.0.x |
| Tailwind CSS | 4.3.x |
| React Hook Form | 7.88.x |
| Zod | 4.6.x |
| lucide-react | 1.47.x |
| decimal.js | 10.6.x |
| jose | 6.2.x |
| @vercel/blob | 2.8.x |
| @react-pdf/renderer | 4.9.x |
| Vitest | 5.0.x |
| @testing-library/react | 16.3.x |
| @testing-library/dom | 10.4.x |
| Playwright | 1.63.x |
| ESLint | 10.x |
| eslint-config-next | misma versión que Next.js |

No usar canary/beta/alpha/RC.

Codex debe comprobar versiones reales antes de instalar.

Si ya existe un proyecto con dependencias compatibles, evitar upgrades innecesarios.

### package.json

Debe incluir:

```json
{
  "engines": {
    "node": "24.x"
  }
}
```

Crear `.nvmrc`:

```text
24
```

Commit obligatorio:

```text
package-lock.json
```

Instalación:

```bash
npm ci
```

---

## 3. Elección de framework

Usar **Next.js App Router** porque:

- integra UI y backend ligero en un único proyecto;
- funciona de forma nativa en Vercel;
- permite Server Components;
- permite Server Actions y Route Handlers;
- facilita autenticación y acceso privado a Blob;
- evita desplegar un backend separado para este MVP.

No crear backend Java, microservicios ni API separada.

---

## 4. Estructura sugerida

```text
src/
  app/
    (auth)/
    (protected)/
    api/

  components/
    ui/
    layout/
    quotation/
    catalog/
    sharing/

  domain/
    quotation/
    glass/
    catalogs/

  application/
    quotation/
    glass/
    catalogs/

  infrastructure/
    auth/
    persistence/
      blob/

  lib/
    formatting/
    validation/
    pdf/
    whatsapp/

  config/

public/
  brand/

tests/
  unit/
  integration/
  e2e/

docs/
```

---

## 5. Principio de arquitectura

```text
UI
↓
Application / Use Cases
↓
Repository interfaces
↓
Infrastructure
↓
Vercel Blob
```

Los componentes no conocen Blob.

Repositories mínimos:

```text
GlassRepository
QuotationRepository
BaseCatalogRepository
```

Implementaciones:

```text
VercelBlobGlassRepository
VercelBlobQuotationRepository
VercelBlobBaseCatalogRepository
```

Migración futura:

```text
PostgresGlassRepository
PostgresQuotationRepository
PostgresBaseCatalogRepository
```

No cambiar UI ni dominio al migrar a PostgreSQL.

---

## 6. Runtime y Next.js

Usar App Router.

Preferir:

- Server Components para lecturas;
- Server Actions para mutaciones desde formularios internos;
- Route Handlers cuando se necesite una URL HTTP explícita;
- Client Components solo para controles interactivos.

Usar Node.js runtime para:

- autenticación;
- Vercel Blob;
- PDF;
- operaciones server-side.

En Next.js 16:

- usar `proxy.ts` si se necesita un filtro previo de navegación;
- no crear `middleware.ts` nuevo;
- no usar Proxy como única capa de autorización.

Toda mutación protegida debe verificar sesión en servidor.

---

## 7. Diseño

Recrear las pantallas de STITCH con componentes reales.

Mantener:

- glassmorphism ligero;
- azul corporativo;
- fondo azul/gris claro;
- transparencias suaves;
- bordes redondeados;
- sombras discretas;
- buen contraste;
- tipografía legible;
- controles touch-friendly.

Optimizar:

1. tablet;
2. desktop/laptop;
3. móvil como compatibilidad secundaria.

No copiar HTML rígido.

No usar valores ficticios de STITCH como datos hardcodeados de producción.

Copiar logo/assets necesarios a:

```text
public/brand/
```

---

## 8. Login MVP

Pantalla según STITCH.

Variables:

```text
APP_USER
APP_PASSWORD_HASH
SESSION_SECRET
```

Usar `jose` para firmar/verificar sesión.

Cookie:

- HttpOnly;
- Secure en producción;
- SameSite=Lax o más restrictivo si no rompe flujo;
- expiración razonable.

No enviar hash/password al cliente.

No almacenar credenciales en localStorage/IndexedDB.

Crear un script documentado para generar `APP_PASSWORD_HASH`.

Proteger:

- cotizador;
- catálogo;
- catálogos base;
- proformas;
- endpoints internos.

---

## 9. Flujo principal

```text
LOGIN
  ↓
COTIZADOR
  ↓
AGREGAR VIDRIOS
  ↓
EDITAR / ELIMINAR / CAMBIAR CANTIDAD
  ↓
VISTA DETALLADA / COMPACTA
  ↓
CONFIRMAR PROFORMA
  ↓
PROFORMA CONFIRMADA
  ↓
COMPARTIR
     ├── WhatsApp
     ├── Copiar
     ├── Imprimir
     └── Descargar PDF
  ↓
NUEVA PROFORMA
```

Además:

```text
CATÁLOGO PRINCIPAL
CATÁLOGOS BASE
```

---

## 10. Cotizador

Cabecera:

- Proforma Nº `PRO-XXXXX`;
- fecha;
- hora;
- logo/identidad.

Formulario:

- modalidad: Pie² (por medidas) o Plancha entera;
- vidrio activo con precio mayor que cero en la modalidad elegida;
- ancho cm (solo pie²);
- alto cm (solo pie²);
- cantidad.

Los datos del vidrio provienen del catálogo activo.

Cantidad:

- botón `-`;
- input manual;
- botón `+`.

No permitir:

- 0;
- negativos;
- decimales en cantidad;
- medidas <= 0.

Agregar debe ser una acción compacta y clara.

---

## 11. Resumen

Mostrar:

- vidrio;
- medidas en cm;
- cantidad;
- precio unitario;
- importe.

Soportar:

- vista detallada;
- vista compacta.

Agrupar visualmente por tipo de vidrio cuando corresponda al diseño STITCH.

No mostrar conversiones internas a pulgadas/pie² como información principal.

---

## 12. Edición

Cada ítem de un borrador puede:

- editar ancho;
- editar alto;
- editar cantidad;
- guardar cambios;
- cancelar;
- eliminar.

Al editar:

- no duplicar el ítem;
- recalcular con el dominio;
- actualizar total.

Una proforma confirmada queda solo lectura.

---

## 13. Nueva proforma

`Nueva proforma` limpia únicamente el borrador actual.

Si hay cambios no confirmados:

- mostrar confirmación.

No borrar:

- catálogo;
- catálogos base;
- históricos;
- configuración.

---

## 14. Confirmación

Antes de confirmar:

- validar que haya al menos un ítem;
- validar medidas;
- validar cantidades;
- validar productos activos;
- recalcular en servidor;
- no confiar en totales enviados por cliente.

Al confirmar:

- asignar número único;
- persistir;
- guardar snapshot de producto/precio/cálculo;
- guardar fecha/hora `America/Lima`;
- marcar `CONFIRMED`.

No IGV.

No impuestos.

Total = suma de `itemAmount`.

---

## 15. Numeración PRO-XXXXX

Formato:

```text
PRO-00001
PRO-00002
PRO-00003
```

Debe ser única y creciente.

Para el MVP con Blob:

1. listar proformas confirmadas por prefijo;
2. determinar el mayor número existente;
3. proponer `max + 1`;
4. guardar en pathname único con `allowOverwrite: false`;
5. si existe colisión por concurrencia, volver a listar y reintentar.

No sobrescribir una proforma existente.

Evitar depender de un contador mutable como única fuente de verdad.

---

## 16. Catálogos base

Formulario simplificado: nombre, descripción opcional y estado. No solicitar ni mostrar código u observación. Conservar esos campos de registros antiguos internamente, sin cambiar IDs ni referencias existentes.

Solo:

1. Familias
2. Colores / acabados
3. Espesores
4. Diseños catedral

No:

- `Aplica a`;
- catálogo de formatos de plancha.

Cada catálogo permite:

- buscar;
- crear;
- editar;
- ocultar;
- reactivar.

No eliminar físicamente.

Estados:

```text
ACTIVE
HIDDEN
```

En UI:

```text
Activo
Oculto
```

---

## 17. Catálogo principal de vidrios

Campos mínimos:

```text
id
schemaVersion
code
familyId
colorFinishId?
thicknessId
cathedralDesignId?
sheetWidthCm?
sheetHeightCm?
pricePerSquareFoot
pricePerSheet?
status
createdAt
updatedAt
```

Código único.

Los precios se ingresan desde los centavos, con dos decimales fijos: teclear `11100` muestra `111.00`. Aplicar a precio por pie² y por plancha, ambos permiten `0.00` y valores vacíos/ausentes se guardan como `0.00`. Cero indica que esa modalidad no está disponible para cotizar. Validar nuevos precios o cambios en servidor y conservar exactamente precios existentes no modificados. No aplicar esta máscara a medidas ni cantidades.

El botón `+ Nuevo vidrio` abre el modal STITCH con blur discreto.

El mismo formulario sirve para:

- crear;
- editar.

Un producto oculto:

- no aparece en nuevas cotizaciones;
- sí existe en administración;
- sí existe en históricos;
- puede reactivarse.

---

## 18. Fórmula

No redefinirla aquí.

La única fuente de verdad es:

`docs/business-rules.md`

Implementar en:

```text
src/domain/quotation/calculation.ts
```

Usar:

```text
decimal.js
```

No duplicar.

Tests oficiales deben dar:

```text
S/ 62.25
S/ 208.10
```

---

## 19. Modelo de proforma

Ejemplo conceptual:

```ts
type QuotationStatus = 'CONFIRMED'

interface Quotation {
  schemaVersion: 1
  id: string
  number: string
  status: QuotationStatus
  createdAt: string
  confirmedAt: string
  timezone: 'America/Lima'
  total: string
  items: QuotationItem[]
}

interface SquareFootQuotationItem {
  mode?: 'SQUARE_FOOT' // Ausente en históricos antiguos.
  id: string
  productId: string

  productCode: string
  productDescription: string
  family: string
  colorFinish?: string
  thickness: string
  cathedralDesign?: string

  widthCm: string
  heightCm: string
  quantity: number

  pricePerSquareFoot: string

  widthInRaw: string
  heightInRaw: string
  widthInRounded: string
  heightInRounded: string

  areaIn2: string
  areaFt2: string

  unitPrice: string
  itemAmount: string
}
```

Una proforma admite ambas modalidades simultáneamente. La otra variante es `SheetQuotationItem`, con `mode: 'SHEET'`, los mismos IDs y datos descriptivos, `quantity`, `pricePerSheet`, `unitPrice`, `itemAmount` y dimensiones de plancha opcionales. No lleva conversiones ni medidas de corte. `QuotationItem = SquareFootQuotationItem | SheetQuotationItem`. Plancha entera calcula precio de catálogo × cantidad con dos decimales, sin redondeo a 0.05. El servidor vuelve a validar disponibilidad y precios al confirmar. Los históricos sin modalidad permanecen intactos y se presentan por pie².

Persistir valores decimales como string si ayuda a evitar pérdida de precisión.

---

## 20. Persistencia centralizada en Vercel

Requisito funcional:

> La misma información debe verse desde cualquier dispositivo que use la misma web.

Usar **Vercel Blob Private** como fuente de verdad.

No usar como fuente principal:

- localStorage;
- IndexedDB;
- Cache API.

El estado local del navegador solo puede ser temporal.

---

## 21. Vercel Blob

Dependencia:

```text
@vercel/blob 2.8.x
```

Store:

```text
Private
```

Lectura/escritura:

- siempre server-side;
- nunca desde cliente con token;
- nunca hardcodear token.

Credencial:

```text
BLOB_READ_WRITE_TOKEN
```

Debe venir del Blob Store conectado a Vercel.

No documentar ni copiar su valor.

### Consistencia

Para lecturas que deben reflejar la última escritura:

```ts
get(pathname, {
  access: 'private',
  useCache: false
})
```

### Concurrencia

Al actualizar un registro existente:

- obtener ETag;
- `put(..., allowOverwrite: true, ifMatch: etag)`;
- capturar `BlobPreconditionFailedError`;
- informar conflicto o reintentar con datos frescos.

Para proformas confirmadas:

```text
allowOverwrite: false
```

---

## 22. Organización Blob

Recomendación:

```text
data/v1/catalogs/families/{id}.json
data/v1/catalogs/colors-finishes/{id}.json
data/v1/catalogs/thicknesses/{id}.json
data/v1/catalogs/cathedral-designs/{id}.json

data/v1/products/{id}.json

data/v1/quotations/PRO-00001.json
data/v1/quotations/PRO-00002.json
...
```

Cada JSON importante:

```json
{
  "schemaVersion": 1
}
```

No guardar todas las proformas en un solo archivo gigante.

---

## 23. Acceso desde varios dispositivos

Al abrir una pantalla:

- cargar datos desde repositories server-side;
- no asumir datos locales;
- devolver información de Blob.

Después de guardar desde dispositivo A:

- refrescar vista A;
- dispositivo B debe ver el cambio al abrir/recargar;
- usar `useCache: false` en lecturas sensibles para evitar hasta 60 s de stale data tras overwrites.

No se exige actualización instantánea sin refrescar.

---

## 24. Compartir

Después de confirmar:

1. WhatsApp
2. Copiar texto
3. Imprimir
4. Descargar PDF

Todos consumen la proforma confirmada, no recalculan por separado.

---

## 25. WhatsApp

Generar texto desde datos reales.

Ejemplo de estructura:

```text
DISTRIBUIDORA ARAUJO
Vidriería & Aluminios

PROFORMA N° PRO-00001
Fecha: ...

Vidrio ...
Medidas ...
Cantidad ...
Precio unitario ...
Importe ...

TOTAL PROFORMA: S/ ...
```

Sin IGV.

Usar URL estándar de WhatsApp.

No usar API paga.

---

## 26. Clipboard

Usar Clipboard API.

Mostrar feedback visual:

```text
Proforma copiada
```

---

## 27. PDF A4

Usar:

```text
@react-pdf/renderer 4.9.x
```

Documento:

- A4;
- profesional;
- impresión económica;
- sin glassmorphism;
- sin IGV.

Mostrar:

- empresa;
- número;
- fecha/hora;
- detalle;
- espesor;
- medidas;
- cantidad;
- precio unitario;
- importe;
- total;
- condiciones comerciales.

No duplicar fórmula.

---

## 28. Ticket térmico 80 mm

CSS/plantilla específica para 80 mm.

Mostrar:

- empresa;
- número;
- fecha;
- detalle;
- cantidades;
- total;
- condiciones.

Sin IGV.

---

## 29. Backup

Crear scripts:

```text
npm run backup:export
npm run backup:import -- <archivo>
```

El export debe:

- listar blobs del prefijo `data/v1/`;
- descargar datos;
- generar un JSON consolidado con metadata y `schemaVersion`.

El import debe:

- validar con Zod;
- pedir flag explícito para sobrescribir datos existentes;
- nunca ejecutarse automáticamente.

No commitear backups reales.

---

## 30. Migración futura a PostgreSQL

El dominio no conoce Blob.

Cuando se migre:

```text
VercelBlobGlassRepository
→ PostgresGlassRepository
```

No cambiar:

- fórmula;
- UI;
- PDF;
- WhatsApp;
- casos de uso.

Crear documentación de mapping de entidades a tablas en `docs/data-model.md`.

---

## 31. Errores

Manejo consistente en español.

Ejemplos:

- Código duplicado
- Producto inexistente
- Producto oculto
- Medidas inválidas
- Cantidad inválida
- Conflicto de actualización
- Error guardando proforma
- Error cargando catálogo
- Error generando PDF

No mostrar stack traces al usuario.

Registrar contexto en servidor sin imprimir secretos.

---

## 32. Validación

Zod:

- cliente para UX;
- servidor como validación autoritativa.

Nunca confiar únicamente en el navegador.

---

## 33. Fechas y moneda

Locale:

```text
es-PE
```

Moneda:

```text
PEN
```

Formato:

```text
S/ 540.00
```

Timezone:

```text
America/Lima
```

---

## 34. Testing

### Unit

- fórmula;
- siguiente par;
- redondeos;
- validaciones;
- serialización.

### Integration

- repositories Blob con adapter/mocks;
- casos de uso.

### E2E

Como mínimo:

1. login correcto;
2. login incorrecto;
3. crear familia;
4. crear color;
5. crear espesor;
6. crear diseño;
7. crear vidrio;
8. editar vidrio;
9. ocultar vidrio;
10. reactivar vidrio;
11. crear proforma;
12. agregar varios productos;
13. editar medidas;
14. cambiar cantidad;
15. eliminar ítem;
16. detallado/compacto;
17. confirmar;
18. recargar y consultar confirmada;
19. compartir/copiar;
20. generar PDF;
21. imprimir 80 mm;
22. nueva proforma;
23. siguiente número PRO-XXXXX.

### Fórmula crítica

No desplegar si fallan:

```text
100 x 80 cm / S/3.50 / cantidad 2 = S/62.25
120 x 80 cm / S/6.50 / cantidad 3 = S/208.10
```

---

## 35. Responsive

Verificar:

```text
1440x900
1280x800
1024x768
iPad landscape equivalente
```

Evitar scroll horizontal innecesario.

---

## 36. Performance

Catálogo pequeño: aproximadamente 40–70 vidrios inicialmente.

No sobreoptimizar.

No introducir:

- Redis;
- cache distribuido;
- colas;
- eventos;
- microservicios.

Para lecturas repetidas se puede usar cache de Next solo si no compromete consistencia del catálogo.

Tras mutaciones, revalidar.

Para datos que deben verse inmediatamente después de overwrite, leer Blob con `useCache: false`.

---

## 37. Archivos de proyecto

Versionar:

```text
AGENTS.md
README.md
docs/
src/
public/
tests/
package.json
package-lock.json
tsconfig.json
eslint.config.*
next.config.*
postcss.config.*
.env.example
.nvmrc
```

No versionar:

```text
.env
.env.local
.vercel/
node_modules/
.next/
playwright-report/
test-results/
backups reales
```

Copiar assets runtime desde STITCH a `public/brand/`.

Después excluir `STITCH/` del deployment con `.vercelignore`.

No eliminar STITCH del repositorio salvo decisión explícita.

---

## 38. Variables de entorno

`.env.example`:

```text
APP_USER=
APP_PASSWORD_HASH=
SESSION_SECRET=
BLOB_READ_WRITE_TOKEN=
```

Nunca poner valores reales en Git.

Validar env server-side con Zod.

Fallos de configuración deben producir un error claro al arrancar/usar el módulo afectado.

---

## 39. Vercel

Cuenta/equipo esperado:

`https://vercel.com/rodrigor4mirezs-projects`

Proyecto sugerido:

```text
vidrieria-araujo
```

Antes:

```bash
vercel --version
vercel whoami
vercel teams ls
```

No sobrescribir otro proyecto.

### Node

Seleccionar:

```text
24.x
```

### Blob

Crear dos stores privados si es viable:

```text
vidrieria-araujo-preview
vidrieria-araujo-production
```

Conectar cada entorno al store correspondiente.

No usar producción para pruebas.

### Región

Preferir que funciones y Blob estén en la misma región.

Para usuarios principalmente en Perú, preferir `gru1` (São Paulo) si está disponible y no existe una razón de costo/operación para elegir otra.

---

## 40. Preview y Production

Orden:

1. build local;
2. lint;
3. typecheck;
4. tests;
5. deploy Preview;
6. probar login;
7. probar catálogos;
8. probar crear/editar vidrio;
9. probar cotizador;
10. probar confirmar;
11. verificar persistencia;
12. abrir desde otro navegador y confirmar datos compartidos;
13. probar compartir/PDF;
14. Production.

No hacer Production si Preview está roto.

---

## 41. Scripts mínimos

`package.json` debe ofrecer al menos:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "verify": "npm run lint && npm run typecheck && npm run test && npm run build"
  }
}
```

No usar `next lint`.

---

## 42. Documentación

Crear/actualizar:

- `README.md`
- `docs/architecture.md`
- `docs/business-rules.md`
- `docs/data-model.md`
- `docs/stitch-map.md`
- `docs/deployment.md`

README debe explicar:

- objetivo;
- stack;
- instalación;
- variables;
- desarrollo;
- tests;
- Blob;
- backup;
- deploy;
- migración futura.

---

## 43. Stitch map

Antes de implementar, crear:

`docs/stitch-map.md`

Debe relacionar:

| Archivo Stitch | Pantalla | Ruta | Estado | Interacciones | Componentes |
|---|---|---|---|---|---|

No inventar nombres de archivos.

Descubrirlos inspeccionando STITCH.

---

## 44. Seguridad

- secretos solo servidor;
- cookies HttpOnly;
- Secure en producción;
- SameSite;
- validar input;
- no confiar en cálculos cliente;
- private Blob;
- no exponer `BLOB_READ_WRITE_TOKEN`;
- no loggear secrets;
- no permitir overwrite de proformas confirmadas;
- validar sesión en mutaciones.

---

## 45. Git

Antes:

```bash
git status
```

Al terminar:

- revisar diff;
- ejecutar `npm run verify`;
- ejecutar E2E relevante;
- mostrar `git status`.

No ocultar warnings o errores.

---

## 46. Criterio de terminado

No basta con “se ve bien”.

Debe funcionar:

- login;
- catálogos base;
- catálogo principal;
- crear/editar/ocultar/reactivar;
- cotizador;
- fórmula;
- editar medidas;
- cantidades;
- eliminación de línea;
- confirmación;
- histórico;
- numeración;
- persistencia compartida;
- WhatsApp;
- copiar;
- PDF;
- impresión;
- nueva proforma;
- backup;
- tests;
- build;
- Preview;
- Production.

---

## 47. Forma de trabajo

Trabajar de manera autónoma.

No pedir confirmaciones para decisiones técnicas menores.

Si una tarea externa requiere credenciales/permisos, detenerse únicamente en ese punto e indicar:

- qué falta;
- por qué;
- dónde se configura.

No inventar información de negocio.

---

## 48. Orden de implementación

1. inspección del proyecto;
2. lectura de reglas;
3. mapa STITCH;
4. setup/stack;
5. arquitectura;
6. login;
7. catálogos base;
8. catálogo principal;
9. motor de cálculo;
10. cotizador;
11. confirmación;
12. persistencia;
13. compartir;
14. PDF/ticket;
15. backups;
16. tests;
17. documentación;
18. Preview;
19. Production.

No detenerse después de una sola fase salvo bloqueo real.

## 49. Decisiones verificadas de implementación

- Next.js 16.3.5 es el patch estable elegido mediante npm; versiones exactas en package.json/package-lock.json.
- `tsc` usa TypeScript 7.0.2 a través del alias `@typescript/native`. El paquete oficial de compatibilidad `@typescript/typescript6` se publica bajo el alias `typescript` para herramientas que aún consumen su API. ESLint 10 usa `@eslint/compat` para los plugins heredados de eslint-config-next, sin desactivar reglas.
- Webpack es el compilador de desarrollo/build por una restricción local de puertos en el proceso auxiliar CSS de Turbopack.
- Catálogos base y productos comparten `data/v1/catalog.json` para unicidad de SKU y control de versiones mediante una única operación ETag. Las proformas mantienen un archivo inmutable por folio.
- Condiciones comerciales opcionales se ingresan expresamente y se guardan en el snapshot. No se toman plazos ni datos fiscales contradictorios de los mocks como valores de producción.
- Fecha UTC persistida y zona America/Lima explícita; presentación siempre en Lima.
- Autenticación con scrypt para hash y jose para sesión. Secretos definidos en Vercel; producción inicia con catálogo vacío.

### Selección guiada del vidrio

En cotizador: elegir modalidad → familia → vidrio. No hay selección inicial automática. Cada control permanece deshabilitado hasta completar el anterior; medidas y cantidad requieren un vidrio seleccionado. Al cambiar modalidad o familia se descarta la selección dependiente. Solo se ofrecen familias con productos activos y cotizables (precio > 0 en esa modalidad), y el combo de vidrio se limita a esa familia. Se elimina el selector adicional de espesor. El detalle muestra el diseño cuando corresponda (por ejemplo, Arabesco, sin el prefijo Catedral), color, grosor, medidas de plancha si están registradas, y código entre paréntesis en texto pequeño. No se inventan dimensiones ni se repite la familia. La edición de ítems conserva su modalidad, familia y producto; permite cambiar medidas/cantidad como antes. Cálculos y snapshots históricos permanecen iguales.

### Continuidad del borrador en la pestaña

Indicador ámbar con pulso suave, estático con movimiento reducido. Copia temporal de UI en sessionStorage (usuario/pestaña), incluyendo formulario sin agregar y edición, para navegar y recargar sin reiniciar. Se limpia al confirmar, descartar y cerrar sesión. Catálogos e históricos siguen en Blob; precios y disponibilidad se validan nuevamente al confirmar. No implica sincronización de borradores entre dispositivos.
