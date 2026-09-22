# Cargas y restauraciones de catálogos

Usar este procedimiento **solo** ante una solicitud concreta. Una carga Blob cambia datos sin crear commit ni deployment; registrar el commit de código compatible. Desplegar primero el código si el payload exige un esquema nuevo.

## Alcance y autorización

| Solicitud | Única ruta activa permitida |
|---|---|
| Vidrios y sus bases (familias, colores, espesores, diseños) | `data/v1/catalog.json` |
| Perfiles de aluminio y sus bases (familias, colores) | `data/v1/aluminum-catalog.json` |

Las cotizaciones `data/v1/quotations/*.json` son inmutables y quedan fuera de restauraciones de catálogos. Los catálogos base no son archivos independientes.

Antes de **cualquier escritura** en Preview o Production se necesita una solicitud explícita que identifique: ambiente, operación (`cargar` o `restaurar`), alcance exacto y fuente/payload o entrada de historial. Aprobar un deploy no autoriza escribir datos; una aprobación anterior tampoco se reutiliza. Para Production, confirmar que el código compatible esté `Ready`. Si falta una decisión sobre rutas o fuente, detenerse.

## Fuentes y preflight

Los Excel originales son archivos **locales ignorados por Git**, no están disponibles en Vercel:

```text
catalogos-fisicos/catalogo de vidrios.xlsx
catalogos-fisicos/catalogo de perfiles de aluminio.xlsx
```

`data/catalogos-importacion.json` es un payload versionado generado a partir de los Excel; no cambia al editar productos desde la web. `INFORME-VOLCADO.md` es el informe de esa generación. Un payload de dos rutas no se importa para una solicitud de una sola ruta: preparar y validar un payload con la allowlist exacta.

Antes de ejecutar scripts:

```sh
nvm use
node --version
git status --short --branch
```

Exigir Node `v24.x`; confirmar el archivo de ambiente de [environments.md](environments.md), el token sin imprimirlo, el store correcto y su estado activo. Nunca usar `.env.local` por costumbre para Production.

Para vidrios, el importador permite revisar sin escribir Blob:

```sh
node --import tsx scripts/import-catalogos.ts --glass-only
node --import tsx scripts/import-catalogos.ts --glass-only --glass-backup
```

El segundo comando genera `backups/catalogo-vidrios-importacion.json` con solo `data/v1/catalog.json`. Revisar conteos, referencias, nombres, códigos, precios por pie²/plancha y medidas antes de usarlo. Para aluminio, preparar el payload validado de `data/v1/aluminum-catalog.json`; no inferir autorización por una carga de vidrios.

Para aluminio, la hoja `Hoja1` usa `COD`, `DESCRIPCION`, `mate` y `negro`. Las imágenes se asignan según la fila del Excel y se guardan por código en `public/profiles/<CÓDIGO>.<extensión>`. No recrear `image*.png`, no usar renombrados Git como mapeo ni inventar imágenes para perfiles sin origen. La referencia validada generó 154 perfiles (21 familias, 2 colores, 134 con imagen y 20 sin ella); esos conteos son del payload documentado, no una garantía del estado activo. Las dos variantes físicas `5220` se guardan como `5220-MATE` y `5220-NEGRO`.

## Ejecución

1. Confirmar aprobación, ambiente, allowlist, payload y commit compatible.
2. Exportar el estado del **ambiente objetivo inmediatamente antes** de escribir:

   ```sh
   npm run backup:export:preview
   npm run backup:export:production
   ```

   Ejecutar solo el comando del ambiente aprobado y anotar el archivo creado en `backups/`. Los backups reales están ignorados por Git.
3. Importar únicamente el payload aprobado:

   ```sh
   node --env-file=.env.catalogos-preview.local --import tsx scripts/backup.ts import backups/<payload>.json --overwrite
   node --env-file=.env.catalogos-production.local --import tsx scripts/backup.ts import backups/<payload>.json --overwrite
   ```

   Ejecutar solo la línea del ambiente aprobado. `--overwrite` habilita reemplazar las rutas incluidas en el payload; no amplía la allowlist ni permite sobrescribir cotizaciones.
4. Exportar de nuevo el mismo ambiente. Comprobar rutas escritas, conteos, códigos únicos, referencias, precios/medidas/nombres representativos e igualdad de rutas fuera de la allowlist. Para vidrios solamente, se espera **un archivo escrito**; si el resultado difiere, detenerse.

El backup previo es obligatorio por defecto. Solo puede omitirse si el usuario autoriza **expresamente esa excepción para la operación concreta**; registrar que no existe ese punto de retorno. El historial automático puede ayudar si el código que lo implementa ya está desplegado, pero no sustituye el backup exportado ni garantiza una restauración completa. Las operaciones multiarchivo no son atómicas: hacerlas con baja actividad y detenerse ante conflictos ETag o escrituras parciales.

## Historial y rollback

Cuando está desplegado el código de historial, cada sobrescritura real de un catálogo existente guarda su versión anterior en `data/history/v1/catalogs/glass/` o `.../aluminum/`. La primera creación no tiene estado anterior que guardar. El historial no aparece en el catálogo activo ni en el export de `data/v1/`; no se borra automáticamente. Las cotizaciones siguen inmutables.

Consultar entradas del ambiente elegido:

```sh
node --env-file=.env.catalogos-preview.local --import tsx scripts/catalog-history.ts list
node --env-file=.env.catalogos-production.local --import tsx scripts/catalog-history.ts list
```

Restaurar una entrada exacta requiere nueva aprobación explícita del ambiente y alcance, y el flag `--confirm`:

```sh
node --env-file=.env.catalogos-preview.local --import tsx scripts/catalog-history.ts restore <pathname-listado> --confirm
node --env-file=.env.catalogos-production.local --import tsx scripts/catalog-history.ts restore <pathname-listado> --confirm
```

Ejecutar solo la línea autorizada. La restauración captura primero el estado activo actual si existe, luego escribe la versión elegida con ETag. Exportar y verificar otra vez. Para restaurar desde un backup completo, preparar un payload **solo con la ruta autorizada**; no importar un respaldo con cotizaciones para revertir un catálogo.

## Registro de cierre

Guardar sin secretos: fecha, solicitud/aprobación, ambiente, operación, rutas, fuente y commit compatible; backup anterior o excepción autorizada; pathnames de historial si aplican; archivos escritos; conteos y comparación antes/después; exportación posterior; resultado de verificación y rollback realizado o pendiente. Distinguir claramente el cambio de datos del deployment de código.
