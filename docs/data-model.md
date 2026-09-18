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

`BaseValue`: id UUID, schemaVersion, revision, category, code, name, description, observation, status, createdAt, updatedAt. Categorías: `families`, `colors-finishes`, `thicknesses`, `cathedral-designs`. Código único dentro de categoría.

`Product`: id UUID, schemaVersion, revision, code único normalizado en mayúsculas, familyId, thicknessId, colorFinishId opcional, cathedralDesignId opcional, sheetWidthCm/sheetHeightCm opcionales en pareja, pricePerSquareFoot, pricePerSheet opcional, status, createdAt, updatedAt.

Estados: ACTIVE/HIDDEN. No hay borrado físico. Decimales persistidos como strings; cantidades como enteros. Las medidas de plancha y su precio son informativos, no intervienen en la fórmula por pieza.

`Quotation`: schemaVersion, id de solicitud UUID, number PRO-XXXXX, status CONFIRMED, createdAt, confirmedAt, timezone America/Lima, conditions, total, items.

Cada `QuotationItem` conserva id, productId, productCode, productDescription, family, colorFinish, thickness, cathedralDesign, widthCm, heightCm, quantity, pricePerSquareFoot, widthInRaw, heightInRaw, widthInRounded, heightInRounded, areaIn2, areaFt2, unitPrice e itemAmount. El snapshot histórico no depende de referencias vigentes para mostrarse.

## Migración futura

| Entidad Blob | Tabla futura | Restricciones |
|---|---|---|
| values | base_catalog_values | PK id, UNIQUE(category, code), status |
| products | glass_products | PK id, UNIQUE(code), referencias base, revision |
| quotations | quotations | PK id, UNIQUE(number), solo inserciones |
| quotation.items | quotation_items | PK id por proforma, FK quotation, snapshots completos |

Implementar nuevos repositorios con las mismas interfaces. No modificar UI, casos de uso, cálculo, PDF ni mensajes. La migración usaría una transacción y una secuencia o bloqueo apropiado para folios; no se incorpora base relacional al MVP.
