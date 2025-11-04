(function () {
  function registerLustLanguage(hljs) {
    var KEYWORDS =
      "function local return struct enum impl if then elseif else for while do break continue and or not is extern unsafe task end in";
    var LITERALS = "true false nil";
    var TYPES =
      "int float bool string usize unknown Array Map Table Result Option Some None Ok Err";

    return {
      name: "Lust",
      disableAutodetect: true,
      keywords: {
        keyword: KEYWORDS,
        literal: LITERALS,
        type: TYPES,
        built_in: "println tostring task math",
      },
      contains: [
        hljs.COMMENT("--\\[\\[", "\\]\\]", { contains: [] }),
        hljs.COMMENT("--", "$"),
        {
          className: "string",
          variants: [
            hljs.QUOTE_STRING_MODE,
            hljs.APOS_STRING_MODE,
            { begin: "\\[\\[", end: "\\]\\]" },
          ],
        },
        {
          className: "number",
          variants: [
            { begin: "\\b0x[0-9a-fA-F]+\\b" },
            { begin: "\\b\\d+(?:\\.\\d+)?\\b" },
          ],
          relevance: 0,
        },
        {
          className: "built_in",
          begin:
            "\\b(?:task\\.(?:create|run|resume|yield|status|info)|Result|Option|Some|None|Ok|Err)\\b",
        },
        { className: "operator", begin: /(::|==|~=|<=|>=|\.\.|[#+\-*/%<>])/ },
        { className: "punctuation", begin: /[{}\[\](),.:;]/ },
      ],
    };
  }

  function runHighlight() {
    var blocks = document.querySelectorAll("pre code.language-lust");
    if (!blocks.length || !window.hljs || typeof window.hljs.highlight !== "function") {
      return;
    }

    blocks.forEach(function (block) {
      try {
        var result = window.hljs.highlight("lust", block.textContent, true);
        block.innerHTML = result.value;
        block.classList.add("hljs");
      } catch (err) {
        console.warn("Lust highlight retry failed:", err);
      }
    });
  }

  function bootstrap() {
    if (!window.hljs || typeof window.hljs.registerLanguage !== "function") {
      setTimeout(bootstrap, 50);
      return;
    }

    try {
      if (
        typeof window.hljs.listLanguages === "function" &&
        window.hljs.listLanguages().indexOf("lust") === -1
      ) {
        window.hljs.registerLanguage("lust", registerLustLanguage);
      }
    } catch (err) {
      console.warn("Lust language registration failed:", err);
    }

    if (!document.documentElement.hasAttribute("data-lust-highlight-hooked")) {
      document.documentElement.setAttribute("data-lust-highlight-hooked", "1");
      document.addEventListener("DOMContentLoaded", runHighlight);
    }

    if (document.readyState !== "loading") {
      runHighlight();
    }
  }

  bootstrap();
})();
