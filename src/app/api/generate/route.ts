import { NextResponse } from 'next/server';
import { getCloudflareCredentials } from '@/lib/cloudflare';

export async function POST(request: Request) {
  const { prompt, panelCount = 5 } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    const systemPrompt = `You are an expert comic book script writer. 
The user wants a comic story based on this description: "${prompt}"

Break the story down into EXACTLY ${panelCount} panels. 
For each panel, write a highly descriptive visual prompt for an AI image generator.
Also write the dialogue (text bubbles) for the characters in that panel. If there is no dialogue, provide a narration text.

You MUST respond ONLY with a valid JSON object in this exact format, with no markdown formatting, no code blocks, and no extra text:
{
  "panels": [
    {
      "image_prompt": "A highly detailed, colorful comic book panel of...",
      "dialogues": ["Text for bubble 1", "Text for bubble 2"]
    }
  ]
}`;

    let textData = "";
    
    try {
      const { accountId, apiToken } = getCloudflareCredentials();
      const model = '@cf/meta/llama-3-8b-instruct';
      const textResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ]
          }),
        }
      );
      
      if (textResponse.ok) {
        const textJson = await textResponse.json();
        textData = textJson.result.response;
        // Strip markdown if Llama returned it
        textData = textData.replace(/```json/gi, '').replace(/```/g, '').trim();
      } else {
        console.error("Cloudflare text API failed:", await textResponse.text());
      }
    } catch (e) {
      console.error("Fetch failed:", e);
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(textData);
      if (!parsedData.panels) throw new Error("No panels array");
    } catch {
      console.error('LLM API failed or returned invalid JSON. Using fallback story.');
      
      const fallbackPanels = [];
      for (let i = 0; i < panelCount; i++) {
        fallbackPanels.push({
          image_prompt: `Panel ${i+1} illustrating: ${prompt}`,
          dialogues: [`Fallback dialogue for panel ${i+1}...`]
        });
      }
      
      parsedData = {
        panels: fallbackPanels
      };
    }

    // Generate images in parallel using Cloudflare AI
    const panels = await Promise.all(parsedData.panels.map(async (panel: { image_prompt: string; dialogues: string[] }) => {
      let imageUrl = "";
      
      try {
        const { accountId, apiToken } = getCloudflareCredentials(); // Rotate key for each image
        const imgModel = '@cf/lykon/dreamshaper-8-lcm'; 
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${imgModel}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: `comic book panel, highly detailed, colorful, ${panel.image_prompt}`,
            }),
          }
        );

        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          const base64Image = Buffer.from(imageBuffer).toString('base64');
          imageUrl = `data:image/jpeg;base64,${base64Image}`;
        } else {
          console.error('Cloudflare Image API Error:', await response.text());
          // Fallback to pollinations if cloudflare fails
          const seed = Math.floor(Math.random() * 1000000);
          const encodedImgPrompt = encodeURIComponent(`comic book panel, highly detailed, colorful, ${panel.image_prompt}`);
          imageUrl = `https://image.pollinations.ai/prompt/${encodedImgPrompt}?width=800&height=800&nologo=true&seed=${seed}`;
        }
      } catch (e) {
        console.error('Cloudflare Image Fetch Error:', e);
        // Fallback to pollinations
        const seed = Math.floor(Math.random() * 1000000);
        const encodedImgPrompt = encodeURIComponent(`comic book panel, highly detailed, colorful, ${panel.image_prompt}`);
        imageUrl = `https://image.pollinations.ai/prompt/${encodedImgPrompt}?width=800&height=800&nologo=true&seed=${seed}`;
      }

      return {
        imageUrl,
        dialogues: panel.dialogues.map((d: string) => ({ text: d }))
      };
    }));

    return NextResponse.json({ panels });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Failed to generate story panels. Please try again.' }, { status: 500 });
  }
}
