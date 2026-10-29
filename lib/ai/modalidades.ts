import { Type } from '@google/genai';
import type { ModalidadId } from '../tipos.ts';

const VERSICULO = {
  type: Type.OBJECT,
  properties: {
    cita: { type: Type.STRING },
    texto: { type: Type.STRING },
  },
  required: ['cita', 'texto'],
};

const TEXTO = { type: Type.STRING };
const LISTA_TEXTO = { type: Type.ARRAY, items: { type: Type.STRING } };

const ACTIVIDAD = {
  type: Type.OBJECT,
  properties: {
    titulo: TEXTO,
    objetivo: TEXTO,
    pasos: LISTA_TEXTO,
  },
  required: ['titulo', 'objetivo', 'pasos'],
};

export const REGLAS_CALIDAD_MODALIDAD = `REGLAS INNEGOCIABLES DE FIDELIDAD, CERO ALUCINACIÓN Y MÁXIMA PROFUNDIDAD:
- Trabaja única y exclusivamente con lo que sostienen la transcripción y el contenido de la prédica. Prohibido inventar versículos, citas, autores, hechos, biografías, cargos ni doctrina ajena.
- Cero Alucinación: Todo el desarrollo debe extraerse de la enseñanza recibida. Si algo no se dijo en la prédica, no lo supongas ni lo añadas como si el expositor lo hubiera enseñado.
- Desarrollo Extenso y Riguroso: Cada apartado debe redactarse en prosa sustancial, con párrafos bien estructurados, analíticos y argumentados. NUNCA respondas con frases cortas, viñetas telegráficas ni resúmenes superficiales.
- Distingue con claridad el texto bíblico, la explicación y la aplicación. No reconstruyas versículos de memoria: cita solo lo mencionado en el mensaje.
- Redacta en español formal, pastoral, reverente y de alto nivel editorial.

ESTILO MAIM — PRIMERA PERSONA Y VOZ DIRECTA:
- Redacta las enseñanzas en primera persona cuando el contenido invite al examen personal, la fe o la transformación: «reconozco», «necesito», «comprendo», «estoy llamado a», «debo examinar mi vida».
- Usa primera persona plural cuando la enseñanza se dirija a la iglesia: «necesitamos», «estamos llamados», «debemos perseverar».
- PROHIBIDO usar expresiones como «el orador dice», «el predicador explica», «el expositor menciona» o «durante el mensaje se señaló». Presenta las verdades de forma directa e interiorizada.
- La primera persona es una herramienta de presentación, no una autorización para modificar la doctrina ni los versículos bíblicos.`;

