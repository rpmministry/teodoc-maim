import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { MetadatosPredica, Versiculo } from '../tipos.ts';
import { fechaAnalisisLarga, fechaLarga, obtenerRangoEdad } from '../modalidades.ts';
import type { ReferenciaDetectada } from '../referencias.ts';

const CORAL = 'B5303B';
const TINTA = '2B1F1E';
const TEXTO = '4B3735';
const LINEA = 'E8D6C8';
const SUPERFICIE = 'FBF2E6';

export const PRODUCTO_WORD = 'TeoDoc MAIM';
export const INSTITUCION_WORD = 'MAIM Casa de Oración';

type Hijo = Paragraph | Table;

export class DocumentoWord {
  private readonly hijos: Hijo[] = [];
  private readonly metadatos: MetadatosPredica;
  private readonly etiqueta: string;
  private readonly titulo: string;

  constructor(metadatos: MetadatosPredica, titulo: string, etiqueta: string, descripcion: string) {
    this.metadatos = metadatos;
    this.titulo = titulo;
    this.etiqueta = etiqueta;
    this.portada(descripcion);
  }

  private run(texto: string, opciones: { negrita?: boolean; cursiva?: boolean; color?: string; tamano?: number } = {}) {
    return new TextRun({
      text: texto,
      bold: opciones.negrita,
      italics: opciones.cursiva,
      color: opciones.color,
      size: opciones.tamano,
      font: 'Calibri',
    });
  }

