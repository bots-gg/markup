# markup

> Unified markdown handling & XSS fixer for bots.gg

## Install

```
npm i @bots-gg/markup
```

## Usage

Main usage

```js
const { render } = require("@bots-gg/markup");

const html = render("*I'm the best!*");
// ...
```

Intended server usage with extra injections

```js
const { renderWithAdditions } = require("@bots-gg/markup");

const html = renderWithAdditions("*I'm the best!*");
// ...
```
