# Despliegue y operación

Equipo: `rodrigor4mirezs-projects`. Proyecto: `vidrieria-araujo`.

Proyecto creado específicamente para este repositorio; no se modificaron los proyectos preexistentes. Node 24.x y región de funciones `gru1` en `vercel.json`.

## Almacenamiento

| Entorno | Store | ID | Acceso | Región |
|---|---|---|---|---|
| Preview y Development | vidrieria-araujo-preview | store_x9gVwBo680tIrdWK | privado | gru1 |
| Production | vidrieria-araujo-production | store_ZuyDwmjLsc1VGeQN | privado | gru1 |

`BLOB_READ_WRITE_TOKEN` se genera al conectar cada store. La aplicación pasa ese token al SDK desde el servidor. No depende de OIDC para persistir datos. Nunca copiar valores a documentación ni al cliente.

## Variables

| Variable | Uso |
|---|---|
| APP_USER | Usuario compartido |
| APP_PASSWORD_HASH | Hash scrypt generado con `npm run auth:hash` |
| SESSION_SECRET | Secreto aleatorio, mínimo 32 caracteres |
| BLOB_READ_WRITE_TOKEN | Token privado del store correspondiente |

Configurar en los tres entornos; el token Blob difiere entre Production y Preview/Development. Las credenciales iniciales se entregan por archivo local privado, fuera de Git. Cambiar contraseña requiere generar y reemplazar el hash; rotar además SESSION_SECRET para revocar sesiones previas. Después de actualizar variables desplegar nuevamente.

## Procedimiento

El flujo operativo obligatorio es **Local → GitHub → Vercel**; GitHub es la fuente de verdad y Vercel nunca se despliega directamente desde la carpeta local. La decisión entre Preview y Production está en [Flujo de entrega por sesión](release-workflow.md). Resumen:

```sh
nvm use
node --version
npm --version
vercel --version
vercel whoami
vercel teams ls
git fetch origin main --prune
git merge-base --is-ancestor origin/main main
# Solo si el historial permite avance seguro:
git push origin <rama-de-la-tarea> # Preview automático desde GitHub
# Tras aprobación explícita del usuario:
git switch main
git merge --ff-only <rama-de-la-tarea>
git push origin main # Production automática desde GitHub
```

La preparación persistente del equipo se hace una sola vez por usuario con `nvm install 24`, `nvm alias default 24`, `nvm use 24`, la CLI global `vercel` y `vercel login`. Las instrucciones completas están en [environments.md](environments.md). La CLI queda para inspección, autenticación y configuración; no reemplaza el flujo GitHub → Vercel ni autoriza un deploy directo.

Preview no es obligatorio para documentación ni cambios funcionales de riesgo bajo. Los cambios exclusivamente documentales no se despliegan. Todo cambio importante de pantalla o funcionalidad debe permanecer en Preview hasta que el usuario lo valide y autorice expresamente el paso a Production. La misma regla se aplica a fórmula, autenticación, persistencia, concurrencia, numeración, backups, dependencias o configuración. Si GitHub, el push o Vercel requieren permisos, autenticación, autorización o configuración, detenerse y pedirlos al usuario; nunca reemplazar ese paso con un despliegue directo desde local.

Production se construye con variables de Production; no se promueve un artefacto que contiene variables del store de pruebas. No hacer deploy si los tests oficiales fallan. `STITCH/`, `mockapp-v2/`, `LOGOS/`, secretos, backups y resultados de pruebas están excluidos del despliegue. `public/brand/`, `public/profiles/` y fuentes instaladas son los assets de runtime.

Indicar `--target=preview` explícitamente: la CLI puede clasificar el primer despliegue de un proyecto nuevo como Production. Las funciones se ejecutan en `gru1`; la región de la máquina de build puede ser diferente.

El PDF necesita los módulos CommonJS de las fuentes estándar de PDFKit. `outputFileTracingIncludes` los incluye explícitamente porque el trazador automático solo detectaba la variante ESM. `npm run test:bundle`, incluido al final de `verify`, copia exclusivamente los archivos del trace a un directorio temporal y genera un PDF A4 con Helvetica normal/negrita; así detecta archivos faltantes antes de desplegar.