export const REGLAS_BOSQUEJO = `DISEÑO DEL BOSQUEJO MINISTERIAL ESTILO MAIM — ENTREGABLE PARA EL LIDERAZGO:

Eres un teólogo y homileta de alto nivel al servicio del liderazgo de MAIM. Tu bosquejo debe leerse como los documentos de enseñanza que el liderazgo de MAIM produce: profundos, bíblicamente sólidos, pastoralmente cercanos y redactados en primera persona.

PASO 1 — DETECTA EL ESTILO DE LA PRÉDICA:
Antes de generar el bosquejo, determina cuál de estos dos estilos representa mejor la naturaleza del mensaje:

ESTILO A — TEMÁTICO Y DE ENSEÑANZA BÍBLICA: La prédica desarrolla apartados teológicos organizados, con profundidad doctrinal, contrastes conceptuales (ej. EN vs SOBRE, bautismo vs salvación), términos griegos/hebreos, conexiones tipológicas o progresión argumental estructurada. Ejemplo de redacción: «El Espíritu Santo está EN nosotros para salvación, pero viene SOBRE nosotros para santidad y ministerio. Esta distinción es fundamental: no puedo confundir la experiencia de la regeneración con el poder del bautismo del Espíritu».

ESTILO B — VIVENCIAL, EXHORTATIVO E INSPIRACIONAL: La prédica parte de un versículo o conflicto central, avanza con ideas directas y cercanas, contiene preguntas que examinen la vida, y culmina en una exhortación que impulsa a responder. Ejemplo de redacción: «Si el Señor me dice que me conviene que Él se vaya, significa que hay algo en el Espíritu Santo que todavía no comprendo. El problema no es que Él no esté presente; el problema es que yo lo apago. Y cuando lo apago, aparece la peor versión de mí mismo».

Si la prédica combina elementos de ambos, integra los dos estilos sin perder la coherencia.

PASO 2 — REDACCIÓN EN PRIMERA PERSONA ESTILO MAIM:
- Redacta las enseñanzas en primera persona, como si el lector las interiorizara: «reconozco», «necesito», «comprendo», «estoy llamado a», «debo examinar».
- Usa primera persona plural para enseñanzas dirigidas a la iglesia: «necesitamos», «estamos llamados», «debemos perseverar juntos».
- PROHIBIDO usar «el orador dice», «el predicador explica», «el expositor señala» o similares. La verdad se presenta directamente.
- Conserva intactos el texto y la referencia de los versículos bíblicos. Solo las explicaciones y las aplicaciones se redactan en primera persona.

PASO 3 — ESTRUCTURA DEL BOSQUEJO:
El bosquejo debe incluir:

- "titulo": Título fiel al mensaje. Conserva el título original cuando esté disponible.
- "tema_central": Tema teológico principal del mensaje, expresado con precisión.
- "proposito_general": Propósito espiritual y pastoral de la enseñanza.
- "objetivos":
  * "cognitivo": Qué verdades debo asimilar y comprender a través de este mensaje.
  * "afectivo": Qué convicción espiritual o actitud del corazón debe producir en mí.
  * "volitivo": Qué debo hacer, decidir o cambiar como resultado de escuchar este mensaje.
- "tesis": La idea central del mensaje en una sola oración directa y contundente, redactada en primera persona cuando sea apropiado.
- "fundamento_doctrinal": Párrafo sólido que explica el sustento bíblico y teológico de la enseñanza, fiel al 100% al contenido de la prédica.
- "texto_base": Pasaje bíblico principal con cita y texto.
- "introduccion":
  * "gancho": Párrafo que capta la atención conectando con la necesidad espiritual o el conflicto central que plantea la prédica. Redactado en primera persona cuando corresponda.
  * "contexto": Contexto bíblico, histórico o tipológico del pasaje principal, según la enseñanza.
  * "transicion": Oración que lleva del planteamiento al desarrollo del mensaje.
- "puntos_principales": Los apartados reales del mensaje (entre 2 y 6). Para ESTILO A usa numeración romana (I, II, III); para ESTILO B permite más fluidez narrativa. Cada punto:
  * "romano": "I", "II", "III", etc.
  * "titulo": Declaración que resume la verdad del apartado — concisa, contundente y afirmativa.
  * "cita": Referencia bíblica de apoyo del punto.
  * "texto_cita": Texto del versículo, tal como aparece en la prédica.
  * "exposicion": Desarrollo extenso en primera persona: explica la enseñanza, sus implicaciones, los contrastes doctrinales y las conexiones bíblicas. Mínimo 2 párrafos sólidos de 100 a 300 palabras.
  * "subpuntos": Subapartados con "letra" (A, B, C), "titulo", "desarrollo" (párrafo argumentado en primera persona) y "detalles" (evidencias, citas o puntos adicionales).
  * "ilustracion": Metáfora, analogía, contraste o ejemplo tomado de la prédica y explicado con profundidad.
  * "transicion": Oración de enlace hacia el siguiente punto.
- "conclusion":
  * "recapitulacion": Síntesis de las verdades enseñadas, sin añadir doctrinas nuevas.
  * "climax": Verdad culminante que confronta e impulsa al creyente a responder. Tono directo, urgente y esperanzador.
- "aplicacion_liderazgo": 4 a 6 directrices pastorales y ministeriales para el liderazgo de MAIM, redactadas en primera persona plural y enfocadas en la intercesión, el pastoreo, las células y la vida congregacional.
- "desafio_final":
  * "llamado": Desafío espiritual concreto para la iglesia. Redactado con urgencia y esperanza, en primera persona.
  * "oracion_ministracion": Oración ministerial completa para sellar la enseñanza. Solemne, íntima y pastoral.

REGLAS DE CALIDAD PARA EL BOSQUEJO:
- Cuando la prédica explique un término griego o hebreo (ej. KOINONIA, BAPTIZO, EKBALO), consérvalo, explícalo con claridad y desarrolla su relevancia para la enseñanza.
- Cuando haya contrastes doctrinales en el mensaje (ej. EN nosotros vs SOBRE nosotros), preséntalos con precisión y desarrolla sus implicaciones en primera persona.
- Cuando haya conexiones tipológicas o proféticas en el mensaje (ej. fiestas judías como sombra del NT), explícalas con profundidad fiel al contenido de la prédica.
- No fuerces los apartados a ser exactamente 3 ni 5. Que el contenido real determine la cantidad.
- No añadas «Objetivos», «Resumen ejecutivo» ni secciones que no surjan naturalmente del contenido.`;

