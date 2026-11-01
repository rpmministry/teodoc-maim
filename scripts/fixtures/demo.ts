import type { EstudioBosquejo, EstudioCasa2, MetadatosPredica, ModalidadId, PlanDevocional, ResultadoAnalisis } from '../../lib/tipos.ts';
import { normalizarAnalisisGeneral, normalizarEspecializado } from '../../lib/normalizar.ts';

export const TEXTO_DEMO = `Hoy quiero hablarles de una fe que no se queda en las palabras. Santiago, en el capítulo dos, versículo diecisiete, nos dice que la fe, si no tiene obras, es muerta en sí misma. No se trata de ganar la salvación con esfuerzo humano, sino de demostrar con la vida que realmente confiamos en Dios. La fe bíblica comienza cuando escuchamos su Palabra con un corazón dispuesto. Después, esa fe se vuelve obediencia concreta en la casa, en el trabajo y en la manera en que tratamos a los demás. También se vuelve perseverancia cuando las circunstancias no cambian. Abraham creyó a Dios y su fe se expresó en obediencia. Rahab confió y actuó conforme a esa confianza. Nosotros estamos llamados a vivir una fe que escuche, que obedezca y que espere en las promesas de Dios. Que esta semana podamos identificar una acción concreta en la que nuestra fe se haga visible.`;

const PUNTOS = [
  {
    punto: 'La fe que escucha la Palabra',
    explicacion: 'La fe no nace de la imaginación ni de las emociones aisladas; nace de la Palabra de Dios recibida con un corazón dispuesto. Escuchar es el primer acto de confianza.',
    subtemas: [
      { titulo: 'Escuchar antes de actuar', desarrollo: 'La escucha obediente precede a la acción. No podemos obedecer lo que no hemos recibido.' },
      { titulo: 'Una Palabra que confronta', desarrollo: 'La Escritura no solo consuela: también corrige y orienta nuestra manera de vivir.' },
    ],
    versiculos: [{ cita: 'Romanos 10:17', texto: 'Así que la fe es por el oír, y el oír, por la palabra de Dios.' }],
  },
  {
    punto: 'La fe que obedece en lo cotidiano',
    explicacion: 'La obediencia concreta demuestra que la confianza en Dios es real. La fe se hace visible en decisiones pequeñas y constantes, no solo en momentos extraordinarios.',
    subtemas: [
      { titulo: 'Obediencia en la casa', desarrollo: 'La fe se prueba en el trato con la familia, en la paciencia y en la fidelidad.' },
      { titulo: 'Obediencia en el trabajo', desarrollo: 'El testimonio cristiano se sostiene con integridad y servicio.' },
    ],
    versiculos: [{ cita: 'Santiago 1:22', texto: 'Pero sed hacedores de la palabra, y no tan solamente oidores, engañándoos a vosotros mismos.' }],
  },
  {
    punto: 'La fe que persevera en la prueba',
    explicacion: 'La fe madura cuando las circunstancias no cambian de inmediato. Perseverar no es negar el dolor, sino sostener la confianza en Dios mientras se espera.',
    subtemas: [
      { titulo: 'Esperanza activa', desarrollo: 'Esperar no es quedarse quietos: es seguir sirviendo mientras Dios obra.' },
    ],
    versiculos: [{ cita: 'Hebreos 11:1', texto: 'Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.' }],
  },
  {
    punto: 'La fe que se vuelve testimonio',
    explicacion: 'Cuando la fe se traduce en amor y servicio, otros pueden ver el evangelio. Nuestra vida se convierte en una señal humilde de la gracia de Dios.',
    subtemas: [
      { titulo: 'Un testimonio cercano', desarrollo: 'El amor concreto abre puertas que el discurso solo no puede abrir.' },
    ],
    versiculos: [{ cita: 'Mateo 5:16', texto: 'Así alumbre vuestra luz delante de los hombres, para que vean vuestras buenas obras.' }],
  },
  {
    punto: 'La fe que descansa en la gracia',
    explicacion: 'No somos aceptados por nuestros logros, sino por la obra de Cristo. La gracia nos libera del orgullo y también de la desesperanza.',
    subtemas: [],
    versiculos: [{ cita: 'Efesios 2:8', texto: 'Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios.' }],
  },
];

const GRUPOS = {
  objetivo: 'Ayudar al grupo a reconocer que la fe bíblica se expresa en escucha, obediencia, perseverancia y testimonio, y a elegir un paso concreto de obediencia para esta semana.',
  idea_central: 'La fe genuina no se queda en la confesión: se vuelve obediencia cotidiana sostenida por la gracia de Dios.',
  contexto_pasaje: 'Santiago escribe a creyentes dispersos que enfrentaban pruebas. Su carta insiste en que la fe verdadera produce frutos visibles y no se reduce a una declaración verbal.',
  agenda: [
    { momento: 'Bienvenida y oración', minutos: '8 min', descripcion: 'Recibir al grupo, agradecer su presencia e invitar a orar brevemente.' },
    { momento: 'Lectura del pasaje', minutos: '7 min', descripcion: 'Leer Santiago 2:14-26 en voz alta y pedir que alguien resuma lo escuchado.' },
    { momento: 'Romper el hielo', minutos: '8 min', descripcion: 'Compartir una experiencia cotidiana donde la confianza se demostró con acciones.' },
    { momento: 'Estudio guiado', minutos: '25 min', descripcion: 'Trabajar las preguntas de comprensión y reflexión en grupos de dos o tres.' },
    { momento: 'Actividad', minutos: '12 min', descripcion: 'Construir un compromiso de obediencia concreta con el grupo.' },
    { momento: 'Oración y cierre', minutos: '10 min', descripcion: 'Orar por los compromisos y despedir al grupo.' },
  ],
  materiales: ['Biblias impresas o digitales', 'Hojas de papel y lápices', 'Una mesa para escribir los compromisos', 'Refrigerio opcional'],
  preguntas_inicio: ['¿Cuándo fue la última vez que confiaste en alguien y esa confianza te llevó a actuar?', '¿Qué diferencia hay entre decir que creemos algo y vivirlo?', '¿Dónde te resulta más difícil ser coherente entre lo que crees y lo que haces?'],
  preguntas_comprension: ['¿Qué ejemplos usa Santiago para mostrar que la fe sin obras es muerta?', '¿Cómo demuestra Abraham su fe según el pasaje?', '¿Qué papel juega la gracia en esta enseñanza?', '¿Por qué la obediencia no debe entenderse como un pago por la salvación?', '¿Qué significa que la fe se perfecciona con las obras?'],
  preguntas_reflexion: ['¿Qué acción concreta de obediencia estás postergando?', '¿En qué área de tu vida necesitas perseverar aunque no veas resultados inmediatos?', '¿Cómo puede tu familia ver tu fe esta semana?', '¿Qué temor te impide obedecer?', '¿A quién puedes invitar a caminar contigo en este compromiso?'],
  actividad: {
    titulo: 'Un paso visible',
    objetivo: 'Convertir la reflexión en un compromiso concreto, pequeño y verificable.',
    pasos: [
      'Entrega una hoja a cada participante y pide que escriba una sola acción de obediencia para esta semana.',
      'Invita a revisar que la acción sea concreta, alcanzable y coherente con el pasaje.',
      'Pide que compartan la acción con una persona del grupo que pueda acompañarlos.',
      'Escriban una fecha para revisar el compromiso en el próximo encuentro.',
      'Cierren con oración por cada compromiso.',
    ],
  },
  caso_practico: 'Una persona dice creer en el perdón de Dios, pero mantiene un conflicto con su hermana y no da el primer paso para reconciliarse. ¿Qué acción concreta mostraría que su fe es real sin caer en un simple activismo?',
  aplicaciones: ['Elige una acción de obediencia concreta y escríbela con una fecha.', 'Pide perdón a alguien esta semana si el Espíritu te lo muestra.', 'Sostén una práctica de oración y lectura bíblica aunque no sientas emoción inmediata.', 'Sirve a alguien en la familia sin esperar reconocimiento.', 'Comparte con una persona tu confianza en Dios con respeto y sencillez.'],
  compromiso_semanal: 'Durante esta semana, escribiré una acción de obediencia concreta y la revisaré con la persona que me acompañe en el grupo.',
  motivos_oracion: ['Por valentía para obedecer en lo cotidiano.', 'Por perseverancia en medio de la prueba.', 'Por humildad para recibir la gracia de Dios.', 'Por un testimonio coherente en la familia y el trabajo.'],
  oracion_final: 'Señor, gracias por tu gracia. Danos una fe que escuche, que obedezca y que persevere. Que nuestra vida haga visible tu amor. Amén.',
  orientaciones_lider: ['Crea un ambiente seguro y sin presión.', 'No permitas que la actividad se convierta en una competencia.', 'Cierra cada pregunta con una aplicación concreta.', 'Recuerda que el objetivo es acompañar, no controlar.', 'Cuida el tiempo para que la oración no se omita.', 'Si alguien comparte una situación delicada, responde con confidencialidad.'],
};

