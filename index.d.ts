// TypeScript Version: 3.7

import {Test} from 'unist-util-is'
import * as unist from 'unist'

type Nullish = undefined | null

declare namespace messageControl {
  /** A comment marker. */
  interface Marker<N extends unist.Node> {
    /** name of marker */
    name: string
    /** value after name */
    attributes: string
    /** parsed attributes */
    parameters: Record<string, unknown>
    /** reference to given node */
    node: N
  }

  /** parse a possible comment marker node to a Marker */
  interface MarkerFn<N extends unist.Node> {
    (node: N): Marker<N> | Nullish
  }

  interface MessageControlOptionsWithReset<T extends unist.Node>
    extends BaseMessageControlOptions<T> {
    // must be explicitly set to `true` because reset only defaults
    // to `false`.
    reset: true
    disable?: string[]
    enable?: unknown
  }

  interface MessageControlOptionsWithoutReset<T extends unist.Node>
    extends BaseMessageControlOptions<T> {
    reset?: false | Nullish

    enable?: string[] | Nullish
    disable?: unknown
  }

  interface BaseMessageControlOptions<T extends unist.Node> {
    /**
     * Name of markers that can control the message sources.
     *
     * For example. `{name: 'alpha'}` controls `alpha` markers:
     *
     * `<!--alpha ignore-->`
     */
    name: string
    /** test for possible markers */
    test: Test<T>
    /**
     * parse a possible marker to a comment marker obejct (Marker)
     * if possible the marker isn't a marker, should return `null`.
     */
    marker: MarkerFn<T>
    /**
     * list of allowed `ruleId`s. When given a warning is shown
     * when someone tries to control an unknown rule.
     *
     * For example, `{name: 'alpha', known: ['bravo']}` results
     * in a warning if `charlie is configured:
     *
     * `<!--alpha ignore charlie-->
     */
    known?: string[] | Nullish
    /**
     * whether to treat all messages as turned off initially
     * defeaults to false.
     */
    reset?: boolean | Nullish
    /**
     * list of `ruleId`s to initially turn on if `reset: true`.
     */
    enable?: string[] | Nullish | unknown
    /** list of `ruleId`s to turn off if `reset: false` */
    disable?: string[] | Nullish | unknown
    /**
     * Sources that can be controlled with `name` markers.
     * defaults to MessageControlOptions.name
     */
    sources?: string | string[]
  }

  type MessageControlOptions<T extends unist.Node> =
    | MessageControlOptionsWithoutReset<T>
    | MessageControlOptionsWithReset<T>
}

// this tslint rule makes no sense to me...
// if T was any we'd essentially have *zero* typechecking
// on any Node which is clearly *not* what we want

declare function messageControl<T extends unist.Node>(
  // tslint:disable-next-line:no-unnecessary-generics
  opts: messageControl.MessageControlOptions<T>
): void

export = messageControl
