# Reglas de negocio — Distribuidora Araujo

## 1. Alcance

Este documento define la regla oficial para calcular cotizaciones de vidrio del MVP de **Distribuidora Araujo – Vidriería & Aluminios**.

Es la fuente de verdad funcional del motor de cálculo.

> La cotización NO maneja IGV.

No calcular, mostrar, almacenar ni desglosar IGV en cotizador, PDF, ticket, WhatsApp, impresión ni persistencia.

---

## 2. Entradas

Para cada ítem por pie² (por medidas):

- vidrio seleccionado;
- código y descripción del vidrio;
- precio por pie cuadrado (`precioPie2`);
- ancho en centímetros (`anchoCm`);
- alto en centímetros (`altoCm`);
- cantidad de piezas (`cantidad`).

Validaciones:

- `anchoCm > 0`
- `altoCm > 0`
- `cantidad` entero `>= 1`
- `precioPie2 > 0`
- el vidrio debe estar `Activo` para nuevas cotizaciones

---

## 3. Fórmula oficial

### Paso 1 — centímetros a pulgadas

```text
anchoInRaw = anchoCm / 2.54
altoInRaw  = altoCm / 2.54
```

### Paso 2 — redondeo por merma

Cada dimensión se evalúa por separado. Se obtiene el par inmediato superior, se calcula la merma y se salta otro par cuando la merma disponible es menor a media pulgada:

```text
parInmediato = ceil(pulgadas / 2) * 2
merma = parInmediato - pulgadas
resultado = merma < 0.5 ? parInmediato + 2 : parInmediato
```

Con merma exactamente `0.5` se conserva el par inmediato. Una medida que cae exactamente en un par produce merma cero y siempre sube al siguiente par.

Ejemplos:

```text
35.43 -> par 36, merma 0.57 -> 36
35.51 -> par 36, merma 0.49 -> 38
31.90 -> par 32, merma 0.10 -> 34
36.00 -> par 36, merma 0.00 -> 38
36.40 -> par 38, merma 1.60 -> 38
```

### Paso 3 — área en pulgadas cuadradas

```text
areaIn2 = anchoInRedondeado * altoInRedondeado
```

### Paso 4 — convertir a pies cuadrados

```text
areaFt2Raw = areaIn2 / 144
areaFt2 = roundHalfUp(areaFt2Raw, 2)
```

El redondeo a 2 decimales es obligatorio antes de continuar.

### Paso 5 — precio unitario por pieza

```text
unitPriceRaw = areaFt2 * precioPie2
unitPrice = roundHalfUp(unitPriceRaw, 2)
```

Usar `areaFt2` ya redondeada.

### Paso 6 — importe del ítem

```text
itemAmount = unitPrice * cantidad
```

El importe de cada ítem conserva sus dos decimales normales. No se aplica a los ítems el redondeo final de la cotización.

---

## 4. Fórmula completa

```text
anchoInRaw = anchoCm / 2.54
altoInRaw  = altoCm / 2.54

anchoIn = redondearMerma(anchoInRaw)
altoIn  = redondearMerma(altoInRaw)

areaIn2 = anchoIn * altoIn

areaFt2 = roundHalfUp(areaIn2 / 144, 2)

unitPrice = roundHalfUp(areaFt2 * precioPie2, 2)

itemAmount = unitPrice * cantidad
```

---

## 5. Total de la cotización

```text
quotationSubtotal = suma(itemAmount)

si la fracción es 0.00: quotationTotal = quotationSubtotal
si la fracción está entre 0.01 y 0.50: quotationTotal = siguiente 0.50
si la fracción está entre 0.51 y 0.99: quotationTotal = siguiente entero
```

Este redondeo se aplica una sola vez, únicamente al total final. La interfaz, PDF, WhatsApp y ticket muestran el subtotal exacto y el total a cobrar.

No aplicar impuesto adicional.

Mostrar con dos decimales:

```text
S/ 540.00
```

No agregar:

- IGV
- impuesto
- subtotal + IGV
- porcentaje de IGV
- total con IGV

---

## 6. Ejemplo oficial 1

Datos:

```text
Vidrio: Cristal común
Precio por pie²: S/ 3.50
Medidas: 100 cm x 80 cm
Cantidad: 2
```

Cálculo:

```text
100 / 2.54 = 39.370... -> 40"
80 / 2.54  = 31.496... -> 32"

40 * 32 = 1280 in²

1280 / 144 = 8.888888...
areaFt2 = 8.89

8.89 * 3.50 = 31.115
unitPrice = 31.12

31.12 * 2 = subtotal S/ 62.24
total a cobrar = S/ 62.50
```

Resultado:

```text
S/ 62.50
```

---

## 7. Ejemplo oficial 2

Datos:

```text
Vidrio: Laminado
Precio por pie²: S/ 6.50
Medidas: 120 cm x 80 cm
Cantidad: 3
```

Cálculo:

```text
120 / 2.54 = 47.244... -> 48"
80 / 2.54  = 31.496... -> 32"

48 * 32 = 1536 in²

1536 / 144 = 10.666666...
areaFt2 = 10.67

10.67 * 6.50 = 69.355
unitPrice = 69.36

69.36 * 3 = subtotal S/ 208.08
total a cobrar = S/ 208.50
```

