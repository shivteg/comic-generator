'use client';

import { useState } from 'react';
import ComicPanel from '@/components/ComicPanel';

interface PanelData {
  imageUrl: string;
  dialogues: { text: string }[];
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [panelCount, setPanelCount] = useState(5);
  const [panels, setPanels] = useState<PanelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateComic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setPanels([]); // clear old panels

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, panelCount }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setPanels(data.panels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportComic = async () => {
    const element = document.getElementById('comic-export-area');
    if (!element) return;
    
    // We can use dynamic import so it doesn't break SSR
    const html2canvas = (await import('html2canvas')).default;
    
    // Temporarily hide UI elements we don't want in the export
    // like the "Add Text Bubble" buttons and delete buttons
    const exportElements = element.querySelectorAll('.group-hover\\:opacity-100, button');
    const originalStyles: string[] = [];
    exportElements.forEach((el, i) => {
      originalStyles[i] = (el as HTMLElement).style.display;
      (el as HTMLElement).style.display = 'none';
    });

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        backgroundColor: '#ffffff',
        scale: 2 // Higher resolution
      });
      
      const image = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = 'my-ai-comic.jpg';
      link.click();
    } catch (err) {
      console.error('Error exporting comic:', err);
      alert('Failed to export comic. Please try again.');
    } finally {
      // Restore elements
      exportElements.forEach((el, i) => {
        (el as HTMLElement).style.display = originalStyles[i];
      });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            AI Comic Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Describe your scene, and our AI will automatically write a {panelCount}-panel story, generate the art, and place the editable text bubbles for you!
          </p>
        </header>

        <form onSubmit={generateComic} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
              Story Prompt
            </label>
            <textarea
              id="prompt"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="A superhero soaring through a neon-lit cyberpunk city, fighting shadow monsters..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
            </div>
            <div className="w-24">
              <label htmlFor="panelCount" className="block text-sm font-medium text-gray-700 mb-1">
                Panels
              </label>
              <input
                id="panelCount"
                type="number"
                min="1"
                max="20"
                value={panelCount}
                onChange={(e) => setPanelCount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full bg-black text-white py-3 px-4 rounded-md font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Writing Story & Generating Art...
              </>
            ) : (
              `Generate ${panelCount}-Page Comic`
            )}
          </button>
          
          {error && (
            <div className="text-red-500 text-sm mt-2 font-medium bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </form>

        {panels.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-2xl font-bold text-center">Your Comic Story</h2>
              <button
                onClick={exportComic}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-md flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download Comic
              </button>
            </div>
            
            <div id="comic-export-area" className="space-y-12 bg-gray-50 p-8 rounded-xl">
              {panels.map((panel, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-500 mb-4 uppercase tracking-wider">Panel {index + 1}</h3>
                  <ComicPanel imageUrl={panel.imageUrl} initialBubbles={panel.dialogues} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
