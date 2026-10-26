# PROMPT MAESTRO DEFINITIVO — TEODOC MAIM

**Tipo de documento:** especificación maestra de desarrollo  
**Producto:** TeoDoc MAIM  
**Repositorio de origen:** https://github.com/rpmministry/teodoc-app  
**Fuente institucional que debe verificarse:** https://www.facebook.com/casamaialasnaciones  
**Idioma de trabajo y documentación:** español  

---

## 1. Misión y resultado esperado

Actúa como un equipo sénior multidisciplinario de arquitectura de software, desarrollo full-stack, inteligencia artificial, análisis bíblico y teológico, pedagogía cristiana, UX/UI, diseño editorial, seguridad y aseguramiento de calidad.

Tu misión es crear un fork independiente del proyecto original TeoDoc y convertirlo en **TeoDoc MAIM**, una plataforma para transformar prédicas y enseñanzas cristianas en análisis y materiales prácticos para distintos contextos ministeriales.

El producto final debe conservar el análisis general existente y añadir cuatro modalidades especializadas:

1. Estudios para grupos pequeños, células y reuniones familiares.
2. Estudios y actividades para jóvenes.
3. Clases y materiales bíblicos para niños, adaptados por edad.
4. Devocionales diarios organizados en un plan de siete días.

La aplicación debe permitir identificar la prédica y, cuando se conozca, registrar el **nombre de quien predica**. Cada modalidad debe generar un documento PDF descargable, bien estructurado, visualmente profesional y personalizado con los datos proporcionados.

La identidad gráfica debe reflejar la marca **TeoDoc MAIM** y la identidad institucional de la iglesia cuyo sitio oficial se indica en este documento. Antes de aplicar su nombre, logotipo, colores o supuestos doctrinales, verifica la información directamente en fuentes oficiales.

No te limites a escribir un plan: inspecciona el repositorio, implementa los cambios, ejecuta pruebas, corrige errores y documenta únicamente resultados comprobados.

## 2. Fuentes oficiales y reglas de verificación

- Repositorio original: https://github.com/rpmministry/teodoc-app
- Página oficial de la iglesia: https://www.facebook.com/casamaialasnaciones
- Nombre exacto de la nueva aplicación: **TeoDoc MAIM**.
- Nombre sugerido del nuevo repositorio: `teodoc-maim`.

Investiga la página oficial y, si hace falta, otras fuentes oficiales relacionadas. Verifica la denominación exacta de la iglesia, escritura, siglas, logotipo vigente, colores, misión, visión, principios y orientación ministerial disponibles públicamente.

**No inventes ni des por confirmado el nombre de la iglesia, sus siglas, colores institucionales, eslóganes o doctrina.** Si no puedes verificar un dato, registra la limitación y continúa con tareas técnicas que no dependan de él. No publiques una identidad institucional basada en suposiciones.

Distingue el nombre del producto (**TeoDoc MAIM**) del nombre oficial de la iglesia. No reemplaces uno por el otro.

## 3. Modo de trabajo autónomo y límites

Trabaja secuencialmente por fases y continúa automáticamente cuando una fase esté validada, sin solicitar autorización en cada etapa ordinaria. No esperes aprobaciones innecesarias para revisar código, implementar funcionalidades, ejecutar pruebas, corregir regresiones o actualizar documentación.

Mantén estos límites:

- No modifiques el repositorio original.
- No despliegues en producción.
- No generes gastos ni contrates servicios sin autorización.
- No publiques secretos, claves API, credenciales ni datos sensibles.
- No borres datos de producción.
- No realices operaciones destructivas ni fuerces cambios remotos sin comprobar sus consecuencias.
- No afirmes haber creado un fork, ejecutado pruebas o desplegado algo si no puedes verificarlo.
- Si una operación remota requiere un permiso que no tienes, documenta el bloqueo y continúa con las tareas locales independientes.
- No cambies el propósito del proyecto ni elimines funciones compartidas por conveniencia.