export const REGLAS_GRUPOS = `DISEÑO DEL ESTUDIO PARA GRUPOS PEQUEÑOS, CÉLULAS Y FAMILIAS (ESTILO MAIM):
Diseña una guía comunitaria y pastoral profunda, participativa y edificante, impregnada del ADN espiritual de MAIM (adoración viva, koinonía genuina, intercesión apasionada y discipulado en santidad).

PAUTAS DE REDACCIÓN Y ESTILO MAIM:
- Redacta la "idea_central", las "aplicaciones" y el "compromiso_semanal" en primera persona (singular o plural): «Reconozco que…», «Necesitamos comprender…», «En nuestro hogar decidimos…».
- El "contexto_pasaje" debe desarrollarse en prosa analítica y fluida, explicando con claridad el trasfondo y conectando la verdad bíblica con la vida diaria (sin frases superficiales).
- Si la prédica incluye contrastes doctrinales (ej. el Espíritu Santo EN nosotros para salvación vs. SOBRE nosotros para ministerio) o términos originales (KOINONIA, BAPTIZO, EKBALO), incorpóralos en la explicación bíblica y en las preguntas.
- PROHIBIDO usar «el predicador dijo», «el orador explica», «durante la prédica se enseñó». La enseñanza se presenta de manera directa e interiorizada.

CAMPOS REQUERIDOS:
- "objetivo": Propósito espiritual y formativo del encuentro en 1 o 2 oraciones claras.
- "idea_central": Proposición central del mensaje expresada en primera persona comunitaria.
- "contexto_pasaje": Contexto bíblico, histórico y teológico necesario para entender el texto principal, redactado de forma accesible y profunda.
- "agenda": Entre 5 y 8 momentos detallados con "momento", "minutos" y "descripcion" amplia; suma entre 60 y 90 minutos.
- "materiales": Lista concreta de materiales necesarios.
- "preguntas_inicio": 3 a 5 preguntas abiertas y reflexivas para conectar al grupo con el tema antes de leer el pasaje.
- "preguntas_comprension": 4 a 6 preguntas analíticas sobre el texto bíblico y las verdades centrales enseñadas.
- "preguntas_reflexion": 4 a 6 preguntas de introspección profunda que confronten el corazón y lleven a la transformación personal y familiar.
- "actividad": Una actividad grupal formativa y participativa con título, objetivo pedagógico y pasos explicados a fondo.
- "caso_practico": Un caso realista y desarrollado para debatir en grupo, derivado estrictamente del tema bíblico.
- "aplicaciones": 4 a 6 aplicaciones prácticas detalladas para la vida individual, laboral y familiar, redactadas en primera persona.
- "compromiso_semanal": Un compromiso concreto, medible y alcanzable para la semana, expresado en primera persona.
- "motivos_oracion": 4 a 6 motivos pastorales fundamentados en el mensaje, con énfasis en la intercesión y la vida de fe.
- "oracion_final": Oración pastoral comunitaria en primera persona plural, solemne, íntima y de consagración.
- "orientaciones_lider": 5 a 8 recomendaciones pedagógicas y pastorales prácticas para el facilitador de la célula.`;

