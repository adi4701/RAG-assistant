import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({
    access_token: 'mock-jwt-token',
    token_type: 'bearer',
    role: body.role || 'readonly',
    tenant_id: body.tenant_id || 'demo-corp',
    username: body.username,
    permitted_doc_types: body.role === 'admin' ? ['nda', 'employment', 'board_resolution', 'shareholder_agreement'] : 
                         body.role === 'analyst' ? ['nda', 'employment', 'shareholder_agreement'] : ['nda']
  });
}
