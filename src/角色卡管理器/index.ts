import { createApp, type App as VueApp } from 'vue';
import App from './App.vue';

const APP_NAME = '角色卡管理器';
const HOST_ROOT_ID = 'character-card-manager-host-root';
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
    return;
  }
  callback();
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
  hostDocument.body.appendChild(root);
  mountManager(root);
}

function closeManager() {
  managerApp?.unmount();
  managerApp = undefined;

  const root = getHostDocument().getElementById(HOST_ROOT_ID);
  if (root) {
    root.remove();
  }
}

function mountManager(root: HTMLElement) {
  const mountPoint = getHostDocument().createElement('div');
  applyStyles(mountPoint, {
    width: '100vw',
    height: '100vh',
  });

  root.appendChild(mountPoint);
  managerApp = createApp(App);
  managerApp.mount(mountPoint);
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
