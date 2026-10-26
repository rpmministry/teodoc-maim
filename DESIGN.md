# Sistema de diseño — TeoDoc MAIM

## Principios

1. **Contenido primero:** tipografía legible y jerarquía clara; sin adornos que compitan con el texto.
2. **Identidad verificada:** el coral y el crema provienen del logotipo oficial. No se inventan símbolos ni se altera la marca.
3. **Calidez sobria:** fondos crema, tinta profunda y acentos coral; no es una interfaz tecnológica fría ni una plantilla genérica.
4. **Accesibilidad:** foco visible, etiquetas nativas, contraste AA en texto y controles, movimiento reducido.
5. **Trazabilidad:** la fuente, el predicador opcional, la modalidad y la fecha se muestran en los resultados y en el PDF.

## Paleta

| Token | Hex | Uso |
| --- | --- | --- |
| `--coral` | `#f04e59` | Acento oficial, bordes, fondos decorativos |
| `--coralOscuro` | `#b5303b` | Botones, etiquetas pequeñas con texto blanco |
| `--crema` | `#fff8e8` | Fondo principal |
| `--cremaOficial` | `#ffefb4` | Detalles del logotipo y acentos |
| `--tinta` | `#2b1f1e` | Títulos y texto de máximo contraste |
| `--texto` | `#4b3735` | Cuerpo |
| `--muted` | `#7a6662` | Texto secundario |
| `--linea` | `#e8d6c8` | Bordes |
| `--superficie` | `#fbf2e6` | Tarjetas, cajas y citas |

El coral brillante no se usa con texto blanco pequeño (contraste insuficiente). Para etiquetas y botones se usa el coral oscuro.

## Tipografía

- **IBM Plex Sans** (Google Fonts en la web, TTF incrustada en PDF).
- Títulos: peso 600, tracking negativo leve.
- Cuerpo: 13–16 px en pantalla, 10–11.5 pt en PDF.
- Etiquetas: mayúsculas, 9–10.5 px, tracking amplio.
- PDF: Regular, Bold, Italic y BoldItalic incrustadas para conservar acentos y texto seleccionable.

## Componentes

- **Encabezado:** logotipo oficial, producto TeoDoc MAIM y navegación.
- **Tarjeta de identidad:** descripción pública verificada y enlace a la fuente.
- **Formulario:** tres pasos numerados, campos con etiquetas visibles, ayuda contextual y validación al inicio.
- **Selector de modalidad:** tarjetas de radio con icono, público y descripción; el análisis general siempre visible.
- **Resultados:** cabecera oscura, pestañas, secciones numeradas y cajas de cita.
- **Descarga:** botón primario para la modalidad, secundario para el general; aviso con vista previa, compartir y descargar de nuevo.
- **PDF:** portada, ficha de fuente, secciones numeradas, cajas y tablas; coral oscuro para etiquetas.

## Espaciado y formas

- Contenedor máximo 1180 px.
- Radios de 10–22 px.
- Secciones con separadores finos y espacio vertical generoso.
- Sombras cálidas suaves, no negras.
- Retícula responsive: 1 columna en móvil, 2–3 en escritorio.

## Movimiento

- Aparición suave de resultados.
- Barra de progreso y spinner durante la generación.
- Respeta `prefers-reduced-motion`.
- Sin animaciones que bloqueen la lectura.

## PDF

- A4, 72/52 pt de márgenes.
- Portada con banda coral y logotipo.
- Títulos de sección con numeral coral oscuro.
- Citas en cajas crema con barra coral.
- Pies con institución, producto y paginación.
- El bloque de predicador se omite si no existe el dato.
