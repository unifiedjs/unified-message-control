/**
 * This file is purely for typechecking and does not produce code
 */

import control from 'unified-message-control'
import {Node} from 'unist'

const opts: control.MessageControlOptions<Node> = {
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html'
}

control(opts)
