/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { delay, extraerJSON, generarJsonConGemini } from '@/lib/ai-gemini';
import { contextoRiqueza } from '@/lib/riqueza-contenido';

// Margen amplio para encadenar todos los respaldos (gratuitos y de pago).
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Reglas del análisis. El objetivo es profundidad DINÁMICA: la cantidad y la
// extensión de las secciones dependen del contenido real, nunca de una
// plantilla fija ni de relleno artificial.
// ---------------------------------------------------------------------------
const REGLA_PROFUNDIDAD = `PROFUNDIDAD PROPORCIONAL AL CONTENIDO (regla central):
- La profundidad la determina el CONTENIDO REAL: extensión, cantidad de información, número de ideas, densidad teológica, diversidad temática y cantidad de referencias bíblicas. La duración es un indicador SECUNDARIO, nunca el único.
- Relación a buscar: extensión + densidad + diversidad de ideas + importancia teológica = profundidad del análisis.
- Mensaje breve → análisis breve pero completo; mensaje medio → análisis medio; mensaje extenso → análisis amplio; mensaje teológicamente denso → análisis más profundo.
- El contenido repetitivo NO se duplica: si una idea se repite, se sintetiza una sola vez.
- NUNCA rellenes secciones para alargar el resultado ni recortes contenido real para acortarlo.
- Si una categoría NO está realmente presente en el mensaje, devuélvela vacía ("" o []) y NO la inventes.`;

const REGLA_PUNTOS = `CAMPO "desarrollo_progresivo" (temas principales):
- La cantidad de puntos debe surgir del CONTENIDO REAL. Puede haber 2, 3, 4, 5, 6, 7, 8, 10 o más según lo que verdaderamente enseñe el mensaje.
- NO asumas 3, NO fuerces una cantidad fija, NO agregues puntos para completar.
- Cada punto es un gran bloque de enseñanza, sustantivo y distinto. "punto" es el TÍTULO del tema; "explicacion" es su desarrollo fiel a lo enseñado.
- La duración del audio NO determina el número de puntos; lo determina la cantidad de ideas principales y argumentos reales.
- Cuando el contenido lo justifique, cada punto puede incluir varios "subtemas" que desglosen subpuntos o argumentos.`;

const REGLA_NIVELES = `NIVELES DE PROFUNDIDAD (guía orientativa, NO plantilla):
- Mensaje breve: 2 a 3 puntos principales; sin subtemas forzados.
- Mensaje medio: 3 a 6 puntos; subtemas cuando existan realmente.
- Enseñanza extensa: 5 a 9 puntos con subtemas y más referencias bíblicas.
- Conferencia densa o muy extensa: 7 a 12 o más puntos si el contenido realmente los sostiene.
- Estos rangos son orientativos: si el contenido sostiene menos, devuelve menos; si sostiene más, devuelve más. Nunca inventes puntos para alcanzar un rango.`;

const REGLA_GENERAL = `CAMPOS "proposito" y "contexto_general":
- "proposito": para qué se dio el mensaje (edificación, exhortación, enseñanza, evangelización, consuelo, corrección, etc.), según lo que el propio contenido revela.
- "contexto_general": situación, ocasión o marco en que se presenta el mensaje, si el contenido lo permite.
- Si no hay evidencia suficiente, devuélvelos vacíos ("").`;

const REGLA_SUBTEMAS = `CAMPO "subtemas" (dentro de cada punto):
- Incluye subtemas SOLO cuando el contenido realmente los desarrolle dentro de ese tema.
- Cada subtema tiene "titulo" y "desarrollo" breve. Si el tema no tiene subtemas reales, devuelve [] (no inventes para llenar).`;

const REGLA_BIBLICA = `ANÁLISIS BÍBLICO:
- "texto_biblico_principal" es el pasaje central que sostiene el mensaje; si no hay uno claro, devuélvelo vacío.
- "otros_textos" reúne los demás pasajes realmente usados, con su "cita" (libro, capítulo y versículo) y su "texto" fiel a la Reina-Valera 1960.
- Registra SOLO si el mensaje lo permite: "contexto_historico", "contexto_literario", "contexto_biblico" y "relacion_textos" (cómo se conectan los pasajes entre sí).
- "interpretacion" es la lectura o explicación que EL EXPOSITOR presenta del pasaje. Nunca presentes interpretaciones externas como si el expositor las hubiera dicho.
- Diferencia lo que el mensaje AFIRMA de lo que solo se puede inferir del contenido.`;

