import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <div className="bg-[#161410]">
      <div className="mx-auto flex w-full items-center justify-between p-3 md:w-184.25 md:p-0">
        <img src="./logo.png" alt="Logo link caso do Hamburger" />

        <Link to="/login">
          <button
            type="button"
            title="Entrar"
            className="btn-login flex h-8.75 w-32.5 cursor-pointer items-center justify-center rounded-md bg-[#F2DAAC]"
          >
            Entrar
          </button>
        </Link>
        {/* envelopando o botão dentro do link, o link fica em toda o formato do botão */}
      </div>
    </div>
  );
};
