import { NO_BACKEND_RESOURCE_IMAGE } from "../constant/fallbackImage";

export const NonBackendResources = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10 text-center text-amber-200">
      <h1 className="text-lg font-semibold md:text-2xl">
        Nenhum recurso de backend encontrado em produção 🚧
      </h1>

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <p className="text-7xl font-bold md:text-9xl">404</p>

        <img
          src={NO_BACKEND_RESOURCE_IMAGE}
          alt="Ilustração indicando que nenhum recurso está disponível"
          className="h-auto w-48 rounded-lg object-cover md:w-64"
          loading="lazy"
          // Evita layout shift, POIS Cloudinary já entrega WebP/AVIF automaticamente com f_auto, reduzindo peso
          width={400}
          height={400}
        />
      </div>

      <p className="max-w-md text-sm text-amber-100/80 md:text-base">
        Desculpe, o backend ainda não foi implantado em produção. Mas você pode
        conferir o andamento do projeto e os últimos prints de desenvolvimento
        no meu
        <a
          href="https://github.com/DevWesleyMedeiros/casa-do-hamburger"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-amber no-underscore font-extrabold underline-offset-2"
        >
          <span> repositório no GitHub</span>
        </a>
      </p>
    </div>
  );
};
