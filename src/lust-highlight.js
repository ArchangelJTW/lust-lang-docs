(function () {
  function registerLustLanguage(hljs) {
    var KEYWORDS =
      "local let mut const function return if then elseif else end while do for in break continue " +
      "struct enum trait impl as is and or not extern use module export pub priv weak ref pure unsafe " +
      "defer errdefer scoped effect handle with perform resume service case schema type typeof " +
      "test suite describe before_each after_each before_all after_all";

    var LITERALS = "true false nil self Self";

    var TYPES =
      "int float bool string usize unknown never " +
      "Array Map Table Queue Result Option Some None Ok Err " +
      "Task TaskInfo TaskStatus Scope Fiber Schema Regex BoundedRegex Weak " +
      "IndexError ToString Observable Observer Subscription " +
      "Effect Exit Cause InterruptReason Document LuaValue";

    var BUILT_INS =
      "print println tostring tonumber assert assert_eq assert_ne assert_almost_eq assert_matches " +
      "assert_success assert_fails assert_interrupted assert_dies error pcall ipairs pairs " +
      "task math array map table io os json jsonl msgpack csv regex sync time rx view std";

    var DOC_COMMENT = hljs.COMMENT("---(?!-)", "$", {
      contains: [
        {
          className: "doctag",
          begin: /@[a-zA-Z_][a-zA-Z0-9_]*/,
        },
        hljs.PHRASAL_WORDS_MODE,
      ],
    });

    var BLOCK_COMMENT = hljs.COMMENT("--\\[\\[", "\\]\\]", {
      contains: [],
    });

    var LINE_COMMENT = hljs.COMMENT("--", "$");

    var REGEX_LITERAL = {
      className: "regexp",
      variants: [
        {
          begin: /\bregex!"/,
          end: /"/,
          illegal: /\n/,
          contains: [hljs.BACKSLASH_ESCAPE],
        },
        {
          begin: /\bregex!'/,
          end: /'/,
          illegal: /\n/,
          contains: [hljs.BACKSLASH_ESCAPE],
        },
      ],
    };

    var STRINGS = {
      className: "string",
      variants: [
        hljs.QUOTE_STRING_MODE,
        hljs.APOS_STRING_MODE,
      ],
    };

    var ATTRIBUTE_OR_MODULE_PATH = {
      className: "meta",
      begin: /@[a-zA-Z_][a-zA-Z0-9_]*(?:\/[a-zA-Z0-9_-]+)*/,
    };

    var NUMBERS = {
      className: "number",
      variants: [
        { begin: /\b0[xX][0-9a-fA-F](?:_?[0-9a-fA-F])*\b/ },
        { begin: /\b0[bB][01](?:_?[01])*\b/ },
        { begin: /\b0[oO][0-7](?:_?[0-7])*\b/ },
        {
          begin:
            /\b\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?\b/,
        },
      ],
      relevance: 0,
    };

    var CONTEXTUAL_BUILTINS = [
      {
        className: "built_in",
        begin: /\bstring(?=\.[a-zA-Z_])/,
      },
      {
        className: "built_in",
        begin: /\btype(?=\s*\()/,
      },
      {
        className: "built_in",
        begin: /\btest(?=\.(?!skip\b|only\b|timeout\b)[a-zA-Z_])/,
      },
    ];

    var FUNCTION_DECL = {
      beginKeywords: "function",
      end: /[<\(\n]|$/,
      returnEnd: true,
      contains: [hljs.UNDERSCORE_TITLE_MODE],
    };

    var TYPE_DECL = {
      beginKeywords: "struct enum trait schema service module type",
      end: /[<:=(\{,\n]|$/,
      returnEnd: true,
      contains: [hljs.UNDERSCORE_TITLE_MODE],
    };

    var HASH_COMMENT = hljs.COMMENT("#", "$");

    var OPERATORS = {
      className: "operator",
      begin:
        /(\/\/=|\^\^=|<<=|>>=|\|>|->|=>|::|\/\/|\^\^|<<|>>|\+=|-=|\*=|\/=|%=|\^=|&=|\|=|==|!=|~=|<=|>=|\.\.|[+\-*/%^=<>&|~!?])/,
    };

    var PUNCTUATION = {
      className: "punctuation",
      begin: /[{}()\[\],.:;]/,
    };

    return {
      name: "Lust",
      disableAutodetect: true,
      keywords: {
        keyword: KEYWORDS,
        literal: LITERALS,
        type: TYPES,
        built_in: BUILT_INS,
      },
      contains: [
        hljs.SHEBANG(),
        BLOCK_COMMENT,
        DOC_COMMENT,
        LINE_COMMENT,
        HASH_COMMENT,
        REGEX_LITERAL,
        STRINGS,
        ATTRIBUTE_OR_MODULE_PATH,
        NUMBERS,
      ]
        .concat(CONTEXTUAL_BUILTINS)
        .concat([FUNCTION_DECL, TYPE_DECL, OPERATORS, PUNCTUATION]),
    };
  }

  function isLustCodeBlock(block) {
    if (!block || !block.className) {
      return false;
    }
    var classes = String(block.className).trim().split(/\s+/);
    for (var i = 0; i < classes.length; i++) {
      if (/^language-lust(?:$|[,;])/.test(classes[i])) {
        return true;
      }
    }
    return false;
  }

  function highlightLustCode(hljs, code) {
    var version = typeof hljs.versionString === "string" ? hljs.versionString : "";
    var major = parseInt(version.split(".")[0], 10);
    var preferV11 = !isNaN(major) && major >= 11;

    if (preferV11) {
      try {
        return hljs.highlight(code, { language: "lust", ignoreIllegals: true });
      } catch (_err) {
        return hljs.highlight("lust", code, true);
      }
    }

    try {
      return hljs.highlight("lust", code, true);
    } catch (_err) {
      return hljs.highlight(code, { language: "lust", ignoreIllegals: true });
    }
  }

  function runHighlight() {
    if (!window.hljs || typeof window.hljs.highlight !== "function") {
      return;
    }

    var candidates = document.querySelectorAll('pre code[class*="language-lust"]');
    if (!candidates.length) {
      return;
    }

    for (var i = 0; i < candidates.length; i++) {
      var block = candidates[i];
      if (!isLustCodeBlock(block) || block.getAttribute("data-lust-highlighted") === "1") {
        continue;
      }
      try {
        var result = highlightLustCode(window.hljs, block.textContent || "");
        block.innerHTML = result.value;
        block.classList.add("hljs");
        block.setAttribute("data-lust-highlighted", "1");
      } catch (err) {
        console.warn("Lust highlight retry failed:", err);
      }
    }
  }

  function ensureRegistered(hljs) {
    var alreadyRegistered = false;
    if (typeof hljs.getLanguage === "function") {
      alreadyRegistered = Boolean(hljs.getLanguage("lust"));
    } else if (typeof hljs.listLanguages === "function") {
      alreadyRegistered = hljs.listLanguages().indexOf("lust") !== -1;
    }

    if (!alreadyRegistered) {
      hljs.registerLanguage("lust", registerLustLanguage);
    }
  }

  function bootstrap() {
    if (!window.hljs || typeof window.hljs.registerLanguage !== "function") {
      setTimeout(bootstrap, 50);
      return;
    }

    try {
      ensureRegistered(window.hljs);
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
