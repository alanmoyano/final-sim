import SimulationConfig from "./components/SimulationConfig";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <SimulationConfig />
      <Toaster position="top-right" />
    </>
  );
}
