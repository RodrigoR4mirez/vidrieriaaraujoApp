# Runbook operativo de despliegue

Este documento convierte el flujo de entrega de Distribuidora Araujo en pasos repetibles. Se usa junto con [release-workflow.md](release-workflow.md), que define las reglas obligatorias.

## Reglas que nunca se omiten

1. El flujo de código es **Local → GitHub → Vercel**.
2. GitHub es la fuente de verdad del código.
3. Vercel despliega por la integración de GitHub. En este proyecto no se usa `vercel --prod`, `vercel deploy --prod` ni un despliegue directo desde archivos locales.
4. Preview y Production son ambientes separados y usan stores Blob distintos.
5. Un cambio importante requiere Preview `Ready` y aprobación explícita antes de Production.
6. Una mutación de datos en Production requiere respaldo inmediatamente antes de escribir.
7. No se imprimen tokens, hashes, cookies ni contenido completo de respaldos.
8. No se usa `git add .`: el commit debe contener únicamente archivos de la tarea.

## 1. Preflight local

Ejecutar desde la raíz del repositorio:

```sh
pwd
git status --short --branch
git branch --show-current
nvm use
node --version
npm --version
vercel --version
vercel whoami
git diff --check
```

Confirmar antes de continuar:

- la ruta es `vidrieriaaraujoApp`;
- el árbol no tiene cambios rastreados ajenos a la tarea;
- la rama actual es la esperada;
- Node es 24.x, según `.nvmrc` y `package.json`;
- `nvm use` seleccionó Node 24 en la terminal actual;
- la CLI de Vercel responde y `vercel whoami` corresponde al equipo autorizado;
- los archivos sin seguimiento ajenos quedan fuera del commit;
- no existe una divergencia que requiera reescribir historia.

Si hay archivos ajenos sin seguimiento, no borrarlos ni agregarlos. Revisarlos y continuar usando `git add <archivo-especifico>`.

Si se va a leer o escribir Blob, comprobar además que exista el archivo privado de ambiente correspondiente y que contenga `BLOB_READ_WRITE_TOKEN`, sin mostrar su valor.

## 2. Preparar y validar el cambio

Para un cambio importante, crear una rama desde `main` actualizado:

```sh
git fetch origin main --prune
git switch main
git merge --ff-only origin/main
git switch -c <rama-de-la-tarea>
```

Ejecutar la comprobación proporcional. Para cambios funcionales transversales:

```sh
npm ci
npm run verify
```

Para cambios exclusivamente documentales no ejecutar tests, build ni despliegue; revisar el diff y usar únicamente:

```sh
git diff --check
```

Antes de confirmar:

```sh
git status --short
git diff --stat
```

Agregar solo los archivos intencionales:

```sh
git add docs/archivo-que-corresponda.md
git commit -m "docs: documentar flujo operativo de despliegue"
```

## 3. Preview

Publicar la rama en GitHub:

```sh
git push -u origin <rama-de-la-tarea>
```

La integración de GitHub con Vercel debe crear Preview. Esperar hasta que el despliegue termine en `Ready`.

La verificación del estado puede hacerse, en este orden:

1. `vercel inspect <deployment-url>` si la CLI está instalada y autenticada.
2. Status del commit en GitHub, contexto `Vercel`.
3. Dashboard de Vercel, proyecto `vidrieria-araujo`.

Si la CLI o el conector devuelven `401`, `403`, equipo vacío o falta de autorización, detenerse y pedir la autenticación o permiso necesario. No reemplazarlo con un despliegue directo.

Validar en Preview únicamente los flujos afectados. Si el cambio toca Blob, catálogo, cotizaciones, autenticación o persistencia, usar exclusivamente el store de Preview y no crear datos de prueba en Production.

Cuando Preview esté listo, enviar siempre:

```text
Preview listo para revisar
URL: <url-de-preview>
Cambios revisados: <resumen breve>
¿Apruebas que continúe y pase a Producción?
```

Esperar una respuesta afirmativa explícita. El silencio no es aprobación.

## 4. Production después de la aprobación

No ejecutar estos pasos antes de recibir la aprobación.

Integrar sin reescribir historia:

```sh
git fetch origin main --prune
git switch main
git merge --ff-only <rama-de-la-tarea>
git merge-base --is-ancestor origin/main main
git rev-list --left-right --count origin/main...main
git push origin main
```

El resultado de `rev-list` debe mostrar que `origin/main` no tiene commits que falten localmente. Si hay divergencia, detenerse.

Esperar a que Vercel termine el despliegue de Production con estado `Ready`. Confirmar que corresponde a:

- proyecto `vidrieria-araujo`;
- rama `main`;
- target Production;
- alias `https://vidrieria-araujo.vercel.app`.

Solo después de ese estado se pueden ejecutar migraciones o cargas de datos de Production. El código y los datos se despliegan por separado: una carga de Blob no crea commit ni deployment, pero debe registrar el commit compatible que ya está activo.

## 5. Mutaciones de datos de Production

Seguir [data-migration-runbook.md](data-migration-runbook.md). El orden obligatorio es:

```text
Production Ready → respaldo → importación allowlist → exportación de verificación → reporte
```

La ruta permitida depende del alcance autorizado:

- vidrios y sus catálogos base: `data/v1/catalog.json`;
- aluminio y sus catálogos base: `data/v1/aluminum-catalog.json`;
- cotizaciones: nunca forman parte de una restauración de catálogos.

La aprobación para desplegar código no autoriza restaurar datos. Seguir [data-migration-runbook.md](data-migration-runbook.md) y detenerse si no existe una solicitud explícita con ambiente, operación, alcance y archivo fuente. El registro de operación de datos es obligatorio aunque no haya un nuevo deployment.

## 6. Cierre de sesión

Registrar:

```text
Commit: <sha corto>
Rama final: main
Validación: <comandos y resultado>
Preview: <URL o no necesario>
Production: <URL>
Vercel: Ready
Datos: <archivos escritos y conteos verificados>
Backup: <ruta local del respaldo>
Git status: <resultado>
Pendientes: <ninguno o bloqueo real>
```

`git status` puede mostrar archivos sin seguimiento preexistentes. No declararlos como parte de la entrega ni eliminarlos automáticamente.
