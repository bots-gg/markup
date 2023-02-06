const hljs = require("highlight.js");
const { marked } = require("marked");
const { parseFragment, serialize } = require("parse5");
const xss = require("xss");
const {
  compile,
  serialize: cssSerialize,
  stringify,
  middleware,
} = require("stylis");

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

const escapeCSS = (text, urlTransform) => {
  return cssSerialize(
    compile(text),
    middleware([
      (elem) => {
        if (elem.type === "decl" && elem.children.startsWith("url(")) {
          const quote = ['"', "'"].includes(elem.children.charAt(4)) ? elem.children.charAt(4) : ")";
          const start = quote === ")" ? 4 : 5;
          const url = elem.children.slice(start, elem.children.indexOf(quote, start));
          const surround = quote === ")" ? "" : quote;
          elem.return = `${elem.props}:url(${surround}${urlTransform(
            url,
            "style"
          )}${surround})${elem.children.slice(elem.children.indexOf(quote, start) + 1 + (quote !== ")" ? 1 : 0))};`;
        }
      },
      stringify,
    ])
  )
}

const parseNode = (node, urlTransform) => {
  if (node.nodeName === "#text" && node.parentNode.nodeName === "style") {
    node.value = escapeCSS(node.value, urlTransform);
  }

  if (node.childNodes)
    node.childNodes.forEach((node) => parseNode(node, urlTransform));
};

/** Safely render markdown. */
exports.render = (md, urlTransform = undefined) => {
  if (!urlTransform) urlTransform = (url) => url;

  const closureOnTagAttr = (tag, name, value, isWhiteAttr) => {
    const original = onTagAttr(tag, name, value);
    if (original) return original;

    if (!isWhiteAttr) return undefined;

    if (["img", "audio", "video"].includes(tag) && name === "src")
      return urlTransform(value, tag)
        ? `src="${urlTransform(value, tag)}"`
        : "";

    if (tag === "link" && name === "href")
      return urlTransform(value, tag)
        ? `href="${urlTransform(value, tag)}"`
        : "";

    if (tag === "a" && name === "href")
      return urlTransform(value, tag)
        ? `href="${urlTransform(value, tag)}"`
        : "";
  };

  const tree = parseFragment(
    xss(
      marked(md, {
        highlight: (code, lang) =>
          lang && hljs.getLanguage(lang)
            ? hljs.highlight(code, { language: lang, ignoreIllegals: true })
                .value
            : code,
        smartypants: true,
        smartLists: true,
      }),
      {
        onTagAttr: closureOnTagAttr,
        whiteList,
      }
    )
  );

  tree.childNodes.forEach((node) => parseNode(node, urlTransform));

  return serialize(tree);
};

exports.escapeCSS = escapeCSS;

exports.toPlainText = (str) =>
  xss(str, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style"],
  })
    // Handle the main entities that will occur, cba pulling in an entire lib for all.
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&nbsp;", " ");
