# Modalidades de TeoDoc MAIM

Todas las modalidades parten del mismo contenido real y conservan el **análisis general**. La modalidad seleccionada añade una segunda generación especializada; no reemplaza el análisis.

## Identificadores y documentos

| ID | Nombre | Archivo |
| --- | --- | --- |
| `general` | Análisis general | `teodoc-maim-analisis-general.pdf` |
| `grupos` | Grupos pequeños, células y familias | `teodoc-maim-grupos-pequenos.pdf` |
| `jovenes` | Jóvenes | `teodoc-maim-jovenes.pdf` |
| `ninos` | Clase bíblica infantil | `teodoc-maim-clase-infantil.pdf` |
| `devocionales` | Devocionales de siete días | `teodoc-maim-devocionales-7-dias.pdf` |

La fuente canónica de estas definiciones es `lib/modalidades.ts`.

## Análisis general

Campos preservados de la versión anterior:

- título, idea principal, tema y propósito;
- texto bíblico principal y otros textos;
- contexto general, bíblico, histórico y literario;
- relación entre textos e interpretación presentada por el expositor;
- desarrollo progresivo con puntos, subtemas y versículos;
- enseñanzas, conceptos clave y conceptos teológicos;
- aplicación, conclusión y oración.

La profundidad depende del contenido real. Las secciones sin sustento se devuelven vacías; no se inventan para completar una plantilla.

## Grupos pequeños, células y familias

Estructura normalizada:

- objetivo, idea central y contexto del pasaje;
- agenda con momento, tiempo y descripción;
- materiales;
- preguntas de inicio, comprensión y reflexión;
- actividad con objetivo y pasos;
- caso práctico;
- aplicaciones y compromiso semanal;
- motivos de oración y oración final;
- orientaciones para el líder.

Público: líderes de células, grupos pequeños y familias.

## Jóvenes

Estructura normalizada:

- objetivo, tema y contexto;
- conceptos fundamentales;
- preguntas de reflexión individual y conversación grupal;
- casos prácticos;
- dinámica participativa;
- aplicaciones y desafío semanal;
- motivos de oración y guía para el líder.

No se imponen temas generacionales que la prédica no aborde.

## Niños

Estructura normalizada:

- objetivo de aprendizaje y duración;
- relato bíblico por partes;
- versículo clave y explicación sencilla;
- preguntas de comprensión;
- actividad y juego con materiales y pasos;
- aplicación para el niño y actividad familiar;
- oración de cierre;
- recomendaciones para el maestro.

Rangos de edad:

- `3-5`: primera infancia.
- `6-8`: niños pequeños.
- `9-12`: niños mayores.

El rango es obligatorio para esta modalidad. El material evita dinámicas humillantes, miedo, culpa innecesaria y materiales peligrosos.

## Devocionales de siete días

Estructura normalizada:

- introducción y propósito;
- siete jornadas con día, título, tema, lectura principal, lecturas complementarias, contexto, reflexión, enseñanza central, pregunta de introspección, aplicación, acción y oración;
- progresión temática: comprensión, reflexión, aplicación y consolidación.

Si el contenido no permite siete jornadas sin inventar, el servidor devuelve las jornadas sustentables, la interfaz muestra una advertencia y el PDF incluye una nota editorial. No se rellenan días con contenido genérico.

## Personalización y límites

- El **predicador o expositor** se guarda como metadato separado del texto. No se usa para inventar una biografía, cargos o trayectoria.
- El título proporcionado por el usuario prevalece sobre el título sugerido por el modelo.
- La fecha de la prédica es opcional.
- El nombre no se envía como instrucción biográfica al modelo; se aplica en la cabecera de resultados y en el PDF.
- Las citas bíblicas se presentan en Reina-Valera 1960.
- El material debe revisarse pastoralmente antes de enseñarse.
