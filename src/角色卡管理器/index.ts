import { createApp, type App as VueApp } from 'vue';
import App from './App.vue';

const APP_NAME = '角色卡管理器';
const HOST_ROOT_ID = 'character-card-manager-host-root';
const HOST_STYLE_ATTR = 'data-character-card-manager-style';
const MANAGER_FRAME_TITLE = '角色卡管理器面板';
const MANAGER_IFRAME_SRCDOC = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      *,*::before,*::after{box-sizing:border-box;}
      html,body,#app{width:100%;height:100%;margin:0;padding:0;overflow:hidden;}
      body{background:oklch(8% 0.01 248);}
    </style>
  </head>
  <body><div id="app"></div></body>
</html>`;
let managerApp: VueApp<Element> | undefined;

onScriptReady(() => {
  registerScriptButton();
  exposeOpenApi();
  listenForPanelMessages();
});

type HelperWindow = Window &
  typeof globalThis & {
    $?: JQueryStatic;
    openCharacterCardManager?: () => void;
    closeCharacterCardManager?: () => void;
    toastr?: { error?: (message: string) => void; info?: (message: string) => void };
  };

function onScriptReady(callback: () => void) {
  if (typeof $ === 'function') {
    $(callback);
    return;
  }
  onReady(callback);
}

function onReady(callback: () => void) {
  const runOnce = once(callback);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runOnce, { once: true });
    window.setTimeout(runOnce, 0);
    return;
  }
  runOnce();
}

function once(callback: () => void): () => void {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    callback();
  };
}

function openManager() {
  const hostDocument = getHostDocument();
  closeManager();

  const root = hostDocument.createElement('div');
  root.id = HOST_ROOT_ID;
  applyStyles(root, {
    position: 'fixed',
    inset: '0',
    zIndex: '100000',
    boxSizing: 'border-box',
    display: 'block',
    padding: '0',
    background: 'oklch(8% 0.01 248)',
  });

  const frame = hostDocument.createElement('iframe');
  frame.title = MANAGER_FRAME_TITLE;
  frame.srcdoc = MANAGER_IFRAME_SRCDOC;
  applyStyles(frame, {
    width: '100%',
    height: '100%',
    border: '0',
    display: 'block',
    background: 'oklch(8% 0.01 248)',
  });

  hostDocument.body.appendChild(root);
  root.appendChild(frame);
  mountManagerFrame(frame);
}

function closeManager() {
  managerApp?.unmount();
  managerApp = undefined;

  const hostDocument = getHostDocument();
  const root = hostDocument.getElementById(HOST_ROOT_ID);
  if (root) {
    root.remove();
  }
  removeSyncedManagerStyles(hostDocument);
}

function mountManagerFrame(frame: HTMLIFrameElement) {
  const mount = () => {
    const frameDocument = frame.contentDocument;
    const mountPoint = frameDocument?.getElementById('app');
    if (!frameDocument || !mountPoint) {
      window.setTimeout(mount, 0);
      return;
    }

    syncManagerStyles(frameDocument);
    managerApp = createApp(App);
    managerApp.mount(mountPoint);
  };

  if (frame.contentDocument?.readyState === 'complete') {
    mount();
  } else {
    frame.addEventListener('load', mount, { once: true });
  }
}

function syncManagerStyles(hostDocument: Document) {
  if (document === hostDocument) return;

  for (const style of findManagerStyles(document)) {
    const id = getStyleSyncId(style);
    if (hostDocument.head.querySelector(`style[${HOST_STYLE_ATTR}="${cssEscape(id)}"]`)) continue;

    const syncedStyle = hostDocument.createElement('style');
    syncedStyle.type = style.type || 'text/css';
    syncedStyle.textContent = style.textContent || '';
    syncedStyle.setAttribute(HOST_STYLE_ATTR, id);
    copyOptionalAttribute(style, syncedStyle, 'media');
    copyOptionalAttribute(style, syncedStyle, 'data-vue-ssr-id');
    hostDocument.head.appendChild(syncedStyle);
  }
}

function removeSyncedManagerStyles(hostDocument: Document) {
  hostDocument.querySelectorAll(`style[${HOST_STYLE_ATTR}]`).forEach(style => style.remove());
}

function findManagerStyles(sourceDocument: Document): HTMLStyleElement[] {
  return Array.from(sourceDocument.querySelectorAll<HTMLStyleElement>('style')).filter(style =>
    isManagerStyle(style.textContent || ''),
  );
}

function isManagerStyle(cssText: string): boolean {
  return cssText.includes('.cm-shell') && cssText.includes('--cm-bg');
}

function getStyleSyncId(style: HTMLStyleElement): string {
  return style.getAttribute('data-vue-ssr-id') || String(findManagerStyles(document).indexOf(style));
}

function copyOptionalAttribute(source: Element, target: Element, attribute: string) {
  const value = source.getAttribute(attribute);
  if (value) {
    target.setAttribute(attribute, value);
  }
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, '\\$&');
}

function registerScriptButton() {
  try {
    replaceScriptButtons([{ name: APP_NAME, visible: true }]);
    eventOn(getButtonEvent(APP_NAME), openManager);
  } catch (error) {
    console.warn(`[${APP_NAME}] 注册脚本按钮失败`, error);
    getHelperWindow().toastr?.error?.('角色卡管理器按钮注册失败，请查看浏览器控制台。');
  }
}

function exposeOpenApi() {
  const hostWindow = getHostWindow() as HelperWindow;
  hostWindow.openCharacterCardManager = openManager;
  hostWindow.closeCharacterCardManager = closeManager;
  window.openCharacterCardManager = openManager;
  window.closeCharacterCardManager = closeManager;
}

function listenForPanelMessages() {
  const hostWindow = getHostWindow();
  hostWindow.addEventListener('message', event => {
    if (event.data?.source === 'character-card-manager' && event.data?.type === 'close') {
      closeManager();
    }
  });
}

function getHelperWindow(): HelperWindow {
  const hostWindow = getHostWindow() as HelperWindow;
  const currentWindow = window as HelperWindow;

  return currentWindow || hostWindow;
}

function getHostWindow(): Window & typeof globalThis {
  try {
    if (window.parent && window.parent !== window) {
      return window.parent as Window & typeof globalThis;
    }
  } catch {
    return window;
  }
  return window;
}

function getHostDocument(): Document {
  return getHostWindow().document || document;
}

function applyStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  Object.assign(element.style, styles);
}