Realiza commits locales claros si el entorno lo permite. No hagas push, merge ni despliegue automáticamente si ello puede afectar ramas compartidas o entornos remotos; documenta el estado y las instrucciones pendientes.

## 4. Fase 0 — Auditoría técnica y línea base

Antes de cambiar el código, audita el repositorio completo. Inspecciona, según exista:

- Arquitectura frontend y backend, rutas, componentes y servicios.
- Flujo de entrada de texto y procesamiento de audio/transcripción.
- Proveedores de IA, modelos, instrucciones, reintentos y mecanismos de respaldo.
- Esquemas de datos, formatos de respuesta y validaciones.
- Análisis general: estructura, contenido, referencias bíblicas y aplicaciones.
- Generación, previsualización y descarga de PDF.
- Generación de infografías y sus dependencias.
- Variables de entorno, seguridad, límites de archivos y manejo de errores.
- Pruebas, scripts, dependencias, compilación y documentación.

No asumas que una funcionalidad existe o funciona porque aparezca mencionada en la documentación. Comprueba el código y la ejecución real.

Antes de modificar:

1. Ejecuta las pruebas disponibles.
2. Comprueba instalación, ejecución y compilación cuando sea posible.
3. Registra errores preexistentes y limitaciones del entorno.
4. Guarda una muestra reproducible del análisis general original.
5. Genera un PDF de referencia, si el sistema lo permite.
6. Crea una lista de componentes que deben conservarse, adaptarse, ampliarse o retirarse.

Utiliza esta línea base para las pruebas de regresión posteriores.

## 5. Fase 1 — Crear un fork independiente

Crea un fork independiente desde `https://github.com/rpmministry/teodoc-app`, con el nombre `teodoc-maim` si está disponible y los permisos lo permiten.

- Conserva la atribución al proyecto original y el historial en la medida que permita la plataforma.
- Mantén intacto el repositorio fuente.
- Configura correctamente la referencia al origen.
- Comprueba ramas, permisos, URL y contenido del nuevo repositorio.
- Evita dependencias de rutas locales de la máquina de desarrollo.
- Actualiza nombre, metadatos y textos pertinentes a TeoDoc MAIM.

Si no puedes crear el fork remoto, prepara una copia de trabajo independiente de forma segura y documenta el permiso o paso externo que falta. No declares creado el repositorio hasta comprobarlo.

## 6. Fase 2 — Identidad visual y experiencia de usuario

Diseña una interfaz moderna, cálida, sobria, accesible y adaptable a computadora, tableta y teléfono. Debe ser sencilla para pastores, predicadores, líderes de grupos, maestros y miembros de la congregación.

### Identidad institucional

- Obtén el logotipo de la iglesia desde una fuente oficial o un recurso autorizado.
- Utiliza la denominación oficial solo después de verificarla.
- Analiza los colores y lineamientos disponibles públicamente.
- Conserva las proporciones e integridad de ambos logotipos.
- Diseña una composición para la cabecera y variantes adecuadas para los PDF.
- No fusiones las marcas hasta hacerlas indistinguibles ni reconstruyas símbolos institucionales por conjetura.

Si el acceso a las imágenes o información oficial falla, documenta la limitación y utiliza componentes provisionales claramente identificados como temporales; no inventes el logotipo oficial.

### Interfaz

Organiza el flujo de forma comprensible:

1. Datos de identificación de la prédica.
2. Entrada de transcripción o texto y, si está implementado, carga de audio.
3. Selector de modalidad.
4. Opciones particulares de la modalidad elegida.
5. Inicio del análisis.
6. Consulta de resultados por pestañas.
7. Generación y descarga del PDF correspondiente.

Incluye estados de carga, validación, éxito y error. Mantén accesibilidad, contraste, jerarquía visual, espaciado consistente y controles con acciones reales. Evita el exceso de texto en pantalla, adornos superfluos y botones inactivos.

Actualiza o crea un sistema de diseño con colores verificados, tipografía, tamaños, espaciado, componentes, iconografía, estados interactivos y criterios de accesibilidad. No copies sin permiso una identidad visual ajena.

