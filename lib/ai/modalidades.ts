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

export const REGLAS_CALIDAD_MODALIDAD = `REGLAS DE FIDELIDAD Y CALIDAD:
- Trabaja únicamente con lo que sostienen la transcripción y el análisis general. No inventes versículos, citas, autores, hechos, biografías, cargos ni doctrina.
- Distingue con claridad el texto bíblico, la explicación y la aplicación. No reconstruyas de memoria el texto bíblico: registra la referencia y conserva solo el fragmento que la transcripción cite, marcándolo para verificación.
- No atribuyas al expositor ideas que no aparezcan en la transcripción. Cuando expliques o apliques, redacta como material del estudio, no como si fueran palabras textuales del expositor.
- No infieras la personalidad, historia, afiliaciones o intención de quien predica. No escribas una biografía.
- Si la transcripción no permite sustentar una sección, devuélvela vacía o con menos elementos; nunca rellenes con generalidades.
- Escribe en español claro, pastoral y respetuoso. Evita estereotipos, lenguaje artificial y sensacionalismo.
- Las referencias bíblicas complementarias deben ser verificables y pertinentes al tema; si no puedes sostener una, omítela.
- El material debe poder usarse sin supervisión adicional, pero no sustituye la revisión pastoral.`;

export const REGLAS_GRUPOS = `DISEÑO DEL ESTUDIO PARA GRUPOS PEQUEÑOS, CÉLULAS Y FAMILIAS:
- "objetivo": propósito espiritual y formativo del encuentro, en una o dos frases.
- "idea_central": síntesis fiel del mensaje.
- "contexto_pasaje": contexto bíblico e histórico necesario para comprender el pasaje principal.
- "agenda": entre 5 y 8 momentos con "momento", "minutos" (número o rango como "10 min") y "descripcion". Debe sumar entre 60 y 90 minutos e incluir bienvenida, oración, lectura, estudio, actividad y cierre.
- "materiales": lista concreta de materiales necesarios; puede ser vacía si no se requieren.
- "preguntas_inicio": 3 a 4 preguntas abiertas para romper el hielo, conectadas con la experiencia del grupo.
- "preguntas_comprension": 4 a 6 preguntas sobre el texto y lo enseñado, no memorísticas.
- "preguntas_reflexion": 4 a 6 preguntas que lleven del entendimiento a la vida.
- "actividad": una actividad grupal con título, objetivo y pasos numerados; segura, inclusiva y sin exponer a nadie.
- "caso_practico": un caso realista para debatir, derivado del tema; vacío si no es pertinente.
- "aplicaciones": 4 a 6 aplicaciones para la vida individual y familiar.
- "compromiso_semanal": un compromiso concreto, medible y alcanzable.
- "motivos_oracion": 3 a 5 motivos conectados con el mensaje.
- "oracion_final": oración breve en primera persona plural.
- "orientaciones_lider": 5 a 8 recomendaciones prácticas para facilitar, cuidar al grupo y manejar el tiempo.`;

export const REGLAS_JOVENES = `DISEÑO DEL ESTUDIO PARA JÓVENES:
- "objetivo": propósito del encuentro en una o dos frases.
- "tema": tema central con lenguaje claro para adolescentes y jóvenes.
- "contexto_pasaje": contexto bíblico del pasaje principal, sin tecnicismos innecesarios.
- "conceptos": 3 a 6 conceptos fundamentales con explicación breve y cotidiana.
- "preguntas_reflexion": 5 a 7 preguntas de reflexión individual.
- "preguntas_grupales": 5 a 7 preguntas para conversación grupal.
- "casos_practicos": 2 a 4 situaciones reales relacionadas con amistades, familia, estudios, decisiones, identidad, responsabilidad o crecimiento espiritual, solo cuando el mensaje los toque.
- "dinamica": una dinámica participativa con título, objetivo y pasos; debe ser segura, sin humillación ni coerción.
- "aplicaciones": 4 a 6 aplicaciones cotidianas.
- "desafio_semanal": un desafío espiritual concreto y alcanzable.
- "motivos_oracion": 3 a 5 motivos.
- "guia_lider": 5 a 8 orientaciones para dirigir el encuentro juvenil.
Evita imponer temas generacionales que la prédica no aborde. No uses lenguaje forzadamente juvenil ni estereotipos.`;

