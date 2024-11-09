"use strict";
// import type { Core } from '@strapi/strapi';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    /**
     * An asynchronous register function that runs before
     * your application is initialized.
     *
     * This gives you an opportunity to extend code.
     */
    register( /* { strapi }: { strapi: Core.Strapi } */) { },
    /**
     * An asynchronous bootstrap function that runs before
     * your application gets started.
     *
     * This gives you an opportunity to set up your data model,
     * run jobs, or perform some special logic.
     */
    // bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
    async bootstrap({ strapi }) {
        // registering a subscriber
        strapi.db.lifecycles.subscribe({
            models: ["api::[product-sub-card].[product-sub-card]"], // optional;
            beforeUpdate(event) {
                const { data, where, select, populate } = event.params;
                console.log("11111111122", data, where, select, populate);
            },
        });
        strapi.db.lifecycles.subscribe(async (event) => {
            if ((event.action === "beforeUpdate" || event.action === 'beforeCreate') &&
                event.model.uid === "api::product-sub-card.product-sub-card" &&
                event.params.data.inStock === false) {
                event.params.data.priceForSortCheap = null;
                event.params.data.priceForSortExpensive = 0;
            }
            if ((event.action === "beforeUpdate" || event.action === "beforeCreate") &&
                event.model.uid === "api::product-sub-card.product-sub-card" &&
                event.params.data.inStock === true) {
                event.params.data.priceForSortCheap = event.params.data.price;
                event.params.data.priceForSortExpensive = event.params.data.price;
            }
            ////////////////////////////////////
            // const subCardId = event.params.where.id;
            // const mainCard = await strapi.entityService.findOne(
            //   "api::product-sub-card.product-sub-card",
            //   subCardId,
            //   { populate: ["product_card"] }
            // );
            // console.log(mainCard);
        });
    },
};