## 7. Fase 3 — Datos de identificación y personalización con el predicador

Esta funcionalidad es obligatoria. Antes de generar el análisis, permite introducir los datos que se conozcan de la prédica.

Campos recomendados:

- **Título de la prédica:** editable; opcional si puede extraerse de la transcripción y el usuario confirma o acepta el título sugerido.
- **Nombre del predicador o expositor:** opcional y editable.
- **Fecha de la prédica:** opcional.
- **Transcripción o texto del mensaje:** entrada principal.
- **Archivo de audio:** disponible cuando se conserve la funcionalidad original de audio.
- **Modalidad de análisis:** debe seleccionarse antes de iniciar la generación.
- **Rango de edad:** aparece al seleccionar el análisis infantil.

El nombre del predicador debe viajar como metadato separado del texto transcrito. Cuando se haya proporcionado, úsalo para personalizar de manera coherente:

- Portada o encabezado del resultado.
- Identificación de la prédica de origen.
- Cabecera de cada análisis especializado.
- Metadatos editoriales pertinentes.
- PDF descargado.
- Nombre de archivo, cuando sea útil y sin exponer datos innecesarios.

Ejemplo ilustrativo:

> **Título de la prédica:** La fe que transforma  
> **Predicador:** Nombre introducido por el usuario  
> **Material elaborado con:** TeoDoc MAIM

No dejes marcadores vacíos ni muestres el campo si no se proporcionó el nombre. Si el nombre está vacío, el análisis debe funcionar sin penalizaciones.

La personalización debe basarse en el contenido real de la prédica, el nombre suministrado, el título y fecha si existen, la audiencia y el énfasis elegido. No basta con sustituir el nombre en una plantilla genérica.

**Límites para la IA:** no infieras la personalidad, biografía, cargos, afiliaciones, creencias o intención del predicador solo por su nombre. No inventes biografías ni le atribuyas frases o doctrinas que no aparezcan en la transcripción. Diferencia las palabras de quien predica de las explicaciones o aplicaciones redactadas por la IA. El nombre identifica la fuente; no debe alterar artificialmente las conclusiones del análisis.

## 8. Fase 4 — Preservar el análisis general original

La conservación del análisis general de TeoDoc es una condición crítica de aceptación.

No lo elimines, sustituyas ni simplifiques para facilitar las nuevas modalidades. Preserva, según la implementación real, el procesamiento de la prédica, identificación del tema e idea principal, organización de enseñanzas, extracción de referencias bíblicas, análisis, aplicaciones prácticas y exportación existente.

Reutiliza los componentes y servicios originales cuando sea apropiado. Si debes modificar un esquema de datos compartido, mantén la compatibilidad con el análisis general y documenta la decisión.

Implementa pruebas de regresión que comparen entradas iguales en la versión original y la nueva. Comprueba que no desaparezcan secciones útiles, referencias o funciones. Si aparece una regresión, corrígela antes de cerrar la fase.

## 9. Fase 5 — Selector de énfasis

Antes de comenzar el procesamiento, el usuario debe elegir una de estas cinco modalidades:

1. **Análisis general.**
2. **Grupos pequeños, células y reuniones familiares.**
3. **Jóvenes.**
4. **Niños.**
5. **Devocionales de siete días.**

Cada opción debe incluir una descripción breve. La selección tiene que controlar las instrucciones de IA, la estructura de salida y la plantilla del PDF; no puede ser un filtro meramente decorativo.

Mantén disponible el análisis general original. La modalidad elegida debe añadir el desarrollo específico que corresponda sin alterar inesperadamente el resultado general. Reutiliza resultados estructurados comunes cuando sea viable para evitar llamadas costosas o redundantes.

## 10. Fase 6 — Estudio para grupos pequeños, células y familias

Genera una guía que permita a un líder dirigir un estudio participativo en un hogar o grupo pequeño. Incluye, según corresponda:

