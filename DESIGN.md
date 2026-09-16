---
name: TeoDoc Design System
description: Sistema de diseño sobrio, reverente y de alta precisión editorial basado en IBM Carbon Design System.
colors:
  background: "#161616"
  surface: "#262626"
  surface-hover: "#353535"
  border: "#393939"
  border-subtle: "#525252"
  primary: "#0f62fe"
  primary-hover: "#0353e9"
  primary-active: "#0043ce"
  primary-deep: "#002d9c"
  accent-light: "#78a9ff"
  accent-subtle: "#a6c8ff"
  text-primary: "#ffffff"
  text-secondary: "#f4f4f4"
  text-muted: "#c6c6c6"
  text-dim: "#8d8d8d"
  success: "#24a148"
  warning: "#f1c21b"
  danger: "#da1e28"
  light-surface: "#ffffff"
  light-background: "#f4f4f4"
  light-border: "#e0e0e0"
  light-text: "#161616"
typography:
  display:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.08em"
  caption:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  safe: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.none}"
    padding: "10px 18px"
---

# Design System: TeoDoc (IBM Carbon Editorial)

## Overview
TeoDoc adopta la disciplina austera, técnica y funcional de **IBM Carbon Design System**. Combina una paleta oscura de alta inmersión (`#161616`) con acentos azul IBM (`#0f62fe`), tipografía de precisión (`IBM Plex Sans` y `IBM Plex Mono`), y una retícula matemática estricta de base 8 px. La meta es eliminar todo artificio visual redundante o "AI slop" (sombras pesadas, gradientes púrpuras, bordes redondeados excesivos) para otorgar máxima reverencia, legibilidad y dignidad al estudio exegético.

## Colors
- **Fondos principales:**
  - `background`: `#161616` (Gris Carbón 100). Fondo universal de la aplicación web y lámina oscura.
  - `surface`: `#262626` (Gris Carbón 90). Tarjetas contenedoras de análisis, bloques exegéticos y formularios.
  - `surface-hover`: `#353535` (Gris Carbón 80). Estados hover de botones secundarios y tarjetas interactivas.
- **Bordes y separadores:**
  - `border`: `#393939` (Gris Carbón 70). Líneas estructuradas de 1 px que delimitan secciones.
  - `border-subtle`: `#525252` (Gris Carbón 60). Bordes de botones secundarios y componentes interactivos.
- **Acentos e identidad:**
  - `primary`: `#0f62fe` (Azul Carbon 60). Acento primario para acciones clave, barras de progreso y enlaces.
  - `primary-hover`: `#0353e9` (Azul Carbon 60 Hover).
  - `primary-active`: `#0043ce` (Azul Carbon 70). Retroalimentación activa y selección.
  - `primary-deep`: `#002d9c` (Azul Carbon 80). Badges de estado ("Análisis completo") y fondos de insignia.
  - `accent-light`: `#78a9ff` (Azul Carbon 40). Textos de sobretítulo y metadatos sobre fondo carbón.
  - `accent-subtle`: `#a6c8ff` (Azul Carbon 30). Indicadores puntuales y luces de estado.
- **Estados funcionales:**
  - `success`: `#24a148` (Verde 50 - Archivo generado con éxito).
  - `warning`: `#f1c21b` (Amarillo 30 - Avisos de contenido/audio).
  - `danger`: `#da1e28` (Rojo 60 - Errores de análisis o conexión).

## Typography
- **Plex Sans:** Lectura editorial de alta legibilidad, geometría limpia y proporciones humanistas.
  - `Display / Título de mensaje:` 48–60 px (móvil 32–40 px), peso 800 (ExtraBold), interlineado 1.08, interletrado sutilmente comprimido.
  - `Encabezados de sección (H3):` 20–24 px, peso 700 (Bold), texto blanco `#ffffff`.
  - `Cuerpo de texto / Exégesis:` 15–16 px, peso 400 (Regular), interlineado 1.6, color `#f4f4f4`.
  - `Citas e Idea Central:` 18–20 px, estilo itálica, peso regular, interlineado fluido.
- **Plex Mono:** Para metadatos técnicos, numeración, referencias bíblicas y badges de auditoría.
  - 11–12 px, peso 600, mayúsculas, interletrado expandido (+0.08em).

## Layout
- **Retícula Base de 8 px (`GRID_BASE = 8`):** Todo espaciado vertical y horizontal es múltiplo de 8 (8, 16, 24, 32, 48, 64).
- **Lienzo Infografía 9:16 Fijo:** Ancho estricto 1080 px, alto estricto 1920 px. Nunca se estira dinámicamente. Safe zones de 64 px superior/inferior y 48 px laterales para proteger el contenido en Stories y WhatsApp.
- **Documento PDF A4:** Ancho 595.28 pt, alto 841.89 pt. Margen interior de argollado de 98 pt (~35 mm) para encuadernación segura sin invadir textos, y margen exterior de 54 pt.
- **Responsividad Web:** Flujo vertical fluido con contención máxima en `max-w-4xl` para texto y `max-w-6xl` para paneles comparativos.

## Elevation & Depth
- **Estructura Plana y Tonal (Flat & Tonal Layering):** En coherencia con IBM Carbon, la jerarquía se establece mediante contraste tonal (`#161616` → `#262626` → `#353535`) y bordes de 1 px (`#393939`), en lugar de sombras borrosas.
- **Sombras Funcionales:** Únicamente reservadas para componentes flotantes de alta prioridad:
  - Banner inferior: `shadow-[0_16px_40px_rgba(0,0,0,0.6)]`.
  - Modal de visor: `shadow-2xl`.

## Shapes
- **Rigor Geométrico:** Esquinas predominantemente rectas (`rounded: 0px` o `rounded-sm: 2px`) para controles, botones y contenedores de datos.
- **Elementos redondeados específicos:** Únicamente para badges tipo pastilla (`rounded-full`), indicadores de estado (`w-2 h-2 rounded-full`) y el orbe de carga.

## Components
- **Botón Primario:** Fondo `#0f62fe`, texto `#ffffff`, altura 44 px (touch target accesible), hover `#0353e9`.
- **Botón Secundario:** Fondo transparente, borde 1 px `#6f6f6f`, texto `#f4f4f4`, hover `#353535`.
- **Banner de Archivo:** Contenedor inferior blanco (`#ffffff`) con contraste inverso para llamar la atención inmediata del usuario sin tapar el contenido principal.
- **Visor Modal In-App:** Contenedor `#1e1e1e` con borde `#393939`, previsualizador embebido que escala al 100% de la pantalla sin scroll horizontal forzado.

## Do's and Don'ts
- **DO:**
  - Mantener los contrastes de texto siempre por encima de WCAG AA (mínimo 4.5:1 para texto normal, 3:1 para texto grande).
  - Respetar la terminología: "mensaje", "enseñanza", "expositor".
  - Mantener el flujo 100% en la misma ventana (sin abrir pestañas en blanco en Safari).
  - Usar siempre ilustraciones vectoriales offline integradas.
- **DON'T:**
  - NUNCA usar la palabra "prédica" o "predicador".
  - NUNCA usar gradientes multicolores o estética púrpura "AI-vibecoding".
  - NUNCA permitir que el lienzo de la infografía exceda o reduzca sus 1080×1920 px.
  - NUNCA colocar texto o numerales dentro de los 98 pt de margen de argollado del PDF.
