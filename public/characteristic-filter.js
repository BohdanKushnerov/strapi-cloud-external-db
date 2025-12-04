(async function () {
  const { HREF_CONFIG } = await import("./hrefConfig.js");

  let currentUrl = window.location.pathname;
  let titleObserver = null;
  let isFiltering = false;
  let searchStarted = false;

  const isTargetPage = () => {
    return window.location.pathname.includes(
      "/admin/content-manager/collection-types/api::characteristic.characteristic",
    );
  };

  console.log("Current URL:", window.location.pathname);

  const getProductTitleByInputName = () => {
    const titleInput = document.querySelector(
      'input[name="titleOfProductCard"]',
    );
    return titleInput ? titleInput.value : null;
  };

  async function findMyProductSubCategory(productTitle) {
    if (!productTitle) {
      console.log("❌ ProductTitle not found");
      return null;
    }

    console.log("🔍 ProductTitle:", productTitle);

    try {
      const url =
        "/api/animal-sub-categories?" +
        new URLSearchParams({
          "filters[product_cards][title][$eq]": productTitle,
          "populate[0]": "product_cards",
          "populate[1]": "animal_category",
        });

      const response = await fetch(url);
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const subCategory = data.data[0];
        console.log("✅ Find!");
        console.log("data.data", data.data);
        console.log("SubCategory:", subCategory.subcategory);
        return subCategory.href;
      } else {
        console.log("❌ SubCategory not found");
        return null;
      }
    } catch (error) {
      console.error("Error during finding:", error);
      return null;
    }
  }

  const getCharacteristicsArrayByHrefSubCategory = (href) => {
    return HREF_CONFIG[href];
  };

  const hideDivsByLabels = (labelsArray) => {
    if (isFiltering) {
      console.log("⏭️ Filtered, skip");
      return;
    }

    if (!isTargetPage()) {
      console.log("Not isTargetPage, skip");
      return;
    }

    console.log("🔧 filtering... (1 раз)");
    console.log("📋 Use array:", labelsArray);

    isFiltering = true;

    const labelsToKeep = new Set(labelsArray);
    const labels = document.querySelectorAll("label");

    labels.forEach((label) => {
      const directText = Array.from(label.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent.replace(/\s+/g, " ").trim())
        .join(" ");

      const textWithoutNumber = directText.replace(/\s*\(\d+\)\s*$/, "");

      if (!labelsToKeep.has(textWithoutNumber)) {
        const topDiv = label.closest("div");
        if (topDiv) {
          topDiv.style.display = "none";
        }
      }
    });
  };

  const startSearchAndFilter = async () => {
    if (searchStarted) {
      console.log("⏭️ searchStarted, skip");
      return;
    }

    const titleValue = getProductTitleByInputName();
    if (titleValue) {
      searchStarted = true;

      console.log("📝 Find name of product:", titleValue);

      if (titleObserver) {
        titleObserver.disconnect();
        titleObserver = null;
        console.log("👌 titleObserver disconnect");
      }

      const subCategoryHref = await findMyProductSubCategory(titleValue);
      const characteristicsArray =
        getCharacteristicsArrayByHrefSubCategory(subCategoryHref);
      if (characteristicsArray) hideDivsByLabels(characteristicsArray);
    }
  };

  const observeTitleField = () => {
    if (!isTargetPage()) return;

    console.log("👀 watch by titleOfProductCard...");

    titleObserver = new MutationObserver((mutations) => {
      const titleInput = document.querySelector(
        'input[name="titleOfProductCard"]',
      );

      // Check that field is exist, has value, and search not started
      if (titleInput && titleInput.value && !searchStarted) {
        console.log("✅ Field titleOfProductCard ");
        startSearchAndFilter();
      }
    });

    titleObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["value"],
    });

    if (!searchStarted) {
      startSearchAndFilter();
    }
  };

  const resetForNewPage = () => {
    console.log("🔄 Reset for new page");

    isFiltering = false;
    searchStarted = false;

    if (titleObserver) {
      titleObserver.disconnect();
      titleObserver = null;
    }

    if (isTargetPage()) {
      observeTitleField();
    }
  };

  resetForNewPage();

  // SPA navigation
  const urlObserver = new MutationObserver(() => {
    const newUrl = window.location.pathname;
    if (newUrl !== currentUrl) {
      currentUrl = newUrl;
      console.log("URL changed on:", newUrl);
      resetForNewPage();
    }
  });

  urlObserver.observe(document.querySelector("title") || document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // check history of browser
  window.addEventListener("popstate", () => {
    console.log("popstate event");
    resetForNewPage();
  });

  // intercept pushState и replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    console.log("pushState detected");
    resetForNewPage();
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    console.log("replaceState detected");
    resetForNewPage();
  };
})();
