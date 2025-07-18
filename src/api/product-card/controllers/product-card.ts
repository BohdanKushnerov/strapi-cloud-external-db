/**
 * product-card controller - Refactored version
 */

import { factories } from "@strapi/strapi";
import _ from "lodash";

// Конфигурация фильтров - централизованное управление
interface FilterConfig {
  table: string;
  linkTable: string;
  linkField: string;
  valueField: string;
  titleField: string;
  throughCharacteristics?: boolean;
}

const FILTER_CONFIG: Record<string, FilterConfig> = {
  brand: {
    table: "brands",
    linkTable: "product_cards_brand_lnk",
    linkField: "brand_id",
    valueField: "value",
    titleField: "title",
  },
  class_of_feed: {
    table: "class_of_feeds",
    linkTable: "characteristics_class_of_feed_lnk",
    linkField: "class_of_feed_id",
    valueField: "value",
    titleField: "title",
    throughCharacteristics: true,
  },
  age_of_dogs: {
    table: "age_of_dogs",
    linkTable: "age_of_dogs_characteristics_lnk",
    linkField: "age_of_dog_id",
    valueField: "value",
    titleField: "title",
    throughCharacteristics: true,
  },
  breed_of_dogs: {
    table: "breed_of_dogs",
    linkTable: "breed_of_dogs_characteristics_lnk",
    linkField: "breed_of_dog_id",
    valueField: "value",
    titleField: "title",
    throughCharacteristics: true,
  },
  breed_sizes: {
    table: "breed_sizes",
    linkTable: "breed_sizes_characteristics_lnk",
    linkField: "breed_size_id",
    valueField: "value",
    titleField: "title",
    throughCharacteristics: true,
  },
  source_of_protein_in_feeds: {
    table: "source_of_protein_in_feeds",
    linkTable: "source_of_protein_in_feeds_characteristics_lnk",
    linkField: "source_of_protein_in_feed_id",
    valueField: "value",
    titleField: "title",
    throughCharacteristics: true,
  },
  special_dietary_needs: {
    table: "special_dietary_needs",
    linkTable: "special_dietary_needs_characteristics_lnk",
    linkField: "special_dietary_need_id",
    valueField: "value",
    titleField: "title",
    throughCharacteristics: true,
  },
  appointment_of_veterinary_diets: {
    table: "appointment_of_veterinary_diets",
    linkTable: "appointment_of_veterinary_diets_characteristics_lnk",
    linkField: "appointment_of_veterinary_diet_id",
    valueField: "value",
    titleField: "title",
    throughCharacteristics: true,
  },
  type_of_packaging: {
    table: "type_of_packagings",
    linkTable: "characteristics_type_of_packaging_lnk",
    linkField: "type_of_packaging_id",
    valueField: "value",
    titleField: "title",
    throughCharacteristics: true,
  },
  type_of_canned_food: {
    table: "type_of_canned_foods",
    linkTable: "characteristics_type_of_canned_food_lnk",
    linkField: "type_of_canned_food_id",
    valueField: "value",
    titleField: "title",
    throughCharacteristics: true,
  },
  release_forms: {
    table: "release_forms",
    linkTable: "release_forms_characteristics_lnk",
    linkField: "release_form_id",
    valueField: "value",
    titleField: "title",
    throughCharacteristics: true,
  },
};

const SORT_MAP = {
  popular: "pc.created_at ASC",
  new: "pc.published_at DESC",
  cheap: "MIN(ps.price_for_sort_cheap) ASC",
  expensive: "MAX(ps.price_for_sort_expensive) DESC",
};

class FilterBuilder {
  private whereClauses: string[] = [];
  private params: any[] = [];

  constructor(
    private parsedFilters: Record<string, string[]>,
    private includeSubCategory: boolean = true
  ) {}

  addSubCategoryFilter(subCategory?: string) {
    if (this.includeSubCategory) {
      if (subCategory) {
        this.whereClauses.push(`
          EXISTS (
            SELECT 1
            FROM product_cards_animal_sub_category_lnk psc
            JOIN animal_sub_categories subcat ON subcat.id = psc.animal_sub_category_id
            WHERE psc.product_card_id = pc.id AND subcat.href = ?
          )
        `);
        this.params.push(subCategory);
      } else {
        this.whereClauses.push(`
          EXISTS (
            SELECT 1
            FROM product_cards_animal_sub_category_lnk psc
            WHERE psc.product_card_id = pc.id
          )
        `);
      }
    }
    return this; // Allow method chaining
  }