const REGLA_ENSENANZAS = `CAMPO "ensenanzas" (enseñanza y doctrina):
- Registra QUÉ enseña el contenido acerca de: Dios, Cristo (cristología), el Espíritu Santo (pneumatología), la salvación, el pecado, la gracia, la fe, el arrepentimiento, la santificación, la iglesia, el evangelio, el Reino de Dios, la escatología, la vida cristiana, el discipulado, la misión y cualquier otra doctrina realmente presente.
- Incluye SOLO las categorías realmente presentes. "sobre" es una etiqueta corta (por ejemplo "Dios", "Cristo", "la fe"); "ensenanza" es una frase clara y fiel al contenido.
- No inventes doctrina que el mensaje no sustente. Si ninguna categoría está presente, devuelve [].`;

const REGLA_CONCEPTOS = `CAMPO "conceptos_clave":
- Devuelve de 5 a 8 conceptos teológicos o temas REALES que aparezcan en el contenido.
- Cada concepto debe tener 1 a 3 palabras (por ejemplo: "fe", "gracia", "oración", "discipulado", "evangelización").
- NUNCA devuelvas frases largas, oraciones, numeración, viñetas ni fragmentos. No repitas ni uses palabras vacías.`;

const REGLA_CONCEPTOS_TEOLOGICOS = `CAMPO "conceptos_teologicos":
- Solo cuando el contenido desarrolle conceptos teológicos reales (gracia, fe, santificación, redención, arrepentimiento, obediencia, discipulado, evangelización, salvación, etc.).
- Cada uno con "concepto" (1 a 3 palabras) y "significado" breve según el uso en la enseñanza.
- No conviertas esto en una lista automática: si no hay conceptos sustentados, devuelve [].`;

const REGLA_INFOGRAFIA = `CAMPO "infografia" (resumen visual para redes sociales, NO es el PDF):
- Debe ser una síntesis condensada y visual, resultado de una segunda selección editorial del mensaje.
- "mensaje_central": la idea principal en una sola frase.
- "verdad_principal": la enseñanza fundamental que resume el mensaje.
- "grandes_ensenanzas": entre 2 y 10 según la riqueza REAL del mensaje (breve: 2-3; medio: 4-6; extenso o denso: 6-10). Cada una con "titulo" breve y "descripcion" de 1 a 2 líneas. No traslades el desarrollo completo del PDF.
- "palabras_clave": los conceptos más representativos para comunicación visual (no tienen que ser los mismos del PDF).
- "conexiones_biblicas": pares de referencias (cita y texto) que el mensaje relaciona entre sí, SOLO si existen realmente.
- "frase_recordar": una frase breve derivada del mensaje, apta como mensaje para redes.
- "frase_corta": un titular impactante y corto. "texto_clave": el pasaje bíblico clave. "contexto_breve": una línea de contexto.
- NO incluyas oración, motivos de oración ni aplicación devocional en la infografía.`;

const REGLA_CONCLUSION = `CAMPO "conclusion":
- Síntesis final breve (pocas frases) que responde: ¿cuál es el mensaje fundamental que el creyente debería llevarse tras estudiar este mensaje?
- Si el contenido no permite una conclusión sustentada, devuélvela vacía ("").`;

const REGLA_CONCISION = `CONCISIÓN Y LÍMITES (rendimiento y legibilidad):
- Escribe con precisión y sin relleno. Respeta estos MÁXIMOS de longitud: "explicacion" ≤ 600 caracteres; "descripcion" de grandes_ensenanzas ≤ 180; "significado" ≤ 160; "contexto_biblico", "contexto_historico", "contexto_literario", "contexto_general", "relacion_textos" e "interpretacion" ≤ 320; "conclusion" y "oracion" ≤ 500.
- Máximo 12 puntos principales, 4 subtemas y 4 versículos por punto (los más relevantes).
- Máximo 10 grandes_ensenanzas, 8 conceptos_clave, 8 conceptos_teologicos, 6 palabras_clave, 6 conexiones_biblicas.
- No repitas el mismo contenido en varios campos.`;

