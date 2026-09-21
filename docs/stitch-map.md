# Mapa STITCH

Inspección inicial: repositorio sin aplicación, Git limpio. Todos los archivos siguientes están bajo `STITCH/stitch_duplicate_of_duplicate_of_vidrieria/`; cada carpeta contiene `code.html` y `screen.png`.

| Carpeta / archivo STITCH | Pantalla | Ruta | Estado | Interacciones | Componentes |
|---|---|---|---|---|---|
| inicio_de_sesi_n_distribuidora_araujo/code.html | Acceso | /login | vacío, enviando, error | ingresar, mostrar contraseña, recordar | LoginForm, Brand |
| cotizador_vista_detallada_sin_editar/code.html | Cotizador | /cotizador | vacío, borrador detallado | seleccionar vidrio, medidas, cantidad, agregar | QuotationBuilder, ItemForm, QuantityControl, QuotationSummary |
| cotizador_vista_compacta_sin_editar/code.html | Cotizador compacto | /cotizador | borrador compacto | alternar vista, eliminar | QuotationSummary |
| cotizador_modo_edici_n_activo_detallado/code.html | Edición | /cotizador | ítem editándose | guardar sin duplicar, cancelar | ItemForm |
| cotizacion_confirmada_versi_n_limpia/code.html | Confirmada | /cotizaciones/[number] | solo lectura | nueva cotización, compartir | QuotationSummary, ShareActions |
| cotizacion_confirmada_opciones_de_compartir_interactivo/code.html | Compartir | /cotizaciones/[number] | modal abierto, copiado, error | copiar, WhatsApp, PDF, imprimir | Dialog, ShareActions |
| vista_previa_formato_whatsapp_texto_limpio/code.html | Mensaje | /cotizaciones/[number] | vista previa | copiar, abrir WhatsApp | ShareActions |
| plantilla_pdf_impresi_n_a4_b_n_sin_logo_distribuidora_araujo/code.html | Documento A4 | /api/cotizaciones/[number]/pdf | documento confirmado | descargar, imprimir | QuotationPdf |
| plantilla_voucher_t_rmico_80mm_distribuidora_araujo/code.html | Ticket | /cotizaciones/[number]/imprimir | papel 80 mm | imprimir | PrintDocument |
| Ampliación funcional aprobada | Voucher interno | /cotizaciones/[number]/interno | ticket térmico 58–80 mm para taller/corte, bloques compactos sin datos económicos | imprimir | InternalVoucherPage, PrintButton |
| cat_logo_principal_de_vidrios_distribuidora_araujo/code.html | Catálogo y modal | /catalogo | alta, edición, error | guardar, cancelar | GlassCatalog, ProductForm, Dialog |
| cat_logo_principal_de_vidrios_vista_completa/code.html | Vidrios | /catalogo | activos, ocultos, todos, vacío | buscar, filtrar, editar, ocultar, reactivar | GlassCatalog, StatusBadge |
| cat_logos_base_gesti_n_de_familias_colores_espesores_y_dise_os/code.html | Familias | /catalogos | alta, edición, vacío | buscar, guardar, ocultar, reactivar | BaseCatalogManager, BaseCatalogForm |
| cat_logos_base_colores_y_acabados/code.html | Colores/acabados | /catalogos | categoría seleccionada | mismas operaciones | BaseCatalogManager |
| cat_logos_base_espesores_y_composici_n/code.html | Espesores | /catalogos | categoría seleccionada | mismas operaciones | BaseCatalogManager |
| cat_logos_base_dise_os_catedral/code.html | Diseños | /catalogos | categoría seleccionada | mismas operaciones | BaseCatalogManager |

## Secuencia completa

Acceso → cotizador vacío → ingresar cliente y agregar líneas → alternar vistas → editar medidas/cantidad o eliminar → confirmar en servidor → número reservado por creación inmutable → detalle histórico → compartir/copiar/PDF/ticket del cliente o voucher interno → nueva cotización. Reiniciar un borrador requiere confirmación. Desde la navegación se accede a vidrios, cuatro catálogos base y al histórico `/cotizaciones`, que busca también por cliente. Lecturas y mutaciones requieren sesión; errores, guardado pendiente y catálogos vacíos tienen estados explícitos. Conflictos de edición requieren recargar.

## Assets y diseño

Logo real disponible en `LOGOS/logo 1 - 3d - glass.png`, coincidente con el isotipo de los HTML. Copiar a `public/brand/logo.png`. Los HTML apuntan a imágenes remotas de Google; no se usarán como dependencia en producción. Capturas solo como referencia. Tipografía Plus Jakarta Sans, azul #1d6ae5, fondo azul/gris, paneles translúcidos, formularios táctiles, columnas 4/8 en cotizador. PDF monocromático sin logo y ticket monoespaciado de 80 mm.

## Adaptaciones funcionales

