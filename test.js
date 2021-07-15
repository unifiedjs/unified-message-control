import test from 'tape'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkToc from 'remark-toc'
import {commentMarker} from 'mdast-comment-marker'
import messageControl from './index.js'

const remark = unified().use(remarkParse).use(remarkStringify).freeze()

test('messageControl()', (t) => {
  t.throws(
    () => {
      // @ts-expect-error: runtime.
      remark().use(messageControl).freeze()
    },
    /Expected `name` in `options`, got `undefined`/,
    'should throw without `name`'
  )

  t.throws(
    () => {
      // @ts-expect-error: runtime.
      remark().use(messageControl, {name: 'foo'}).freeze()
    },
    /Expected `marker` in `options`, got `undefined`/,
    'should throw without marker'
  )

  t.doesNotThrow(() => {
    remark()
      .use(messageControl, {name: 'foo', marker() {}})
      .freeze()
  }, 'should *not* throw without test')

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1], 'foo:bar')
        transformer(tree, file)
      }
    })
    .process(
      '<!--foo disable bar-->\n\nThis is a paragraph.',
      (error, file) => {
        t.deepEqual(
          [error, ...(file || {messages: []}).messages],
          [null],
          'should “disable” a message'
        )
      }
    )

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('<!--foo disable-->\n\nThis is a paragraph.', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages],
        [null],
        'should “disable” all message without `ruleId`s'
      )
    })

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        reset: true,
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[0], 'foo:bar')
        // @ts-expect-error: fine.
        file.message('Error', tree.children[2], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(
      [
        'This is a paragraph.',
        '',
        '<!--foo enable-->',
        '',
        'This is a paragraph.'
      ].join('\n'),
      (error, file) => {
        t.deepEqual(
          [error, ...(file || {messages: []}).messages.map((m) => String(m))],
          [null, '5:1-5:21: Error'],
          'should support `reset`'
        )
      }
    )

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        reset: true,
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('<!--foo enable bar-->\n\nThis is a paragraph.', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null, '3:1-3:21: Error'],
        'should enable with a marker, when `reset`'
      )
    })

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1], 'foo:bar')
        // @ts-expect-error: fine.
        file.message('Error', tree.children[3], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(
      [
        '<!--foo disable bar-->',
        '',
        'This is a paragraph.',
        '',
        '<!--foo enable bar-->',
        '',
        'This is a paragraph.'
      ].join('\n'),
      (error, file) => {
        t.deepEqual(
          [error, ...(file || {messages: []}).messages.map((m) => String(m))],
          [null, '7:1-7:21: Error'],
          'should enable a message'
        )
      }
    )

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1], 'foo:bar')
        // @ts-expect-error: fine.
        file.message('Error', tree.children[3], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(
      [
        '<!--foo disable bar-->',
        '',
        'This is a paragraph.',
        '',
        '<!--foo enable-->',
        '',
        'This is a paragraph.'
      ].join('\n'),
      (error, file) => {
        t.deepEqual(
          [error, ...(file || {messages: []}).messages.map((m) => String(m))],
          [null, '7:1-7:21: Error'],
          'should enable all message without `ruleId`s'
        )
      }
    )

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1], 'foo:bar')
        // @ts-expect-error: fine.
        file.message('Error', tree.children[2], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(
      [
        '<!--foo ignore bar-->',
        '',
        'This is a paragraph.',
        '',
        'This is a paragraph.'
      ].join('\n'),
      (error, file) => {
        t.deepEqual(
          [error, ...(file || {messages: []}).messages.map((m) => String(m))],
          [null, '5:1-5:21: Error'],
          'should ignore a message'
        )
      }
    )

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1], 'foo:bar')
        // @ts-expect-error: fine.
        file.message('Error', tree.children[2], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(
      [
        '<!--foo ignore-->',
        '',
        'This is a paragraph.',
        '',
        'This is a paragraph.'
      ].join('\n'),
      (error, file) => {
        t.deepEqual(
          [error, ...(file || {messages: []}).messages.map((m) => String(m))],
          [null, '5:1-5:21: Error'],
          'should ignore all message without `ruleId`s'
        )
      }
    )

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1], 'foo:bar')
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1], 'foo:baz')

        transformer(tree, file)
      }
    })
    .process(
      '<!--foo ignore bar baz-->\n\nThis is a paragraph.',
      (error, file) => {
        t.deepEqual(
          [error, ...(file || {messages: []}).messages.map((m) => String(m))],
          [null],
          'should ignore multiple rules'
        )
      }
    )

  remark()
    .use(() => {
      return messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })
    })
    .process('<!--foo test-->', (error) => {
      t.equal(
        String(error),
        '1:1-1:16: Unknown keyword `test`: ' +
          "expected `'enable'`, `'disable'`, or `'ignore'`",
        'should fail on invalid verbs'
      )
    })

  remark()
    .use(remarkToc)
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        file.message('Error', {line: 5, column: 1}, 'foo:bar')
        file.message('Error', {line: 7, column: 1}, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(
      [
        '# README',
        '',
        '## Table of Contents',
        '',
        '*  [Another Header](#another-header)',
        '',
        '## Another header'
      ].join('\n'),
      (error, file) => {
        t.deepEqual(
          [error, ...(file || {messages: []}).messages.map((m) => String(m))],
          [null, '7:1: Error'],
          'should ignore gaps'
        )
      }
    )

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        file.message('Error', {line: 5, column: 1}, 'foo:bar')
        file.message('Error', {line: 5, column: 1}, 'foo:bar')

        // Remove list.
        // @ts-expect-error: fine.
        tree.children.pop()

        transformer(tree, file)
      }
    })
    .process(
      [
        '# README',
        '',
        '## Table of Contents',
        '',
        '*  [This is removed](#this-is-removed)'
      ].join('\n'),
      (error, file) => {
        t.deepEqual(
          [error, ...(file || {messages: []}).messages.map((m) => String(m))],
          [null],
          'should ignore final gaps'
        )
      }
    )

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        file.message('Error', undefined, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null, '1:1: Error'],
        'should support empty documents'
      )
    })

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.position.end, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('# README\n', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null, '2:1: Error'],
        'should message at the end of the document'
      )
    })

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1].position.end, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('# README\n\n*   List', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null, '3:9: Error'],
        'should message at the end of the document'
      )
    })

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1], 'foo:bar')
        // @ts-expect-error: fine.
        file.message('Error', tree.children[3], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(
      [
        '<!--foo disable bar-->',
        '',
        'This is a paragraph.',
        '',
        '<!--foo disable bar-->',
        '',
        'This is a paragraph.'
      ].join('\n'),
      (error, file) => {
        t.deepEqual(
          [error, ...(file || {messages: []}).messages.map((m) => String(m))],
          [null],
          'should ignore double disables'
        )
      }
    )

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        file.message('Error', undefined, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('Foo', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null, '1:1: Error'],
        'should not ignore messages without location information'
      )
    })

  remark()
    .use(() => {
      return messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })
    })
    .process('<!doctype html>\n\n<!--bar baz qux-->\n', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null],
        'should ignore non-markers'
      )
    })

  remark()
    .use(() => {
      return messageControl({
        name: 'foo',
        known: ['known'],
        marker: commentMarker,
        test: 'html'
      })
    })
    .process(
      '<!--foo ignore known-->\n\n<!--foo ignore unknown-->',
      (error, file) => {
        t.deepEqual(
          [error, ...(file || {messages: []}).messages.map((m) => String(m))],
          [null, "3:1-3:26: Unknown rule: cannot ignore `'unknown'`"],
          'should support a list of `known` values, and warn on unknowns'
        )
      }
    )

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        source: 'baz',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1], 'baz:bar')

        transformer(tree, file)
      }
    })
    .process('<!--foo ignore bar-->\n\nFoo', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null],
        'should ignore by `source`, when given as a string'
      )
    })

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'alpha',
        source: ['bravo', 'charlie'],
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[1], 'bravo:delta')
        // @ts-expect-error: fine.
        file.message('Error', tree.children[3], 'charlie:echo')

        transformer(tree, file)
      }
    })
    .process(
      [
        '<!--alpha ignore delta-->',
        '',
        'Foxtrot',
        '',
        '<!--alpha ignore echo-->',
        '',
        'Golf'
      ].join('\n'),
      (error, file) => {
        t.deepEqual(
          [error, ...(file || {messages: []}).messages.map((m) => String(m))],
          [null],
          'should ignore by `source`, when given as an array'
        )
      }
    )

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        disable: ['bar'],
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[0], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('This is a paragraph.', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null],
        'should support initial `disable`s'
      )
    })

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        reset: true,
        enable: ['bar'],
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        // @ts-expect-error: fine.
        file.message('Error', tree.children[0], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('This is a paragraph.', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null, '1:1-1:21: Error'],
        'should support initial `enable`s'
      )
    })

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        file.message('Error', {line: 1, column: 1}, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('<!--foo disable bar-->\n', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null],
        'should disable messages at the start of a marker'
      )
    })

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html',
        reset: true
      })

      return function (tree, file) {
        file.message('Error', {line: 1, column: 1}, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('<!--foo enable-->\n', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null, '1:1: Error'],
        'should enable messages at the start of a marker'
      )
    })

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html'
      })

      return function (tree, file) {
        file.message('Error', undefined, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('<!--foo disable bar-->\n', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null],
        'should disable messages without positional info (at the start of a document)'
      )
    })

  remark()
    .use(() => {
      const transformer = messageControl({
        name: 'foo',
        marker: commentMarker,
        test: 'html',
        reset: true
      })

      return function (tree, file) {
        file.message('Error', undefined, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('<!--foo enable-->\n', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null, '1:1: Error'],
        'should enable messages without positional info (at the start of a document)'
      )
    })

  remark()
    .use(() => {
      return function (tree, file) {
        file.message('Error')
        // @ts-expect-error: fine.
        delete tree.children
        messageControl({name: 'foo', marker: commentMarker})(tree, file)
      }
    })
    .process('', (error, file) => {
      t.deepEqual(
        [error, ...(file || {messages: []}).messages.map((m) => String(m))],
        [null, '1:1: Error'],
        'should not fail when there are messages but no `children` on `tree`'
      )
    })

  t.end()
})