const REGLAS_ANALISIS = `${REGLA_PROFUNDIDAD}
${REGLA_NIVELES}
${REGLA_PUNTOS}
${REGLA_GENERAL}
${REGLA_SUBTEMAS}
${REGLA_BIBLICA}
${REGLA_ENSENANZAS}
${REGLA_CONCEPTOS}
${REGLA_CONCEPTOS_TEOLOGICOS}
${REGLA_CONCLUSION}
${REGLA_INFOGRAFIA}
${REGLA_CONCISION}`;

const SYSTEM_PROMPT = `Eres un analista teológico conservador de tradición cristiana evangélica. Analiza la transcripción de un mensaje, enseñanza o conferencia y devuelve ÚNICAMENTE un objeto JSON válido (sin markdown fuera del JSON) con esta estructura exacta:
    {
      "titulo": "...",
      "idea_principal": "...",
      "tema_principal": "...",
      "proposito": "...",
      "contexto_general": "...",
      "texto_biblico_principal": { "cita": "...", "texto": "..." },
      "otros_textos": [ { "cita": "...", "texto": "..." } ],
      "contexto_biblico": "...",
      "contexto_historico": "...",
      "contexto_literario": "...",
      "relacion_textos": "...",
      "interpretacion": "...",
      "desarrollo_progresivo": [
        {
          "punto": "...",
          "explicacion": "...",
          "subtemas": [ { "titulo": "...", "desarrollo": "..." } ],
          "versiculos": [ { "cita": "...", "texto": "..." } ]
        }
      ],
      "ensenanzas": [ { "sobre": "...", "ensenanza": "..." } ],
      "conceptos_clave": ["fe", "gracia", "oración"],
      "conceptos_teologicos": [ { "concepto": "...", "significado": "..." } ],
      "aplicacion": ["...", "..."],
      "conclusion": "...",
      "oracion": "...",
      "infografia": {
        "frase_corta": "...",
        "texto_clave": "...",
        "contexto_breve": "...",
        "mensaje_central": "...",
        "verdad_principal": "...",
        "grandes_ensenanzas": [ { "titulo": "...", "descripcion": "..." } ],
        "palabras_clave": ["fe", "gracia"],
        "conexiones_biblicas": [ { "cita": "...", "texto": "..." } ],
        "frase_recordar": "..."
      }
    }
    Al referirte a quien comunica el mensaje usa "el expositor" (o "el orador"); nunca "el predicador".
    Usa Reina-Valera 1960 para todos los versículos bíblicos.
    ${REGLAS_ANALISIS}`;

const MODELOS_OPENROUTER_DEFAULT = ['google/gemini-2.0-flash-exp:free', 'qwen/qwen-2.5-72b-instruct:free'];

