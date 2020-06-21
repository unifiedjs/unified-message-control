/**
 * This file is purely for typechecking and does not produce code
 */

/* eslint-disable-next-line import/no-extraneous-dependencies */
import * as control from 'unified-message-control'
import * as unified from 'unified'
import {Node} from 'unist'
import {HTML} from 'mdast'
import {Element} from 'hast'

// $ExpectError
control({})

control({
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html'
})

control({
  name: 'foo',
  marker: (n: Node) => ({
    name: 'foo',
    attributes: 'bar=false',
    parameters: {
      bar: false
    },
    node: {
      type: 'foo',
      value: 'bar=false'
    }
  }),
  test: 'foo'
})

control({
  name: 'foo',
  marker: (n: Element) => null,
  test: 'element'
})

control({
  name: 'foo',
  marker: (n: HTML) => null,
  test: 'html'
})

control({
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  known: ['rule-1', 'rule-2']
})

control({
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  sources: 'example'
})

control({
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  sources: ['one', 'two']
})

control({
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: false,
  disable: ['rule-id']
})

// prettier-ignore
control({
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: false, enable: ['rule-id'] // $ExpectError
})

control({
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: true,
  enable: ['rule-id']
})

// prettier-ignore
control({
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: true, disable: ['rule-id'] // $ExpectError
})

// $ExpectError
unified().use(control, {})

unified().use(control, {
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html'
})

unified().use(control, {
  name: 'foo',
  marker: (n: Node) => ({
    name: 'foo',
    attributes: 'bar=false',
    parameters: {
      bar: false
    },
    node: {
      type: 'foo',
      value: 'bar=false'
    }
  }),
  test: 'foo'
})

unified().use(control, {
  name: 'foo',
  marker: (n: Element) => null,
  test: 'element'
})

unified().use(control, {
  name: 'foo',
  marker: (n: HTML) => null,
  test: 'html'
})

unified().use(control, {
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  known: ['rule-1', 'rule-2']
})

unified().use(control, {
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  sources: 'example'
})

unified().use(control, {
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  sources: ['one', 'two']
})

unified().use(control, {
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: false,
  disable: ['rule-id']
})

// prettier-ignore
unified().use(control, {
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: false, enable: ['rule-id'] // $ExpectError
})

unified().use(control, {
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: true,
  enable: ['rule-id']
})

// prettier-ignore
unified().use(control, {
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: true, disable: ['rule-id'] // $ExpectError
})
