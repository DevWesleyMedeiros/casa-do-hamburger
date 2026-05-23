export const Input = () => {
  return (
    <label htmlFor="input-email">
      <input
        type="text"
        name="email"
        id="input-email"
        title="Nome"
        placeholder="E-mail"
        className="input-email py- h-[8.75] w-87.5 rounded-md bg-white px-2 py-2 text-sm text-[#32343E] outline-none"
      />
    </label>
  );
};
