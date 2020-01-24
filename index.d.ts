// TypeScript Version: 3.3

import {Node} from 'unist'
import {VFile} from 'vfile'
import {Transformer} from 'unified'
import {Test} from 'unist-util-is'

declare namespace messageControl {
  /**
   * A comment marker.
   */
  interface Marker<N extends Node> {
    /**
     * name of marker
     */
    name: string

    /**
     * value after name
     */
    attributes: string

    /**
     * parsed attributes
     */
    parameters: Record<string, unknown>

    /**
     * reference to given node
     */
    node: N
  }

  /**
   * parse a possible comment marker node to a Marker
   */
  type MarkerParser<N extends Node> = <N extends Node>(
    node: N
  ) => Marker<N> | null

  interface MessageControlOptionsWithReset<T extends Node>
    extends BaseMessageControlOptions<T> {
    /**
     * whether to treat all messages as turned off initially
     */
    reset: true

    /**
     * list of `ruleId`s to initially turn on.
     */
    enable?: string[]
  }

  interface MessageControlOptionsWithoutReset<T extends Node>
    extends BaseMessageControlOptions<T> {
    /**
     * whether to treat all messages as turned off initially
     */
    reset?: false

    /**
     * list of `ruleId`s to turn off
     */
    disable?: string[]
  }

  interface BaseMessageControlOptions<T extends Node> {
    /**
     * Name of markers that can control the message sources.
     *
     * For example. `{name: 'alpha'}` controls `alpha` markers:
     *
     * `<!--alpha ignore-->`
     */
    name: string

    /**
     * test for possible markers
     */
    test: Test<T>

    /**
     * parse a possible marker to a comment marker object (Marker)
     * if possible the marker isn't a marker, should return `null`.
     */
    marker: MarkerParser<T>

    /**
     * list of allowed `ruleId`s. When given a warning is shown
     * when someone tries to control an unknown rule.
     *
     * For example, `{name: 'alpha', known: ['bravo']}` results
     * in a warning if `charlie is configured:
     *
     * `<!--alpha ignore charlie-->
     */
    known?: string[]

    /**
     * Sources that can be controlled with `name` markers.
     *
     * @defaultValue `MessageControlOptions.name`
     */
    sources?: string | string[]
  }

  type MessageControlOptions<T extends Node> =
    | MessageControlOptionsWithoutReset<T>
    | MessageControlOptionsWithReset<T>
}

/**
 * Enable, disable, and ignore messages with unified.
 */
declare function messageControl(
  options?: messageControl.MessageControlOptions<Node>
): Transformer

export = messageControl