const SCHEMA_CONFIG = {
  type: Type.OBJECT,
  properties: {
    titulo: { type: Type.STRING },
    idea_principal: { type: Type.STRING },
    tema_principal: { type: Type.STRING },
    proposito: { type: Type.STRING },
    contexto_general: { type: Type.STRING },
    texto_biblico_principal: {
      type: Type.OBJECT,
      properties: { cita: { type: Type.STRING }, texto: { type: Type.STRING } },
      required: ['cita', 'texto'],
    },
    otros_textos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { cita: { type: Type.STRING }, texto: { type: Type.STRING } },
        required: ['cita', 'texto'],
      },
    },
    contexto_biblico: { type: Type.STRING },
    contexto_historico: { type: Type.STRING },
    contexto_literario: { type: Type.STRING },
    relacion_textos: { type: Type.STRING },
    interpretacion: { type: Type.STRING },
    desarrollo_progresivo: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          punto: { type: Type.STRING },
          explicacion: { type: Type.STRING },
          subtemas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { titulo: { type: Type.STRING }, desarrollo: { type: Type.STRING } },
              required: ['titulo', 'desarrollo'],
            },
          },
          versiculos: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { cita: { type: Type.STRING }, texto: { type: Type.STRING } },
              required: ['cita', 'texto'],
            },
          },
        },
        required: ['punto', 'explicacion', 'subtemas', 'versiculos'],
      },
    },
    ensenanzas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { sobre: { type: Type.STRING }, ensenanza: { type: Type.STRING } },
        required: ['sobre', 'ensenanza'],
      },
    },
    conceptos_clave: { type: Type.ARRAY, items: { type: Type.STRING } },
    conceptos_teologicos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { concepto: { type: Type.STRING }, significado: { type: Type.STRING } },
        required: ['concepto', 'significado'],
      },
    },
    aplicacion: { type: Type.ARRAY, items: { type: Type.STRING } },
    conclusion: { type: Type.STRING },
    oracion: { type: Type.STRING },
    infografia: {
      type: Type.OBJECT,
      properties: {
        frase_corta: { type: Type.STRING },
        texto_clave: { type: Type.STRING },
        contexto_breve: { type: Type.STRING },
        mensaje_central: { type: Type.STRING },
        verdad_principal: { type: Type.STRING },
        grandes_ensenanzas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { titulo: { type: Type.STRING }, descripcion: { type: Type.STRING } },
            required: ['titulo', 'descripcion'],
          },
        },
        palabras_clave: { type: Type.ARRAY, items: { type: Type.STRING } },
        conexiones_biblicas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { cita: { type: Type.STRING }, texto: { type: Type.STRING } },
            required: ['cita', 'texto'],
          },
        },
        frase_recordar: { type: Type.STRING },
      },
      required: [
        'frase_corta',
        'texto_clave',
        'contexto_breve',
        'mensaje_central',
        'verdad_principal',
        'grandes_ensenanzas',
        'palabras_clave',
        'frase_recordar',
      ],
    },
  },
  required: [
    'titulo',
    'idea_principal',
    'tema_principal',
    'texto_biblico_principal',
    'contexto_biblico',
    'desarrollo_progresivo',
    'ensenanzas',
    'conceptos_clave',
    'conceptos_teologicos',
    'aplicacion',
    'conclusion',
    'oracion',
    'infografia',
  ],
};

// ---------------------------------------------------------------------------
// Normalización defensiva: garantiza una estructura segura para el PDF y la
// infografía, aunque la IA devuelva campos faltantes o con ruido.
// ---------------------------------------------------------------------------
const PALABRAS_VACIAS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'en', 'y', 'o', 'u', 'que',
  'por', 'para', 'con', 'sin', 'su', 'sus', 'se', 'es', 'son', 'como', 'mas', 'más', 'punto', 'puntos',
  'principal', 'principales', 'tema', 'temas', 'cosa', 'cosas', 'sobre', 'este', 'esta', 'estos', 'estas',
]);

function texto(valor: unknown): string {
  if (typeof valor !== 'string') return '';
  return valor.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

function listaTexto(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.map((item) => texto(item)).filter(Boolean);
}

function limpiarConcepto(valor: unknown): string | null {
  const base = texto(valor).replace(/^[\-*\u2022\d.)\s]+/, '').replace(/[.,;:]+$/, '').trim();
  if (!base) return null;
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(base)) return null;
  const palabras = base.split(' ').filter(Boolean);
  if (palabras.length === 0 || palabras.length > 3) return null;
  if (base.length > 32) return null;
  if (palabras.length === 1 && PALABRAS_VACIAS.has(base.toLowerCase())) return null;
  return base;
}

function normalizarConceptos(valor: unknown, max = 8): string[] {
  const salida: string[] = [];
  if (Array.isArray(valor)) {
    for (const item of valor) {
      const c = limpiarConcepto(item);
      if (c && !salida.some((s) => s.toLowerCase() === c.toLowerCase())) salida.push(c);
      if (salida.length >= max) break;
    }
  }
  return salida;
}

function normalizarVersiculos(valor: unknown): Array<{ cita: string; texto: string }> {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((v: any) => ({ cita: texto(v?.cita), texto: texto(v?.texto) }))
    .filter((v) => v.cita || v.texto);
}

function normalizarTextoBiblico(valor: any): { cita: string; texto: string } {
  if (typeof valor === 'string') {
    const limpio = texto(valor);
    return { cita: limpio, texto: '' };
  }
  return { cita: texto(valor?.cita), texto: texto(valor?.texto) };
}

