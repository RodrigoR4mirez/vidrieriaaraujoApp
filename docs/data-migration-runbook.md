# Runbook de migraciones y cargas de datos

Se usa para catálogos, cargas desde Excel y restauraciones de Blob. La persistencia del MVP está en Vercel Blob Private.

## Regla de allowlist

Antes de escribir, definir los pathnames autorizados por la tarea.

Para una carga únicamente de vidrios, la allowlist es exactamente:

```text
data/v1/catalog.json
```

Eso reemplaza los valores base y productos de vidrio activos. No se modifican:

```text
data/v1/aluminum-catalog.json
data/v1/quotations/*
```

El respaldo anterior puede conservar los datos antiguos para recuperación, pero no forman parte del catálogo activo después de una sustitución correcta.

## Carga desde Excel

Ejecutar desde la raíz del repositorio. El primer comando es de solo lectura:

```sh
node --import tsx scripts/import-catalogos.ts --glass-only
```

Revisar antes de generar el payload:

- cantidad de vidrios;
- familias y colores;
- espesores y diseños catedral;
- nombres y detalles;
- precios por pie²;
- precios por plancha;
- dimensiones de plancha;
- códigos únicos;
- casos sin espesor o sin precio.

Para generar el respaldo importable de solo vidrios:

```sh
node --import tsx scripts/import-catalogos.ts --glass-only --glass-backup
```

El archivo generado es `backups/catalogo-vidrios-importacion.json` y contiene únicamente `data/v1/catalog.json`. Los respaldos están ignorados por Git y no deben agregarse al commit.

Si la tarea también necesita actualizar el manifiesto rastreado del proyecto, usar `--glass-only --write` después de revisar el dry-run. No usar `--write` para una simple carga de Production si no se desea cambiar archivos versionados.

## Antes de escribir en Preview o Production

1. Confirmar que el despliegue del código correspondiente terminó en `Ready`.
2. Confirmar el archivo de ambiente explícito.
3. Exportar el respaldo del ambiente objetivo:

```sh
node --env-file=.env.catalogos-preview.local --import tsx scripts/backup.ts export
```

o:

```sh
node --env-file=.env.catalogos-production.local --import tsx scripts/backup.ts export
```

4. Anotar el nombre exacto del respaldo creado.
5. Revisar que el payload pase la validación de esquema y códigos.

Para Production, la aprobación del usuario debe existir antes de este punto si la tarea requiere Preview.

## Importación controlada

Preview:

```sh
node --env-file=.env.catalogos-preview.local --import tsx scripts/backup.ts import backups/catalogo-vidrios-importacion.json --overwrite
```

Production:

```sh
node --env-file=.env.catalogos-production.local --import tsx scripts/backup.ts import backups/catalogo-vidrios-importacion.json --overwrite
```

El resultado esperado para una carga de vidrios es:

```text
Restauración terminada: 1 archivos escritos.
```

Si aparece un número diferente, detenerse y revisar el payload antes de continuar.

La importación valida referencias, códigos duplicados, IDs duplicados y rutas permitidas. Las cotizaciones confirmadas nunca se sobrescriben.

## Verificación posterior

Exportar inmediatamente el ambiente objetivo otra vez:

```sh
node --env-file=.env.catalogos-production.local --import tsx scripts/backup.ts export
```

Comprobar sin imprimir contenido sensible:

- `data/v1/catalog.json` tiene las cantidades esperadas;
- los códigos son únicos;
- los precios y medidas esperados están presentes;
- el catálogo antiguo ya no aparece en el archivo activo;
- `data/v1/aluminum-catalog.json` es igual al respaldo inmediatamente anterior;
- los pathnames `data/v1/quotations/*` son iguales al respaldo anterior;
- no se escribieron archivos fuera de la allowlist.

Para una carga únicamente de vidrios, la comparación de archivos no relacionados debe resultar sin cambios.

## Rollback

Si el catálogo nuevo es incorrecto, localizar el respaldo correcto y restaurarlo contra el mismo ambiente:

```sh
node --env-file=.env.catalogos-production.local --import tsx scripts/backup.ts import backups/araujo-<timestamp>.json --overwrite
```

Si se quiere revertir únicamente vidrios, usar un respaldo que contenga solamente `data/v1/catalog.json`. No importar un respaldo completo para una reversión parcial sin revisar todos sus entries.

Después del rollback, exportar nuevamente y verificar los mismos invariantes. No borrar respaldos hasta confirmar la recuperación.

## Concurrencia y límites

El backup no es un snapshot transaccional de todos los blobs. Exportar durante baja actividad. Las escrituras usan ETag y pueden fallar por conflicto; ante un conflicto se debe recargar el respaldo actual y no sobrescribir a ciegas.
