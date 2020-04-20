const marked = require("marked");
const hljs = require("highlight.js");
const xss = require("xss");

// Only allow link tags if they're intended for stylesheets.
const onTagAttr = (tag, name, value) => {
  if (tag === "link" && name === "rel")
    return value === "stylesheet" ? 'rel="stylesheet"' : "";
};

// Tags to inject before & after body content
const additions = {
  prepend: [
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.1/styles/solarized-dark.min.css">',
  ],
  append: [],
};

const whiteList = {
  ...xss.whiteList,
  // Allow marquees
  marquee: [
    "behavior",
    "direction",
    "hspace",
    "loop",
    "scrollamount",
    "scrolldelay",
    "truespeed",
    "vspace",
  ],
  style: [], // Allow plain style tags
  link: ["rel", "href"], // Allow link tags for external stylesheets
};

// Enable custom classes & ids to assist with CSS
for (const key of Object.keys(whiteList)) whiteList[key].push("class", "id");

/** Safely render markdown. */
exports.render = (md) =>
  xss(
    marked(md, {
      highlight: (code, lang) =>
        lang ? hljs.highlight(lang, code, true).value : code,
      smartypants: true,
      smartLists: true,
    }),
    {
      onTagAttr,
      whiteList,
    }
  );

/** Safely render markdown with injected additions. */
exports.renderWithAdditions = (md) =>
  [...additions.prepend, exports.render(md), ...additions.append].join("\n");
