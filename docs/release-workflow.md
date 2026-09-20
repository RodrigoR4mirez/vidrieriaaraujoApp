# Flujo de entrega y despliegue por sesión

Este documento define cómo debe cerrar una sesión de trabajo en **Distribuidora Araujo**. Su objetivo es que el código, Git y Vercel queden sincronizados sin ejecutar pruebas o despliegues innecesarios para un MVP.

## Resultado esperado

Una modificación funcional se considera terminada cuando:

1. el cambio solicitado está completo;
2. pasó la comprobación mínima proporcional a su riesgo;
3. existe un commit descriptivo;
4. el commit quedó integrado en `main`;
5. `main` quedó publicado en `origin`;
6. Vercel terminó el despliegue correspondiente con estado `Ready`;
7. se reportaron commit, URL, estado del despliegue y `git status`.

Los cambios exclusivamente documentales se confirman en Git, pero no ejecutan tests, build ni despliegue.

## Rama y commits

Antes de modificar:

```sh
git status --short --branch
git branch --show-current
```

- Si la sesión ya está en `main`, se trabaja y se confirma directamente allí. No existe un paso de merge adicional.
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

## Cuándo usar Preview

Preview no es obligatorio para todo cambio.

| Riesgo | Ejemplos | Verificación y destino |
|---|---|---|
| Documentación | README, instrucciones, documentos | Revisar diff y commit. Sin deploy. |
| Bajo | Texto, CSS aislado, alineación, etiqueta, cambio visual pequeño | Comprobación focalizada y Production directa. |
| Medio | Componentes interactivos, navegación, PDF/ticket, formulario sin cambio de negocio | Prueba focalizada. Usar Preview si la revisión visual o el flujo no puede comprobarse localmente con confianza. |
| Alto | Fórmula, autenticación, sesión, Blob, concurrencia, numeración, backups, esquema persistido, dependencias o configuración Vercel | Preview obligatorio, pruebas críticas afectadas y luego Production. |

Nunca desplegar si falla una comprobación crítica o si el cambio está incompleto.

## Verificación proporcional

Se reutilizan resultados válidos del mismo código y se evita repetir baterías sin motivo.

- Cambio visual pequeño: inspección del diff y revisión del flujo afectado.
- Cambio TypeScript localizado: typecheck y prueba focalizada cuando aporte cobertura real.
- Fórmula: tests oficiales obligatorios.
- Persistencia, autenticación o confirmación: tests críticos del flujo afectado.
- Cambio transversal: lint, typecheck, tests y build según `AGENTS.md`.

Las pruebas mutables nunca se ejecutan contra Production.

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

Después de confirmar e integrar el cambio en `main`, publicar directamente:

```sh
vercel --prod --yes --scope rodrigor4mirezs-projects
```

### Cambio que requiere Preview

```sh
vercel deploy --target=preview --yes --scope rodrigor4mirezs-projects
# Validar únicamente los flujos afectados con datos de Preview.
vercel deploy --prod --yes --scope rodrigor4mirezs-projects
```

Preview y Production usan stores Blob distintos. Por eso Production realiza su propio build con variables de Production; no se promueve directamente un artefacto construido con variables de Preview.

Si la integración Git de Vercel ya inició un despliegue al hacer `git push origin main`, no ejecutar además `vercel --prod`: se inspecciona ese despliegue para evitar dos builds iguales. La CLI es el mecanismo directo cuando el despliegue Git no se inició o cuando la sesión ya venía trabajando de esa forma.

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
Production: https://distribuidora-araujo.vercel.app
Vercel: Ready
Git status: limpio
Pendientes: ninguno o bloqueo real
```
