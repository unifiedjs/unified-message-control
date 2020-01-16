import control from './';
import { Node } from 'unist';

const opts: control.MessageControlOptions<Node> = {
    name: 'foo',
    marker: (n: Node) => null,
    test: 'html'
}

const _ = control(opts)