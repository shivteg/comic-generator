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
  bubbleShape?: 'speech' | 'thought' | 'action' | 'narrator';
  font?: 'comic-neue' | 'bangers' | 'indie-flower';
}

export default function ComicPanel({ 
  imageUrl, 
  initialBubbles = [] 
}: { 
  imageUrl: string | null;
  initialBubbles?: { text: string }[];
}) {
  const [bubbles, setBubbles] = useState<TextBubble[]>(
    initialBubbles.map((b, index) => ({
      id: `initial-bubble-${index}`,
      text: b.text,
      x: 50 + (index * 20),
      y: 50 + (index * 20),
      width: 150,
      height: 100,
      bubbleShape: 'speech',
      font: 'comic-neue',
    }))
  );
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
        bubbleShape: 'speech',
        font: 'comic-neue',
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

  const updateBubbleStyle = (id: string, updates: Partial<TextBubble>) => {
    setBubbles(
      bubbles.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const [retryCount, setRetryCount] = useState(0);

  if (!imageUrl) {
    return (
      <div className="w-full h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
        Generated comic will appear here
      </div>
    );
  }

  // Add a cache-buster to the URL when retrying to bypass browser cache
  let currentImageUrl = imageUrl;
  if (retryCount > 0) {
    if (imageUrl.startsWith('data:')) {
      // Data URIs don't need cache busting and adding params breaks them
      currentImageUrl = imageUrl;
    } else if (imageUrl.includes('pollinations.ai')) {
      // For pollinations, modify the seed predictably using retryCount to force a new generation attempt
      currentImageUrl = imageUrl.replace(/seed=(\d+)/, (match, p1) => `seed=${parseInt(p1) + retryCount}`) + `&retry=${retryCount}`;
    } else if (imageUrl.includes('?')) {
      currentImageUrl = `${imageUrl}&retry=${retryCount}`;
    } else {
      currentImageUrl = `${imageUrl}?retry=${retryCount}`;
    }
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
        className="relative inline-block border-4 border-gray-900 rounded-md overflow-hidden max-w-full min-h-[400px] min-w-[400px] bg-gray-100 flex items-center justify-center"
        style={{ width: 'fit-content' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={currentImageUrl} 
          alt="Generated comic panel" 
          className="max-w-full h-auto block" 
          onError={() => {
            if (retryCount < 10) {
              setTimeout(() => setRetryCount(r => r + 1), 1000);
            }
          }}
        />

        {bubbles.map((bubble) => {
          let shapeClasses = "bg-white border-[3px] border-black rounded-[2rem] p-4 flex items-center justify-center relative shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-10 transition-transform";
          let tailHtml = (
            <>
              <div className="absolute -bottom-[14px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[14px] border-t-black"></div>
              <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[12px] border-t-white"></div>
            </>
          );
          
          if (bubble.bubbleShape === 'thought') {
            shapeClasses = "bg-white border-[3px] border-black rounded-[50%] p-4 flex items-center justify-center relative shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-10 transition-transform";
            tailHtml = (
              <>
                <div className="absolute -bottom-4 left-1/2 -translate-x-4 w-4 h-4 bg-white border-[3px] border-black rounded-full"></div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-8 w-2 h-2 bg-white border-[2px] border-black rounded-full"></div>
              </>
            );
          } else if (bubble.bubbleShape === 'action') {
            // Jagged/Spiky look, we simulate with a very square look or rotated box if possible, but rounded-none with thick border is easiest for now.
            shapeClasses = "bg-yellow-300 border-[4px] border-red-600 rounded-none p-4 flex items-center justify-center relative shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-10 transition-transform skew-x-3";
            tailHtml = (
              <>
                <div className="absolute -bottom-[20px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[20px] border-t-red-600"></div>
                <div className="absolute -bottom-[12px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-yellow-300"></div>
              </>
            );
          } else if (bubble.bubbleShape === 'narrator') {
            shapeClasses = "bg-yellow-100 border-[3px] border-black p-4 flex items-center justify-center relative shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-10 transition-transform rounded-sm";
            tailHtml = <></>; // Narrator boxes don't have tails
          }

          let fontFamilyVar = 'var(--font-comic-neue)';
          if (bubble.font === 'bangers') fontFamilyVar = 'var(--font-bangers)';
          if (bubble.font === 'indie-flower') fontFamilyVar = 'var(--font-indie-flower)';

          return (
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
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              
              {/* Controls bar (always visible but faded until hover) */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-md flex gap-2 p-1 opacity-70 group-hover:opacity-100 transition-opacity z-30">
                <select 
                  className="bg-transparent text-xs outline-none cursor-pointer p-1"
                  value={bubble.bubbleShape || 'speech'}
                  onChange={(e) => updateBubbleStyle(bubble.id, { bubbleShape: e.target.value as TextBubble['bubbleShape'] })}
                >
                  <option className="text-black" value="speech">Speech</option>
                  <option className="text-black" value="thought">Thought</option>
                  <option className="text-black" value="action">Action</option>
                  <option className="text-black" value="narrator">Narrator</option>
                </select>
                
                <select 
                  className="bg-transparent text-xs outline-none cursor-pointer p-1 border-l border-gray-700"
                  value={bubble.font || 'comic-neue'}
                  onChange={(e) => updateBubbleStyle(bubble.id, { font: e.target.value as TextBubble['font'] })}
                >
                  <option className="text-black" value="comic-neue">Comic Neue</option>
                  <option className="text-black" value="bangers">Bangers</option>
                  <option className="text-black" value="indie-flower">Indie Flower</option>
                </select>
              </div>

              <div className={shapeClasses}>
                <textarea
                  className="w-full h-full resize-none border-none outline-none text-center bg-transparent text-black font-bold uppercase leading-tight flex items-center justify-center overflow-hidden"
                  style={{ fontFamily: fontFamilyVar, fontSize: '1.2rem' }}
                  value={bubble.text}
                  onChange={(e) => updateBubbleText(bubble.id, e.target.value)}
                  placeholder="ENTER TEXT..."
                />
                {tailHtml}
              </div>
              
              <button
                onClick={() => removeBubble(bubble.id)}
                className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full opacity-70 group-hover:opacity-100 transition-opacity z-30 hover:bg-red-600 hover:scale-110 transform"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Rnd>
        )})}
      </div>
    </div>
  );
}
