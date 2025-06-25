"use strict";
/**
 * product-card controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController("api::product-card.product-card", ({ strapi }) => ({
    async facets(ctx) {
        var _a, _b;
        try {
            console.log(11111111111111);
            const rawFilters = ctx.query.filters;
            console.log("rawFilters", rawFilters);
            let parsedFilters = {};
            if (typeof rawFilters === "string") {
                try {
                    // Декодуємо та парсимо JSON
                    parsedFilters = JSON.parse(decodeURIComponent(rawFilters));
                }
                catch (e) {
                    console.error("Failed to parse filters:", e);
                    return ctx.badRequest("Invalid filters format");
                }
            }
            console.log("Parsed filters:", parsedFilters);
            const subcatHref = "dry-food-for-dogs";
            // ======================================
            const whereClauses = [];
            const params = [subcatHref]; // Перший параметр
            // Обов'язкова умова по підкатегорії (використовуємо ? замість $1)
            whereClauses.push(`
  EXISTS (
    SELECT 1
    FROM product_cards_animal_sub_category_lnk psc
    JOIN animal_sub_categories subcat ON subcat.id = psc.animal_sub_category_id
    WHERE psc.product_card_id = pc.id AND subcat.href = ?
  )
`);
            // Brand
            if ((_a = parsedFilters.brand) === null || _a === void 0 ? void 0 : _a.length) {
                const brandPlaceholders = parsedFilters.brand
                    .map(() => "?") // Використовуємо ? замість $n
                    .join(", ");
                whereClauses.push(`
    EXISTS (
      SELECT 1
      FROM product_cards_brand_lnk pclnk
      JOIN brands b ON b.id = pclnk.brand_id
      WHERE pclnk.product_card_id = pc.id AND b.value IN (${brandPlaceholders})
    )
  `);
                params.push(...parsedFilters.brand);
            }
            // Age of dogs
            if ((_b = parsedFilters.age_of_dogs) === null || _b === void 0 ? void 0 : _b.length) {
                const agePlaceholders = parsedFilters.age_of_dogs
                    .map(() => "?") // Використовуємо ? замість $n
                    .join(", ");
                whereClauses.push(`
    EXISTS (
      SELECT 1
      FROM product_cards_characteristic_lnk cclnk
      JOIN characteristics c ON c.id = cclnk.characteristic_id
      JOIN age_of_dogs_characteristics_lnk adcl ON adcl.characteristic_id = c.id
      JOIN age_of_dogs ad ON ad.id = adcl.age_of_dog_id
      WHERE cclnk.product_card_id = pc.id AND ad.value IN (${agePlaceholders})
    )
  `);
                params.push(...parsedFilters.age_of_dogs);
            }
            // Об'єднуємо всі умови в один WHERE
            const whereSQL = whereClauses.length > 1
                ? " AND " + whereClauses.slice(1).join(" AND ") // Пропускаємо першу умову, бо вона вже є в основному запиті
                : "";
            console.log("whereSQL", whereSQL);
            console.log("params", params);
            // ======================================
            const result = await strapi.db.connection.raw(`WITH filtered_products AS (
            SELECT DISTINCT pc.id, pc.country
            FROM product_cards pc
            JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = pc.id
            JOIN characteristics c ON c.id = cclnk.characteristic_id
            JOIN product_cards_animal_sub_category_lnk psc ON psc.product_card_id = pc.id
            JOIN animal_sub_categories subcat ON subcat.id = psc.animal_sub_category_id AND subcat.href = ?
            WHERE pc.published_at IS NOT NULL
            ${whereSQL}
          )

          -- 1. Бренди
          SELECT 
            b.title AS label,
            COUNT(fp.id) AS count,
            'brand' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_brand_lnk pclnk ON pclnk.product_card_id = fp.id
          JOIN brands b ON b.id = pclnk.brand_id
          GROUP BY b.title

          UNION ALL

          -- 2. Країни
          SELECT 
            fp.country AS label,
            COUNT(fp.id) AS count,
            'country' AS group_by_type
          FROM filtered_products fp
          GROUP BY fp.country

          UNION ALL

          -- 3. Клас корму (class_of_feed)
          SELECT 
            cof.value AS label,
            COUNT(DISTINCT fp.id) AS count,
            'class_of_feed' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN characteristics_class_of_feed_lnk cflnk ON cflnk.characteristic_id = c.id
          JOIN class_of_feeds cof ON cof.id = cflnk.class_of_feed_id
          GROUP BY cof.value

          UNION ALL

          -- 4. Вік собак (age_of_dogs)
          SELECT 
            ad.value AS label,
            COUNT(DISTINCT fp.id) AS count,
            'age_of_dogs' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN age_of_dogs_characteristics_lnk adcl ON adcl.characteristic_id = c.id
          JOIN age_of_dogs ad ON ad.id = adcl.age_of_dog_id
          GROUP BY ad.value

          UNION ALL

          -- 5. Породи собак (breed_of_dogs)
          SELECT 
            bd.value AS label,
            COUNT(DISTINCT fp.id) AS count,
            'breed_of_dogs' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN breed_of_dogs_characteristics_lnk bdcl ON bdcl.characteristic_id = c.id
          JOIN breed_of_dogs bd ON bd.id = bdcl.breed_of_dog_id
          GROUP BY bd.value

          UNION ALL

          -- 6. Розміри порід (breed_sizes)
          SELECT 
            bs.value AS label,
            COUNT(DISTINCT fp.id) AS count,
            'breed_sizes' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN breed_sizes_characteristics_lnk bscl ON bscl.characteristic_id = c.id
          JOIN breed_sizes bs ON bs.id = bscl.breed_size_id
          GROUP BY bs.value

          UNION ALL

          -- 7. Джерела протеїну (source_of_protein_in_feeds)
          SELECT 
            sp.value AS label,
            COUNT(DISTINCT fp.id) AS count,
            'source_of_protein_in_feeds' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN source_of_protein_in_feeds_characteristics_lnk spcl ON spcl.characteristic_id = c.id
          JOIN source_of_protein_in_feeds sp ON sp.id = spcl.source_of_protein_in_feed_id
          GROUP BY sp.value

          UNION ALL

          -- 8. Особливі потреби (special_dietary_needs)
          SELECT 
            sd.value AS label,
            COUNT(DISTINCT fp.id) AS count,
            'special_dietary_needs' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN special_dietary_needs_characteristics_lnk sdcl ON sdcl.characteristic_id = c.id
          JOIN special_dietary_needs sd ON sd.id = sdcl.special_dietary_need_id
          GROUP BY sd.value

          UNION ALL

          -- 9. Призначення ветеринарної дієти (appointment_of_veterinary_diets)
          SELECT 
            avd.value AS label,
            COUNT(DISTINCT fp.id) AS count,
            'appointment_of_veterinary_diets' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN appointment_of_veterinary_diets_characteristics_lnk avdcl ON avdcl.characteristic_id = c.id
          JOIN appointment_of_veterinary_diets avd ON avd.id = avdcl.appointment_of_veterinary_diet_id
          GROUP BY avd.value

          UNION ALL

          -- 10. Мінімальна ціна
          SELECT 
            'min_price' AS label,
            MIN(ps.price) AS count,
            'price' AS group_by_type
          FROM filtered_products fp
          JOIN product_sub_cards_product_card_lnk lnk ON lnk.product_card_id = fp.id
          JOIN product_sub_cards ps ON ps.id = lnk.product_sub_card_id

          UNION ALL

          -- 11. Максимальна ціна
          SELECT 
            'max_price' AS label,
            MAX(ps.price) AS count,
            'price' AS group_by_type
          FROM filtered_products fp
          JOIN product_sub_cards_product_card_lnk lnk ON lnk.product_card_id = fp.id
          JOIN product_sub_cards ps ON ps.id = lnk.product_sub_card_id;
          `, params);
            const data = result.rows;
            ctx.body = data;
        }
        catch (error) {
            ctx.throw(500, error);
        }
    },
}));
