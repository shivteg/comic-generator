import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    const systemPrompt = `You are an expert comic book script writer. 
The user wants a comic story based on this description: "${prompt}"

Break the story down into EXACTLY 5 panels. 
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

    const encodedPrompt = encodeURIComponent(systemPrompt);
    const response = await fetch(`https://text.pollinations.ai/prompt/${encodedPrompt}?json=true`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from LLM');
    }

    let textData = await response.text();
    
    // Clean up potential markdown formatting if the LLM hallucinated it
    textData = textData.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(textData);

    // Now format the image URLs for the frontend
    const panels = parsedData.panels.map((panel: any) => {
      const seed = Math.floor(Math.random() * 1000000);
      const encodedImgPrompt = encodeURIComponent(`comic book panel, highly detailed, colorful, ${panel.image_prompt}`);
      return {
        imageUrl: `https://image.pollinations.ai/prompt/${encodedImgPrompt}?width=800&height=800&nologo=true&seed=${seed}`,
        dialogues: panel.dialogues.map((d: string) => ({ text: d }))
      };
    });

    return NextResponse.json({ panels });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Failed to generate story panels. Please try again.' }, { status: 500 });
  }
}
