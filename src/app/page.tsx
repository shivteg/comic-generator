'use client';

import { useState } from 'react';
import ComicPanel from '@/components/ComicPanel';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateComic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
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
            Describe your scene, and we'll generate a colorful comic book panel. 
            You can then add editable text bubbles to bring your story to life!
          </p>
        </header>

        <form onSubmit={generateComic} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
              Scene Description
            </label>
            <textarea
              id="prompt"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="A superhero soaring through a neon-lit cyberpunk city, action-packed..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
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
                Generating...
              </>
            ) : (
              'Generate Comic Panel'
            )}
          </button>
          
          {error && (
            <div className="text-red-500 text-sm mt-2 font-medium bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </form>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Your Comic</h2>
          <ComicPanel imageUrl={imageUrl} />
        </div>
      </div>
    </main>
  );
}
