import { exponencial } from "@/services/distribuciones";

const TASA_LLEGADA_BUQUES = 0.125;
const TASA_BOMBEO = 10000;
const TIEMPO_ENCENDIDO_BOMBA = 0.5;
const TASA_DESCARGA = 4000;
const VOLUMEN_TANQUE = 70000;

type EstadoBuque = "cargando" | "enCola" | "destruido";

type Buque = {
  id: number;
  estado: EstadoBuque;
  cargaInicial: number;
  cargaActual: number;
};

type EstadoTanque = "libre" | "cargando" | "descargando";

type Tanque = {
  id: number;
  estado: EstadoTanque;
  cargaInicial: number;
  cargaActual: number;
  capacidad: typeof VOLUMEN_TANQUE;
  buqueQueLoCarga: Buque | null;
};

type TipoEvento =
  | "inicioSimulacion"
  | "llegadaBuque"
  | "finBombeo"
  | "finDescarga"
  | "finSimulacion";

type Evento = {
  tipo: TipoEvento;
  tiempo: number;
  idTanque?: number;
};

// Tipo para el vector de estado que devuelve la simulación
export type FilaTabla = {
  eventNumber: number;
  clockTime: number;
  eventType: string;

  // Llegada buques tanque
  arrivalRnd: number;
  arrivalTime: number;
  nextArrival: number;

  // Carga buques tanques
  loadRnd: number;
  loadTonnage: number;
  pumpTime: number;
  realPumpTime: number;
  finalPumpTime: number;
  remainingLoad: number;
  finalTime: number;

  // Descarga buque costero a refinería
  dischargeRemainingLoad: number;
  finalDischargeTime: number;

  // Horas finales tanques costeros (repeated for each tank)
  tankFinalTimes: Array<{
    tankNumber: number;
    remainingLoad: number;
    finalTime: number;
  }>;

  // Estadísticas
  totalDischargedTonnage: number;
  maxQueueLength: number;

  // Tanques costeros (repeated for each tank)
  coastalTanks: Array<{
    tankNumber: number;
    status: string;
    remainingLoad: number;
    loadingShip: string;
  }>;
};

type Simulacion = {
  reloj: number;
  proximosEventos: Evento[];
  buques: Buque[];
  tanques: Tanque[];
  listasRandom: {
    llegadaBuque: number[];
    cargaBuque: number[];
  };
  // Nuevos campos para el seguimiento de estadísticas y datos del vector de estado
  numeroEvento: number;
  totalToneladasDescargadas: number;
  colaMaxima: number;
  ultimoEventoTipo: string;
  ultimosRandom: {
    llegada: number;
    carga: number;
  };
  ultimosBuquesCreados: Buque[];
};

const simulacion: Simulacion = {
  reloj: 0,
  proximosEventos: [],
  buques: [],
  tanques: [],
  listasRandom: {
    llegadaBuque: [],
    cargaBuque: [],
  },
  numeroEvento: 0,
  totalToneladasDescargadas: 0,
  colaMaxima: 0,
  ultimoEventoTipo: "inicioSimulacion",
  ultimosRandom: {
    llegada: 0,
    carga: 0,
  },
  ultimosBuquesCreados: [],
};

function crearBuque(
  cargaActual: number,
  cargaInicial: number,
  estado: EstadoBuque,
) {
  return {
    id: simulacion.buques.length + 1,
    estado,
    cargaInicial,
    cargaActual,
  };
}

function crearTanque(
  cargaActual: number,
  cargaInicial: number,
  estado: EstadoTanque,
  buqueQueLoCarga: Buque | null,
): Tanque {
  return {
    id: simulacion.tanques.length + 1,
    estado,
    cargaInicial,
    cargaActual,
    capacidad: VOLUMEN_TANQUE,
    buqueQueLoCarga,
  };
}

// Función para debugging - ver eventos programados
function mostrarEventosProgramados(): void {
  console.log("=== EVENTOS PROGRAMADOS ===");
  console.log("Reloj actual:", simulacion.reloj);
  console.log(
    "Próximos eventos:",
    simulacion.proximosEventos.sort((a, b) => a.tiempo - b.tiempo),
  );
  console.log("Estado tanques:");
  simulacion.tanques.forEach((tanque) => {
    console.log(
      `  Tanque ${tanque.id}: ${tanque.estado}, carga: ${tanque.cargaActual}, buque: ${tanque.buqueQueLoCarga?.id || "ninguno"}`,
    );
  });
  console.log(
    "Buques:",
    simulacion.buques.map((b) => `B${b.id}:${b.estado}`),
  );
  console.log("========================");
}

