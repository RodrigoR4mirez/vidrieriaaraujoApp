# Modelo de datos

## Estructura Blob

```text
data/v1/catalog.json
  schemaVersion: 1
  values: BaseValue[]
  products: Product[]
data/v1/quotations/PRO-00001.json
data/v1/quotations/PRO-00002.json
...
```

Solo almacenamiento privado. Los stores de Preview/desarrollo y Production tienen la misma estructura pero datos independientes.

`BaseValue`: id UUID, schemaVersion, revision, category, name, description, status, createdAt, updatedAt. Categorías: `families`, `colors-finishes`, `thicknesses`, `cathedral-designs`. Nuevos registros no tienen código ni observación. Los campos antiguos `code` y `observation` son opcionales y se conservan al leer, editar y respaldar datos existentes; no aparecen en la UI. Las relaciones usan siempre el ID.

`Product`: id UUID, schemaVersion, revision, code único normalizado en mayúsculas, familyId, thicknessId, colorFinishId opcional, cathedralDesignId opcional, sheetWidthCm/sheetHeightCm opcionales en pareja, pricePerSquareFoot, pricePerSheet opcional, status, createdAt, updatedAt.

Estados: ACTIVE/HIDDEN. No hay borrado físico. Decimales persistidos como strings; cantidades como enteros. Las medidas de plancha son informativas. Su precio se usa exclusivamente en modalidad `SHEET`. Nuevas escrituras guardan ambos precios; ausentes o vacíos pasan a `0.00`. Lecturas antiguas conservan `pricePerSheet` ausente sin modificar el JSON.

Los precios nuevos o modificados requieren exactamente dos decimales y un importe no negativo (cero indica no disponible). La entrada desplaza dígitos desde los centavos (`11100` → `111.00`). Los precios históricos o existentes no se migran ni redondean en almacenamiento; un precio antiguo sin modificar se conserva incluso al editar otros campos del producto.

`Quotation`: schemaVersion, id de solicitud UUID, number PRO-XXXXX, status CONFIRMED, createdAt, confirmedAt, timezone America/Lima, customerName, conditions, subtotal exacto, total redondeado e items. `customerName` y `subtotal` son opcionales únicamente al leer snapshots antiguos; toda confirmación nueva exige el nombre.

Cada ítem por pie² (`mode: SQUARE_FOOT`, opcional para históricos antiguos) conserva id, productId, productCode, productDescription, family, colorFinish, thickness, cathedralDesign, widthCm, heightCm, quantity, pricePerSquareFoot, widthInRaw, heightInRaw, widthWasteIn, heightWasteIn, widthInRounded, heightInRounded, areaIn2, areaFt2, unitPrice e itemAmount. Las mermas son opcionales al leer históricos anteriores. El snapshot histórico no depende de referencias vigentes para mostrarse.

## Migración futura

| Entidad Blob | Tabla futura | Restricciones |
|---|---|---|
| values | base_catalog_values | PK id, category, status; campos antiguos opcionales |
| products | glass_products | PK id, UNIQUE(code), referencias base, revision |
| quotations | quotations | PK id, UNIQUE(number), solo inserciones |
| quotation.items | quotation_items | PK id por proforma, FK quotation, snapshots completos |

Implementar nuevos repositorios con las mismas interfaces. No modificar UI, casos de uso, cálculo, PDF ni mensajes. La migración usaría una transacción y una secuencia o bloqueo apropiado para folios; no se incorpora base relacional al MVP.

Los ítems `mode: SHEET` conservan los mismos datos descriptivos, cantidad, `pricePerSheet`, `unitPrice`, `itemAmount` y dimensiones de plancha opcionales. No incluyen medidas de corte ni conversiones de área. Ambas variantes conviven en `items`; un ítem histórico sin `mode` sigue siendo por pie², sin reescribirlo.
