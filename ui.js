import { activators, activator_options } from './activators.js';

export function bindUI({ canvas, settings, renderState, regenerate }) {
  if (!Array.isArray(settings.hidden_nodes) || settings.hidden_nodes.length === 0) {
    settings.hidden_nodes = [4];
  }

  const minNodesPerLayer = 1;
  const maxNodesPerLayer = 64;
  const minLayers = 1;
  const maxLayers = 8;
  const layerEditor = document.getElementById('network_layers_editor');
  const addLayerButton = document.getElementById('add_layer');
  const removeLayerButton = document.getElementById('remove_layer');
  const architecturePreview = document.getElementById('network_architecture_preview');

  const normalizeArchitecture = () => {
    settings.hidden_nodes = settings.hidden_nodes
      .map((n) => Math.max(minNodesPerLayer, Math.min(maxNodesPerLayer, Math.round(n))));
    if (settings.hidden_nodes.length < minLayers) settings.hidden_nodes = [4];
    if (settings.hidden_nodes.length > maxLayers) settings.hidden_nodes = settings.hidden_nodes.slice(0, maxLayers);
  };

  const renderArchitectureEditor = () => {
    if (!layerEditor) return;
    layerEditor.innerHTML = '';
    settings.hidden_nodes.forEach((nodes, i) => {
      const row = document.createElement('div');
      row.classList.add('network-layer');

      const label = document.createElement('span');
      label.textContent = `Layer ${i + 1}`;

      const dec = document.createElement('button');
      dec.type = 'button';
      dec.textContent = '--';
      dec.on('click', () => {
        settings.hidden_nodes[i] = Math.max(minNodesPerLayer, settings.hidden_nodes[i] - 1);
        normalizeArchitecture();
        renderArchitectureEditor();
        updateArchitecturePreview();
        regenerate();
        renderState.needsRefresh = true;
      });

      const value = document.createElement('span');
      value.classList.add('network-layer-value');
      value.textContent = `${nodes} nodes`;

      const inc = document.createElement('button');
      inc.type = 'button';
      inc.textContent = '++';
      inc.on('click', () => {
        settings.hidden_nodes[i] = Math.min(maxNodesPerLayer, settings.hidden_nodes[i] + 1);
        normalizeArchitecture();
        renderArchitectureEditor();
        updateArchitecturePreview();
        regenerate();
        renderState.needsRefresh = true;
      });

      row.append(label, dec, value, inc);
      layerEditor.append(row);
    });
  };

  const updateArchitecturePreview = () => {
    normalizeArchitecture();
    const shape = ['inputs', ...settings.hidden_nodes, 'outputs'];
    architecturePreview.textContent = shape.join(' > ');
  };

  if (addLayerButton) {
    addLayerButton.on('click', () => {
      if (settings.hidden_nodes.length >= maxLayers) return;
      const fallback = settings.hidden_nodes[settings.hidden_nodes.length - 1] ?? 4;
      settings.hidden_nodes.push(fallback);
      normalizeArchitecture();
      renderArchitectureEditor();
      updateArchitecturePreview();
      regenerate();
      renderState.needsRefresh = true;
    });
  }

  if (removeLayerButton) {
    removeLayerButton.on('click', () => {
      if (settings.hidden_nodes.length <= minLayers) return;
      settings.hidden_nodes.pop();
      normalizeArchitecture();
      renderArchitectureEditor();
      updateArchitecturePreview();
      regenerate();
      renderState.needsRefresh = true;
    });
  }

  canvas.on('click', () => {
    if (activators.length === 0) return;
    settings.noise_seed = Math.random();
    regenerate();
    renderState.needsRefresh = true;
    $('[hint]').classList.add('hidden');
  });

  on('keydown', (e) => e.key === 'Enter' && canvas.trigger('click'));
  canvas.trigger('click');
  $('[hint]').classList.remove('hidden');
  renderArchitectureEditor();
  updateArchitecturePreview();

  $$('span[input="option"]').forEach((el) => {
    el.on('click', () => {
      const option = activator_options[el.id];
      if (!option) return;
      if (activators.includes(option)) {
        activators.splice(activators.indexOf(option), 1);
      } else {
        activators.push(option);
      }
      el.classList.toggle('active');
      renderState.needsRefresh = true;
    });
  });

  $$('span[input="boolean"]').forEach((el) => {
    if (settings[el.id]) el.classList.add('active');
    el.on('click', () => {
      settings[el.id] = !settings[el.id];
      if (el.getAttribute('regenerate') === 'network') regenerate();
      el.classList.toggle('active');
      $$('[need]').forEach((n) => {
        if (n.getAttribute('need') !== el.id) return;
        if (!settings[el.id]) n.setAttribute('sad', 'sad');
        else n.removeAttribute('sad');
      });
      renderState.needsRefresh = true;
    });
  });

  $$('span[input="number"]').forEach((el) => {
    const map = new Function('return ' + (el.getAttribute('map') ?? 'i => i.toFixed(1)'))();
    const crement = +(el.getAttribute('crement') ?? 0.5);
    const min = +(el.getAttribute('min') ?? -Infinity);
    const max = +(el.getAttribute('max') ?? Infinity);
    const needsKey = el.getAttribute('need');
    const canEdit = () => !(needsKey && !settings[needsKey]);
    const updateValue = (nextValue) => {
      if (!canEdit()) return false;
      if (!Number.isFinite(nextValue)) return false;
      settings[el.id] = Math.max(min, Math.min(max, nextValue));
      if (el.getAttribute('regenerate') === 'network') regenerate();
      reader.innerHTML = ' = ' + map(settings[el.id]);
      renderState.needsRefresh = true;
      return true;
    };

    const reader = document.createElement('span');
    reader.innerHTML = ' = ' + map(settings[el.id]);
    reader.classList.add('reader');
    reader.on('click', () => {
      if (!canEdit()) return;
      const input = document.createElement('input');
      input.type = 'number';
      input.classList.add('reader-editor');
      input.value = settings[el.id];
      if (Number.isFinite(min)) input.min = String(min);
      if (Number.isFinite(max)) input.max = String(max);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        input.placeholder = `${min}..${max}`;
        input.title = `Range: ${min} to ${max}`;
      } else if (Number.isFinite(min)) {
        input.placeholder = `>= ${min}`;
        input.title = `Minimum: ${min}`;
      } else if (Number.isFinite(max)) {
        input.placeholder = `<= ${max}`;
        input.title = `Maximum: ${max}`;
      }
      input.step = Number.isFinite(crement) && crement > 0 ? String(crement) : 'any';

      const commit = () => {
        const parsed = Number(input.value);
        const applied = updateValue(parsed);
        if (!applied) reader.innerHTML = ' = ' + map(settings[el.id]);
        input.replaceWith(reader);
      };

      input.on('blur', commit);
      input.on('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') {
          reader.innerHTML = ' = ' + map(settings[el.id]);
          input.replaceWith(reader);
        }
      });

      reader.replaceWith(input);
      input.focus();
      input.select();
    });

    const pp = document.createElement('span');
    pp.innerHTML = ' ++';
    pp.on('click', () => {
      updateValue(settings[el.id] + crement);
    });

    const mm = document.createElement('span');
    mm.innerHTML = '-- ';
    mm.on('click', () => {
      updateValue(settings[el.id] - crement);
    });

    el.insertAdjacentElement('beforeend', pp);
    el.insertAdjacentElement('beforeend', reader);
    el.insertAdjacentElement('afterbegin', mm);
  });

  let numSaved = 0;
  const dateObj = new Date();
  const time = `${dateObj.getUTCFullYear()}${dateObj.getUTCMonth() + 1}${dateObj.getUTCDate()}`;
  $('#save').on('click', () => {
    const link = document.createElement('a');
    link.download = `graidient-${time}_${numSaved++}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });

  $('#restart_render').on('click', () => {
    renderState.restartRender = true;
  });
}
