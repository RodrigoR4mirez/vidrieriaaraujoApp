# Modelo de datos

## Estructura Blob

```text
data/v1/catalog.json
  schemaVersion: 1
  values: BaseValue[]
  products: Product[]
data/v1/aluminum-catalog.json
  schemaVersion: 1
  families: AluminumFamily[]
  colors: AluminumColor[]
  profiles: AluminumProfile[]
data/v1/quotations/COT-00001.json
data/v1/quotations/COT-00002.json
...
```

Solo almacenamiento privado. Los stores de Preview/desarrollo y Production tienen la misma estructura pero datos independientes.

`BaseValue`: id UUID, schemaVersion, revision, category, name, description, status, createdAt, updatedAt. Categorías: `families`, `colors-finishes`, `thicknesses`, `cathedral-designs`. Nuevos registros no tienen código ni observación. Los campos antiguos `code` y `observation` son opcionales y se conservan al leer, editar y respaldar datos existentes; no aparecen en la UI. Las relaciones usan siempre el ID.

`Product`: id UUID, schemaVersion, revision, code único normalizado en mayúsculas, `description` opcional con el nombre/detalle de origen, familyId, thicknessId, colorFinishId opcional, cathedralDesignId opcional, sheetWidthCm y sheetHeightCm opcionales e informativos de forma independiente, pricePerSquareFoot, pricePerSheet opcional, status, createdAt, updatedAt. Los productos históricos sin `description` siguen siendo válidos y muestran el detalle compuesto por sus referencias base.

Estados: ACTIVE/HIDDEN. No hay borrado físico. Decimales persistidos como strings; cantidades como enteros. Las medidas de plancha son informativas. Su precio se usa exclusivamente en modalidad `SHEET`. Nuevas escrituras guardan ambos precios; ausentes o vacíos pasan a `0.00`. Lecturas antiguas conservan `pricePerSheet` ausente sin modificar el JSON.

Los precios nuevos o modificados requieren exactamente dos decimales y un importe no negativo (cero indica no disponible). La entrada desplaza dígitos desde los centavos (`11100` → `111.00`). Los precios históricos o existentes no se migran ni redondean en almacenamiento; un precio antiguo sin modificar se conserva incluso al editar otros campos del producto.

`Quotation`: schemaVersion, id de solicitud UUID, number COT-XXXXX, status CONFIRMED, createdAt, confirmedAt, timezone America/Lima, customerName, conditions, subtotal exacto, total redondeado e items. Toda confirmación nueva exige nombre de cliente de 1 a 160 caracteres, condiciones de hasta 2,000 caracteres y entre 1 y 200 ítems con IDs únicos. `customerName` y `subtotal` son opcionales únicamente al leer snapshots antiguos. Los archivos históricos con un prefijo legado de tres letras se presentan como `COT-XXXXX`; las nuevas escrituras usan exclusivamente ese prefijo.

Cada ítem por pie² (`mode: SQUARE_FOOT`, opcional para históricos antiguos) conserva id, productId, productCode, productDescription, family, colorFinish, thickness, cathedralDesign, widthCm, heightCm, quantity, pricePerSquareFoot, widthInRaw, heightInRaw, widthWasteIn, heightWasteIn, widthInRounded, heightInRounded, areaIn2, areaFt2, unitPrice e itemAmount. Las mermas son opcionales al leer históricos anteriores. El snapshot histórico no depende de referencias vigentes para mostrarse.

## Perfiles de aluminio

`AluminumFamily`: id UUID, revisión, nombre original, descripción y estado. `AluminumColor`: id UUID, revisión, nombre, muestra hexadecimal y estado. `AluminumProfile`: código único, descripción, familia, longitud comercial, imagen pública relativa opcional, precios por color, estado y trazabilidad opcional (`originalCode`, `originalDescription`, `sourceRows`).

El catálogo inicial versionado se deriva de `catalogos-fisicos/catalogo de perfiles de aluminio.xlsx`/`Hoja1`: 21 familias, 2 colores y 154 perfiles únicos; 134 perfiles tienen imagen por código y 20 no tienen imagen de origen. Las imágenes se guardan como `public/profiles/<CÓDIGO>.<extensión>`; no se crean `image*.png` ni se usan renombrados Git para asignarlas. La carga solo se permite sobre un catálogo de aluminio vacío y nunca sobrescribe registros existentes.

Los ítems de perfil usan `itemType: ALUMINUM_PROFILE`. En nuevas cotizaciones, `PROFILE_METERS` conserva su nombre técnico por compatibilidad pero recibe la medida en centímetros (`measurementUnit: CENTIMETERS`), guarda esa medida y su equivalente normalizado en metros, además de perfil, familia, color, imagen, longitud, precio por barra, multiplicador `1.10`, cantidad, precio unitario por metro e importe. Los históricos con `measurementUnit: METERS` siguen siendo legibles. `PROFILE_BAR` congela los mismos datos excepto medida fraccionada y multiplicador. Ambos conviven con los ítems de vidrio en `quotation.items`.

## Migración futura

| Entidad Blob | Tabla futura | Restricciones |
|---|---|---|
| values | base_catalog_values | PK id, category, status; campos antiguos opcionales |
| products | glass_products | PK id, UNIQUE(code), referencias base, revision |
| aluminum families/colors/profiles | aluminum_families / aluminum_colors / aluminum_profiles | PK id, UNIQUE(code de perfil), precios por color, revision |
| quotations | quotations | PK id, UNIQUE(number), solo inserciones |
| quotation.items | quotation_items | PK id por cotización, FK quotation, snapshots completos |

Implementar nuevos repositorios con las mismas interfaces. No modificar UI, casos de uso, cálculo, PDF ni mensajes. La migración usaría una transacción y una secuencia o bloqueo apropiado para folios; no se incorpora base relacional al MVP.

Los ítems `mode: SHEET` conservan los mismos datos descriptivos, cantidad, `pricePerSheet`, `unitPrice`, `itemAmount` y dimensiones de plancha opcionales, aun si solo una dimensión está disponible. No incluyen medidas de corte ni conversiones de área. Ambas variantes conviven en `items`; un ítem histórico sin `mode` sigue siendo por pie², sin reescribirlo.