  addCountryFilter() {
    if (this.parsedFilters.country?.length) {
      const placeholders = this.parsedFilters.country.map(() => "?").join(", ");
      this.whereClauses.push(`pc.country IN (${placeholders})`);
      this.params.push(...this.parsedFilters.country);
    }
    return this;
  }

  addPriceFilter() {
    if (
      this.parsedFilters.price?.length === 2 &&
      this.parsedFilters.price[0] !== "" &&
      this.parsedFilters.price[1] !== ""
    ) {
      const [minPrice, maxPrice] = this.parsedFilters.price;
      this.whereClauses.push(`
        EXISTS (
          SELECT 1
          FROM product_sub_cards_product_card_lnk lnk
          JOIN product_sub_cards ps ON ps.id = lnk.product_sub_card_id
          WHERE lnk.product_card_id = pc.id
            AND ps.in_stock = true
            AND ps.price BETWEEN ? AND ?
        )
      `);
      this.params.push(minPrice, maxPrice);
    }
    return this;
  }

  addConfigurableFilters() {
    Object.entries(FILTER_CONFIG).forEach(([filterKey, config]) => {
      if (this.parsedFilters[filterKey]?.length) {
        this.addConfigurableFilter(
          filterKey,
          config,
          this.parsedFilters[filterKey]
        );
      }
    });
    return this;
  }

  private addConfigurableFilter(
    filterKey: string,
    config: FilterConfig,
    values: string[]
  ) {
    const placeholders = values.map(() => "?").join(", ");

    if (config.throughCharacteristics) {
      this.whereClauses.push(`
        EXISTS (
          SELECT 1
          FROM product_cards_characteristic_lnk cclnk
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN ${config.linkTable} lnk ON lnk.characteristic_id = c.id
          JOIN ${config.table} t ON t.id = lnk.${config.linkField}
          WHERE cclnk.product_card_id = pc.id AND t.${config.valueField} IN (${placeholders})
        )
      `);
    } else {
      this.whereClauses.push(`
        EXISTS (
          SELECT 1
          FROM ${config.linkTable} lnk
          JOIN ${config.table} t ON t.id = lnk.${config.linkField}
          WHERE lnk.product_card_id = pc.id AND t.${config.valueField} IN (${placeholders})
        )
      `);
    }

    this.params.push(...values);
  }

  build() {
    return {
      whereSQL:
        this.whereClauses.length > 0 ? this.whereClauses.join(" AND ") : "",
      params: this.params,
    };
  }

  getParams() {
    return this.params;
  }
}

class FacetQueryBuilder {
  constructor(
    private baseWhereSQL: string,
    private baseParams: any[]
  ) {}

  buildFacetQueries(): string {
    const queries = [
      this.buildCountryQuery(),
      this.buildPriceQueries(),
      ...this.buildConfigurableQueries(),
    ];

    return queries.join(" UNION ALL ");
  }

  private buildBrandQuery(): string {
    return `
      SELECT 
        b.title AS title,
        b.value AS value,
        COUNT(fp.id) AS count,
        'brand' AS group_by_type
      FROM filtered_products fp
      JOIN product_cards_brand_lnk pclnk ON pclnk.product_card_id = fp.id
      JOIN brands b ON b.id = pclnk.brand_id
      GROUP BY b.title, b.value
    `;
  }

  private buildCountryQuery(): string {
    return `
      SELECT 
        fp.country AS title,
        fp.country AS value,
        COUNT(fp.id) AS count,
        'country' AS group_by_type
      FROM filtered_products fp
      GROUP BY fp.country
    `;
  }

  private buildPriceQueries(): string {
    return `
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
    `;
  }

  private buildConfigurableQueries(): string[] {
    return Object.entries(FILTER_CONFIG).map(([filterKey, config]) => {
      const alias = config.table.substring(0, 3); // Short table alias

      if (config.throughCharacteristics) {
        return `
          SELECT 
            ${alias}.${config.titleField} AS title,
            ${alias}.${config.valueField} AS value,
            COUNT(DISTINCT fp.id) AS count,
            '${filterKey}' AS group_by_type
          FROM filtered_products fp
          JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = fp.id
          JOIN characteristics c ON c.id = cclnk.characteristic_id
          JOIN ${config.linkTable} lnk ON lnk.characteristic_id = c.id
          JOIN ${config.table} ${alias} ON ${alias}.id = lnk.${config.linkField}
          GROUP BY ${alias}.${config.titleField}, ${alias}.${config.valueField}
        `;
      } else {
        return `
          SELECT 
            ${alias}.${config.titleField} AS title,
            ${alias}.${config.valueField} AS value,
            COUNT(fp.id) AS count,
            '${filterKey}' AS group_by_type
          FROM filtered_products fp
          JOIN ${config.linkTable} lnk ON lnk.product_card_id = fp.id
          JOIN ${config.table} ${alias} ON ${alias}.id = lnk.${config.linkField}
          GROUP BY ${alias}.${config.titleField}, ${alias}.${config.valueField}
        `;
      }
    });
  }

