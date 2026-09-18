# Mapa STITCH

Inspección inicial: repositorio sin aplicación, Git limpio. Todos los archivos siguientes están bajo `STITCH/stitch_duplicate_of_duplicate_of_vidrieria/`; cada carpeta contiene `code.html` y `screen.png`.

| Carpeta / archivo STITCH | Pantalla | Ruta | Estado | Interacciones | Componentes |
|---|---|---|---|---|---|
| inicio_de_sesi_n_distribuidora_araujo/code.html | Acceso | /login | vacío, enviando, error | ingresar, mostrar contraseña, recordar | LoginForm, Brand |
| cotizador_vista_detallada_sin_editar/code.html | Cotizador | /cotizador | vacío, borrador detallado | seleccionar vidrio, medidas, cantidad, agregar | QuotationBuilder, ItemForm, QuantityControl, QuotationSummary |
| cotizador_vista_compacta_sin_editar/code.html | Cotizador compacto | /cotizador | borrador compacto | alternar vista, eliminar | QuotationSummary |
| cotizador_modo_edici_n_activo_detallado/code.html | Edición | /cotizador | ítem editándose | guardar sin duplicar, cancelar | ItemForm |
| proforma_confirmada_versi_n_limpia/code.html | Confirmada | /proformas/[number] | solo lectura | nueva proforma, compartir | QuotationSummary, ShareActions |
| proforma_confirmada_opciones_de_compartir_interactivo/code.html | Compartir | /proformas/[number] | modal abierto, copiado, error | copiar, WhatsApp, PDF, imprimir | Dialog, ShareActions |
| vista_previa_formato_whatsapp_texto_limpio/code.html | Mensaje | /proformas/[number] | vista previa | copiar, abrir WhatsApp | ShareActions |
| plantilla_pdf_impresi_n_a4_b_n_sin_logo_distribuidora_araujo/code.html | Documento A4 | /api/proformas/[number]/pdf | documento confirmado | descargar, imprimir | QuotationPdf |
| plantilla_voucher_t_rmico_80mm_distribuidora_araujo/code.html | Ticket | /proformas/[number]/imprimir | papel 80 mm | imprimir | PrintDocument |
| cat_logo_principal_de_vidrios_distribuidora_araujo/code.html | Catálogo y modal | /catalogo | alta, edición, error | guardar, cancelar | GlassCatalog, ProductForm, Dialog |
| cat_logo_principal_de_vidrios_vista_completa/code.html | Vidrios | /catalogo | activos, ocultos, todos, vacío | buscar, filtrar, editar, ocultar, reactivar | GlassCatalog, StatusBadge |
| cat_logos_base_gesti_n_de_familias_colores_espesores_y_dise_os/code.html | Familias | /catalogos | alta, edición, vacío | buscar, guardar, ocultar, reactivar | BaseCatalogManager, BaseCatalogForm |
| cat_logos_base_colores_y_acabados/code.html | Colores/acabados | /catalogos | categoría seleccionada | mismas operaciones | BaseCatalogManager |
| cat_logos_base_espesores_y_composici_n/code.html | Espesores | /catalogos | categoría seleccionada | mismas operaciones | BaseCatalogManager |
| cat_logos_base_dise_os_catedral/code.html | Diseños | /catalogos | categoría seleccionada | mismas operaciones | BaseCatalogManager |

## Secuencia completa

Acceso → cotizador vacío → agregar líneas → alternar vistas → editar medidas/cantidad o eliminar → confirmar en servidor → número reservado por creación inmutable → detalle histórico → compartir/copiar/PDF/ticket → nueva proforma. Reiniciar un borrador requiere confirmación. Desde la navegación se accede a vidrios, cuatro catálogos base y al histórico `/proformas` (pantalla funcional adicional). Lecturas y mutaciones requieren sesión; errores, guardado pendiente y catálogos vacíos tienen estados explícitos. Conflictos de edición requieren recargar.

## Assets y diseño

Logo real disponible en `LOGOS/logo 1 - 3d - glass.png`, coincidente con el isotipo de los HTML. Copiar a `public/brand/logo.png`. Los HTML apuntan a imágenes remotas de Google; no se usarán como dependencia en producción. Capturas solo como referencia. Tipografía Plus Jakarta Sans, azul #1d6ae5, fondo azul/gris, paneles translúcidos, formularios táctiles, columnas 4/8 en cotizador. PDF monocromático sin logo y ticket monoespaciado de 80 mm.

## Adaptaciones funcionales

Prevalece `docs/business-rules.md`. Fórmula exclusiva en `src/domain/quotation/calculation.ts`, con decimal.js: cm / 2.54 → par más cercano HALF_UP + 2 pulgadas → área / 144 redondeada half-up a 2 decimales → precio unitario half-up a 2 → cantidad → múltiplo superior de 0.05. Total = suma de importes. Los ejemplos de precios/productos y datos fiscales del mock no se precargan en producción. Las condiciones comerciales se ingresan opcionalmente y quedan congeladas al confirmar; STITCH contiene plazos contradictorios. El borrador muestra el próximo folio como provisional; el folio definitivo se asigna al confirmar. Persistencia central privada; no se implementan fases futuras del roadmap STITCH.

Ampliación autorizada: el formulario incorpora selector Pie²/Plancha entera. Plancha muestra vidrio y cantidad, sin medidas de corte. Cada modo filtra activos con precio disponible (> 0); ambos admiten líneas en un mismo resumen. Resumen, WhatsApp, PDF y ticket identifican la modalidad. Precios vacíos del catálogo se muestran/guardan como `0.00`. Los originales STITCH se conservan.

Selección guiada autorizada: modalidad → familia → vidrio, sin selección inicial automática y con controles dependientes deshabilitados. Se elimina el selector de espesor duplicado. El combo de vidrio muestra el diseño cuando corresponda, sin el prefijo de familia Catedral, color, grosor, medidas de plancha registradas y SKU pequeño entre paréntesis; no repite la familia. Al cambiar modalidad/familia se limpia el vidrio anterior. Se mantienen los assets y cálculos existentes.

Pie de página actualizado según referencias del usuario: créditos de Distribuidora Araujo/R3 Consulting y valores Calidad, Confianza, Tu proyecto, nuestra prioridad. Texto e iconos vectoriales compactos, dos bloques en escritorio y apilados en móvil; compartido entre acceso y pantallas de la aplicación.

Borrador: indicador ámbar con pulso suave (estático si se solicita movimiento reducido). Se conserva temporalmente en la pestaña al navegar y recargar, incluyendo formulario sin agregar y edición en curso. Confirmar, descartar o cerrar sesión limpia la copia temporal.

Navegación ágil: precarga completa de enlaces principales y reutilización de pantallas en memoria durante 30 segundos. Acción Actualizar datos para solicitar información reciente; guardar continúa invalidando vistas. Solo el borrador se guarda en sessionStorage.

Corrección dimensional autorizada: redondear las pulgadas al par más cercano y sumar 2. UI y salidas mantienen el único motor del dominio; importes monetarios y snapshots históricos se conservan con sus reglas existentes.
