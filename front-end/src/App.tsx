import "./App.css";
import { Input } from "./components/input/Input";

function App() {
  return (
    <div>
      <Input placeholder="E-mail" type="email"></Input>
      <Input placeholder="Senha" type="password"></Input>
    </div>
  );
}

export default App;