1. Título y referencia a la prédica de origen.
2. Nombre del predicador si se proporcionó.
3. Objetivo espiritual y formativo.
4. Idea central del mensaje.
5. Texto bíblico principal y referencias complementarias verificadas.
6. Contexto del pasaje y explicación de las enseñanzas.
7. Preguntas abiertas de inicio.
8. Preguntas de comprensión bíblica.
9. Preguntas de reflexión y aplicación.
10. Actividad grupal conectada con el mensaje.
11. Caso práctico para debatir, si es pertinente.
12. Aplicaciones para la vida individual y familiar.
13. Compromiso práctico para la semana.
14. Motivos de oración y oración final sugerida.
15. Orientaciones para el líder y recomendaciones de facilitación.
16. Agenda con tiempos aproximados y materiales necesarios.

Las preguntas deben fomentar diálogo, comprensión y aplicación, no solo repetición memorística. Ofrece instrucciones suficientes para que el líder utilice el estudio sin tener que reconstruirlo. No agregues enseñanzas no fundamentadas en la prédica o en el texto bíblico.

## 11. Fase 7 — Estudio especializado para jóvenes

Transforma la prédica en una guía relevante para adolescentes y jóvenes, con lenguaje apropiado y aplicaciones reales. Incluye:

1. Título, tema y objetivo del encuentro.
2. Nombre del predicador, cuando esté disponible.
3. Pasaje principal y referencias complementarias.
4. Explicación contextual y conceptos fundamentales.
5. Preguntas de reflexión individual.
6. Preguntas para conversación grupal.
7. Casos prácticos relacionados con la enseñanza.
8. Dinámica o actividad participativa con objetivo definido.
9. Aplicaciones cotidianas.
10. Desafío espiritual y compromiso semanal.
11. Motivos de oración.
12. Guía para el líder juvenil.

Según el tema, pueden abordarse amistades, familia, estudios, decisiones, identidad, responsabilidad, relaciones y crecimiento espiritual. No fuerces temas que no se relacionen con la prédica. Evita estereotipos generacionales, lenguaje artificialmente juvenil y afirmaciones sin fundamento.

## 12. Fase 8 — Clase bíblica para niños

Ofrece un selector de edad:

- **3 a 5 años:** primera infancia.
- **6 a 8 años:** niños pequeños.
- **9 a 12 años:** niños mayores.

El rango seleccionado debe adaptar el vocabulario, la explicación, la complejidad, la duración y las actividades. Diseña la implementación para que sea posible ampliar las franjas posteriormente.

Cada clase debe incluir:

1. Título y tema central.
2. Nombre del predicador, si se proporcionó.
3. Objetivo de aprendizaje.
4. Referencia al pasaje bíblico original.
5. Relato o explicación ajustada a la edad.
6. Versículo clave y explicación sencilla.
7. Preguntas de comprensión.
8. Actividad didáctica relacionada con el aprendizaje.
9. Juego, dinámica o manualidad cuando proceda.
10. Materiales necesarios.
11. Instrucciones paso a paso para el maestro.
12. Duración aproximada.
13. Aplicación práctica para el niño.
14. Actividad para compartir en familia.
15. Oración de cierre.
16. Recomendaciones para el adulto responsable.

No alteres el sentido del texto bíblico para simplificarlo. Diferencia la narración bíblica de las analogías o actividades creadas para enseñarla. No sugieras materiales peligrosos, humillación, coerción, dinámicas inseguras ni mensajes que generen miedo o culpa innecesarios. La clase debe poder utilizarse con una preparación mínima del maestro.

## 13. Fase 9 — Devocionales para siete días

Transforma la prédica en un recorrido de siete devocionales relacionados entre sí. Cada día debe desarrollar una dimensión real del mensaje y no limitarse a repetir la reflexión anterior.

El documento completo debe tener portada, título, nombre del predicador si se proporcionó, introducción, propósito y siete jornadas claramente separadas.

Cada jornada incluirá:

1. Número y título del día.
2. Tema específico.
3. Lectura bíblica principal.
4. Referencias complementarias pertinentes.
5. Contexto o explicación del texto.
6. Reflexión basada en la prédica.
7. Enseñanza central.
8. Pregunta de introspección.
9. Aplicación práctica.
10. Acción o compromiso del día.
11. Oración sugerida.

