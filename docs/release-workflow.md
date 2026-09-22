# Entrega de cambios de código

Este es el único procedimiento de release. El código fluye **Local → GitHub → Vercel** mediante la integración Git; no usar `vercel deploy`, `vercel --prod` ni promover un build de Preview a Production. Preview y Production usan stores Blob distintos.

Para operaciones sobre datos Blob, consultar [data-migration-runbook.md](data-migration-runbook.md); aprobar código no autoriza cargar ni restaurar datos.

## 1. Preparar la tarea

```sh
git status --short --branch
nvm use
node --version
```

Confirmar Node `v24.x`, rama correcta y archivos ajenos antes de editar. La preparación persistente del usuario está en [environments.md](environments.md). Leer las reglas aplicables indicadas en `AGENTS.md`.

| Cambio | Verificación | Destino |
|---|---|---|
| Solo documentación | Revisar enlaces, `git diff --check` y commit | Sin despliegue deliberado |
| Funcional de riesgo bajo | Prueba focalizada, lint/tipos si aplica | Push seguro a `main`; Vercel genera Production |
| Pantalla o flujo importante | Pruebas afectadas y Preview `Ready` | Esperar aprobación explícita antes de Production |
| Fórmula, autenticación, Blob, backups, esquema, dependencias o configuración | Pruebas críticas, `npm run verify`, E2E pertinente y Preview `Ready` | Esperar aprobación explícita antes de Production |

No repetir pruebas ya válidas sobre el mismo código. Nunca ejecutar E2E que escriba datos contra Production.

Para un cambio que requiere Preview, crear una rama desde `main` actualizado:

```sh
git fetch origin main --prune
git switch main
git merge --ff-only origin/main
git switch -c <rama-de-la-tarea>
```

Si existe trabajo rastreado ajeno, resolverlo sin sobrescribirlo. Mantener fuera del commit los archivos sin seguimiento no relacionados.

## 2. Confirmar y publicar

Revisar el diff y preparar solo archivos de la tarea:

```sh
git diff --check
git diff --stat
git add -- <archivos-de-la-tarea>
git commit -m "<descripción breve>"
```

Antes de cualquier push, ejecutar `git fetch origin main --prune` y comprobar que `origin/main` es ancestro del historial que se publicará. Si hay divergencia, detenerse y revisarla; nunca usar force push, reset ni rebase destructivo.

Para Preview, publicar la rama con `git push -u origin <rama-de-la-tarea>`. Verificar que el estado de Vercel corresponda al commit, proyecto `vidrieria-araujo`, target Preview y `Ready`; usar `vercel inspect <deployment-url>`, el status del commit o el dashboard. Probar los flujos afectados solo con el store Preview.

Con Preview listo, entregar la URL, resumir los cambios verificados y preguntar: **“¿Apruebas que continúe y pase a Producción?”**. El silencio no es aprobación. Mantener la rama sin integrar mientras se espera respuesta.

## 3. Production tras aprobación

```sh
git fetch origin main --prune
git switch main
git merge --ff-only <rama-de-la-tarea>
git merge-base --is-ancestor origin/main main
git push origin main
```

Si `main` diverge, detenerse antes del push. Esperar el deployment Git en `Ready` y comprobar commit, rama `main`, target Production y alias `https://distribuidora-araujo.vercel.app`. No escribir datos de prueba en Production.

Para un cambio de riesgo bajo aprobado por este flujo, el push seguro a `main` reemplaza los pasos de rama/Preview. Los cambios documentales se confirman en Git sin tests, build ni despliegue deliberado.

## 4. Preflight de servicios y cierre

Cuando la tarea usa Vercel o Blob, comprobar `vercel --version`, `vercel whoami`, equipo `rodrigor4mirezs-projects` y estado activo del store pertinente desde Vercel. Un `401`/`403` requiere corregir sesión, permisos o estado del store; no cambiar el código para sortearlo.

Registrar al cerrar: commit, rama, verificaciones, URL y estado de Preview/Production, cualquier operación de datos separada, y `git status --short`. Si la tarea está esperando aprobación de Preview, informar ese estado con claridad.
