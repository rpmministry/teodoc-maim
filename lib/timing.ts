/**
 * Utilidad de medición de tiempos y benchmarking para TeoDoc MAIM.
 * Permite auditar con precisión de milisegundos cada etapa del flujo:
 * extracción, transcripción, almacenamiento, análisis de IA y generación documental.
 */

export interface RegistroTiempo {
  etapa: string;
  inicioMs: number;
  finMs?: number;
  duracionMs?: number;
  detalles?: Record<string, unknown>;
}

export class Cronometro {
  public readonly operacion: string;
  private marcas: Map<string, { inicio: number; detalles?: Record<string, unknown> }> = new Map();
  private registros: RegistroTiempo[] = [];
  private t0: number;

  constructor(operacion: string) {
    this.operacion = operacion;
    this.t0 = Date.now();
  }

  iniciarEtapa(etapa: string, detalles?: Record<string, unknown>): void {
    this.marcas.set(etapa, { inicio: Date.now(), detalles });
  }

  finalizarEtapa(etapa: string, detallesAdicionales?: Record<string, unknown>): number {
    const marca = this.marcas.get(etapa);
    const ahora = Date.now();
    const inicio = marca?.inicio ?? ahora;
    const duracion = ahora - inicio;

    this.registros.push({
      etapa,
      inicioMs: inicio - this.t0,
      finMs: ahora - this.t0,
      duracionMs: duracion,
      detalles: { ...marca?.detalles, ...detallesAdicionales },
    });

    this.marcas.delete(etapa);
    return duracion;
  }

  obtenerResumen(): {
    operacion: string;
    duracionTotalMs: number;
    etapas: Record<string, number>;
    registros: RegistroTiempo[];
  } {
    const total = Date.now() - this.t0;
    const etapas: Record<string, number> = {};
    for (const r of this.registros) {
      if (r.duracionMs !== undefined) {
        etapas[r.etapa] = r.duracionMs;
      }
    }
    return {
      operacion: this.operacion,
      duracionTotalMs: total,
      etapas,
      registros: this.registros,
    };
  }

  imprimirResumen(): void {
    const resumen = this.obtenerResumen();
    console.info(`[Cronómetro] ${resumen.operacion} completada en ${resumen.duracionTotalMs}ms:`);
    for (const r of this.registros) {
      console.info(`  • ${r.etapa}: ${r.duracionMs}ms`);
    }
  }
}
