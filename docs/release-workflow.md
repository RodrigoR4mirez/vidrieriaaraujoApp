# Flujo de entrega y despliegue por sesión

Este documento define cómo debe cerrar una sesión de trabajo en **Distribuidora Araujo**. GitHub (`origin`) es la fuente de verdad del código versionado y Vercel despliega exclusivamente desde GitHub. El flujo obligatorio es **Local → GitHub → Vercel**; nunca se despliega a Vercel directamente desde archivos locales.

## Resultado esperado

Una modificación funcional se considera terminada cuando:

1. el cambio solicitado está completo;
2. pasó la comprobación mínima proporcional a su riesgo;
3. existe un commit descriptivo;
4. el commit quedó integrado en `main`;
5. `main` quedó publicado en `origin` mediante un push seguro;
6. Vercel detectó ese commit de GitHub y terminó el despliegue correspondiente con estado `Ready`;
7. se reportaron commit, URL, estado del despliegue y `git status`.

Para un cambio importante, el cierre ocurre en dos etapas: primero se entrega un Preview `Ready` y se espera la aprobación explícita del usuario; únicamente después se integra en `main` y se publica en Production. Mientras se espera esa respuesta, el trabajo queda correctamente pausado en Preview, no incompleto.

Los cambios exclusivamente documentales se confirman en Git, pero no ejecutan tests, build ni despliegue.

## Rama, commits y sincronización segura

Antes de modificar:

```sh
git status --short --branch
git branch --show-current
```

- Si la tarea es pequeña y la sesión ya está en `main`, se trabaja y se confirma directamente allí. No existe un paso de merge adicional.
- Si la tarea contiene un cambio importante de pantalla o funcionalidad, se crea una rama de tarea desde `main` antes de modificar. Esa rama no se integra ni se publica en `main` hasta que el usuario apruebe el Preview.
- Si la sesión está en una rama creada para la tarea actual, se valida y confirma allí; después se integra en `main` sin perder cambios.
- Si la rama encontrada pertenece a otro trabajo, no se mezcla. Se cambia a `main` antes de editar.
- Nunca se hace merge con archivos sin confirmar ni se sobrescribe trabajo ajeno.
- Cada commit debe contener únicamente el cambio de la tarea y usar un mensaje breve, por ejemplo `fix: ajustar impresión de vouchers`.

Cuando una rama de la tarea deba integrarse:

```sh
git switch main
git merge --ff-only <rama-de-la-tarea>
```

Si el fast-forward no es posible, revisar la divergencia y resolverla conscientemente; no forzar ni reescribir historia. Después:

```sh
git push origin main
```

Antes de cada `push`, confirmar que el remoto no contiene historia que falte localmente:

```sh
git fetch origin main --prune
git merge-base --is-ancestor origin/main main
git rev-list --left-right --count origin/main...main
```

Solo se permite un push normal si `origin/main` es ancestro de `main`; ese resultado significa que GitHub avanzará sin eliminar, sobrescribir ni reescribir commits. Si existe divergencia, si el push deja de ser fast-forward, o si la autenticación/permisos fallan, detenerse y explicarle al usuario antes de hacer cualquier otra acción. Nunca usar `--force`, `push --force-with-lease`, `reset`, rebase destructivo ni atajos equivalentes.

## Cuándo usar Preview

Preview no es obligatorio para todo cambio.

| Riesgo | Ejemplos | Verificación y destino |
|---|---|---|
| Documentación | README, instrucciones, documentos | Revisar diff y commit. Sin deploy. |
| Bajo | Texto, CSS aislado, alineación, etiqueta, cambio visual pequeño | Comprobación focalizada, push seguro a GitHub `main` y Production generada por la integración Git de Vercel. |
| Medio / importante | Pantallas principales, responsive, componentes interactivos, navegación, PDF/ticket, formularios o cambios visibles que alteran el uso | Push seguro de la rama a GitHub para generar Preview. Entregar URL y esperar aprobación explícita antes de Production. |
| Alto | Fórmula, autenticación, sesión, Blob, concurrencia, numeración, backups, esquema persistido, dependencias o configuración Vercel | Push seguro de la rama a GitHub para generar Preview y pruebas críticas afectadas. Esperar aprobación explícita antes de Production. |

Nunca desplegar si falla una comprobación crítica o si el cambio está incompleto.

## Verificación proporcional

Se reutilizan resultados válidos del mismo código y se evita repetir baterías sin motivo.

- Cambio visual pequeño: inspección del diff y revisión del flujo afectado.
- Cambio TypeScript localizado: typecheck y prueba focalizada cuando aporte cobertura real.
- Fórmula: tests oficiales obligatorios.
- Persistencia, autenticación o confirmación: tests críticos del flujo afectado.
- Cambio transversal: lint, typecheck, tests y build según `AGENTS.md`.

Las pruebas mutables nunca se ejecutan contra Production.

## Preflight obligatorio de entorno

Antes de validar un cambio funcional que consulte o escriba datos, comprobar el entorno una sola vez por sesión. Este paso evita confundir una falla de la aplicación con una credencial, store o configuración local:

```sh
vercel whoami
vercel blob list-stores
```

