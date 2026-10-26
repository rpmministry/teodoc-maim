import { jsPDF } from 'jspdf';
import type { MetadatosPredica, Versiculo } from '../tipos.ts';
import { fechaAnalisisLarga, fechaLarga, obtenerRangoEdad } from '../modalidades.ts';
import { IDENTIDAD_MAIM } from '../institucional.ts';

export const PRODUCTO = 'TeoDoc MAIM';
export const INSTITUCION = IDENTIDAD_MAIM.nombre;

type RGB = readonly [number, number, number];

export const PALETA = {
  coral: [240, 78, 89] as RGB,
  coralOscuro: [181, 48, 59] as RGB,
  crema: [255, 248, 232] as RGB,
  cremaOficial: [255, 239, 180] as RGB,
  tinta: [43, 31, 30] as RGB,
  texto: [75, 55, 53] as RGB,
  suave: [122, 102, 98] as RGB,
  linea: [232, 214, 200] as RGB,
  superficie: [250, 242, 226] as RGB,
  blanco: [255, 255, 255] as RGB,
};

export interface FuentesPdf {
  regular: string;
  bold: string;
  italic: string;
  boldItalic: string;
}

export interface RecursosPdf {
  logoPortada?: string;
  logoIcono?: string;
  formatoLogo?: 'JPEG' | 'PNG';
  formatoIcono?: 'JPEG' | 'PNG';
  fuentes?: Partial<FuentesPdf>;
}

export interface PortadaOpciones {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  fechaDocumento?: string;
  edad?: string;
}

export interface ParrafoOpciones {
  tamano?: number;
  interlineado?: number;
  color?: RGB;
  negrita?: boolean;
  cursiva?: boolean;
  sangria?: number;
  despues?: number;
  mantener?: number;
}

export interface CajaOpciones {
  tono?: 'crema' | 'blanco' | 'coral';
  etiqueta?: string;
  tamano?: number;
}

export interface FilaAgenda {
  momento: string;
  minutos: string;
  descripcion: string;
}

export class DocumentoPDF {
  readonly doc: jsPDF;
  readonly metadatos: MetadatosPredica;
  readonly recursos: RecursosPdf;
  readonly pageW: number;
  readonly pageH: number;
  readonly margenIzq = 72;
  readonly margenDer = 52;
  readonly margenSup = 58;
  readonly margenInf = 58;
  readonly ancho: number;
  readonly pieY: number;
  y = 0;
  private readonly etiquetaModulo: string;
  private readonly familia: string;

  constructor(metadatos: MetadatosPredica, etiquetaModulo: string, recursos: RecursosPdf = {}) {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    this.metadatos = metadatos;
    this.recursos = recursos;
    this.pageW = this.doc.internal.pageSize.getWidth();
    this.pageH = this.doc.internal.pageSize.getHeight();
    this.ancho = this.pageW - this.margenIzq - this.margenDer;
    this.pieY = this.pageH - this.margenInf;
    this.etiquetaModulo = etiquetaModulo;
    this.familia = 'helvetica';
    if (recursos.fuentes?.regular && recursos.fuentes.bold && recursos.fuentes.italic && recursos.fuentes.boldItalic) {
      this.doc.addFileToVFS('IBMPlexSans-Regular.ttf', recursos.fuentes.regular);
      this.doc.addFileToVFS('IBMPlexSans-Bold.ttf', recursos.fuentes.bold);
      this.doc.addFileToVFS('IBMPlexSans-Italic.ttf', recursos.fuentes.italic);
      this.doc.addFileToVFS('IBMPlexSans-BoldItalic.ttf', recursos.fuentes.boldItalic);
      this.doc.addFont('IBMPlexSans-Regular.ttf', 'IBMPlexSans', 'normal');
      this.doc.addFont('IBMPlexSans-Bold.ttf', 'IBMPlexSans', 'bold');
      this.doc.addFont('IBMPlexSans-Italic.ttf', 'IBMPlexSans', 'italic');
      this.doc.addFont('IBMPlexSans-BoldItalic.ttf', 'IBMPlexSans', 'bolditalic');
      this.familia = 'IBMPlexSans';
    }
    this.y = this.margenSup;
  }