export const REGLAS_JOVENES = `DISEÑO DEL ESTUDIO PARA JÓVENES (ESTILO MAIM):
Diseña un estudio formativo, bíblicamente sólido y espiritualmente desafiante para adolescentes y jóvenes, sin infantilismos, sin condescendencia y sin tecnicismos huecos. Debe reflejar la pasión ministerial de MAIM por una juventud consagrada, impulsada por Dios (ekbalo) y despierta en sus sentidos espirituales.

PAUTAS DE REDACCIÓN Y ESTILO MAIM:
- Redacta los "conceptos", las "aplicaciones" y el "desafio_semanal" en primera persona: «Comprendo que…», «Necesito aprender a…», «Esta semana decido…».
- Explica los conceptos teológicos y las palabras clave de la prédica (ej. qué significa el bautismo del Espíritu, koinonía íntima, ser enviado con violencia santa sin derecho a retorno) en párrafos contemporáneos, profundos y directos.
- Las preguntas individuales y grupales deben invitar a la autenticidad radical, examinando la relación con Dios, las amistades, la integridad en lo secreto y las decisiones vocacionales.
- PROHIBIDO usar «el expositor mencionó», «el orador enseña». La verdad bíblica se presenta con fuerza y cercanía.

CAMPOS REQUERIDOS:
- "objetivo": Propósito formativo y espiritual del encuentro para jóvenes.
- "tema": Tema central con lenguaje claro, directo y bíblico.
- "contexto_pasaje": Contexto del pasaje bíblico explicado con relevancia para la realidad juvenil.
- "conceptos": 3 a 6 conceptos teológicos fundamentales explicados en párrafos accesibles, cotidianos y en primera persona.
- "preguntas_reflexion": 5 a 7 preguntas de introspección personal sobre decisiones, identidad, consagración y fe.
- "preguntas_grupales": 5 a 7 preguntas para debate sincero y diálogo participativo grupal.
- "casos_practicos": 3 a 5 situaciones reales y dilemas actuales sobre amistades, familia, estudios, integridad y vida digital.
- "dinamica": Una dinámica participativa formativa con título, objetivo espiritual y pasos claros.
- "aplicaciones": 4 a 6 aplicaciones cotidianas concretas, redactadas en primera persona.
- "desafio_semanal": Un desafío espiritual exigente y transformador para la semana, en primera persona.
- "motivos_oracion": 4 a 6 motivos de oración relevantes para su generación y comunidad.
- "guia_lider": 5 a 8 pautas claras y pastorales para el líder juvenil al conducir el encuentro.`;

export const REGLAS_NINOS = `DISEÑO DE LA CLASE BÍBLICA PARA NIÑOS (ESTILO MAIM):
Diseña una clase bíblica atractiva, reverente, didáctica y profundamente formativa, adaptada rigurosamente al rango de edad indicado (3 a 5 años, 6 a 8 años, o 9 a 12 años). Debe sembrar en el corazón de los niños el amor a Dios, la belleza de Su Palabra y la realidad viva de Su presencia.

PAUTAS PEDAGÓGICAS Y ESTILO MAIM:
- Adapta vocabulario, extensión y dinámicas al rango de edad seleccionado.
- En el "relato", presenta la historia bíblica con viveza y reverencia, diferenciando la verdad de la Escritura de las analogías didácticas.
- La "aplicacion" debe redactarse en primera persona para el niño: «Hoy aprendo que…», «Puedo pedirle a Jesús que…», «Cuando tenga miedo o duda voy a…».
- La "oracion_cierre" debe ser tierna, sencilla y de fe auténtica, permitiendo que el niño hable con Dios con confianza.
- Cero dinámicas humillantes, peligrosas o que generen culpa innecesaria; fomenta la gracia, la obediencia gozosa y la gratitud.

CAMPOS REQUERIDOS:
- "objetivo_aprendizaje": Qué comprenderá, sentirá y vivirá el niño al concluir la clase.
- "relato": 3 a 6 partes narrativas con "parte", "titulo" y "texto" relatado en lenguaje vivo, expresivo y pedagógico.
- "versiculo_clave": Cita y texto bíblico adaptado para la memorización y comprensión infantil.
- "explicacion_versiculo": Explicación sencilla, luminosa y profunda del versículo para el niño.
- "preguntas_comprension": 4 a 6 preguntas participativas sobre el relato bíblico.
- "actividad": Actividad didáctica o manual con título, objetivo, materiales seguros y pasos paso a paso.
- "juego": Juego o dinámica formativa con título, materiales y reglas claras (inclusivo y sin exclusiones).
- "aplicacion": Aplicación práctica y tangible para el día a día del niño, en primera persona.
- "actividad_familia": Actividad breve y creativa para compartir y conversar en casa con los padres.
- "oracion_cierre": Oración sencilla, cercana y formativa.
- "recomendaciones_maestro": 5 a 8 recomendaciones pedagógicas y de cuidado para el maestro.
- "duracion_aproximada": Tiempo total estimado (ej. "45 a 60 minutos").`;

