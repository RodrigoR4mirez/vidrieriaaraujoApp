# Instrucciones del proyecto

Aplicación privada de Distribuidora Araujo para catálogos de vidrios y perfiles, cotizaciones y documentos. El código vigente está en `src/`; los assets de producción, en `public/`.

## Qué leer según la tarea

1. Siempre: `git status --short --branch`, los archivos afectados y este documento.
2. Cálculos, precios, cotización o presentación comercial: `docs/business-rules.md`.
3. Persistencia, esquema o concurrencia: `docs/architecture.md` y `docs/data-model.md`.
4. Entrega de código: `docs/release-workflow.md`.
5. Carga, respaldo o restauración de catálogos: `docs/data-migration-runbook.md` y `docs/environments.md`.

Leer el documento aplicable completo antes de cambiar ese ámbito. `README.md` es la entrada para instalación y uso; `INFORME-VOLCADO.md` es un resultado generado de una importación concreta, no una regla permanente.

Si hay contradicción, comunicarla y resolverla usando primero la instrucción explícita del usuario y luego `docs/business-rules.md` para reglas comerciales. El código y los esquemas muestran el comportamiento implementado; no asumir que un documento histórico lo reemplaza.

## Invariantes

- Sin IGV ni impuestos en cálculo, UI, snapshots, PDF, ticket o mensajes. El subtotal es la suma exacta de ítems y el total se redondea una sola vez hacia arriba a un decimal. Los casos oficiales deben dar S/ 62.24 → S/ 62.30 y S/ 208.08 → S/ 208.10.
- La fórmula usa `decimal.js` una sola vez en el dominio. No duplicarla en UI, acciones, repositorios o salidas.
- Vercel Blob Private es la fuente de verdad compartida. Las credenciales y operaciones Blob permanecen en servidor. Los borradores de UI pueden ser temporales por pestaña.
- Vidrios y catálogos base comparten `data/v1/catalog.json`; aluminio y sus bases usan `data/v1/aluminum-catalog.json`. Los códigos son únicos; los registros ocultos siguen editables y no se ofrecen en nuevas cotizaciones.
- Las cotizaciones confirmadas son snapshots inmutables en `data/v1/quotations/`; nunca se sobrescriben. Las escrituras de catálogos usan ETag/`ifMatch` y las lecturas relevantes evitan caché obsoleta. El historial automático de catálogos, cuando el código correspondiente está desplegado, se guarda antes de sobrescribir en `data/history/v1/catalogs/`.
- Las imágenes de perfiles se asignan por el código y la fila del Excel de origen. No inventar imágenes ni reconstruir `image*.png` por semejanza.
- Mantener la separación UI → aplicación → interfaces de repositorio → infraestructura. Validar entradas con Zod, sesión en servidor y TypeScript estricto. No exponer secretos ni registrar contraseñas o tokens.

## Trabajo y verificación

- Usar Node 24 (`.nvmrc`): `nvm use` y comprobar `node --version` antes de ejecutar scripts, tests o builds. Si la terminal no carga `nvm`, resolver el entorno antes de mutar datos. Instalar dependencias con `npm ci`; conservar `package-lock.json`.
- Preservar cambios ajenos y archivos sin seguimiento. Preparar en Git solo archivos de la tarea; no usar `git add .`.
- Verificar proporcionalmente: pruebas afectadas para cambios funcionales; controles críticos de fórmula, autenticación, persistencia o confirmación cuando puedan verse afectados. Antes de un release funcional importante, `npm run verify` y el E2E pertinente. Para cambios solo documentales, revisar diff y enlaces; no ejecutar lint, tests, build ni desplegar.
- Mantener errores de usuario en español y no confiar en cálculos enviados por el navegador.

## Entrega y datos

- Código: Local → GitHub → Vercel mediante integración Git. No desplegar desde archivos locales. Antes de todo push, `git fetch origin main --prune` y comprobar avance seguro; nunca forzar ni reescribir historial.
- Cambios importantes o de fórmula, autenticación, Blob, backups, dependencias o configuración: rama y Preview `Ready`; entregar URL y pedir aprobación explícita antes de integrar en `main` y pasar a Production. Cambios de riesgo bajo siguen `docs/release-workflow.md`. Los cambios documentales se confirman en Git sin despliegue deliberado.
- Cargar o restaurar datos de Preview/Production es una operación independiente del deploy. Exige solicitud explícita con ambiente, operación, rutas y fuente. El respaldo previo es la regla; una excepción requiere autorización expresa y registro de la limitación de rollback. No restaurar automáticamente tras desplegar.
- Nunca versionar `.env.*`, tokens, credenciales, backups reales o `.vercel/`. Los Excel locales de `catalogos-fisicos/` están ignorados por Git; no asumir que Vercel puede leerlos.

La guía operativa detallada está en los runbooks indicados arriba.
