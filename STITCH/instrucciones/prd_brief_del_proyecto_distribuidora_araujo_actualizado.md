# Documento de Requisitos del Producto (PRD) & Brief del Proyecto
## Sistema de Cotización, Cotizaciones y Gestión de Catálogos — Distribuidora Araujo

---

### 1. Resumen Ejecutivo y Visión del Producto

**Distribuidora Araujo** es una empresa especializada en la comercialización, corte, procesamiento y distribución de vidrios planos, vidrios templados, laminados, espejos y perfiles de aluminio.

El proyecto consiste en una **solución web responsiva y táctil de alto rendimiento** concebida primordialmente para asesores de mostrador, técnicos de taller y ejecutivos de ventas remotas vía WhatsApp. El sistema digitaliza y automatiza el ciclo de cotización en tiempo real, integrando catálogos dinámicos de piezas, cálculo paramétrico por metros cuadrados ($m^2$) y pies cuadrados ($pie^2$), exportación omnicanal instantánea (WhatsApp, Ticket POS 80 mm y Hoja A4 Monocromática) y gestión centralizada de catálogos base.

---

### 2. Objetivos del Negocio y Métricas Clave (KPIs)

* **Reducción de tiempos de atención:** Disminución del tiempo de generación de cotización de más de 5 minutos manuales a **menos de 30 segundos**.
* **Eliminación de errores de cálculo:** 0% de discrepancias en tarifas, cálculo de mermas, áreas efectivas e I.G.V. (18%).
* **Agilidad en la comunicación omnicanal:** Envío de presupuestos inmediatos vía WhatsApp estructurado con un solo clic, aumentando la tasa de cierre en un **35%**.
* **Eficiencia operativa en taller:** Emisión de órdenes claras mediante ticket térmico de 80 mm para corte rápido y documento A4 para validación formal con contratistas.

---

### 3. Roles de Usuario y Casos de Uso

| Rol | Entorno de Operación | Principales Tareas / Necesidades |
| :--- | :--- | :--- |
| **Asesor de Mostrador** | Terminal de escritorio / pantalla táctil en tienda física | Ingreso rápido de medidas ($cm$), selección rápida de espesores con un clic, emisión de ticket de 80 mm. |
| **Vendedor Digital / WhatsApp** | Laptop / Tablet / Móvil | Armado de cotizaciones a distancia y copia de resumen enriquecido para WhatsApp instantáneo. |
| **Jefe de Taller / Producción** | Mesa de corte e inspección | Lectura de especificaciones claras (espesores, medidas, tipos de vidrio y folios de seguimiento). |
| **Administrador / Gerencia** | Oficina administrativa | Mantenimiento de precios base por pie² y plancha, catálogo de familias, acabados y espesores. |

---

### 4. Arquitectura de Información y Mapa de Pantallas

1. **Acceso / Autenticación (`Login`):**
   - Interfaz con diseño *Soft UI / Neumórfico*.
   - Credenciales simples (Usuario / Contraseña), control de "Recordar sesión" y acceso directo al cotizador.
2. **Cotizador Principal de Vidrios:**
   - **Formulario de captura rápida:** Selector de familia/tipo de vidrio, selector táctil de espesores (`6mm`, `8mm`, `10mm`, `12mm`), dimensiones en centímetros (`Ancho × Alto`), cantidad (+ / -) y pre-cálculo de subtotal estimado.
   - **Bandeja de ítems agregados:**
     - *Vista Detallada:* Agrupación por tipo de vidrio con desglose de medidas, precio unitario e importe acumulado.
     - *Vista Compacta:* Tabla tabular condensada para cotizaciones de alto volumen (≥ 5 ítems).
     - *Acciones de ítem:* Botón de edición inline (`✏️`) y eliminación (`🗑️`).
   - **Panel de totales contables:** Total Cotización ($S/.$), desglose de I.G.V. (18%), subtotal neto, contador de piezas totales y tipos de vidrio.
   - **Navegación superior:** Icono de tuerca (`⚙️`) con acceso directo a catálogos.
