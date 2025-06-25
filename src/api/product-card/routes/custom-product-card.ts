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
  ],
};
