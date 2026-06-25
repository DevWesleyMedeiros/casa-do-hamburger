import "./App.css";
import { AppRoutes } from "./shared/routes/AppRoutes";
// import { UserProvider } from "./shared/context/UserProvider";
import { FetchUser } from "./shared/components/FetchUser";
import { Toaster } from "sonner";

function App() {

  return (
    <>
      <Toaster position="top-center" richColors duration={4000} />
      {/* <UserProvider></UserProvider> */}
      {/* AppRoutes = children criado no UserProvider. Por isso ele é usuado <UserProvider></UserProvider> */}

      
      {/* Disparamos a função UMA ÚNICA VEZ quando a aplicação é montada */}
      <FetchUser />
      <AppRoutes></AppRoutes>
    </>
  );
}
export default App;

// tudo que está dentro do AppRoutes está possibilitado de usar as informações passadas via o componente UserProvider. No caso, uma variável de estado user e setUser
