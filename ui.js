import { activators, activator_options, setFractalOctaves } from './activators.js';

export function bindUI({ canvas, settings, renderState, regenerate }) {
  const palettePresets = [
    {
      id: 'mosslight',
      name: 'Mosslight',
      ramp: [
        { at: 0.0, rgb: [0.07, 0.11, 0.18] },
        { at: 0.25, rgb: [0.17, 0.33, 0.46] },
        { at: 0.5, rgb: [0.41, 0.61, 0.53] },
        { at: 0.75, rgb: [0.8, 0.72, 0.43] },
        { at: 1.0, rgb: [0.98, 0.91, 0.73] }
      ]
    },
    {
      id: 'sunset',
      name: 'Sunset Heat',
      ramp: [
        { at: 0.0, rgb: [0.05, 0.02, 0.1] },
        { at: 0.3, rgb: [0.34, 0.06, 0.28] },
        { at: 0.55, rgb: [0.76, 0.23, 0.2] },
        { at: 0.8, rgb: [0.96, 0.58, 0.28] },
        { at: 1.0, rgb: [1.0, 0.88, 0.62] }
      ]
    },
    {
      id: 'oceanic',
      name: 'Oceanic',
      ramp: [
        { at: 0.0, rgb: [0.01, 0.08, 0.16] },
        { at: 0.32, rgb: [0.03, 0.27, 0.46] },
        { at: 0.58, rgb: [0.08, 0.53, 0.64] },
        { at: 0.8, rgb: [0.43, 0.8, 0.73] },
        { at: 1.0, rgb: [0.9, 0.99, 0.89] }
      ]
    },
    {
      id: 'mono',
      name: 'Mono Film',
      ramp: [
        { at: 0.0, rgb: [0.03, 0.03, 0.03] },
        { at: 0.28, rgb: [0.19, 0.19, 0.19] },
        { at: 0.58, rgb: [0.46, 0.46, 0.46] },
        { at: 0.84, rgb: [0.78, 0.78, 0.78] },
        { at: 1.0, rgb: [0.98, 0.98, 0.98] }
      ]
    },
    {
      id: 'neon',
      name: 'Neon Grid',
      ramp: [
        { at: 0.0, rgb: [0.02, 0.0, 0.07] },
        { at: 0.25, rgb: [0.14, 0.0, 0.48] },
        { at: 0.5, rgb: [0.0, 0.62, 0.92] },
        { at: 0.74, rgb: [0.15, 0.95, 0.55] },
        { at: 1.0, rgb: [0.98, 0.98, 0.2] }
      ]
    },
    {
      id: 'ember',
      name: 'Ember Forge',
      ramp: [
        { at: 0.0, rgb: [0.03, 0.01, 0.01] },
        { at: 0.28, rgb: [0.24, 0.05, 0.02] },
        { at: 0.52, rgb: [0.55, 0.13, 0.02] },
        { at: 0.76, rgb: [0.89, 0.39, 0.07] },
        { at: 1.0, rgb: [1.0, 0.82, 0.36] }
      ]
    }
  ];
  const customPresetId = 'custom';
  const fixedStopPositions = [0, 0.25, 0.5, 0.75, 1];
  const hslToRgb = (h, s, l) => {
    const hue = ((h % 1) + 1) % 1;
    const sat = Math.max(0, Math.min(1, s));
    const light = Math.max(0, Math.min(1, l));

    if (sat <= 1e-6) return [light, light, light];

    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
    const p = 2 * light - q;
    const hueToRgb = (t) => {
      let x = t;
      if (x < 0) x += 1;
      if (x > 1) x -= 1;
      if (x < 1 / 6) return p + (q - p) * 6 * x;
      if (x < 1 / 2) return q;
      if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
      return p;
    };

    return [hueToRgb(hue + 1 / 3), hueToRgb(hue), hueToRgb(hue - 1 / 3)];
  };
  const rampsCloseEnough = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    const eps = 1e-3;
    for (let i = 0; i < a.length; i++) {
      const pa = a[i];
      const pb = b[i];
      if (Math.abs(pa.at - pb.at) > eps) return false;
      for (let c = 0; c < 3; c++) {
        if (Math.abs(pa.rgb[c] - pb.rgb[c]) > eps) return false;
      }
    }
    return true;
  };
  const cloneRamp = (ramp) => ramp.map((point) => ({ at: point.at, rgb: [...point.rgb] }));
  const makeRandomFiveStopRamp = () => {
    const baseHue = Math.random();
    const hueSpan = 0.2 + 0.45 * Math.random();
    const direction = Math.random() < 0.5 ? -1 : 1;
    const saturation = 0.55 + 0.35 * Math.random();
    const lightStart = 0.15 + 0.2 * Math.random();
    const lightEnd = 0.65 + 0.25 * Math.random();

    return fixedStopPositions.map((at, i) => {
      const t = i / (fixedStopPositions.length - 1);
      const hueJitter = (Math.random() - 0.5) * 0.08;
      const satJitter = (Math.random() - 0.5) * 0.12;
      const lightJitter = (Math.random() - 0.5) * 0.12;
      const hue = baseHue + direction * hueSpan * t + hueJitter;
      const sat = saturation + satJitter;
      const light = lightStart + (lightEnd - lightStart) * t + lightJitter;
      return {
        at,
        rgb: hslToRgb(hue, sat, light)
      };
    });
  };
  const getPresetById = (id) => palettePresets.find((preset) => preset.id === id);
  const detectPresetId = (ramp) => {
    const normalized = normalizePaletteRamp(ramp);
    for (const preset of palettePresets) {
      const presetRamp = normalizePaletteRamp(preset.ramp);
      if (rampsCloseEnough(normalized, presetRamp)) return preset.id;
    }
    return customPresetId;
  };

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const toHexChannel = (v) => {
    const n = Math.round(255 * clamp01(v));
    return n.toString(16).padStart(2, '0');
  };
  const rgbToHex = (rgb) => `#${toHexChannel(rgb[0])}${toHexChannel(rgb[1])}${toHexChannel(rgb[2])}`;
  const hexToRgb = (hex) => {
    const normalized = typeof hex === 'string' ? hex.trim() : '';
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
    if (!m) return [1, 1, 1];
    return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
  };
  const normalizePaletteRamp = (ramp) => {
    const raw = Array.isArray(ramp) ? ramp : [];
    const normalized = raw
      .map((point) => {
        const at = clamp01(Number(point?.at));
        const rgbRaw = Array.isArray(point?.rgb) ? point.rgb : [1, 1, 1];
        return {
          at,
          rgb: [clamp01(Number(rgbRaw[0])), clamp01(Number(rgbRaw[1])), clamp01(Number(rgbRaw[2]))]
        };
      })
      .filter((point) => Number.isFinite(point.at));

    if (normalized.length === 0) {
      return [
        { at: 0, rgb: [0, 0, 0] },
        { at: 1, rgb: [1, 1, 1] }
      ];
    }

    normalized.sort((a, b) => a.at - b.at);
    return normalized;
  };

  if (!Array.isArray(settings.hidden_nodes) || settings.hidden_nodes.length === 0) {
    settings.hidden_nodes = [4];
  }
  if (settings.render_mode !== 'palette') settings.render_mode = 'rgb';
  settings.octaves = Math.max(1, Math.round(Number.isFinite(settings.octaves) ? settings.octaves : 5));
  settings.palette_ramp = normalizePaletteRamp(settings.palette_ramp);
  setFractalOctaves(settings.octaves);

  const minNodesPerLayer = 1;
  const maxNodesPerLayer = 64;
  const minLayers = 1;
  const maxLayers = 8;
  const layerEditor = document.getElementById('network_layers_editor');
  const addLayerButton = document.getElementById('add_layer');
  const removeLayerButton = document.getElementById('remove_layer');
  const architecturePreview = document.getElementById('network_architecture_preview');
  const renderModeOptions = $$('[render-mode-option]');
  const paletteEditorSection = document.getElementById('palette_editor_section');
  const palettePreview = document.getElementById('palette_preview');
  const paletteStops = document.getElementById('palette_stops');
  const addPaletteStopButton = document.getElementById('add_palette_stop');
  const palettePresetSelect = document.getElementById('palette_preset_select');
  const randomPalettePresetButton = document.getElementById('random_palette_preset');

  const syncPalettePresetSelection = () => {
    if (!palettePresetSelect) return;
    palettePresetSelect.value = detectPresetId(settings.palette_ramp);
  };

  const applyPalettePreset = (presetId) => {
    const preset = getPresetById(presetId);
    if (!preset) return;
    settings.palette_ramp = normalizePaletteRamp(cloneRamp(preset.ramp));
    renderPaletteStops();
    updatePalettePreview();
    syncPalettePresetSelection();
    renderState.needsRefresh = true;
  };

  const updatePalettePreview = () => {
    if (!palettePreview) return;
    const ramp = normalizePaletteRamp(settings.palette_ramp);
    settings.palette_ramp = ramp;
    const gradient = ramp
      .map((point) => `${rgbToHex(point.rgb)} ${Math.round(point.at * 1000) / 10}%`)
      .join(', ');
    palettePreview.style.background = `linear-gradient(to right, ${gradient})`;
    syncPalettePresetSelection();
  };

  const renderPaletteStops = () => {
    if (!paletteStops) return;
    const ramp = normalizePaletteRamp(settings.palette_ramp);
    settings.palette_ramp = ramp;
    paletteStops.innerHTML = '';

    ramp.forEach((point, i) => {
      const row = document.createElement('div');
      row.classList.add('palette-stop-row');

      const pos = document.createElement('input');
      pos.type = 'number';
      pos.classList.add('palette-stop-pos');
      pos.min = '0';
      pos.max = '1';
      pos.step = '0.01';
      pos.value = String(Math.round(point.at * 1000) / 1000);
      pos.title = 'Stop position (0..1)';
      pos.on('change', () => {
        const next = clamp01(Number(pos.value));
        settings.palette_ramp[i].at = next;
        settings.palette_ramp = normalizePaletteRamp(settings.palette_ramp);
        renderPaletteStops();
        updatePalettePreview();
        renderState.needsRefresh = true;
      });

      const color = document.createElement('input');
      color.type = 'color';
      color.classList.add('palette-stop-color');
      color.value = rgbToHex(point.rgb);
      color.title = 'Stop color';
      color.on('input', () => {
        settings.palette_ramp[i].rgb = hexToRgb(color.value);
        updatePalettePreview();
        renderState.needsRefresh = true;
      });

      const del = document.createElement('button');
      del.type = 'button';
      del.classList.add('palette-stop-delete');
      del.textContent = 'x';
      del.title = 'Remove stop';
      del.on('click', () => {
        if (settings.palette_ramp.length <= 2) return;
        settings.palette_ramp.splice(i, 1);
        settings.palette_ramp = normalizePaletteRamp(settings.palette_ramp);
        renderPaletteStops();
        updatePalettePreview();
        renderState.needsRefresh = true;
      });

      row.append(pos, color, del);
      paletteStops.append(row);
    });
  };

  const updatePaletteEditorVisibility = () => {
    if (!paletteEditorSection) return;
    paletteEditorSection.classList.toggle('hidden', settings.render_mode !== 'palette');
  };

  const updateRenderModeUI = () => {
    renderModeOptions.forEach((el) => {
      const isActive = el.getAttribute('render-mode-option') === settings.render_mode;
      el.classList.toggle('active', isActive);
    });
    updatePaletteEditorVisibility();
  };

  const setRenderMode = (mode) => {
    if (mode !== 'rgb' && mode !== 'palette') return;
    if (settings.render_mode === mode) return;
    settings.render_mode = mode;
    updateRenderModeUI();
    regenerate();
    renderState.needsRefresh = true;
  };

  renderModeOptions.forEach((el) => {
    el.on('click', () => setRenderMode(el.getAttribute('render-mode-option')));
  });

  if (palettePresetSelect) {
    palettePresetSelect.innerHTML = '';
    const customOption = document.createElement('option');
    customOption.value = customPresetId;
    customOption.textContent = 'Custom';
    palettePresetSelect.append(customOption);
    palettePresets.forEach((preset) => {
      const option = document.createElement('option');
      option.value = preset.id;
      option.textContent = preset.name;
      palettePresetSelect.append(option);
    });
    palettePresetSelect.on('change', () => {
      if (palettePresetSelect.value === customPresetId) {
        syncPalettePresetSelection();
        return;
      }
      applyPalettePreset(palettePresetSelect.value);
    });
    syncPalettePresetSelection();
  }

  if (randomPalettePresetButton) {
    randomPalettePresetButton.on('click', () => {
      settings.palette_ramp = normalizePaletteRamp(makeRandomFiveStopRamp());
      renderPaletteStops();
      updatePalettePreview();
      syncPalettePresetSelection();
      renderState.needsRefresh = true;
    });
  }

  if (addPaletteStopButton) {
    addPaletteStopButton.on('click', () => {
      const ramp = normalizePaletteRamp(settings.palette_ramp);
      let at = 0.5;
      if (ramp.length >= 2) {
        const left = ramp[ramp.length - 2];
        const right = ramp[ramp.length - 1];
        at = clamp01((left.at + right.at) / 2);
      }
      settings.palette_ramp.push({ at, rgb: [1, 1, 1] });
      settings.palette_ramp = normalizePaletteRamp(settings.palette_ramp);
      renderPaletteStops();
      updatePalettePreview();
      renderState.needsRefresh = true;
    });
  }

  renderPaletteStops();
  updatePalettePreview();
  updateRenderModeUI();

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
      let value = Math.max(min, Math.min(max, nextValue));
      if (el.id === 'octaves') {
        value = Math.max(1, Math.round(value));
      }
      settings[el.id] = value;
      if (el.id === 'octaves') {
        setFractalOctaves(settings.octaves);
      }
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
