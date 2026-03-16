import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({
    access_token: 'mock-jwt-token',
    token_type: 'bearer',
    role: 'admin',
    tenant_id: 'demo-corp',
    username: body.username,
    permitted_doc_types: ['nda', 'employment', 'board_resolution', 'shareholder_agreement']
  });
}
