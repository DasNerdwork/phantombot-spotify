#!/usr/local/bin/python3.10
import sys
import re
import spotipy
from spotipy.oauth2 import SpotifyOAuth

# Spotify API Credentials
SPOTIFY_CLIENT_ID = "**REDACTED**"
SPOTIFY_CLIENT_SECRET = "**REDACTED**"
SPOTIFY_REDIRECT_URI = "**REDACTED**"

# Spotipy Authentifizierung
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=SPOTIFY_CLIENT_ID,
    client_secret=SPOTIFY_CLIENT_SECRET,
    redirect_uri=SPOTIFY_REDIRECT_URI,
    scope="user-modify-playback-state",
    cache_path="/home/botuser/phantombot2/scripts/custom/.spotify_cache"
))

def extract_spotify_id(url):
    """ Extrahiert die Track-ID aus einer Spotify-URL """
    match = re.search(r"track/([a-zA-Z0-9]+)", url)
    return match.group(1) if match else None

def add_to_queue(spotify_url, username):
    """ Fügt einen Song zur Spotify-Warteschlange hinzu """
    track_id = extract_spotify_id(spotify_url)
    if not track_id:
        print("❌ Ungültiger Spotify-Link von " + username)
        return

    try:
        # Song zur Queue hinzufügen
        sp.add_to_queue(f"spotify:track:{track_id}")

        # Song-Details abrufen
        track_info = sp.track(track_id)
        track_name = track_info["name"]
        artist_name = track_info["artists"][0]["name"]

        print(f"✅ {username} hat den Song '{track_name}' von {artist_name} zur Warteschlange hinzugefügt!")
    except Exception as e:
        print(f"❌ Fehler beim Hinzufügen des Songs von {username}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("❌ Fehler: Benötigt einen Spotify-Link und einen Benutzernamen!")
        sys.exit(1)

    spotify_url = sys.argv[1]
    username = sys.argv[2]
    add_to_queue(spotify_url, username)
