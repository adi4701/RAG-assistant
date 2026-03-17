const BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function registerUser({ username, password, tenant_id, role }) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, tenant_id, role }),
  });
  return handleResponse(res);
}

export async function loginUser({ username, password }) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function uploadDocument({ file, doc_type, token }) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('doc_type', doc_type);
  const res = await fetch(`${BASE}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  return handleResponse(res);
}

export async function listDocuments(token) {
  const res = await fetch(`${BASE}/documents/list`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function checkHealth() {
  const res = await fetch(`${BASE}/health`);
  return handleResponse(res);
}

export function streamQuery({ query, token, top_k = 5, onToken, onCitations, onDone, onError }) {
  fetch(`${BASE}/query/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, top_k }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(err.detail || 'Query failed');
      }
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      const read = async () => {
        const { done, value } = await reader.read();
        if (done) { onDone?.(); return; }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') { onDone?.(); return; }
          try {
            const ev = JSON.parse(raw);
            if (ev.type === 'token')     onToken?.(ev.content);
            if (ev.type === 'citations') onCitations?.(ev.citations, ev.cached);
          } catch (_) {}
        }
        read();
      };
      read();
    })
    .catch((err) => onError?.(err));
}