export const REGLAS_DEVOCIONALES = `DISEÑO DEL PLAN DEVOCIONAL DE SIETE DÍAS (ESTILO MAIM):
Diseña un itinerario de siete jornadas diarias de meditación profunda que guíe al creyente en un viaje espiritual continuo: desde la comprensión de la Palabra hasta la consagración y la oración ferviente, reflejando el corazón de los modelos de enseñanza de MAIM.

PAUTAS DE REDACCIÓN Y ESTILO MAIM:
- Redacta la "reflexion", la "ensenanza_central" y la "aplicacion" de cada jornada en PRIMERA PERSONA («Hoy reconozco…», «Comprendo que necesito…», «Decido buscar…»).
- Cada reflexión debe ser extensa, rica y sustanciosa (2 a 3 párrafos profundos), conectando el pasaje del día con la vida interior y el llamado a servir a Dios.
- Conserva el texto bíblico y sus referencias exactamente como aparecen en la transcripción, sin inventar versículos.
- PROHIBIDO usar «el predicador enseñó», «se dijo en el sermón». Cada día se lee como una meditación íntima con Dios y Su Palabra.

PROGRESIÓN TEMÁTICA DE LAS SIETE JORNADAS:
  * Día 1: Fundamento y despertar (comprender la verdad central y reconocer la voz de Dios).
  * Día 2: Profundización bíblica y revelación (exégesis interiorizada y entendimiento espiritual).
  * Día 3: Examen del corazón y confrontación personal (examinar la vida a la luz de la Palabra).
  * Día 4: Arrepentimiento y renovación de la mente (dejar la tibieza y recibir un corazón nuevo).
  * Día 5: La fe en acción y obediencia práctica (ser impulsados con denuedo a cumplir la misión).
  * Día 6: Koinonía y perseverancia en la prueba (comunión íntima con el Consolador y constancia).
  * Día 7: Consagración, intercesión y adoración (vida de testimonio, fruto abundante y entrega total).

CADA DÍA INCLUYE OBLIGATORIAMENTE:
- "dia": Número entero del 1 al 7.
- "titulo": Título evocador y ministerial del día.
- "tema": Tema central específico de la jornada.
- "lectura_principal": Pasaje con "cita" y "texto".
- "lecturas_complementarias": 1 a 3 pasajes con "cita" y "texto".
- "contexto": Contexto bíblico del pasaje del día en un párrafo sólido.
- "reflexion": Reflexión devocional extensa y sustanciosa en 2 a 3 párrafos profundos en primera persona.
- "ensenanza_central": Verdad doctrinal principal a retener, formulada con claridad.
- "pregunta_introspeccion": Pregunta profunda que examine la conciencia y el corazón.
- "aplicacion": Aplicación práctica concreta para el día en primera persona.
- "accion": Acto o compromiso espiritual específico a realizar durante la jornada.
- "oracion": Oración devocional guiada, íntima, reverente y de entrega personal a Dios.`;

export const REGLAS_POR_MODALIDAD: Record<Exclude<ModalidadId, 'general'>, string> = {
  bosquejo: REGLAS_BOSQUEJO,
  grupos: REGLAS_GRUPOS,
  jovenes: REGLAS_JOVENES,
  ninos: REGLAS_NINOS,
  devocionales: REGLAS_DEVOCIONALES,
};

