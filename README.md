# Distribuidora Araujo — Vidriería & Aluminios

MVP privado de catálogo de vidrios, cotización por medidas y proformas históricas. Tablet y escritorio. Los dispositivos leen la misma información desde Vercel Blob privado; el borrador solo permanece en memoria hasta confirmarlo.

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
2. Crear vidrios con códigos únicos y precio por pie². El catálogo de producción inicia vacío.
3. En **Cotizador**, seleccionar vidrio, ancho y alto en cm y cantidad. Agregar, editar, eliminar y alternar vistas.
4. Ingresar condiciones comerciales opcionales. El sistema no asume plazos de entrega, vigencia ni datos fiscales de los mocks.
5. Confirmar. El servidor valida el catálogo activo, calcula y guarda una proforma inmutable con número definitivo.
6. Abrir **Compartir proforma** para copiar, abrir WhatsApp, descargar PDF A4 o imprimir A4/ticket 80 mm.
7. Consultar el histórico desde cualquier otro dispositivo autenticado.

Ocultar conserva registros. Un producto con cualquier referencia base oculta tampoco puede seleccionarse para una nueva cotización. Para resolver conflictos de edición, recargar y volver a aplicar los cambios. Cambiar precios nunca recalcula el histórico.

## Verificar

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify
```

`verify` ejecuta lint, tipos, unitarias/integración, build y generación PDF con el paquete aislado del despliegue. Los casos oficiales dan **S/ 62.25** y **S/ 208.10**. Playwright usa el servidor real y Blob de Preview/desarrollo, no una base simulada:

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
npm run backup:export
npm run backup:import -- backups/archivo.json
npm run backup:import -- backups/archivo.json --overwrite
```

Los backups reales están ignorados por Git y se crean con permisos 600. Importar valida esquema, rutas, códigos y referencias antes de escribir. Sin flag no sobrescribe datos diferentes. Ni siquiera `--overwrite` permite cambiar una proforma confirmada. Un fallo parcial se puede reintentar; archivos idénticos se omiten. Exportar durante baja actividad: Blob no ofrece una transacción de snapshot entre varios archivos. Guardar copias fuera del equipo en almacenamiento privado.

## Documentación

- [Reglas oficiales](docs/business-rules.md)
- [Especificación e implementación](docs/implementation-spec.md)
- [Arquitectura](docs/architecture.md)
- [Modelo de datos y migración futura](docs/data-model.md)
- [Mapa STITCH](docs/stitch-map.md)
- [Vercel, entornos y despliegue](docs/deployment.md)

Los originales STITCH permanecen intactos y están excluidos del despliegue. El logo real está en `public/brand/logo.png`; las fuentes se sirven localmente desde el paquete de Fontsource.
