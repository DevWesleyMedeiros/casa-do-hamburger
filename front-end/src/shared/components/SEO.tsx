interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  noIndex?: boolean;
}

const SITE_NAME = 'Casa do Hamburguer';
/**
 * Como a regra funciona
• Se noIndex for verdadeiro (true): O conteúdo da tag vira (noindex, nofollow)
• Se noIndex for falso (false): O conteúdo da tag vira (index, follow)
# O significado de cada termo:
• index: O Google pode salvar e mostrar esta página nas buscas.
• follow: O Google pode navegar pelos links que estão dentro desta página.
• noindex: O Google não deve mostrar esta página nas buscas.
• nofollow: O Google não deve seguir os links encontrados nesta página.
noIndex = false (default parameter do componente Seo) significa que a página pode ser indexada pelo Google.
 */
export const Seo = ({ title, description, canonicalPath = '/home', noIndex = false }: SEOProps) => {
  const siteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || window.location.origin;

  const canonicalUrl = `${siteUrl}${canonicalPath}`;

  return (
    <>
      <title>
        {title} | {SITE_NAME}
      </title>

      <meta name="description" content={description} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
    </>
  );
};

// Json-Ld para Hamburgueria de Hamburgueres
export const HamburgueriaStructuredData = () => {
  const siteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || window.location.origin;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FoodService',
    name: SITE_NAME,
    url: `${siteUrl}/home`,
    servesCuisine: 'Hamburgueres',

    // quando tiver dados reais antes do deploy.
    // telephone: '+55...',
    // address: {
    //   '@type': 'PostalAddress',
    //   streetAddress: '...',
    //   addressLocality: '...',
    //   addressRegion: 'RS',
    //   postalCode: '...',
    //   addressCountry: 'BR',
    // },
    // openingHoursSpecification: [...],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
};
