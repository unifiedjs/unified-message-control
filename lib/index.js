/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist').Point} Point
 *
 * @typedef {import('unist-util-is').Test} Test
 *
 * @typedef {import('vfile').VFile} VFile
 *
 * @typedef {import('vfile-message').VFileMessage} VFileMessage
 */

/**
 * @typedef Mark
 *   Toggle.
 * @property {Point | undefined} point
 *   Where to toggle; this is where a marker exists.
 * @property {boolean} state
 *   Whether to enable (`true`) or disable (`false`).
 *
 * @typedef Marker
 *   Comment marker.
 * @property {string} name
 *   Name of marker.
 * @property {string} attributes
 *   Value after name.
 * @property {Record<string, boolean | number | string>} parameters
 *   Parsed attributes.
 * @property {Node} node
 *   Reference to given node.
 *
 * @callback MarkerParser
 *   Parse a possible comment marker node to a Marker.
 * @param {Node} node
 *   Node to parse
 * @returns {Marker | null | undefined | void}
 *   Result.
 *
 * @typedef {OptionsWithReset | OptionsWithoutReset} Options
 *   Configuration.
 * @typedef {OptionsBaseFields & OptionsWithoutResetFields} OptionsWithoutReset
 *   Configuration w/ `reset`.
 * @typedef {OptionsBaseFields & OptionsWithResetFields} OptionsWithReset
 *   Configuration w/o `reset`.
 *
 * @typedef OptionsBaseFields
 *   Regular fields.
 * @property {string} name
 *   Name of markers that can control the message sources (required).
 *
 *   For example, `{name: 'alpha'}` controls `alpha` markers:
 *
 *   ```html
 *   <!--alpha ignore-->
 *   ```
 * @property {MarkerParser} marker
 *   Parse nodes to `Marker` objects (required).
 * @property {Test} [test]
 *   Test for possible markers (optional).
 * @property {Array<string> | null | undefined} [known]
 *   List of allowed `ruleId`s (default: `[]`).
 *
 *   When `known` is given, a warning is shown when unknown rules are
 *   controlled with comments.
 *
 *   For example, `{name: 'alpha', known: ['bravo']}` results in a warning
 *   (for `charlie`):
 *
 *   ```html
 *   <!--alpha ignore charlie-->
 *   ```
 * @property {Array<string> | string | null | undefined} [source]
 *   Sources that can be controlled with `name` markers (default: `name`).
 *
 *
 * @typedef OptionsWithResetFields
 *   Fields when `reset` is `true`.
 * @property {true} reset
 *   Whether to treat all messages as turned off initially.
 * @property {Array<string> | null | undefined} [enable]
 *   List of `ruleId`s to initially turn on (default: `[]`).
 *
 * @typedef OptionsWithoutResetFields
 *   Fields when `reset` is `false`.
 * @property {false | null | undefined} [reset]
 *   Whether to treat all messages as turned off initially.
 * @property {Array<string> | null | undefined} [disable]
 *   List of `ruleId`s to turn off (default: `[]`).
 */

import {ok as assert} from 'devlop'
import {visit} from 'unist-util-visit'
import {location} from 'vfile-location'

const own = {}.hasOwnProperty

/**
 * @param {Options} options
 *   Configuration (required).
 * @returns
 *   Transform.
 */
