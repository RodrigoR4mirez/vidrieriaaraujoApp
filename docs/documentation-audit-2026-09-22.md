# Informe de auditoría documental — 22 de septiembre de 2026

## Alcance

Se revisaron los 20 Markdown versionados, dos copias locales con sufijo ` 2`, las referencias entre documentos, los JSON generados de catálogos y las rutas de despliegue. Se conservaron los archivos de negocio y el código de la aplicación; esta limpieza no ejecutó cargas Blob.
Tras la consolidación quedan 10 Markdown de trabajo, incluido este informe.

## Hallazgos y correcciones

| Hallazgo | Resolución |
|---|---|
| `AGENTS.md` exigía leer la especificación inicial y todos los documentos STITCH antes de cada cambio. | Se convirtió en una guía corta que dirige a leer solo la fuente pertinente por tarea. |
| Release, ambientes y backups estaban repartidos en cuatro guías con pasos repetidos. | Quedaron tres fuentes operativas: `release-workflow.md`, `environments.md` y `data-migration-runbook.md`. |
| El dominio `vidrieria-araujo.vercel.app` aparecía como Production, pero respondió 404 `DEPLOYMENT_NOT_FOUND`. | Se documentó `distribuidora-araujo.vercel.app`, que respondió 307 hacia `/cotizador` el 22-09-2026. |
| Las pruebas E2E solo bloqueaban el dominio antiguo, por lo que podían escribir en el Production real. | Se centralizó el bloqueo de ambos dominios en `playwright.config.ts`, antes de iniciar cualquier prueba. |
| La referencia de aluminio decía que `5220` era un perfil consolidado; el JSON vigente tiene `5220-MATE` y `5220-NEGRO`. | Se corrigió el modelo de datos y la guía de importación según el JSON generado. |
| Las reglas de pantalla decían mostrar la merma y después ocultarla. | Se aclaró que se conserva en el snapshot, pero la línea técnica visible no la muestra. |
| Una guía afirmaba que los Excel estaban en el repositorio. | Se aclaró que `catalogos-fisicos/` es local e ignorado por Git y que el JSON generado no refleja ediciones hechas desde la web. |
| La documentación describía el historial automático como si ya existiera en todos los ambientes. | Se condicionó a que el código correspondiente esté desplegado; no recupera modificaciones anteriores. |
| Una terminal no interactiva seguía usando Node 22 pese a que `zsh` interactivo ya usa Node 24. | Se añadió la instrucción de cargar `nvm` explícitamente antes de scripts en esas sesiones. |

## Limpieza realizada

- Se eliminó por completo `STITCH/`: sus Markdown, HTML, capturas y ZIP eran material histórico sin uso en el runtime. También se retiraron `docs/stitch-map.md` y la especificación inicial redundante.
- Se retiraron `docs/deployment-runbook.md`, `docs/deployment.md` y `docs/release-checklist.md`; sus instrucciones vigentes se concentraron en los tres documentos operativos.
- Se retiraron la auditoría antigua y `docs/reference-assets.md`. La trazabilidad vigente del Excel quedó en el runbook, el modelo de datos y `INFORME-VOLCADO.md`.
- Se eliminaron dos copias locales obsoletas: `INFORME-VOLCADO 2.md` (contenía cifras y códigos antiguos) y `docs/validation-audit-2026-09-21 2.md` (duplicado exacto).
- Se eliminaron físicamente 74 PNG con sufijo ` 2` y `src/components/profile-image-picker 2.tsx`: cada PNG era idéntico byte a byte a su imagen canónica y el componente era idéntico al archivo sin sufijo.
- Se quitó un patrón `.env*` duplicado en `.gitignore` que anulaba la excepción de `.env.example`.

Los documentos versionados eliminados son recuperables desde el historial de Git. Las copias locales ` 2` no estaban versionadas.

## Clonación reproducible

- El runtime necesita `src/`, `package.json`, `package-lock.json`, `.nvmrc`, `.env.example`, `public/brand/logo.png`, los JSON de referencia y `public/profiles/`. Todos están versionados.
- El seed de aluminio tiene 154 perfiles: 134 referencian imagen y las 134 imágenes canónicas están versionadas; 20 no tienen imagen en el Excel. Se excluyen las 74 copias locales con sufijo ` 2` porque cada una ya tiene su original por código.
- Los Excel, secretos, `.vercel/`, backups y el contenido activo de Vercel Blob no se versionan. Tras clonar, se sigue `README.md`: Node 24, `npm ci`, copiar `.env.example` a `.env.local` y configurar credenciales del ambiente correcto.
- STITCH no era dependencia runtime y se eliminó del árbol actual. Un clon normal seguirá conservando sus objetos históricos hasta que se haga, si alguna vez se solicita, una reescritura total del historial; esa operación no se realizó.

## Estructura vigente y comprobación

| Necesidad | Fuente |
|---|---|
| Orientación para nuevas tareas | `AGENTS.md` y el índice de `README.md` |
| Fórmulas y reglas comerciales | `docs/business-rules.md` |
| Arquitectura y esquema | `docs/architecture.md`, `docs/data-model.md` |
| Ambiente y release | `docs/environments.md`, `docs/release-workflow.md` |
| Cargas, backup e historial | `docs/data-migration-runbook.md` |
| Resultado de una generación concreta desde Excel | `INFORME-VOLCADO.md` |

Se mantuvo `business-rules.md` con ejemplos y casos límite porque define la fórmula oficial; `AGENTS.md` ahora lo manda leer solo en tareas comerciales o de cotización.

Se comprobaron los enlaces Markdown restantes, `git diff --check`, las cifras del JSON generado (42 vidrios, 154 perfiles) y el alias HTTP de Production. La protección E2E se comprobó con `playwright test --list` para local y un rechazo esperado para Production; TypeScript y ESLint focalizados pasaron. No se ejecutaron tests funcionales ni build.

El historial automático de catálogos sigue en la rama `auto-catalog-history` y requiere la aprobación pendiente de Preview antes de integrarlo en Production. La limpieza documental no constituye autorización para esa publicación ni para restaurar datos.
