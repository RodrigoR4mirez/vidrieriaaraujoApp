# AGENTS.md

## Proyecto

Este repositorio contiene el MVP web de:

**Distribuidora Araujo – Vidriería & Aluminios**

Directorio raíz esperado:

`/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/Vidrieria/vidrieriaaraujoApp`

---

## 1. Fuentes de verdad

Antes de modificar código, leer obligatoriamente y en este orden:

1. `docs/business-rules.md`
2. `docs/implementation-spec.md`
3. todos los `.md` dentro de `STITCH/instrucciones/`
4. HTML, CSS, imágenes y assets relevantes dentro de `STITCH/`

No inventar reglas de negocio.

### Prioridad ante contradicciones

1. `docs/business-rules.md`
2. `AGENTS.md`
3. `docs/implementation-spec.md`
4. `STITCH/instrucciones/*.md`
5. HTML / mock visual de STITCH

STITCH es la referencia visual.  
`docs/business-rules.md` es la referencia funcional para los cálculos.

Si STITCH muestra IGV, impuestos o una fórmula distinta, debe adaptarse a las reglas de negocio aprobadas.

---

## 2. Trabajo inicial obligatorio

Antes de implementar:

1. ejecutar `git status`;
2. inspeccionar el proyecto existente;
3. inspeccionar `STITCH/`;
4. leer todos los `.md` de `STITCH/instrucciones/`;
5. leer `docs/business-rules.md`;
6. leer `docs/implementation-spec.md`;
7. identificar la secuencia de pantallas;
8. identificar assets reutilizables;
9. crear o actualizar `docs/stitch-map.md`;
10. recién después modificar código.

No sobrescribir trabajo útil existente sin revisarlo primero.

No modificar ni eliminar los archivos originales de STITCH salvo instrucción explícita.

---

## 3. Stack técnico aprobado

Baseline recomendado para este proyecto:

- Node.js: `24.x` LTS
- Next.js: `16.3.3` o patch estable posterior de `16.3.x`
- React / React DOM: `19.3.0`
- TypeScript: `7.0.x`
- Tailwind CSS: `4.3.x`
- React Hook Form: `7.88.x`
- Zod: `4.6.x`
- lucide-react: `1.47.x`
- decimal.js: `10.6.x`
- jose: `6.2.x`
- @vercel/blob: `2.8.x`
- @react-pdf/renderer: `4.9.x`
- Vitest: `5.0.x`
- @testing-library/react: `16.3.x`
- @testing-library/dom: `10.4.x`
- Playwright: `1.63.x`
- ESLint: `10.x`
- eslint-config-next: misma versión estable que `next`

Usar únicamente releases estables.

No usar canary, beta, alpha o RC.

Antes de instalar dependencias, validar con `npm view` que las versiones continúen siendo estables y compatibles. Si existe un patch de seguridad más nuevo dentro de la misma rama estable, usarlo.

### Node/npm

En `package.json`:

```json
{
  "engines": {
    "node": "24.x"
  }
}
```

Crear también `.nvmrc` con:

```text
24
```

No forzar una versión distinta de npm a la que use el entorno Node 24 de Vercel salvo necesidad real.

Commit obligatorio de `package-lock.json`.

Instalaciones reproducibles con:

```bash
npm ci
```

---

## 4. Framework y runtime

Usar **Next.js App Router**.

Preferir:

- Server Components para lecturas;
- Server Actions o Route Handlers para mutaciones;
- Client Components únicamente donde exista interacción real.

Usar runtime Node.js en autenticación, persistencia Blob y PDF.

No usar Edge Runtime para esas partes.

En Next.js 16, si se necesita interceptar rutas usar `proxy.ts`, no crear un nuevo `middleware.ts`.

No abusar de `proxy.ts`: la autorización real también debe verificarse en el servidor al ejecutar lecturas y mutaciones protegidas.

---

## 5. Arquitectura

Mantener:

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

Los componentes React nunca acceden directamente a Vercel Blob.

La lógica de negocio nunca vive dentro del JSX.

Interfaces mínimas:

- `GlassRepository`
- `QuotationRepository`
- `BaseCatalogRepository`

Implementaciones del MVP:

- `VercelBlobGlassRepository`
- `VercelBlobQuotationRepository`
- `VercelBlobBaseCatalogRepository`

La migración futura a PostgreSQL debe poder hacerse implementando nuevos repositories sin reescribir UI, casos de uso ni fórmula.

---

## 6. Persistencia compartida

