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
        // console.log(11111111111111);

        const { subCategory, filter } = ctx.request.query;

        if (!subCategory) {
          return ctx.badRequest("Missing 'subCategory' query param");
        }

        let parsedFilters: Record<string, string[]> = {};

        if (filter && typeof filter === "string") {
          try {
            parsedFilters = JSON.parse(decodeURIComponent(filter));
          } catch (e) {
            console.error("Invalid 'filter' param:", e);
            return ctx.badRequest("Invalid filter format");
          }
        }

        // console.log("subCategory:", subCategory);
        // console.log("parsedFilters:", parsedFilters);

        // ======================================
        const whereClauses = [];
        const params = [subCategory]; // Перший параметр

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

        // Type of Packaging
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

        // console.log("whereSQL characteristics", whereSQL);
        // console.log("params characteristics", params);

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
            b.title AS title,
            b.value AS value,
            COUNT(fp.id) AS count,
            'brand' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_brand_lnk pclnk ON pclnk.product_card_id = fp.id
          JOIN brands b ON b.id = pclnk.brand_id
          GROUP BY b.title, b.value

          UNION ALL

          -- 2. Країни
          SELECT 
            fp.country AS title,
            fp.country AS value,
            COUNT(fp.id) AS count,
            'country' AS group_by_type
          FROM filtered_products fp
          GROUP BY fp.country

          UNION ALL

          -- 3a. Мінімальна ціна 
          SELECT 
            'min_price' AS title,
            'min_price' AS value,
            MIN(ps.price) AS count,
            'price' AS group_by_type
          FROM filtered_products fp
          JOIN product_sub_cards_product_card_lnk lnk ON lnk.product_card_id = fp.id
          JOIN product_sub_cards ps ON ps.id = lnk.product_sub_card_id
          WHERE ps.in_stock = true
          HAVING MIN(ps.price) IS NOT NULL

          UNION ALL

          -- 3b. Максимальна ціна
          SELECT 
            'max_price' AS title,
            'max_price' AS value,
            MAX(ps.price) AS count,
            'price' AS group_by_type
          FROM filtered_products fp
          JOIN product_sub_cards_product_card_lnk lnk ON lnk.product_card_id = fp.id
          JOIN product_sub_cards ps ON ps.id = lnk.product_sub_card_id
          WHERE ps.in_stock = true
          HAVING MAX(ps.price) IS NOT NULL

          UNION ALL


          -- 4. Клас корму (class_of_feed)
          SELECT 
            cof.title AS title,
            cof.value AS value,
            COUNT(DISTINCT fp.id) AS count,
            'class_of_feed' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN characteristics_class_of_feed_lnk cflnk ON cflnk.characteristic_id = c.id
          JOIN class_of_feeds cof ON cof.id = cflnk.class_of_feed_id
          GROUP BY cof.title, cof.value

          UNION ALL

          -- 5. Вік собак (age_of_dogs)
          SELECT 
            ad.title AS title,
            ad.value AS value,
            COUNT(DISTINCT fp.id) AS count,
            'age_of_dogs' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN age_of_dogs_characteristics_lnk adcl ON adcl.characteristic_id = c.id
          JOIN age_of_dogs ad ON ad.id = adcl.age_of_dog_id
          GROUP BY ad.title, ad.value

          UNION ALL

          -- 6. Породи собак (breed_of_dogs)
          SELECT 
            bd.title AS title,
            bd.value AS value,
            COUNT(DISTINCT fp.id) AS count,
            'breed_of_dogs' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN breed_of_dogs_characteristics_lnk bdcl ON bdcl.characteristic_id = c.id
          JOIN breed_of_dogs bd ON bd.id = bdcl.breed_of_dog_id
          GROUP BY bd.title, bd.value

          UNION ALL

          -- 7. Розміри порід (breed_sizes)
          SELECT 
            bs.title AS title,
            bs.value AS value,
            COUNT(DISTINCT fp.id) AS count,
            'breed_sizes' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN breed_sizes_characteristics_lnk bscl ON bscl.characteristic_id = c.id
          JOIN breed_sizes bs ON bs.id = bscl.breed_size_id
          GROUP BY bs.title, bs.value

          UNION ALL

          -- 8. Джерела протеїну (source_of_protein_in_feeds)
          SELECT 
            sp.title AS title,
            sp.value AS value,
            COUNT(DISTINCT fp.id) AS count,
            'source_of_protein_in_feeds' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN source_of_protein_in_feeds_characteristics_lnk spcl ON spcl.characteristic_id = c.id
          JOIN source_of_protein_in_feeds sp ON sp.id = spcl.source_of_protein_in_feed_id
          GROUP BY sp.title, sp.value

          UNION ALL

          -- 9. Особливі потреби (special_dietary_needs)
          SELECT 
            sd.title AS title,
            sd.value AS value,
            COUNT(DISTINCT fp.id) AS count,
            'special_dietary_needs' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN special_dietary_needs_characteristics_lnk sdcl ON sdcl.characteristic_id = c.id
          JOIN special_dietary_needs sd ON sd.id = sdcl.special_dietary_need_id
          GROUP BY sd.title, sd.value

          UNION ALL

          -- 10. Призначення ветеринарної дієти (appointment_of_veterinary_diets)
          SELECT 
            avd.title AS title,
            avd.value AS value,
            COUNT(DISTINCT fp.id) AS count,
            'appointment_of_veterinary_diets' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN appointment_of_veterinary_diets_characteristics_lnk avdcl ON avdcl.characteristic_id = c.id
          JOIN appointment_of_veterinary_diets avd ON avd.id = avdcl.appointment_of_veterinary_diet_id
          GROUP BY avd.title, avd.value

          UNION ALL

          -- 11. Типи пакування (type_of_packaging)
          SELECT 
            top.title AS title,
            top.value AS value,
            COUNT(DISTINCT fp.id) AS count,
            'type_of_packaging' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN characteristics_type_of_packaging_lnk ctop ON ctop.characteristic_id = c.id
          JOIN type_of_packagings top ON top.id = ctop.type_of_packaging_id
          GROUP BY top.title, top.value

          UNION ALL

          -- 12. Тип консервованого корму (type_of_canned_food)
          SELECT 
            tcf.title AS title,
            tcf.value AS value,
            COUNT(DISTINCT fp.id) AS count,
            'type_of_canned_food' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN characteristics_type_of_canned_food_lnk ctcf ON ctcf.characteristic_id = c.id
          JOIN type_of_canned_foods tcf ON tcf.id = ctcf.type_of_canned_food_id
          GROUP BY tcf.title, tcf.value;`,
          params
        );

        const data = result.rows;

        ctx.body = data;
      } catch (error) {
        ctx.throw(500, error);
      }
    },
    async customPagination(ctx) {
      const categoryHref = ctx.params.categoryHref ?? null;
      const { page = 1, pageSize = 10, sort = "popular", filter } = ctx.query;

      const offset = (Number(page) - 1) * Number(pageSize);
      const limit = Number(pageSize);

      const knex = strapi.db.connection;

      const sortMap = {
        popular: "pc.created_at ASC",
        new: "pc.published_at DESC",
        cheap: "MIN(ps.price_for_sort_cheap) ASC",
        expensive: "MAX(ps.price_for_sort_expensive) DESC",
      };

      const sortSQL = sortMap[sort as string] || sortMap.popular;

      let parsedFilters: Record<string, string[]> = {};

      if (filter && typeof filter === "string") {
        try {
          parsedFilters = JSON.parse(decodeURIComponent(filter));
        } catch (e) {
          console.error("Invalid 'filter' param:", e);
          return ctx.badRequest("Invalid filter format");
        }
      }

      const whereClauses: string[] = [];
      const filterParams: any[] = [];

      if (categoryHref) {
        whereClauses.push(`
      EXISTS (
        SELECT 1
        FROM product_cards_animal_sub_category_lnk psc
        JOIN animal_sub_categories subcat ON subcat.id = psc.animal_sub_category_id
        WHERE psc.product_card_id = pc.id AND subcat.href = ?
      )
    `);
        filterParams.push(categoryHref);
      } else {
        whereClauses.push(`
      EXISTS (
        SELECT 1
        FROM product_cards_animal_sub_category_lnk psc
        WHERE psc.product_card_id = pc.id
      )
    `);
      }

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

        filterParams.push(...parsedFilters.brand);
      }

      // Country
      if (parsedFilters.country?.length) {
        const countryPlaceholders = parsedFilters.country
          .map(() => "?")
          .join(", ");
        whereClauses.push(`
    pc.country IN (${countryPlaceholders})
  `);
        filterParams.push(...parsedFilters.country);
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

        filterParams.push(minPrice, maxPrice);
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

        filterParams.push(...parsedFilters.class_of_feed);
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

        filterParams.push(...parsedFilters.age_of_dogs);
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

        filterParams.push(...parsedFilters.breed_of_dogs);
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

        filterParams.push(...parsedFilters.breed_sizes);
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

        filterParams.push(...parsedFilters.source_of_protein_in_feeds);
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

        filterParams.push(...parsedFilters.special_dietary_needs);
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

        filterParams.push(...parsedFilters.appointment_of_veterinary_diets);
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

        filterParams.push(...parsedFilters.type_of_canned_food);
      }

      // Type of Packaging
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

        filterParams.push(...parsedFilters.type_of_packaging);
      }

      const whereSQL = whereClauses.length
        ? " AND " + whereClauses.join(" AND ")
        : "";

      // console.log("whereSQL characteristics", whereSQL);
      // console.log("filterParams characteristics", filterParams);

      // Логи для дебагу
      // console.log("whereSQL:", whereSQL);
      // console.log("filterParams length:", filterParams.length);
      // console.log("filterParams:", filterParams);

      // Параметри для dataQuery — додаємо offset та limit
      const dataParams = [...filterParams, offset, limit];
      // console.log("dataParams length:", dataParams.length);
      // console.log("dataParams:", dataParams);

      const dataQuery = `
        SELECT
          pc.document_id,
          pc.title,
          pc.country,
          pc.promotion,
          pc.promotion_quantity,
          pc.product_url,
          pc.eco,
          pc.top_seller,
          pc.published_at,

          json_build_object(
            'document_id', ascat.document_id,
            'subcategory', ascat.subcategory,
            'href', ascat.href
          ) AS animal_sub_category,

          (
            SELECT json_agg(sc ORDER BY sc."inStock" DESC, sc."size" ASC)
            FROM (
              SELECT
                ps2.document_id,
                ps2.size,
                ps2.price,
                ps2.markdown,
                ps2.title,
                ps2.old_price AS "oldPrice",
                ps2.in_stock AS "inStock"
              FROM product_sub_cards ps2
              JOIN product_sub_cards_product_card_lnk lnk2 ON lnk2.product_sub_card_id = ps2.id
              WHERE lnk2.product_card_id = pc.id
            ) sc
          ) AS product_sub_cards,

          (
            SELECT json_agg(json_build_object(
              'url', f.url,
              'height', f.height,
              'width', f.width
            ) ORDER BY frm."order" ASC)
            FROM files_related_mph frm
            JOIN files f ON f.id = frm.file_id
            WHERE frm.related_id = pc.id
              AND frm.related_type = 'api::product-card.product-card'
              AND frm.field = 'images'
          ) AS images

        FROM product_cards pc

        LEFT JOIN product_cards_animal_sub_category_lnk lnk_cat ON lnk_cat.product_card_id = pc.id
        LEFT JOIN animal_sub_categories ascat ON ascat.id = lnk_cat.animal_sub_category_id

        LEFT JOIN product_sub_cards_product_card_lnk lnk ON lnk.product_card_id = pc.id
        LEFT JOIN product_sub_cards ps ON ps.id = lnk.product_sub_card_id

        WHERE pc.published_at IS NOT NULL
          ${whereSQL}

        GROUP BY
          pc.id,
          pc.document_id,
          pc.title,
          pc.country,
          pc.promotion,
          pc.promotion_quantity,
          pc.product_url,
          pc.eco,
          pc.top_seller,
          pc.published_at,
          ascat.document_id,
          ascat.subcategory,
          ascat.href

        ORDER BY ${sortSQL}
        OFFSET ?
        LIMIT ?
      `;

      const countQuery = `
    SELECT COUNT(DISTINCT pc.id) as total
    FROM product_cards pc
    LEFT JOIN product_sub_cards_product_card_lnk lnk ON lnk.product_card_id = pc.id
    LEFT JOIN product_sub_cards ps ON ps.id = lnk.product_sub_card_id
    WHERE ps.in_stock = true
      AND pc.published_at IS NOT NULL
      ${whereSQL}
  `;

      // Виконуємо countQuery з filterParams (без offset і limit)
      const countResult = await knex.raw(countQuery, filterParams);
      const total = Number(countResult.rows?.[0]?.total || 0);

      // Виконуємо dataQuery з dataParams (з offset і limit)
      const dataResult = await knex.raw(dataQuery, dataParams);
      const data = dataResult.rows;

      const categoryQuery = `
    SELECT id, href, subcategory
    FROM animal_sub_categories
    WHERE href = ?
    LIMIT 1
  `;
      const categoryResult = await knex.raw(categoryQuery, [categoryHref]);
      const categoryInfo = categoryResult.rows?.[0] || null;

      return {
        category: categoryInfo,
        data,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          pageCount: Math.ceil(total / Number(pageSize)),
          total,
        },
      };
    },
  })
);

//   const data = await knex("product_cards as pc")
//     .select(
//       "pc.id",
//       "pc.document_id",
//       "pc.title",
//       "pc.country",
//       "pc.promotion",
//       "pc.promotion_quantity",
//       "pc.product_url",
//       "pc.eco",
//       "pc.top_seller",
//       "pc.published_at"
//     )
//     .select(
//       knex.raw(`COALESCE(
//   json_agg(
//     json_build_object(
//       'document_id', ps.document_id,
//       'size', ps.size,
//       'price', ps.price,
//       'markdown', ps.markdown,
//       'oldPrice', ps.old_price,
//       'inStock', ps.in_stock
//     )
//   ) FILTER (WHERE ps.document_id IS NOT NULL), '[]'
// ) as sub_cards`)
//     )
//     .leftJoin(
//       "product_sub_cards_product_card_lnk as lnk",
//       "lnk.product_card_id",
//       "pc.id"
//     )
//     .leftJoin("product_sub_cards as ps", "ps.id", "lnk.product_sub_card_id")
//     .where("ps.in_stock", true)
//     .whereNotNull("pc.published_at")
//     .whereExists(function () {
//       this.select(1)
//         .from("product_cards_animal_sub_category_lnk as psc")
//         .join(
//           "animal_sub_categories as subcat",
//           "subcat.id",
//           "psc.animal_sub_category_id"
//         )
//         .whereRaw("psc.product_card_id = pc.id")
//         .andWhere("subcat.href", categoryHref);
//     })
//     .groupBy("pc.id")
//     .offset(offset)
//     .limit(limit);

// const [{ total }] = await knex("product_cards as pc")
//   .countDistinct("pc.id as total")
//   .leftJoin(
//     "product_sub_cards_product_card_lnk as lnk",
//     "lnk.product_card_id",
//     "pc.id"
//   )
//   .leftJoin("product_sub_cards as ps", "ps.id", "lnk.product_sub_card_id")
//   .where("ps.in_stock", true)
//   .whereNotNull("pc.published_at")
//   .whereExists(function () {
//     this.select(1)
//       .from("product_cards_animal_sub_category_lnk as psc")
//       .join(
//         "animal_sub_categories as subcat",
//         "subcat.id",
//         "psc.animal_sub_category_id"
//       )
//       .whereRaw("psc.product_card_id = pc.id")
//       .andWhere("subcat.href", categoryHref);
//   });

// const [categoryInfo] = await knex<Category>(
//   "animal_sub_categories as asc"
// )
//   .select("id", "href", "subcategory")
//   .where("href", categoryHref)
//   .limit(1);
