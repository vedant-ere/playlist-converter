require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors"); // To allow cross-origin requests

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow front-end to access this server
app.use(express.json()); // Parse incoming JSON request bodies
app.use(express.static("../")); // Serve static files 

const axios = require("axios");
const qs = require("querystring");

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let spotifyToken = null;
let tokenExpiry = null;

async function getSpotifyToken() {
  // check if the token is still valid
  if (spotifyToken && tokenExpiry > Date.now()) {
    return spotifyToken;
  }

  try {
    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          new Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET).toString("base64"),
      },
      data: qs.stringify({
        grant_type: "client_credentials",
      }),
    });

    spotifyToken = response.data.access_token;

    tokenExpiry = Date.now() + response.data.expires_in * 1000;
    return spotifyToken;
  } catch (error) {
    console.error("Error getting Spotify token:", error.message);
    throw error;
  }
}

function extractPlaylistId(url) {
  const regex = /playlist\/([a-zA-Z0-9]+)(\?|$)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
//* Getting playlists tracks from spotify

app.post('/api/get-playlist', async (req, res) => {
  try {
    const { playlistUrl } = req.body;
    const playlistId = extractPlaylistId(playlistUrl);
    
    if (!playlistId) {
      return res.status(400).json({ error: 'Invalid Spotify playlist URL' });
    }

    const token = await getSpotifyToken();
    
    // First, get the playlist details
    const playlistResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const playlistName = playlistResponse.data.name;
    const playlistTracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    
    // Get all tracks with pagination
    while (nextUrl) {
      const tracksResponse = await axios.get(nextUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const tracks = tracksResponse.data.items.map(item => {
        if (item.track) {
          return {
            name: item.track.name,
            artists: item.track.artists.map(artist => artist.name).join(', '),
            searchQuery: `${item.track.name} ${item.track.artists.map(artist => artist.name).join(' ')}`
          };
        }
        return null;
      }).filter(Boolean);
      
      playlistTracks.push(...tracks);
      nextUrl = tracksResponse.data.next;
    }

    res.json({
      playlistName,
      tracks: playlistTracks
    });
  } catch (error) {
    console.error('Error getting playlist:', error.message);
    res.status(500).json({ error: 'Failed to get playlist' });
  }
});

app.post('/api/search-youtube', async (req, res) => {
  try {
    const { searchQuery } = req.body;
    
    // Search YouTube
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        maxResults: 1,
        q: searchQuery,
        type: 'video',
        key: process.env.YOUTUBE_API_KEY
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      const videoId = response.data.items[0].id.videoId;
      const title = response.data.items[0].snippet.title;
      res.json({
        videoId,
        title,
        url: `https://www.youtube.com/watch?v=${videoId}`
      });
    } else {
      res.json({ error: 'No results found' });
    }
  } catch (error) {
    console.error('Error searching YouTube:', error.message);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
