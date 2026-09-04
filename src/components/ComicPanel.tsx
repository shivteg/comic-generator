'use client';

import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { Trash2 } from 'lucide-react';

interface TextBubble {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ComicPanel({ imageUrl }: { imageUrl: string | null }) {
  const [bubbles, setBubbles] = useState<TextBubble[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const addBubble = () => {
    setBubbles([
      ...bubbles,
      {
        id: Math.random().toString(36).substring(7),
        text: 'Enter text here...',
        x: 50,
        y: 50,
        width: 150,
        height: 100,
      },
    ]);
  };

  const removeBubble = (id: string) => {
    setBubbles(bubbles.filter((b) => b.id !== id));
  };

  const updateBubbleText = (id: string, newText: string) => {
    setBubbles(
      bubbles.map((b) => (b.id === id ? { ...b, text: newText } : b))
    );
  };

  if (!imageUrl) {
    return (
      <div className="w-full h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
        Generated comic will appear here
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={addBubble}
        className="self-start px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Add Text Bubble
      </button>

      <div 
        ref={containerRef}
        className="relative inline-block border-4 border-gray-900 rounded-md overflow-hidden max-w-full"
        style={{ width: 'fit-content' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Generated comic panel" className="max-w-full h-auto block" />

        {bubbles.map((bubble) => (
          <Rnd
            key={bubble.id}
            default={{
              x: bubble.x,
              y: bubble.y,
              width: bubble.width,
              height: bubble.height,
            }}
            bounds="parent"
            className="group absolute"
          >
            <div className="relative w-full h-full">
              <div className="w-full h-full bg-white border-2 border-black rounded-3xl p-3 shadow-md flex items-center justify-center relative">
                <textarea
                  className="w-full h-full resize-none border-none outline-none text-center bg-transparent text-black font-semibold font-sans"
                  value={bubble.text}
                  onChange={(e) => updateBubbleText(bubble.id, e.target.value)}
                  placeholder="Enter text..."
                />
                {/* Bubble tail (simple CSS triangle) */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-black"></div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white"></div>
              </div>
              
              <button
                onClick={() => removeBubble(bubble.id)}
                className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Rnd>
        ))}
      </div>
    </div>
  );
}