export default function messageControl(options) {
  if (!options || typeof options !== 'object' || !options.name) {
    throw new Error(
      'Expected `name` in `options`, got `' + (options || {}).name + '`'
    )
  }

  if (!options.marker) {
    throw new Error(
      'Expected `marker` in `options`, got `' + options.marker + '`'
    )
  }

  const enable = 'enable' in options && options.enable ? options.enable : []
  const disable = 'disable' in options && options.disable ? options.disable : []
  let reset = options.reset
  const sources =
    typeof options.source === 'string'
      ? [options.source]
      : options.source || [options.name]

  return transformer

  /**
   * @param {Node} tree
   *   Tree.
   * @param {VFile} file
   *   File.
   * @returns {undefined}
   *   Nothing.
   */
  function transformer(tree, file) {
    const toOffset = location(file).toOffset
    const initial = !reset
    const gaps = detectGaps(tree)
    /** @type {Record<string, Array<Mark>>} */
    const scope = {}
    /** @type {Array<Mark>} */
    const globals = []

    visit(tree, options.test, visitor)

    file.messages = file.messages.filter(function (m) {
      return filter(m)
    })

    /**
     * @param {Node} node
     *   Node to check.
     * @param {number | undefined} position
     *   Position of `node` in `parent`.
     * @param {Parent | undefined} parent
     *   Parent of `node`.
     * @returns {undefined}
     *   Nothing.
     */
    function visitor(node, position, parent) {
      const point = node.position && node.position.start
      const mark = options.marker(node)

      if (!point || !mark || mark.name !== options.name) {
        return
      }

      const ruleIds = mark.attributes.split(/\s+/g)
      const verb = ruleIds.shift()
      const fn =
        verb === 'enable'
          ? doEnable
          : verb === 'disable'
          ? doDisable
          : verb === 'ignore'
          ? doIgnore
          : undefined

      if (!fn) {
        file.fail(
          'Unknown keyword `' +
            verb +
            '`: expected ' +
            "`'enable'`, `'disable'`, or `'ignore'`",
          mark.node
        )
      }

      assert(verb, 'expected verb')

      const next =
        (parent && position !== undefined && parent.children[position + 1]) ||
        undefined
      const tail = next && next.position && next.position.end

      if (ruleIds.length === 0) {
        fn(point, undefined, tail)
      } else {
        // Apply to all rules.
        let index = -1

        while (++index < ruleIds.length) {
          const ruleId = ruleIds[index]

          if (isKnown(ruleId, verb, mark.node)) {
            fn(point, ruleId, tail)
          }
        }
      }
    }

    /**
     * @param {Point} point
     *   Where to toggle.
     * @param {string | undefined} ruleId
     *   Identifier if local, nothing if global.
     * @param {Point | undefined} tail
     *   Where to toggle back.
     * @returns {undefined}
     *   Nothing.
     */
    function doIgnore(point, ruleId, tail) {
      if (tail) {
        toggle(point, false, ruleId)
        toggle(tail, true, ruleId)
      }
    }

    /**
     * @param {Point} point
     *   Where to toggle.
     * @param {string | undefined} ruleId
     *   Identifier if local, nothing if global.
     * @returns {undefined}
     *   Nothing.
     */
    function doDisable(point, ruleId) {
      toggle(point, false, ruleId)
      if (!ruleId) reset = true
    }

    /**
     * @param {Point} point
     *   Where to toggle.
     * @param {string | undefined} ruleId
     *   Identifier if local, nothing if global.
     * @returns {undefined}
     *   Nothing.
     */
    function doEnable(point, ruleId) {
      toggle(point, true, ruleId)
      if (!ruleId) reset = false
    }

    /**
     * Whether to keep a message.
     *
     * @param {VFileMessage} message
     *   Message.
     * @returns {boolean}
     *   Whether to keep.
     */
    function filter(message) {
      let gapIndex = gaps.length

      // Keep messages from a different source.
      if (!message.source || !sources.includes(message.source)) {
        return true
      }

      // To do: stop?
      // We only ignore messages if they’re disabled, *not* when they’re not in
      // the document.
      if (!message.line) message.line = 1
      if (!message.column) message.column = 1

      // Check whether the warning is inside a gap.
      const offset = toOffset(message)
      // We just set line/column, so we always get an offset.
      assert(typeof offset === 'number')

      while (gapIndex--) {
        if (gaps[gapIndex][0] <= offset && gaps[gapIndex][1] > offset) {
          return false
        }
      }

      // Check whether allowed by specific and global states.
      return (
        (!message.ruleId || check(message, scope[message.ruleId], true)) &&
        check(message, globals, false)
      )
    }

    /**
     * Helper to check (and possibly warn) if a `ruleId` is not known.
     *
     * @param {string} ruleId
     *   Identifier.
     * @param {string} verb
     *   Action.
     * @param {Node} node
     *   Context.
     * @returns {boolean}
     *   Whether the rule is known.
     */
    function isKnown(ruleId, verb, node) {
      const result = options.known ? options.known.includes(ruleId) : true

      if (!result) {
        file.message(
          'Unknown rule: cannot ' + verb + " `'" + ruleId + "'`",
          node
        )
      }

      return result
    }

    /**
     * Get the latest state of a rule.
     *
     * When without `ruleId`, gets global state.
     *
     * @param {string | undefined} ruleId
     *   Identifier if local, nothing if global.
     * @returns {boolean}
     *   State.
     */
    function getState(ruleId) {
      const ranges = ruleId ? scope[ruleId] : globals

      if (ranges && ranges.length > 0) {
        return ranges[ranges.length - 1].state
      }

      return ruleId
        ? reset
          ? enable.includes(ruleId)
          : !disable.includes(ruleId)
        : !reset
    }

    /**
     * Toggle one or more rules.
     *
     * @param {Point | undefined} point
     *   Where to toggle.
     * @param {boolean} state
     *   Whether the rule (or all rules) are enabled/disabled.
     * @param {string | undefined} [ruleId]
     *   Toggle one rule or all rules.
     * @returns {undefined}
     *   Nothing.
     */
    function toggle(point, state, ruleId) {
      const markers = ruleId ? scope[ruleId] || (scope[ruleId] = []) : globals
      const current = getState(ruleId)

      if (current !== state) {
        markers.push({state, point})
      }

      // Toggle all known rules.
      if (!ruleId) {
        for (ruleId in scope) {
          if (own.call(scope, ruleId)) {
            toggle(point, state, ruleId)
          }
        }
      }
    }

    /**
     * Check all `ranges` for `message`.
     *
     * @param {VFileMessage} message
     *   Message.
     * @param {Array<Mark> | undefined} marks
     *   Marks.
     * @param {boolean} local
     *   Check local (`true`) or global.
     * @returns {boolean}
     *   Whether the rule (or all rules) are enabled/disabled.
     */
    function check(message, marks, local) {
      // If there is positional info on the message, find the last marker
      // before the message.
      if (message.line && message.column && marks && marks.length > 0) {
        let index = marks.length

        while (index--) {
          const mark = marks[index]

          if (
            mark.point &&
            (mark.point.line < message.line ||
              (mark.point.line === message.line &&
                mark.point.column <= message.column))
          ) {
            return mark.state === true
          }
        }
      }

      // Otherwise, there’s no positional info on the message, or the first
      // marker is after the message, so check the initial state.
      if (local) {
        assert(message.ruleId)
        return reset
          ? enable.includes(message.ruleId)
          : !disable.includes(message.ruleId)
      }

      return Boolean(initial || reset)
    }
  }
}

