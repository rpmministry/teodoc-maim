export type Versiculo = {
  cita: string
  texto: string
}

export type PuntoDesarrollo = {
  subtitulo: string
  explicacion: string
  versiculos: Versiculo[]
}

export type Aplicacion = {
  id: string
  texto: string
}

export type Analisis = {
  titulo: string
  subtitulo: string
  ideaPrincipal: string
  desarrollo: PuntoDesarrollo[]
  aplicaciones: Aplicacion[]
  oracion: string
}

export const sampleAnalysis: Analisis = {
  titulo: 'La Gracia que Sostiene en el Desierto',
  subtitulo:
    'Un estudio sobre la fidelidad de Dios en las temporadas de espera y prueba',
  ideaPrincipal:
    'Dios no nos abandona en el desierto; usa las temporadas de escasez para formar en nosotros una dependencia más profunda de su provisión, transformando la espera en un lugar de encuentro íntimo con Él.',
  desarrollo: [
    {
      subtitulo: '1. El desierto es un lugar de propósito, no de castigo',
      explicacion:
        'El pueblo de Israel fue guiado intencionalmente al desierto. Lo que parecía un rodeo era en realidad la ruta escogida por Dios para enseñarles a confiar. Nuestras temporadas áridas rara vez son accidentes: son aulas donde se aprende la fidelidad.',
      versiculos: [
        {
          cita: 'Deuteronomio 8:2',
          texto:
            'Te acordarás de todo el camino por donde te ha traído Jehová tu Dios estos cuarenta años en el desierto, para afligirte, para probarte, para saber lo que había en tu corazón.',
        },
      ],
    },
  ],
  aplicaciones: [
    {
      id: 'app-1',
      texto:
        'Identifica una "temporada de desierto" en tu vida y escribe qué podría estar enseñándote Dios en ella.',
    },
  ],
  oracion:
    'Padre bondadoso, gracias porque incluso en el desierto tu mano nos sostiene. En el nombre de Jesús, amén.',
}