function avanzarSimulacion(): FilaTabla {
  simulacion.numeroEvento++;

  // Debug: mostrar eventos antes de procesar
  console.log(`\n--- EVENTO ${simulacion.numeroEvento} ---`);
  mostrarEventosProgramados();

  simulacion.proximosEventos.sort((a, b) => a.tiempo - b.tiempo);
  const proximoEvento = simulacion.proximosEventos.shift();

  let tiempoLlegadaCalculado = 0;
  let proximaLlegada = 0;
  let carga = 0;
  let tiempoBombeo = 0;
  let tiempoBombeoReal = 0;
  let horaFinalBombeo = 0;
  let cargaRestante = 0;
  let horaFin = 0;
  let cargaRestanteDescarga = 0;
  let horaFinalDescarga = 0;

  if (proximoEvento) {
    simulacion.reloj = proximoEvento.tiempo;
    simulacion.ultimoEventoTipo = proximoEvento.tipo;

    console.log(
      `Procesando evento: ${proximoEvento.tipo} en tiempo ${proximoEvento.tiempo}`,
    );

    switch (proximoEvento.tipo) {
      case "llegadaBuque": {
        const rndLlegada =
          simulacion.listasRandom.llegadaBuque.shift() as number;
        const rndCarga = simulacion.listasRandom.cargaBuque.shift() as number;

        simulacion.listasRandom.llegadaBuque.push(rndLlegada);
        simulacion.listasRandom.cargaBuque.push(rndCarga);

        simulacion.ultimosRandom.llegada = rndLlegada;
        simulacion.ultimosRandom.carga = rndCarga;

        tiempoLlegadaCalculado = exponencial(rndLlegada, TASA_LLEGADA_BUQUES);
        proximaLlegada = simulacion.reloj + tiempoLlegadaCalculado;

        console.log(
          `  RND llegada: ${rndLlegada}, tiempo calculado: ${tiempoLlegadaCalculado}, próxima: ${proximaLlegada}`,
        );

        // Programar la próxima llegada
        const proximoEventoLlegada: Evento = {
          tipo: "llegadaBuque",
          tiempo: proximaLlegada,
        };
        simulacion.proximosEventos.push(proximoEventoLlegada);

        if (rndCarga <= 1 / 3) {
          carga = 15000;
        } else if (rndCarga <= 2 / 3) {
          carga = 20000;
        } else {
          carga = 25000;
        }

        console.log(`  RND carga: ${rndCarga}, carga asignada: ${carga}`);

        const tanque = simulacion.tanques.find(
          (tanque) => tanque.estado === "libre",
        );

        let nuevoBuque: Buque;

        if (tanque) {
          console.log(`  Tanque ${tanque.id} disponible, asignando buque`);
          nuevoBuque = crearBuque(carga, carga, "cargando");
          tanque.estado = "cargando";
          tanque.buqueQueLoCarga = nuevoBuque;
          tanque.cargaActual = carga;

          tiempoBombeo = nuevoBuque.cargaActual / TASA_BOMBEO;
          tiempoBombeoReal = tiempoBombeo + TIEMPO_ENCENDIDO_BOMBA;
          horaFinalBombeo = simulacion.reloj + tiempoBombeoReal;
          cargaRestante = tanque.cargaActual;
          horaFin = horaFinalBombeo;

          const proximoEventoBombeo: Evento = {
            tipo: "finBombeo",
            tiempo: horaFinalBombeo,
            idTanque: tanque.id,
          };

          console.log(
            `  Programando fin bombeo para tanque ${tanque.id} en tiempo ${horaFinalBombeo} (bombeo: ${tiempoBombeo}h + encendido: ${TIEMPO_ENCENDIDO_BOMBA}h)`,
          );
          simulacion.proximosEventos.push(proximoEventoBombeo);
        } else {
          console.log(`  No hay tanques libres, buque va a cola`);
          nuevoBuque = crearBuque(carga, carga, "enCola");
          // Actualizar cola máxima
          const buquesEnCola = simulacion.buques.filter(
            (b) => b.estado === "enCola",
          ).length;
          simulacion.colaMaxima = Math.max(
            simulacion.colaMaxima,
            buquesEnCola + 1,
          );
          console.log(
            `  Buque ${nuevoBuque.id} entra en cola - no hay tanques libres`,
          );
        }

        simulacion.buques.push(nuevoBuque);
        simulacion.ultimosBuquesCreados = [nuevoBuque];

        break;
      }

      case "finBombeo": {
        console.log(
          `  Procesando fin bombeo para tanque ${proximoEvento.idTanque}`,
        );
        const tanque = simulacion.tanques.find(
          (tanque) => tanque.id === proximoEvento.idTanque,
        );

        if (!tanque) {
          console.log(
            `  Error: Tanque ${proximoEvento.idTanque} no encontrado`,
          );
          break;
        }

        simulacion.totalToneladasDescargadas += tanque.cargaActual;
        cargaRestanteDescarga = tanque.cargaActual;
        tanque.estado = "descargando";
        tanque.buqueQueLoCarga!.estado = "destruido";
        tanque.buqueQueLoCarga = null;

        const tiempoFinDescarga = cargaRestanteDescarga / TASA_DESCARGA;
        horaFinalDescarga = simulacion.reloj + tiempoFinDescarga;

        const proximoEventoDescarga: Evento = {
          tipo: "finDescarga",
          tiempo: horaFinalDescarga,
          idTanque: tanque.id,
        };

        console.log(
          `  Programando fin descarga para tanque ${tanque.id} en tiempo ${horaFinalDescarga} (descarga: ${tiempoFinDescarga}h)`,
        );
        simulacion.proximosEventos.push(proximoEventoDescarga);

        break;
      }

      case "finDescarga": {
        console.log(
          `  Procesando fin descarga para tanque ${proximoEvento.idTanque}`,
        );
        const tanque = simulacion.tanques.find(
          (tanque) => tanque.id === proximoEvento.idTanque,
        );

        if (!tanque) {
          console.log(
            `  Error: Tanque ${proximoEvento.idTanque} no encontrado`,
          );
          break;
        }

        tanque.estado = "libre";
        tanque.cargaActual = 0;

        const buque = simulacion.buques.find(
          (buque) => buque.estado === "enCola",
        );

        if (buque) {
          console.log(
            `  Asignando buque ${buque.id} de la cola al tanque ${tanque.id}`,
          );
          buque.estado = "cargando";
          tanque.estado = "cargando";
          tanque.buqueQueLoCarga = buque;
          tanque.cargaActual = buque.cargaActual;

          const tiempoBombeoCalculado = buque.cargaActual / TASA_BOMBEO;
          const tiempoBombeoRealCalculado =
            tiempoBombeoCalculado + TIEMPO_ENCENDIDO_BOMBA;

          const proximoEventoBombeo: Evento = {
            tipo: "finBombeo",
            tiempo: simulacion.reloj + tiempoBombeoRealCalculado,
            idTanque: tanque.id,
          };

          console.log(
            `  Programando fin bombeo para buque de cola en tanque ${tanque.id}`,
          );
          simulacion.proximosEventos.push(proximoEventoBombeo);
        } else {
          console.log(
            `  Tanque ${tanque.id} queda libre - no hay buques en cola`,
          );
        }

        break;
      }
    }
  }

  console.log(
    `Evento ${simulacion.numeroEvento} procesado. Próximo tipo: ${simulacion.ultimoEventoTipo}`,
  );

  // Construir el objeto FilaTabla con todos los datos necesarios
  const filaTabla: FilaTabla = {
    eventNumber: simulacion.numeroEvento,
    clockTime: simulacion.reloj,
    eventType: traducirTipoEvento(simulacion.ultimoEventoTipo),

    // Llegada buques tanque
    arrivalRnd: simulacion.ultimosRandom.llegada,
    arrivalTime: tiempoLlegadaCalculado,
    nextArrival: proximaLlegada,

    // Carga buques tanques
    loadRnd: simulacion.ultimosRandom.carga,
    loadTonnage: carga,
    pumpTime: tiempoBombeo,
    realPumpTime: tiempoBombeoReal,
    finalPumpTime: horaFinalBombeo,
    remainingLoad: cargaRestante,
    finalTime: horaFin,

    // Descarga buque costero a refinería
    dischargeRemainingLoad: cargaRestanteDescarga,
    finalDischargeTime: horaFinalDescarga,

    // Horas finales tanques costeros
    tankFinalTimes: simulacion.tanques.map((tanque) => ({
      tankNumber: tanque.id,
      remainingLoad: tanque.cargaActual,
      finalTime: obtenerHoraFinTanque(tanque),
    })),

    // Estadísticas
    totalDischargedTonnage: simulacion.totalToneladasDescargadas,
    maxQueueLength: simulacion.colaMaxima,

    // Tanques costeros
    coastalTanks: simulacion.tanques.map((tanque) => ({
      tankNumber: tanque.id,
      status: traducirEstadoTanque(tanque.estado),
      remainingLoad: tanque.cargaActual,
      loadingShip: tanque.buqueQueLoCarga
        ? `B${tanque.buqueQueLoCarga.id}`
        : "",
    })),
  };

  return filaTabla;
}