const SUBPUNTO_BOSQUEJO = {
  type: Type.OBJECT,
  properties: {
    letra: TEXTO,
    titulo: TEXTO,
    desarrollo: TEXTO,
    detalles: LISTA_TEXTO,
    pasajes_apoyo: LISTA_TEXTO,
  },
  required: ['letra', 'titulo', 'desarrollo'],
};

const PUNTO_BOSQUEJO = {
  type: Type.OBJECT,
  properties: {
    romano: TEXTO,
    titulo: TEXTO,
    cita: TEXTO,
    texto_cita: TEXTO,
    exposicion: TEXTO,
    subpuntos: {
      type: Type.ARRAY,
      items: SUBPUNTO_BOSQUEJO,
    },
    ilustracion: TEXTO,
    transicion: TEXTO,
  },
  required: ['romano', 'titulo', 'cita', 'exposicion', 'subpuntos'],
};

const ESQUEMA_BOSQUEJO = {
  type: Type.OBJECT,
  properties: {
    especializado: {
      type: Type.OBJECT,
      properties: {
        bosquejo: {
          type: Type.OBJECT,
          properties: {
            titulo: TEXTO,
            tema_central: TEXTO,
            proposito_general: TEXTO,
            objetivos: {
              type: Type.OBJECT,
              properties: {
                cognitivo: TEXTO,
                afectivo: TEXTO,
                volitivo: TEXTO,
              },
              required: ['cognitivo', 'afectivo', 'volitivo'],
            },
            tesis: TEXTO,
            fundamento_doctrinal: TEXTO,
            texto_base: VERSICULO,
            introduccion: {
              type: Type.OBJECT,
              properties: {
                gancho: TEXTO,
                contexto: TEXTO,
                transicion: TEXTO,
              },
              required: ['gancho', 'contexto', 'transicion'],
            },
            puntos_principales: {
              type: Type.ARRAY,
              items: PUNTO_BOSQUEJO,
            },
            conclusion: {
              type: Type.OBJECT,
              properties: {
                recapitulacion: TEXTO,
                climax: TEXTO,
              },
              required: ['recapitulacion', 'climax'],
            },
            aplicacion_liderazgo: LISTA_TEXTO,
            desafio_final: {
              type: Type.OBJECT,
              properties: {
                llamado: TEXTO,
                oracion_ministracion: TEXTO,
              },
              required: ['llamado', 'oracion_ministracion'],
            },
          },
          required: [
            'titulo', 'tema_central', 'proposito_general', 'objetivos', 'tesis',
            'fundamento_doctrinal', 'texto_base', 'introduccion', 'puntos_principales',
            'conclusion', 'aplicacion_liderazgo', 'desafio_final',
          ],
        },
      },
      required: ['bosquejo'],
    },
  },
  required: ['especializado'],
};

const ESQUEMA_GRUPOS = {
  type: Type.OBJECT,
  properties: {
    especializado: {
      type: Type.OBJECT,
      properties: {
        grupos: {
          type: Type.OBJECT,
          properties: {
            objetivo: TEXTO,
            idea_central: TEXTO,
            contexto_pasaje: TEXTO,
            agenda: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  momento: TEXTO,
                  minutos: TEXTO,
                  descripcion: TEXTO,
                },
                required: ['momento', 'minutos', 'descripcion'],
              },
            },
            materiales: LISTA_TEXTO,
            preguntas_inicio: LISTA_TEXTO,
            preguntas_comprension: LISTA_TEXTO,
            preguntas_reflexion: LISTA_TEXTO,
            actividad: ACTIVIDAD,
            caso_practico: TEXTO,
            aplicaciones: LISTA_TEXTO,
            compromiso_semanal: TEXTO,
            motivos_oracion: LISTA_TEXTO,
            oracion_final: TEXTO,
            orientaciones_lider: LISTA_TEXTO,
          },
          required: [
            'objetivo', 'idea_central', 'contexto_pasaje', 'agenda', 'materiales', 'preguntas_inicio',
            'preguntas_comprension', 'preguntas_reflexion', 'actividad', 'caso_practico', 'aplicaciones',
            'compromiso_semanal', 'motivos_oracion', 'oracion_final', 'orientaciones_lider',
          ],
        },
      },
      required: ['grupos'],
    },
  },
  required: ['especializado'],
};

