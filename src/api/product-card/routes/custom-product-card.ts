export default {
  routes: [
    {
      method: "GET",
      path: "/product-cards/facets", // aggregate-filters
      handler: "product-card.facets",
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/product-cards/custom-pagination/:categoryHref",
      handler: "product-card.customPagination",
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
