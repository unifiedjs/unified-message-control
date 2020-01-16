import control from './';
import { Node } from 'unist';

const _: control.MessageControlOptions<Node> = {
    name: 'foo',
    marker: (n: Node) => null,
    test: 'html'
}