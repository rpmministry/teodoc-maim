# Referencias bíblicas y verificación abierta

## Implementación actual

La aplicación verifica las referencias del análisis general con:

- **GetBible V2**, API de código abierto: https://github.com/getbible/v2
- **Sagradas Escrituras (1569)**, traducción española de dominio público (`sse`).
- Endpoint de consulta: `https://query.getbible.net/v2/sse/{referencia}`

El proceso:

1. Normaliza nombres y abreviaturas de libros en español.
2. Consulta las referencias únicas del análisis general.
3. Sustituye el texto detectado por el texto de la fuente abierta.
4. Registra traducción, licencia, URL de la fuente y estado.
5. Si una consulta falla, conserva el texto detectado y marca la referencia como pendiente.

La verificación real de prueba comprobó **6 de 6 referencias** del fixture con esta fuente.

## Variables de entorno

```text
BIBLE_API_BASE=https://query.getbible.net/v2
BIBLE_TRANSLATION=sse
BIBLE_TRANSLATION_LICENSE=Dominio público
BIBLE_VERIFY=true
```

- `BIBLE_VERIFY=false` desactiva las consultas y deja todas las referencias pendientes.
- `BIBLE_TRANSLATION` debe corresponder a una traducción disponible en la instancia de GetBible.
- Si cambias a una traducción con derechos, actualiza `BIBLE_TRANSLATION_LICENSE` y verifica que su licencia permita la reproducción prevista. No uses una licencia de dominio público para un texto protegido.

## Licencias

- **GetBible V2** está publicado bajo GPL-3.0. Si se autoaloja o modifica, debe cumplirse la GPL.
- **Sagradas Escrituras (1569)** se distribuye como dominio público en GetBible.
- **Reina-Valera 1960 y otras revisiones modernas** están protegidas. No se redistribuyen como texto completo sin autorización.
- No se mezclan traducciones: cada referencia verificada conserva la traducción de la fuente consultada.
- No se atribuye al predicador una traducción que no identificó.

## Autoalojamiento opcional

Para no depender de la API pública:

```bash
git clone https://github.com/getbible/v2.git
cd v2
# Sigue las instrucciones del repositorio para levantar la API
```

Después configura:

```text
BIBLE_API_BASE=http://localhost:PUERTO/v2
```

El backend de TeoDoc llama a GetBible desde el servidor; la API bíblica no se expone al navegador.

## Límites

- La traducción `sse` es histórica y su lenguaje puede resultar arcaico; es fiel al texto disponible, pero puede requerir revisión editorial.
- No se verifican las lecturas internas de las especialidades generadas por IA; el inventario verificado es el del análisis general.
- No hay marcas de tiempo por referencia.
- La consulta depende de red y disponibilidad del servicio; un fallo no invalida el análisis, solo deja la referencia pendiente.
- La verificación textual no sustituye la revisión exegética ni pastoral.
