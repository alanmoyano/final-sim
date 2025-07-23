import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StateVectorRow, SimulationConfig } from "@/types/simulation";
import { cn } from "@/lib/utils";
import {
  avanzarSimulacion,
  inicializarSimulacion,
  establecerNumerosRandom,
} from "@/services/simulacion";

interface HeaderColumn {
  name: string;
  description: string;
  child?: HeaderColumn[];
  childRepeat?: boolean;
  colSpan?: number;
  rowSpan?: number;
  isSticky?: boolean;
  width?: number;
  left?: number;
  bgColor?: string;
  childBgColor?: string;
}

interface StateVectorTableProps {
  numberOfTanks?: number;
  simulationConfig?: SimulationConfig;
}

const headersData: Omit<HeaderColumn, "width" | "left">[] = [
  {
    name: "N° de evento",
    description: "El número de evento que ocurrió (cuenta desde 1)",
    isSticky: true,
    bgColor: "bg-slate-400",
    childBgColor: "bg-slate-300",
  },
  {
    name: "Reloj (horas)",
    description:
      "La hora actual del sistema al ocurrir un evento (empieza en 0)",
    isSticky: true,
    bgColor: "bg-slate-400",
    childBgColor: "bg-slate-300",
  },
  {
    name: "Evento",
    description: "El tipo de evento que ocurrió",
    isSticky: true,
    bgColor: "bg-slate-400",
    childBgColor: "bg-slate-300",
  },
  {
    name: "Llegada buques tanque",
    description:
      "Un encabezado que reune todos a los datos relevantes para el cálculo de la llegada de los buques tanque",
    bgColor: "bg-blue-400",
    childBgColor: "bg-blue-300",
    child: [
      { name: "RND", description: "..." },
      { name: "Tiempo", description: "..." },
      { name: "Próxima llegada", description: "..." },
    ],
  },
  {
    name: "Carga buques tanques",
    description:
      "Un encabezado que reúne todos los datos relevantes para el proceso de carga de los buques tanque",
    bgColor: "bg-green-400",
    childBgColor: "bg-green-300",
    child: [
      { name: "RND", description: "..." },
      { name: "Carga (Tn)", description: "..." },
      { name: "Tiempo bombeo", description: "..." },
      { name: "Tiempo bombeo real", description: "...", width: 150 },
      { name: "Hora final bombeo", description: "..." },
      { name: "Carga restante", description: "...", width: 150 },
      { name: "Hora fin", description: "..." },
    ],
  },
  {
    name: "Descarga buque costero a refinería",
    description:
      "Un encabezado que reúne los datos relevantes para el proceso de descarga del buque costero hacia la refinería",
    bgColor: "bg-orange-400",
    childBgColor: "bg-orange-300",
    child: [
      { name: "Carga restante (Tn)", description: "...", width: 160 },
      { name: "Hora final descarga", description: "...", width: 150 },
    ],
  },
  {
    name: "Horas finales tanques costeros",
    description:
      "Un encabezado que reúne todas las horas finales de los tanques costeros",
    bgColor: "bg-purple-400",
    childBgColor: "bg-purple-300",
    childRepeat: true,
    child: [
      { name: "N°", description: "..." },
      { name: "Carga restante (Tn)", description: "...", width: 160 },
      { name: "Hora fin", description: "..." },
    ],
  },
  {
    name: "Estadísticas",
    description:
      "Un encabezado que reúne las estadísticas de seguimiento del sistema de simulación",
    bgColor: "bg-red-400",
    childBgColor: "bg-red-300",
    child: [
      { name: "Tn descargadas total", description: "...", width: 160 },
      { name: "Cola máxima", description: "..." },
    ],
  },
  {
    name: "Tanques costeros",
    description:
      "Un encabezado que reúne la información del estado y contenido de los tanques costeros",
    bgColor: "bg-indigo-400",
    childBgColor: "bg-indigo-300",
    childRepeat: true,
    child: [
      { name: "N°", description: "..." },
      { name: "Estado", description: "..." },
      { name: "Carga restante (Tn)", description: "...", width: 160 },
      { name: "Buque que lo carga", description: "...", width: 150 },
    ],
  },
];

const STICKY_COLUMNS = 3;
const COLUMN_WIDTHS = [100, 120, 150];

