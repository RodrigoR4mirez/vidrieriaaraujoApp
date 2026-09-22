# Distribuidora Araujo — Vidriería & Aluminios

Aplicación privada para administrar vidrios, perfiles de aluminio, catálogos base y cotizaciones. Los datos confirmados se comparten entre dispositivos mediante Vercel Blob Private. [Production](https://distribuidora-araujo.vercel.app).

## Inicio local

Preparar Node 24 y Vercel CLI una vez para el usuario según [ambientes](docs/environments.md). En cada terminal del proyecto:

```sh
nvm use
node --version  # debe ser v24.x
npm ci
cp .env.example .env.local
npm run dev
```

Completar las variables privadas de `.env.local` con el store de Development/Preview. Nunca usar credenciales de Production para desarrollo. El hash de contraseña se genera con `npm run auth:hash`; `SESSION_SECRET` necesita al menos 32 caracteres. La autenticación, las lecturas y las escrituras se validan en servidor.

## Uso y comprobación

Desde la web se administran familias, colores, espesores, diseños y productos. Vidrios admiten venta por pie² o plancha; perfiles, por medida en centímetros o barra. Una cotización puede combinar ambos y exige nombre del cliente. Al confirmar, se guarda un snapshot inmutable; PDF, WhatsApp e impresiones usan ese snapshot. No se calcula IGV.

```sh
npm run verify
```

`verify` ejecuta lint, tipos, pruebas, build y comprobación del PDF empaquetado. `npm run test:e2e` se ejecuta solo contra local o Preview con su store de pruebas, nunca contra Production.

## Dónde buscar cada instrucción

| Tarea | Documento |
|---|---|
| Fórmulas y reglas comerciales | [business-rules.md](docs/business-rules.md) |
| Arquitectura, esquema y persistencia | [architecture.md](docs/architecture.md), [data-model.md](docs/data-model.md) |
| Node, credenciales locales y stores | [environments.md](docs/environments.md) |
| Cambios de código y despliegue | [release-workflow.md](docs/release-workflow.md) |
| Importar, respaldar o restaurar catálogos | [data-migration-runbook.md](docs/data-migration-runbook.md) |
| Resultado generado del Excel usado en la carga | [INFORME-VOLCADO.md](INFORME-VOLCADO.md) |

El código se publica mediante GitHub → Vercel. Una carga de datos Blob es una operación separada que requiere autorización para el ambiente y las rutas concretas. Los Excel de `catalogos-fisicos/` y los backups reales son locales e ignorados por Git.
