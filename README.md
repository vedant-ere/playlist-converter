# Spotify to YouTube Converter

A web application that converts Spotify playlists to YouTube links. Extract track information from any public Spotify playlist and find corresponding videos on YouTube.

## Features

- Convert any public Spotify playlist to YouTube links
- Real-time conversion progress tracking
- Filter and view conversion results
- Export results in multiple formats (TXT, CSV, JSON)
- No login required - works with public playlists only
- Responsive design for desktop and mobile

## Prerequisites

- Node.js (v14 or higher)
- Spotify Client ID and Secret
- YouTube Data API v3 Key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/spotify-to-youtube-converter.git
cd spotify-to-youtube-converter
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
YOUTUBE_API_KEY=your_youtube_api_key
PORT=3000
```

4. Start the server:
```bash
node server.js
```

5. Open your browser and navigate to `http://localhost:3000`

## API Setup

### Spotify API
1. Go to [Spotify for Developers](https://developer.spotify.com/)
2. Create a new app and get your Client ID and Client Secret
3. No redirect URIs needed for this application

### YouTube Data API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)

## Usage

1. Copy any public Spotify playlist URL
2. Paste it into the input field
3. Click "Convert Playlist"
4. View results and export if needed

## File Structure

```
├── server.js          # Express server and API endpoints
├── script.js          # Frontend JavaScript
├── index.html         # Main HTML file
├── style.css          # Stylesheet
├── package.json       # Dependencies
└── .env              # Environment variables
```

## API Endpoints

- `POST /api/get-playlist` - Fetch Spotify playlist tracks
- `POST /api/search-youtube` - Search YouTube for tracks

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This tool is for educational purposes only. Respect the terms of service of both Spotify and YouTube APIs. The application does not store any user data or playlist information.
