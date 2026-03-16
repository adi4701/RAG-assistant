import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const query = body.query;
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      
      if (query.toLowerCase().includes('empty')) {
         sendEvent({ type: 'token', content: 'Insufficient documentary evidence in the provided context.' });
         controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
         controller.close();
         return;
      }

      const responseText = `Based on the documents, the confidentiality carve-outs include information that is already public [SOURCE: 1234567890abcdef1234567890abcdef]. The governing law is typically Delaware [SOURCE: abcdef1234567890abcdef1234567890].`;
      
      const tokens = responseText.split(' ');
      
      for (let i = 0; i < tokens.length; i++) {
        sendEvent({ type: 'token', content: tokens[i] + (i < tokens.length - 1 ? ' ' : '') });
        await new Promise(r => setTimeout(r, 50));
      }
      
      sendEvent({
        type: 'citations',
        citations: [
          { uuid: '1234567890abcdef1234567890abcdef', filename: 'Acme_Corp_NDA_2023.pdf', verified: true },
          { uuid: 'abcdef1234567890abcdef1234567890', filename: 'Unknown', verified: false }
        ],
        cached: Math.random() > 0.5
      });
      
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