  private portada(descripcion: string) {
    this.hijos.push(new Paragraph({ spacing: { after: 80 } }));
    this.hijos.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [this.run(INSTITUCION_WORD, { negrita: true, color: CORAL, tamano: 22 })],
    }));
    this.hijos.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [this.run(PRODUCTO_WORD, { negrita: true, color: TINTA, tamano: 34 })],
    }));
    this.hijos.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: CORAL, space: 6 } },
      children: [this.run(this.etiqueta.toUpperCase(), { negrita: true, color: CORAL, tamano: 18 })],
    }));
    this.hijos.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 260, after: 160 },
      children: [this.run(this.titulo, { negrita: true, color: TINTA, tamano: 44 })],
    }));
    this.hijos.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 260 },
      children: [this.run(descripcion, { color: TEXTO, tamano: 22 })],
    }));
    if (this.metadatos.predicador) {
      this.hijos.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [this.run('Predicador o expositor: ', { negrita: true, color: TINTA, tamano: 22 }), this.run(this.metadatos.predicador, { color: TEXTO, tamano: 22 })],
      }));
    }
    if (this.metadatos.fecha) {
      this.hijos.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [this.run('Fecha de la prédica: ', { negrita: true, color: TINTA, tamano: 22 }), this.run(fechaLarga(this.metadatos.fecha), { color: TEXTO, tamano: 22 })],
      }));
    }
    if (this.metadatos.rangoEdad) {
      this.hijos.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [this.run('Rango de edad: ', { negrita: true, color: TINTA, tamano: 22 }), this.run(obtenerRangoEdad(this.metadatos.rangoEdad), { color: TEXTO, tamano: 22 })],
      }));
    }
    this.hijos.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 40 },
      children: [this.run(`Documento generado: ${fechaAnalisisLarga(this.metadatos.fechaAnalisis)}`, { color: '7A6662', tamano: 18 })],
    }));
    this.hijos.push(new Paragraph({ children: [new PageBreak()] }));
  }

  seccion(texto: string) {
    this.hijos.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: CORAL, space: 4 } },
      children: [this.run(texto, { negrita: true, color: TINTA, tamano: 28 })],
    }));
    return this;
  }

  subtitulo(texto: string) {
    this.hijos.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 180, after: 70 },
      children: [this.run(texto, { negrita: true, color: CORAL, tamano: 22 })],
    }));
    return this;
  }

  parrafo(texto: string, opciones: { cursiva?: boolean; negrita?: boolean; color?: string } = {}) {
    if (!texto) return this;
    this.hijos.push(new Paragraph({
      spacing: { after: 110, line: 300 },
      children: [this.run(texto, { cursiva: opciones.cursiva, negrita: opciones.negrita, color: opciones.color ?? TEXTO, tamano: 21 })],
    }));
    return this;
  }

  lista(elementos: string[], numerada = false) {
    elementos.filter(Boolean).forEach((elemento, indice) => {
      this.hijos.push(new Paragraph({
        spacing: { after: 70, line: 280 },
        indent: { left: 360 },
        children: [this.run(numerada ? `${indice + 1}. ${elemento}` : `• ${elemento}`, { color: TEXTO, tamano: 21 })],
      }));
    });
    return this;
  }

  cita(versiculo: Versiculo) {
    if (!versiculo.cita && !versiculo.texto) return this;
    this.hijos.push(new Paragraph({
      spacing: { before: 100, after: 120, line: 300 },
      shading: { type: ShadingType.CLEAR, fill: SUPERFICIE, color: 'auto' },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: CORAL, space: 8 } },
      children: [
        this.run(versiculo.cita || 'Referencia', { negrita: true, color: CORAL, tamano: 20 }),
        this.run(versiculo.texto ? ` — ${versiculo.texto}` : '', { cursiva: true, color: TEXTO, tamano: 20 }),
      ],
    }));
    return this;
  }

  caja(etiqueta: string, texto: string) {
    if (!texto) return this;
    this.hijos.push(new Paragraph({
      spacing: { before: 100, after: 120, line: 300 },
      shading: { type: ShadingType.CLEAR, fill: SUPERFICIE, color: 'auto' },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: CORAL, space: 8 } },
      children: [this.run(etiqueta.toUpperCase(), { negrita: true, color: CORAL, tamano: 18 }), this.run(`\n${texto}`, { color: TEXTO, tamano: 21 })],
    }));
    return this;
  }

  tablaAgenda(filas: Array<{ momento: string; minutos: string; descripcion: string }>) {
    if (!filas.length) return this;
    const borde = { style: BorderStyle.SINGLE, size: 4, color: LINEA };
    const celda = (texto: string, negrita = false) => new TableCell({
      shading: negrita ? { type: ShadingType.CLEAR, fill: CORAL, color: 'auto' } : undefined,
      borders: { top: borde, bottom: borde, left: borde, right: borde },
      children: [new Paragraph({ children: [this.run(texto, { negrita, color: negrita ? 'FFFFFF' : TEXTO, tamano: 19 })] })],
    });
    const filasTabla = [
      new TableRow({ children: [celda('Momento', true), celda('Tiempo', true), celda('Descripción', true)] }),
      ...filas.map((fila) => new TableRow({ children: [celda(fila.momento, true), celda(fila.minutos), celda(fila.descripcion)] })),
    ];
    this.hijos.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: filasTabla }));
    this.hijos.push(new Paragraph({ spacing: { after: 100 } }));
    return this;
  }

  tablaReferencias(referencias: ReferenciaDetectada[]) {
    if (!referencias.length) return this;
    const borde = { style: BorderStyle.SINGLE, size: 4, color: LINEA };
    const celda = (texto: string, negrita = false) => new TableCell({
      shading: negrita ? { type: ShadingType.CLEAR, fill: CORAL, color: 'auto' } : undefined,
      borders: { top: borde, bottom: borde, left: borde, right: borde },
      children: [new Paragraph({ children: [this.run(texto, { negrita, color: negrita ? 'FFFFFF' : TEXTO, tamano: 19 })] })],
    });
    const filas = [
      new TableRow({ children: [celda('Referencia', true), celda('Uso', true), celda('Estado', true)] }),
      ...referencias.map((referencia) => new TableRow({ children: [
        celda(referencia.cita, true),
        celda(referencia.tipoUso === 'lectura_o_cita' ? 'Lectura o cita' : 'Detectada'),
        celda('Pendiente de verificación'),
      ] })),
    ];
    this.hijos.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: filas }));
    this.hijos.push(new Paragraph({ spacing: { after: 100 } }));
    return this;
  }

  saltoPagina() {
    this.hijos.push(new Paragraph({ children: [new PageBreak()] }));
    return this;
  }

  async blob(): Promise<Blob> {
    const doc = new Document({
      creator: PRODUCTO_WORD,
      title: this.titulo,
      subject: this.etiqueta,
      description: `Documento generado por ${PRODUCTO_WORD}`,
      styles: {
        default: {
          document: {
            run: { font: 'Calibri', size: 21, color: TEXTO },
            paragraph: { spacing: { line: 300 } },
          },
        },
      },
      sections: [{
        properties: {
          page: { margin: { top: 900, right: 850, bottom: 900, left: 900 } },
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                this.run(`${INSTITUCION_WORD} · ${PRODUCTO_WORD} · Página `, { color: '7A6662', tamano: 16 }),
                new TextRun({ children: [PageNumber.CURRENT], color: '7A6662', size: 16 }),
                this.run(' de ', { color: '7A6662', tamano: 16 }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], color: '7A6662', size: 16 }),
              ],
            })],
          }),
        },
        children: this.hijos,
      }],
    });
    return Packer.toBlob(doc);
  }
}
