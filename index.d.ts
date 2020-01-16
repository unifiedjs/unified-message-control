import { Test } from 'unist-util-is';
import unist from 'unist';

type Null = undefined | null;

declare namespace messageControl {
    export interface Marker <N extends unist.Node> {
        /** name of marker */
        name: string
        /** value after name */
        attributes: string
        /** parsed attributes */
        parameters: Record<string,unknown>
        /** reference to given node */
        node: N
    }

    /** parse a possible comment marker node to a Marker */
    export interface MarkerFn<N extends unist.Node> {
        (node: N): Marker<N> | Null
    }

    interface MessageControlOptionsWithReset<T extends unist.Node> extends
        BaseMessageControlOptions<T> {

        // must be explicitly set to `true` because reset only defaults
        // to `false`.
        reset: true;
        disable?: string[];
        enable?: undefined;
    }


    interface MessageControlOptionsWithoutReset<T extends unist.Node>
        extends BaseMessageControlOptions<T> {

        reset?: false | Null;
        enable?: string[] | Null;
        disable?: undefined | Null;
    }

    interface BaseMessageControlOptions<T extends unist.Node> {
        /**
         * Name of markers that can control the message sources.
         *
         * For example. `{name: 'alpha'}` controls `alpha` markers:
         *
         * `<!--alpha ignore-->`
         */
        name: string;
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
        known?: string[] | Null
        /**
         * whether to treat all messages as turned off initially
         * @default false
         */
        reset?: boolean | Null
        /**
         * list of `ruleId`s to initially turn on if `reset: true`.
         */
        enable?: string[] | Null
        /** list of `ruleId`s to turn off if `reset: false` */
        disable?: string[] | Null
        /**
         * Sources that can be controlled with `name` markers.
         * @default MessageControlOptions.name
         */
        sources?: string | string[]
    }

    export type MessageControlOptions<T extends unist.Node> =
        MessageControlOptionsWithoutReset<T> |
        MessageControlOptionsWithReset<T>;
}

declare function messageControl<T extends unist.Node>(opts: messageControl.MessageControlOptions<T>): void
export = messageControl