**Vercel Blob Private es la fuente de verdad del MVP.**

Objetivo obligatorio:

> Si la aplicación se abre desde PC, laptop o tablet, todos deben consultar la misma información persistida.

No usar como fuente de verdad:

- localStorage;
- IndexedDB;
- Cache API;
- archivos locales del navegador.

El navegador puede guardar estado efímero de UI, pero no ser la única copia de datos del negocio.

Persistir centralmente:

- familias;
- colores/acabados;
- espesores;
- diseños catedral;
- catálogo de vidrios;
- cotizaciones confirmadas;
- metadatos necesarios.

Todas las operaciones Blob deben ejecutarse server-side.

Usar un **Private Blob Store**.

La credencial esperada para Vercel Blob es:

- `BLOB_READ_WRITE_TOKEN`, suministrada por el store conectado al proyecto.

Nunca exponerla al navegador.

No asumir que OIDC reemplaza el token de Vercel Blob.

---

## 7. Consistencia y concurrencia en Blob

Para lecturas de negocio donde sea importante obtener la última escritura:

```ts
get(pathname, {
  access: 'private',
  useCache: false
})
```

Para actualizar un blob existente:

- leer su ETag;
- escribir con `allowOverwrite: true`;
- usar `ifMatch`;
- si ocurre `BlobPreconditionFailedError`, recargar y reintentar o informar conflicto.

Las cotizaciones confirmadas son inmutables:

- pathname único;
- `allowOverwrite: false`;
- nunca sobrescribir una cotización confirmada.

Después de mutaciones:

- refrescar/revalidar la vista correspondiente;
- evitar servir datos de negocio obsoletos.

No se requiere WebSocket ni tiempo real para el MVP. Otro dispositivo debe ver los cambios al cargar/refrescar.

---

## 8. Reglas críticas del catálogo

Catálogos base:

1. Familias
2. Colores / acabados
3. Espesores
4. Diseños catedral

No crear:

- `Aplica a`;
- catálogo de `Formatos de plancha`.

Estados:

- `Activo`
- `Oculto`

No eliminar físicamente productos ni valores de catálogo.

Los ocultos:

- se conservan;
- pueden editarse;
- pueden reactivarse;
- no aparecen en nuevas cotizaciones;
- permanecen en históricos.

El código/SKU debe ser único.

---

## 9. Regla crítica: NO IGV

La cotización del MVP no maneja IGV.

No calcular, mostrar ni almacenar:

- IGV;
- 18%;
- tax;
- taxRate;
- taxAmount;
- subtotal + impuesto;
- total con IGV.

Aplica a:

- UI;
- dominio;
- DTOs;
- persistencia;
- PDF;
- ticket;
- WhatsApp;
- impresión;
- tests;
- documentación.

El total es:

```text
subtotalCotizacion = suma exacta de los importes de los ítems
totalCotizacion = subtotalCotizacion redondeado hacia arriba a .50 o al entero
```

---

## 10. Regla crítica: fórmula

La única fuente de verdad es:

`docs/business-rules.md`

Implementar la fórmula una sola vez en el dominio.

Usar `decimal.js` para precisión monetaria y redondeos.

No duplicar fórmulas en:

- componentes;
- Server Actions;
- Route Handlers;
- PDF;
- ticket;
- WhatsApp;
- resumen;
- repositories.

Tests obligatorios:

```text
100 x 80 cm
S/ 3.50 / pie²
cantidad 2
subtotal S/ 62.24; total S/ 62.50
```

```text
120 x 80 cm
S/ 6.50 / pie²
cantidad 3
subtotal S/ 208.08; total S/ 208.50
```

No desplegar si esos tests fallan.

---

## 11. Autenticación MVP

Usar:

- `APP_USER`
- `APP_PASSWORD_HASH`
- `SESSION_SECRET`

No guardar password plano en Git.

Usar `jose` para sesión firmada en cookie HttpOnly.

Cookie:

- HttpOnly;
- Secure en producción;
- SameSite=Lax o más restrictivo si no rompe el flujo;
- expiración razonable.

Validar sesión en servidor antes de acceder o mutar datos.

Agregar script documentado para generar `APP_PASSWORD_HASH`.

---

## 12. Diseño

STITCH es la referencia visual.

Mantener:

- glassmorphism ligero;
- fondo azul/gris suave;
- tarjetas translúcidas;
- bordes suaves;
- sombras discretas;
- azul corporativo;
- tipografía legible;
- botones touch-friendly;
- layout optimizado para tablet y desktop.