const JOVENES = {
  objetivo: 'Invitar a los jóvenes a descubrir que la fe bíblica se demuestra en decisiones cotidianas y a comprometerse con un paso concreto de obediencia.',
  tema: 'Una fe que se nota',
  contexto_pasaje: 'Santiago escribe a una comunidad que vivía presión y dispersión. Su enseñanza desafía la idea de una fe solo intelectual y llama a una vida coherente.',
  conceptos: [
    { concepto: 'Fe', explicacion: 'Confianza activa en Dios que se expresa en obediencia.' },
    { concepto: 'Obras', explicacion: 'Frutos visibles de una fe real, no un pago por la salvación.' },
    { concepto: 'Gracia', explicacion: 'El regalo de Dios que nos acepta y nos capacita para vivir de otra manera.' },
    { concepto: 'Perseverancia', explicacion: 'Seguir confiando y sirviendo cuando la respuesta tarda.' },
  ],
  preguntas_reflexion: ['¿Qué evidencia hay en mi semana de que confío en Dios?', '¿Cuándo uso la fe solo como una palabra cómoda?', '¿Qué decisión estoy evitando por miedo?', '¿Cómo afecta mi fe a mi manera de tratar a otros?', '¿Qué me ayuda a perseverar cuando nada cambia?', '¿Qué significa para mí vivir por gracia y no por apariencia?'],
  preguntas_grupales: ['¿Por qué es fácil separar la fe de la vida diaria?', '¿Qué ejemplos de fe activa vemos en nuestra comunidad?', '¿Cómo podemos acompañarnos en la obediencia?', '¿Qué límites necesitamos poner a la comparación y la apariencia?', '¿Cómo compartiríamos esta enseñanza con un amigo?', '¿Qué paso podemos dar juntos esta semana?'],
  casos_practicos: [
    'Un joven dice que cree en Dios, pero trata a sus compañeros con desprecio cuando nadie lo ve. ¿Qué debería cambiar primero?',
    'Una estudiante siente que su fe no vale porque no tiene experiencias emocionales intensas. ¿Cómo la ayudaría Santiago a entender la fe?',
    'Un grupo de amigos quiere servir en la comunidad, pero solo si recibe reconocimiento. ¿Cómo se puede servir con humildad?',
  ],
  dinamica: {
    titulo: 'Fe en acción: mapa de decisiones',
    objetivo: 'Visualizar las áreas donde la fe puede volverse una acción concreta.',
    pasos: [
      'Dibuja un mapa con cuatro áreas: casa, amistades, estudios/trabajo y comunidad.',
      'Escribe en cada área una decisión pequeña que exprese confianza en Dios.',
      'Comparte una de ellas con el grupo.',
      'Identifica un temor que podría frenar esa decisión.',
      'Elige un compañero para preguntarte por el avance durante la semana.',
    ],
  },
  aplicaciones: ['Cumple una responsabilidad que has estado evitando.', 'Escucha a alguien sin juzgar antes de responder.', 'Pide perdón en lugar de defenderte.', 'Participa en un servicio concreto de tu comunidad.', 'Reserva cinco minutos diarios para leer la Palabra y orar.'],
  desafio_semanal: 'Escribe una decisión de obediencia para cada una de las cuatro áreas de tu mapa y compártela con una persona de confianza.',
  motivos_oracion: ['Por claridad para reconocer el paso que Dios pide.', 'Por valentía para no esconderse detrás de las apariencias.', 'Por amistades que ayuden a perseverar.', 'Por un corazón agradecido por la gracia.'],
  guia_lider: ['Escucha sin minimizar lo que los jóvenes comparten.', 'No uses la dinámica para exponer a nadie.', 'Deja tiempo para el silencio y la reflexión personal.', 'Invita a la acción sin manipular emocionalmente.', 'Cuida la confidencialidad de lo que se comparte.', 'Cierra con una oración breve y concreta.'],
};

