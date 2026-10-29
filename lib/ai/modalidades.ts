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

export const REGLAS_GRUPOS = `DISEÑO DEL ESTUDIO PARA GRUPOS PEQUEÑOS, CÉLULAS Y FAMILIAS:
Diseña una guía comunitaria y pastoral profunda y participativa. Redacta el "contexto_pasaje", la "idea_central", las "aplicaciones" y el "caso_practico" en primera persona (singular o plural), como si el lector los interiorizara. Las preguntas deben formularse en segunda persona o con «¿Cómo…?» para invitar la reflexión personal.
- "objetivo": Propósito espiritual y formativo del encuentro en 1 o 2 oraciones claras.
- "idea_central": Síntesis fiel del mensaje, redactada en primera persona plural: «Necesitamos comprender…», «Estamos llamados a…».
- "contexto_pasaje": Contexto bíblico e histórico que ayude a comprender el pasaje principal; redactado de forma cercana y comprensible, en prosa fluida.
- "agenda": Entre 5 y 8 momentos detallados con "momento", "minutos" y "descripcion" amplia; suma entre 60 y 90 minutos.
- "materiales": Lista concreta de materiales necesarios.
- "preguntas_inicio": 3 a 5 preguntas abiertas para romper el hielo y conectar la vida cotidiana con la verdad del mensaje.
- "preguntas_comprension": 4 a 6 preguntas analíticas sobre el texto bíblico y las enseñanzas centrales.
- "preguntas_reflexion": 4 a 6 preguntas de introspección que conduzcan a la transformación personal y familiar.
- "actividad": Una actividad grupal con título, objetivo pedagógico y pasos explicados a fondo.
- "caso_practico": Un caso realista y desarrollado para debatir en grupo, fiel al tema de la prédica.
- "aplicaciones": 4 a 6 aplicaciones prácticas redactadas en primera persona: «Puedo…», «Necesito…», «Esta semana voy a…».
- "compromiso_semanal": Un compromiso concreto, medible y alcanzable, expresado en primera persona.
- "motivos_oracion": 4 a 6 motivos pastorales fundamentados en el mensaje.
- "oracion_final": Oración pastoral comunitaria en primera persona plural, íntima y pastoral.
- "orientaciones_lider": 5 a 8 recomendaciones pedagógicas y pastorales para el facilitador.`;

export const REGLAS_JOVENES = `DISEÑO DEL ESTUDIO PARA JÓVENES:
Diseña un estudio formativo y relevante para adolescentes y jóvenes, sin infantilismos ni tecnicismos huecos. Redacta los "conceptos", las "aplicaciones" y el "desafio_semanal" en primera persona, como si el joven los interiorizara: «Comprendo que…», «Necesito…», «Esta semana voy a…».
- "objetivo": Propósito formativo del encuentro para jóvenes.
- "tema": Tema central con lenguaje directo y contemporáneo.
- "contexto_pasaje": Contexto bíblico del pasaje explicado con claridad y relevancia práctica.
- "conceptos": 3 a 6 conceptos teológicos fundamentales explicados en párrafos accesibles y cotidianos, en primera persona cuando corresponda.
- "preguntas_reflexion": 5 a 7 preguntas de introspección personal sobre decisiones, identidad y fe.
- "preguntas_grupales": 5 a 7 preguntas para debate y diálogo participativo grupal.
- "casos_practicos": 3 a 5 situaciones reales sobre amistades, familia, estudios, integridad y vida digital.
- "dinamica": Una dinámica participativa formativa con título, objetivo y pasos detallados.
- "aplicaciones": 4 a 6 aplicaciones prácticas cotidianas, redactadas en primera persona.
- "desafio_semanal": Un desafío espiritual concreto, redactado en primera persona singular o plural.
- "motivos_oracion": 4 a 6 motivos de oración relevantes para su contexto.
- "guia_lider": 5 a 8 pautas claras para el líder de jóvenes al conducir la reunión.`;

export const REGLAS_NINOS = `DISEÑO DE LA CLASE BÍBLICA PARA NIÑOS:
Diseña una clase bíblica atractiva, didáctica y adaptada a la edad indicada:
- Adapta vocabulario, extensión y dinámicas al rango de edad seleccionado.
- "objetivo_aprendizaje": Qué comprenderá y vivirá el niño al concluir la clase.
- "relato": 3 a 6 partes narrativas con "parte", "titulo" y "texto" relatado en lenguaje vivo, expresivo y formativo para niños.
- "versiculo_clave": Cita y texto bíblico adaptado a la memorización infantil.
- "explicacion_versiculo": Explicación pedagógica, sencilla y profunda del versículo.
- "preguntas_comprension": 4 a 6 preguntas participativas sobre el relato.
- "actividad": Actividad manual, gráfica o didáctica con título, objetivo, materiales seguros y pasos claros.
- "juego": Juego formativo con título, materiales y reglas paso a paso (sin coerción ni exclusión).
- "aplicacion": Aplicación práctica y tangible para el día a día del niño.
- "actividad_familia": Actividad breve para reforzar en casa con los padres.
- "oracion_cierre": Oración sencilla, tierna y formativa.
- "recomendaciones_maestro": 5 a 8 recomendaciones pedagógicas y de cuidado para el maestro.
- "duracion_aproximada": Tiempo total estimado (ej. "45 a 60 minutos").`;

