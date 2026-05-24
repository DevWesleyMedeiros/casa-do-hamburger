import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <Link to="/login">Login</Link>
      <Link to="/register">Registro</Link>
    </div>
  );
}