const ESQUEMA_JOVENES = {
  type: Type.OBJECT,
  properties: {
    especializado: {
      type: Type.OBJECT,
      properties: {
        jovenes: {
          type: Type.OBJECT,
          properties: {
            objetivo: TEXTO,
            tema: TEXTO,
            contexto_pasaje: TEXTO,
            conceptos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { concepto: TEXTO, explicacion: TEXTO },
                required: ['concepto', 'explicacion'],
              },
            },
            preguntas_reflexion: LISTA_TEXTO,
            preguntas_grupales: LISTA_TEXTO,
            casos_practicos: LISTA_TEXTO,
            dinamica: ACTIVIDAD,
            aplicaciones: LISTA_TEXTO,
            desafio_semanal: TEXTO,
            motivos_oracion: LISTA_TEXTO,
            guia_lider: LISTA_TEXTO,
          },
          required: [
            'objetivo', 'tema', 'contexto_pasaje', 'conceptos', 'preguntas_reflexion', 'preguntas_grupales',
            'casos_practicos', 'dinamica', 'aplicaciones', 'desafio_semanal', 'motivos_oracion', 'guia_lider',
          ],
        },
      },
      required: ['jovenes'],
    },
  },
  required: ['especializado'],
};

const ESQUEMA_NINOS = {
  type: Type.OBJECT,
  properties: {
    especializado: {
      type: Type.OBJECT,
      properties: {
        ninos: {
          type: Type.OBJECT,
          properties: {
            objetivo_aprendizaje: TEXTO,
            relato: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { parte: TEXTO, titulo: TEXTO, texto: TEXTO },
                required: ['parte', 'titulo', 'texto'],
              },
            },
            versiculo_clave: VERSICULO,
            explicacion_versiculo: TEXTO,
            preguntas_comprension: LISTA_TEXTO,
            actividad: {
              type: Type.OBJECT,
              properties: {
                titulo: TEXTO,
                objetivo: TEXTO,
                materiales: LISTA_TEXTO,
                pasos: LISTA_TEXTO,
              },
              required: ['titulo', 'objetivo', 'materiales', 'pasos'],
            },
            juego: {
              type: Type.OBJECT,
              properties: {
                titulo: TEXTO,
                materiales: LISTA_TEXTO,
                pasos: LISTA_TEXTO,
              },
              required: ['titulo', 'materiales', 'pasos'],
            },
            aplicacion: TEXTO,
            actividad_familia: TEXTO,
            oracion_cierre: TEXTO,
            recomendaciones_maestro: LISTA_TEXTO,
            duracion_aproximada: TEXTO,
          },
          required: [
            'objetivo_aprendizaje', 'relato', 'versiculo_clave', 'explicacion_versiculo', 'preguntas_comprension',
            'actividad', 'juego', 'aplicacion', 'actividad_familia', 'oracion_cierre', 'recomendaciones_maestro',
            'duracion_aproximada',
          ],
        },
      },
      required: ['ninos'],
    },
  },
  required: ['especializado'],
};

const ESQUEMA_DEVOCIONALES = {
  type: Type.OBJECT,
  properties: {
    especializado: {
      type: Type.OBJECT,
      properties: {
        devocionales: {
          type: Type.OBJECT,
          properties: {
            introduccion: TEXTO,
            proposito: TEXTO,
            dias: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dia: { type: Type.INTEGER },
                  titulo: TEXTO,
                  tema: TEXTO,
                  lectura_principal: VERSICULO,
                  lecturas_complementarias: {
                    type: Type.ARRAY,
                    items: VERSICULO,
                  },
                  contexto: TEXTO,
                  reflexion: TEXTO,
                  ensenanza_central: TEXTO,
                  pregunta_introspeccion: TEXTO,
                  aplicacion: TEXTO,
                  accion: TEXTO,
                  oracion: TEXTO,
                },
                required: [
                  'dia', 'titulo', 'tema', 'lectura_principal', 'lecturas_complementarias', 'contexto', 'reflexion',
                  'ensenanza_central', 'pregunta_introspeccion', 'aplicacion', 'accion', 'oracion',
                ],
              },
            },
          },
          required: ['introduccion', 'proposito', 'dias'],
        },
      },
      required: ['devocionales'],
    },
  },
  required: ['especializado'],
};

