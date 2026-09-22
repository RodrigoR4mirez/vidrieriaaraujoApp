# Migraciones y restauraciones de catálogos

Runbook para cargar o restaurar datos en Vercel Blob Private. No se ejecuta de rutina: solo se usa cuando la tarea lo solicita.

## Alcance y rutas

En la arquitectura actual los catálogos base no son archivos separados:

| Alcance | Contenido | Ruta |
|---|---|---|
| Vidrios | familias, colores, espesores, diseños catedral y productos | `data/v1/catalog.json` |
| Aluminio | familias, colores y perfiles | `data/v1/aluminum-catalog.json` |
| Históricos | cotizaciones confirmadas | `data/v1/quotations/*.json` |

Una operación de vidrios solo puede escribir `data/v1/catalog.json`. Una operación de aluminio solo puede escribir `data/v1/aluminum-catalog.json`. Las cotizaciones nunca se incluyen en una restauración de catálogos.

## Regla de autorización

Ninguna restauración se ejecuta automáticamente después de un deploy, una carga anterior o un cambio de código.

Para escribir en Preview o Production debe existir una solicitud explícita que indique:

- ambiente: `Preview` o `Production`;
- operación: `cargar` o `restaurar`;
- alcance: `vidrios`, `aluminio`, `catálogos base` o combinación exacta;
- archivo fuente o respaldo que se usará.

La aprobación para desplegar código no autoriza restaurar datos. Una aprobación anterior tampoco se reutiliza. Si la solicitud es ambigua, detenerse y pedir el alcance exacto antes de ejecutar `backup:import`, `--overwrite` o cualquier escritura equivalente.

Para Production, además, el despliegue debe estar en `Ready` y debe existir aprobación explícita para la mutación de datos de ese ambiente.

## Fuentes disponibles

Los Excel de referencia están dentro del repositorio:

```text
catalogos-fisicos/catalogo de vidrios.xlsx
catalogos-fisicos/catalogo de perfiles de aluminio.xlsx
```

El Excel de aluminio queda considerado como fuente para una futura carga. Registrar el archivo no significa importarlo. Antes de una carga se debe generar y revisar un payload; nunca se escribe directamente desde el Excel en Production.

## Flujo obligatorio

```text
solicitud explícita
→ revisar fuente o respaldo
→ dry-run y validación
→ confirmar ambiente y allowlist
→ despliegue Ready, si aplica
→ respaldo del ambiente objetivo
→ importación autorizada
→ exportación y verificación posterior
```

Si falla una validación, una credencial, un permiso o la verificación, detenerse. No cambiar el código ni probar otro ambiente como sustituto.

## Carga nueva desde Excel

El dry-run de vidrios es de solo lectura:

```sh
node --import tsx scripts/import-catalogos.ts --glass-only
```

Revisar cantidades, familias, colores, espesores, diseños, nombres, detalles, precios, medidas y códigos. Para generar el payload de vidrios:

```sh
node --import tsx scripts/import-catalogos.ts --glass-only --glass-backup
```

Esto crea el archivo local ignorado por Git:

```text
backups/catalogo-vidrios-importacion.json
```

El payload contiene únicamente `data/v1/catalog.json`; generarlo no escribe en Blob.

La fuente de aluminio es `catalogos-fisicos/catalogo de perfiles de aluminio.xlsx`. Antes de cargarla se debe contar con un payload de aluminio validado y con autorización explícita para `data/v1/aluminum-catalog.json`. No asumir que una carga de vidrios incluye autorización para aluminio.

## Respaldo e importación

Usar siempre el archivo de ambiente que corresponda al destino:

```sh
# Preview
node --env-file=.env.catalogos-preview.local --import tsx scripts/backup.ts export

# Production
node --env-file=.env.catalogos-production.local --import tsx scripts/backup.ts export
```

Anotar el respaldo creado. Es el estado anterior y no debe confundirse con el payload nuevo.

Importar solo después de cumplir la regla de autorización:

```sh
# Preview
node --env-file=.env.catalogos-preview.local --import tsx scripts/backup.ts import backups/<payload-autorizado>.json --overwrite

# Production
node --env-file=.env.catalogos-production.local --import tsx scripts/backup.ts import backups/<payload-autorizado>.json --overwrite
```

`--overwrite` permite reemplazar el contenido de las rutas que contiene el payload. No borra todo Blob, no borra respaldos y no autoriza rutas adicionales. El payload debe contener únicamente la allowlist aprobada.

Para una carga solo de vidrios, el resultado esperado es:

```text
Restauración terminada: 1 archivos escritos.
```

Si se escribe más de un archivo, detenerse y revisar el payload.

## Resultado esperado

Después de una carga o restauración autorizada:

- la ruta autorizada contiene únicamente los datos del payload aplicado;
- precios, medidas, nombres, detalles, códigos y referencias corresponden al payload validado;
- la otra ruta de catálogo no cambia;
- `data/v1/quotations/*` no cambia;
- existe un respaldo anterior y una exportación posterior;
- el resultado registra ambiente, operación, archivo, cantidad escrita y verificación.

Los datos anteriores dejan de estar activos, pero permanecen en el respaldo. Las cotizaciones históricas pueden seguir mostrando snapshots antiguos sin que eso reactive esos productos en el catálogo.

## Verificación posterior

Exportar otra vez usando el mismo ambiente. Confirmar:

1. cantidad esperada de familias, valores y productos/perfiles;
2. códigos únicos y referencias válidas;
3. precios, medidas y nombres representativos;
4. igualdad de las rutas fuera de la allowlist;
5. ausencia de escrituras en cotizaciones.

Si la verificación falla, no repetir la importación a ciegas. Revisar el respaldo y ejecutar rollback solo con autorización explícita.

## Restauración y rollback

Restaurar significa aplicar deliberadamente un respaldo anterior. Requiere la misma autorización explícita y el mismo ambiente indicado arriba.

Un respaldo completo puede contener aluminio, vidrios y cotizaciones. No se importa completo para revertir un solo catálogo sin revisar sus rutas. Para una reversión parcial se debe usar un payload que contenga únicamente la ruta autorizada.

Después de restaurar, exportar nuevamente y repetir la verificación. Conservar los respaldos hasta confirmar que la aplicación funciona correctamente.

## Limitación operativa

El respaldo no es una transacción única de todos los blobs. Ejecutar con baja actividad. Si aparece un conflicto de ETag o cambia el almacenamiento durante la operación, detenerse, volver a exportar el estado actual y revisar antes de reintentar.
