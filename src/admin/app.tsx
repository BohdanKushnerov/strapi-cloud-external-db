import type { StrapiApp } from "@strapi/strapi/admin";

export default {
  config: {
    locales: ["ru", "uk"],
    // Другие настройки...
  },

  register(app: StrapiApp) {
    // console.log(3, "✅ Admin register started");

    // // Регистрируем кастомное поле (даже если оно ничего не рендерит)
    // app.customFields.register({
    //   name: "characteristic-filter",
    //   type: "json", // или 'string', зависит от того, что вам нужно
    //   intlLabel: {
    //     id: "custom-fields.characteristic-filter.label",
    //     defaultMessage: "Characteristic Filter",
    //   },
    //   intlDescription: {
    //     id: "custom-fields.characteristic-filter.description",
    //     defaultMessage: "Фильтр для характеристик",
    //   },
    //   components: {
    //     Input: async () => {
    //       const component = await import(
    //         "./extensions/components/CharacteristicFilter"
    //       );
    //       return component;
    //     },
    //   },
    // });
  },

  bootstrap(app: StrapiApp) {
    console.log("✅ Admin bootstrap started");

    // Просто добавляем ссылку на скрипт
    const script = document.createElement("script");
    script.src = "/characteristic-filter.js";
    script.async = true;
    document.head.appendChild(script);

    console.log("✅ Script added in head");
  },
};