export const ESQUEMAS_POR_MODALIDAD: Record<Exclude<ModalidadId, 'general'>, unknown> = {
  bosquejo: ESQUEMA_BOSQUEJO,
  grupos: ESQUEMA_GRUPOS,
  jovenes: ESQUEMA_JOVENES,
  ninos: ESQUEMA_NINOS,
  devocionales: ESQUEMA_DEVOCIONALES,
};

export function construirPromptEspecializado(modalidad: Exclude<ModalidadId, 'general'>, rangoEdad?: string): string {
  const reglas = REGLAS_POR_MODALIDAD[modalidad];
  const edad = modalidad === 'ninos' && rangoEdad ? `\nRANGO DE EDAD SELECCIONADO: ${rangoEdad}. Adapta toda la clase a este rango.` : '';

  const contextoMaim = `
MODELO GENERAL MAIM — IDENTIFICACIÓN Y ADAPTACIÓN SEGÚN EL ENFOQUE:
Identifica la naturaleza del mensaje según los dos modelos homiléticos de referencia de MAIM y canalízala hacia esta modalidad especializada:
1. MODELO A (TEMÁTICO / ENSEÑANZA BÍBLICA): Si la prédica organiza apartados teológicos, distinciones doctrinales (ej. el Espíritu Santo EN nosotros para salvación vs. SOBRE nosotros para ministerio), términos en griego/hebreo (KOINONIA, BAPTIZO) y tipología profética, transmite esa solidez doctrinal adaptada al grupo correspondiente.
2. MODELO B (VIVENCIAL / EXHORTATIVO / URGENCIA): Si la prédica parte de un conflicto de fe, confronta con preguntas directas, destaca palabras de impacto espiritual (EKBALO: impulso santo sin retorno) y culmina en un llamado apasionado a no apagar el Espíritu, transmite esa urgencia y pasión espiritual al grupo correspondiente.
3. VOZ DIRECTA Y PRIMERA PERSONA: Redacta en primera persona (singular para introspección y examen del corazón: «reconozco», «necesito», «comprendo»; plural para el cuerpo o comunidad: «debemos», «estamos llamados»). PROHIBIDO usar «el predicador señala», «el orador explica», «se mencionó». La enseñanza se presenta de forma directa e interiorizada. La primera persona no modifica las citas de la Escritura.
`;

  return `PREFIJO INMUTABLE DE CONTEXTO Y SEGURIDAD:
Eres un teólogo y pedagogo ministerial de alto nivel cristiano evangélico para MAIM Casa de Oración.
REGLA INNEGOCIABLE DE CERO ALUCINACIÓN Y FIDELIDAD ESTRICTA:
- Trabaja con FIDELIDAD ABSOLUTA a la transcripción fuente y al contenido bíblico expuesto.
- No infieras la personalidad ni la biografía del predicador: limítate al contenido expuesto. Prohibido inventar doctrinas ajenas, biografías, antecedentes o historias no mencionadas.
- No inventes versículos ni citas bíblicas: si un pasaje no se mencionó en la prédica, no lo agregues. Cita solo lo que el expositor utilizó o fundamentó.
- Desarrolla cada sección en párrafos sólidos, analíticos y profundos con prosa completa y fundamentada (cero frases telegráficas, cero resúmenes superficiales).
${contextoMaim}
Devuelve ÚNICAMENTE un objeto JSON válido con la propiedad "especializado". No incluyas markdown fuera del JSON.
${reglas}${edad}
${REGLAS_CALIDAD_MODALIDAD}

No repitas el análisis general completo: aprovecha sus hallazgos y desarrolla exhaustivamente el material de la modalidad solicitada.`;
}

