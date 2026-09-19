# Roadmap de Desarrollo y Fases del Proyecto (v2.0)
## Sistema de Cotización, Cotizaciones y Gestión de Catálogos — Distribuidora Araujo

---

### 1. Resumen Estratégico del Roadmap

El plan de desarrollo de **Distribuidora Araujo** se organiza en **5 fases progresivas** diseñadas para maximizar el retorno de inversión y la eficiencia operativa desde el mostrador físico hasta el taller de manufactura y la nube administrativa. Cada fase cuenta con entregables claros, criterios de aceptación (*Definition of Done*), tecnologías asociadas y estimaciones de tiempo.

```
[FASE 1: Prototipo UI/UX & Flujos Base] ────► COMPLETADO (En Lienzo)
                   │
                   ▼
[FASE 2: Motor de Manufacturas & Taller] ───► EN ESPECIFICACIÓN / LISTO PARA UI
                   │
                   ▼
[FASE 3: Backend, Persistencia & Folios] ───► PRÓXIMA IMPLEMENTACIÓN
                   │
                   ▼
[FASE 4: Pasarelas de Pago & Finanzas] ─────► PLANIFICADO (Q2)
                   │
                   ▼
[FASE 5: App Taller, QR Tracking & ERP] ────► VISIÓN FUTURA (Q3)
```

---

### 2. Cronograma General y Estado por Fases

| Fase | Denominación | Alcance Clave | Duración Estimada | Estado Actual |
| :--- | :--- | :--- | :--- | :--- |
| **Fase 1** | **Diseño UI/UX, Cotizador Base y Salidas Omnicanal** | Interfaz *Liquid Glass*, cotizador paramétrico por m² y pie², Login, Ticket POS 80mm, PDF A4, WhatsApp y Demo Guiada. | 4 semanas | 🟢 **100% Completado** |
| **Fase 2** | **Motor de Manufacturas Adicionales & Acabados de Taller** | Pulidos (recto, redondo, arrisado), biseles por ancho, selector táctil de lados, perforaciones, saques y desglose para taller. | 3 semanas | 🟡 **Especificado / En UI** |
| **Fase 3** | **Persistencia Backend, Base de Datos y Gestión de Folios** | API REST / Supabase (PostgreSQL), autenticación JWT, correlativos automáticos (`COT-XXXXX`), historial de clientes y cotizaciones guardadas. | 4 semanas | ⚪ **Planificado (Sprint 1)** |
| **Fase 4** | **Cobranzas Digitales, Pasarelas y Control de Anticipos** | Códigos QR automáticos (Yape, Plin), cuentas bancarias BCP/BBVA en vouchers y control de estado de pago (Pendiente / Anticipo / Pagado). | 2 semanas | ⚪ **Planificado (Sprint 2)** |
| **Fase 5** | **Tracking en Taller por Códigos QR y Despacho** | Vista de producción para operarios de mesa de corte, escaneo de tickets POS, validación de tolerancias y notificación automática al cliente. | 5 semanas | ⚪ **Roadmap Futuro** |

---

### 3. Desglose Exhaustivo por Fases

---

#### 🟢 FASE 1: Prototipo UI/UX, Cotizador Base y Salidas Omnicanal
* **Objetivo:** Digitalizar la atención de mostrador y ventas rápidas con una experiencia táctil intuitiva de alta fidelidad.
* **Entregables:**
  - [x] Pantalla de **Inicio de Sesión (Login)** neumórfico con identidad de marca y logo 3D.
  - [x] **Cotizador Principal de Vidrios** con selector rápido de familias, espesores (`6mm`, `8mm`, `10mm`, `12mm`) y cálculo paramétrico en tiempo real.
  - [x] Modos de visualización de cotización: **Vista Detallada** y **Vista Compacta**.
  - [x] **Modal de Edición Inline** para corregir ancho, alto y cantidad sin recargar la página.
  - [x] Pantalla de **Confirmación de Cotización** con folio oficial correlativo.
  - [x] **Módulo de Salidas Omnicanal:**
    - Generador de mensaje estructurado para **WhatsApp** con emojis y formato limpio.
    - Plantilla de **Voucher Térmico 80 mm POS** con tipografía monoespaciada y código de barras.
    - Formato técnico **PDF / Hoja A4 Monocromática** para ahorro de tinta y firmas de conformidad.
  - [x] **Catálogos de Gestión Base:** Familias, Colores/Acabados, Espesores y Diseños Catedral.
  - [x] **Catálogo Principal de Vidrios** con tarifas por pie² y plancha completa.
  - [x] **Entorno de Demostración Guiada (Master Flow)** interactivo con navegación paso a paso.
* **Hito de Cierre:** Validación favorable de flujos y aceptación de diseño UI/UX por gerencia.

---

#### 🟡 FASE 2: Motor de Manufacturas Adicionales & Acabados de Taller
* **Objetivo:** Eliminar errores en el cobro y especificación técnica de trabajos de mano de obra y mecanizado de cristales.
* **Entregables:**
  - [x] Especificación técnica matemática en PRD v2.0 (Fórmulas de perímetro, m.l. y tarifas por espesor).
  - [ ] **Sub-panel UI en Cotizador:** Selector visual táctil de manufacturas por paño.
  - [ ] **Selector de Lados Procesados:** Chips rápidos para `4 lados`, `Solo anchos (2)`, `Solo altos (2)` o personalizado.
  - [ ] **Configurador de Cantos y Pulidos:** Canto pulido plano brillante, arrisado de seguridad y pecho de paloma.
  - [ ] **Configurador de Biselado:** Anchos de bisel (`1/2"`, `3/4"`, `1"`, `1 1/2"`).
  - [ ] **Mecanizados:** Contadores de perforaciones (Ø 10-35 mm) y saques para cerrajería/bisagras.
  - [ ] **Actualización de Tickets y Vouchers:** Inclusión de glosa técnica de taller con metros lineales procesados para operarios de corte.
