from flask import Flask,request, jsonify
from flask_cors import CORS
import requests
import os
import io

app = Flask(__name__)
CORS(app)

CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')

def extract_playlist_id(url):
    import re
    match = re.search(r'playlist/([a-zA-Z0-9]+)', url)
    return match.group(1) if match else None

@app.get("api/playlist")
def get_playlist():
    playlist_url=request.args.get('url')
    playlist_id=extract_playlist_id(playlist_url)
    if not playlist_id:
        return jsonify({"error": "Invalid Spotify playlist URL"}), 400
    #get token
    token_response=requests.post('https://accounts.spotify.com/api/token',data={
        data={"grant_type":"client_credentials"},
        auth=(CLIENT_ID,CLIENT_SECRET)})
    if token_res.status_code!=200:
        return jsonify({"error": "Failed to authenticate with Spotify"}), 500
    access_token=token_res.json().get('access_token')

    #get playlist
    playlist_res=requests.get(f'https://api.spotify.com/v1/playlists/{playlist_id}',headers={"Authorization":f"Bearer {access_token}"})
    if playlist_res.status_code!=200:
        return jsonify({"error": "Failed to fetch playlist from Spotify"}), 500
    playlist_data=playlist_res.json()

    #conver to csv
    output=io.StringIO()
    writer=csv.writer(output)
    writer.writerow(['Track Name','Artist(s)','Album','Duration (ms)',' URL'])
    for item in playlist_data['tracks']['items']:
        track = item['track']
        writer.writerow([
            track['name'],
            ', '.join(artist['name'] for artist in track['artists']),
            track['album']['name'],
            track['duration_ms'],
            track['external_urls']['spotify']
        ])
    return jsonify({"csv":output.getvalue()})