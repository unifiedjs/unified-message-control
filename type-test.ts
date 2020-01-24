/**
 * This file is purely for typechecking and does not produce code
 */

import control from 'unified-message-control'
import unified, {Attacher} from 'unified'
import {Node} from 'unist'

// $ExpectError
control({})

control({
  name: 'foo',
  marker: (n: Node) => null,
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

control({
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: false,
  // $ExpectError
  enable: ['rule-id']
})

control({
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: true,
  enable: ['rule-id']
})

control({
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: true,
  // $ExpectError
  disable: ['rule-id']
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

unified().use(control, {
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: false,
  // $ExpectError
  enable: ['rule-id']
})

unified().use(control, {
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: true,
  enable: ['rule-id']
})

unified().use(control, {
  name: 'foo',
  marker: (n: Node) => null,
  test: 'html',
  reset: true,
  // $ExpectError
  disable: ['rule-id']
})
