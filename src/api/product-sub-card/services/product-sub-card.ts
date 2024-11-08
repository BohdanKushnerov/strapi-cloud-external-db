/**
 * product-sub-card service
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService(
  "api::product-sub-card.product-sub-card"
);

///////////////////////////////
// import { factories } from "@strapi/strapi";

// export default factories.createCoreService(
//   "api::product-sub-card.product-sub-card",
//   {
//     /**
//      * Перевірка і оновлення ціни перед створенням або оновленням
//      * @param {Object} data - Дані продукту
//      * @returns {Object} - Оновлені дані продукту
//      */
//     async beforeCreate(data) {
//       // Якщо inStock = false, встановлюємо price на null
//       if (data.inStock === false) {
//         data.price = null;
//       }
//       return data; // Повертаємо оновлені дані
//     },

//     async beforeUpdate(params, data) {
//       // Якщо inStock = false, встановлюємо price на null
//       console.log("beforeUpdate, beforeUpdate");
//       if (data.inStock === false) {
//         data.price = 0;
//       }
//       return data; // Повертаємо оновлені дані
//     },
//   }
// );