function normalizarPuntos(valor: unknown) {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((p: any) => ({
      punto: texto(p?.punto),
      explicacion: texto(p?.explicacion),
      subtemas: Array.isArray(p?.subtemas)
        ? p.subtemas
            .map((s: any) => ({ titulo: texto(s?.titulo), desarrollo: texto(s?.desarrollo) }))
            .filter((s: any) => s.titulo || s.desarrollo)
        : [],
      versiculos: normalizarVersiculos(p?.versiculos),
    }))
    .filter((p: any) => p.punto || p.explicacion);
}

function normalizarEnsenanzas(valor: unknown): Array<{ sobre: string; ensenanza: string }> {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((e: any) => ({ sobre: texto(e?.sobre), ensenanza: texto(e?.ensenanza) }))
    .filter((e) => e.ensenanza)
    .slice(0, 12);
}

function normalizarConceptosTeologicos(valor: unknown): Array<{ concepto: string; significado: string }> {
  if (!Array.isArray(valor)) return [];
  const salida: Array<{ concepto: string; significado: string }> = [];
  for (const item of valor) {
    const concepto = limpiarConcepto((item as any)?.concepto);
    if (!concepto) continue;
    if (salida.some((s) => s.concepto.toLowerCase() === concepto.toLowerCase())) continue;
    salida.push({ concepto, significado: texto((item as any)?.significado) });
    if (salida.length >= 8) break;
  }
  return salida;
}

// Respaldo si la IA no devuelve conceptos: extrae palabras significativas del
// propio análisis (nunca fragmentos ni ruido).
function derivarConceptos(datos: any): string[] {
  const fuente = [
    texto(datos?.idea_principal),
    ...(Array.isArray(datos?.desarrollo_progresivo) ? datos.desarrollo_progresivo.map((p: any) => texto(p?.punto)) : []),
  ].join(' ');
  const conteo = new Map<string, number>();
  for (const bruto of fuente.toLowerCase().split(/[^a-záéíóúüñ]+/)) {
    if (bruto.length < 4 || PALABRAS_VACIAS.has(bruto)) continue;
    conteo.set(bruto, (conteo.get(bruto) || 0) + 1);
  }
  return Array.from(conteo.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([palabra]) => palabra.charAt(0).toUpperCase() + palabra.slice(1));
}

function primeraFrase(entrada: string, max: number): string {
  const limpio = texto(entrada);
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  const ultimoPunto = corte.lastIndexOf('.');
  return `${(ultimoPunto > max * 0.5 ? corte.slice(0, ultimoPunto + 1) : corte).trimEnd()}…`;
}

// Fallback editorial: si la IA no generó "grandes_ensenanzas", se derivan de los
// puntos principales (título corto + primera frase del desarrollo). Garantiza
// que la infografía siempre tenga su sección 04 sin inventar contenido.
function derivarGrandesEnsenanzas(puntos: Array<{ punto: string; explicacion: string }>): Array<{ titulo: string; descripcion: string }> {
  return puntos
    .filter((p) => p.punto || p.explicacion)
    .slice(0, 10)
    .map((p) => {
      const tituloBase = p.punto.split(/[.:;—–-]/)[0].trim() || p.punto;
      return {
        titulo: primeraFrase(tituloBase, 60),
        descripcion: primeraFrase(p.explicacion, 170),
      };
    })
    .filter((g) => g.titulo || g.descripcion);
}

function normalizarGrandesEnsenanzas(
  valor: unknown,
  fallback: Array<{ titulo: string; descripcion: string }>,
): Array<{ titulo: string; descripcion: string }> {
  if (Array.isArray(valor)) {
    const lista = valor
      .map((g: any) => ({ titulo: texto(g?.titulo), descripcion: texto(g?.descripcion) }))
      .filter((g) => g.titulo || g.descripcion)
      .slice(0, 10);
    if (lista.length) return lista;
  }
  return fallback;
}