3. **Modal de Edición en Línea (Inline Editing):**
   - Permite corregir ancho, alto o cantidad de una pieza específica directamente dentro del contexto de la cotización, recalculando totales sin refrescar la página.
4. **Pantalla de Confirmación & Modal de Compartir:**
   - Asignación de folio correlativo oficial (ej. `COT-00001`) y estado de registro exitoso.
   - **Módulo de Salidas Omnicanal:**
     - 🟢 **WhatsApp:** Formato optimizado con negritas, emojis técnicos y cláusulas comerciales.
     - 📋 **Copiar Texto:** Copia limpia al portapapeles para correos o mensajería interna.
     - 🖨️ **Voucher Térmico 80 mm:** Formato optimizado para impresoras POS con tipografía monoespaciada y código de barras.
     - 📄 **PDF / Impresión A4 Monocromática:** Formato sobrio de bajo consumo de tinta para contratos y firmas de conformidad.
5. **Módulos de Administración y Catálogos:**
   - **Catálogo Principal de Vidrios:** Tabla de administración con código de producto (`PRI-INC-02`, `LAM-INC-06`, etc.), familia, acabado, espesor, medidas de plancha, precio por pie² ($S/.$) y precio por plancha ($S/.$), con filtros por estado y buscador interactivo.
   - **Catálogos Base:**
     - *Familias* (Monolítico, Templado, Laminado, Espejo, Catedral, etc.).
     - *Colores y Acabados* (Incoloro, Bronce, Gris, Azul cielo, Verde, Plata, Ámbar).
     - *Espesores y Composición* (2 mm hasta 10 mm, laminados 3+3, 4+4).
     - *Diseños Catedral* (Cuadriculado, Arabesco, Flora, Llovizna, Gotas).
6. **Entorno de Demostración Guiada (Master Flow):**
   - Barra de control interactiva superior que permite recorrer paso a paso la secuencia completa del sistema (Login → Cotizador → Edición → Confirmación → Compartir → Catálogos).

---

### 6. Especificaciones de UI/UX y Sistema de Diseño

* **Estilo Visual:** *Liquid Glass & Soft UI* (Neumorfismo elegante, superficies translúcidas con blur de fondo y bordes de cristal suave).
* **Paleta de Colores Primaria:**
  - Azul Corporativo: `#1D6AE5` / `#1558C0` (Botones primarios y acentos)
  - Superficie Base: `#F8FAFC` a `#EFF4FB`
  - Paneles de Vidrio: `rgba(255, 255, 255, 0.85)` con `backdrop-filter: blur(16px)`
  - Texto Primario: `#0F172A` (Slate oscuro de alta legibilidad)
  - Éxito / WhatsApp: `#10B981` / `#25D366`
* **Tipografía:** *Plus Jakarta Sans* y *Inter* para interfaz general; *JetBrains Mono* / fuente monoespaciada para el voucher térmico de 80 mm.
* **Branding:** Isotipo tridimensional en acabado cristal líquido y tipografía institucional *DISTRIBUIDORA ARAUJO - Vidriería & Aluminios*.

---

### 7. Roadmap y Fases de Desarrollo

| Fase | Alcance | Estado |
| :--- | :--- | :--- |
| **Fase 1** | UI/UX completo, cotizador dinámico, vouchers 80 mm, PDF A4, vistas WhatsApp y demostración guiada. | **Completado (En Lienzo)** |
| **Fase 2** | Persistencia en base de datos local / nube (PostgreSQL/Supabase) y gestión de clientes recurrentes. | Próxima implementación |
| **Fase 3** | Motor de manufacturas adicionales (cantos pulidos, biseles, perforaciones y saques). | Planificado |
| **Fase 4** | Integración de pasarelas de pago digitales (códigos QR Yape, Plin y transferencias bancarias en cotización). | Planificado |