Organiza una progresión temática coherente con el contenido real, desde la comprensión hacia la reflexión, la aplicación y la consolidación de compromisos. Si la transcripción no permite fundamentar siete enfoques distintos, no inventes ideas para llenar espacio. Utiliza referencias complementarias verificables cuando sea apropiado e identifica cualquier ampliación editorial.

## 14. Fase 10 — Rigor bíblico, teológico y pedagógico

Investiga en Internet prácticas actuales y fuentes contrastables para estudios bíblicos grupales, discipulado juvenil, enseñanza bíblica infantil, devocionales y diseño instruccional. Prioriza fuentes primarias, instituciones reconocidas, recursos ministeriales y bibliografía especializada. Registra enlaces, fechas de consulta y criterios usados en la documentación.

Verifica por separado la identidad doctrinal de la iglesia: las fuentes metodológicas no equivalen a una declaración doctrinal institucional.

Reglas de calidad:

- Distingue texto bíblico, interpretación y aplicación.
- Respeta el contexto histórico, literario y teológico.
- Comprueba que las referencias bíblicas correspondan al contenido citado.
- No inventes versículos, citas, autores, fuentes ni datos.
- No presentes inferencias como afirmaciones explícitas de las Escrituras.
- No atribuyas a la prédica ideas ausentes de la transcripción.
- Diferencia las expresiones del predicador de las explicaciones añadidas por la IA.
- Señala ambigüedades que requieran revisión pastoral.
- Mantén coherencia con la orientación institucional solo cuando se haya verificado.
- Adapta complejidad, lenguaje y actividades al público elegido.
- No presentes a la IA como autoridad infalible ni como sustituto de la supervisión pastoral.

Si una interpretación no puede establecerse con seguridad, exprésala con prudencia o marca el punto para revisión humana en vez de inventar certeza.

## 15. Fase 11 — PDF profesionales

Los PDF son un producto central de TeoDoc MAIM. No te limites a volcar texto sin formato. Cada modalidad debe generar y permitir descargar su propio documento final:

- Análisis general.
- Estudio para grupos pequeños.
- Estudio para jóvenes.
- Clase bíblica infantil.
- Devocionales de siete días.

Incluye, cuando corresponda, portada, logotipos, título de la prédica, nombre del predicador, fecha, modalidad, objetivo, títulos y subtítulos claros, referencias bíblicas, actividades, instrucciones, numeración de páginas, pie institucional discreto y fuentes complementarias pertinentes. Omite metadatos no proporcionados; no dejes campos vacíos ni marcadores de plantilla.

Adapta el diseño al propósito:

- **Grupos pequeños:** agenda, preguntas, actividad e instrucciones para el líder.
- **Jóvenes:** composición contemporánea, legible y participativa.
- **Niños:** instrucciones para el maestro diferenciadas de las actividades infantiles.
- **Devocionales:** siete unidades con navegación visual consistente.
- **Análisis general:** conserva su contenido y estructura útil, mejorando la presentación sin degradarlo.

Requisitos técnicos:

1. Reutiliza la biblioteca existente cuando sea adecuada; evalúa el código actual antes de añadir dependencias.
2. Asegura caracteres y acentos correctos en español.
3. Mantén logotipos proporcionados y legibles.
4. Evita contenido cortado, desbordado, páginas vacías y saltos perjudiciales.
5. Controla márgenes, paginación y jerarquía tipográfica.
6. Comprueba que las descargas correspondan a la modalidad solicitada.
7. Prueba documentos cortos y largos.
8. Inspecciona visualmente los PDF reales, no solo la vista previa o la existencia del archivo.

Usa tamaño A4 como opción predeterminada, salvo que exista una razón documentada para otra disposición. Nombres sugeridos:

- `teodoc-maim-analisis-general.pdf`
- `teodoc-maim-grupos-pequenos.pdf`
- `teodoc-maim-jovenes.pdf`
- `teodoc-maim-clase-infantil.pdf`
- `teodoc-maim-devocionales-7-dias.pdf`

