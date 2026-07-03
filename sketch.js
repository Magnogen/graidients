import { Net } from './net.js';
import { runRenderer } from './renderer.js';
import { bindUI } from './ui.js';

on('load', async () => {
  const c = $('canvas#render');
  const ctx = c.getContext('2d');
  c.width = c.height = 256;

  let settings = {
    scale: 3,
    res: 8,
    get resolution() { return this.res; },
    set resolution(v) { this.res = v; resize(2 ** v); return v; },
    hidden_nodes: [4, 4, 4, 4],
    domain_warping: false,
    warping_amount: 2,
    noise_seed: Math.random(),
    chunk_size: 6
  };

  const buildNetwork = () => {
    const hiddenNodes = (Array.isArray(settings.hidden_nodes) ? settings.hidden_nodes : [4])
      .map((n) => Math.max(1, Math.round(n)));
    const structure = [2, ...hiddenNodes, 5];
    return Net(...structure);
  };

  let network = buildNetwork();

  const renderState = {
    needsRefresh: true,
    restartRender: false
  };

  function resize(size) {
    c.width = c.height = size;
    renderState.needsRefresh = true;
  }

  bindUI({
    canvas: c,
    settings,
    renderState,
    regenerate: () => {
      network = buildNetwork();
    }
  });

  await runRenderer({
    canvas: c,
    ctx,
    settings,
    getNetwork: () => network,
    state: renderState
  });
});