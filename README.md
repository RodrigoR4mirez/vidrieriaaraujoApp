# Distribuidora Araujo — Vidriería & Aluminios

MVP privado de catálogos de vidrios y perfiles de aluminio, cotización unificada y cotizaciones históricas. Tablet y escritorio. Los dispositivos leen la misma información desde Vercel Blob privado; el borrador se conserva temporalmente en la misma pestaña al navegar y recargar, hasta confirmarlo o descartarlo.

Aplicación: [vidrieria-araujo.vercel.app](https://vidrieria-araujo.vercel.app). El catálogo inicia vacío para cargar los datos reales del negocio. Resultados de pruebas y URL Preview en [Despliegue](docs/deployment.md#resultados).

## Instalar y ejecutar

```sh
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Completar las cuatro variables de `.env.local` antes de iniciar sesión. En un proyecto conectado, `vercel env pull .env.local --environment=development` obtiene las variables. No usar el store de producción para desarrollo o pruebas.

- Node 24.x, Next.js 16.3.5, React 19.3.0, Tailwind 4.3.3.
- TypeScript 7.0.2 (`tsc`); el alias oficial `@typescript/typescript6` proporciona la API que necesitan ESLint y otras herramientas. `@typescript/native` apunta al release estable de TypeScript 7.
- ESLint 10 con `@eslint/compat` conserva las reglas de los plugins heredados de Next. npm puede avisar de sus rangos peer anteriores a ESLint 10; la ejecución real de las reglas se verifica.
- React Hook Form, Zod, decimal.js, jose y @react-pdf/renderer.
- Build y desarrollo usan Webpack, soportado por Next 16; Turbopack no pudo abrir el proceso auxiliar CSS en el entorno local restringido.

## Acceso

`APP_USER` es el usuario compartido. `APP_PASSWORD_HASH` contiene un hash scrypt con sal aleatoria; nunca una contraseña. `SESSION_SECRET` debe tener al menos 32 caracteres aleatorios. Generar el hash sin exponer la contraseña en argumentos:

```sh
npm run auth:hash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

El segundo comando genera el secreto de sesión. En archivos dotenv, **escapar cada `$` del hash como `\$`** para evitar expansión de variables de Next.js; en Vercel introducir el hash literal, sin escapes. No publicar estos valores. Cookies HttpOnly, SameSite=Lax, Secure en producción, 8 horas o 7 días al recordar sesión. Cambiar `SESSION_SECRET` invalida todas las sesiones.

## Uso

1. Crear familias y espesores en **Catálogos base**, y opcionalmente colores/acabados y diseños catedral.
2. Crear vidrios con códigos únicos y precios por pie² y/o plancha (sin precio: `0.00`). El catálogo de producción inicia vacío.
3. Abrir **Perfiles** y usar **Cargar referencia inicial** una sola vez si el catálogo está vacío. La carga versionada contiene 21 familias, Mate/Negro, 154 perfiles únicos, 134 imágenes por código y 20 perfiles sin imagen. También se pueden crear, editar, ocultar o reactivar familias, colores y perfiles manualmente.
4. En **Cotizador**, elegir **Vidrio** o **Perfil**, seleccionar primero la modalidad y buscar por código, descripción o familia en el mismo campo. Las familias se filtran dentro de ese buscador: aparecen como chips hasta seis familias disponibles o como carpetas cuando hay más. Vidrio admite **Pie² (por medidas)** y **Plancha entera**; perfil admite **Por medida** (corte ingresado en centímetros) y **Por barra**, siempre con uno de sus colores/precios disponibles. Se pueden combinar todas las modalidades en una cotización.
5. Ingresar obligatoriamente el nombre del cliente y, si corresponde, condiciones comerciales opcionales. El sistema no asume plazos de entrega, vigencia ni datos fiscales de los mocks.
6. Confirmar. El servidor valida el nombre, ambos catálogos activos, recalcula y guarda una cotización inmutable con número definitivo.
7. Abrir **Compartir cotización** para copiar, abrir WhatsApp, descargar PDF A4, imprimir A4/ticket 80 mm o imprimir el voucher interno del taller sin precios.
8. Consultar el histórico desde cualquier otro dispositivo autenticado y buscar por cliente, número o fecha.

Ocultar conserva registros. Un producto con cualquier referencia base oculta tampoco puede seleccionarse para una nueva cotización. Para resolver conflictos de edición, recargar y volver a aplicar los cambios. Cambiar precios nunca recalcula el histórico.

Los catálogos base solo solicitan nombre, descripción opcional y estado. Los precios se escriben desde los centavos: `1` → `0.01`, `11100` → `111.00`; ambos precios permiten `0.00` y al vaciarlos toman ese valor. Cada modalidad ofrece únicamente productos activos con su precio mayor que cero. Una plancha se calcula como precio de catálogo × cantidad; por pie² se aplica la regla de merma de `0.5″`. Los importes de los ítems conservan sus dos decimales y solo el total final se redondea hacia arriba a un decimal; su segundo decimal siempre queda en `0`. Los datos antiguos se conservan sin migración destructiva.

Un perfil por medida recibe siempre centímetros. Calcula `(precio de barra ÷ longitud comercial) × 1.10`, redondea el precio por metro a dos decimales y lo multiplica por `(centímetros ÷ 100)` y cantidad. La barra comercial se conserva en metros y se muestra su equivalencia; históricos antiguos ingresados en metros siguen siendo legibles. Barra completa usa el precio del color por cantidad. La fórmula vive en el dominio y el total combinado se redondea una sola vez con la misma regla del vidrio. No se maneja IGV.

## Verificar

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify
```

`verify` ejecuta lint, tipos, unitarias/integración, build y generación PDF con el paquete aislado del despliegue. Los casos oficiales generan subtotales **S/ 62.24** y **S/ 208.08**, con totales a cobrar **S/ 62.30** y **S/ 208.10**. Playwright usa el servidor real y Blob de Preview/desarrollo, no una base simulada:

```sh
npx playwright install chromium
# Servidor en otra terminal: npm run dev
# .env.e2e.local (ignorado): E2E_USER=... y E2E_PASSWORD=...
npm run test:e2e
# O contra un Preview validado:
E2E_BASE_URL=https://<preview>.vercel.app npm run test:e2e
```

Si Preview tiene protección Vercel, proporcionar `VERCEL_AUTOMATION_BYPASS_SECRET` como variable privada. Las pruebas mutables están prohibidas contra la URL de producción. Crean registros identificados con `E2E-` exclusivamente en el store de pruebas. Cubren CRUD lógico, edición del borrador, fórmula, confirmación, recarga, segundo navegador, clipboard, enlace WhatsApp, PDF y formato de impresión. El envío real de WhatsApp y la salida de papel requieren la acción del operador.

## Backups

```sh
npm run backup:export:preview
npm run backup:export:production

# Importación: siempre indicar el ambiente explícitamente.
node --env-file=.env.catalogos-preview.local --import tsx scripts/backup.ts import backups/archivo.json --overwrite
node --env-file=.env.catalogos-production.local --import tsx scripts/backup.ts import backups/archivo.json --overwrite
```

Los backups reales están ignorados por Git y se crean con permisos 600. Importar valida esquema, rutas, códigos y referencias antes de escribir. Sin `--overwrite` no sobrescribe datos diferentes. Ni siquiera `--overwrite` permite cambiar una cotización confirmada. La importación de Production requiere aprobación explícita. Un fallo parcial se puede reintentar; archivos idénticos se omiten. Exportar durante baja actividad: Blob no ofrece una transacción de snapshot entre varios archivos. Guardar copias fuera del equipo en almacenamiento privado.

## Documentación

- [Reglas oficiales](docs/business-rules.md)
- [Especificación e implementación](docs/implementation-spec.md)
- [Arquitectura](docs/architecture.md)
- [Modelo de datos y migración futura](docs/data-model.md)
- [Mapa STITCH](docs/stitch-map.md)
- [Referencias originales de Excel y mockups](docs/reference-assets.md)
- [Vercel, entornos y despliegue](docs/deployment.md)
- [Flujo automático de entrega por sesión](docs/release-workflow.md)

Los originales STITCH y la carpeta local `mockapp-v2/` permanecen intactos y están excluidos del despliegue. El logo real está en `public/brand/logo.png`; las imágenes técnicas procesadas están en `public/profiles/` y las fuentes se sirven localmente desde el paquete de Fontsource.

### Selección guiada del vidrio

En cotizador: elegir tipo de producto → modalidad → buscador combinado. No hay selección inicial automática. El buscador se habilita tras elegir modalidad; las familias disponibles se filtran allí mediante chips o carpetas, sin un combo independiente. Medidas y cantidad requieren un producto seleccionado. Al cambiar modalidad o familia se descarta la selección dependiente cuando deja de ser cotizable. Solo se ofrecen familias con productos activos y cotizables (precio > 0 en esa modalidad). Se elimina el selector adicional de espesor. El detalle muestra el diseño cuando corresponda (por ejemplo, Arabesco, sin el prefijo Catedral), color, grosor, medidas de plancha si están registradas, y código entre paréntesis en texto pequeño. No se inventan dimensiones ni se repite la familia. La edición de ítems conserva su modalidad, familia y producto; permite cambiar medidas/cantidad como antes. Cálculos y snapshots históricos permanecen iguales.

El borrador temporal incluye campos aún sin agregar y ediciones pendientes. Se limpia al confirmar, descartar o cerrar sesión; no se sincroniza entre dispositivos. Si el navegador bloquea el almacenamiento temporal se muestra un aviso.

### Navegación y datos recientes

Los enlaces principales precargan sus pantallas; el Router Cache de Next reutiliza sus respuestas privadas en memoria durante 30 segundos. No se guardan catálogos ni históricos en sessionStorage/localStorage. `Actualizar` solicita los datos recientes en la pantalla actual, conservando el borrador. Las mutaciones mantienen revalidación y la confirmación relee precios en servidor. La primera visita o un caché vencido aún puede requerir espera de red. El número provisional se obtiene de los nombres de archivos, sin descargar snapshots; la reserva definitiva y el control de concurrencia permanecen sin cambios.