Puedes añadir título o nombre normalizado del predicador al nombre del archivo si mejora la organización y no expone información innecesaria. Normaliza caracteres especiales para evitar errores de descarga.

Genera ejemplos reales de las cinco modalidades y examina visualmente portada, páginas intermedias, última página y saltos críticos. Corrige los defectos de maquetación encontrados.

## 16. Fase 12 — Retirar la generación de infografías

TeoDoc MAIM debe centrarse en análisis y documentos PDF. Elimina la funcionalidad de creación de infografías, incluida, cuando exista y sea exclusiva de ella:

- Botones, pestañas, rutas y vistas de infografías.
- Instrucciones de IA destinadas únicamente a infografías.
- Dependencias específicas.
- Funciones y componentes de renderizado exclusivos.
- Opciones de exportación de pósteres o infografías.

Antes de eliminar código, confirma que no sea compartido con análisis, interfaz o generación de PDF. No elimines la transcripción ni otras funciones originales que no estén dedicadas exclusivamente a infografías. Verifica que no queden botones rotos, rutas huérfanas, importaciones sin uso ni referencias visibles a una función ya retirada.

## 17. Fase 13 — Arquitectura de IA y eficiencia

Integra las modalidades en la arquitectura que realmente tenga el repositorio. No reemplaces indiscriminadamente proveedores ni elimines mecanismos funcionales de respaldo.

- Separa instrucciones de análisis general y modalidades especializadas.
- Define esquemas validados para cada salida.
- Gestiona respuestas incompletas o mal formadas.
- Aplica reintentos controlados ante errores temporales.
- Respeta límites de proveedores y modelos.
- Protege claves API y variables de entorno.
- Controla costos y llamadas redundantes.
- Muestra mensajes de error comprensibles.
- Reutiliza resultados estructurados comunes cuando sea viable sin degradar la calidad.
- No construyas capas o agentes innecesarios si una solución más simple basta.

Valida que cada respuesta contenga las secciones necesarias antes de generar el PDF. Si falta un dato indispensable, solicita ese dato de forma concreta o explica la limitación; nunca inventes el contenido faltante.

## 18. Fase 14 — Seguridad y privacidad

Aplica buenas prácticas de seguridad apropiadas para la arquitectura existente. Revisa secretos, validación de entradas, carga y tamaño de archivos, errores, dependencias y exposición de datos en registros.

No envíes nombres de predicadores o transcripciones a servicios innecesarios. Si el proyecto guarda historial o contenido, documenta qué datos se almacenan, dónde y cómo se administran. No añadas recopilación innecesaria de datos personales ni servicios que generen gastos sin autorización.

## 19. Fase 15 — Pruebas y validación integral

### Análisis general

Comprueba que el flujo original permanezca funcional, que no desaparezcan secciones y que las referencias bíblicas y la exportación sigan trabajando.

### Nombre del predicador

Prueba:

- Nombre completo, nombres compuestos, tildes y caracteres españoles.
- Edición del nombre antes de generar.
- Propagación correcta a resultados y PDF.
- Funcionamiento cuando el campo está vacío.
- Ausencia de biografías, cargos o afirmaciones personales inventadas.
- Correcta identificación de la prédica de origen.

### Modalidades

Prueba por separado las cinco modalidades. Verifica estructura, pertinencia de actividades, adaptación a público/edad y consistencia del resultado.

### PDF

Genera y examina los cinco documentos. Revisa contenido, portada, metadatos, logotipos, paginación, caracteres, saltos y descarga.

### Interfaz y pruebas técnicas

Prueba pantallas representativas de computadora, tableta y teléfono. Ejecuta los scripts disponibles para instalación, lint, verificación de tipos, pruebas automatizadas y compilación. Utiliza solo comandos realmente definidos por el proyecto.

Corrige las regresiones introducidas. Registra pruebas fallidas, no ejecutadas o bloqueadas. **Nunca declares que una prueba se superó si no se ejecutó.** Distingue los errores preexistentes de los introducidos por los cambios.

