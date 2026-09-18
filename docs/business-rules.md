# Reglas de negocio — Distribuidora Araujo

## 1. Alcance

Este documento define la regla oficial para calcular proformas de vidrio del MVP de **Distribuidora Araujo – Vidriería & Aluminios**.

Es la fuente de verdad funcional del motor de cálculo.

> La proforma NO maneja IGV.

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
- el vidrio debe estar `Activo` para nuevas proformas

---

## 3. Fórmula oficial

### Paso 1 — centímetros a pulgadas

```text
anchoInRaw = anchoCm / 2.54
altoInRaw  = altoCm / 2.54
```

### Paso 2 — siguiente número entero par

Cada dimensión convertida debe subir al siguiente entero par.

Regla exacta:

```text
siguientePar(x) = 2 * (floor(x / 2) + 1)
```

El resultado debe ser estrictamente mayor que el valor convertido.

Ejemplos:

```text
24.4  -> 26
23.6  -> 24
39.37 -> 40
31.50 -> 32
47.24 -> 48
24.0  -> 26
```

Si el valor convertido es exactamente un entero par, también se sube al siguiente par.

Aplicar la regla de forma independiente a ancho y alto.

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

### Paso 6 — cantidad

```text
amountBeforeCommercialRounding = unitPrice * cantidad
```

### Paso 7 — redondeo comercial final

El importe final del ítem se redondea **hacia arriba** al múltiplo de `S/ 0.05` más cercano:

```text
itemAmount = ceilToMultiple(amountBeforeCommercialRounding, 0.05)
```

Ejemplos:

```text
62.24  -> 62.25
62.25  -> 62.25
62.26  -> 62.30
208.08 -> 208.10
```

Si el valor ya es múltiplo exacto de S/ 0.05, se conserva.

---

## 4. Fórmula completa

```text
anchoInRaw = anchoCm / 2.54
altoInRaw  = altoCm / 2.54

anchoIn = siguientePar(anchoInRaw)
altoIn  = siguientePar(altoInRaw)

areaIn2 = anchoIn * altoIn

areaFt2 = roundHalfUp(areaIn2 / 144, 2)

unitPrice = roundHalfUp(areaFt2 * precioPie2, 2)

amountBeforeCommercialRounding = unitPrice * cantidad

itemAmount = ceilToMultiple(amountBeforeCommercialRounding, 0.05)
```

---

## 5. Total de la proforma

```text
quotationTotal = suma(itemAmount)
```

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

31.12 * 2 = 62.24

62.24 -> 62.25
```

Resultado:

```text
S/ 62.25
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

69.36 * 3 = 208.08

208.08 -> 208.10
```

Resultado:

```text
S/ 208.10
```

---

## 8. Información visible

El usuario ingresa:

- tipo/vidrio;
- ancho en cm;
- alto en cm;
- cantidad.

El resumen puede mostrar:

- vidrio;
- espesor;
- medidas originales en cm;
- cantidad;
- precio unitario calculado;
- importe final.

Las conversiones a pulgadas y pies cuadrados son internas.

No mostrarlas como información principal de la pantalla.

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
anchoInRedondeado
altoInRedondeado

areaIn2
areaFt2

unitPrice
itemAmount
```

Una proforma confirmada es histórica.

Cambios posteriores de catálogo o precio no deben recalcularla.

---

## 10. Precisión numérica

Usar `decimal.js` para cálculos monetarios y redondeos sensibles.

No depender de aritmética binaria simple de JavaScript para importes.

Helpers mínimos:

```text
roundHalfUp(value, decimals)
nextEvenInch(value)
ceilToMultiple(value, 0.05)
```

Todos deben vivir en el dominio y tener tests unitarios.

---

## 11. Tests obligatorios

### Siguiente par

```text
24.4 -> 26
23.6 -> 24
39.37 -> 40
31.50 -> 32
47.24 -> 48
24.0 -> 26
```

### Caso oficial 1

```text
100 x 80 cm
S/ 3.50 / pie²
cantidad 2
resultado: S/ 62.25
```

### Caso oficial 2

```text
120 x 80 cm
S/ 6.50 / pie²
cantidad 3
resultado: S/ 208.10
```

### Redondeo comercial

```text
62.24 -> 62.25
62.25 -> 62.25
62.26 -> 62.30
208.08 -> 208.10
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

Cada ítem nuevo elige una modalidad: `SQUARE_FOOT` (por pie², con medidas) o `SHEET` (plancha entera). Una misma proforma puede combinar ambas. En el selector solo aparecen productos activos, con referencias base activas y precio estrictamente mayor que cero en la modalidad elegida. El servidor verifica esto al confirmar.

- Por pie²: se conserva exactamente la fórmula de las secciones 2–4 y sus casos oficiales.
- Por plancha: cantidad entera >= 1; precio unitario = precio de catálogo por plancha; importe = precio por plancha × cantidad, expresado con dos decimales. No aplicar conversiones de área, siguiente par ni redondeo comercial a múltiplos de 0.05. Las medidas de plancha del catálogo son opcionales e informativas; no se solicitan medidas de corte.
- Total de proforma: suma de importes de ambas modalidades.

El snapshot de plancha conserva modalidad, producto y descripción, precio por plancha, cantidad, precio unitario, importe y medidas de plancha del catálogo si existen. Cambios posteriores del catálogo no alteran el histórico. Los snapshots anteriores sin modalidad se interpretan como venta por pie² y se leen sin reescribirlos. Resumen, PDF, WhatsApp y ticket identifican claramente las planchas enteras.

### Selección guiada del vidrio

En cotizador: elegir modalidad → familia → vidrio. No hay selección inicial automática. Cada control permanece deshabilitado hasta completar el anterior; medidas y cantidad requieren un vidrio seleccionado. Al cambiar modalidad o familia se descarta la selección dependiente. Solo se ofrecen familias con productos activos y cotizables (precio > 0 en esa modalidad), y el combo de vidrio se limita a esa familia. Se elimina el selector adicional de espesor. El detalle muestra el diseño cuando corresponda (por ejemplo, Arabesco, sin el prefijo Catedral), color, grosor, medidas de plancha si están registradas, y código entre paréntesis en texto pequeño. No se inventan dimensiones ni se repite la familia. La edición de ítems conserva su modalidad, familia y producto; permite cambiar medidas/cantidad como antes. Cálculos y snapshots históricos permanecen iguales.

### Continuidad del borrador

Se permite una copia temporal de UI en `sessionStorage`, aislada por usuario y pestaña: ítems, condiciones, formulario incompleto, edición y solicitud de confirmación. No es una proforma confirmada ni la fuente principal del negocio. El catálogo y precios se releen y la confirmación sigue validándose en servidor y persistiendo únicamente en Blob. Al confirmar, descartar explícitamente o cerrar sesión se limpia el borrador. No se promete sincronización del borrador entre dispositivos ni conservación al cerrar la pestaña.
