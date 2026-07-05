import { Toaster } from "sonner";
import "./App.css";
import { FetchCartItems } from "./shared/components/FetchCartItem";
import { FetchUser } from "./shared/components/FetchUser";
import { AppRoutes } from "./shared/routes/AppRoutes";

function App() {
  return (
    <>
      <Toaster position="top-center" richColors duration={3000} />
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
