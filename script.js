document.addEventListener('DOMContentLoaded', () => {
    const playlistUrlInput = document.getElementById('playlist-url');
    const convertBtn = document.getElementById('convert-btn');
    const loader = document.getElementById('loader');
    const loadingStatus = document.getElementById('loading-status');
    const results = document.getElementById('results');
    const playlistNameEl = document.getElementById('playlist-name');
    const resultsListEl = document.getElementById('results-list');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const copyAllBtn = document.getElementById('copy-all-btn');
    const playFirstBtn = document.getElementById('play-first-btn');
  
    const API_BASE_URL = 'http://localhost:3000/api'; 
  
    convertBtn.addEventListener('click', async () => {
      const playlistUrl = playlistUrlInput.value.trim();
      
      if (!playlistUrl) {
        alert('Please enter a Spotify playlist URL');
        return;
      }
      
      loader.style.display = 'flex';
      results.style.display = 'none';
      loadingStatus.textContent = 'Loading playlist...';
      
      try {
        // Fetch playlist tracks from Spotify
        const playlistData = await fetchPlaylistTracks(playlistUrl);
        
        if (!playlistData || !playlistData.tracks) {
          throw new Error('Failed to fetch playlist data');
        }
        
        // Update UI with playlist name
        playlistNameEl.textContent = playlistData.playlistName;
        resultsListEl.innerHTML = '';
        
        // Configure progress bar
        const totalTracks = playlistData.tracks.length;
        let completedTracks = 0;
        progressText.textContent = `0/${totalTracks} tracks converted`;
        
        // Process each track to find YouTube links
        const youtubeLinks = [];
        
        for (const track of playlistData.tracks) {
          loadingStatus.textContent = `Searching YouTube for "${track.name}"`;
          
          try {
            // Find YouTube link for the track
            const youtubeData = await searchYouTube(track.searchQuery);
            
            // Create track element
            const trackItemEl = document.createElement('div');
            trackItemEl.className = 'track-item';
            
            const trackInfoEl = document.createElement('div');
            trackInfoEl.className = 'track-info';
            
            const trackNameEl = document.createElement('div');
            trackNameEl.className = 'track-name';
            trackNameEl.textContent = track.name;
            
            const trackArtistEl = document.createElement('div');
            trackArtistEl.className = 'track-artist';
            trackArtistEl.textContent = track.artists;
            
            trackInfoEl.appendChild(trackNameEl);
            trackInfoEl.appendChild(trackArtistEl);
            
            const youtubeLinkEl = document.createElement('a');
            youtubeLinkEl.className = 'youtube-link';
            youtubeLinkEl.href = youtubeData.url;
            youtubeLinkEl.target = '_blank';
            youtubeLinkEl.textContent = 'Play on YouTube';
            
            trackItemEl.appendChild(trackInfoEl);
            trackItemEl.appendChild(youtubeLinkEl);
            
            resultsListEl.appendChild(trackItemEl);
            
            // Add link to the array
            youtubeLinks.push(youtubeData.url);
            
          } catch (error) {
            console.error(`Error finding YouTube link for "${track.name}":`, error);
            
            // Create element for tracks without links
            const trackItemEl = document.createElement('div');
            trackItemEl.className = 'track-item';
            
            const trackInfoEl = document.createElement('div');
            trackInfoEl.className = 'track-info';
            
            const trackNameEl = document.createElement('div');
            trackNameEl.className = 'track-name';
            trackNameEl.textContent = track.name;
            
            const trackArtistEl = document.createElement('div');
            trackArtistEl.className = 'track-artist';
            trackArtistEl.textContent = track.artists;
            
            trackInfoEl.appendChild(trackNameEl);
            trackInfoEl.appendChild(trackArtistEl);
            
            const errorEl = document.createElement('span');
            errorEl.textContent = 'Could not find match';
            errorEl.style.color = '#ff6b6b';
            
            trackItemEl.appendChild(trackInfoEl);
            trackItemEl.appendChild(errorEl);
            
            resultsListEl.appendChild(trackItemEl);
          }
          
          // Update progress
          completedTracks++;
          const progressPercentage = (completedTracks / totalTracks) * 100;
          progressBar.style.width = `${progressPercentage}%`;
          progressText.textContent = `${completedTracks}/${totalTracks} tracks converted`;
        }
        
        // Show copy all and play first buttons if we have links
        if (youtubeLinks.length > 0) {
          copyAllBtn.classList.remove('hidden');
          playFirstBtn.classList.remove('hidden');
          
          // Set up copy all button
          copyAllBtn.addEventListener('click', () => {
            const linksText = youtubeLinks.join('\n');
            navigator.clipboard.writeText(linksText)
              .then(() => {
                const originalText = copyAllBtn.textContent;
                copyAllBtn.textContent = 'Copied!';
                setTimeout(() => {
                  copyAllBtn.textContent = originalText;
                }, 2000);
              })
              .catch(err => {
                console.error('Failed to copy links:', err);
                alert('Failed to copy links to clipboard');
              });
          });
          
          // Set up play first button
          playFirstBtn.addEventListener('click', () => {
            window.open(youtubeLinks[0], '_blank');
          });
        }
        
        // Hide loader and show results
        loader.style.display = 'none';
        results.style.display = 'block';
        
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred: ' + error.message);
        loader.style.display = 'none';
      }
    });
    
    // Function to fetch playlist tracks from Spotify
    async function fetchPlaylistTracks(playlistUrl) {
      try {
        const response = await fetch(`${API_BASE_URL}/get-playlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ playlistUrl })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch playlist');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching playlist:', error);
        throw error;
      }
    }
    
    // Function to search YouTube for a track
    async function searchYouTube(searchQuery) {
      try {
        const response = await fetch(`${API_BASE_URL}/search-youtube`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ searchQuery })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to search YouTube');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error searching YouTube:', error);
        throw error;
      }
    }
  });