const NINOS = {
  objetivo_aprendizaje: 'Que los niños comprendan que la fe se demuestra con acciones de amor y obediencia, y que elijan una acción concreta para esta semana.',
  relato: [
    { parte: 'Inicio', titulo: 'Una fe que se ve', texto: 'Había un niño que decía que quería mucho a su familia, pero nunca ayudaba en casa. Un día su mamá le preguntó: «Si dices que amas, ¿cómo lo demuestras?». El niño pensó y decidió poner la mesa sin que se lo pidieran.' },
    { parte: 'Desarrollo', titulo: 'Santiago nos enseña', texto: 'Santiago escribió a los amigos de Jesús: la fe, si no tiene obras, es muerta. Eso significa que la fe verdadera se nota en lo que hacemos. No se trata de comprar el amor de Dios, sino de mostrar con nuestros actos que confiamos en Él.' },
    { parte: 'Desarrollo', titulo: 'Dos ejemplos de la Biblia', texto: 'Abraham confió en Dios y obedeció. Rahab confió y ayudó a los espías. Sus acciones mostraron que su fe era real. Nosotros también podemos mostrar nuestra fe cuando obedecemos a Dios y amamos a los demás.' },
    { parte: 'Cierre', titulo: 'Un paso pequeño', texto: 'Jesús nos ama y nos ayuda. Podemos responder con un paso pequeño: compartir, ayudar, pedir perdón u orar por alguien. La fe se nota en las cosas pequeñas que hacemos con amor.' },
  ],
  versiculo_clave: { cita: 'Santiago 2:17', texto: 'Así también la fe, si no tiene obras, es muerta en sí misma.' },
  explicacion_versiculo: 'La fe es confiar en Dios. Las obras son las acciones buenas que nacen de esa confianza. No hacemos cosas buenas para que Dios nos quiera más; las hacemos porque ya nos ama.',
  preguntas_comprension: ['¿Qué dijo Santiago que es la fe sin obras?', '¿Qué hizo Abraham para mostrar su confianza en Dios?', '¿Cómo mostró Rahab su fe?', '¿Qué acciones pequeñas pueden mostrar nuestra fe?', '¿Por qué hacemos cosas buenas?'],
  actividad: {
    titulo: 'La caja de los pasos de fe',
    objetivo: 'Ayudar a los niños a identificar una acción concreta de amor y obediencia.',
    materiales: ['Una caja pequeña', 'Tarjetas de papel', 'Colores o crayones', 'Cinta adhesiva'],
    pasos: [
      'Entrega a cada niño una tarjeta y pide que dibuje o escriba una acción de amor.',
      'Conversen sobre cómo esa acción puede mostrar confianza en Dios.',
      'Coloquen las tarjetas en la caja y oren juntos por cada acción.',
      'Invita a cada niño a llevarse una tarjeta para practicarla en casa.',
    ],
  },
  juego: {
    titulo: 'Fe y acción, dos pasos',
    materiales: ['Cinta para marcar el suelo', 'Tarjetas con acciones'],
    pasos: [
      'Marca dos líneas en el suelo: una para «fe» y otra para «acción».',
      'Lee una situación y pide a los niños que den un paso hacia la línea que corresponda.',
      'Conversen: ¿qué acción mostraría confianza en Dios en esa situación?',
      'Repite con varias situaciones y terminen recordando que la fe se nota en lo que hacemos.',
    ],
  },
  aplicacion: 'Esta semana puedo mostrar mi fe ayudando en casa, compartiendo con un amigo o pidiendo perdón cuando me equivoque. No lo hago para que Dios me ame más, sino porque ya me ama.',
  actividad_familia: 'En familia, escriban juntos una acción de servicio para esta semana. Colóquenla en un lugar visible y revisen al final del día cómo la vivieron.',
  oracion_cierre: 'Jesús, gracias por amarme. Ayúdame a mostrar mi fe con acciones de amor esta semana. Amén.',
  recomendaciones_maestro: ['Prepara los materiales antes de la clase.', 'Usa palabras sencillas y verifica la comprensión.', 'No uses el miedo ni la vergüenza para motivar.', 'Permite que los niños participen sin presión.', 'Cuida la seguridad durante el juego.', 'Adapta el tiempo y las actividades al rango de edad.'],
  duracion_aproximada: '45 minutos',
};