export const REGLAS_NINOS = `DISEÑO DE LA CLASE BÍBLICA PARA NIÑOS:
- Adapta vocabulario, extensión y actividades al rango de edad indicado. No alteres el sentido del texto bíblico.
- "objetivo_aprendizaje": qué comprenderá y aplicará el niño, en lenguaje comprensible para el maestro.
- "relato": 3 a 6 partes con "parte" (por ejemplo "Inicio"), "titulo" y "texto" narrado para los niños. Diferencia la narración bíblica de las analogías.
- "versiculo_clave": cita y texto breve, adecuado a la edad.
- "explicacion_versiculo": explicación sencilla y fiel.
- "preguntas_comprension": 4 a 6 preguntas acordes a la edad.
- "actividad": actividad didáctica con título, objetivo, materiales y pasos. Sin materiales peligrosos.
- "juego": juego o dinámica con título, materiales y pasos; sin competencia humillante, miedo ni coerción.
- "aplicacion": aplicación práctica concreta para el niño.
- "actividad_familia": una actividad breve para compartir en casa.
- "oracion_cierre": oración sencilla y no manipuladora.
- "recomendaciones_maestro": 4 a 8 recomendaciones para el adulto responsable, incluyendo seguridad y trato sensible.
- "duracion_aproximada": duración total sugerida según la edad, por ejemplo "45 minutos".
No generes miedo, culpa innecesaria ni mensajes que avergüencen. La clase debe requerir preparación mínima del maestro.`;

export const REGLAS_DEVOCIONALES = `DISEÑO DEL PLAN DEVOCIONAL DE SIETE DÍAS:
- "introduccion": presentación del recorrido y su conexión con la prédica.
- "proposito": para qué sirve este plan y cómo usarlo.
- "dias": exactamente 7 jornadas con progresión temática coherente: comprensión, reflexión, aplicación y consolidación. Cada día debe desarrollar una dimensión REAL del mensaje y no repetir la reflexión anterior.
- Cada jornada incluye "dia" (1 a 7), "titulo", "tema", "lectura_principal" (cita y texto), "lecturas_complementarias" (0 a 3), "contexto", "reflexion", "ensenanza_central", "pregunta_introspeccion", "aplicacion", "accion" y "oracion".
- La lectura principal y las complementarias deben ser pertinentes y verificables. No inventes referencias para completar siete días.
- Si la transcripción no sostiene siete enfoques distintos, no rellenes con contenido genérico; aun así organiza siete jornadas breves alrededor de dimensiones reales del mismo mensaje, sin atribuir al expositor ideas ausentes.`;

export const REGLAS_POR_MODALIDAD: Record<Exclude<ModalidadId, 'general'>, string> = {
  grupos: REGLAS_GRUPOS,
  jovenes: REGLAS_JOVENES,
  ninos: REGLAS_NINOS,
  devocionales: REGLAS_DEVOCIONALES,
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
  grupos: ESQUEMA_GRUPOS,
  jovenes: ESQUEMA_JOVENES,
  ninos: ESQUEMA_NINOS,
  devocionales: ESQUEMA_DEVOCIONALES,
};

export function construirPromptEspecializado(modalidad: Exclude<ModalidadId, 'general'>, rangoEdad?: string): string {
  const reglas = REGLAS_POR_MODALIDAD[modalidad];
  const edad = modalidad === 'ninos' && rangoEdad ? `\nRANGO DE EDAD SELECCIONADO: ${rangoEdad}. Adapta toda la clase a este rango.` : '';
  return `Eres un pedagogo cristiano y editor ministerial. A partir de una prédica real y del análisis general ya elaborado, diseña un material especializado de alta calidad. Devuelve ÚNICAMENTE un objeto JSON válido con la propiedad "especializado". No incluyas markdown fuera del JSON.
${reglas}${edad}
${REGLAS_CALIDAD_MODALIDAD}

No repitas el análisis general completo: aprovecha sus hallazgos y desarrolla el material de la modalidad solicitada. El nombre de quien predica, si fue proporcionado, se añadirá como metadato editorial fuera de este JSON; no lo uses para inferir datos personales.`;
}
