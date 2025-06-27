/**
 * product-card controller
 */

import { factories } from "@strapi/strapi";
import _ from "lodash";

export default factories.createCoreController(
  "api::product-card.product-card",
  ({ strapi }) => ({
    async facets(ctx) {
      try {
        console.log(11111111111111);

        const rawFilters = ctx.query.filters;

        console.log("rawFilters", rawFilters);

        let parsedFilters: Record<string, string[]> = {};

        if (typeof rawFilters === "string") {
          try {
            // Декодуємо та парсимо JSON
            parsedFilters = JSON.parse(decodeURIComponent(rawFilters));
          } catch (e) {
            console.error("Failed to parse filters:", e);
            return ctx.badRequest("Invalid filters format");
          }
        }

        console.log("Parsed filters:", parsedFilters);

        // const subcatHref = "dry-food-for-dogs";
        // const subcatHref = "therapeutic-food-for-dogs";
        const subcatHref = "cans-for-dogs";

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
        if (parsedFilters.brand?.length) {
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

        // Country
        if (parsedFilters.country?.length) {
          const countryPlaceholders = parsedFilters.country
            .map(() => "?")
            .join(", ");
          whereClauses.push(`
    pc.country IN (${countryPlaceholders})
  `);
          params.push(...parsedFilters.country);
        }

        // Price (min and max)
        if (
          parsedFilters.price?.length === 2 &&
          parsedFilters.price[0] !== "" &&
          parsedFilters.price[1] !== ""
        ) {
          const [minPrice, maxPrice] = parsedFilters.price;

          whereClauses.push(`
    EXISTS (
      SELECT 1
      FROM product_sub_cards_product_card_lnk lnk
      JOIN product_sub_cards ps ON ps.id = lnk.product_sub_card_id
      WHERE lnk.product_card_id = pc.id
        AND ps.in_stock = true
        AND ps.price BETWEEN ? AND ?
    )
  `);

          params.push(minPrice, maxPrice);
        }

        // Class of Feed
        if (parsedFilters.class_of_feed?.length) {
          const classPlaceholders = parsedFilters.class_of_feed
            .map(() => "?")
            .join(", ");

          whereClauses.push(`
    EXISTS (
      SELECT 1
      FROM product_cards_characteristic_lnk cclnk
      JOIN characteristics c ON c.id = cclnk.characteristic_id
      JOIN characteristics_class_of_feed_lnk cofcl ON cofcl.characteristic_id = c.id
      JOIN class_of_feeds cof ON cof.id = cofcl.class_of_feed_id
      WHERE cclnk.product_card_id = pc.id AND cof.value IN (${classPlaceholders})
    )
  `);

          params.push(...parsedFilters.class_of_feed);
        }

        // Age of dogs
        if (parsedFilters.age_of_dogs?.length) {
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

        // Breed of dogs
        if (parsedFilters.breed_of_dogs?.length) {
          const breedPlaceholders = parsedFilters.breed_of_dogs
            .map(() => "?")
            .join(", ");

          whereClauses.push(`
    EXISTS (
      SELECT 1
      FROM product_cards_characteristic_lnk cclnk
      JOIN characteristics c ON c.id = cclnk.characteristic_id
      JOIN breed_of_dogs_characteristics_lnk bdcl ON bdcl.characteristic_id = c.id
      JOIN breed_of_dogs bd ON bd.id = bdcl.breed_of_dog_id
      WHERE cclnk.product_card_id = pc.id AND bd.value IN (${breedPlaceholders})
    )
  `);

          params.push(...parsedFilters.breed_of_dogs);
        }

        // Breed Sizes
        if (parsedFilters.breed_sizes?.length) {
          const sizePlaceholders = parsedFilters.breed_sizes
            .map(() => "?")
            .join(", ");

          whereClauses.push(`
    EXISTS (
      SELECT 1
      FROM product_cards_characteristic_lnk cclnk
      JOIN characteristics c ON c.id = cclnk.characteristic_id
      JOIN breed_sizes_characteristics_lnk bscl ON bscl.characteristic_id = c.id
      JOIN breed_sizes bs ON bs.id = bscl.breed_size_id
      WHERE cclnk.product_card_id = pc.id AND bs.value IN (${sizePlaceholders})
    )
  `);

          params.push(...parsedFilters.breed_sizes);
        }

        // Source of Protein in Feeds
        if (parsedFilters.source_of_protein_in_feeds?.length) {
          const proteinPlaceholders = parsedFilters.source_of_protein_in_feeds
            .map(() => "?")
            .join(", ");

          whereClauses.push(`
    EXISTS (
      SELECT 1
      FROM product_cards_characteristic_lnk cclnk
      JOIN characteristics c ON c.id = cclnk.characteristic_id
      JOIN source_of_protein_in_feeds_characteristics_lnk sopcl ON sopcl.characteristic_id = c.id
      JOIN source_of_protein_in_feeds sop ON sop.id = sopcl.source_of_protein_in_feed_id
      WHERE cclnk.product_card_id = pc.id AND sop.value IN (${proteinPlaceholders})
    )
  `);

          params.push(...parsedFilters.source_of_protein_in_feeds);
        }

        // Special Dietary Needs
        if (parsedFilters.special_dietary_needs?.length) {
          const dietaryPlaceholders = parsedFilters.special_dietary_needs
            .map(() => "?")
            .join(", ");

          whereClauses.push(`
    EXISTS (
      SELECT 1
      FROM product_cards_characteristic_lnk cclnk
      JOIN characteristics c ON c.id = cclnk.characteristic_id
      JOIN special_dietary_needs_characteristics_lnk sdncl ON sdncl.characteristic_id = c.id
      JOIN special_dietary_needs sdn ON sdn.id = sdncl.special_dietary_need_id
      WHERE cclnk.product_card_id = pc.id AND sdn.value IN (${dietaryPlaceholders})
    )
  `);

          params.push(...parsedFilters.special_dietary_needs);
        }

        // =============================therapeutic-food-for-dogs=======================================
        // Appointment of Veterinary Diets
        if (parsedFilters.appointment_of_veterinary_diets?.length) {
          const appointmentPlaceholders =
            parsedFilters.appointment_of_veterinary_diets
              .map(() => "?")
              .join(", ");

          whereClauses.push(`
    EXISTS (
      SELECT 1
      FROM product_cards_characteristic_lnk cclnk
      JOIN characteristics c ON c.id = cclnk.characteristic_id
      JOIN appointment_of_veterinary_diets_characteristics_lnk avdcl ON avdcl.characteristic_id = c.id
      JOIN appointment_of_veterinary_diets avd ON avd.id = avdcl.appointment_of_veterinary_diet_id
      WHERE cclnk.product_card_id = pc.id AND avd.value IN (${appointmentPlaceholders})
    )
  `);

          params.push(...parsedFilters.appointment_of_veterinary_diets);
        }

        // =============================cans-for-dogs=======================================

        // Type of Canned Food
        if (parsedFilters.type_of_canned_food?.length) {
          const cannedFoodPlaceholders = parsedFilters.type_of_canned_food
            .map(() => "?")
            .join(", ");

          whereClauses.push(`
    EXISTS (
      SELECT 1
      FROM product_cards_characteristic_lnk cclnk
      JOIN characteristics c ON c.id = cclnk.characteristic_id
      JOIN characteristics_type_of_canned_food_lnk ctcf ON ctcf.characteristic_id = c.id
      JOIN type_of_canned_foods tcf ON tcf.id = ctcf.type_of_canned_food_id
      WHERE cclnk.product_card_id = pc.id AND tcf.value IN (${cannedFoodPlaceholders})
    )
  `);

          params.push(...parsedFilters.type_of_canned_food);
        }

        // Types of Packaging
        if (parsedFilters.type_of_packaging?.length) {
          const packagingPlaceholders = parsedFilters.type_of_packaging
            .map(() => "?")
            .join(", ");

          whereClauses.push(`
    EXISTS (
      SELECT 1
      FROM product_cards_characteristic_lnk cclnk
      JOIN characteristics c ON c.id = cclnk.characteristic_id
      JOIN characteristics_type_of_packaging_lnk ctop ON ctop.characteristic_id = c.id
      JOIN type_of_packagings top ON top.id = ctop.type_of_packaging_id
      WHERE cclnk.product_card_id = pc.id AND top.value IN (${packagingPlaceholders})
    )
  `);

          params.push(...parsedFilters.type_of_packaging);
        }

        // Об'єднуємо всі умови в один WHERE
        const whereSQL =
          whereClauses.length > 1
            ? " AND " + whereClauses.slice(1).join(" AND ") // Пропускаємо першу умову, бо вона вже є в основному запиті
            : "";

        console.log("whereSQL", whereSQL);
        console.log("params", params);

        // ======================================

        const result = await strapi.db.connection.raw(
          `WITH filtered_products AS (
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
          WHERE ps.in_stock = true

          UNION ALL

          -- 11. Максимальна ціна
          SELECT 
            'max_price' AS label,
            MAX(ps.price) AS count,
            'price' AS group_by_type
          FROM filtered_products fp
          JOIN product_sub_cards_product_card_lnk lnk ON lnk.product_card_id = fp.id
          JOIN product_sub_cards ps ON ps.id = lnk.product_sub_card_id
          WHERE ps.in_stock = true

          UNION ALL

          -- 12. Тип консервованого корму (type_of_canned_food)
          SELECT 
            tcf.value AS label,
            COUNT(DISTINCT fp.id) AS count,
            'type_of_canned_food' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN characteristics_type_of_canned_food_lnk ctcf ON ctcf.characteristic_id = c.id
          JOIN type_of_canned_foods tcf ON tcf.id = ctcf.type_of_canned_food_id
          GROUP BY tcf.value

          UNION ALL

          -- 13. Типи пакування (type_of_packaging)
          SELECT 
            top.value AS label,
            COUNT(DISTINCT fp.id) AS count,
            'type_of_packaging' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN characteristics_type_of_packaging_lnk ctop ON ctop.characteristic_id = c.id
          JOIN type_of_packagings top ON top.id = ctop.type_of_packaging_id
          GROUP BY top.value;
          `,
          params
        );

        const data = result.rows;

        ctx.body = data;
      } catch (error) {
        ctx.throw(500, error);
      }
    },
  })
);