* **Criterio de Aceptación:** El cotizador calcula en vivo el costo de vidrio + manufacturas y lo refleja con exactitud en el ticket de 80 mm y la cotización de WhatsApp.

---

#### ⚪ FASE 3: Arquitectura Backend, Base de Datos & Gestión de Clientes
* **Objetivo:** Proveer almacenamiento seguro y permanente de cotizaciones, clientes recurrentes y control de folios inmutables.
* **Stack Tecnológico:** PostgreSQL / Supabase, Node.js / Next.js API Routes, Autenticación JWT / Row Level Security (RLS).
* **Entregables:**
  - [ ] **Modelo de Datos Relacional:**
    - Tablas: `users`, `clients`, `cotizaciones`, `cotización_items`, `manufacturas_item`, `catalog_vidrios`, `catalog_manufacturas`.
  - [ ] **Generador de Folio Correlativo Inmutable:** Secuencia atómica segura en base de datos (`COT-00001`, `COT-00002`, etc.).
  - [ ] **Módulo de Gestión de Clientes:** Búsqueda rápida por DNI / RUC o nombre comercial al iniciar cotización.
  - [ ] **Historial de Cotizaciones:** Buscador por fecha, cliente, estado (*Borrador*, *Emitida*, *Aprobada*, *Vencida*) y montos.
  - [ ] **Replicación y Edición de Folios Existentes:** Opción "Duplicar cotización" para clientes con compras recurrentes.
* **Criterio de Aceptación:** Guardado y recuperación de cualquier cotización en menos de 300 ms con persistencia en la nube.

---

#### ⚪ FASE 4: Cobranzas Digitales, Pagos QR & Gestión Financiera
* **Objetivo:** Acelerar el cierre comercial permitiendo al cliente pagar señas o el total directamente desde el WhatsApp o ticket.
* **Entregables:**
  - [ ] **Generación Dinámica de Códigos QR:**
    - Código QR de **Yape** y **Plin** con monto pre-cargado de la cotización o del 50% de anticipo.
  - [ ] **Datos Bancarios Institucionales:** Cuentas corrientes y CCI (BCP, BBVA, Interbank) impresas en el pie de página de la cotización A4 y voucher 80 mm.
  - [ ] **Control de Estado de Pago en Sistema:**
    - Estados: `Sin Pago (Cotización)`, `Anticipo 50% Recibido (En Fabricación)`, `Cancelado 100% (Listo para Despacho)`.
  - [ ] **Comprobante de Anticipo Térmico:** Impresión de recibo de caja de 80 mm acreditando el abono inicial.
* **Criterio de Aceptación:** El cliente recibe la cotización con botón directo de pago y el asesor registra el comprobante en menos de 10 segundos.

---

#### ⚪ FASE 5: Mesa de Control de Taller, Tracking QR & Despacho
* **Objetivo:** Conectar el mostrador de ventas con las mesas de corte y los hornos de templado en tiempo real.
* **Entregables:**
  - [ ] **Pantalla Modo Taller (KDS Táctil):**
    - Interfaz simplificada de alto contraste para las mesas de corte e inspección.
    - Cola de trabajo priorizada por fecha de entrega comprometida.
  - [ ] **Escaneo de Código de Barras / QR del Ticket POS:**
    - El operario escanea el ticket térmico para marcar: `En Corte`, `En Pulido/Bisel`, `En Templado`, `Control de Calidad Aprobado`.
  - [ ] **Notificación Automática al Cliente:**
    - Disparo de mensaje automático de WhatsApp al cliente cuando su pedido pasa al estado `Listo para Retiro en Taller`.
  - [ ] **Firma Digital de Recepción:** Captura de firma en pantalla táctil al momento de la entrega física.

---

### 4. Matriz de Riesgos y Mitigaciones

| Riesgo Identificado | Severidad | Mitigación Técnica / Operativa |
| :--- | :--- | :--- |
| **Cortes imprecisos por discrepancias en medidas** | Alta | Bloqueo de medidas decimales no estándar y confirmación visual de dimensiones en el ticket con croquis esquemático. |
| **Caída de conectividad a internet en tienda** | Media | Arquitectura *Offline-First* con LocalStorage / IndexedDB para emitir tickets locales que se sincronizan al volver la red. |
| **Variación volátil de precios de planchas importadas** | Media | Módulo de actualización masiva por porcentaje (%) en el Catálogo Principal de Vidrios con un solo clic. |
| **Uso de papel térmico de baja calidad en POS** | Baja | Diseño de voucher optimizado con tipografía monoespaciada bold de alta densidad y pruebas de contraste a 203 DPI. |

---

### 5. Próximo Paso Recomendado

Con la **Fase 1 totalmente cerrada** y aprobada en el lienzo, el paso inmediato es la ejecución de la **Fase 2 (UI del Sub-panel de Manufacturas Adicionales en el Cotizador)** para dotar a la pantalla principal de los controles táctiles de pulido, biselado y perforaciones.