function normalizarAnalisis(datos: any) {
  const puntos = normalizarPuntos(datos?.desarrollo_progresivo);
  const aplicaciones = listaTexto(datos?.aplicacion);
  const conceptos = normalizarConceptos(datos?.conceptos_clave);
  const conceptoFinal = conceptos.length ? conceptos : derivarConceptos(datos);
  const textoBiblico = normalizarTextoBiblico(datos?.texto_biblico_principal);

  const infografia = datos?.infografia || {};
  const fraseCorta = texto(infografia?.frase_corta);
  const mensajeCentral = texto(infografia?.mensaje_central) || texto(datos?.idea_principal);
  const verdadPrincipal = texto(infografia?.verdad_principal) || texto(datos?.tema_principal) || texto(datos?.idea_principal);
  const grandesEnsenanzas = normalizarGrandesEnsenanzas(
    infografia?.grandes_ensenanzas,
    derivarGrandesEnsenanzas(puntos),
  );
  const palabrasClave = normalizarConceptos(infografia?.palabras_clave, 6);
  const fraseRecordar = texto(infografia?.frase_recordar) || fraseCorta || texto(datos?.conclusion);

  // Si no hay pasaje principal declarado, se toma el primer versículo citado.
  const pasajeFallback = puntos.flatMap((p: any) => p.versiculos).find((v: any) => v.cita) || { cita: '', texto: '' };
  const textoBiblicoFinal = textoBiblico.cita || textoBiblico.texto ? textoBiblico : pasajeFallback;

  return {
    titulo: texto(datos?.titulo) || 'Análisis del mensaje',
    idea_principal: texto(datos?.idea_principal),
    tema_principal: texto(datos?.tema_principal),
    proposito: texto(datos?.proposito),
    contexto_general: texto(datos?.contexto_general),
    texto_biblico_principal: textoBiblicoFinal,
    otros_textos: normalizarVersiculos(datos?.otros_textos),
    contexto_biblico: texto(datos?.contexto_biblico),
    contexto_historico: texto(datos?.contexto_historico),
    contexto_literario: texto(datos?.contexto_literario),
    relacion_textos: texto(datos?.relacion_textos),
    interpretacion: texto(datos?.interpretacion),
    desarrollo_progresivo: puntos,
    ensenanzas: normalizarEnsenanzas(datos?.ensenanzas),
    conceptos_clave: conceptoFinal,
    conceptos_teologicos: normalizarConceptosTeologicos(datos?.conceptos_teologicos),
    aplicacion: aplicaciones,
    conclusion: texto(datos?.conclusion),
    oracion: texto(datos?.oracion),
    infografia: {
      frase_corta: fraseCorta,
      texto_clave: texto(infografia?.texto_clave) || textoBiblicoFinal.texto,
      contexto_breve: texto(infografia?.contexto_breve) || texto(datos?.contexto_biblico),
      mensaje_central: mensajeCentral,
      verdad_principal: verdadPrincipal,
      grandes_ensenanzas: grandesEnsenanzas,
      palabras_clave: palabrasClave.length ? palabrasClave : conceptoFinal.slice(0, 6),
      frase_recordar: fraseRecordar,
      conexiones_biblicas: normalizarVersiculos(infografia?.conexiones_biblicas),
    },
  };
}

// Clasificación de riqueza: ver lib/riqueza-contenido.ts (lógica pura y
// verificable). El contenido real siempre manda sobre estas métricas.

// Motor principal: Gemini (contexto amplio y respuesta rápida con salida JSON).
async function analizarConGemini(text: string, contexto: string): Promise<any | null> {
  return generarJsonConGemini({
    contents: `Analiza esta transcripción y extrae el desglose teológico completo en JSON:\n\n${text}`,
    systemInstruction: `Eres un analista teológico conservador de tradición cristiana evangélica. Usa Reina-Valera 1960. Responde con un JSON estrictamente estructurado según el esquema. No inventes contenido que el mensaje no sostenga.\nAl referirte a quien comunica el mensaje usa "el expositor" (o "el orador"), nunca "el predicador".\n${contexto}\n${REGLAS_ANALISIS}`,
    responseSchema: SCHEMA_CONFIG,
    retryDelayMs: 1200,
    // Tope por intento: si un modelo está saturado no debe bloquear el pipeline.
    timeoutMs: 40_000,
    onError: (modelo, msg) => console.warn(`[Gemini Falló - ${modelo}]:`, msg),
  });
}

