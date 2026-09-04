import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return NextResponse.json(
      { error: 'Cloudflare credentials are not configured.' },
      { status: 500 }
    );
  }

  try {
    // Using Dreamshaper model which is good for colorful/comic style
    const model = '@cf/lykon/dreamshaper-8-lcm'; 
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `comic book panel, highly detailed, colorful, ${prompt}`,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudflare AI Error:', errorText);
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }

    // Cloudflare AI returns the image as binary data
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    return NextResponse.json({ 
      imageUrl: `data:image/jpeg;base64,${base64Image}`
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
