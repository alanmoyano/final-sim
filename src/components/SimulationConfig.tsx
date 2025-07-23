import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DEFAULT_PARAMETERS,
  DEFAULT_INITIAL_CONDITIONS,
  generateInitialTanks,
  type SimulationConfig,
} from "@/types/simulation";
import { toast } from "sonner";

// Validation schemas
const parametersSchema = z.object({
  arrivalMean: z.number().positive("Debe ser un número positivo"),
  pumpStartupTime: z.number().min(0, "Debe ser mayor o igual a 0"),
  pumpingRate: z.number().positive("Debe ser un número positivo"),
  dischargeRate: z.number().positive("Debe ser un número positivo"),
  shipLoads: z
    .array(z.number().positive())
    .length(3, "Debe tener exactamente 3 valores"),
  coastalTankCapacity: z.number().positive("Debe ser un número positivo"),
  simulationTime: z.number().positive("Debe ser un número positivo"),
  numberOfTanks: z.number().int().min(1, "Debe ser al menos 1"),
  numberOfRuns: z.number().int().min(1, "Debe ser al menos 1"),
});

const tankSchema = z.object({
  id: z.number(),
  status: z.enum(["free", "loading", "unloading"]),
  currentLoad: z.number().min(0),
  freeSpace: z.number().min(0),
  completionTime: z.number().optional(),
});

const initialConditionsSchema = z.object({
  tanks: z.array(tankSchema),
  firstShipArrival: z.number().min(0),
});

const randomNumbersSchema = z.object({
  arrivalNumbers: z
    .array(z.number().int().min(0).max(99))
    .min(1, "Debe ingresar al menos un número para llegadas"),
  loadNumbers: z
    .array(z.number().int().min(0).max(99))
    .min(1, "Debe ingresar al menos un número para cargas"),
});

type ParametersFormData = z.infer<typeof parametersSchema>;
type InitialConditionsFormData = z.infer<typeof initialConditionsSchema>;
type RandomNumbersFormData = z.infer<typeof randomNumbersSchema>;

