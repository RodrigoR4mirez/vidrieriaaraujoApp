# Informe de volcado de catálogos

Generado: 2026-09-21T18:32:31.760Z

## Resultado validado

| Catálogo | Total |
|---|---:|
| Familias de perfiles | 21 |
| Colores de perfiles | 2 |
| Perfiles | 154 |
| Familias de vidrios | 9 |
| Colores/acabados de vidrios | 8 |
| Espesores de vidrios | 9 |
| Diseños catedral | 8 |
| Vidrios | 46 |

## Convenciones

- Los códigos físicos de perfiles se normalizan a mayúsculas, sin acentos ni espacios. Ejemplo: `U13` permanece `U13`.
- Los duplicados que representan variantes de color se distinguen con sufijo: `5220-MATE` y `5220-NEGRO`.
- Los vidrios no traen código físico. Se genera `GL-<fila>-<descripción>`, por ejemplo `GL-004-INCOLORO-2MM`.
- Cada imagen de perfil se guarda como `public/profiles/<CÓDIGO>.png` cuando el Excel la ancla a esa fila.
- Las medidas de plancha de vidrios se convierten de metros a centímetros; `1.60 × 2.20` pasa a `160 × 220 cm`.
- El Excel de vidrios no contiene precios: ambos precios se cargan como `0.00`. La falta de espesor se representa como `Sin especificar`, sin inventar un espesor físico.

## Casos especiales

- Perfiles sin precio: 8412 (fila 19), 7908 (fila 32), 3188 (fila 72), 4111 (fila 88), 5224 (fila 121), 5568 (fila 143), 2432 (fila 181), 6111 (fila 201), 2253 (fila 204), 5143 (fila 220).
- Vidrios sin precio: 46 (todos; el Excel solo aporta medidas de plancha).
- Vidrios sin medida de plancha: GL-045-CAT-PLUMA, GL-046-CAT-SILECIA.
- Perfiles sin imagen anclada: 1164, 5416, 5285, 5142, 2543, 2553, 2410, 2490, 2465, 2432, 2253, 2254, 1630, 1640, 1650, 236, 8449, 5141, 5143, 2105.
- Códigos normalizados: 5220 → 5220-NEGRO (fila 133); 5220 → 5220-MATE (fila 134).
- Duplicados descartados por fila más completa: 5142: fila 127, se conserva fila 219; 8651: fila 129, se conserva fila 128; 8503: fila 148, se conserva fila 149.

## Respaldo, Preview y Producción

- Respaldo de Blob: pendiente. No se exportó ni importó ningún dato persistente.
- Preview: la rama quedó desplegada y lista para revisar, pero su `BLOB_READ_WRITE_TOKEN` coincide con el de Producción. No se importaron datos para evitar alterar Producción durante una prueba.
- Producción: pendiente de un Blob aislado para Preview y de aprobación explícita del usuario después de validar allí el volcado.
