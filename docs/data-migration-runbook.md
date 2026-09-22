# Runbook de migraciones y cargas de datos

Se usa para catálogos, cargas desde Excel y restauraciones de Blob. La persistencia del MVP está en Vercel Blob Private.

## En una frase

Este runbook explica cómo pasar datos controlados desde un Excel o un respaldo local al ambiente correcto, reemplazar únicamente los archivos autorizados, conservar una copia para rollback y comprobar que lo demás no cambió.

## ¿Para qué sirve?

Sirve para que una migración no dependa de memoria ni de comandos improvisados. Antes de escribir datos responde cuatro preguntas:

1. **Qué se va a cargar:** el payload y sus cantidades, nombres, precios, medidas, códigos y referencias.
2. **Dónde se va a cargar:** Development, Preview o Production, usando el archivo de ambiente correcto.
3. **Qué se va a reemplazar:** únicamente los pathnames autorizados por la tarea.
4. **Cómo se sabrá que salió bien:** resultado de importación, exportación posterior y comparación de archivos no relacionados.

## ¿Qué resuelve?

- Evita cargar Preview por error en Production o usar el token del ambiente equivocado.
- Evita borrar o sobrescribir aluminio y cotizaciones cuando la tarea es únicamente de vidrios.
- Permite reemplazar el catálogo activo completo sin perder el respaldo del estado anterior.
- Detecta códigos duplicados, IDs duplicados, referencias inválidas y rutas no autorizadas antes de escribir.
- Deja un resultado verificable: qué archivo se escribió, cuántos registros quedaron y qué archivos permanecieron iguales.
- Permite volver al estado anterior si el catálogo nuevo tiene un problema.

## ¿Qué hace y qué no hace?

### Sí hace

- valida el esquema y las referencias del payload;
- respalda el ambiente objetivo antes de una mutación;
- reemplaza el blob autorizado cuando se usa `--overwrite`;
- conserva las cotizaciones confirmadas y bloquea cualquier intento de sobrescribirlas;
- permite reintentar archivos idénticos sin duplicarlos;
- verifica el resultado mediante una nueva exportación.

### No hace

- no despliega código en Vercel;
- no decide si el usuario aprobó Production;
- no corrige un token inválido, un store suspendido o permisos faltantes;
- no elimina los respaldos locales ni los datos antiguos guardados en ellos;
- no modifica archivos fuera de la allowlist;
- no convierte un respaldo completo en una restauración parcial de manera automática.

## ¿Qué se debe esperar?

Una migración correcta sigue esta secuencia:

```text
Excel o respaldo local
        ↓
dry-run y validación
        ↓
payload autorizado
        ↓
Preview o Production Ready
        ↓
respaldo del ambiente objetivo
        ↓
importación limitada por allowlist
        ↓
exportación posterior y comparación
        ↓
reporte de resultado
```

Durante el dry-run no se escribe en Blob. Antes de Production debe existir aprobación explícita y el despliegue debe estar en `Ready`. Para una carga únicamente de vidrios, la importación debe reportar un solo archivo escrito: `data/v1/catalog.json`.

Si una validación falla, el proceso debe detenerse antes de escribir. Si falla el acceso al Blob, se corrige el ambiente o el permiso; no se cambia el código ni se intenta otro store como sustituto.

## Resultado esperado de una carga de vidrios

Al terminar correctamente:

- `data/v1/catalog.json` contiene únicamente el catálogo nuevo de vidrios activo;
- las familias, colores, espesores, diseños y productos anteriores ya no forman parte del archivo activo, salvo los elementos que también existan en el payload nuevo;
- precios, medidas, nombres, detalles y códigos corresponden al payload validado;
- `data/v1/aluminum-catalog.json` no cambia;
- `data/v1/quotations/*` no cambia;
- queda un respaldo del estado anterior y otro posterior;
- el resultado queda registrado con commit, ambiente, backup y cantidad de archivos escritos.

El respaldo conserva el estado anterior para recuperación, pero no significa que esos datos sigan visibles en el catálogo activo.

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

Este comando lee el Excel y muestra un resumen; no escribe en GitHub, Vercel ni Blob. Si el resumen no coincide con lo esperado, detenerse aquí.

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

Este archivo local es el payload que se llevará al ambiente elegido. Generarlo no carga nada por sí solo.

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

En este punto deben existir dos archivos conceptualmente distintos:

- el **respaldo del ambiente**, que permite volver al estado que estaba activo antes de la migración;
- el **payload nuevo**, que contiene los datos que se desean activar.

No confundirlos ni intercambiar el archivo de Preview con el de Production.

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

`--overwrite` significa “permitir reemplazar datos diferentes en los pathnames del payload”. No significa “borrar todo Blob”, no elimina respaldos y no autoriza rutas que no estén en el archivo validado. Para el payload de vidrios, solo reemplaza `data/v1/catalog.json`.

Si el payload es inválido, el token no corresponde al ambiente o una cotización estaría siendo sobrescrita, el comando debe fallar y se debe corregir la causa antes de reintentar. No generar un payload alternativo a mano para saltarse la validación.

## Verificación posterior

Exportar inmediatamente el ambiente objetivo otra vez. En Production:

```sh
node --env-file=.env.catalogos-production.local --import tsx scripts/backup.ts export
```

En Preview se usa el archivo de ambiente de Preview:

```sh
node --env-file=.env.catalogos-preview.local --import tsx scripts/backup.ts export
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

La verificación posterior no debe limitarse a que el comando termine sin error: hay que comprobar cantidades y algunos registros representativos del payload. Si los conteos no coinciden, el catálogo anterior no aparece como se esperaba o cambia un archivo fuera de la allowlist, detenerse y usar el rollback después de revisar el respaldo.

## Rollback

Si el catálogo nuevo es incorrecto, localizar el respaldo correcto y restaurarlo contra el mismo ambiente:

```sh
node --env-file=.env.catalogos-production.local --import tsx scripts/backup.ts import backups/araujo-<timestamp>.json --overwrite
```

Si se quiere revertir únicamente vidrios, usar un respaldo que contenga solamente `data/v1/catalog.json`. No importar un respaldo completo para una reversión parcial sin revisar todos sus entries.

Un respaldo completo contiene también aluminio y cotizaciones. Importarlo directamente para revertir solo vidrios podría restaurar más cosas de las autorizadas; por eso primero se debe seleccionar o preparar un respaldo de un solo pathname.

Después del rollback, exportar nuevamente y verificar los mismos invariantes. No borrar respaldos hasta confirmar la recuperación.

## Concurrencia y límites

El backup no es un snapshot transaccional de todos los blobs. Exportar durante baja actividad. Las escrituras usan ETag y pueden fallar por conflicto; ante un conflicto se debe recargar el respaldo actual y no sobrescribir a ciegas.