const DEVOCIONALES = {
  introduccion: 'Este plan de siete días te invita a recorrer la enseñanza de Santiago sobre una fe que se vuelve visible. Cada jornada te ayudará a escuchar, obedecer, perseverar y descansar en la gracia de Dios.',
  proposito: 'Ofrecer un espacio diario de lectura, reflexión y oración para que la fe se traduzca en acciones concretas durante la semana.',
  dias: [
    {
      dia: 1, titulo: 'Una fe que escucha', tema: 'La fe comienza al recibir la Palabra',
      lectura_principal: { cita: 'Romanos 10:17', texto: 'Así que la fe es por el oír, y el oír, por la palabra de Dios.' },
      lecturas_complementarias: [{ cita: 'Santiago 1:19', texto: 'Por esto, mis amados hermanos, todo hombre sea pronto para oír.' }],
      contexto: 'Pablo recuerda que la fe no nace de nuestras ideas aisladas, sino de la Palabra que Dios nos dirige.',
      reflexion: 'Escuchar es un acto de humildad. Cuando abrimos la Biblia, no buscamos solo información: buscamos la voz de Dios para nuestra vida. La fe se fortalece cuando le damos espacio a su Palabra.',
      ensenanza_central: 'No puedes obedecer una voz que no has escuchado. La escucha atenta es el primer paso de la fe.',
      pregunta_introspeccion: '¿Estoy dando a la Palabra de Dios un lugar real en mi día?',
      aplicacion: 'Reserva hoy diez minutos sin distracciones para leer el pasaje y anotar lo que Dios te muestra.',
      accion: 'Escribe una frase de la lectura que quieras recordar durante el día.',
      oracion: 'Señor, abre mis oídos y mi corazón para escuchar tu Palabra. Amén.',
    },
    {
      dia: 2, titulo: 'Una fe que responde', tema: 'La obediencia como respuesta a la gracia',
      lectura_principal: { cita: 'Santiago 1:22', texto: 'Pero sed hacedores de la palabra, y no tan solamente oidores, engañándoos a vosotros mismos.' },
      lecturas_complementarias: [{ cita: 'Juan 14:15', texto: 'Si me amáis, guardad mis mandamientos.' }],
      contexto: 'Santiago confronta una religiosidad que se queda en el discurso y no transforma la vida.',
      reflexion: 'La obediencia no es un pago por el amor de Dios; es una respuesta agradecida. Cuando entendemos que somos aceptados por gracia, obedecer deja de ser una carga y se convierte en una forma de amor.',
      ensenanza_central: 'La fe verdadera responde con acciones concretas, no solo con buenas intenciones.',
      pregunta_introspeccion: '¿Qué verdad ya escuché y todavía no he puesto en práctica?',
      aplicacion: 'Identifica una acción pequeña y concreta que puedas hacer hoy para obedecer lo que Dios te ha mostrado.',
      accion: 'Cumple esa acción antes de terminar el día y anota cómo te sentiste.',
      oracion: 'Dios, gracias por tu gracia. Ayúdame a responder con obediencia y amor. Amén.',
    },
    {
      dia: 3, titulo: 'Una fe que se ve en casa', tema: 'El testimonio empieza en lo cercano',
      lectura_principal: { cita: '1 Timoteo 5:8', texto: 'Porque si alguno no provee para los suyos, y mayormente para los de su casa, ha negado la fe.' },
      lecturas_complementarias: [{ cita: 'Colosenses 3:23', texto: 'Y todo lo que hagáis, hacedlo de corazón, como para el Señor.' }],
      contexto: 'La fe bíblica no se separa de las responsabilidades cotidianas; el amor comienza en el hogar.',
      reflexion: 'A veces queremos hacer grandes cosas para Dios mientras descuidamos a quienes tenemos cerca. La fidelidad en lo pequeño es una forma poderosa de testimonio. Una palabra amable, una tarea compartida o una disculpa sincera pueden mostrar el evangelio.',
      ensenanza_central: 'La fe se vuelve visible cuando amamos con hechos a quienes están más cerca.',
      pregunta_introspeccion: '¿Cómo estoy tratando a las personas de mi casa?',
      aplicacion: 'Haz hoy una tarea o un gesto de servicio por alguien de tu familia sin esperar nada a cambio.',
      accion: 'Pregunta a esa persona cómo puedes ayudarle esta semana.',
      oracion: 'Señor, enséñame a amar con hechos a mi familia y a servir con alegría. Amén.',
    },
    {
      dia: 4, titulo: 'Una fe que persevera', tema: 'Confiar cuando la respuesta tarda',
      lectura_principal: { cita: 'Santiago 1:3', texto: 'Sabiendo que la prueba de vuestra fe produce paciencia.' },
      lecturas_complementarias: [{ cita: 'Hebreos 10:36', texto: 'Porque os es necesaria la paciencia, para que habiendo hecho la voluntad de Dios, obtengáis la promesa.' }],
      contexto: 'Santiago escribe a creyentes que enfrentaban pruebas y les recuerda que la fe puede madurar en medio de ellas.',
      reflexion: 'Perseverar no es fingir que no duele. Es llevar el dolor a Dios y seguir confiando en su bondad. La paciencia no es pasividad: es una esperanza activa que sigue sirviendo mientras espera.',
      ensenanza_central: 'La fe madura cuando sostiene la confianza en Dios aunque las circunstancias no cambien de inmediato.',
      pregunta_introspeccion: '¿Qué situación estoy tentado a abandonar por impaciencia?',
      aplicacion: 'Elige una práctica fiel que puedas sostener hoy, aunque no veas resultados inmediatos.',
      accion: 'Escribe una oración de entrega por esa situación y vuelve a leerla por la noche.',
      oracion: 'Dios, sostén mi fe en la espera. Dame paciencia y esperanza en ti. Amén.',
    },
    {
      dia: 5, titulo: 'Una fe que sirve', tema: 'El amor que se vuelve testimonio',
      lectura_principal: { cita: 'Gálatas 5:13', texto: 'Porque vosotros, hermanos, a libertad fuisteis llamados; solamente que no uséis la libertad como ocasión para la carne, sino servíos por amor los unos a los otros.' },
      lecturas_complementarias: [{ cita: 'Mateo 5:16', texto: 'Así alumbre vuestra luz delante de los hombres, para que vean vuestras buenas obras.' }],
      contexto: 'La libertad cristiana no es una excusa para vivir centrados en nosotros mismos, sino una oportunidad para servir.',
      reflexion: 'El servicio no busca aplausos. Es una expresión de la gracia que hemos recibido. Cuando servimos con humildad, nuestra vida se convierte en una señal que apunta a Dios.',
      ensenanza_central: 'La fe se hace testimonio cuando el amor se traduce en servicio concreto.',
      pregunta_introspeccion: '¿A quién puedo servir esta semana sin buscar reconocimiento?',
      aplicacion: 'Busca una necesidad concreta a tu alrededor y responde con una acción sencilla.',
      accion: 'Ofrece tu ayuda a alguien y guarda silencio sobre el bien que hagas.',
      oracion: 'Jesús, enséñame a servir como tú, con humildad y alegría. Amén.',
    },
    {
      dia: 6, titulo: 'Una fe que descansa', tema: 'La gracia que sostiene',
      lectura_principal: { cita: 'Efesios 2:8', texto: 'Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios.' },
      lecturas_complementarias: [{ cita: 'Romanos 8:1', texto: 'Ahora, pues, ninguna condenación hay para los que están en Cristo Jesús.' }],
      contexto: 'Pablo recuerda que la salvación es un regalo, no un logro humano. La gracia es el fundamento de toda obediencia.',
      reflexion: 'La gracia nos libera de la necesidad de demostrar nuestro valor. Podemos descansar sabiendo que somos amados antes de producir. Desde ese descanso, la obediencia nace como fruto y no como ansiedad.',
      ensenanza_central: 'No obedecemos para ser amados; obedecemos porque ya somos amados en Cristo.',
      pregunta_introspeccion: '¿Estoy intentando ganar el amor de Dios con mis acciones?',
      aplicacion: 'Detente hoy para agradecer la gracia de Dios antes de pedirle algo.',
      accion: 'Escribe tres cosas por las que puedes agradecer el regalo de la salvación.',
      oracion: 'Padre, gracias por tu gracia. Ayúdame a descansar en tu amor y a vivir desde allí. Amén.',
    },
    {
      dia: 7, titulo: 'Una fe que sigue', tema: 'Un compromiso para el camino',
      lectura_principal: { cita: 'Santiago 2:17', texto: 'Así también la fe, si no tiene obras, es muerta en sí misma.' },
      lecturas_complementarias: [{ cita: 'Filipenses 1:6', texto: 'Estando persuadido de esto, que el que comenzó en vosotros la buena obra, la perfeccionará hasta el día de Jesucristo.' }],
      contexto: 'Santiago cierra su argumento llamando a una fe viva, coherente y sostenida por la gracia de Dios.',
      reflexion: 'La fe no termina en una emoción del domingo. Se extiende a las decisiones del lunes. Después de esta semana, el desafío es seguir caminando con pasos pequeños y constantes, sostenidos por la comunidad y la gracia.',
      ensenanza_central: 'La fe viva se renueva cada día y se expresa en un compromiso constante, no en un solo momento de emoción.',
      pregunta_introspeccion: '¿Qué paso de esta semana quiero sostener durante el próximo mes?',
      aplicacion: 'Revisa tus compromisos de los últimos días y elige uno para continuar con acompañamiento.',
      accion: 'Comparte tu compromiso con alguien y acuerden una fecha para revisarlo.',
      oracion: 'Señor, gracias por esta semana. Sostén mi fe y ayúdame a seguir caminando contigo. Amén.',
    },
  ],
};

