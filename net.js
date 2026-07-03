import { activators, sin } from './activators.js';

const makeNode = (numWeights) => ({
  weights: Array.from({ length: numWeights }, () => 2 * Math.random() - 1),
  bias: 2 * Math.random() - 1,
  value: 0,
  acfunc: activators.length ? activators[(Math.random() * activators.length) | 0] : sin
});

const makeLayer = (numNodes, numWeights) =>
  Array.from({ length: numNodes }, () => makeNode(numWeights));

export function Net(...layers) {
  const brain = [];
  const build = (structure) => {
    const withOutputSizes = [...structure, 0];
    brain.length = 0;
    for (let l = 0; l < withOutputSizes.length - 1; l++) {
      brain.push(makeLayer(withOutputSizes[l], withOutputSizes[l + 1]));
    }
  };

  build(layers);

  return {
    brain,
    init(...Ls) {
      build(Ls);
      return this;
    },
    compute(...inputs) {
      for (let i = 0; i < inputs.length && i < brain[0].length; i++) {
        brain[0][i].value = inputs[i];
      }

      for (let l = 1; l < brain.length; l++) {
        for (let n = 0; n < brain[l].length; n++) {
          let value = brain[l][n].bias;
          for (let p = 0; p < brain[l - 1].length; p++) {
            value += brain[l - 1][p].value * brain[l - 1][p].weights[n];
          }
          brain[l][n].value = brain[l][n].acfunc(value);
        }
      }

      return brain[brain.length - 1].map((node) => node.value);
    },
    forward(...inputs) {
      return this.compute(...inputs);
    }
  };
}