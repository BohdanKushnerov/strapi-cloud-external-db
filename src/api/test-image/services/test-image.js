'use strict';

/**
 * test-image service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::test-image.test-image');
