# Identidad institucional

## Fuente verificada

- **Nombre público:** MAIM Casa de Oración
- **Categoría:** Organización religiosa
- **Fuente:** página oficial de Facebook `https://www.facebook.com/casamaialasnaciones`
- **Fecha de consulta:** 26 de octubre de 2026
- **Método:** extracción del bloque público «Acerca de» de la página mediante su plugin oficial de página.

### Descripción pública

> MAIM Casa de Oración, es un Movimiento de Adoración e Intercesión «Maranatha», nuestro anhelo es preparar el camino para el regreso del Amado a través de un corazón ardiente por su presencia y el evangelismo y discipulado en las naciones.

Esta es la única declaración institucional usada en el producto. No se amplió con misión, visión, valores, doctrina, organigrama, autoridades, himnos ni historia porque no se pudieron verificar en una fuente oficial.

## Activos

- `public/institucional/maim-portada.jpg`: logotipo horizontal con el nombre «MAIM Casa de Oración», descargado del material público de la página oficial.
- `public/institucional/maim-perfil.jpg`: isotipo oficial de la llama, descargado del mismo origen.
- `app/icon.png` y `app/apple-icon.png`: copias del isotipo oficial usadas como icono del sitio.
- Se retiraron el favicon y el icono anteriores de TeoDoc.

Los archivos se conservaron sin recortes de marca, sin redibujado y sin cambios de proporción. La aplicación los muestra con `object-fit` natural y proporción 505:350 (logotipo) y 240:240 (isotipo).

## Colores

Muestreo de los activos oficiales:

- Coral: `#f04e59`
- Crema: `#ffefb4`

La interfaz usa además tinta `#2b1f1e`, superficies crema y un coral oscuro `#b5303b` para etiquetas pequeñas con texto blanco, con el fin de cumplir contraste AA. El coral brillante se reserva para fondos decorativos, bordes y elementos no textuales. Estos tonos de apoyo son decisiones de accesibilidad, no una afirmación de que la institución tenga una paleta oficial adicional.

## Límites

- No se localizó un sitio web institucional independiente.
- La página de Facebook respondió 400 a una petición directa; la información se obtuvo mediante el plugin público de página.
- No se verificaron teléfono, dirección, autoridades ni doctrina; por eso no se muestran.
- El nombre oficial se usa como «MAIM Casa de Oración», tal como aparece en la descripción de la fuente. No se le añadió «Iglesia» ni otra denominación.
- El lema del producto «De la prédica al estudio que transforma» es una frase de TeoDoc, no una declaración institucional de MAIM.
- El material generado es un apoyo editorial y debe revisarse con liderazgo pastoral.

## Reproducibilidad

`scripts/verificar-identidad.mts` comprueba:

- la coincidencia de nombre, categoría, descripción, URL y fecha;
- la existencia y tamaño de los activos;
- que los iconos de la aplicación sean copia del isotipo oficial;
- la presencia de los colores oficiales en la hoja de estilos;
- que no se hayan introducido denominaciones, misión o visión inventadas;
- que la documentación declare la fuente y el alcance.
