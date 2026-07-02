import "./App.css";
import { AppRoutes } from "./shared/routes/AppRoutes";
import { FetchUser } from "./shared/components/FetchUser";
import { FetchCartItems } from "./shared/components/FetchCartItem";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster position="top-center" richColors duration={2000} />
      {/* <UserProvider></UserProvider> */}
      {/* AppRoutes = children criado no UserProvider. Por isso ele é usuado <UserProvider></UserProvider> */}

      {/* Disparamos a função UMA ÚNICA VEZ quando a aplicação é montada */}
      <FetchUser />
      <FetchCartItems />
      <AppRoutes></AppRoutes>
    </>
  );
}
export default App;

// tudo que está dentro do AppRoutes está possibilitado de usar as informações passadas via o componente UserProvider. No caso, uma variável de estado user e setUser
