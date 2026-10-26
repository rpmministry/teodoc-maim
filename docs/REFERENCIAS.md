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

## Reina Valera Contemporánea (RVC)

RVC es una traducción **protegida**. No es un dataset abierto y no debe extraerse de YouVersion, Bible Gateway ni sitios de terceros. La aplicación no la reconstruye con IA: la solicita a un proveedor autorizado.

### Requisitos

1. Una cuenta de **API.Bible**: https://scripture.api.bible/
2. Una clave de API.
3. Acceso/licencia para RVC en esa cuenta. Si RVC no aparece en el catálogo de tu clave, solicita acceso a Sociedades Bíblicas Unidas o al proveedor.

### Buscar el identificador de RVC

Agrega la clave a `.env.local`:

```text
BIBLE_API_KEY=tu_clave
BIBLE_API_BASE=https://api.scripture.api.bible/v1
```

Ejecuta:

```powershell
npm run biblia:buscar
```

El script lista las biblias españolas disponibles y busca nombres como «Reina Valera Contemporánea» o «RVC». Copia el `id` que corresponda.

### Configurar RVC

```text
BIBLE_PROVIDER=api-bible
BIBLE_API_BASE=https://api.scripture.api.bible/v1
BIBLE_API_KEY=tu_clave
BIBLE_TRANSLATION_ID=ID_DE_RVC
BIBLE_TRANSLATION_NAME=Reina Valera Contemporánea
BIBLE_TRANSLATION_LICENSE=© Sociedades Bíblicas Unidas. Uso autorizado.
BIBLE_FALLBACK_OPEN=false
BIBLE_VERIFY=true
```

Reinicia el servidor. Desde ese momento:

1. La IA identifica las referencias.
2. El servidor consulta el pasaje en RVC mediante API.Bible.
3. El texto RVC sustituye al texto detectado y se marca como verificado.
4. La fuente, la traducción y la licencia quedan registradas en UI, PDF y Word.
5. Si la consulta falla, la referencia queda pendiente. No se mezcla automáticamente con otra traducción.

`BIBLE_FALLBACK_OPEN=true` solo debe usarse si aceptas explícitamente el respaldo a Sagradas Escrituras 1569. Por defecto está desactivado para no mezclar traducciones.

### Estado

El adaptador `api-bible` y el buscador de identificadores están implementados. No se pudo verificar RVC en vivo porque el entorno no tiene una clave de API.Bible con licencia RVC. No se declara operativa hasta que `biblia:buscar` devuelva el ID y una consulta real confirme el texto.
## Límites

- La traducción `sse` es histórica y su lenguaje puede resultar arcaico; es fiel al texto disponible, pero puede requerir revisión editorial.
- No se verifican las lecturas internas de las especialidades generadas por IA; el inventario verificado es el del análisis general.
- No hay marcas de tiempo por referencia.
- La consulta depende de red y disponibilidad del servicio; un fallo no invalida el análisis, solo deja la referencia pendiente.
- La verificación textual no sustituye la revisión exegética ni pastoral.