export const REGLAS_DEVOCIONALES = `DISEÑO DEL PLAN DEVOCIONAL DE SIETE DÍAS:
Diseña un itinerario de siete jornadas diarias de meditación profunda. Redacta la "reflexion", la "ensenanza_central" y la "aplicacion" de cada día en primera persona, como si el creyente dialogara con Dios e interiorizara la verdad: «Hoy comprendo…», «Necesito…», «Me propongo…». Mantén el texto bíblico y su referencia exactamente como aparecen en la transcripción.
- "introduccion": Presentación del plan devocional y su conexión con la enseñanza, en tono cercano y pastoral.
- "proposito": Propósito espiritual del plan y recomendaciones de uso, en primera persona plural.
- "dias": Exactamente siete jornadas con progresión temática coherente:
  * Día 1: Fundamento y comprensión del mensaje.
  * Día 2: Profundización en el texto bíblico.
  * Día 3: Confrontación y examen personal.
  * Día 4: Renovación de la mente y arrepentimiento.
  * Día 5: La fe en acción y obediencia práctica.
  * Día 6: Perseverancia y gracia en la prueba.
  * Día 7: Testimonio, consagración y adoración.
- Cada día incluye obligatoriamente:
  * "dia": Número entero del 1 al 7.
  * "titulo": Título evocador del día.
  * "tema": Tema central del día.
  * "lectura_principal": Pasaje con "cita" y "texto".
  * "lecturas_complementarias": 1 a 3 pasajes con "cita" y "texto".
  * "contexto": Contexto bíblico del pasaje del día.
  * "reflexion": Reflexión devocional extensa y sustanciosa en 2 a 3 párrafos profundos.
  * "ensenanza_central": Verdad doctrinal principal a retener.
  * "pregunta_introspeccion": Pregunta profunda que examine el corazón.
  * "aplicacion": Aplicación práctica para ese día.
  * "accion": Compromiso o acto concreto a realizar durante la jornada.
  * "oracion": Oración devocional guiada e íntima.`;

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

  const contextoPrimerPersona = modalidad === 'bosquejo' ? '' : `
ESTILO MAIM — PRIMERA PERSONA Y VOZ DIRECTA (aplica a todas las secciones de prosa):
- Redacta en primera persona cuando el contenido invite al examen personal o la transformación: «reconozco», «necesito», «comprendo», «estoy llamado a».
- Usa primera persona plural para enseñanzas comunitarias: «necesitamos», «estamos llamados», «debemos».
- PROHIBIDO usar «el orador dice», «el predicador explica», «se mencionó» o cualquier forma indirecta. Las verdades se presentan directamente.
- La primera persona solo aplica a explicaciones y aplicaciones; NO modifica el texto de los versículos bíblicos.
`;

  return `PREFIJO INMUTABLE DE CONTEXTO Y SEGURIDAD:
Eres un teólogo y pedagogo ministerial de alto nivel cristiano evangélico para MAIM Casa de Oración.
REGLA INNEGOCIABLE DE CERO ALUCINACIÓN Y FIDELIDAD ESTRICTA:
- Trabaja con FIDELIDAD ABSOLUTA a la transcripción fuente y al contenido bíblico expuesto.
- No infieras la personalidad ni la biografía del predicador: limítate al contenido expuesto. Prohibido inventar doctrinas ajenas, biografías, antecedentes o historias no mencionadas.
- No inventes versículos ni citas bíblicas: si un pasaje no se mencionó en la prédica, no lo agregues. Cita solo lo que el expositor utilizó o fundamentó.
- Desarrolla cada sección en párrafos sólidos, analíticos y profundos con prosa completa y fundamentada (cero frases telegráficas, cero resúmenes superficiales).
${contextoPrimerPersona}
Devuelve ÚNICAMENTE un objeto JSON válido con la propiedad "especializado". No incluyas markdown fuera del JSON.
${reglas}${edad}
${REGLAS_CALIDAD_MODALIDAD}

No repitas el análisis general completo: aprovecha sus hallazgos y desarrolla exhaustivamente el material de la modalidad solicitada.`;
}