## 20. Fase 16 — Documentación

Actualiza el README para que describa TeoDoc MAIM y el estado real de la implementación. Incluye:

- Propósito y público objetivo.
- Funcionalidades conservadas.
- Cinco modalidades de análisis.
- Personalización mediante nombre del predicador.
- Generación y descarga de PDF.
- Arquitectura y principales decisiones.
- Requisitos, instalación y configuración.
- Variables de entorno y proveedores de IA.
- Ejecución, pruebas y compilación.
- Seguridad y privacidad.
- Fuentes metodológicas consultadas.
- Limitaciones conocidas y pasos pendientes.

Actualiza, si corresponde, la guía de usuario, manual de identidad, sistema de diseño, instrucciones de las modalidades, documentación de PDF y decisiones de arquitectura. No documentes capacidades no implementadas.

## 21. Fase 17 — Criterios de aceptación

El proyecto se considera técnicamente terminado cuando los siguientes puntos han sido verificados:

### Repositorio y marca

- Existe un repositorio independiente `teodoc-maim` o está documentado el bloqueo remoto.
- El nombre de la app aparece correctamente como TeoDoc MAIM.
- El nombre institucional empleado ha sido verificado en una fuente oficial.
- Los logotipos y recursos gráficos se muestran correctamente, sin invenciones.

### Análisis

- El análisis general original se conserva y supera las pruebas de regresión.
- El usuario selecciona la modalidad antes de generar.
- Las cuatro modalidades especializadas están implementadas.
- Las actividades son relevantes y adaptadas a la audiencia.
- Las referencias bíblicas son verificadas hasta donde permita el sistema.

### Personalización

- Existe el campo opcional para el nombre del predicador.
- El dato se utiliza correctamente en identificación y documentos.
- Dejar el campo vacío no bloquea la generación.
- La IA no inventa biografía ni atribuye afirmaciones no presentes en el mensaje.

### PDF y funciones retiradas

- Las cinco modalidades generan y descargan su PDF.
- Los documentos son legibles y visualmente consistentes.
- El nombre del predicador aparece cuando se proporcionó.
- Las infografías han sido retiradas sin romper funciones compartidas.

### Calidad técnica

- Se han ejecutado y documentado las pruebas disponibles.
- Se han corregido las regresiones introducidas.
- La aplicación compila o los impedimentos están documentados.
- El README y documentos pertinentes están actualizados.
- Todos los pendientes están descritos con claridad.

## 22. Informe final obligatorio

Entrega un informe en español, claro y basado en evidencia. Debe incluir:

1. Estado y URL del fork, si se creó.
2. Nombre institucional verificado y URL de la fuente consultada.
3. Resumen de los cambios.
4. Estado del análisis general original.
5. Estado de cada modalidad especializada.
6. Implementación del campo del predicador.
7. Evidencias de generación/descarga de los cinco PDF.
8. Pruebas ejecutadas y resultados reales.
9. Resultado de la revisión visual.
10. Archivos principales modificados.
11. Dependencias incorporadas o eliminadas.
12. Problemas encontrados y soluciones.
13. Limitaciones y tareas pendientes.
14. Operaciones que requieren permisos externos.
15. Pasos para preparar posteriormente el despliegue.

Clasifica cada elemento como **COMPLETADO**, **PARCIAL** o **PENDIENTE**. Usa COMPLETADO solo cuando exista evidencia verificable; una propuesta o intención no equivale a una implementación terminada.

## Instrucción final

Desarrolla TeoDoc MAIM como una herramienta ministerial sólida, intuitiva y profesional. Conserva las capacidades útiles de TeoDoc, añade las cuatro modalidades especializadas, permite identificar la prédica mediante el nombre de quien la comparte y genera PDF listos para usar.

Prioriza fidelidad bíblica, personalización auténtica basada en la transcripción, identidad institucional verificada, utilidad pastoral, calidad editorial, seguridad y pruebas reales. No sustituyas la verificación por suposiciones y no declares terminado ningún trabajo que no hayas validado.
