# Ambientes y herramientas locales

## Equipo

| Ambiente | Archivo local privado | Blob Private | Uso |
|---|---|---|---|
| Development | `.env.local` | store de desarrollo/Preview | Desarrollo local |
| Preview | `.env.catalogos-preview.local` | `vidrieria-araujo-preview` (`store_x9gVwBo680tIrdWK`) | Validación |
| Production | `.env.catalogos-production.local` | `vidrieria-araujo-production` (`store_ZuyDwmjLsc1VGeQN`) | Datos reales |

Equipo Vercel: `rodrigor4mirezs-projects`; proyecto: `vidrieria-araujo`; funciones y stores en `gru1`. Cada store proporciona su propio `BLOB_READ_WRITE_TOKEN`. Los archivos `.env.*`, credenciales y backups reales no se versionan ni se copian al chat.

Variables de la aplicación: `APP_USER`, `APP_PASSWORD_HASH`, `SESSION_SECRET` y `BLOB_READ_WRITE_TOKEN`. OIDC no reemplaza el token Blob. `npm run auth:hash` genera el hash; el secreto de sesión debe tener al menos 32 caracteres. En archivos dotenv de Next, escapar cada `$` del hash como `\$`; en Vercel guardar el valor literal.

## Node y CLI persistentes en macOS/zsh

`nvm` se carga desde `~/.zshrc`. La preparación de una sola vez para el usuario es instalar Node 24, ejecutar `nvm alias default 24`, instalar Vercel CLI bajo ese Node y hacer `vercel login`. La instalación global de la CLI queda asociada a la versión de Node activa; si se cambia de versión, puede no aparecer hasta volver a Node 24.

En una terminal nueva y **dentro del repositorio**:

```sh
nvm use
node --version
vercel --version
vercel whoami
```

Exigir `v24.x` antes de scripts, builds o mutaciones. Si `nvm` no está disponible, abrir una terminal zsh que cargue `~/.zshrc` o corregir esa configuración. No usar `sudo npm`. La CLI se usa para inspección/configuración; los deployments salen de GitHub, según [release-workflow.md](release-workflow.md).

Una terminal automatizada no interactiva puede arrancar con otro Node aunque la terminal personal use 24. Cargar `~/.nvm/nvm.sh` en esa sesión y repetir `nvm use` antes de ejecutar scripts; no asumir que el alias predeterminado ya se aplicó.

## Operaciones Blob

Seleccionar **un** archivo de ambiente explícito. Antes de escribir, comprobar que tiene token sin mostrarlo:

```sh
node --env-file=.env.catalogos-preview.local -e 'if (!process.env.BLOB_READ_WRITE_TOKEN) process.exit(1); console.log("Token Preview disponible")'
node --env-file=.env.catalogos-production.local -e 'if (!process.env.BLOB_READ_WRITE_TOKEN) process.exit(1); console.log("Token Production disponible")'
```

Ejecutar solo la línea del ambiente elegido; la presencia del token no prueba por sí sola que apunte al store correcto. Verificar equipo, proyecto y store antes de mutar. Para exportar o importar seguir [data-migration-runbook.md](data-migration-runbook.md).

Un `401` indica token/sesión inválida; un `403` puede indicar falta de permisos o store suspendido. Revisar Vercel antes de reintentar. No cambiar rutas ni apuntar a otro ambiente para evitar el error.
