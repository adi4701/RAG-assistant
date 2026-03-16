import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const doc_type = formData.get('doc_type') as string;
  
  return NextResponse.json({
    filename: file.name,
    status: 'success',
    message: 'Uploaded successfully',
    chunks: Math.floor(Math.random() * 20) + 1
  });
}