/**
 * Detect gaps in `tree`.
 *
 * @param {Node} tree
 *   Tree.
 * @returns {Array<[number, number]>}
 *   Gaps.
 */
function detectGaps(tree) {
  const end =
    tree && tree.position && tree.position.end && tree.position.end.offset
  let offset = 0
  let gap = false
  /** @type {Array<[number, number]>} */
  const gaps = []

  // Find all gaps.
  visit(tree, one)

  // This detects if the last node was the last node.
  // If not, there’s an extra gap between the last node and the end of the
  if (typeof end === 'number' && offset !== end) {
    update()
    update(end)
  }

  return gaps

  /**
   * @param {Node} node
   *   Node to check.
   * @returns {undefined}
   *   Nothing.
   */
  function one(node) {
    update(node.position && node.position.start && node.position.start.offset)

    if (!('children' in node)) {
      update(node.position && node.position.end && node.position.end.offset)
    }
  }

  /**
   * Detect a new position.
   *
   * @param {number | null | undefined} [latest]
   *   Latest offset.
   * @returns {undefined}
   *   Nothing.
   */
  function update(latest) {
    if (latest === null || latest === undefined) {
      gap = true
    } else if (offset < latest) {
      if (gap) {
        gaps.push([offset, latest])
        gap = false
      }

      offset = latest
    }
  }
}
