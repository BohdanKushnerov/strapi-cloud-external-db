'use strict';

/**
 * product-card service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::product-card.product-card');
