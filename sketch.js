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
    render_mode: 'rgb',
    hidden_nodes: [4, 4, 4, 4],
    octaves: 5,
    domain_warping: false,
    warping_amount: 2,
    palette_ramp: [
      { at: 0.0, rgb: [0.07, 0.11, 0.18] },
      { at: 0.25, rgb: [0.17, 0.33, 0.46] },
      { at: 0.5, rgb: [0.41, 0.61, 0.53] },
      { at: 0.75, rgb: [0.8, 0.72, 0.43] },
      { at: 1.0, rgb: [0.98, 0.91, 0.73] }
    ],
    noise_seed: Math.random(),
    chunk_size: 6
  };

  const buildNetwork = () => {
    const hiddenNodes = (Array.isArray(settings.hidden_nodes) ? settings.hidden_nodes : [4])
      .map((n) => Math.max(1, Math.round(n)));
    const outputSize = settings.render_mode === 'palette' ? 3 : 5;
    const structure = [2, ...hiddenNodes, outputSize];
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