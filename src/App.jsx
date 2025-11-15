import React, { useState } from 'react';
import { Download, Music } from 'lucide-react';

export default function App() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csvData, setCsvData] = useState('');

  // Extract playlist ID (optional - Flask can also parse directly)
  const extractPlaylistId = (url) => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  // 🔥 Main function that now calls Flask (not Spotify)
  const fetchPlaylist = async () => {
    setError('');
    setCsvData('');
    setLoading(true);

    try {
      const playlistId = extractPlaylistId(playlistUrl);
      if (!playlistId) throw new Error("Invalid Spotify playlist URL");

      const response = await fetch(
        `/api/playlist?url=${encodeURIComponent(playlistUrl)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process playlist");
      }

      setCsvData(data.csv);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spotify-playlist.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Music className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-800">Spotify Playlist to CSV</h1>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Enter a Spotify playlist URL to convert it to CSV format.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              Backend handles all Spotify API calls securely.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          <button
            onClick={fetchPlaylist}
            disabled={loading || !playlistUrl}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 transition"
          >
            {loading ? "Converting..." : "Convert to CSV"}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {csvData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 mb-3">✓ Conversion successful!</p>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="w-5 h-5" />
                Download CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
