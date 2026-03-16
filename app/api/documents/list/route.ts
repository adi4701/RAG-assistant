import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  return NextResponse.json([
    { id: '1', filename: 'Acme_Corp_NDA_2023.pdf', doc_type: 'nda' },
    { id: '2', filename: 'Employment_Agreement_John_Doe.docx', doc_type: 'employment' }
  ]);
}