Prevalece `docs/business-rules.md`. Fórmula exclusiva en `src/domain/quotation/calculation.ts`, con decimal.js: cm / 2.54 → par inmediato → cálculo de merma → salto adicional si la merma es menor que 0.5″ → área / 144 redondeada half-up a 2 decimales → precio unitario half-up a 2 → cantidad. Solo la cotización en pantalla y su detalle histórico muestran la línea gris con pulgadas originales y cobradas, área y precio por pie²; la merma no se muestra y la línea técnica no sale en documentos del cliente. El resumen mantiene el subtotal exacto y el total a cobrar redondeado hacia arriba a un decimal, con el segundo decimal en `0`. Los ejemplos de precios/productos y datos fiscales del mock no se precargan en producción. Las condiciones comerciales se ingresan opcionalmente y quedan congeladas al confirmar; STITCH contiene plazos contradictorios. El borrador muestra el próximo folio como provisional; el folio definitivo se asigna al confirmar. Persistencia central privada; no se implementan fases futuras del roadmap STITCH.

Ampliación autorizada: el formulario incorpora selector Pie²/Plancha entera. Plancha muestra vidrio y cantidad, sin medidas de corte. Cada modo filtra activos con precio disponible (> 0); ambos admiten líneas en un mismo resumen. Resumen, WhatsApp, PDF y ticket identifican la modalidad. Precios vacíos del catálogo se muestran/guardan como `0.00`. Los originales STITCH se conservan.

Selección guiada autorizada: tipo de producto → modalidad → buscador combinado, sin selección inicial automática y con controles dependientes deshabilitados. Las familias cotizables se filtran dentro del buscador mediante chips hasta seis opciones o carpetas cuando hay más; no existe un combo independiente. Se elimina el selector de espesor duplicado. El resultado de vidrio muestra el diseño cuando corresponda, sin el prefijo de familia Catedral, color, grosor, medidas de plancha registradas y SKU pequeño entre paréntesis; no repite la familia. Al cambiar modalidad o familia se limpia el vidrio anterior si deja de estar disponible. Se mantienen los assets y cálculos existentes.

Pie de página actualizado según referencias del usuario: créditos de Distribuidora Araujo/R3 Consulting y valores Calidad, Confianza, Tu proyecto, nuestra prioridad. Texto e iconos vectoriales compactos, dos bloques en escritorio y apilados en móvil; compartido entre acceso y pantallas de la aplicación.

Borrador: indicador ámbar con pulso suave (estático si se solicita movimiento reducido). Se conserva temporalmente en la pestaña al navegar y recargar, incluyendo formulario sin agregar y edición en curso. Confirmar, descartar o cerrar sesión limpia la copia temporal.

Navegación ágil: precarga completa de enlaces principales y reutilización de pantallas en memoria durante 30 segundos. Acción Actualizar datos para solicitar información reciente; guardar continúa invalidando vistas. Solo el borrador se guarda en sessionStorage.

## Ampliación visual `mockapp-v2` — perfiles de aluminio

Las referencias originales de esta iteración están en `mockapp-v2/`. Son documentación local de diseño y datos; la aplicación no depende de esa ruta en runtime.

| Archivo de referencia | Pantalla | Ruta prevista | Estado / interacción | Componentes |
|---|---|---|---|---|
| `ChatGPT Image 20 sept 2026, 20_48_24 (1).png` | Cotizador de vidrio dentro del cotizador unificado | `/cotizador` | pestaña Vidrio, búsqueda, venta por pie²/plancha, resumen separado por tipo | QuotationBuilder, GlassItemForm, QuotationSummary |
| `ChatGPT Image 20 sept 2026, 20_48_24 (2).png` | Cotizador de perfiles y resumen unificado | `/cotizador` | pestaña Perfil, familia, búsqueda, color, metros/barra, cantidad, grupos Vidrios/Perfiles | ProfileItemForm, ProfilePicker, QuotationSummary |
| `ChatGPT Image 20 sept 2026, 20_48_25 (3).png` | Mantenimiento de perfiles de aluminio | `/perfiles` | buscar, filtrar, ver imagen/detalle, crear, editar, ocultar/reactivar | AluminumProfileCatalog, ProfileForm |
| `ChatGPT Image 20 sept 2026, 20_48_25 (4).png` | Catálogos base de perfiles | `/catalogos` | pestañas Vidrios/Perfiles; familias, colores y perfiles/códigos | BaseCatalogManager, AluminumCatalogManager |
| `lista - Rodri.xlsx` (`Hoja1`) | Carga inicial y casos de validación de perfiles | acción de carga inicial, sin dependencia runtime | 21 familias; 143 perfiles únicos; precios Mate/Negro; imágenes técnicas embebidas | AluminumCatalogService, seed versionado |

### Criterios visuales de la ampliación

- Vidrios continúan sin imágenes.
- Perfiles muestran la imagen técnica importada del Excel o un marcador visual explícito cuando el origen no contiene imagen.
- El cotizador conserva el formulario a la izquierda y el resumen a la derecha en escritorio/tablet, y los apila en móvil.
- El panel de agregado ordena tipo → modalidad → buscador único → tarjeta → datos; el buscador usa chips con hasta seis familias y carpetas cuando hay más.
- El resumen separa `Vidrios` y `Perfiles de aluminio`, aunque calcula un único subtotal y total.
- Las imágenes son referencia visual; los datos y fórmulas versionados en el dominio son la fuente de verdad una vez implementados.
