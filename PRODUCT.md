# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Expositores bíblicos, pastores, maestros de doctrina, líderes ministeriales, seminaristas y estudiantes de teología que preparan, evalúan o estudian mensajes y enseñanzas cristianas para la edificación comunitaria y el crecimiento ministerial.

## Product Purpose
TeoDoc es una herramienta de análisis homilético y exegético de alto rigor teológico. Transcribe y analiza enseñanzas en audio (o fuentes digitales) para extraer con fidelidad la estructura expositiva: idea central, propósito del mensaje, contexto histórico y literario, puntos doctrinales desarrollados, exégesis bíblica y aplicaciones ministeriales prácticas. Genera materiales de estudio estructurados tanto en formato imprimible para archivo (PDF A4) como en láminas editoriales para divulgación digital (Infografía 9:16 de 1080×1920).

## Positioning
A diferencia de herramientas genéricas de transcripción o resúmenes automatizados con IA, TeoDoc aplica un clasificador de riqueza teológica y un marco metodológico homilético estricto que respeta la hermenéutica bíblica, el contexto de los pasajes y el rigor conceptual, prohibiendo terminología reduccionista (como "prédica" o "predicador", prefiriendo "mensaje" y "expositor").

## Operating Context
- Preparación y perfeccionamiento de mensajes expositivos en escritorios y dispositivos móviles.
- Impresión en papel A4 y archivado en carpetas de anillado/perforación para notas de estudio.
- Comunicación visual y difusión pastoral en plataformas móviles (WhatsApp Status, Instagram Stories) mediante infografías verticales de alta definición.
- Uso en entornos de iglesia y estudio bíblico con interacción fluida y sin distracciones.

## Capabilities and Constraints
- **Subida y transcripción de audio:** Procesamiento de archivos de audio locales con retroalimentación visual continua.
- **Rigor terminológico:** Uso de "mensaje", "enseñanza", "expositor" (prohibido "prédica" y "predicador").
- **Lienzo de infografía fijo:** 1080×1920 px (relación de aspecto 9:16 estricta, retícula de 8 px, áreas seguras de 64 px superior/inferior y 48 px laterales).
- **Documento PDF A4 editorial:** Margen interior de argollado de 98 pt (~35 mm) y exterior de 54 pt, con prevención estricta de líneas o encabezados huérfanos.
- **Flujo 100% en la misma ventana:** Sin apertura de pestañas en blanco (`about:blank`) en iOS ni ventanas emergentes intrusivas; entrega ágil a través de banner persistente y modal con visor integrado y Web Share nativo.

## Brand Commitments
- **Nombre:** TeoDoc.
- **Estética:** Sistema de diseño IBM Carbon (Carbon Design System), sobrio, técnico, funcional, libre de "AI slop" o decoraciones superfluas.
- **Paleta tonal:** Carbón oscuro profundo (`#161616`), superficies (`#262626`), bordes estructurales (`#393939`), acento azul Carbon (`#0f62fe` / `#0043ce`), tipografía clara de alto contraste (`#ffffff`, `#f4f4f4`, `#c6c6c6`).
- **Ilustraciones:** Vectoriales puras, temáticas teológicas bíblicas (sin recursos remotos, 100% offline).

## Evidence on Hand
- Componentes visuales y de diagramación: [`components/infografia.tsx`](file:///c:/Users/Alsiz/analizador-ministerial/components/infografia.tsx).
- Motor de cálculo y retícula editorial: [`lib/infografia-layout.ts`](file:///c:/Users/Alsiz/analizador-ministerial/lib/infografia-layout.ts).
- Interfaz principal y exportador de documentos: [`app/page.tsx`](file:///c:/Users/Alsiz/analizador-ministerial/app/page.tsx).
- Suite de pruebas de invariantes: [`scripts/verificar-entrega.mts`](file:///c:/Users/Alsiz/analizador-ministerial/scripts/verificar-entrega.mts).

## Product Principles
1. **Fidelidad Exegética y Claridad:** La estructura teológica prevalece sobre cualquier adorno; cada título, cita y aplicación debe ser legible al instante.
2. **Respeto a la Experiencia de Lectura:** Jerarquía visual estricta y tipografía de precisión suiza inspirada en IBM Carbon.
3. **Robustez y Portabilidad Universal:** El usuario nunca debe ser sorprendido por fallos de plataforma (como pestañas en blanco en Safari o PDFs no legibles); todo funciona de forma predecible y nativa.
