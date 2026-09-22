# Checklist de release

Usar una copia de esta lista en cada cambio funcional.

## Antes de trabajar

- [ ] Estoy en la raíz correcta del repositorio.
- [ ] Revisé `git status --short --branch`.
- [ ] Identifiqué archivos ajenos sin seguimiento y no los tocaré.
- [ ] Node es 24.x.
- [ ] Leí las reglas aplicables de `AGENTS.md` y `docs/`.
- [ ] Definí si el cambio requiere Preview.

## Antes del commit

- [ ] Ejecuté la validación proporcional.
- [ ] `git diff --check` no reporta errores.
- [ ] Revisé `git diff --stat`.
- [ ] Agregué únicamente archivos de la tarea.
- [ ] El commit tiene un mensaje descriptivo.

## Preview

- [ ] Publiqué la rama en GitHub.
- [ ] Preview corresponde al commit correcto.
- [ ] Preview terminó en `Ready`.
- [ ] Probé los flujos afectados.
- [ ] Si hubo Blob, usé el store de Preview.
- [ ] Entregué URL, resumen y solicitud de aprobación.
- [ ] Recibí aprobación explícita del usuario.

## Production

- [ ] `git fetch origin main --prune` fue ejecutado.
- [ ] `origin/main` es ancestro de `main`.
- [ ] La integración fue fast-forward.
- [ ] Publiqué `main` con push normal.
- [ ] Production terminó en `Ready`.
- [ ] Confirmé proyecto, rama, target y alias correctos.

## Datos

- [ ] Definí la allowlist de pathnames.
- [ ] Confirmé que existe una solicitud explícita de carga o restauración y su alcance.
- [ ] No confundí aprobación de código con autorización para restaurar datos.
- [ ] Confirmé si la operación cambia solo datos o también código.
- [ ] Confirmé que el commit activo soporta el esquema del payload.
- [ ] Creé respaldo del ambiente objetivo inmediatamente antes de escribir.
- [ ] Confirmé el archivo de ambiente usado.
- [ ] El resultado de importación coincide con la cantidad esperada.
- [ ] Exporté nuevamente después de importar.
- [ ] Confirmé que los archivos fuera de la allowlist no cambiaron.
- [ ] Conservé la ruta del respaldo y el resultado de verificación.
- [ ] Confirmé que cada catálogo sobrescrito generó historial automático en `data/history/v1/catalogs/`.
- [ ] Si restauré historial, usé la entrada exacta, `--confirm` y aprobación explícita del ambiente.
- [ ] Completé el registro de operación de datos, aunque no haya deployment nuevo.

## Cierre

- [ ] Registré commit, rama, validaciones, Preview, Production y backup.
- [ ] Revisé `git status --short`.
- [ ] Reporté cualquier archivo sin seguimiento preexistente sin atribuirlo a la tarea.
- [ ] No quedaron bloqueos reales sin mencionar.