Resultado:

```text
S/ 208.50
```

---

## 8. Información visible

El usuario ingresa:

- nombre del cliente, obligatorio;
- tipo/vidrio;
- ancho en cm;
- alto en cm;
- cantidad.

El resumen muestra:

- nombre del cliente;
- vidrio;
- espesor;
- medidas originales en cm;
- cantidad;
- precio unitario calculado;
- importe del ítem;
- pulgadas convertidas de ancho y alto;
- merma calculada por lado;
- pulgadas redondeadas;
- área en pie²;
- subtotal exacto y total final redondeado.

---

## 9. Snapshot al confirmar

Cada ítem por pie² confirmado debe guardar al menos:

```text
productId
productCode
productDescription
family
colorFinish
thickness
cathedralDesign?

anchoCm
altoCm
cantidad

precioPie2

anchoInRaw
altoInRaw
anchoMermaIn
altoMermaIn
anchoInRedondeado
altoInRedondeado

areaIn2
areaFt2

unitPrice
itemAmount
```

Una cotización confirmada es histórica.

Cambios posteriores de catálogo o precio no deben recalcularla.

---

## 10. Precisión numérica

Usar `decimal.js` para cálculos monetarios y redondeos sensibles.

No depender de aritmética binaria simple de JavaScript para importes.

Helpers mínimos:

```text
roundHalfUp(value, decimals)
nextEvenInch(value)
roundQuotationTotal(value)
```

Todos deben vivir en el dominio y tener tests unitarios.

---

## 11. Tests obligatorios

### Redondeo por merma

```text
35.43 -> 36
35.49 -> 36
35.51 -> 38
35.83 -> 38
31.49 -> 32
31.90 -> 34
36.00 -> 38
36.40 -> 38
20.5 cm (8.07 pulgadas) -> 10
```

### Caso oficial 1

```text
100 x 80 cm
S/ 3.50 / pie²
cantidad 2
subtotal: S/ 62.24
total: S/ 62.50
```

### Caso oficial 2

```text
120 x 80 cm
S/ 6.50 / pie²
cantidad 3
subtotal: S/ 208.08
total: S/ 208.50
```

### Redondeo del total final

```text
120.12 -> 120.50
120.01 -> 120.50
120.50 -> 120.50
120.51 -> 121.00
120.67 -> 121.00
120.99 -> 121.00
120.00 -> 120.00
```

### Validaciones

```text
ancho <= 0 -> error
alto <= 0 -> error
cantidad = 0 -> error
cantidad negativa -> error
cantidad decimal -> error
precioPie2 <= 0 -> error
```

---

## 12. Única fuente de verdad

Implementar la fórmula una sola vez dentro del dominio, por ejemplo:

```text
src/domain/quotation/calculation.ts
```

No duplicarla en:

- componentes React;
- Server Actions;
- Route Handlers;
- PDF;
- ticket;
- WhatsApp;
- resumen;
- repositories.

Todos consumen el mismo resultado del motor de dominio.

La cotización en pantalla y su vista histórica detallada muestran, en texto secundario gris, esta línea técnica:

```text
Ancho [pulgadas convertidas]″ → [pulgadas cobradas]″ · Alto [pulgadas convertidas]″ → [pulgadas cobradas]″ · Área [pie²] ft² · S/ [precio] pie²
```

La merma permanece en el snapshot y en el cálculo, pero no se muestra en ese texto. Esta línea técnica no se incluye en PDF, voucher del cliente, impresión, WhatsApp ni texto copiado; esas salidas conservan la descripción simple de modalidad y medidas en centímetros.

---

## 13. Prioridad

Si existe contradicción:

1. `docs/business-rules.md`
2. `AGENTS.md`
3. `docs/implementation-spec.md`
4. `STITCH/instrucciones/*.md`
5. HTML/mock de STITCH


## 14. Precios pendientes y venta por plancha entera

Actualización aprobada: el catálogo admite `0.00` en precio por pie² y por plancha. Los precios vacíos o no ingresados se guardan como `0.00`; no se permiten negativos. Cero significa que esa modalidad no está disponible, no que el vidrio se cotiza gratis.

Cada ítem nuevo elige una modalidad: `SQUARE_FOOT` (por pie², con medidas) o `SHEET` (plancha entera). Una misma cotización puede combinar ambas. En el selector solo aparecen productos activos, con referencias base activas y precio estrictamente mayor que cero en la modalidad elegida. El servidor verifica esto al confirmar.

- Por pie²: se conserva exactamente la fórmula de las secciones 2–4 y sus casos oficiales.
- Por plancha: cantidad entera >= 1; precio unitario = precio de catálogo por plancha; importe = precio por plancha × cantidad, expresado con dos decimales. No aplicar conversiones de área ni redondeo por merma. Las medidas de plancha del catálogo son opcionales e informativas; no se solicitan medidas de corte.
- Subtotal de cotización: suma exacta de importes de ambas modalidades. Total a cobrar: subtotal redondeado hacia arriba a `0.50` o al siguiente entero según la sección 5.

