const BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function registerUser({ username, password, tenant_id, role }: any) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, tenant_id, role })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Registration failed');
  }
  return res.json();
}

export async function loginUser({ username, password }: any) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Login failed');
  }
  return res.json();
}

export async function uploadDocument({ file, doc_type, token }: any) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doc_type', doc_type);
  const res = await fetch(`${BASE}/documents/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Upload failed');
  }
  return res.json();
}

export async function listDocuments(token: string) {
  const res = await fetch(`${BASE}/documents/list`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to list documents');
  }
  return res.json();
}

export function streamQuery({ query, token, onToken, onCitations, onDone, onError }: any) {
  fetch(`${BASE}/query/stream`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query })
  }).then(async (res) => {
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Query failed');
    }
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('No reader');
    
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') {
            onDone();
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'token') {
              onToken(data.content);
            } else if (data.type === 'citations') {
              onCitations(data.citations, data.cached);
            }
          } catch (e) {
            console.error('Failed to parse SSE', e);
          }
        }
      }
    }
    onDone();
  }).catch(onError);
}
