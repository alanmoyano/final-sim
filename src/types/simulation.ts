export interface TankState {
  id: number;
  status: "free" | "loading" | "unloading";
  currentLoad: number; // Tn
  freeSpace: number; // Tn
  completionTime?: number; // hours
}

export interface SimulationParameters {
  // Arrival and service rates
  arrivalMean: number; // hours (exponential distribution)
  pumpStartupTime: number; // hours (constant)
  pumpingRate: number; // Tn/hour (constant)
  dischargeRate: number; // Tn/hour (constant)

  // Ship and tank specifications
  shipLoads: [number, number, number]; // [15000, 20000, 25000] Tn
  coastalTankCapacity: number; // 70000 Tn

  // Simulation configuration
  simulationTime: number; // hours
  numberOfTanks: number;
  numberOfRuns: number; // simulation lines to run
}

export interface InitialConditions {
  tanks: TankState[];
  firstShipArrival: number; // hour 0
}

export interface RandomNumbers {
  arrivalNumbers: number[]; // 0-99 integers for ship arrivals
  loadNumbers: number[]; // 0-99 integers for ship loads
}

export interface SimulationConfig {
  parameters: SimulationParameters;
  initialConditions: InitialConditions;
  randomNumbers: RandomNumbers;
}

// Default values from the problem statement
export const DEFAULT_PARAMETERS: SimulationParameters = {
  arrivalMean: 0.125,
  pumpStartupTime: 0.5,
  pumpingRate: 10000,
  dischargeRate: 4000,
  shipLoads: [15000, 20000, 25000],
  coastalTankCapacity: 70000,
  simulationTime: 1000,
  numberOfTanks: 5,
  numberOfRuns: 1,
};

export const DEFAULT_INITIAL_CONDITIONS: InitialConditions = {
  tanks: [
    { id: 1, status: "free", currentLoad: 0, freeSpace: 70000 },
    { id: 2, status: "free", currentLoad: 0, freeSpace: 70000 },
    {
      id: 3,
      status: "unloading",
      currentLoad: 70000,
      freeSpace: 0,
      completionTime: 8,
    },
    {
      id: 4,
      status: "loading",
      currentLoad: 25000,
      freeSpace: 45000,
      completionTime: 12,
    },
    {
      id: 5,
      status: "loading",
      currentLoad: 45000,
      freeSpace: 25000,
      completionTime: 3.5,
    },
  ],
  firstShipArrival: 0,
};

// Helper function to generate initial tank conditions
export const generateInitialTanks = (numberOfTanks: number): TankState[] => {
  const tanks: TankState[] = [];

  for (let i = 1; i <= numberOfTanks; i++) {
    if (i <= 2) {
      // First two tanks are free
      tanks.push({
        id: i,
        status: "free",
        currentLoad: 0,
        freeSpace: 70000,
      });
    } else if (i === 3) {
      // Third tank is unloading
      tanks.push({
        id: i,
        status: "unloading",
        currentLoad: 70000,
        freeSpace: 0,
        completionTime: 8,
      });
    } else if (i === 4) {
      // Fourth tank is loading
      tanks.push({
        id: i,
        status: "loading",
        currentLoad: 25000,
        freeSpace: 45000,
        completionTime: 12,
      });
    } else if (i === 5) {
      // Fifth tank is loading
      tanks.push({
        id: i,
        status: "loading",
        currentLoad: 45000,
        freeSpace: 25000,
        completionTime: 3.5,
      });
    } else {
      // Additional tanks are free
      tanks.push({
        id: i,
        status: "free",
        currentLoad: 0,
        freeSpace: 70000,
      });
    }
  }

  return tanks;
};

// State vector interfaces for simulation table
export interface StateVectorRow {
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
}
