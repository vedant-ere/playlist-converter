document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const playlistUrlInput = document.getElementById('playlist-url');
    const convertBtn = document.getElementById('convert-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const loader = document.getElementById('loader');
    const loadingStatus = document.getElementById('loading-status');
    const results = document.getElementById('results');
    const playlistNameEl = document.getElementById('playlist-name');
    const playlistMetaEl = document.getElementById('playlist-meta');
    const resultsListEl = document.getElementById('results-list');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const successRate = document.getElementById('success-rate');
    const copyAllBtn = document.getElementById('copy-all-btn');
    const createYouTubePlaylistBtn = document.getElementById('create-youtube-playlist-btn');
    const exportSection = document.getElementById('export-section');
    const successToast = document.getElementById('success-toast');
    const errorToast = document.getElementById('error-toast');
    
    // Filter and view controls
    const filterBtns = document.querySelectorAll('.filter-btn');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const countAll = document.getElementById('count-all');
    const countFound = document.getElementById('count-found');
    const countNotFound = document.getElementById('count-not-found');
    
    // Export buttons
    const exportTxtBtn = document.getElementById('export-txt-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');
    
    // const API_BASE_URL = 'http://localhost:3000/api';
    const API_BASE_URL = 'https://playlist-converter-3008.onrender.com/api';

    
    // Global variables to store playlist data
    let currentPlaylistData = null;
    let youtubeLinks = [];
    let trackResults = [];
    let currentFilter = 'all';
    let currentView = 'list';
    
    // Initialize event listeners
    initializeEventListeners();
    
    function initializeEventListeners() {
        // Main functionality
        convertBtn.addEventListener('click', handleConvert);
        pasteBtn.addEventListener('click', handlePaste);
        
        // Filter controls
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => handleFilter(e.target.dataset.filter));
        });
        
        // View controls
        gridViewBtn.addEventListener('click', () => switchView('grid'));
        listViewBtn.addEventListener('click', () => switchView('list'));
        
        // Action buttons
        copyAllBtn.addEventListener('click', handleCopyAll);
        createYouTubePlaylistBtn.addEventListener('click', handleCreateYouTubePlaylist);
        
        // Export buttons
        exportTxtBtn.addEventListener('click', () => handleExport('txt'));
        exportCsvBtn.addEventListener('click', () => handleExport('csv'));
        exportJsonBtn.addEventListener('click', () => handleExport('json'));
        
        // Input validation
        playlistUrlInput.addEventListener('input', validateUrl);
        playlistUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleConvert();
        });
    }
    
    async function handlePaste() {
        try {
            const text = await navigator.clipboard.readText();
            playlistUrlInput.value = text;
            validateUrl();
            showToast('Pasted from clipboard!', 'success');
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            showToast('Failed to paste from clipboard', 'error');
        }
    }
    
    function validateUrl() {
        const url = playlistUrlInput.value.trim();
        const isValid = url.includes('spotify.com/playlist/');
        convertBtn.disabled = !isValid;
        
        if (url && !isValid) {
            playlistUrlInput.classList.add('error');
        } else {
            playlistUrlInput.classList.remove('error');
        }
    }
    
    async function handleConvert() {
        const playlistUrl = playlistUrlInput.value.trim();
        
        if (!playlistUrl) {
            showToast('Please enter a Spotify playlist URL', 'error');
            return;
        }
        
        // Reset state
        youtubeLinks = [];
        trackResults = [];
        currentPlaylistData = null;
        
        // Show loading state
        showLoader();
        convertBtn.classList.add('loading');
        
        try {
            // Fetch playlist tracks from Spotify
            loadingStatus.textContent = 'Loading playlist from Spotify...';
            const playlistData = await fetchPlaylistTracks(playlistUrl);
            
            if (!playlistData || !playlistData.tracks) {
                throw new Error('Failed to fetch playlist data');
            }
            
            currentPlaylistData = playlistData;
            
            // Update UI with playlist info
            playlistNameEl.textContent = playlistData.playlistName;
            playlistMetaEl.textContent = `${playlistData.tracks.length} tracks`;
            resultsListEl.innerHTML = '';
            
            // Configure progress
            const totalTracks = playlistData.tracks.length;
            let completedTracks = 0;
            let foundTracks = 0;
            
            updateProgress(0, totalTracks, 0);
            
            // Process each track
            for (let i = 0; i < playlistData.tracks.length; i++) {
                const track = playlistData.tracks[i];
                loadingStatus.textContent = `Searching YouTube for "${track.name}" (${i + 1}/${totalTracks})`;
                
                try {
                    // Add delay to avoid rate limiting
                    if (i > 0) await sleep(200);
                    
                    const youtubeData = await searchYouTube(track.searchQuery);
                    
                    const trackResult = {
                        ...track,
                        youtubeUrl: youtubeData.url,
                        youtubeTitle: youtubeData.title,
                        videoId: youtubeData.videoId,
                        found: true
                    };
                    
                    trackResults.push(trackResult);
                    youtubeLinks.push(youtubeData.url);
                    foundTracks++;
                    
                } catch (error) {
                    console.error(`Error finding YouTube link for "${track.name}":`, error);
                    
                    const trackResult = {
                        ...track,
                        found: false,
                        error: error.message
                    };
                    
                    trackResults.push(trackResult);
                }
                
                completedTracks++;
                updateProgress(completedTracks, totalTracks, foundTracks);
                updateResultsList();
            }
            
            // Show action buttons if we have results
            if (youtubeLinks.length > 0) {
                copyAllBtn.classList.remove('hidden');
                createYouTubePlaylistBtn.classList.remove('hidden');
                exportSection.classList.remove('hidden');
            }
            
            // Update counts
            updateFilterCounts();
            
            // Hide loader and show results
            hideLoader();
            results.style.display = 'block';
            
            // Scroll to results
            results.scrollIntoView({ behavior: 'smooth' });
            
            showToast(`Conversion complete! Found ${foundTracks}/${totalTracks} tracks on YouTube`, 'success');
            
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred: ' + error.message, 'error');
            hideLoader();
        } finally {
            convertBtn.classList.remove('loading');
        }
    }
    
    function updateProgress(completed, total, found) {
        const progressPercentage = (completed / total) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `${completed}/${total} tracks processed`;
        
        if (completed > 0) {
            const successPercentage = Math.round((found / completed) * 100);
            successRate.textContent = `${successPercentage}% success rate`;
        }
    }
    
    function updateResultsList() {
        const filteredResults = getFilteredResults();
        resultsListEl.innerHTML = '';
        
        filteredResults.forEach((track, index) => {
            const trackElement = createTrackElement(track, index);
            resultsListEl.appendChild(trackElement);
        });
        
        // Update view class
        resultsListEl.className = `results-list ${currentView}-view`;
    }
    
    function createTrackElement(track, index) {
        const trackEl = document.createElement('div');
        trackEl.className = `track-item ${track.found ? 'found' : 'not-found'}`;
        trackEl.dataset.index = index;
        
        const trackInfo = document.createElement('div');
        trackInfo.className = 'track-info';
        
        const trackNumber = document.createElement('div');
        trackNumber.className = 'track-number';
        trackNumber.textContent = index + 1;
        
        const trackDetails = document.createElement('div');
        trackDetails.className = 'track-details';
        
        const trackName = document.createElement('div');
        trackName.className = 'track-name';
        trackName.textContent = track.name;
        
        const trackArtist = document.createElement('div');
        trackArtist.className = 'track-artist';
        trackArtist.textContent = track.artists;
        
        trackDetails.appendChild(trackName);
        trackDetails.appendChild(trackArtist);
        
        trackInfo.appendChild(trackNumber);
        trackInfo.appendChild(trackDetails);
        
        const trackActions = document.createElement('div');
        trackActions.className = 'track-actions';
        
        if (track.found) {
            const statusIcon = document.createElement('div');
            statusIcon.className = 'status-icon success';
            statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            
            const playBtn = document.createElement('a');
            playBtn.className = 'play-btn';
            playBtn.href = track.youtubeUrl;
            playBtn.target = '_blank';
            playBtn.innerHTML = '<i class="fab fa-youtube"></i> Play';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.title = 'Copy YouTube link';
            copyBtn.addEventListener('click', () => copyTrackLink(track.youtubeUrl, copyBtn));
            
            trackActions.appendChild(statusIcon);
            trackActions.appendChild(playBtn);
            trackActions.appendChild(copyBtn);
        } else {
            const statusIcon = document.createElement('div');
            statusIcon.className = 'status-icon error';
            statusIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            
            const errorText = document.createElement('span');
            errorText.className = 'error-text';
            errorText.textContent = 'Not found on YouTube';
            
            const retryBtn = document.createElement('button');
            retryBtn.className = 'retry-btn';
            retryBtn.innerHTML = '<i class="fas fa-redo"></i> Retry';
            retryBtn.addEventListener('click', () => retryTrack(index));
            
            trackActions.appendChild(statusIcon);
            trackActions.appendChild(errorText);
            trackActions.appendChild(retryBtn);
        }
        
        trackEl.appendChild(trackInfo);
        trackEl.appendChild(trackActions);
        
        return trackEl;
    }
    
    async function copyTrackLink(url, button) {
        try {
            await navigator.clipboard.writeText(url);
            const originalHtml = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalHtml;
                button.classList.remove('copied');
            }, 2000);
            
        } catch (err) {
            console.error('Failed to copy link:', err);
            showToast('Failed to copy link', 'error');
        }
    }
    
    async function retryTrack(index) {
        const track = trackResults[index];
        if (!track) return;
        
        try {
            const youtubeData = await searchYouTube(track.searchQuery);
            
            // Update track result
            trackResults[index] = {
                ...track,
                youtubeUrl: youtubeData.url,
                youtubeTitle: youtubeData.title,
                videoId: youtubeData.videoId,
                found: true
            };
            
            youtubeLinks.push(youtubeData.url);
            
            // Update UI
            updateResultsList();
            updateFilterCounts();
            
            // Show action buttons if this was the first successful track
            if (youtubeLinks.length === 1) {
                copyAllBtn.classList.remove('hidden');
                createYouTubePlaylistBtn.classList.remove('hidden');
                exportSection.classList.remove('hidden');
            }
            
            showToast('Track found successfully!', 'success');
            
        } catch (error) {
            showToast('Still could not find this track on YouTube', 'error');
        }
    }
    
    function handleFilter(filter) {
        currentFilter = filter;
        
        // Update active filter button
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        updateResultsList();
    }
    
    function getFilteredResults() {
        switch (currentFilter) {
            case 'found':
                return trackResults.filter(track => track.found);
            case 'not-found':
                return trackResults.filter(track => !track.found);
            default:
                return trackResults;
        }
    }
    
    function switchView(view) {
        currentView = view;
        
        // Update active view button
        gridViewBtn.classList.toggle('active', view === 'grid');
        listViewBtn.classList.toggle('active', view === 'list');
        
        updateResultsList();
    }
    
    function updateFilterCounts() {
        const total = trackResults.length;
        const found = trackResults.filter(track => track.found).length;
        const notFound = total - found;
        
        countAll.textContent = total;
        countFound.textContent = found;
        countNotFound.textContent = notFound;
    }
    
    async function handleCopyAll() {
        if (youtubeLinks.length === 0) {
            showToast('No YouTube links to copy', 'error');
            return;
        }
        
        try {
            const linksText = youtubeLinks.join('\n');
            await navigator.clipboard.writeText(linksText);
            
            const originalText = copyAllBtn.innerHTML;
            copyAllBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyAllBtn.classList.add('copied');
            
            setTimeout(() => {
                copyAllBtn.innerHTML = originalText;
                copyAllBtn.classList.remove('copied');
            }, 2000);
            
            showToast(`Copied ${youtubeLinks.length} YouTube links to clipboard`, 'success');
            
        } catch (err) {
            console.error('Failed to copy links:', err);
            showToast('Failed to copy links to clipboard', 'error');
        }
    }
    
    function handleCreateYouTubePlaylist() {
        if (youtubeLinks.length === 0) {
            showToast('No YouTube links available', 'error');
            return;
        }
        
        // Create a YouTube playlist URL with the first video
        const firstVideoId = trackResults.find(track => track.found)?.videoId;
        if (firstVideoId) {
            const playlistUrl = `https://www.youtube.com/watch?v=${firstVideoId}&list=PLrAXtmRdnEQeijiuLkKHgCgykiPMphU8T`;
            window.open(playlistUrl, '_blank');
        }
        
        showToast('Opening YouTube... You can manually create a playlist with the links', 'success');
    }
    
    function handleExport(format) {
        if (trackResults.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
        
        let content, filename, mimeType;
        
        switch (format) {
            case 'txt':
                content = exportToTxt();
                filename = `${currentPlaylistData?.playlistName || 'playlist'}_youtube_links.txt`;
                mimeType = 'text/plain';
                break;
            case 'csv':
                content = exportToCsv();
                filename = `${currentPlaylistData?.playlistName || 'playlist'}_youtube_links.csv`;
                mimeType = 'text/csv';
                break;
            case 'json':
                content = exportToJson();
                filename = `${currentPlaylistData?.playlistName || 'playlist'}_youtube_links.json`;
                mimeType = 'application/json';
                break;
        }
        
        downloadFile(content, filename, mimeType);
        showToast(`Exported as ${format.toUpperCase()}`, 'success');
    }
    
    function exportToTxt() {
        const foundTracks = trackResults.filter(track => track.found);
        return foundTracks.map(track => track.youtubeUrl).join('\n');
    }
    
    function exportToCsv() {
        const headers = 'Track Name,Artists,YouTube URL,YouTube Title,Status\n';
        const rows = trackResults.map(track => {
            const name = `"${track.name.replace(/"/g, '""')}"`;
            const artists = `"${track.artists.replace(/"/g, '""')}"`;
            const url = track.found ? track.youtubeUrl : '';
            const title = track.found ? `"${track.youtubeTitle.replace(/"/g, '""')}"` : '';
            const status = track.found ? 'Found' : 'Not Found';
            return `${name},${artists},${url},${title},${status}`;
        }).join('\n');
        
        return headers + rows;
    }
    
    function exportToJson() {
        const exportData = {
            playlistName: currentPlaylistData?.playlistName,
            totalTracks: trackResults.length,
            foundTracks: trackResults.filter(track => track.found).length,
            exportDate: new Date().toISOString(),
            tracks: trackResults
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    function showLoader() {
        loader.style.display = 'flex';
        results.style.display = 'none';
    }
    
    function hideLoader() {
        loader.style.display = 'none';
    }
    
    function showToast(message, type = 'success') {
        const toast = type === 'success' ? successToast : errorToast;
        const span = toast.querySelector('span');
        
        span.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // API functions
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
            
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            return data;
        } catch (error) {
            console.error('Error searching YouTube:', error);
            throw error;
        }
    }
});