Confirmar en el resultado que `vidrieria-araujo-preview` y `vidrieria-araujo-production` estén en estado **Active**. Un store suspendido puede listar su configuración pero rechaza lecturas privadas con `403 Forbidden`; en ese caso no se modifica código ni se despliega. El titular debe reactivar o regularizar el plan o la facturación del store desde Vercel y luego se vuelve a intentar la lectura de Preview.

Para E2E local o de Preview, usar solamente las variables privadas del entorno de desarrollo/Preview:

```sh
vercel env pull .env.local --environment=development
# Crear o conservar .env.e2e.local, ignorado por Git:
# E2E_USER=…
# E2E_PASSWORD=…
```

- Tras `vercel env pull`, revisar la línea `APP_PASSWORD_HASH`: en `.env.local` cada signo `$` debe escribirse como `\$`, pues Next.js expande variables dotenv. En Vercel el hash se guarda literal, sin escapes.
- No imprimir, versionar ni copiar variables secretas en reportes. `.env.local` y `.env.e2e.local` permanecen fuera de Git.
- Ejecutar `npm run test:e2e` solo contra `localhost` o una URL Preview. Verificar que `E2E_BASE_URL` no sea la URL de Production antes de empezar: el escenario crea registros `E2E-` en el store de Preview.
- Si falta una sesión de Vercel, permisos, variables o Blob activo, detenerse y pedir al usuario exactamente esa acción. No sustituirlo con un despliegue directo desde local ni con Production.

El preflight no reemplaza la verificación proporcional: E2E completos se usan para cambios de autenticación, Blob, confirmación, catálogo o cotizador; para cambios aislados se ejecuta únicamente la comprobación focalizada aplicable.

## Despliegue en Vercel

Proyecto autorizado:

```text
Equipo: rodrigor4mirezs-projects
Proyecto: vidrieria-araujo
Producción: https://distribuidora-araujo.vercel.app
```

Antes de publicar, confirmar identidad y vínculo:

```sh
vercel --version
vercel whoami
vercel teams ls
```

### Cambio de riesgo bajo sin Preview

Después de confirmar e integrar el cambio en `main`, validar el avance seguro y publicarlo en GitHub:

```sh
git fetch origin main --prune
git merge-base --is-ancestor origin/main main
git push origin main
```

Vercel debe crear Production a partir de ese push. No ejecutar `vercel --prod`, `vercel deploy --prod` ni ningún despliegue desde la carpeta local.

### Cambio que requiere Preview

```sh
git push -u origin <rama-de-la-tarea>
# Vercel crea Preview desde el commit de GitHub. Validar únicamente los flujos afectados.
```

Cuando el Preview esté `Ready`, mostrar siempre la solicitud de aprobación al usuario. Si la interfaz de la sesión ofrece un control de confirmación interactivo, usarlo; de lo contrario, mostrar este mensaje claro en el chat:

```text
Preview listo para revisar
URL: <preview-url>
Cambios revisados: <resumen breve>
¿Apruebas que continúe y pase a Producción?
```

Detenerse y esperar una respuesta afirmativa explícita, por ejemplo: “aprobado”, “continúa” o “pasa a producción”. El silencio, el paso del tiempo o una validación técnica del agente no cuentan como aprobación. Esta solicitud es parte obligatoria de cada cambio importante; no es un popup dentro de la aplicación ni altera la experiencia de sus usuarios.

Solo después de recibir esa aprobación:

```sh
git switch main
git merge --ff-only <rama-de-la-tarea>
git fetch origin main --prune
git merge-base --is-ancestor origin/main main
git push origin main
```

Preview y Production usan stores Blob distintos. Por eso Vercel realiza un build nuevo de Production desde el commit publicado en GitHub `main`, con variables de Production. Si el push no crea el Preview o Production esperado, detenerse y pedir al usuario que autorice/configure la integración GitHub–Vercel; no usar un despliegue directo local como alternativa.

La CLI de Vercel se usa únicamente para inspeccionar estado, logs o configuración. Si para `git fetch`, `git push`, la integración GitHub–Vercel o la inspección de Vercel se necesita autenticación, permisos, autorización o configuración adicional, pedirla explícitamente al usuario antes de continuar. No buscar atajos.

## Validación posterior

Esperar hasta que el despliegue deje de estar `Building`:

```sh
vercel inspect <deployment-url>
```

Confirmar:

- target `production` o `preview`, según corresponda;
- estado `Ready`;
- proyecto `vidrieria-araujo`;
- alias de Production `https://distribuidora-araujo.vercel.app`;
- ausencia de archivos pendientes con `git status --short`.

No se realizan escrituras de prueba en Production. La comprobación posterior debe ser de solo lectura o usar el login y navegación sin crear datos ficticios.

## Bloqueos

Detener el despliegue únicamente si falta autenticación, permisos, variables, vínculo con el proyecto correcto o si una validación crítica falla. Reportar exactamente el comando o la configuración que falta y dónde debe resolverse.

## Reporte final mínimo

```text
Commit: <sha corto>
Rama final: main
Validación: <comprobaciones ejecutadas>
Preview: <URL o “no necesario por riesgo bajo”>
Production: <URL, o “pendiente de aprobación del usuario”>
Vercel: <Preview Ready / Production Ready>
Git status: limpio
Pendientes: ninguno o bloqueo real
```