const BOSQUEJO: EstudioBosquejo = {
  titulo: 'La fe que transforma en acción',
  tema_central: 'Naturaleza viva y activa de la fe cristiana verdadera',
  proposito_general: 'Exhortar y equipar al liderazgo y congregación para articular y modelar una fe probada en obediencia, servicio e integridad.',
  objetivos: {
    cognitivo: 'Comprender que la justificación por la gracia de Dios produce indefectiblemente el fruto visible de las buenas obras.',
    afectivo: 'Desarrollar una profunda convicción de dependencia espiritual y celo santo para rechazar una religiosidad pasiva o nominal.',
    volitivo: 'Asumir compromisos concretos de servicio, reconciliación y testimonio pastoral en la vida familiar y eclesial.',
  },
  tesis: 'La fe salvadora otorgada por la gracia de Dios se autentica necesariamente a través de una obediencia visible y perseverante en la vida cotidiana.',
  fundamento_doctrinal: 'La soteriología bíblica enseña que somos salvos por gracia mediante la fe, para andar en las buenas obras que Dios preparó de antemano (Efesios 2:8-10; Santiago 2:14-26).',
  texto_base: {
    cita: 'Santiago 2:17',
    texto: 'Así también la fe, si no tiene obras, es muerta en sí misma.',
  },
  introduccion: {
    gancho: 'Es fácil profesar verdades elevadas con los labios mientras nuestras acciones cotidianas desmienten lo que afirmamos creer.',
    contexto: 'El apóstol Santiago confronta a una comunidad creyente dispersa propensa a confundir el mero asentimiento intelectual con la fe viva que salva.',
    transicion: 'Al examinar este pasaje, descubrimos las tres dimensiones indispensables de una fe viva que honra a Cristo.',
  },
  puntos_principales: [
    {
      romano: 'I',
      titulo: 'El origen de la fe viva: La recepción atenta de la Palabra',
      cita: 'Romanos 10:17',
      texto_cita: 'Así que la fe es por el oír, y el oír, por la palabra de Dios.',
      exposicion: 'La fe bíblica no surge de la inventiva humana ni de meros impulsos emocionales efímeros; es engendrada por el Espíritu Santo mediante la exposición y obediencia a las Sagradas Escrituras.',
      subpuntos: [
        {
          letra: 'A',
          titulo: 'La necesidad de escuchar con docilidad',
          desarrollo: 'Escuchar la voz de Dios exige renunciar a la autosuficiencia y someter nuestros criterios preconcebidos al veredicto divino.',
          detalles: ['La reverencia ante las Escrituras precede a toda obediencia eficaz.', 'El creyente que no se expone a la Palabra languidece en una fe estéril.'],
          pasajes_apoyo: ['Santiago 1:19-21'],
        },
        {
          letra: 'B',
          titulo: 'La confrontación regeneradora de la verdad',
          desarrollo: 'La Palabra no fue dada solo para satisfacer nuestra curiosidad intelectual, sino para redargüir, corregir e instruir en justicia.',
          detalles: ['La verdad bíblica actúa como un espejo que revela nuestra condición real.', 'La gracia capacita al corazón contrito para responder positivamente.'],
          pasajes_apoyo: ['2 Timoteo 3:16-17'],
        },
      ],
      ilustracion: 'Así como una semilla no puede germinar en tierra árida sin agua, la fe no florece sin el sustento continuo de la Palabra de Dios.',
      transicion: 'Habiendo comprendido cómo nace la fe viva en el corazón, debemos examinar su manifestación obligatoria en la conducta.',
    },
    {
      romano: 'II',
      titulo: 'La evidencia de la fe viva: La obediencia práctica en lo cotidiano',
      cita: 'Santiago 1:22',
      texto_cita: 'Pero sed hacedores de la palabra, y no tan solamente oidores, engañándoos a vosotros mismos.',
      exposicion: 'La autenticidad de nuestra comunión con Dios se valida no por la vehemencia de nuestros discursos, sino por la rectitud e integridad de nuestras decisiones diarias.',
      subpuntos: [
        {
          letra: 'A',
          titulo: 'Fidelidad en el núcleo familiar',
          desarrollo: 'El primer altar donde se prueba la fe es el hogar: en la paciencia conyugal, la crianza en amor y el cuidado mutuo.',
          detalles: ['El liderazgo eclesial pierde credibilidad si fracasa deliberadamente en el testimonio doméstico.', 'El perdón y la generosidad deben practicarse primero entre los íntimos.'],
          pasajes_apoyo: ['1 Timoteo 5:8'],
        },
        {
          letra: 'B',
          titulo: 'Integridad en la esfera pública y laboral',
          desarrollo: 'El testimonio de Cristo se preserva cuando el creyente honra sus compromisos, trabaja con excelencia y rechaza la deshonestidad.',
          detalles: ['Las buenas obras en el entorno social confirman la veracidad del mensaje del evangelio.', 'El servicio silencioso glorifica al Padre celestial.'],
          pasajes_apoyo: ['Mateo 5:16', 'Colosenses 3:23'],
        },
      ],
      ilustracion: 'El expositor recordó que un árbol no se califica por la frondosidad de su follaje, sino por la calidad y permanencia de sus frutos comestibles.',
      transicion: 'No obstante, esta obediencia no está exenta de dificultades; por ello, requiere ser templada en el fuego de la perseverancia.',
    },
    {
      romano: 'III',
      titulo: 'La madurez de la fe viva: La perseverancia inquebrantable en la prueba',
      cita: 'Santiago 1:3-4',
      texto_cita: 'Sabiendo que la prueba de vuestra fe produce paciencia. Mas tenga la paciencia su obra completa, para que seáis perfectos y cabales, sin que os falte cosa alguna.',
      exposicion: 'La fe madura no es aquella que jamás experimenta aflicción, sino la que permanece anclada en el carácter inmutable de Dios cuando las circunstancias son adversas.',
      subpuntos: [
        {
          letra: 'A',
          titulo: 'La prueba como crisol formativo',
          desarrollo: 'Dios permite vicisitudes no para destruirnos, sino para purificar los motivos de nuestra confianza y despojarnos de la vanagloria.',
          detalles: ['El sufrimiento santificado produce paciencia y carácter probado.', 'La queja esteriliza el aprendizaje espiritual; la adoración en la prueba fortalece el alma.'],
          pasajes_apoyo: ['1 Pedro 1:6-7'],
        },
        {
          letra: 'B',
          titulo: 'La esperanza activa sostenida en la promesa',
          desarrollo: 'Esperar en Dios no significa resignación pasiva, sino avanzar firmes en el cumplimiento de la mayordomía encomendada.',
          detalles: ['Abraham creyó en esperanza contra esperanza cuando todo parecía humanamente imposible.', 'La fidelidad en la prueba es la mayor ofrenda de adoración ministerial.'],
          pasajes_apoyo: ['Romanos 4:18-21', 'Hebreos 11:1'],
        },
      ],
      ilustracion: 'El ancla no se prueba en aguas serenas de la bahía, sino en medio del embate de la tormenta marina.',
      transicion: 'Frente a esta gloriosa verdad, llegamos al punto cumbre de aplicación para el liderazgo ministerial.',
    },
  ],
  conclusion: {
    recapitulacion: 'La fe genuina ni se conforma con el asentimiento teórico ni claudica en la tribulación: escucha con reverencia, obedece en santidad y persevera hasta el fin sustentada por la gracia inmerecida de Dios.',
    climax: 'No compareceremos ante el tribunal de Cristo por la cantidad de sermones escuchados, sino por la fidelidad práctica con la que encarnamos el evangelio eterno de nuestro Señor.',
  },
  aplicacion_liderazgo: [
    'Modelar una coherencia intachable entre la predicación pública desde el púlpito y la conducta privada en el seno familiar.',
    'Establecer mecanismos pastorales de rendición de cuentas y acompañamiento fraterno para pastores, líderes y obreros de MAIM.',
    'Fomentar una cultura eclesial donde las enseñanzas culminen siempre en metas de servicio, misericordia y alcance evangelístico medible.',
    'Pastorear con paciencia y discernimiento a los creyentes que atraviesan temporadas de crisis y desánimo espiritual.',
  ],
  desafio_final: {
    llamado: 'Hoy convocamos a todo líder y siervo de MAIM Casa de Oración a consagrar sus talentos, tiempo y vida a una obediencia radical, rechazando toda apariencia de piedad carente de poder transformador.',
    oracion_ministracion: 'Señor soberano y Padre de gracia, quebranta en nosotros toda autosuficiencia y formalismo religioso vacío. Aviva en nuestros corazones una fe ardiente que se traduzca en amor sacrificado, obras de justicia y perseverancia santa. Que cada líder de MAIM sea un modelo vivo de tu evangelio, para la sola gloria de tu santo nombre. Amén.',
  },
};

