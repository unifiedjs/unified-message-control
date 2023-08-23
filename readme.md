# unified-message-control

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[unified][] utility to enable, disable, and ignore messages.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`unified().use(messageControl, options)`](#unifiedusemessagecontrol-options)
    *   [Markers](#markers)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This is a lego block that is meant to be extended, such as is done by
[`remark-message-control`][remark-message-control], so that lint messages can be
controlled from content.

## When should I use this?

You can use this if you’re building an ecosystem like remark for some different
content type, and want to let authors control messages from that content.

## Install

This package is [ESM only][esm].
In Node.js (version 12.20+, 14.14+, 16.0+, or 18.0+), install with [npm][]:

```sh
npm install unified-message-control
```

In Deno with [`esm.sh`][esmsh]:

```js
import messageControl from 'https://esm.sh/unified-message-control@4'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import messageControl from 'https://esm.sh/unified-message-control@4?bundle'
</script>
```

## Use

Say our document `example.md` contains:

```markdown
<!--foo ignore-->

## Heading
```

…and our module `example.js` looks as follows:

```js
import {read} from 'to-vfile'
import {reporter} from 'vfile-reporter'
import {commentMarker} from 'mdast-comment-marker'
import {unified} from 'unified'
import messageControl from 'unified-message-control'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'

const file = await read('example.md')

await unified()
  .use(remarkParse)
  .use(remarkStringify)
  .use(function () {
    return function (tree, file) {
      file.message('Whoops!', tree.children[1], 'foo:thing')
    }
  })
  .use(messageControl, {
    marker: commentMarker,
    name: 'foo',
    test: 'html'
  })
  .process(file)

console.error(reporter(file))
```

…now running `node example.js` yields:

```markdown
example.md: no issues found
```

## API

This package exports no identifiers.
The default export is `messageControl`.

### `unified().use(messageControl, options)`

Let comment markers control messages from certain sources.

##### `options`

Configuration.

###### `options.name`

Name of markers that can control the message sources (`string`).

For example, `{name: 'alpha'}` controls `alpha` markers:

```markdown
<!--alpha ignore-->
```

###### `options.test`

Test for possible markers (`Function`, `string`, `Object`, or `Array<Test>`).
See [`unist-util-is`][test].

###### `options.marker`

Parse a possible marker to a [comment marker object][marker] (`Function`).
If the possible marker actually isn’t a marker, should return `undefined`.

###### `options.known`

List of allowed `ruleId`s (`Array<string>`, optional).
When given, a warning is shown when someone tries to control an unknown rule.

For example, `{known: ['bravo'], name: 'alpha'}` results in a warning if
`charlie` is configured:

```markdown
<!--alpha ignore charlie-->
```

###### `options.reset`

Whether to treat all messages as turned off initially (`boolean`, default:
`false`).

###### `options.enable`

List of `ruleId`s to initially turn on if `reset: true`
(`Array<string>`, optional).
By default (`reset: false`), all rules are turned on.

###### `options.disable`

List of `ruleId`s to turn on if `reset: false` (`Array<string>`, optional).

###### `options.sources`

Sources that can be controlled with `name` markers (`string` or
`Array<string>`, default: `options.name`)

### Markers

###### `disable`

The **disable** keyword turns off all messages of the given rule identifiers.
When without identifiers, all messages are turned off.

For example, to turn off certain messages:

```markdown
<!--lint disable list-item-bullet-indent strong-marker-->

*   **foo**

A paragraph, and now another list.

  * __bar__
```

###### `enable`

The **enable** keyword turns on all messages of the given rule identifiers.
When without identifiers, all messages are turned on.

For example, to enable certain messages:

```markdown
<!--lint enable strong-marker-->

**foo** and __bar__.
```

###### `ignore`

The **ignore** keyword turns off all messages of the given `ruleId`s occurring
in the following node.
When without `ruleId`s, all messages are ignored.

After the end of the following node, messages are turned on again.

For example, to turn off certain messages for the next node:

```markdown
<!--lint ignore list-item-bullet-indent strong-marker-->

*   **foo**
    * __bar__
```

## Types

This package is fully typed with [TypeScript][].
It exports the additional types `Marker`, `MarkerParser`, and `Options`.

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, 16.0+, and 18.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Contribute

See [`contributing.md`][contributing] in [`unifiedjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/unifiedjs/unified-message-control/workflows/main/badge.svg

[build]: https://github.com/unifiedjs/unified-message-control/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/unifiedjs/unified-message-control.svg

[coverage]: https://codecov.io/github/unifiedjs/unified-message-control

[downloads-badge]: https://img.shields.io/npm/dm/unified-message-control.svg

[downloads]: https://www.npmjs.com/package/unified-message-control

[size-badge]: https://img.shields.io/bundlephobia/minzip/unified-message-control.svg

[size]: https://bundlephobia.com/result?p=unified-message-control

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/unifiedjs/unified/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[health]: https://github.com/unifiedjs/.github

[contributing]: https://github.com/unifiedjs/.github/blob/main/contributing.md

[support]: https://github.com/unifiedjs/.github/blob/main/support.md

[coc]: https://github.com/unifiedjs/.github/blob/main/ncode-of-conduct.md

[license]: license

[author]: https://wooorm.com

[marker]: https://github.com/syntax-tree/mdast-comment-marker#marker

[unified]: https://github.com/unifiedjs/unified

[test]: https://github.com/syntax-tree/unist-util-is#api

[remark-message-control]: https://github.com/remarkjs/remark-message-control
