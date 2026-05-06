const API_PREFIX = '/api/';
const PRODUCTOS_JSON = '/productos.json';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (!url.pathname.startsWith(API_PREFIX)) {
    return;
  }

  event.respondWith(handleApiRequest(request, url));
});

async function handleApiRequest(request, url) {
  const apiPath = url.pathname.replace(/^\/api/, '');

  switch (request.method) {
    case 'GET':
      return handleGet(apiPath);
    case 'POST':
      return handleMethod(request, apiPath, 'POST');
    case 'PUT':
      return handleMethod(request, apiPath, 'PUT');
    case 'DELETE':
      return handleMethod(request, apiPath, 'DELETE');
    default:
      return jsonResponse({
        error: 'Método no soportado',
        method: request.method,
      }, 405);
  }
}

async function handleGet(apiPath) {
  if (apiPath === '/productos') {
    return fetch(PRODUCTOS_JSON).then(toJsonResponse);
  }

  const productMatch = apiPath.match(/^\/productos\/(\d+)$/);
  if (productMatch) {
    const productId = Number(productMatch[1]);
    const products = await fetch(PRODUCTOS_JSON).then(res => res.json());
    const product = products.find(item => item.id === productId);
    return product
      ? jsonResponse(product)
      : jsonResponse({ error: 'Producto no encontrado', id: productId }, 404);
  }

  return jsonResponse({ error: 'Endpoint no encontrado', path: apiPath }, 404);
}

async function handleMethod(request, apiPath, method) {
  const body = await parseJson(request.clone());
  return jsonResponse({
    success: false,
    message: `La petición ${method} a "/api${apiPath}" se recibió correctamente. Este entorno no guarda cambios permanentes.`,
    path: apiPath,
    method,
    requestBody: body,
  }, 200);
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function toJsonResponse(response) {
  if (!response.ok) {
    return jsonResponse({ error: 'No se pudo cargar productos.json' }, response.status);
  }
  return response.json().then(data => jsonResponse(data));
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