Reutilizar logo/assets reales de STITCH.

Copiar los assets necesarios en runtime a `public/brand/` o una carpeta pública equivalente.

No depender de rutas dentro de `STITCH/` en producción.

---

## 13. Calidad

Siempre:

- TypeScript strict;
- evitar `any`;
- Zod en límites de entrada;
- componentes reutilizables;
- funciones pequeñas;
- no números mágicos;
- no lógica de negocio en JSX;
- errores de usuario en español;
- tests de dominio;
- tests E2E de flujos críticos.

Scripts mínimos:

```text
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run verify
```

`verify` debe ejecutar al menos lint + typecheck + tests + build.

No declarar terminado si build o tests críticos fallan.

### Ahorro de créditos en trabajos futuros

Este proyecto es un MVP. Priorizar el ahorro de créditos y mantener el alcance limitado a lo solicitado por el usuario.

- Elegir la comprobación mínima necesaria según el cambio y su riesgo.
- No repetir pruebas que ya pasaron sobre código que no cambió, salvo un fallo o una duda concreta que lo justifique.
- Evitar baterías completas, auditorías extensas, pruebas redundantes y mejoras no solicitadas para cambios pequeños.
- Para cambios exclusivamente de documentación o instrucciones, revisar el diff; no ejecutar lint, typecheck, tests, build ni desplegar.
- Probar los flujos afectados. Mantener las verificaciones críticas de fórmula, autenticación, persistencia y confirmación cuando el cambio pueda afectarlas.
- Antes de un despliegue funcional, cumplir los controles críticos de este archivo y reutilizar resultados válidos del mismo código cuando corresponda.

---

## 14. Archivos y deployment

Debe subirse al repositorio:

- `src/`
- `public/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- configuración de Tailwind/ESLint/Next;
- `AGENTS.md`;
- `docs/`;
- tests;
- `.env.example`.

Nunca subir:

- `.env.local`;
- secretos;
- tokens;
- backups reales;
- credenciales;
- `.vercel/`.

Una vez copiados los assets necesarios a `public/`, excluir `STITCH/` del deployment mediante `.vercelignore` para no enviarlo innecesariamente a producción.

Mantener STITCH en el repositorio si sirve como referencia de diseño, pero no usarlo como dependencia runtime.

---

## 15. Vercel

Proyecto objetivo sugerido:

`vidrieria-araujo`

Antes de desplegar:

```bash
vercel --version
vercel whoami
vercel teams ls
```

Usar Node 24.x en Vercel.

Crear/conectar un **Private Blob Store**.

Separar Preview y Production para no contaminar datos reales con pruebas:

- store de preview/desarrollo;
- store de producción.

Seleccionar región del Blob cercana a usuarios y funciones; para este proyecto en Perú, preferir una región sudamericana como `gru1` si está disponible y usar la misma región para las funciones que acceden al store.

Aplicar obligatoriamente `docs/release-workflow.md` al cerrar cada sesión con cambios.

- Para cambios funcionales de riesgo bajo, usar validación focalizada y Production directa; Preview no es obligatorio.
- Para cambios de riesgo medio, usar Preview cuando sea necesario para comprobar el flujo afectado.
- Para fórmula, autenticación, persistencia, concurrencia, numeración, backups, dependencias o configuración, Preview es obligatorio antes de Production.
- Los cambios exclusivamente documentales se confirman en Git, pero no ejecutan tests, build ni despliegue.
- Todo cambio funcional terminado debe quedar en un commit, integrado en `main`, publicado en `origin` y desplegado en Vercel, salvo instrucción contraria del usuario o bloqueo real.
- Si Vercel ya despliega automáticamente al publicar `main`, no iniciar un segundo despliegue idéntico por CLI.

---

## 16. Documentación obligatoria

Mantener:

- `README.md`
- `docs/implementation-spec.md`
- `docs/business-rules.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/stitch-map.md`
- `docs/deployment.md`
- `docs/release-workflow.md`

No mantener documentación contradictoria.

---

## 17. Regla final

Trabajar de forma autónoma.

No pedir confirmación para decisiones técnicas menores.

Elegir la solución más simple que:

- respete STITCH;
- respete `docs/business-rules.md`;
- mantenga persistencia centralizada;
- sea segura para el MVP;
- funcione correctamente en Vercel;
- permita migración futura a PostgreSQL.

Detenerse solo ante un bloqueo real de credenciales, permisos o regla de negocio inexistente.
