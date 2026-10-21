(function () {
    var STORAGE_KEY = "site-lang";

    function currentLang() {
        var lang = document.documentElement.getAttribute("data-lang") || "ko";
        return lang === "en" ? "en" : "ko";
    }

    function applyLang(lang) {
        if (lang !== "en" && lang !== "ko") lang = "ko";
        document.documentElement.setAttribute("data-lang", lang);
        document.documentElement.setAttribute("lang", lang);
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {}

        var title = document.querySelector("title");
        if (title) {
            var next = title.getAttribute("data-title-" + lang);
            if (next) document.title = next;
        }

        document.querySelectorAll(".lang-btn").forEach(function (btn) {
            btn.classList.toggle("active", btn.getAttribute("data-set-lang") === lang);
        });

        if (typeof jQuery !== "undefined") {
            jQuery("[data-masonry]").each(function () {
                var $el = jQuery(this);
                if ($el.data("masonry")) {
                    $el.masonry("layout");
                }
            });
        }
    }

    document.addEventListener("click", function (event) {
        var btn = event.target.closest(".lang-btn");
        if (!btn) return;
        applyLang(btn.getAttribute("data-set-lang"));
    });

    applyLang(currentLang());
})();