El snapshot de plancha conserva modalidad, producto y descripción, precio por plancha, cantidad, precio unitario, importe y medidas de plancha del catálogo si existen. Cambios posteriores del catálogo no alteran el histórico. Los snapshots anteriores sin modalidad se interpretan como venta por pie² y se leen sin reescribirlos. Resumen, PDF, WhatsApp y ticket identifican claramente las planchas enteras.

### Cliente y vouchers

Toda nueva cotización exige un nombre de cliente y lo congela en el histórico. Pantalla, PDF, impresión, texto copiado y WhatsApp lo muestran. El histórico permite buscarlo. Los snapshots anteriores sin nombre siguen siendo legibles como `No registrado`.

El voucher del cliente conserva importes y condiciones. El voucher interno del taller es una salida térmica angosta compatible con papel de 58–80 mm y contiene exclusivamente nombre del cliente, descripción completa del vidrio en mayúsculas, medidas destacadas, cantidad abreviada con modalidad, fecha y hora. Numera los vidrios y separa bloques con un borde corto. No incluye precios, subtotal, total ni condiciones comerciales.

### Selección guiada del vidrio

En cotizador: elegir tipo de producto → modalidad → buscar producto. No hay modalidad ni producto seleccionados automáticamente. El buscador único permanece deshabilitado hasta elegir modalidad; medidas, cantidad, importe y agregado requieren además un producto válido. No existe un `select` independiente de familia: las familias se filtran dentro del desplegable y se muestran en la tarjeta elegida.

Solo participan productos activos y cotizables: vidrio con precio estrictamente mayor que cero en la modalidad elegida; perfil con al menos un color activo cuyo precio por barra sea mayor que cero. Familias sin productos disponibles no se muestran ni cuentan. Hasta seis familias disponibles se presentan como chips; con más de seis se navegan como carpetas. La búsqueda cubre código, descripción y familia, ignora mayúsculas/tildes y exige que coincidan todas las palabras sin importar su orden.

Al cambiar modalidad se mantiene el producto solo si continúa disponible; en caso contrario se limpia y se informa. Al cambiar entre Vidrio y Perfil se reinician modalidad, búsqueda, familia y producto. La tarjeta seleccionada muestra código, descripción, medida disponible y familia. La edición conserva los datos del ítem y permite volver a buscar. Cálculos, importes, snapshots y confirmación permanecen sin cambios.

### Continuidad del borrador

Se permite una copia temporal de UI en `sessionStorage`, aislada por usuario y pestaña: ítems, condiciones, formulario incompleto, edición y solicitud de confirmación. No es una cotización confirmada ni la fuente principal del negocio. El catálogo y precios se releen y la confirmación sigue validándose en servidor y persistiendo únicamente en Blob. Al confirmar, descartar explícitamente o cerrar sesión se limpia el borrador. No se promete sincronización del borrador entre dispositivos ni conservación al cerrar la pestaña.

## 15. Perfiles de aluminio

La cotización puede combinar vidrios y perfiles de aluminio. Los perfiles son una categoría independiente: sí conservan y muestran una imagen técnica; los vidrios no usan imágenes.

Cada perfil cotizable tiene código único, descripción, familia, longitud de barra comercial, estado y uno o más precios por color. Un color sin precio no está disponible para ese perfil. Familias, colores y perfiles ocultos se conservan para históricos, pero no aparecen en nuevas cotizaciones.

### Modalidades

`PROFILE_METERS` vende tramos por metros. Entradas: perfil, color, metros solicitados positivos y cantidad entera mayor o igual a uno.

```text
precioMetroRaw = precioBarra / longitudBarraMetros
precioMetroConRecargoRaw = precioMetroRaw * 1.10
precioUnitarioMetro = roundHalfUp(precioMetroConRecargoRaw, 2)
importeItem = roundHalfUp(precioUnitarioMetro * metrosSolicitados * cantidad, 2)
```

El recargo fijo para venta fraccionada es 10%. La longitud comercial inicial proveniente de la referencia aprobada es 6 metros, pero se conserva en cada perfil para no convertirla en un número mágico. En pantalla se muestra la fórmula `(precio barra ÷ longitud) × 1.10 × metros × cantidad`.

`PROFILE_BAR` vende barras completas. Entradas: perfil, color y cantidad entera mayor o igual a uno.

```text
precioUnitario = precioBarra
importeItem = precioBarra * cantidad
```

No se solicita cantidad de metros para barra completa. Todos los cálculos usan `decimal.js` y se implementan una sola vez en el dominio.

### Snapshot y total unificado

El ítem confirmado congela como mínimo: tipo de ítem, modalidad, perfil y código, descripción y familia originales, color, imagen relativa versionada, longitud comercial, precio por barra, porcentaje de recargo cuando corresponda, metros solicitados cuando corresponda, cantidad, precio unitario e importe.

El subtotal unificado es la suma exacta de los importes de vidrios y perfiles. El total a cobrar conserva la regla de la sección 5: se redondea una sola vez hacia arriba a `.50` o al entero. No se aplica IGV ni otro impuesto.
