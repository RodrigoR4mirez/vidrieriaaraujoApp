# Ambientes y credenciales operativas

Este documento evita mezclar Preview, Development y Production. Los valores secretos nunca se escriben aquí.

## Mapa de ambientes

| Ambiente | Archivo local privado | Store Blob | Uso permitido |
|---|---|---|---|
| Development | `.env.local` | Store de desarrollo/Preview | Desarrollo local y pruebas controladas |
| Preview | `.env.catalogos-preview.local` | `vidrieria-araujo-preview` | Validación antes de aprobación |
| Production | `.env.catalogos-production.local` | `vidrieria-araujo-production` | Datos reales |

Los IDs y la región de los stores están en [deployment.md](deployment.md). No copiar tokens ni valores de variables al repositorio, al chat o a reportes.

## Variables necesarias

Cada ambiente debe tener sus propios valores para:

```text
APP_USER
APP_PASSWORD_HASH
SESSION_SECRET
BLOB_READ_WRITE_TOKEN
```

El token Blob de Preview no sirve para Production y viceversa. OIDC no reemplaza `BLOB_READ_WRITE_TOKEN` para las operaciones del store.

Para comprobar que un archivo local tiene token sin imprimirlo:

```sh
node --env-file=.env.catalogos-preview.local -e 'if (!process.env.BLOB_READ_WRITE_TOKEN) process.exit(1); console.log("Token de Preview disponible")'
node --env-file=.env.catalogos-production.local -e 'if (!process.env.BLOB_READ_WRITE_TOKEN) process.exit(1); console.log("Token de Production disponible")'
```

No ejecutar una operación de Production si el archivo, token, sesión o equipo de Vercel no están confirmados.

## Comandos correctos para Blob

Preview:

```sh
node --env-file=.env.catalogos-preview.local --import tsx scripts/backup.ts export
node --env-file=.env.catalogos-preview.local --import tsx scripts/backup.ts import backups/archivo.json --overwrite
```

Production:

```sh
node --env-file=.env.catalogos-production.local --import tsx scripts/backup.ts export
node --env-file=.env.catalogos-production.local --import tsx scripts/backup.ts import backups/archivo.json --overwrite
```

No usar `.env.local` por costumbre cuando el objetivo sea Production. El nombre del archivo debe aparecer explícitamente en el comando.

## Diagnóstico de errores

| Síntoma | Interpretación | Acción |
|---|---|---|
| Falta `BLOB_READ_WRITE_TOKEN` | Archivo de ambiente incorrecto o incompleto | Detenerse y corregir el archivo privado |
| `401 Unauthorized` | Token inválido, vencido o de otro ambiente | Verificar store y regenerar/configurar el token |
| `403 Forbidden` | Store suspendido, cuenta sin acceso o equipo incorrecto | Revisar facturación, permisos y equipo en Vercel; no cambiar código |
| Equipo de Vercel vacío | Sesión o autorización no disponible | Pedir login/autorización; no desplegar directamente |
| Datos esperados no aparecen | Se consultó otro store o se sirvió una lectura obsoleta | Confirmar ambiente, token y recargar sin cache |

Un error de permisos no se resuelve cambiando la aplicación, cambiando el pathname ni usando un deploy local.