// Respaldo: OpenRouter con modelos gratuitos.
const OPENROUTER_TIMEOUT_MS = 150_000;
const OPENROUTER_PREFERIDOS = ['google/gemini-2.0-flash-exp:free', 'google/gemini-flash-1.5:free', 'meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free'];

async function analizarConOpenRouter(text: string, contexto: string): Promise<any | null> {
  let modelos = MODELOS_OPENROUTER_DEFAULT;
  try {
    const resModels = await fetch('https://openrouter.ai/api/v1/models');
    if (resModels.ok) {
      const dataModels = await resModels.json();
      const vigentes: string[] = dataModels.data
        .filter((m: any) => m.id.endsWith(':free') && m.context_length >= 40000)
        .map((m: any) => m.id);
      if (vigentes.length > 0) {
        // Prioriza modelos rápidos conocidos y añade el resto después.
        const preferidos = OPENROUTER_PREFERIDOS.filter((m) => vigentes.includes(m));
        const otros = vigentes.filter((m) => !preferidos.includes(m));
        modelos = [...preferidos, ...otros].slice(0, 3);
      }
    }
  } catch {
    console.warn('No se pudo obtener la lista dinámica, usando defaults.');
  }

  // Presupuesto global de OpenRouter: no encadenar modelos más allá del tope,
  // para que el pipeline completo quede dentro del límite del servidor.
  const inicio = Date.now();
  for (const modelo of modelos) {
    if (Date.now() - inicio > OPENROUTER_TIMEOUT_MS) break;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS - (Date.now() - inicio));
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://teodoc.app',
          'X-Title': 'TeoDoc Ministerial',
        },
        body: JSON.stringify({
          model: modelo,
          messages: [{ role: 'system', content: `${SYSTEM_PROMPT}\n${contexto}` }, { role: 'user', content: `Transcripción:\n\n${text}` }],
          temperature: 0.3,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 429 || response.status === 503) await delay(1200);
        continue;
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return extraerJSON(content);
    } catch (orErr: any) {
      console.warn(`[OpenRouter Falló - ${modelo}]:`, orErr?.name === 'AbortError' ? 'timeout' : orErr?.message || orErr);
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_TIMEOUT_MS = 90_000;

// Último recurso: DeepSeek (de pago). Solo se usa cuando TODOS los modelos
// gratuitos fallaron, para que el análisis nunca se quede sin respuesta.
async function analizarConDeepSeek(text: string, contexto: string): Promise<any | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn('[DeepSeek] Sin DEEPSEEK_API_KEY: se omite el respaldo de pago.');
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);
  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n${contexto}` },
          { role: 'user', content: `Transcripción:\n\n${text}` },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[DeepSeek Falló]: HTTP ${response.status}`);
      return null;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      console.log('[DeepSeek] Análisis completado con el respaldo de pago.');
      return extraerJSON(content);
    }
  } catch (dsErr: any) {
    console.warn('[DeepSeek Falló]:', dsErr?.name === 'AbortError' ? 'timeout' : dsErr?.message || dsErr);
  } finally {
    clearTimeout(timeout);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No se recibió texto para analizar.' }, { status: 400 });
    }

    console.log(`[Análisis] Texto recibido (${text.length} caracteres)`);
    const contexto = contextoRiqueza(text);

    // 1) Gemini (gratuito, motor principal). 2) OpenRouter (gratuito).
    // 3) DeepSeek (de pago, solo si todo lo gratuito falla).
    let jsonResult = await analizarConGemini(text, contexto);
    if (!jsonResult) jsonResult = await analizarConOpenRouter(text, contexto);
    if (!jsonResult) jsonResult = await analizarConDeepSeek(text, contexto);

    if (!jsonResult) {
      // 503 = transitorio: la app lo traduce a un mensaje amigable y permite reintentar.
      return NextResponse.json({ error: 'busy' }, { status: 503 });
    }

    // Normaliza SIEMPRE antes de devolver: el PDF y la infografía nunca reciben
    // datos corruptos ni campos faltantes.
    return NextResponse.json(normalizarAnalisis(jsonResult));
  } catch (error: any) {
    console.error('[Análisis] Error:', error?.message || error);
    return NextResponse.json({ error: 'busy' }, { status: 503 });
  }
}
