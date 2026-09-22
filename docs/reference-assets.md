# Referencias del módulo de Vidriería

## Ruta local de referencia

`/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/Vidrieria/vidrieriaaraujoApp/mockapp-v2`

Esta carpeta contiene las referencias originales del módulo de perfiles de aluminio:

- Excel vigente de perfiles: `catalogos-fisicos/catalogo de perfiles de aluminio.xlsx`.
- Mockup del cotizador de vidrio: `ChatGPT Image 20 sept 2026, 20_48_24 (1).png`.
- Mockup del cotizador de perfiles y resumen unificado: `ChatGPT Image 20 sept 2026, 20_48_24 (2).png`.
- Mockup del catálogo/mantenimiento de perfiles: `ChatGPT Image 20 sept 2026, 20_48_25 (3).png`.
- Mockup de Catálogos base para perfiles: `ChatGPT Image 20 sept 2026, 20_48_25 (4).png`.

La ruta es solo una fuente local de desarrollo. No se almacena en APIs o datos de negocio, no se usa en runtime y Vercel no depende de ella. Los assets necesarios se copian a rutas públicas versionadas.

## Uso de las referencias

El Excel sirve para validar códigos, descripciones, familias, precios por color, imágenes técnicas, carga inicial y casos de prueba. Los mockups sirven para comparar composición, jerarquía, interacción vidrio/perfil, búsquedas, modalidades, resumen unificado, mantenimiento y Catálogos base.

Antes de modificar perfiles, familias, colores, precios o su experiencia visual se debe revisar, en orden: reglas de negocio versionadas, modelo implementado y, cuando haga falta validar el origen, esta carpeta de referencia. Después de implementar, el código y las reglas versionadas en Git son la fuente de verdad.

## Trazabilidad del Excel

- Archivo vigente: `catalogos-fisicos/catalogo de perfiles de aluminio.xlsx`.
- Hoja: `Hoja1`.
- Columnas utilizadas: `COD`, `DESCRIPCION`, `mate`, `negro`; las imágenes técnicas están ancladas a las filas del Excel.
- Longitud comercial adoptada según el mockup aprobado: 6 metros.
- Familias detectadas: 21.
- Filas candidatas con código y descripción: 157 (sin contar las dos filas de cabecera).
- Filas con al menos un precio: 144.
- Perfiles válidos únicos: 154.
- Perfiles con imagen por código: 134.
- Perfiles sin imagen: 20.
- Cobertura de precios antes de consolidar duplicados: 58 solo Mate, 2 solo Negro y 84 con ambos colores.

Las familias originales son: RIELES DE MAMPARA, RIELES SISTEMA NOVA, RIELES DE VENTANA, ZOCALOS H Y DE PARED, CANALES, PORTAFELPAS, ANGULOS, TUBOS CUADRADOS, TUBOS MULTIFUNCIONALES, TUBOS RECTANGULARES, TUBOS REDONDOS, TOPE JUNQUILLO Y PORTAJUNQUILLO, CANTONERA, CONTRAMARCOS, PASAMANOS Y BARANDAS, PUERTA DUCHA, PUERTA DUCHA intermedio, TEE, RIEL CLOSET, PLATINAS y TUBOS CUADRADOS CON ALETA.

### Normalizaciones

- Se recortan espacios exteriores, pero se conserva por separado el texto original de código y descripción.
- El código estable se normaliza a mayúsculas para la unicidad; ninguno de los códigos válidos cambia por esta normalización.
- Los importes binarios de Excel se expresan en dos decimales (`32.700000000000003` → `32.70`, `35.799999999999997` → `35.80`) sin cambiar su valor monetario.
- El código `5220` aparece en dos filas válidas complementarias: fila 133 con precio Negro y fila 134 con precio Mate. Se consolida en un perfil, se preservan ambas filas/descripciones de origen y no se inventa otro SKU.
- Las imágenes se escriben como `public/profiles/<CÓDIGO>.<extensión>` por perfil. No se crean `image*.png` ni se usan renombrados Git para asignarlas. Si una fila no trae imagen, el perfil queda sin `imagePath` y la UI muestra un marcador; no se inventa ni se reasigna una fotografía.

### Filas descartadas por no tener precio

| Fila | Código | Descripción original |
|---:|---|---|
| 19 | 8412 | Riel alta p/vent eco |
| 32 | 7908 | Zócalo p/mamp"H" alta |
| 72 | 3188 | Riel sup, 2 corredizas Limat(2002) |
| 88 | 4111 | Angulo de 1" Int (1.52) Limat(4110) |
| 121 | 5224 | Tubo rect 1 x 2 3/8" N |
| 127 | 5142 | Tubo rect Lim(5142) |
| 129 | 8651 | Tubo rect 3 1/4 x 1" Ec (0.9) Corrales |
| 143 | 5568 | Tubo red 25,4 - 1" Inter corrales |
| 148 | 8503 | Tope puerta 3/4" eco |
| 181 | 2432 | balaustre intermedio |
| 201 | 6111 | Tee 1" Int |
| 204 | 2253 | Riel superior p/closet eco |
| 220 | 5143 | tubo rectangular 4" x 1 3/4" (1)-cristalum |

Estas filas se documentan, pero no se cargan como cotizables porque cero/ausencia de precio significa modalidad no disponible.