const CASA2: EstudioCasa2 = {
  titulo_tema: 'La fe que transforma el matrimonio',
  idea_central: 'La fe verdadera en el hogar no se queda en discursos afectivos: se traduce en servicio mutuo, paciencia activa y una comunicación llena de gracia sustentada por Cristo.',
  fundamento_biblico: {
    texto_base: {
      cita: 'Santiago 2:17',
      texto: 'Así también la fe, si no tiene obras, es muerta en sí misma.',
    },
    contexto_matrimonial: 'Santiago escribe a creyentes dispersos para recordarles que la confesión de fe debe validarse en la convivencia. En el pacto conyugal, decir que amamos a Dios mientras tratamos con aspereza o desprecio al cónyuge contradice la fe. La gracia divina nos capacita para amar con hechos concretos en la intimidad del hogar.',
    textos_apoyo: [
      {
        cita: 'Efesios 4:32',
        texto: 'Antes sed benignos unos con otros, misericordiosos, perdonándoos unos a otros, como Dios también os perdonó a vosotros en Cristo.',
      },
      {
        cita: 'Eclesiastés 4:12',
        texto: 'Y si alguno prevaleciere contra uno, dos le resistirán; y cordón de tres dobleces no se rompe pronto.',
      },
    ],
  },
  aplicacion_matrimonial: [
    'Traducir la fe en actos diarios de servicio no remunerado ni exigido en el hogar.',
    'Sustituir las recriminaciones pasadas por acuerdos presentes de mejora mutua.',
    'Edificar un altar devocional compartido antes de dar por concluida la jornada.',
    'Manejar las finanzas familiares con total transparencia y sentido de mayordomía compartida.',
  ],
  comunicacion: {
    principios: [
      'Escucha activa sin preparar la defensa mientras el otro habla (Santiago 1:19).',
      'Desescalar el conflicto evitando la crítica destructiva y el desprecio conyugal.',
      'Validar el sentir del cónyuge antes de intentar corregir o resolver la logística.',
      'Hablar con mansedumbre, cuidando el tono y el momento oportuno para dialogar.',
    ],
    ejercicio_dialogo: {
      titulo: 'Diez minutos de escucha sin defensa',
      objetivo: 'Brindar un espacio de vulnerabilidad donde cada cónyuge comparta una necesidad sin ser interrumpido ni juzgado.',
      pasos: [
        'Apaguen dispositivos electrónicos y busquen un lugar tranquilo a solas.',
        'El primer cónyuge comparte durante cuatro minutos: «En qué momento de esta semana sentí que nuestra fe se tradujo en amor y en qué área sentí desconexión».',
        'El segundo cónyuge escucha en silencio, sin justificarse, y al terminar resume: «Lo que te escuché decir y entender es...».',
        'Inviertan los roles por otros cuatro minutos con la misma actitud de gracia.',
        'Cierren con dos minutos tomados de la mano, agradeciendo a Dios por el corazón del otro.',
      ],
    },
  },
  reflexion_individual: [
    '¿En qué momentos actúo como si mi cónyuge tuviera que ganarse mi afecto, en lugar de amarlo por gracia?',
    '¿Qué queja recurrente tengo hacia mi cónyuge que en realidad refleja una falta de paciencia u orgullo en mi propio corazón?',
    '¿Cómo se hace visible mi confianza en Dios cuando enfrentamos desacuerdos financieros o familiares?',
    '¿Estoy buscando tener la razón en las discusiones o estoy buscando edificar la unidad conyugal?',
  ],
  reflexion_pareja: [
    '¿Qué hábito cotidiano en nuestra casa evidencia que Cristo es el centro de nuestro matrimonio?',
    '¿En qué área de nuestra relación sentimos que nos cuesta más ponernos de acuerdo y cómo podemos abordarla con humildad?',
    '¿Cómo podemos responder juntos en fe cuando las presiones externas o el cansancio amenazan nuestra paciencia?',
    '¿Qué palabra o gesto de aprecio necesitamos escuchar con mayor frecuencia de parte del otro?',
  ],
  situaciones_practicas: [
    'Uno de los esposos llega agotado y distante del trabajo; el otro esperaba ayuda inmediata con las tareas del hogar. En lugar de reaccionar con reproches o indiferencia, acuerdan un margen de 15 minutos de descanso previo para luego coordinarse en equipo con una actitud colaborativa.',
    'Surge un gasto imprevisto que genera tensión en el presupuesto del mes. En vez de culparse mutuamente por gastos anteriores, se sientan con el presupuesto en mano, oran juntos por provisión y priorizan los compromisos esenciales como un solo equipo.',
  ],
  actividad_juntos: {
    titulo: 'Pacto de tres dobleces para la semana',
    objetivo: 'Identificar una necesidad prioritaria del hogar y definir un paso de servicio concreto que cada uno realizará en favor del otro.',
    materiales: ['Una hoja de papel y un lápiz', 'Biblia'],
    pasos: [
      'Lean juntos Santiago 2:17 y Eclesiastés 4:12.',
      'Cada cónyuge escribe en la hoja un servicio sencillo que bendeciría su semana.',
      'Intercambien las hojas, lean lo que el otro escribió y asuman el compromiso con una sonrisa.',
      'Coloquen la hoja en un lugar visible del dormitorio o la cocina.',
      'Revisen juntos el cumplimiento el fin de semana con una cena o café especial.',
    ],
  },
  compromisos: [
    'No nos iremos a dormir con rencor ni palabras hirientes sin pedir perdón y orar juntos (Efesios 4:26).',
    'Separaremos un tiempo semanal exclusivo de pareja para nutrir el romance y la complicidad.',
    'Nos comunicaremos con respeto, eliminando los tonos sarcásticos y las indirectas.',
    'Sostendremos una oración de cobertura diaria por nuestro hogar y nuestros hijos.',
  ],
  oracion_pareja: 'Padre celestial, te damos gracias por el don del matrimonio y por llamarnos a reflejar tu amor y fidelidad. Perdona nuestras faltas de paciencia, nuestro egoísmo y cuando permitimos que la rutina opaque tu gracia en nuestra convivencia. Te pedimos un corazón tierno para perdonar, oídos atentos para escuchar y manos dispuestas a servirnos el uno al otro. Sé Tú el cordón de tres dobleces que sostenga nuestro hogar. En el nombre de Jesús, amén.',
  conclusion: 'El matrimonio que persevera en una fe viva experimenta el poder de la gracia en lo cotidiano. Cuando ambos cónyuges deciden amar sin condiciones y servir con alegría, el hogar se convierte en un refugio de paz y en un testimonio vivo del evangelio.',
  salvaguarda_pastoral: 'Este análisis conyugal ha sido elaborado con propósitos pastorales y de edificación espiritual. No sustituye la atención profesional psicológica, médica o consejería especializada en situaciones de violencia o crisis severa.',
};

