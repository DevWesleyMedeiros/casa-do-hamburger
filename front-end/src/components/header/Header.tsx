export const Header = () => {
  return (
    <div className="bg-[#161410]">
      <div className="w-full md:w-184.25 p-3 md:p-0 mx-auto flex items-center justify-between">
        <img src="./logo.png" alt="Logo link caso do Hamburger" />
        <button
          type="button"
          title="Entrar"
          className="bg-[#F2DAAC] w-32.5 h-8.75 rounded-md flex items-center justify-center cursor-pointer"
        >
          Entrar
        </button>
      </div>
    </div>
  )
}
