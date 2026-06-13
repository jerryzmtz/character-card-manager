const APP_NAME = '角色卡管理器';
const HOST_ROOT_ID = 'character-card-manager-host-root';
const MANAGER_FRAME_TITLE = '角色卡管理器面板';
let localCacheBustCounter = 0;
let frameBlobUrl = '';

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
  appendManagerPanel(root, hostDocument);
}

function closeManager() {
  const root = getHostDocument().getElementById(HOST_ROOT_ID);
  if (root) {
    root.remove();
  }
  revokeFrameBlobUrl();
}

function appendManagerPanel(root: HTMLElement, hostDocument: Document) {
  const panel = hostDocument.createElement('div');
  applyStyles(panel, {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    border: '0',
    borderRadius: '0',
    background: 'oklch(16% 0.012 248)',
  });

  const frame = hostDocument.createElement('iframe');
  frame.title = MANAGER_FRAME_TITLE;
  const previewUrl = getPreviewUrl();
  frame.src = getLoadingDocumentUrl();
  applyStyles(frame, {
    display: 'block',
    width: '100%',
    height: '100%',
    border: '0',
    background: 'oklch(16% 0.012 248)',
  });

  panel.appendChild(frame);
  root.appendChild(panel);
  void loadFrameDocument(frame, previewUrl);
}

async function loadFrameDocument(frame: HTMLIFrameElement, previewUrl: string) {
  try {
    frame.src = createFrameBlobUrl(await requestPreviewHtml(previewUrl));
  } catch (error) {
    console.warn(`[${APP_NAME}] 预览页加载失败`, error);
    frame.src = getErrorDocumentUrl(error);
  }
}

function requestPreviewHtml(previewUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', previewUrl, true);
    request.responseType = 'text';
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.responseText);
        return;
      }
      reject(new Error(`HTTP ${request.status}`));
    };
    request.onerror = () => reject(new Error('网络请求失败'));
    request.ontimeout = () => reject(new Error('网络请求超时'));
    request.send();
  });
}

function createFrameBlobUrl(html: string): string {
  revokeFrameBlobUrl();
  frameBlobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  return frameBlobUrl;
}

function revokeFrameBlobUrl() {
  if (!frameBlobUrl) return;
  URL.revokeObjectURL(frameBlobUrl);
  frameBlobUrl = '';
}

function getLoadingDocumentUrl(): string {
  return createFrameBlobUrl(`<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"/><style>${getFrameStatusCss()}</style></head>
<body><main>正在加载角色卡管理器...</main></body>
</html>`);
}

function getErrorDocumentUrl(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || '未知错误');
  return createFrameBlobUrl(`<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"/><style>${getFrameStatusCss()}</style></head>
<body><main><strong>角色卡管理器加载失败</strong><small>${escapeHtml(message)}</small></main></body>
</html>`);
}

function getFrameStatusCss(): string {
  return `
html,body{width:100%;height:100%;margin:0;background:#050b0e;color:#dbe7ef;font:16px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
body{display:grid;place-items:center}
main{display:grid;gap:10px;text-align:center}
strong{font-size:20px}
small{max-width:560px;color:#9aa8b3;word-break:break-word}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char] || char;
  });
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

function applyStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  Object.assign(element.style, styles);
}

function getPreviewUrl(): string {
  const configuredUrl = getHelperWindow().__characterCardManagerPreviewUrl;
  if (configuredUrl) return withLocalCacheBust(configuredUrl);

  const script = Array.from(document.scripts).find(element =>
    decodeURIComponent(element.src).includes('/dist/角色卡管理器/index.js'),
  );
  if (script?.src) {
    return withLocalCacheBust(decodeURIComponent(script.src).replace(
      /\/角色卡管理器\/index\.js(?:[?#].*)?$/,
      '/角色卡管理器预览/index.html',
    ));
  }

  return withLocalCacheBust('http://127.0.0.1:5500/dist/角色卡管理器预览/index.html');
}

function withLocalCacheBust(url: string): string {
  try {
    const parsedUrl = new URL(url, window.location.href);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(parsedUrl.hostname)) {
      return url;
    }
    localCacheBustCounter += 1;
    parsedUrl.searchParams.set('t', `${Date.now()}-${localCacheBustCounter}`);
    return parsedUrl.toString();
  } catch {
    return url;
  }
}
