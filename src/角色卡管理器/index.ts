const APP_NAME = '角色卡管理器';
const HOST_ROOT_ID = 'character-card-manager-host-root';
const MANAGER_FRAME_TITLE = '角色卡管理器面板';

onScriptReady(() => {
  registerScriptButton();
  exposeOpenApi();
  listenForPanelMessages();
});

type HelperWindow = Window &
  typeof globalThis & {
    $?: JQueryStatic;
    openCharacterCardManager?: () => void;
    toastr?: { error?: (message: string) => void; info?: (message: string) => void };
    __characterCardManagerPreviewUrl?: string;
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
  let root = hostDocument.getElementById(HOST_ROOT_ID);

  if (!root) {
    root = hostDocument.createElement('div');
    root.id = HOST_ROOT_ID;
    root.style.position = 'fixed';
    root.style.inset = '0';
    root.style.zIndex = '100000';
    root.style.boxSizing = 'border-box';
    root.style.display = 'block';
    root.style.padding = '0';
    root.style.background = 'oklch(8% 0.01 248)';
    hostDocument.body.appendChild(root);
    appendManagerPanel(root, hostDocument);
  }

  root.style.display = 'block';
}

function closeManager() {
  const root = getHostDocument().getElementById(HOST_ROOT_ID);
  if (root) {
    root.style.display = 'none';
  }
}

function appendManagerPanel(root: HTMLElement, hostDocument: Document) {
  const panel = hostDocument.createElement('div');
  panel.style.position = 'relative';
  panel.style.width = '100vw';
  panel.style.height = '100vh';
  panel.style.overflow = 'hidden';
  panel.style.border = '0';
  panel.style.borderRadius = '0';
  panel.style.background = 'oklch(16% 0.012 248)';

  const frame = hostDocument.createElement('iframe');
  frame.title = MANAGER_FRAME_TITLE;
  const previewUrl = getPreviewUrl();
  frame.src = previewUrl;
  frame.style.display = 'block';
  frame.style.width = '100%';
  frame.style.height = '100%';
  frame.style.border = '0';
  frame.style.background = 'oklch(16% 0.012 248)';

  panel.appendChild(frame);
  root.appendChild(panel);
  void loadFrameDocument(frame, previewUrl);
}

async function loadFrameDocument(frame: HTMLIFrameElement, previewUrl: string) {
  try {
    const response = await fetch(previewUrl);
    if (!response.ok) return;
    frame.srcdoc = await response.text();
  } catch (error) {
    console.warn(`[${APP_NAME}] 预览页内联加载失败，改用 URL 加载`, error);
  }
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
  window.openCharacterCardManager = openManager;
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

function getPreviewUrl(): string {
  const configuredUrl = getHelperWindow().__characterCardManagerPreviewUrl;
  if (configuredUrl) return configuredUrl;

  const script = Array.from(document.scripts).find(element =>
    decodeURIComponent(element.src).includes('/dist/角色卡管理器/index.js'),
  );
  if (script?.src) {
    return decodeURIComponent(script.src).replace(
      /\/角色卡管理器\/index\.js(?:[?#].*)?$/,
      '/角色卡管理器预览/index.html',
    );
  }

  return 'http://127.0.0.1:5500/dist/角色卡管理器预览/index.html';
}
