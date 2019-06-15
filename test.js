'use strict'

var test = require('tape')
var remark = require('remark')
var toc = require('remark-toc')
var mdastMarker = require('mdast-comment-marker')
var control = require('.')

test('control()', function(t) {
  t.throws(
    function() {
      remark()
        .use(control)
        .freeze()
    },
    /Expected `name` in `options`, got `undefined`/,
    'should throw without `name`'
  )

  t.throws(
    function() {
      remark()
        .use(control, {name: 'foo'})
        .freeze()
    },
    /Expected `marker` in `options`, got `undefined`/,
    'should throw without marker'
  )

  t.doesNotThrow(function() {
    remark()
      .use(control, {name: 'foo', marker: function() {}})
      .freeze()
  }, 'should *not* throw without test')

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[1], 'foo:bar')
        transformer(tree, file)
      }
    })
    .process(
      ['<!--foo disable bar-->', '', 'This is a paragraph.'].join('\n'),
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages),
          [null],
          'should “disable” a message'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[1], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(
      ['<!--foo disable-->', '', 'This is a paragraph.'].join('\n'),
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages),
          [null],
          'should “disable” all message without `ruleId`s'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        reset: true,
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[0], 'foo:bar')
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
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null, '5:1-5:21: Error'],
          'should support `reset`'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        reset: true,
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[1], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(
      ['<!--foo enable bar-->', '', 'This is a paragraph.'].join('\n'),
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null, '3:1-3:21: Error'],
          'should enable with a marker, when `reset`'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[1], 'foo:bar')
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
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null, '7:1-7:21: Error'],
          'should enable a message'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[1], 'foo:bar')
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
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null, '7:1-7:21: Error'],
          'should enable all message without `ruleId`s'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[1], 'foo:bar')
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
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null, '5:1-5:21: Error'],
          'should ignore a message'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[1], 'foo:bar')
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
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null, '5:1-5:21: Error'],
          'should ignore all message without `ruleId`s'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[1], 'foo:bar')
        file.message('Error', tree.children[1], 'foo:baz')

        transformer(tree, file)
      }
    })
    .process(
      ['<!--foo ignore bar baz-->', '', 'This is a paragraph.'].join('\n'),
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null],
          'should ignore multiple rules'
        )
      }
    )

  remark()
    .use(function() {
      return control({name: 'foo', marker: mdastMarker, test: 'html'})
    })
    .process('<!--foo test-->', function(err) {
      t.equal(
        String(err),
        '1:1-1:16: Unknown keyword `test`: ' +
          "expected `'enable'`, `'disable'`, or `'ignore'`",
        'should fail on invalid verbs'
      )
    })

  remark()
    .use(toc)
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
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
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null, '7:1: Error'],
          'should ignore gaps'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', {line: 5, column: 1}, 'foo:bar')
        file.message('Error', {line: 5, column: 1}, 'foo:bar')

        // Remove list.
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
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null],
          'should ignore final gaps'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('', function(err, file) {
      t.deepEqual(
        [err].concat(file.messages.map(String)),
        [null, '1:1: Error'],
        'should support empty documents'
      )
    })

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.position.end, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(['# README', ''].join('\n'), function(err, file) {
      t.deepEqual(
        [err].concat(file.messages.map(String)),
        [null, '2:1: Error'],
        'should message at the end of the document'
      )
    })

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[1].position.end, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(['# README', '', '*   List'].join('\n'), function(err, file) {
      t.deepEqual(
        [err].concat(file.messages.map(String)),
        [null, '3:9: Error'],
        'should message at the end of the document'
      )
    })

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[1], 'foo:bar')
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
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null],
          'should ignore double disables'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(['Foo'].join('\n'), function(err, file) {
      t.deepEqual(
        [err].concat(file.messages.map(String)),
        [null, '1:1: Error'],
        'should not ignore messages without location information'
      )
    })

  remark()
    .use(function() {
      return control({name: 'foo', marker: mdastMarker, test: 'html'})
    })
    .process(
      ['<!doctype html>', '', '<!--bar baz qux-->', ''].join('\n'),
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null],
          'should ignore non-markers'
        )
      }
    )

  remark()
    .use(function() {
      return control({
        name: 'foo',
        known: ['known'],
        marker: mdastMarker,
        test: 'html'
      })
    })
    .process(
      ['<!--foo ignore known-->', '', '<!--foo ignore unknown-->'].join('\n'),
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null, "3:1-3:26: Unknown rule: cannot ignore `'unknown'`"],
          'should support a list of `known` values, and warn on unknowns'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        source: 'baz',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[1], 'baz:bar')

        transformer(tree, file)
      }
    })
    .process(['<!--foo ignore bar-->', '', 'Foo'].join('\n'), function(
      err,
      file
    ) {
      t.deepEqual(
        [err].concat(file.messages.map(String)),
        [null],
        'should ignore by `source`, when given as a string'
      )
    })

  remark()
    .use(function() {
      var transformer = control({
        name: 'alpha',
        source: ['bravo', 'charlie'],
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[1], 'bravo:delta')
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
      function(err, file) {
        t.deepEqual(
          [err].concat(file.messages.map(String)),
          [null],
          'should ignore by `source`, when given as an array'
        )
      }
    )

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        disable: ['bar'],
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[0], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(['This is a paragraph.'].join('\n'), function(err, file) {
      t.deepEqual(
        [err].concat(file.messages.map(String)),
        [null],
        'should support initial `disable`s'
      )
    })

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        reset: true,
        enable: ['bar'],
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', tree.children[0], 'foo:bar')

        transformer(tree, file)
      }
    })
    .process(['This is a paragraph.'].join('\n'), function(err, file) {
      t.deepEqual(
        [err].concat(file.messages.map(String)),
        [null, '1:1-1:21: Error'],
        'should support initial `enable`s'
      )
    })

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', {line: 1, column: 1}, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('<!--foo disable bar-->\n', function(err, file) {
      t.deepEqual(
        [err].concat(file.messages.map(String)),
        [null],
        'should disable messages at the start of a marker'
      )
    })

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html',
        reset: true
      })

      return function(tree, file) {
        file.message('Error', {line: 1, column: 1}, 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('<!--foo enable-->\n', function(err, file) {
      t.deepEqual(
        [err].concat(file.messages.map(String)),
        [null, '1:1: Error'],
        'should enable messages at the start of a marker'
      )
    })

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html'
      })

      return function(tree, file) {
        file.message('Error', 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('<!--foo disable bar-->\n', function(err, file) {
      t.deepEqual(
        [err].concat(file.messages.map(String)),
        [null],
        'should disable messages without positional info (at the start of a document)'
      )
    })

  remark()
    .use(function() {
      var transformer = control({
        name: 'foo',
        marker: mdastMarker,
        test: 'html',
        reset: true
      })

      return function(tree, file) {
        file.message('Error', 'foo:bar')

        transformer(tree, file)
      }
    })
    .process('<!--foo enable-->\n', function(err, file) {
      t.deepEqual(
        [err].concat(file.messages.map(String)),
        [null, '1:1: Error'],
        'should enable messages without positional info (at the start of a document)'
      )
    })

  t.end()
})