export default function StateVectorTable({
  numberOfTanks = 5,
  simulationConfig,
}: StateVectorTableProps) {
  const [simulationData, setSimulationData] = useState<StateVectorRow[]>([]);
  const [isSimulationInitialized, setIsSimulationInitialized] = useState(false);

  // Inicializar la simulación
  useEffect(() => {
    if (!isSimulationInitialized && simulationConfig) {
      const { randomNumbers, initialConditions } = simulationConfig;

      // Solo inicializar si tenemos números aleatorios válidos
      if (
        randomNumbers.arrivalNumbers.length > 0 &&
        randomNumbers.loadNumbers.length > 0
      ) {
        // Pasar las condiciones iniciales al backend
        inicializarSimulacion(numberOfTanks, initialConditions);

        // Convertir números de 0-99 a 0-1
        const llegadas = randomNumbers.arrivalNumbers.map((num) => num / 100);
        const cargas = randomNumbers.loadNumbers.map((num) => num / 100);
        establecerNumerosRandom(llegadas, cargas);

        setIsSimulationInitialized(true);
      }
    }
  }, [numberOfTanks, simulationConfig, isSimulationInitialized]);

  // Función para avanzar un paso en la simulación
  const avanzarPaso = () => {
    try {
      const nuevaFila = avanzarSimulacion();
      setSimulationData((prev) => [...prev, nuevaFila]);
    } catch (error) {
      console.error("Error al avanzar simulación:", error);
    }
  };

  // Función para avanzar múltiples pasos
  const avanzarMultiplesPasos = (pasos: number) => {
    const nuevasFilas: StateVectorRow[] = [];
    for (let i = 0; i < pasos; i++) {
      try {
        const nuevaFila = avanzarSimulacion();
        nuevasFilas.push(nuevaFila);
      } catch (error) {
        console.error(`Error al avanzar paso ${i + 1}:`, error);
        break;
      }
    }
    setSimulationData((prev) => [...prev, ...nuevasFilas]);
  };

  // Función para reiniciar la simulación
  const reiniciarSimulacion = () => {
    setSimulationData([]);
    setIsSimulationInitialized(false);
  };

  // Usar los datos reales de la simulación en lugar de datos de ejemplo
  const exampleData: StateVectorRow[] = simulationData;

  // Verificar si la simulación está lista para ejecutarse
  const canRunSimulation =
    simulationConfig &&
    simulationConfig.randomNumbers.arrivalNumbers.length > 0 &&
    simulationConfig.randomNumbers.loadNumbers.length > 0;

  const { headerRows, bodyColumns } = useMemo(() => {
    const firstHeaderRow: HeaderColumn[] = [];
    const secondHeaderRow: HeaderColumn[] = [];
    const bodyCols: HeaderColumn[] = [];
    let currentLeft = 0;

    headersData.forEach((header, index) => {
      const width = index < STICKY_COLUMNS ? COLUMN_WIDTHS[index] : 120;

      if (header.child) {
        if (header.childRepeat) {
          for (let i = 0; i < numberOfTanks; i++) {
            firstHeaderRow.push({
              ...header,
              name: `${header.name} ${i + 1}`,
              colSpan: header.child.length,
              isSticky: false,
            });
            header.child.forEach((child) => {
              const childWidth = (child as HeaderColumn).width || 120;
              secondHeaderRow.push({
                ...child,
                width: childWidth,
                isSticky: false,
                bgColor: header.childBgColor,
              });
              bodyCols.push({
                ...child,
                width: childWidth,
                isSticky: false,
              });
            });
          }
        } else {
          firstHeaderRow.push({
            ...header,
            colSpan: header.child.length,
            isSticky: false,
          });
          header.child.forEach((child) => {
            const childWidth = (child as HeaderColumn).width || 120;
            secondHeaderRow.push({
              ...child,
              width: childWidth,
              isSticky: false,
              bgColor: header.childBgColor,
            });
            bodyCols.push({ ...child, width: childWidth, isSticky: false });
          });
        }
      } else {
        const stickyProps = {
          ...header,
          rowSpan: 2,
          width,
          left: header.isSticky ? currentLeft : undefined,
        };
        firstHeaderRow.push(stickyProps);
        bodyCols.push(stickyProps);

        if (header.isSticky) {
          currentLeft += width;
        }
      }
    });

    return {
      headerRows: [firstHeaderRow, secondHeaderRow],
      bodyColumns: bodyCols,
    };
  }, [numberOfTanks]);

  const formatValue = (value: unknown): string => {
    if (typeof value === "number") {
      return value.toFixed(value % 1 === 0 ? 0 : 2);
    }
    return String(value);
  };

  const getCellValue = (row: StateVectorRow, colIndex: number): unknown => {
    const allValues: unknown[] = [
      row.eventNumber,
      row.clockTime,
      row.eventType,
      row.arrivalRnd,
      row.arrivalTime,
      row.nextArrival,
      row.loadRnd,
      row.loadTonnage,
      row.pumpTime,
      row.realPumpTime,
      row.finalPumpTime,
      row.remainingLoad,
      row.finalTime,
      row.dischargeRemainingLoad,
      row.finalDischargeTime,
      ...row.tankFinalTimes.flatMap((t) => [
        t.tankNumber,
        t.remainingLoad,
        t.finalTime,
      ]),
      row.totalDischargedTonnage,
      row.maxQueueLength,
      ...row.coastalTanks.flatMap((t) => [
        t.tankNumber,
        t.status,
        t.remainingLoad,
        t.loadingShip,
      ]),
    ];

    return colIndex < allValues.length ? allValues[colIndex] : "N/A";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-sans">
          Vector de Estado - Simulación de Puerto
        </CardTitle>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={avanzarPaso}
            disabled={!isSimulationInitialized || !canRunSimulation}
            variant="default"
            size="sm"
          >
            Avanzar 1 Paso
          </Button>
          <Button
            onClick={() => avanzarMultiplesPasos(5)}
            disabled={!isSimulationInitialized || !canRunSimulation}
            variant="outline"
            size="sm"
          >
            Avanzar 5 Pasos
          </Button>
          <Button
            onClick={() => avanzarMultiplesPasos(10)}
            disabled={!isSimulationInitialized || !canRunSimulation}
            variant="outline"
            size="sm"
          >
            Avanzar 10 Pasos
          </Button>
          <Button
            onClick={reiniciarSimulacion}
            variant="destructive"
            size="sm"
            disabled={!canRunSimulation}
          >
            Reiniciar
          </Button>
          <div className="ml-auto text-sm text-muted-foreground">
            Eventos: {simulationData.length} | Tanques: {numberOfTanks} |
            Estado:{" "}
            {!canRunSimulation
              ? "Configuración incompleta"
              : isSimulationInitialized
                ? "Lista"
                : "Cargando..."}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative max-h-[80vh] overflow-auto rounded-lg border border-border">
          <table className="w-full border-collapse border-spacing-0 text-sm">
            <thead>
              {headerRows.map((row, rowIndex) => (
                <tr key={`header-row-${rowIndex}`}>
                  {row.map((header, colIndex) => (
                    <th
                      key={`header-${rowIndex}-${colIndex}`}
                      colSpan={header.colSpan}
                      rowSpan={header.rowSpan}
                      className={cn(
                        "sticky top-0 border-r border-b px-2 py-2.5 text-center text-xs font-semibold whitespace-nowrap text-white",
                        header.bgColor,
                        // Z-index más alto para columnas sticky
                        header.isSticky ? "sticky left-0 z-50" : "z-40",
                        // Bordes específicos para sticky columns
                        header.isSticky && "border-r-2 border-white/20",
                      )}
                      style={{
                        width: header.width,
                        minWidth: header.width,
                        left: header.left,
                      }}
                    >
                      {header.name}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {exampleData.length > 0 ? (
                exampleData.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className="hover:bg-muted/50">
                    {bodyColumns.map((col, colIndex) => (
                      <td
                        key={`cell-${rowIndex}-${colIndex}`}
                        className={cn(
                          "border-r border-b bg-background p-2 text-center text-sm whitespace-nowrap",
                          // Z-index más alto para columnas sticky y fondo sólido
                          col.isSticky
                            ? "sticky left-0 z-30 border-r-2 bg-background"
                            : "z-10",
                        )}
                        style={{
                          width: col.width,
                          minWidth: col.width,
                          left: col.left,
                        }}
                      >
                        {formatValue(getCellValue(row, colIndex))}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={bodyColumns.length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {!canRunSimulation
                      ? "Complete la configuración de números aleatorios en las pestañas superiores para poder ejecutar la simulación"
                      : isSimulationInitialized
                        ? "Presiona 'Avanzar 1 Paso' para comenzar la simulación"
                        : "Inicializando simulación..."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
