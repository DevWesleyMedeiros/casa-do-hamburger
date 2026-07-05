import { Toaster } from "sonner";
import "./App.css";
import { FetchUser } from "./shared/components/FetchUser";
import { AppRoutes } from "./shared/routes/AppRoutes";
import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors duration={3000} />

      {/* Disparamos a função UMA ÚNICA VEZ quando a aplicação é montada */}
      <FetchUser />
      <AppRoutes></AppRoutes>
    </BrowserRouter>
  );
}
export default App;
