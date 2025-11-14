import React, { useState } from 'react';
import { Download, Music } from 'lucide-react';

export default function App() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csvData, setCsvData] = useState('');

  // Replace these with your actual Spotify API credentials
  const CLIENT_ID = env.CLIENT_ID;
  const CLIENT_SECRET = env.CLIENT_SECRET;

  const extractPlaylistId = (url) => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const fetchPlaylist = async () => {
    setError('');
    setCsvData('');
    setLoading(true);

    try {
      const playlistId = extractPlaylistId(playlistUrl);
      if (!playlistId) {
        throw new Error('Invalid Spotify playlist URL');
      }

      // Get access token using client credentials flow
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to authenticate with Spotify. Please check your API credentials.');
      }

      const { access_token } = await tokenResponse.json();

      // Fetch playlist data
      const playlistResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (!playlistResponse.ok) {
        throw new Error('Failed to fetch playlist. Make sure the playlist is public.');
      }

      const data = await playlistResponse.json();
      
      // Convert to CSV
      const csv = convertToCSV(data);
      setCsvData(csv);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (playlist) => {
    const headers = ['Track Name', 'Artist(s)', 'Album', 'Duration (ms)', 'Added At', 'Track URL'];
    const rows = playlist.tracks.items.map(item => {
      const track = item.track;
      return [
        track.name,
        track.artists.map(a => a.name).join(', '),
        track.album.name,
        track.duration_ms,
        item.added_at,
        track.external_urls.spotify
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  const downloadCSV = () => {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spotify-playlist.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Music className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-800">
            Spotify Playlist to CSV
          </h1>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Enter a Spotify playlist URL to convert it to CSV format.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Setup Required:</strong> Replace CLIENT_ID and CLIENT_SECRET in App.jsx
              <ol className="list-decimal ml-5 mt-2 space-y-1">
                <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Spotify Developer Dashboard</a></li>
                <li>Create an app and get your Client ID and Client Secret</li>
                <li>Replace the values at the top of App.jsx</li>
              </ol>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={fetchPlaylist}
            disabled={loading || !playlistUrl}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Converting...' : 'Convert to CSV'}
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
                className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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