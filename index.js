import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced, event_types, eventSource } from '../../../../script.js';

const MODULE = 'EightTailCat-Pet';

const defaultSettings = {
  visible: true,
  left: null,
  top: null,
};

function ensureSettings() {
  if (!extension_settings[MODULE]) {
    extension_settings[MODULE] = Object.assign({}, defaultSettings);
  }
  const s = extension_settings[MODULE];
  if (typeof s.visible !== 'boolean') s.visible = true;
  return s;
}

function savePos(left, top) {
  const s = ensureSettings();
  s.left = left;
  s.top = top;
  saveSettingsDebounced();
}

function clampOverlay(el) {
  const w = el.offsetWidth || 360;
  const h = el.offsetHeight || 420;
  /* 全视口活动：左上角可落在 [0, inner - size]，防拖出屏幕 */
  const maxL = Math.max(0, window.innerWidth - w);
  const maxT = Math.max(0, window.innerHeight - h);
  let left = parseFloat(el.style.left);
  let top = parseFloat(el.style.top);
  if (isNaN(left)) left = 0;
  if (isNaN(top)) top = 0;
  left = Math.min(maxL, Math.max(0, left));
  top = Math.min(maxT, Math.max(0, top));
  el.style.left = left + 'px';
  el.style.top = top + 'px';
  return { left, top };
}

function applySavedPos(el) {
  const s = ensureSettings();
  const w = el.classList.contains('eighttailcat-expanded')
    ? Math.min(920, window.innerWidth * 0.96)
    : Math.min(360, window.innerWidth * 0.9);
  const h = el.classList.contains('eighttailcat-expanded')
    ? Math.min(860, window.innerHeight * 0.96)
    : Math.min(420, window.innerHeight * 0.75);
  const defL = Math.max(0, window.innerWidth - w - 12);
  const defT = Math.max(0, window.innerHeight - h - 12);
  el.style.left = (s.left == null ? defL : s.left) + 'px';
  el.style.top = (s.top == null ? defT : s.top) + 'px';
  clampOverlay(el);
}

function mountOverlay(base) {
  let overlay = document.getElementById('pet-container');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'pet-container';
  overlay.setAttribute('aria-label', '八条猫桌宠');

  const iframe = document.createElement('iframe');
  iframe.id = 'eighttailcat-frame';
  iframe.title = '八条猫桌宠';
  iframe.setAttribute('allowtransparency', 'true');
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
  iframe.src = base + 'pet.html';
  overlay.appendChild(iframe);
  document.body.appendChild(overlay);

  const s = ensureSettings();
  overlay.classList.toggle('eighttailcat-hidden', !s.visible);
  applySavedPos(overlay);

  let dragging = false;
  let startSX = 0;
  let startSY = 0;
  let originL = 0;
  let originT = 0;

  window.addEventListener('message', function (ev) {
    const data = ev && ev.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'eighttailcat-drag-start') {
      dragging = true;
      startSX = Number(data.screenX) || 0;
      startSY = Number(data.screenY) || 0;
      originL = parseFloat(overlay.style.left) || 0;
      originT = parseFloat(overlay.style.top) || 0;
    } else if (data.type === 'eighttailcat-drag-move' && dragging) {
      overlay.style.left = originL + ((Number(data.screenX) || 0) - startSX) + 'px';
      overlay.style.top = originT + ((Number(data.screenY) || 0) - startSY) + 'px';
      clampOverlay(overlay);
    } else if (data.type === 'eighttailcat-drag-end') {
      dragging = false;
      const pos = clampOverlay(overlay);
      savePos(pos.left, pos.top);
    } else if (data.type === 'eighttailcat-hide') {
      overlay.classList.add('eighttailcat-hidden');
      ensureSettings().visible = false;
      saveSettingsDebounced();
    } else if (data.type === 'eighttailcat-show') {
      overlay.classList.remove('eighttailcat-hidden');
      ensureSettings().visible = true;
      saveSettingsDebounced();
    } else if (data.type === 'eighttailcat-expand') {
      overlay.classList.toggle('eighttailcat-expanded', !!data.on);
      clampOverlay(overlay);
    } else if (data.type === 'eighttailcat-open-settings') {
      const win = iframe.contentWindow;
      if (win && typeof win.openSettings === 'function') win.openSettings();
    }
  });

  window.addEventListener('resize', function () {
    clampOverlay(overlay);
  });

  return overlay;
}

function togglePet() {
  const overlay = document.getElementById('pet-container');
  if (!overlay) return;
  const hide = !overlay.classList.contains('eighttailcat-hidden');
  overlay.classList.toggle('eighttailcat-hidden', hide);
  ensureSettings().visible = !hide;
  saveSettingsDebounced();
}

function openPetSettings() {
  const overlay = document.getElementById('pet-container');
  const iframe = document.getElementById('eighttailcat-frame');
  if (overlay) overlay.classList.remove('eighttailcat-hidden');
  ensureSettings().visible = true;
  saveSettingsDebounced();
  try {
    const win = iframe && iframe.contentWindow;
    if (win && typeof win.openSettings === 'function') {
      win.openSettings();
      return;
    }
    if (win) win.postMessage({ type: 'eighttailcat-open-settings' }, '*');
  } catch (_) {}
}

const SETTINGS_FALLBACK = `
<div id="eighttailcat-settings" class="eighttailcat-settings">
  <div class="inline-drawer">
    <div class="inline-drawer-toggle inline-drawer-header">
      <b>八条猫设置</b>
      <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>
    <div class="inline-drawer-content">
      <p class="margin0">桌宠浮在酒馆最顶层。详细人设、投喂视觉 API、离线词库仍在半透明面板里。</p>
      <div class="eighttailcat-actions">
        <div id="eighttailcat-open-panel" class="menu_button menu_button_icon">打开八条猫面板</div>
        <div id="eighttailcat-toggle-pet" class="menu_button menu_button_icon">显示 / 隐藏桌宠</div>
      </div>
    </div>
  </div>
</div>`;

jQuery(document).ready(async function () {
  ensureSettings();
  const base = new URL('./', import.meta.url).href;
  mountOverlay(base);

  try {
    let html = SETTINGS_FALLBACK;
    try {
      const ctx = window.SillyTavern && SillyTavern.getContext && SillyTavern.getContext();
      if (ctx && typeof ctx.renderExtensionTemplateAsync === 'function') {
        html = await ctx.renderExtensionTemplateAsync('third-party/EightTailCat-Pet', 'settings');
      }
    } catch (_) {}
    const $root = $('#extensions_settings2').length ? $('#extensions_settings2') : $('#extensions_settings');
    $root.append(html);
    $('#eighttailcat-open-panel').on('click', openPetSettings);
    $('#eighttailcat-toggle-pet').on('click', togglePet);
  } catch (err) {
    console.warn('[EightTailCat-Pet] 设置抽屉注入失败', err);
  }

  try {
    if (eventSource && event_types && event_types.APP_READY) {
      eventSource.on(event_types.APP_READY, function () {
        const overlay = document.getElementById('pet-container');
        if (overlay && overlay.parentNode !== document.body) document.body.appendChild(overlay);
      });
    }
  } catch (_) {}
});
