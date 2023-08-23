/**
 * @typedef {import('mdast').Root} Root
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {commentMarker} from 'mdast-comment-marker'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkToc from 'remark-toc'
import {unified} from 'unified'
import {VFile} from 'vfile'
import {messageControl} from './index.js'

/** @type {import('unified').Processor<Root, Root, Root, Root, 'string'>} */
// @ts-expect-error: to do: remove when remark is released.
const remark = unified().use(remarkParse).use(remarkStringify).freeze()

test('messageControl', async function (t) {
  /** @type {Root} */
  const node = {type: 'root', children: []}

  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('./index.js')).sort(), [
      'messageControl'
    ])
  })

  await t.test('should throw without `name`', async function () {
    assert.throws(function () {
      // @ts-expect-error: check how `options` missing is handled.
      messageControl(node)
    }, /Expected `options`/)
  })

  await t.test('should throw without file', async function () {
    assert.throws(function () {
      messageControl(
        node,
        // @ts-expect-error: check how `file` missing is handled.
        {marker() {}, name: 'foo'}
      )
    }, /Expected `file` in `options`/)
  })

  await t.test('should throw without marker', async function () {
    assert.throws(function () {
      messageControl(
        node,
        // @ts-expect-error: check how `marker` missing is handled.
        {file: new VFile()}
      )
    }, /Expected `marker` in `options`/)
  })

  await t.test('should throw without name', async function () {
    assert.throws(function () {
      messageControl(
        node,
        // @ts-expect-error: check how `name` missing is handled.
        {file: new VFile(), marker() {}}
      )
    }, /Expected `name` in `options`/)
  })

  await t.test('should *not* throw without test', async function () {
    assert.doesNotThrow(function () {
      remark()
        .use(function () {
          return function (tree, file) {
            messageControl(tree, {file, marker() {}, name: 'foo'})
          }
        })
        .freeze()
    })
  })

  await t.test('should “disable” a message', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            file.message('Error', tree.children[1], 'foo:bar')

            messageControl(tree, {
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html'
            })
          }
        }
      )
      .process(
        '<!--foo disable bar-->\n\nThis is a paragraph.',
        function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages, [])
        }
      )
  })

  await t.test(
    'should “disable” all message without `ruleId`s',
    async function () {
      remark()
        .use(
          /** @type {import('unified').Plugin<[], Root>} */
          function () {
            return function (tree, file) {
              file.message('Error', tree.children[1], 'foo:bar')

              messageControl(tree, {
                file,
                marker: commentMarker,
                name: 'foo',
                test: 'html'
              })
            }
          }
        )
        .process(
          '<!--foo disable-->\n\nThis is a paragraph.',
          function (error, file) {
            assert.equal(error, undefined)
            assert(file)
            assert.deepEqual(file.messages, [])
          }
        )
    }
  )

  await t.test('should support `reset`', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            file.message('Error', tree.children[0], 'foo:bar')
            file.message('Error', tree.children[2], 'foo:bar')

            messageControl(tree, {
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html',
              reset: true
            })
          }
        }
      )
      .process(
        [
          'This is a paragraph.',
          '',
          '<!--foo enable-->',
          '',
          'This is a paragraph.'
        ].join('\n'),
        function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), ['5:1-5:21: Error'])
        }
      )
  })

  await t.test('should enable with a marker, when `reset`', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            file.message('Error', tree.children[1], 'foo:bar')

            messageControl(tree, {
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html',
              reset: true
            })
          }
        }
      )
      .process(
        '<!--foo enable bar-->\n\nThis is a paragraph.',
        function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), ['3:1-3:21: Error'])
        }
      )
  })

  await t.test('should enable a message', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            file.message('Error', tree.children[1], 'foo:bar')
            file.message('Error', tree.children[3], 'foo:bar')

            messageControl(tree, {
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html'
            })
          }
        }
      )
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
        function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), ['7:1-7:21: Error'])
        }
      )
  })

  await t.test(
    'should enable all message without `ruleId`s',
    async function () {
      remark()
        .use(
          /** @type {import('unified').Plugin<[], Root>} */
          function () {
            return function (tree, file) {
              file.message('Error', tree.children[1], 'foo:bar')
              file.message('Error', tree.children[3], 'foo:bar')

              messageControl(tree, {
                file,
                marker: commentMarker,
                name: 'foo',
                test: 'html'
              })
            }
          }
        )
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
          function (error, file) {
            assert.equal(error, undefined)
            assert(file)
            assert.deepEqual(file.messages.map(String), ['7:1-7:21: Error'])
          }
        )
    }
  )

  await t.test('should ignore a message', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            file.message('Error', tree.children[1], 'foo:bar')
            file.message('Error', tree.children[2], 'foo:bar')

            messageControl(tree, {
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html'
            })
          }
        }
      )
      .process(
        [
          '<!--foo ignore bar-->',
          '',
          'This is a paragraph.',
          '',
          'This is a paragraph.'
        ].join('\n'),
        function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), ['5:1-5:21: Error'])
        }
      )
  })

  await t.test(
    'should ignore all message without `ruleId`s',
    async function () {
      remark()
        .use(
          /** @type {import('unified').Plugin<[], Root>} */
          function () {
            return function (tree, file) {
              file.message('Error', tree.children[1], 'foo:bar')
              file.message('Error', tree.children[2], 'foo:bar')

              messageControl(tree, {
                file,
                marker: commentMarker,
                name: 'foo',
                test: 'html'
              })
            }
          }
        )
        .process(
          [
            '<!--foo ignore-->',
            '',
            'This is a paragraph.',
            '',
            'This is a paragraph.'
          ].join('\n'),
          function (error, file) {
            assert.equal(error, undefined)
            assert(file)
            assert.deepEqual(file.messages.map(String), ['5:1-5:21: Error'])
          }
        )
    }
  )

  await t.test('should ignore multiple rules', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            file.message('Error', tree.children[1], 'foo:bar')
            file.message('Error', tree.children[1], 'foo:baz')

            messageControl(tree, {
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html'
            })
          }
        }
      )
      .process(
        '<!--foo ignore bar baz-->\n\nThis is a paragraph.',
        function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), [])
        }
      )
  })

  await t.test('should fail on invalid verbs', async function () {
    remark()
      .use(function () {
        return function (tree, file) {
          messageControl(tree, {
            file,
            marker: commentMarker,
            name: 'foo',
            test: 'html'
          })
        }
      })
      .process('<!--foo test-->', function (error) {
        assert.equal(
          String(error),
          '1:1-1:16: Unknown keyword `test`: ' +
            "expected `'enable'`, `'disable'`, or `'ignore'`"
        )
      })
  })

  await t.test('should ignore gaps', async function () {
    remark()
      // @ts-expect-error: to do: remove when `remark-toc` is released.
      .use(remarkToc)
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            file.message('Error', {line: 5, column: 1}, 'foo:bar')
            file.message('Error', {line: 7, column: 1}, 'foo:bar')

            messageControl(tree, {
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html'
            })
          }
        }
      )
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
        function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), ['7:1: Error'])
        }
      )
  })

  await t.test('should ignore final gaps', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            file.message('Error', {line: 5, column: 1}, 'foo:bar')
            file.message('Error', {line: 5, column: 1}, 'foo:bar')

            // Remove list.
            tree.children.pop()

            messageControl(tree, {
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html'
            })
          }
        }
      )
      .process(
        [
          '# README',
          '',
          '## Table of Contents',
          '',
          '*  [This is removed](#this-is-removed)'
        ].join('\n'),
        function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), [])
        }
      )
  })

  await t.test('should support empty documents', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            file.message('Error', undefined, 'foo:bar')

            messageControl(tree, {
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html'
            })
          }
        }
      )
      .process('', function (error, file) {
        assert.equal(error, undefined)
        assert(file)
        assert.deepEqual(file.messages.map(String), ['1:1: Error'])
      })
  })

  await t.test('should message at the end of the document', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            assert(tree.position)
            file.message('Error', tree.position.end, 'foo:bar')

            messageControl(tree, {
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html'
            })
          }
        }
      )
      .process('# README\n', function (error, file) {
        assert.equal(error, undefined)
        assert(file)
        assert.deepEqual(file.messages.map(String), ['2:1: Error'])
      })
  })

  await t.test('should message at the end of the document', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            const head = tree.children[1]
            assert(head)
            assert(head.position)
            file.message('Error', head.position.end, 'foo:bar')

            messageControl(tree, {
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html'
            })
          }
        }
      )
      .process('# README\n\n*   List', function (error, file) {
        assert.equal(error, undefined)
        assert(file)
        assert.deepEqual(file.messages.map(String), ['3:9: Error'])
      })
  })

  await t.test('should ignore double disables', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            file.message('Error', tree.children[1], 'foo:bar')
            file.message('Error', tree.children[3], 'foo:bar')

            messageControl(tree, {
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html'
            })
          }
        }
      )
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
        function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), [])
        }
      )
  })

  await t.test(
    'should not ignore messages without location information',
    async function () {
      remark()
        .use(
          /** @type {import('unified').Plugin<[], Root>} */
          function () {
            return function (tree, file) {
              file.message('Error', undefined, 'foo:bar')

              messageControl(tree, {
                file,
                marker: commentMarker,
                name: 'foo',
                test: 'html'
              })
            }
          }
        )
        .process('Foo', function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), ['1:1: Error'])
        })
    }
  )

  await t.test('should ignore non-markers', async function () {
    remark()
      .use(function () {
        return function (tree, file) {
          messageControl(tree, {
            file,
            marker: commentMarker,
            name: 'foo',
            test: 'html'
          })
        }
      })
      .process(
        '<!doctype html>\n\n<!--bar baz qux-->\n',
        function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), [])
        }
      )
  })

  await t.test(
    'should support a list of `known` values, and warn on unknowns',
    async function () {
      remark()
        .use(function () {
          return function (tree, file) {
            messageControl(tree, {
              file,
              known: ['known'],
              marker: commentMarker,
              name: 'foo',
              test: 'html'
            })
          }
        })
        .process(
          '<!--foo ignore known-->\n\n<!--foo ignore unknown-->',
          function (error, file) {
            assert.equal(error, undefined)
            assert(file)
            assert.deepEqual(file.messages.map(String), [
              "3:1-3:26: Cannot ignore `'unknown'`, it’s not known"
            ])
          }
        )
    }
  )

  await t.test(
    'should ignore by `source`, when given as a string',
    async function () {
      remark()
        .use(
          /** @type {import('unified').Plugin<[], Root>} */
          function () {
            return function (tree, file) {
              file.message('Error', tree.children[1], 'baz:bar')

              messageControl(tree, {
                file,
                marker: commentMarker,
                name: 'foo',
                source: 'baz',
                test: 'html'
              })
            }
          }
        )
        .process('<!--foo ignore bar-->\n\nFoo', function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), [])
        })
    }
  )

  await t.test(
    'should ignore by `source`, when given as an array',
    async function () {
      remark()
        .use(
          /** @type {import('unified').Plugin<[], Root>} */
          function () {
            return function (tree, file) {
              file.message('Error', tree.children[1], 'bravo:delta')
              file.message('Error', tree.children[3], 'charlie:echo')

              messageControl(tree, {
                file,
                marker: commentMarker,
                name: 'alpha',
                source: ['bravo', 'charlie'],
                test: 'html'
              })
            }
          }
        )
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
          function (error, file) {
            assert.equal(error, undefined)
            assert(file)
            assert.deepEqual(file.messages.map(String), [])
          }
        )
    }
  )

  await t.test('should support initial `disable`s', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            file.message('Error', tree.children[0], 'foo:bar')

            messageControl(tree, {
              disable: ['bar'],
              file,
              marker: commentMarker,
              name: 'foo',
              test: 'html'
            })
          }
        }
      )
      .process('This is a paragraph.', function (error, file) {
        assert.equal(error, undefined)
        assert(file)
        assert.deepEqual(file.messages.map(String), [])
      })
  })

  await t.test('should support initial `enable`s', async function () {
    remark()
      .use(
        /** @type {import('unified').Plugin<[], Root>} */
        function () {
          return function (tree, file) {
            file.message('Error', tree.children[0], 'foo:bar')

            messageControl(tree, {
              enable: ['bar'],
              file,
              marker: commentMarker,
              name: 'foo',
              reset: true,
              test: 'html'
            })
          }
        }
      )
      .process('This is a paragraph.', function (error, file) {
        assert.equal(error, undefined)
        assert(file)
        assert.deepEqual(file.messages.map(String), ['1:1-1:21: Error'])
      })
  })

  await t.test(
    'should disable messages at the start of a marker',
    async function () {
      remark()
        .use(
          /** @type {import('unified').Plugin<[], Root>} */
          function () {
            return function (tree, file) {
              file.message('Error', {line: 1, column: 1}, 'foo:bar')

              messageControl(tree, {
                file,
                marker: commentMarker,
                name: 'foo',
                test: 'html'
              })
            }
          }
        )
        .process('<!--foo disable bar-->\n', function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), [])
        })
    }
  )

  await t.test(
    'should enable messages at the start of a marker',
    async function () {
      remark()
        .use(
          /** @type {import('unified').Plugin<[], Root>} */
          function () {
            return function (tree, file) {
              file.message('Error', {line: 1, column: 1}, 'foo:bar')

              messageControl(tree, {
                file,
                marker: commentMarker,
                name: 'foo',
                reset: true,
                test: 'html'
              })
            }
          }
        )
        .process('<!--foo enable-->\n', function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), ['1:1: Error'])
        })
    }
  )

  await t.test(
    'should disable messages without positional info (at the start of a document)',
    async function () {
      remark()
        .use(
          /** @type {import('unified').Plugin<[], Root>} */
          function () {
            return function (tree, file) {
              file.message('Error', undefined, 'foo:bar')

              messageControl(tree, {
                file,
                marker: commentMarker,
                name: 'foo',
                test: 'html'
              })
            }
          }
        )
        .process('<!--foo disable bar-->\n', function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), [])
        })
    }
  )

  await t.test(
    'should enable messages without positional info (at the start of a document)',
    async function () {
      remark()
        .use(
          /** @type {import('unified').Plugin<[], Root>} */
          function () {
            return function (tree, file) {
              file.message('Error', undefined, 'foo:bar')

              messageControl(tree, {
                file,
                marker: commentMarker,
                name: 'foo',
                reset: true,
                test: 'html'
              })
            }
          }
        )
        .process('<!--foo enable-->\n', function (error, file) {
          assert.equal(error, undefined)
          assert(file)
          assert.deepEqual(file.messages.map(String), ['1:1: Error'])
        })
    }
  )
})
