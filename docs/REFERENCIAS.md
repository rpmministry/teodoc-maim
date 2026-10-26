# Referencias bíblicas y verificación

## Estado actual

La aplicación construye un **inventario de referencias detectadas** a partir del análisis de la transcripción. Cada referencia incluye:

- cita;
- texto detectado, si existe;
- tipo de uso (`lectura_o_cita` o `referencia_detectada`);
- confianza inicial (`media` o `baja`);
- estado (`pendiente_de_verificacion`);
- traducción identificada;
- fuente.

El inventario se muestra en el análisis general web, en el PDF general y en el Word general. Las demás especialidades conservan las citas usadas y una nota de verificación.

## Por qué todo aparece como pendiente

No hay una API bíblica autorizada configurada en este entorno. Por eso el sistema **no afirma** que un texto sea una cita canónica verificada. Tampoco reconstruye versículos de memoria en los prompts: la instrucción actual es registrar la referencia y conservar solo el fragmento que la transcripción cite, marcándolo para revisión.

Esto cumple con el principio de no presentar como certeza lo que no se ha comprobado. La verificación con una fuente autorizada es un paso posterior, humano o mediante un proveedor con licencia.

## Traducciones y permisos

- Reina-Valera 1960 es una traducción protegida. No se debe redistribuir su texto completo sin autorización.
- No se deben mezclar traducciones ni atribuir al predicador una versión que no identificó.
- Si se integra una API bíblica, debe registrar proveedor, traducción, licencia, fecha de consulta y restricciones de reproducción.
- Si una traducción no permite la reproducción, el documento debe mostrar la referencia, un extracto permitido cuando corresponda y un enlace a una fuente autorizada.
- Las fuentes de terceros no conceden permiso automático para redistribuir sus textos.

## Próxima integración recomendada

1. Elegir un proveedor bíblico autorizado con permiso de reproducción para el uso previsto.
2. Configurar la clave en el servidor, nunca en el cliente.
3. Implementar una etapa `verificarReferencias` que consulte el pasaje, guarde la traducción y la licencia, y actualice el estado a `verificada` o `no_disponible`.
4. Mostrar el estado en la interfaz y en los PDF/Word.
5. No generar los documentos finales con citas marcadas como verificadas si la consulta no se completó.

## Pruebas

`npm run test:modalidades` comprueba que:

- el inventario no duplica referencias;
- todas las referencias declaran su estado;
- los tipos de uso son válidos;
- el texto no promete una verificación que no existe.