  buildFullQuery(subCategory: string): string {
    return `
      WITH filtered_products AS (
        SELECT DISTINCT pc.id, pc.country
        FROM product_cards pc
        JOIN product_cards_characteristic_lnk cclnk ON cclnk.product_card_id = pc.id
        JOIN characteristics c ON c.id = cclnk.characteristic_id
        JOIN product_cards_animal_sub_category_lnk psc ON psc.product_card_id = pc.id
        JOIN animal_sub_categories subcat ON subcat.id = psc.animal_sub_category_id AND subcat.href = ?
        WHERE pc.published_at IS NOT NULL
        ${this.baseWhereSQL ? "AND " + this.baseWhereSQL : ""}
      )
      ${this.buildFacetQueries()}
    `;
  }
}

// Utility functions outside the controller
const parseFilters = (filter: string): Record<string, string[]> => {
  if (!filter || typeof filter !== "string") {
    return {};
  }

  try {
    return JSON.parse(decodeURIComponent(filter));
  } catch (e) {
    console.error("Invalid 'filter' param:", e);
    return {};
  }
};

const buildPaginationQueries = (whereSQL: string, sortSQL: string) => {
  const whereClause = whereSQL ? `AND ${whereSQL}` : "";

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
      ${whereClause}

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
    WHERE pc.published_at IS NOT NULL
      AND ps.in_stock = true
      ${whereClause}
  `;

  const categoryQuery = `
    SELECT id, href, subcategory
    FROM animal_sub_categories
    WHERE href = ?
    LIMIT 1
  `;

  return { dataQuery, countQuery, categoryQuery };
};

export default factories.createCoreController(
  "api::product-card.product-card",
  ({ strapi }) => ({
    async facets(ctx) {
      try {
        const { subCategory, filter } = ctx.request.query;

        if (!subCategory) {
          return ctx.badRequest("Missing 'subCategory' query param");
        }

        const parsedFilters = parseFilters(filter as string);

        const filterBuilder = new FilterBuilder(parsedFilters, false);
        filterBuilder.addCountryFilter();
        filterBuilder.addPriceFilter();
        filterBuilder.addConfigurableFilters();

        const { whereSQL, params } = filterBuilder.build();
        const queryParams = [subCategory, ...params];

        const facetBuilder = new FacetQueryBuilder(whereSQL, queryParams);
        const query = facetBuilder.buildFullQuery(subCategory as string);

        const result = await strapi.db.connection.raw(query, queryParams);
        ctx.body = result.rows;
      } catch (error) {
        console.error("Error in facets:", error);
        ctx.throw(
          500,
          error instanceof Error ? error.message : "Internal server error"
        );
      }
    },

    async customPagination(ctx) {
      try {
        const categoryHref = ctx.params.categoryHref ?? null;
        const { page = 1, pageSize = 10, sort = "popular", filter } = ctx.query;

        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);
        const sortSQL = SORT_MAP[sort as string] || SORT_MAP.popular;

        const parsedFilters = parseFilters(filter as string);

        const filterBuilder = new FilterBuilder(parsedFilters);
        filterBuilder.addSubCategoryFilter(categoryHref);
        filterBuilder.addCountryFilter();
        filterBuilder.addPriceFilter();
        filterBuilder.addConfigurableFilters();

        const { whereSQL } = filterBuilder.build();
        const filterParams = filterBuilder.getParams();

        const queries = buildPaginationQueries(whereSQL, sortSQL);

        // Prepare all parameters in the correct order
        const dataParams = [...filterParams, offset, limit];
        const countParams = [...filterParams];
        const categoryParams = categoryHref ? [categoryHref] : [];

        // Execute queries
        const [dataResult, countResult, categoryResult] = await Promise.all([
          strapi.db.connection.raw(queries.dataQuery, dataParams),
          strapi.db.connection.raw(queries.countQuery, countParams),
          categoryHref
            ? strapi.db.connection.raw(queries.categoryQuery, categoryParams)
            : Promise.resolve({ rows: [null] }),
        ]);

        const data = dataResult.rows;
        const total = Number(countResult.rows?.[0]?.total || 0);
        const categoryInfo = categoryResult?.rows?.[0] || null;

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
      } catch (error) {
        console.error("Error in customPagination:", error);
        ctx.throw(
          500,
          error instanceof Error ? error.message : "Internal server error"
        );
      }
    },
  })
);
