const hljs = require("highlight.js");
const { marked } = require("marked");
const xss = require("xss");

const onTagAttr = (tag, name, value) => {
  if (tag === "link" && name === "rel")
    // Only allow link tags if they're intended for stylesheets.
    return value === "stylesheet" ? 'rel="stylesheet"' : "";
  if (tag === "input" && name === "type")
    // Allow checkboxes from `- [ ]`
    return value === "checkbox" ? 'type="checkbox"' : "";
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
  input: ["type"], // Allow checkbox inputs
};

// Enable custom classes & ids to assist with CSS
for (const key of Object.keys(whiteList)) whiteList[key].push("class", "id");

/** Safely render markdown. */
exports.render = (md) =>
  xss(
    marked(md, {
      highlight: (code, lang) =>
        lang && hljs.getLanguage(lang)
          ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
          : code,
      smartypants: true,
      smartLists: true,
    }),
    {
      onTagAttr,
      whiteList,
    }
  );

exports.toPlainText = (str) =>
  xss(str, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style"],
  });
