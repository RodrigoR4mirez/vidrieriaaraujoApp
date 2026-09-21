# Informe de volcado de catálogos

Generado: 2026-09-21T19:59:40.953Z

## Resultado validado

| Catálogo | Total |
|---|---:|
| Familias de perfiles | 21 |
| Colores de perfiles | 2 |
| Perfiles | 154 |
| Familias de vidrios | 7 |
| Colores/acabados de vidrios | 8 |
| Espesores de vidrios | 9 |
| Diseños catedral | 5 |
| Vidrios | 42 |

## Convenciones

- Los códigos físicos de perfiles se normalizan a mayúsculas, sin acentos ni espacios. Ejemplo: `U13` permanece `U13`.
- Los duplicados que representan variantes de color se distinguen con sufijo: `5220-MATE` y `5220-NEGRO`.
- Los vidrios no traen código físico. Se genera `GL-<fila>-<descripción>`, por ejemplo `GL-004-INCOLORO-2MM`.
- Cada imagen de perfil se guarda como `public/profiles/<CÓDIGO>.png` cuando el Excel la ancla a esa fila.
- Las medidas de plancha de vidrios se convierten de metros a centímetros; `1.60 × 2.20` pasa a `160 × 220 cm`.
- Las columnas `PIE` y `PLANCHA` del Excel se conservan como precios por pie² y plancha, respectivamente; una celda vacía se guarda como `0.00`. La falta de espesor se representa como `Sin especificar`, sin inventar un espesor físico.

- Incoloros, Bronce y Gris se agrupan en la familia `Primario` y conservan su color como acabado.

## Casos especiales

- Perfiles sin precio: 8412 (fila 19), 7908 (fila 32), 3188 (fila 72), 4111 (fila 88), 5224 (fila 121), 5568 (fila 143), 2432 (fila 181), 6111 (fila 201), 2253 (fila 204), 5143 (fila 220).
- Vidrios sin precio en ambas modalidades: GL-010-INCOLORO-10MM.
- Vidrios sin medida de plancha: ninguno.
- Perfiles sin imagen anclada: 1164, 5416, 5285, 5142, 2543, 2553, 2410, 2490, 2465, 2432, 2253, 2254, 1630, 1640, 1650, 236, 8449, 5141, 5143, 2105.
- Códigos normalizados: 5220 → 5220-NEGRO (fila 133); 5220 → 5220-MATE (fila 134).
- Duplicados descartados por fila más completa: 5142: fila 127, se conserva fila 219; 8651: fila 129, se conserva fila 128; 8503: fila 148, se conserva fila 149.

## Respaldo, Preview y Producción

- Respaldo de Blob: pendiente antes de importar en un store.
- Preview: pendiente de despliegue e importación en el store de Preview.
- Producción: pendiente de aprobación explícita del usuario después del Preview.
