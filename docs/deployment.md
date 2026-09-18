# Despliegue y operación

Equipo: `rodrigor4mirezs-projects`. Proyecto: `vidrieria-araujo`.

Proyecto creado específicamente para este repositorio; no se modificaron los proyectos preexistentes. Node 24.x y región de funciones `gru1` en `vercel.json`.

## Almacenamiento

| Entorno | Store | ID | Acceso | Región |
|---|---|---|---|---|
| Preview y Development | vidrieria-araujo-preview | store_x9gVwBo680tIrdWK | privado | gru1 |
| Production | vidrieria-araujo-production | store_ZuyDwmjLsc1VGeQN | privado | gru1 |

`BLOB_READ_WRITE_TOKEN` se genera al conectar cada store. La aplicación pasa ese token al SDK desde el servidor. No depende de OIDC para persistir datos. Nunca copiar valores a documentación ni al cliente.

## Variables

| Variable | Uso |
|---|---|
| APP_USER | Usuario compartido |
| APP_PASSWORD_HASH | Hash scrypt generado con `npm run auth:hash` |
| SESSION_SECRET | Secreto aleatorio, mínimo 32 caracteres |
| BLOB_READ_WRITE_TOKEN | Token privado del store correspondiente |

Configurar en los tres entornos; el token Blob difiere entre Production y Preview/Development. Las credenciales iniciales se entregan por archivo local privado, fuera de Git. Cambiar contraseña requiere generar y reemplazar el hash; rotar además SESSION_SECRET para revocar sesiones previas. Después de actualizar variables desplegar nuevamente.

## Procedimiento

```sh
vercel --version
vercel whoami
vercel teams ls
vercel link --project vidrieria-araujo --scope rodrigor4mirezs-projects
vercel env pull .env.local --environment=development
npm ci
npm run verify
npm run test:e2e
vercel deploy --yes --scope rodrigor4mirezs-projects
# Validar el Preview con sus propios datos y dos sesiones de navegador.
vercel deploy --prod --yes --scope rodrigor4mirezs-projects
```

Production se construye con variables de Production; no se promueve un artefacto que contiene variables del store de pruebas. No hacer deploy si los tests oficiales fallan. `STITCH/`, `LOGOS/`, secretos, backups y resultados de pruebas están excluidos del despliegue. `public/brand/` y fuentes instaladas son los assets de runtime.

Preview puede tener protección adicional de Vercel. Para pruebas automatizadas usar una credencial de bypass de automatización, sin desactivar la protección. Este bypass no reemplaza el login de la aplicación.

## Recuperación y continuidad

Exportar regularmente usando el token correcto y guardar el archivo en almacenamiento privado. Probar restauración en un store separado, nunca encima de datos reales durante pruebas. `--overwrite` restaura el catálogo con ETag; proformas diferentes preexistentes siempre bloquean. Los archivos idénticos se omiten para permitir reintentos. Los backups no son atómicos entre todos los documentos: preferir baja actividad.

Si Blob falla, la UI informa que no pudo cargar/guardar y permite reintentar. Ante timeout después de confirmar, conservar el borrador y volver a intentar recupera la confirmación por ID de solicitud. El histórico también permite encontrar la proforma ya confirmada.

## Resultados

Las URLs definitivas y el resumen de verificación se registrarán después de validar Preview y Production.