  private setText(color: RGB) {
    this.doc.setTextColor(color[0], color[1], color[2]);
  }

  private setFill(color: RGB) {
    this.doc.setFillColor(color[0], color[1], color[2]);
  }

  private setDraw(color: RGB) {
    this.doc.setDrawColor(color[0], color[1], color[2]);
  }

  private fuentes(negrita = false, cursiva = false) {
    this.doc.setFont(this.familia, negrita && cursiva ? 'bolditalic' : negrita ? 'bold' : cursiva ? 'italic' : 'normal');
  }

  private limpiar(valor: string): string {
    return String(valor || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[\u2190-\u21FF]/g, '-')
      .replace(/[\u25A0-\u25FF]/g, '-')
      .replace(/\uFFFD/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  private lineas(valor: string, ancho: number): string[] {
    const limpio = this.limpiar(valor);
    if (!limpio) return [];
    const resultado = this.doc.splitTextToSize(limpio, ancho) as string[];
    return Array.isArray(resultado) ? resultado : [limpio];
  }

  portada(opciones: PortadaOpciones): this {
    const { doc } = this;
    const w = this.pageW;
    const h = this.pageH;
    this.setFill(PALETA.crema);
    doc.rect(0, 0, w, h, 'F');

    this.setFill(PALETA.coral);
    doc.rect(0, 0, w, 296, 'F');

    if (this.recursos.logoPortada) {
      try {
        doc.addImage(this.recursos.logoPortada, this.recursos.formatoLogo || 'JPEG', 52, 36, 236, 164, undefined, 'FAST');
      } catch {
        this.textoMarcaPortada(52, 78);
      }
    } else {
      this.textoMarcaPortada(52, 78);
    }

    this.setFill(PALETA.coralOscuro);
    doc.roundedRect(52, 218, 238, 25, 12, 12, 'F');
    this.fuentes(true);
    doc.setFontSize(9);
    this.setText(PALETA.cremaOficial);
    doc.text('MATERIAL ELABORADO CON TEODOC MAIM', 60, 234);

    this.fuentes(false);
    doc.setFontSize(9.5);
    this.setText(PALETA.tinta);
    doc.text(INSTITUCION, 52, 271);

    this.setFill(PALETA.crema);
    doc.circle(w - 54, 262, 44, 'F');
    this.setFill(PALETA.cremaOficial);
    doc.circle(w - 54, 262, 33, 'F');

    const textoEtiqueta = this.limpiar(opciones.etiqueta).toUpperCase();
    this.fuentes(true);
    doc.setFontSize(8.5);
    const anchoEtiqueta = Math.min(this.ancho, Math.max(150, doc.getTextWidth(textoEtiqueta) + 22));
    this.setFill(PALETA.coralOscuro);
    doc.roundedRect(52, 322, anchoEtiqueta, 24, 4, 4, 'F');
    this.setText(PALETA.blanco);
    doc.text(textoEtiqueta, 61, 338);

    const titulo = opciones.titulo || 'Análisis del mensaje';
    let tamanoTitulo = titulo.length > 120 ? 20 : titulo.length > 80 ? 22 : titulo.length > 55 ? 24 : 27;
    this.fuentes(true);
    let lineasTitulo: string[] = [];
    for (const tamano of [tamanoTitulo, 24, 22, 20, 18]) {
      doc.setFontSize(tamano);
      lineasTitulo = this.lineas(titulo, this.ancho - 10);
      if (lineasTitulo.length <= 7) {
        tamanoTitulo = tamano;
        break;
      }
    }
    this.setText(PALETA.tinta);
    let yTitulo = 386;
    const altoLineaTitulo = Math.round(tamanoTitulo * 1.2);
    for (const linea of lineasTitulo.slice(0, 7)) {
      doc.text(linea, 52, yTitulo);
      yTitulo += altoLineaTitulo;
    }

    this.setDraw(PALETA.coral);
    doc.setLineWidth(2.2);
    doc.line(52, yTitulo + 6, 130, yTitulo + 6);
    yTitulo += 36;

    this.fuentes(false);
    doc.setFontSize(11.5);
    this.setText(PALETA.texto);
    const descripcion = this.lineas(opciones.descripcion, Math.min(this.ancho, 440));
    for (const linea of descripcion.slice(0, 4)) {
      doc.text(linea, 52, yTitulo);
      yTitulo += 17;
    }

    let yDatos = Math.max(yTitulo + 22, 566);
    if (this.metadatos.predicador) {
      this.fuentes(true);
      doc.setFontSize(14);
      const lineasPredicador = this.lineas(this.metadatos.predicador, this.ancho - 28).slice(0, 2);
      const altoTarjeta = 62 + Math.max(0, lineasPredicador.length - 1) * 17;
      this.setFill(PALETA.superficie);
      doc.roundedRect(52, yDatos, this.ancho, altoTarjeta, 6, 6, 'F');
      this.fuentes(true);
      doc.setFontSize(8);
      this.setText(PALETA.coralOscuro);
      doc.text('PREDICADOR O EXPOSITOR', 66, yDatos + 19);
      this.fuentes(true);
      doc.setFontSize(14);
      this.setText(PALETA.tinta);
      lineasPredicador.forEach((linea, indice) => doc.text(linea, 66, yDatos + 41 + indice * 17));
      yDatos += altoTarjeta + 16;
    }

    const datos: string[] = [];
    if (this.metadatos.fecha) datos.push(`Fecha de la prédica: ${fechaLarga(this.metadatos.fecha)}`);
    if (opciones.edad) datos.push(`Rango de edad: ${opciones.edad}`);
    if (opciones.fechaDocumento) datos.push(`Documento generado: ${opciones.fechaDocumento}`);
    this.fuentes(false);
    doc.setFontSize(9.5);
    this.setText(PALETA.suave);
    for (const dato of datos.slice(0, 3)) {
      doc.text(this.limpiar(dato), 52, yDatos);
      yDatos += 15;
    }

    this.setFill(PALETA.cremaOficial);
    doc.circle(w - 70, h - 58, 92, 'F');
    this.setFill(PALETA.coral);
    doc.circle(w - 70, h - 58, 63, 'F');
    this.setFill(PALETA.crema);
    doc.circle(w - 70, h - 58, 38, 'F');

    this.fuentes(true);
    doc.setFontSize(8);
    this.setText(PALETA.coralOscuro);
    doc.text('TEODOC MAIM', 52, h - 35);
    this.fuentes(false);
    this.setText(PALETA.suave);
    doc.text('Análisis bíblico y materiales para el ministerio', 52, h - 22);

    doc.setPage(1);
    doc.addPage();
    this.y = this.margenSup;
    return this;
  }

  private textoMarcaPortada(x: number, y: number) {
    this.fuentes(true);
    this.doc.setFontSize(44);
    this.setText(PALETA.cremaOficial);
    this.doc.text('MAIM', x, y);
    this.fuentes(false);
    this.doc.setFontSize(13);
    this.setText(PALETA.crema);
    this.doc.text('CASA DE ORACIÓN', x + 3, y + 24);
  }

  nuevaPagina(): this {
    this.doc.addPage();
    this.y = this.margenSup;
    return this;
  }

  asegurar(alto: number): this {
    if (this.y + alto > this.pieY) this.nuevaPagina();
    return this;
  }

  tituloSeccion(texto: string, numero?: string): this {
    this.asegurar(82);
    this.y += 8;
    if (numero) {
      this.setFill(PALETA.coralOscuro);
      this.doc.roundedRect(this.margenIzq, this.y, 24, 24, 5, 5, 'F');
      this.fuentes(true);
      this.doc.setFontSize(10);
      this.setText(PALETA.blanco);
      this.doc.text(numero, this.margenIzq + 12, this.y + 16, { align: 'center' });
      this.fuentes(true);
      this.doc.setFontSize(14);
      this.setText(PALETA.tinta);
      const lineas = this.lineas(texto, this.ancho - 38);
      this.doc.text(lineas[0] || '', this.margenIzq + 34, this.y + 16);
      let extra = 1;
      for (const linea of lineas.slice(1)) {
        this.doc.text(linea, this.margenIzq + 34, this.y + 16 + extra * 17);
        extra += 1;
      }
      this.y += 24 + Math.max(0, extra - 1) * 17 + 8;
    } else {
      this.fuentes(true);
      this.doc.setFontSize(14);
      this.setText(PALETA.tinta);
      const lineas = this.lineas(texto, this.ancho);
      for (const linea of lineas) {
        this.doc.text(linea, this.margenIzq, this.y + 14);
        this.y += 18;
      }
      this.y += 4;
    }
    this.setDraw(PALETA.linea);
    this.doc.setLineWidth(0.7);
    this.doc.line(this.margenIzq, this.y, this.pageW - this.margenDer, this.y);
    this.y += 16;
    return this;
  }

  subtitulo(texto: string, color: RGB = PALETA.tinta): this {
    this.fuentes(true);
    this.doc.setFontSize(11.5);
    const lineas = this.lineas(texto, this.ancho - 4);
    this.asegurar(lineas.length * 17 + 48);
    this.setText(color);
    for (const linea of lineas) {
      this.doc.text(linea, this.margenIzq, this.y + 12);
      this.y += 16;
    }
    this.y += 9;
    return this;
  }

  parrafo(valor: string, opciones: ParrafoOpciones = {}): this {
    const tamano = opciones.tamano ?? 10.5;
    const interlineado = opciones.interlineado ?? 15.5;
    const sangria = opciones.sangria ?? 0;
    this.fuentes(opciones.negrita, opciones.cursiva);
    this.doc.setFontSize(tamano);
    const lineas = this.lineas(valor, this.ancho - sangria);
    if (!lineas.length) return this;
    this.setText(opciones.color ?? PALETA.texto);
    if (opciones.mantener) this.asegurar(Math.min(lineas.length, opciones.mantener) * interlineado);
    for (const linea of lineas) {
      if (this.y + interlineado > this.pieY) this.nuevaPagina();
      this.doc.text(linea, this.margenIzq + sangria, this.y);
      this.y += interlineado;
    }
    this.y += opciones.despues ?? 9;
    return this;
  }

  lista(elementos: string[], opciones: { numerada?: boolean; color?: RGB; sangria?: number } = {}): this {
    const sangria = opciones.sangria ?? 0;
    let indice = 1;
    for (const elemento of elementos) {
      this.fuentes(false);
      this.doc.setFontSize(10.5);
      const lineas = this.lineas(elemento, this.ancho - 26 - sangria);
      if (!lineas.length) continue;
      this.asegurar(lineas.length * 15 + 8);
      this.fuentes(true);
      this.doc.setFontSize(10);
      this.setText(opciones.color ?? PALETA.coralOscuro);
      const marca = opciones.numerada ? `${indice}.` : '-';
      this.doc.text(marca, this.margenIzq + sangria, this.y);
      this.fuentes(false);
      this.doc.setFontSize(10.5);
      this.setText(PALETA.texto);
      for (const linea of lineas) {
        if (this.y + 15 > this.pieY) {
          this.nuevaPagina();
          this.fuentes(false);
          this.doc.setFontSize(10.5);
          this.setText(PALETA.texto);
        }
        this.doc.text(linea, this.margenIzq + 20 + sangria, this.y);
        this.y += 15;
      }
      this.y += 4;
      indice += 1;
    }
    this.y += 4;
    return this;
  }

  cita(versiculo: Versiculo, opciones: { compacta?: boolean } = {}): this {
    if (!versiculo.cita && !versiculo.texto) return this;
    const anchoInterno = this.ancho - 32;
    this.fuentes(false, true);
    this.doc.setFontSize(opciones.compacta ? 9.2 : 10);
    const lineasTexto = this.lineas(versiculo.texto, anchoInterno);
    const alto = 20 + (versiculo.cita ? 15 : 0) + lineasTexto.length * 14 + 14;
    this.asegurar(alto + 10);
    const top = this.y;
    this.setFill(PALETA.superficie);
    this.doc.roundedRect(this.margenIzq, top, this.ancho, alto, 4, 4, 'F');
    this.setFill(PALETA.coral);
    this.doc.rect(this.margenIzq, top, 4, alto, 'F');
    let y = top + 20;
    if (versiculo.cita) {
      this.fuentes(true);
      this.doc.setFontSize(9.5);
      this.setText(PALETA.coralOscuro);
      this.doc.text(versiculo.cita, this.margenIzq + 18, y);
      y += 15;
    }
    this.fuentes(false, true);
    this.doc.setFontSize(opciones.compacta ? 9.2 : 10);
    this.setText(PALETA.texto);
    for (const linea of lineasTexto) {
      this.doc.text(linea, this.margenIzq + 18, y);
      y += 14;
    }
    this.y = top + alto + 12;
    return this;
  }

  caja(texto: string, opciones: CajaOpciones = {}): this {
    const tono = opciones.tono ?? 'crema';
    const fondo = tono === 'coral' ? PALETA.coralOscuro : tono === 'blanco' ? PALETA.blanco : PALETA.superficie;
    const colorTexto = tono === 'coral' ? PALETA.blanco : PALETA.texto;
    const colorEtiqueta = tono === 'coral' ? PALETA.cremaOficial : PALETA.coralOscuro;
    const tamano = opciones.tamano ?? 10.2;
    const interlineado = Math.max(14, Math.round(tamano * 1.4));
    this.fuentes(false);
    this.doc.setFontSize(tamano);
    const lineas = this.lineas(texto, this.ancho - 32);
    const alto = 24 + (opciones.etiqueta ? 16 : 0) + lineas.length * interlineado + 12;
    this.asegurar(alto + 8);
    const top = this.y;
    this.setFill(fondo);
    this.doc.roundedRect(this.margenIzq, top, this.ancho, alto, 4, 4, 'F');
    let y = top + 20;
    if (opciones.etiqueta) {
      this.fuentes(true);
      this.doc.setFontSize(8.5);
      this.setText(colorEtiqueta);
      this.doc.text(opciones.etiqueta.toUpperCase(), this.margenIzq + 16, y);
      y += 16;
    }
    this.fuentes(false);
    this.doc.setFontSize(tamano);
    this.setText(colorTexto);
    for (const linea of lineas) {
      this.doc.text(linea, this.margenIzq + 16, y);
      y += interlineado;
    }
    this.y = top + alto + 12;
    return this;
  }

  ficha(filas: Array<{ etiqueta: string; valor: string }>): this {
    for (const fila of filas) {
      if (!fila.valor) continue;
      const etiqueta = this.limpiar(fila.etiqueta).toUpperCase();
      const valor = this.limpiar(fila.valor);
      this.fuentes(true);
      this.doc.setFontSize(8.5);
      const anchoEtiqueta = Math.min(this.ancho * 0.3, Math.max(86, this.doc.getTextWidth(etiqueta) + 12));
      const apilado = this.doc.getTextWidth(etiqueta) > anchoEtiqueta - 8;
      this.fuentes(false);
      this.doc.setFontSize(10);
      const lineas = this.lineas(valor, apilado ? this.ancho : this.ancho - anchoEtiqueta - 10);
      const alto = (apilado ? 15 : 0) + Math.max(1, lineas.length) * 15;
      this.asegurar(alto + 8);
      const top = this.y;
      this.fuentes(true);
      this.doc.setFontSize(8.5);
      this.setText(PALETA.suave);
      this.doc.text(etiqueta, this.margenIzq, top);
      this.fuentes(false);
      this.doc.setFontSize(10);
      this.setText(PALETA.tinta);
      let yValor = top + (apilado ? 15 : 0);
      for (const linea of lineas) {
        this.doc.text(linea, apilado ? this.margenIzq : this.margenIzq + anchoEtiqueta + 10, yValor);
        yValor += 15;
      }
      this.y = top + alto + 9;
    }
    return this;
  }

  tablaAgenda(filas: FilaAgenda[]): this {
    if (!filas.length) return this;
    const anchos = [this.ancho * 0.28, this.ancho * 0.16, this.ancho * 0.56];
    const x = [this.margenIzq, this.margenIzq + anchos[0], this.margenIzq + anchos[0] + anchos[1]];
    const cabecera = ['Momento', 'Tiempo', 'Descripción'];
    this.asegurar(32);
    this.setFill(PALETA.coralOscuro);
    this.doc.rect(this.margenIzq, this.y, this.ancho, 25, 'F');
    this.fuentes(true);
    this.doc.setFontSize(8.5);
    this.setText(PALETA.blanco);
    cabecera.forEach((titulo, indice) => this.doc.text(titulo.toUpperCase(), x[indice] + 7, this.y + 16));
    this.y += 25;
    filas.forEach((fila, indice) => {
      const celdas = [fila.momento, fila.minutos, fila.descripcion];
      const lineas = celdas.map((celda, i) => {
        this.fuentes(i === 0);
        this.doc.setFontSize(9.2);
        return this.lineas(celda, anchos[i] - 12);
      });
      const alto = Math.max(...lineas.map((l) => l.length), 1) * 14 + 12;
      this.asegurar(alto);
      if (indice % 2 === 0) {
        this.setFill(PALETA.superficie);
        this.doc.rect(this.margenIzq, this.y, this.ancho, alto, 'F');
      }
      this.setDraw(PALETA.linea);
      this.doc.setLineWidth(0.4);
      this.doc.line(this.margenIzq, this.y + alto, this.pageW - this.margenDer, this.y + alto);
      lineas.forEach((ls, i) => {
        this.fuentes(i === 0);
        this.doc.setFontSize(9.2);
        this.setText(i === 1 ? PALETA.coralOscuro : PALETA.texto);
        let yCelda = this.y + 14;
        for (const linea of ls) {
          this.doc.text(linea, x[i] + 7, yCelda);
          yCelda += 14;
        }
      });
      this.y += alto;
    });
    this.y += 14;
    return this;
  }

  chips(items: string[]): this {
    if (!items.length) return this;
    const alto = 22;
    const separacion = 7;
    let x = this.margenIzq;
    this.asegurar(alto + 8);
    this.fuentes(true);
    this.doc.setFontSize(8.5);
    for (const item of items) {
      const texto = this.limpiar(item).toUpperCase();
      if (!texto) continue;
      const ancho = this.doc.getTextWidth(texto) + 20;
      if (x + ancho > this.pageW - this.margenDer) {
        x = this.margenIzq;
        this.y += alto + 7;
        this.asegurar(alto + 7);
      }
      this.setDraw(PALETA.coral);
      this.doc.setLineWidth(0.8);
      this.doc.roundedRect(x, this.y, ancho, alto, 11, 11, 'S');
      this.setText(PALETA.coralOscuro);
      this.doc.text(texto, x + 10, this.y + 14.5);
      x += ancho + separacion;
    }
    this.y += alto + 12;
    return this;
  }

  separador(): this {
    this.asegurar(18);
    this.setDraw(PALETA.linea);
    this.doc.setLineWidth(0.6);
    this.doc.line(this.margenIzq, this.y, this.pageW - this.margenDer, this.y);
    this.y += 14;
    return this;
  }

  etiquetaDia(numero: number, titulo: string): this {
    this.asegurar(72);
    this.setFill(PALETA.coralOscuro);
    this.doc.roundedRect(this.margenIzq, this.y, 48, 48, 6, 6, 'F');
    this.fuentes(true);
    this.doc.setFontSize(8);
    this.setText(PALETA.cremaOficial);
    this.doc.text('DÍA', this.margenIzq + 24, this.y + 15, { align: 'center' });
    this.doc.setFontSize(18);
    this.setText(PALETA.blanco);
    this.doc.text(String(numero), this.margenIzq + 24, this.y + 35, { align: 'center' });
    this.fuentes(true);
    this.doc.setFontSize(15);
    this.setText(PALETA.tinta);
    const lineas = this.lineas(titulo, this.ancho - 62);
    let yTitulo = this.y + 18;
    for (const linea of lineas) {
      this.doc.text(linea, this.margenIzq + 60, yTitulo);
      yTitulo += 18;
    }
    this.y += Math.max(48, lineas.length * 18) + 16;
    return this;
  }

  finalizar(etiquetaPie: string): Blob {
    const total = this.doc.getNumberOfPages();
    const tituloCorto = this.lineas(this.metadatos.tituloProporcionado || 'Análisis del mensaje', 320)[0] || 'Análisis del mensaje';
    for (let pagina = 2; pagina <= total; pagina++) {
      this.doc.setPage(pagina);
      this.setDraw(PALETA.linea);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margenIzq, this.margenSup - 22, this.pageW - this.margenDer, this.margenSup - 22);
      this.fuentes(false);
      this.doc.setFontSize(7.5);
      this.setText(PALETA.suave);
      this.doc.text(tituloCorto, this.margenIzq, this.margenSup - 30);
      this.doc.text(etiquetaPie.toUpperCase(), this.pageW - this.margenDer, this.margenSup - 30, { align: 'right' });

      if (this.recursos.logoIcono) {
        try {
          this.doc.addImage(this.recursos.logoIcono, this.recursos.formatoIcono || 'JPEG', this.pageW - this.margenDer - 12, this.pageH - this.margenInf + 15, 12, 12, undefined, 'FAST');
        } catch {
          this.setText(PALETA.suave);
        }
      }

      this.setDraw(PALETA.coral);
      this.doc.setLineWidth(0.8);
      this.doc.line(this.margenIzq, this.pageH - this.margenInf + 10, this.pageW - this.margenDer, this.pageH - this.margenInf + 10);
      this.fuentes(false);
      this.doc.setFontSize(7.5);
      this.setText(PALETA.suave);
      this.doc.text(`${INSTITUCION} · ${PRODUCTO}`, this.margenIzq, this.pageH - this.margenInf + 24);
      this.doc.text(`Página ${pagina} de ${total}`, this.pageW - this.margenDer - 18, this.pageH - this.margenInf + 24, { align: 'right' });
    }

    this.doc.setProperties({
      title: this.metadatos.tituloProporcionado || 'Análisis del mensaje',
      subject: etiquetaPie,
      author: PRODUCTO,
      keywords: `${PRODUCTO}, ${INSTITUCION}, ${etiquetaPie}, estudio bíblico`,
      creator: PRODUCTO,
    });
    this.doc.setLanguage?.('es-ES');
    return this.doc.output('blob') as Blob;
  }
}

export function fechaDocumento(metadatos: MetadatosPredica): string {
  return fechaAnalisisLarga(metadatos.fechaAnalisis);
}

export function datosEdad(metadatos: MetadatosPredica): string {
  return obtenerRangoEdad(metadatos.rangoEdad);
}
