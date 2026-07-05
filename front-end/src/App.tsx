import { Toaster } from "sonner";
import "./App.css";
import { FetchCartItems } from "./shared/components/FetchCartItem";
import { FetchUser } from "./shared/components/FetchUser";
import { AppRoutes } from "./shared/routes/AppRoutes";

function App() {
  return (
    <>
      <Toaster position="top-center" richColors duration={3000} />

      {/* Disparamos a função UMA ÚNICA VEZ quando a aplicação é montada */}
      <FetchUser />
      <FetchCartItems />
      <AppRoutes></AppRoutes>
    </>
  );
}
export default App;
