import location from 'vfile-location'
import visit from 'unist-util-visit'

const own = {}.hasOwnProperty

export function messageControl(options) {
  const settings = options || {}
  const enable = settings.enable || []
  const disable = settings.disable || []
  let sources = settings.source
  let reset = settings.reset

  if (!settings.name) {
    throw new Error('Expected `name` in `options`, got `' + settings.name + '`')
  }

  if (!settings.marker) {
    throw new Error(
      'Expected `marker` in `options`, got `' + settings.marker + '`'
    )
  }

  if (!sources) {
    sources = [settings.name]
  } else if (typeof sources === 'string') {
    sources = [sources]
  }

  return transformer

  function transformer(tree, file) {
    const toOffset = location(file).toOffset
    const initial = !reset
    const gaps = detectGaps(tree, file)
    const scope = {}
    const globals = []

    visit(tree, settings.test, visitor)

    file.messages = file.messages.filter((m) => filter(m))

    function visitor(node, position, parent) {
      const mark = settings.marker(node)

      if (!mark || mark.name !== settings.name) {
        return
      }

      const ruleIds = mark.attributes.split(/\s/g)
      const verb = ruleIds.shift()
      const pos = mark.node.position && mark.node.position.start
      const tail =
        parent.children[position + 1] &&
        parent.children[position + 1].position &&
        parent.children[position + 1].position.end
      let index = -1

      if (verb !== 'enable' && verb !== 'disable' && verb !== 'ignore') {
        file.fail(
          'Unknown keyword `' +
            verb +
            '`: expected ' +
            "`'enable'`, `'disable'`, or `'ignore'`",
          mark.node
        )
      }

      // Apply to all rules.
      if (ruleIds.length > 0) {
        while (++index < ruleIds.length) {
          const ruleId = ruleIds[index]

          if (isKnown(ruleId, verb, mark.node)) {
            toggle(pos, verb === 'enable', ruleId)

            if (verb === 'ignore') {
              toggle(tail, true, ruleId)
            }
          }
        }
      } else if (verb === 'ignore') {
        toggle(pos, false)
        toggle(tail, true)
      } else {
        toggle(pos, verb === 'enable')
        reset = verb !== 'enable'
      }
    }

    function filter(message) {
      let gapIndex = gaps.length

      // Keep messages from a different source.
      if (!message.source || !sources.includes(message.source)) {
        return true
      }

      // We only ignore messages if they‘re disabled, *not* when they’re not in
      // the document.
      if (!message.line) {
        message.line = 1
      }

      if (!message.column) {
        message.column = 1
      }

      // Check whether the warning is inside a gap.
      const pos = toOffset(message)

      while (gapIndex--) {
        if (gaps[gapIndex].start <= pos && gaps[gapIndex].end > pos) {
          return false
        }
      }

      // Check whether allowed by specific and global states.
      return (
        check(message, scope[message.ruleId], message.ruleId) &&
        check(message, globals)
      )
    }

    // Helper to check (and possibly warn) if a `ruleId` is unknown.
    function isKnown(ruleId, verb, pos) {
      const result = settings.known ? settings.known.includes(ruleId) : true

      if (!result) {
        file.message(
          'Unknown rule: cannot ' + verb + " `'" + ruleId + "'`",
          pos
        )
      }

      return result
    }

    // Get the latest state of a rule.
    // When without `ruleId`, gets global state.
    function getState(ruleId) {
      const ranges = ruleId ? scope[ruleId] : globals

      if (ranges && ranges.length > 0) {
        return ranges[ranges.length - 1].state
      }

      if (!ruleId) {
        return !reset
      }

      return reset ? enable.includes(ruleId) : !disable.includes(ruleId)
    }

    // Handle a rule.
    function toggle(pos, state, ruleId) {
      let markers = ruleId ? scope[ruleId] : globals

      if (!markers) {
        markers = []
        scope[ruleId] = markers
      }

      const previousState = getState(ruleId)

      if (state !== previousState) {
        markers.push({state, position: pos})
      }

      // Toggle all known rules.
      if (!ruleId) {
        for (ruleId in scope) {
          if (own.call(scope, ruleId)) {
            toggle(pos, state, ruleId)
          }
        }
      }
    }

    // Check all `ranges` for `message`.
    function check(message, ranges, ruleId) {
      // Check the state at the message’s position.
      let index = ranges ? ranges.length : 0

      while (index--) {
        if (
          ranges[index].position &&
          ranges[index].position.line &&
          ranges[index].position.column &&
          (ranges[index].position.line < message.line ||
            (ranges[index].position.line === message.line &&
              ranges[index].position.column <= message.column))
        ) {
          return ranges[index].state === true
        }
      }

      // The first marker ocurred after the first message, so we check the
      // initial state.
      if (!ruleId) {
        return initial || reset
      }

      return reset ? enable.includes(ruleId) : !disable.includes(ruleId)
    }
  }
}

// Detect gaps in `tree`.
function detectGaps(tree, file) {
  const children = tree.children || []
  const lastNode = children[children.length - 1]
  const gaps = []
  let offset = 0
  let gap

  // Find all gaps.
  visit(tree, one)

  // Get the end of the document.
  // This detects if the last node was the last node.
  // If not, there’s an extra gap between the last node and the end of the
  // document.
  if (
    lastNode &&
    lastNode.position &&
    lastNode.position.end &&
    offset === lastNode.position.end.offset &&
    file.toString().slice(offset).trim() !== ''
  ) {
    update()

    update(
      tree && tree.position && tree.position.end && tree.position.end.offset - 1
    )
  }

  return gaps

  function one(node) {
    update(node.position && node.position.start && node.position.start.offset)

    if (!node.children) {
      update(node.position && node.position.end && node.position.end.offset)
    }
  }

  // Detect a new position.
  function update(latest) {
    if (latest === null || latest === undefined) {
      gap = true
    } else if (offset < latest) {
      if (gap) {
        gaps.push({start: offset, end: latest})
        gap = null
      }

      offset = latest
    }
  }
}