const AYUNO: PlanDevocional = {
  introduccion: 'Convocatoria al Ayuno del Novio: tres jornadas de humillación, búsqueda ferviente, quebrantamiento y adoración para alinear el corazón con la presencia de Dios.',
  proposito: 'Buscar el rostro de Dios con corazón limpio, experimentar rompimiento espiritual y renovar nuestra consagración personal y congregacional ante el Señor.',
  dias: [
    {
      dia: 1,
      titulo: 'Humillación y examen del corazón',
      tema: 'Quebrantamiento sincero y despojo del pecado',
      lectura_principal: {
        cita: 'Joel 2:12-13',
        texto: 'Por eso pues, ahora, dice Jehová, convertíos a mí con todo vuestro corazón, con ayuno y lloro y lamento. Rasgad vuestro corazón, y no vuestros vestidos.',
      },
      lecturas_complementarias: [
        { cita: 'Salmos 51:17', texto: 'Los sacrificios de Dios son el espíritu quebrantado; al corazón contrito y humillado no despreciarás tú, oh Dios.' },
        { cita: 'Santiago 4:8', texto: 'Acercaos a Dios, y él se acercará a vosotros. Pecadores, limpiad las manos; y vosotros los de doble ánimo, purificad vuestros corazones.' },
      ],
      contexto: 'El profeta Joel convoca a todo el pueblo a un ayuno solemne donde la prioridad no es la apariencia externa del rito, sino el quebranto interior y la conversión sincera hacia Dios.',
      reflexion: 'El ayuno bíblico comienza desnudando el alma ante la santidad de Dios. No ayunamos para torcer el brazo del Señor ni para negociar con Él, sino para despojarnos del orgullo, de la tibieza y de las distracciones terrenales. Hoy reconozco que necesito una limpieza profunda en mis motivaciones y pensamientos.',
      ensenanza_central: 'El verdadero ayuno inicia con un corazón contrito que reconoce su bancarrota espiritual sin la gracia de Cristo.',
      pregunta_introspeccion: '¿Qué peso, pecado o actitud autosuficiente necesito confesar y entregar hoy al Señor?',
      aplicacion: 'Dedica el primer día del ayuno a examinar tu conciencia en quietud, pidiendo al Espíritu Santo que revele cualquier área oculta que estorbe tu comunión.',
      accion: 'Escribe en un papel las ataduras o hábitos que necesitas rendir y preséntalas en oración antes de comenzar el clamor.',
      oracion: 'Señor Jesús, me presento hoy delante de tu presencia con corazón quebrantado. Limpia mi vida con tu sangre preciosa, arranca de mí toda dureza y purifica mis motivos. Que este ayuno sea grato delante de ti. Amén.',
    },
    {
      dia: 2,
      titulo: 'Hambre por Su Presencia',
      tema: 'Intimidad y clamor con el Novio',
      lectura_principal: {
        cita: 'Mateo 9:15',
        texto: 'Jesús les dijo: ¿Acaso pueden los que están de bodas tener luto entre tanto que el novio está con ellos? Pero vendrán días cuando el novio les será quitado, y entonces ayunarán.',
      },
      lecturas_complementarias: [
        { cita: 'Salmos 63:1', texto: 'Dios, Dios mío eres tú; de madrugada te buscaré; mi alma tiene sed de ti, mi carne te anhela, en tierra seca y árida donde no hay aguas.' },
        { cita: 'Juan 15:5', texto: 'Yo soy la vid, vosotros los pámpanos; el que permanece en mí, y yo en él, éste lleva mucho fruto; porque separados de mí nada podéis hacer.' },
      ],
      contexto: 'Jesús establece el sentido escatológico y relacional del ayuno neotestamentario: el anhelo apasionado de la Esposa (la Iglesia) por la comunión íntima con su Señor y Salvador.',
      reflexion: 'En este segundo día de ayuno, el clamor se transforma de arrepentimiento en un hambre ardiente por Dios mismo. Mi alma no se sacia con el pan terrenal; mi verdadera necesidad es la gloria, la voz y el Espíritu del Novio celestial. Decido buscar Su rostro por encima de Sus dádivas.',
      ensenanza_central: 'El ayuno cristiano es la expresión visible de un alma que prefiere a Cristo por sobre cualquier deleite terrenal.',
      pregunta_introspeccion: '¿Amo la presencia de Dios más que las bendiciones materiales o ministeriales que Él me concede?',
      aplicacion: 'Reemplaza el tiempo habitual de tus alimentos por momentos intensos de adoración, meditación en los Evangelios e intercesión.',
      accion: 'Separa una vigilia breve de adoración en intimidad, adorando al Señor sin hacer peticiones personales durante los primeros 20 minutos.',
      oracion: 'Amado Señor Jesús, mi alma tiene sed de ti como la tierra seca. Aviva en mí un amor apasionado y reverente por tu Persona. Lléname de tu Santo Espíritu y satisface mi corazón con tu presencia. Amén.',
    },
    {
      dia: 3,
      titulo: 'Rompimiento y consagración total',
      tema: 'Unción, autoridad y envío ministerial',
      lectura_principal: {
        cita: 'Isaías 58:6',
        texto: '¿No es más bien el ayuno que yo escogí, desatar las ligaduras de impiedad, soltar las cargas de opresión, y dejar ir libres a los quebrantados, y que rompáis todo yugo?',
      },
      lecturas_complementarias: [
        { cita: 'Hechos 13:2-3', texto: 'Ministrando éstos al Señor, y ayunando, dijo el Espíritu Santo: Apartadme a Bernabé y a Saulo para la obra a que los he llamado.' },
        { cita: 'Romanos 12:1', texto: 'Así que, hermanos, os ruego por las misericordias de Dios, que presentéis vuestros cuerpos en sacrificio vivo, santo, agradable a Dios.' },
      ],
      contexto: 'Isaías expone que el verdadero ayuno escogido por Dios desata cadenas de opresión y se traduce en justicia, misericordia y rompimiento espiritual para bendición del prójimo.',
      reflexion: 'El ayuno culmina con una consagración renovada y un poder espiritual renovado para servir. Dios no nos quebranta para dejarnos caídos, sino para levantarnos llenos de Su Espíritu, listos para desatar ligaduras de impiedad y testificar con autoridad del reino de Dios.',
      ensenanza_central: 'El ayuno desata la victoria de Dios y capacita al creyente para caminar en santidad, obediencia y testimonio con poder.',
      pregunta_introspeccion: '¿Qué compromiso radical de servicio y consagración sellaré hoy delante del Señor?',
      aplicacion: 'Sella este tiempo de ayuno asumiendo una responsabilidad concreta en tu congregación y llevando la misericordia de Dios a alguien necesitado.',
      accion: 'Entrega tu cuerpo y dones en oración de pacto y realiza una acción concreta de bondad hacia alguien en necesidad esta misma semana.',
      oracion: 'Señor Dios todopoderoso, gracias por estas jornadas de ayuno. Que el fuego de tu presencia arda en mi corazón. Te entrego mi vida, mi familia y mi servicio como ofrenda viva. Camina conmigo en victoria. En el nombre de Jesús, amén.',
    },
  ],
};