Preview puede tener protección adicional de Vercel. Para pruebas automatizadas usar una credencial de bypass de automatización, sin desactivar la protección. Este bypass no reemplaza el login de la aplicación.

Antes de una validación funcional, seguir el [preflight de entorno](release-workflow.md#preflight-obligatorio-de-entorno): comprobar sesión Vercel y que ambos stores Blob estén **Active**. Si un store está suspendido, las lecturas privadas responderán `403 Forbidden` aunque el proyecto, token y código sean correctos. Reactivarlo desde Vercel antes de reintentar; no desplegar ni cambiar la aplicación para sortear ese estado.

## Recuperación y continuidad

Exportar regularmente usando el token correcto y guardar el archivo en almacenamiento privado. Probar restauración en un store separado, nunca encima de datos reales durante pruebas. `--overwrite` restaura el catálogo con ETag; cotizaciones diferentes preexistentes siempre bloquean. Los archivos idénticos se omiten para permitir reintentos. Los backups no son atómicos entre todos los documentos: preferir baja actividad.

Además, cada sobrescritura real de vidrios, aluminio o catálogos base conserva automáticamente el estado anterior en `data/history/v1/catalogs/`. Se puede listar con `scripts/catalog-history.ts list` y restaurar una entrada concreta con `scripts/catalog-history.ts restore ... --confirm`, únicamente después de aprobación explícita para el ambiente. La restauración captura primero el estado activo actual; no existe limpieza automática del historial.

Si Blob falla, la UI informa que no pudo cargar/guardar y permite reintentar. Ante timeout después de confirmar, conservar el borrador y volver a intentar recupera la confirmación por ID de solicitud. El histórico también permite encontrar la cotización ya confirmada.

## Resultados

Verificación final: 18 de septiembre de 2026. Código de aplicación: commit `33619e0`.

- Proyecto: https://vercel.com/rodrigor4mirezs-projects/vidrieria-araujo
- Preview validado: https://vidrieria-araujo-foorcv3uq-rodrigor4mirezs-projects.vercel.app
- Production: https://vidrieria-araujo.vercel.app
- Release Production validado: `dpl_5XgJ1NFriyWfLhrz5vYrD2tbummx`, generado desde `main` después de pasar los E2E de Preview.

| Comprobación | Resultado |
|---|---|
| npm ci | Correcto; auditoría sin vulnerabilidades |
| Lint | Correcto, sin errores ni warnings de ESLint |
| Typecheck | Correcto |
| Vitest: unitarias e integración | 62/62 |
| Fórmula oficial | Subtotales S/ 62.24 y S/ 208.08; totales S/ 62.30 y S/ 208.10 |
| Build local y Vercel | Correctos |
| PDF con paquete aislado | Correcto; fuentes normal/negrita incluidas |
| E2E local con Blob real | 2/2 |
| E2E Preview en Vercel | 3/3; incluye nombre obligatorio, búsqueda por cliente, PDF, ambos vouchers, impresión, clipboard y segundo navegador |
| Concurrencia real Blob | Tres confirmaciones simultáneas con números distintos; reintento concurrente conserva un único número |
| Backup real | Exportación e importación idempotente correctas, sin sobrescribir históricos |
| Production | Login, logout, cookie Secure/HttpOnly/Lax y autorización servidor correctos; sin errores JavaScript |
| Separación de entornos | Production con catálogos e histórico vacíos; datos E2E solo en Preview |

Las credenciales iniciales están en `backups/acceso-inicial.txt`, con permisos 600 y excluidas de Git/despliegue. También están ignorados los backups reales, reportes y trazas de Playwright. El envío efectivo por WhatsApp y la prueba con una impresora física dependen del operador y su equipo; se verificaron el enlace, texto, PDF A4 y estilos de impresión 80 mm/A4.