export default function SimulationConfig() {
  const [config, setConfig] = useState<SimulationConfig>({
    parameters: DEFAULT_PARAMETERS,
    initialConditions: DEFAULT_INITIAL_CONDITIONS,
    randomNumbers: { arrivalNumbers: [], loadNumbers: [] },
  });

  const parametersForm = useForm<ParametersFormData>({
    resolver: zodResolver(parametersSchema),
    defaultValues: DEFAULT_PARAMETERS,
  });

  const initialConditionsForm = useForm<InitialConditionsFormData>({
    resolver: zodResolver(initialConditionsSchema),
    defaultValues: DEFAULT_INITIAL_CONDITIONS,
  });

  const randomNumbersForm = useForm<RandomNumbersFormData>({
    resolver: zodResolver(randomNumbersSchema),
    defaultValues: {
      arrivalNumbers: [91, 73, 81, 18, 32, 63, 58, 21, 78, 2],
      loadNumbers: [79, 86, 1, 67, 61, 57, 30, 37, 11, 97],
    },
  });

  const onParametersSubmit = (data: ParametersFormData) => {
    setConfig((prev) => ({
      ...prev,
      parameters: {
        ...data,
        shipLoads: data.shipLoads as [number, number, number],
      },
    }));
    toast.success("Parámetros del sistema guardados correctamente");
  };

  const onInitialConditionsSubmit = (data: InitialConditionsFormData) => {
    setConfig((prev) => ({ ...prev, initialConditions: data }));
    toast.success("Condiciones iniciales guardadas correctamente");
  };

  const onRandomNumbersSubmit = (data: RandomNumbersFormData) => {
    setConfig((prev) => ({ ...prev, randomNumbers: data }));
    toast.success("Números aleatorios guardados correctamente");
  };

  const parseRandomNumbers = (text: string): number[] => {
    return text
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map((s) => parseInt(s))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 99);
  };

  const handleSaveTankQuantity = () => {
    const numberOfTanks = parametersForm.getValues("numberOfTanks");
    const newTanks = generateInitialTanks(numberOfTanks);

    // Update the initial conditions form with new tanks
    initialConditionsForm.setValue("tanks", newTanks);

    // Update the config state
    setConfig((prev) => ({
      ...prev,
      initialConditions: {
        ...prev.initialConditions,
        tanks: newTanks,
      },
    }));
    toast.success("Cantidad de tanques aplicada a condiciones iniciales");
  };

  const handleRunSimulation = () => {
    console.log("Configuración de simulación:", config);
    // Aquí se ejecutaría la simulación en futuras iteraciones
    alert(
      "Configuración guardada. La simulación se ejecutará en la próxima iteración.",
    );
  };

  // Helper to check if both lists are filled in the form (not just config)
  const isRandomNumbersComplete =
    randomNumbersForm.watch("arrivalNumbers").length > 0 &&
    randomNumbersForm.watch("loadNumbers").length > 0;

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Simulación de Puerto - Configuración
        </h1>
        <p className="text-muted-foreground">
          Configure los parámetros de la simulación de buques tanques y tanques
          costeros
        </p>
      </div>

      <Tabs defaultValue="parameters" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="parameters">Parámetros del Sistema</TabsTrigger>
          <TabsTrigger value="simulation">Configuración</TabsTrigger>
          <TabsTrigger value="initial">Condiciones Iniciales</TabsTrigger>
          <TabsTrigger value="random">Números Aleatorios</TabsTrigger>
        </TabsList>

        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parámetros del Sistema</CardTitle>
              <CardDescription>
                Configure los parámetros operacionales del puerto y los buques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...parametersForm}>
                <form
                  onSubmit={parametersForm.handleSubmit(onParametersSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Llegadas y Tiempos
                      </h3>
                      <FormField
                        control={parametersForm.control}
                        name="arrivalMean"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Media Distribución Exponencial (hs)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.001"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Tiempo promedio entre llegadas de buques
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={parametersForm.control}
                        name="pumpStartupTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tiempo Encendido Bombas (hs)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Tiempo constante para encender las bombas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Tasas de Procesamiento
                      </h3>
                      <FormField
                        control={parametersForm.control}
                        name="pumpingRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tasa de Bombeo (Tn/hora)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Velocidad de transferencia del buque al tanque
                              costero
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={parametersForm.control}
                        name="dischargeRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tasa de Descarga (Tn/hora)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Velocidad de transferencia del tanque costero a la
                              refinería
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Capacidades</h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={parametersForm.control}
                        name="coastalTankCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacidad Tanque Costero (Tn)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Capacidad máxima de cada tanque costero
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <FormLabel>Cargas de Buques (Tn)</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          {[0, 1, 2].map((index) => (
                            <FormField
                              key={index}
                              control={parametersForm.control}
                              name={`shipLoads.${index}` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder={`Carga ${index + 1}`}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          parseFloat(e.target.value),
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormDescription>
                          Posibles cargas de buques tanques (igual probabilidad)
                        </FormDescription>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Guardar Parámetros del Sistema
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Simulación</CardTitle>
              <CardDescription>
                Configure la duración y cantidad de corridas de la simulación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...parametersForm}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <FormField
                    control={parametersForm.control}
                    name="simulationTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiempo de Simulación (hs)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Duración total de cada corrida
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={parametersForm.control}
                    name="numberOfTanks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad de Tanques</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Número de tanques costeros
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={parametersForm.control}
                    name="numberOfRuns"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad de Corridas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Número de líneas de simulación a ejecutar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={handleSaveTankQuantity}
                    className="w-full"
                    variant="outline"
                  >
                    Aplicar Cantidad de Tanques a Condiciones Iniciales
                  </Button>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    Esto actualizará automáticamente la tabla de condiciones
                    iniciales
                  </p>
                </div>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="initial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Condiciones Iniciales</CardTitle>
              <CardDescription>
                Configure el estado inicial de los tanques costeros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...initialConditionsForm}>
                <form
                  onSubmit={initialConditionsForm.handleSubmit(
                    onInitialConditionsSubmit,
                  )}
                  className="space-y-6"
                >
                  <FormField
                    control={initialConditionsForm.control}
                    name="firstShipArrival"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Llegada Primer Buque (hora)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Hora de llegada del primer buque tanque
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Estado Inicial de Tanques
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanque</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Carga Actual (Tn)</TableHead>
                          <TableHead>Espacio Libre (Tn)</TableHead>
                          <TableHead>Hora Finalización</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {initialConditionsForm
                          .watch("tanks")
                          .map((tank, index) => (
                            <TableRow key={tank.id}>
                              <TableCell className="font-medium">
                                {tank.id}
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={initialConditionsForm.control}
                                  name={`tanks.${index}.status`}
                                  render={({ field }) => (
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="free">
                                          Libre
                                        </SelectItem>
                                        <SelectItem value="loading">
                                          Cargando
                                        </SelectItem>
                                        <SelectItem value="unloading">
                                          Descargando
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={initialConditionsForm.control}
                                  name={`tanks.${index}.currentLoad`}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      className="w-24"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          parseFloat(e.target.value),
                                        )
                                      }
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={initialConditionsForm.control}
                                  name={`tanks.${index}.freeSpace`}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      className="w-24"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          parseFloat(e.target.value),
                                        )
                                      }
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={initialConditionsForm.control}
                                  name={`tanks.${index}.completionTime`}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      step="0.1"
                                      className="w-24"
                                      disabled={tank.status === "free"}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          parseFloat(e.target.value),
                                        )
                                      }
                                    />
                                  )}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Button type="submit" className="w-full">
                    Guardar Condiciones Iniciales
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="random" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Números Aleatorios</CardTitle>
              <CardDescription>
                Ingrese los números aleatorios a usar durante la simulación
                (0-99)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...randomNumbersForm}>
                <form
                  onSubmit={randomNumbersForm.handleSubmit(
                    onRandomNumbersSubmit,
                  )}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <FormField
                        control={randomNumbersForm.control}
                        name="arrivalNumbers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Números para Llegadas de Buques
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ej: 32 45 67 89 12 ..."
                                className="min-h-32"
                                value={field.value?.join(" ") ?? ""}
                                onChange={(e) => {
                                  const parsed = parseRandomNumbers(
                                    e.target.value,
                                  );
                                  field.onChange(parsed);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Números para generar tiempos entre llegadas de
                              buques
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {randomNumbersForm.watch("arrivalNumbers").length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            Números para llegadas (
                            {randomNumbersForm.watch("arrivalNumbers").length}):
                          </p>
                          <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                            {randomNumbersForm
                              .watch("arrivalNumbers")
                              .map((num, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {num} → {(num / 100).toFixed(2)}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={randomNumbersForm.control}
                        name="loadNumbers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Números para Cargas de Buques</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ej: 23 78 41 66 29 ..."
                                className="min-h-32"
                                value={field.value?.join(" ") ?? ""}
                                onChange={(e) => {
                                  const parsed = parseRandomNumbers(
                                    e.target.value,
                                  );
                                  field.onChange(parsed);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Números para determinar la carga de cada buque
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {randomNumbersForm.watch("loadNumbers").length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            Números para cargas (
                            {randomNumbersForm.watch("loadNumbers").length}):
                          </p>
                          <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                            {randomNumbersForm
                              .watch("loadNumbers")
                              .map((num, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {num} → {(num / 100).toFixed(2)}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Guardar Números Aleatorios
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Ejecutar Simulación</CardTitle>
          <CardDescription>
            Una vez configurados todos los parámetros, ejecute la simulación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleRunSimulation}
            className="w-full"
            size="lg"
            disabled={!isRandomNumbersComplete}
          >
            Ejecutar Simulación
          </Button>
          {!isRandomNumbersComplete && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Complete ambas listas de números aleatorios para continuar
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