const RAW_ESPECIALIZADO: Record<Exclude<ModalidadId, 'general'>, object> = {
  bosquejo: { bosquejo: BOSQUEJO },
  grupos: { grupos: GRUPOS },
  jovenes: { jovenes: JOVENES },
  ninos: { ninos: NINOS },
  devocionales: { devocionales: DEVOCIONALES },
  casa2: { casa2: CASA2 },
  ayuno: { ayuno: AYUNO },
};

export function metadatosDemo(modalidad: ModalidadId): MetadatosPredica {
  return {
    tituloProporcionado: 'La fe que transforma',
    predicador: 'Samuel Rojas',
    fecha: '2026-10-18',
    modalidad,
    rangoEdad: modalidad === 'ninos' ? '6-8' : undefined,
    fechaAnalisis: '2026-10-26T12:00:00.000Z',
  };
}

export function crearResultadoDemo(modalidad: ModalidadId = 'general'): ResultadoAnalisis {
  const metadatos = metadatosDemo(modalidad);
  const general = normalizarAnalisisGeneral({
    titulo: 'La fe que transforma',
    idea_principal: 'La fe genuina se manifiesta en una confianza activa en Dios que se traduce en obediencia cotidiana.',
    tema_principal: 'Una fe activa',
    proposito: 'Exhortar a la comunidad a vivir una fe que escuche, obedezca y persevere.',
    contexto_general: 'Mensaje dominical basado en Santiago 2:14-26, con referencias a Hebreos, Romanos y Efesios.',
    texto_biblico_principal: { cita: 'Santiago 2:17', texto: 'Así también la fe, si no tiene obras, es muerta en sí misma.' },
    otros_textos: [
      { cita: 'Hebreos 11:1', texto: 'Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.' },
      { cita: 'Romanos 10:17', texto: 'Así que la fe es por el oír, y el oír, por la palabra de Dios.' },
      { cita: 'Efesios 2:8', texto: 'Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios.' },
    ],
    contexto_biblico: 'Santiago escribe a creyentes dispersos que enfrentaban pruebas. Su carta insiste en la coherencia entre la confesión y la conducta.',
    contexto_historico: 'La comunidad vivía presión social y económica, lo que hacía urgente una fe práctica y solidaria.',
    contexto_literario: 'Literatura sapiencial del Nuevo Testamento, con exhortaciones directas y ejemplos del Antiguo Testamento.',
    relacion_textos: 'Hebreos define la confianza; Romanos explica el origen de la fe; Efesios recuerda que la gracia es el fundamento.',
    interpretacion: 'El expositor sostiene que la fe bíblica no es solo una creencia intelectual, sino una confianza que se expresa en obediencia y amor.',
    desarrollo_progresivo: PUNTOS,
    ensenanzas: [
      { sobre: 'la fe', ensenanza: 'La fe verdadera produce frutos visibles de obediencia y amor.' },
      { sobre: 'la gracia', ensenanza: 'La obediencia nace de la gracia recibida, no del miedo al castigo.' },
      { sobre: 'la perseverancia', ensenanza: 'La fe madura cuando sigue confiando en Dios durante la espera.' },
    ],
    conceptos_clave: ['fe', 'obras', 'gracia', 'obediencia', 'perseverancia', 'testimonio'],
    conceptos_teologicos: [
      { concepto: 'Fe', significado: 'Confianza activa en Dios que se expresa en obediencia concreta.' },
      { concepto: 'Gracia', significado: 'Regalo inmerecido de Dios que nos acepta y nos capacita para vivir de una manera nueva.' },
      { concepto: 'Justificación', significado: 'El acto por el cual Dios declara justo al pecador que cree en Cristo.' },
    ],
    aplicacion: ['Identifica una acción concreta de obediencia para esta semana.', 'Sirve a alguien de tu familia sin esperar reconocimiento.', 'Comparte tu fe con respeto y sencillez.', 'Sostén una práctica de oración aunque no sientas emoción inmediata.'],
    conclusion: 'La fe que transforma no se queda en palabras: se vuelve obediencia cotidiana sostenida por la gracia de Dios.',
    oracion: 'Señor, fortalece nuestra fe para vivir lo que hemos escuchado. Que nuestra vida haga visible tu amor. Amén.',
  });
  const metadatosFinales = { ...metadatos };
  if (metadatosFinales.tituloProporcionado) general.titulo = metadatosFinales.tituloProporcionado;
  const especializado = modalidad === 'general'
    ? {}
    : normalizarEspecializado(modalidad, RAW_ESPECIALIZADO[modalidad]);
  return {
    ...general,
    metadatos: metadatosFinales,
    especializado,
  };
}
