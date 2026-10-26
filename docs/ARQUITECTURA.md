# Arquitectura

## Flujo principal

1. La persona elige la modalidad y sube el audio. La API conserva la entrada de texto para integraciones.
2. El audio se sube a Cloudinary (carga directa, por partes si supera 20 MB) y se transcribe con AssemblyAI; Deepgram `nova-2` es el respaldo.
3. La transcripción se muestra en un editor para revisión y corrección.
4. El formulario valida longitud, modalidad y rango de edad antes de llamar al servidor.
5. `POST /api/validate` hace una comprobación orientativa. Si falla o no hay proveedor, la interfaz permite continuar.
6. `POST /api/analyze` ejecuta el análisis general y, si corresponde, la modalidad especializada.
7. El resultado se muestra en pestañas y se puede descargar como PDF en el navegador.

## API

### `POST /api/analyze`

Cuerpo:

```json
{
  "text": "transcripción",
  "modalidad": "general | grupos | jovenes | ninos | devocionales",
  "rangoEdad": "3-5 | 6-8 | 9-12",
  "titulo": "opcional",
  "predicador": "opcional",
  "fecha": "AAAA-MM-DD opcional"
}
```

Respuesta:

```json
{
  "titulo": "...",
  "idea_principal": "...",
  "metadatos": {
    "tituloProporcionado": "...",
    "predicador": "...",
    "fecha": "...",
    "modalidad": "...",
    "rangoEdad": "...",
    "fechaAnalisis": "ISO"
  },
  "especializado": {},
  "advertencia_especializado": "opcional"
}
```

El análisis general se devuelve siempre que se complete. La modalidad empieza vacía (`{}`) y se llena si la segunda llamada termina bien. Las advertencias no bloquean la descarga del análisis general.

### Otros endpoints conservados

- `POST /api/transcribe`: recibe `audioUrl`, valida contra SSRF y transcribe.
- `POST /api/upload`: alternativa de subida con límite de 150 MB.
- `POST /api/validate`: orienta sobre extensión y relación con una enseñanza.
- `POST /api/youtube`: obtiene audio de una fuente permitida si está configurado.
- El proxy perimetral y el rate limit siguen activos.

## Cadena de modelos

1. Gemini (`lib/ai-gemini.ts`) con timeout por modelo.
2. OpenRouter con modelos gratuitos de contexto suficiente.
3. DeepSeek si `DEEPSEEK_API_KEY` está disponible.

El especialista recibe la transcripción y un resumen compacto del análisis general. No recibe el nombre del predicador como instrucción; el nombre se aplica como metadato editorial al mostrar y al imprimir.

## Datos

- **Servidor:** no guarda la transcripción ni el análisis.
- **`localStorage`:** último resultado y marca de tiempo, TTL 48 h.
- **`sessionStorage`:** transcripción de la pestaña para recuperar o reintentar.
- **Memoria:** el PDF se genera como `Blob`; se crea una URL temporal para vista previa y se revoca al reemplazar o desmontar.
- **Cloudinary:** recibe el audio. Su retención depende de la cuenta y la configuración del proveedor; no se controla desde TeoDoc.

## Seguridad

- Rate limit por endpoint/IP en `lib/rate-limit.ts`.
- Cabeceras CSP, HSTS, `X-Frame-Options: DENY`, `nosniff` y `poweredByHeader: false`.
- Proxy con validación de host/origen para `/api/*`.
- Límite de 250 000 caracteres y mínimo de 120.
- Validación de modalidad, edad y metadatos.
- Filtro anti-SSRF en transcripción.
- Sin secretos en el cliente: las claves viven en el entorno del servidor. `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` es un identificador público.
- El prompt incluye un bloque de seguridad para ignorar instrucciones maliciosas dentro de la transcripción.
- Los datos de entrada se normalizan antes de persistir o mostrar.

## Diseño

- Tokens en `app/globals.css`.
- Componentes de marca en `components/marca.tsx`.
- Formulario en `components/formulario-analisis.tsx`.
- Resultados generales y especializados en `components/resultados/`.
- PDF en `lib/pdf/`.
- Tipos compartidos en `lib/tipos.ts`; normalización pura en `lib/normalizar.ts` para poder probarla sin navegador.

## Decisiones y límites

- Una sola llamada general más una especializada evita regenerar el análisis al cambiar de modalidad y permite conservar el general si la especialidad falla.
- No se usa una plantilla genérica con el nombre insertado: el contenido se deriva de la transcripción y el nombre solo identifica la fuente.
- El análisis especializado puede quedar incompleto; se informa y no se inventa relleno.
- No hay despliegue en producción ni integración de pagos en esta versión.