// Funciones auxiliares para traducir estados y obtener información
function traducirTipoEvento(tipo: string): string {
  const traducciones: Record<string, string> = {
    inicioSimulacion: "Inicio simulación",
    llegadaBuque: "Llegada buque",
    finBombeo: "Fin bombeo",
    finDescarga: "Fin descarga",
    finSimulacion: "Fin simulación",
  };
  return traducciones[tipo] || tipo;
}

function traducirEstadoTanque(estado: EstadoTanque): string {
  const traducciones: Record<EstadoTanque, string> = {
    libre: "Libre",
    cargando: "Cargando",
    descargando: "Descargando",
  };
  return traducciones[estado];
}

function obtenerHoraFinTanque(tanque: Tanque): number {
  // Buscar eventos pendientes para este tanque
  const eventoTanque = simulacion.proximosEventos.find(
    (evento) => evento.idTanque === tanque.id,
  );
  return eventoTanque ? eventoTanque.tiempo : simulacion.reloj;
}

// Tipo para las condiciones iniciales
type CondicionesIniciales = {
  tanks: Array<{
    id: number;
    status: "free" | "loading" | "unloading";
    currentLoad: number;
    completionTime?: number;
  }>;
  firstShipArrival: number;
};

// Función para inicializar la simulación con tanques
export function inicializarSimulacion(
  numeroTanques: number = 5,
  condicionesIniciales?: CondicionesIniciales,
): void {
  // Resetear simulación
  simulacion.reloj = 0;
  simulacion.proximosEventos = [];
  simulacion.buques = [];
  simulacion.tanques = [];
  simulacion.numeroEvento = 0;
  simulacion.totalToneladasDescargadas = 0;
  simulacion.colaMaxima = 0;
  simulacion.ultimoEventoTipo = "inicioSimulacion";
  simulacion.ultimosRandom = { llegada: 0, carga: 0 };
  simulacion.ultimosBuquesCreados = [];

  // Crear tanques basándose en las condiciones iniciales si se proporcionan
  if (condicionesIniciales && condicionesIniciales.tanks) {
    condicionesIniciales.tanks.forEach((tankConfig) => {
      const estadoTanque: EstadoTanque =
        tankConfig.status === "free"
          ? "libre"
          : tankConfig.status === "loading"
            ? "cargando"
            : tankConfig.status === "unloading"
              ? "descargando"
              : "libre";

      const tanque = crearTanque(
        tankConfig.currentLoad || 0,
        tankConfig.currentLoad || 0,
        estadoTanque,
        null,
      );

      // Si el tanque está cargando o descargando, programar evento de finalización
      if (tankConfig.status === "loading" && tankConfig.completionTime) {
        // Crear un buque ficticio para el tanque que está cargando
        const buqueFicticio = crearBuque(
          tankConfig.currentLoad,
          tankConfig.currentLoad,
          "cargando",
        );
        tanque.buqueQueLoCarga = buqueFicticio;
        simulacion.buques.push(buqueFicticio);

        simulacion.proximosEventos.push({
          tipo: "finBombeo",
          tiempo: tankConfig.completionTime,
          idTanque: tanque.id,
        });
      } else if (
        tankConfig.status === "unloading" &&
        tankConfig.completionTime
      ) {
        simulacion.proximosEventos.push({
          tipo: "finDescarga",
          tiempo: tankConfig.completionTime,
          idTanque: tanque.id,
        });
      }

      simulacion.tanques.push(tanque);
    });
  } else {
    // Crear tanques por defecto si no hay condiciones iniciales
    for (let i = 1; i <= numeroTanques; i++) {
      simulacion.tanques.push(crearTanque(0, 0, "libre", null));
    }
  }

  // Agregar el evento de llegada del primer buque
  const tiempoPrimerBuque = condicionesIniciales?.firstShipArrival || 0;
  simulacion.proximosEventos.push({
    tipo: "llegadaBuque",
    tiempo: tiempoPrimerBuque,
  });
}

// Función para establecer las listas de números random
export function establecerNumerosRandom(
  llegadas: number[],
  cargas: number[],
): void {
  simulacion.listasRandom.llegadaBuque = [...llegadas];
  simulacion.listasRandom.cargaBuque = [...cargas];
}

// Exportar la función avanzarSimulacion y otras necesarias
export { avanzarSimulacion };
