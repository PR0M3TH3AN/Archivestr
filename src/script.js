// Navigation handling
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check for hash in URL
    const hash = window.location.hash.slice(1) || 'home';
    showSection(hash);

    // Viewer initialization
    initializeViewer();
    // Collector initialization
    initializeCollector();
    // Broadcast initialization
    initializeBroadcast();
});

// =============== VIEWER FUNCTIONALITY ===============
function initializeViewer() {
    // Global variables for viewer
    let archiveData = [];
    let sortedData = [];
    let currentSort = { column: 'created_at', order: 'desc' };
    const rowsPerPage = 100;
    let currentPage = 1;

    // Search configuration
    let searchConfig = {
        term: '',
        useRegex: false,
        caseSensitive: false,
        searchFields: {
            content: true,
            kind: true,
            date: true
        },
        selectedKinds: new Set(),
        dateRange: {
            from: null,
            to: null
        }
    };

    // Event Listeners
    document.getElementById('viewerFileInput').addEventListener('change', handleViewerFileLoad);
    document.querySelectorAll('#dataTable th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            sortTable(th.dataset.sort);
        });
    });

    // Advanced search listeners
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchConfig.term = e.target.value;
        currentPage = 1;
        filterAndRenderTable();
    });

    document.getElementById('advancedSearchToggle').addEventListener('click', () => {
        const advancedSearch = document.getElementById('advancedSearch');
        advancedSearch.style.display = advancedSearch.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('useRegex').addEventListener('change', (e) => {
        searchConfig.useRegex = e.target.checked;
        filterAndRenderTable();
    });

    document.getElementById('caseSensitive').addEventListener('change', (e) => {
        searchConfig.caseSensitive = e.target.checked;
        filterAndRenderTable();
    });

    ['Content', 'Kind', 'Date'].forEach(field => {
        document.getElementById(`search${field}`).addEventListener('change', (e) => {
            searchConfig.searchFields[field.toLowerCase()] = e.target.checked;
            filterAndRenderTable();
        });
    });

    document.getElementById('dateFrom').addEventListener('change', (e) => {
        searchConfig.dateRange.from = e.target.value ? new Date(e.target.value).getTime() / 1000 : null;
        filterAndRenderTable();
    });

    document.getElementById('dateTo').addEventListener('change', (e) => {
        searchConfig.dateRange.to = e.target.value ? new Date(e.target.value).getTime() / 1000 : null;
        filterAndRenderTable();
    });

    function handleViewerFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) throw new Error('Invalid archive format: Expected an array.');
                archiveData = data;
                sortedData = [...archiveData];
                initializeKindFilter();
                updateStats();
                sortTable(currentSort.column); // Initial sort
            } catch (err) {
                alert(`Failed to load archive: ${err.message}`);
            }
        };
        reader.readAsText(file);
    }

    function initializeKindFilter() {
        const kindSelect = document.getElementById('kindFilter');
        const uniqueKinds = new Set(archiveData.map(event => event.kind));
        kindSelect.innerHTML = Array.from(uniqueKinds)
            .sort((a, b) => a - b)
            .map(kind => `<option value="${kind}">${getKindLabel(kind)}</option>`)
            .join('');
        
        kindSelect.addEventListener('change', (e) => {
            searchConfig.selectedKinds = new Set(
                Array.from(e.target.selectedOptions).map(option => parseInt(option.value))
            );
            filterAndRenderTable();
        });
    }

    function filterAndRenderTable() {
        if (!searchConfig.term && !searchConfig.selectedKinds.size && 
            !searchConfig.dateRange.from && !searchConfig.dateRange.to) {
            sortedData = [...archiveData];
        } else {
            sortedData = archiveData.filter(event => {
                // Kind filter
                if (searchConfig.selectedKinds.size && 
                    !searchConfig.selectedKinds.has(event.kind)) {
                    return false;
                }

                // Date range filter
                if (searchConfig.dateRange.from && 
                    event.created_at < searchConfig.dateRange.from) {
                    return false;
                }
                if (searchConfig.dateRange.to && 
                    event.created_at > searchConfig.dateRange.to) {
                    return false;
                }

                // Text search
                if (!searchConfig.term) return true;

                let searchPattern = searchConfig.term;
                if (!searchConfig.useRegex) {
                    searchPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }

                let regex;
                try {
                    const flags = searchConfig.caseSensitive ? 'g' : 'gi';
                    regex = new RegExp(searchPattern, flags);
                } catch (err) {
                    // Invalid regex
                    return false;
                }

                if (searchConfig.searchFields.content) {
                    const content = getContentDisplay(event, false);
                    if (regex.test(content)) return true;
                }

                if (searchConfig.searchFields.kind) {
                    const kindStr = getKindLabel(event.kind);
                    if (regex.test(kindStr)) return true;
                }

                if (searchConfig.searchFields.date) {
                    const dateStr = new Date(event.created_at * 1000).toLocaleString();
                    if (regex.test(dateStr)) return true;
                }

                return false;
            });
        }

        applySorting();
        renderTable();
        updateStats();
    }

    function applySorting() {
        const order = currentSort.order === 'asc' ? 1 : -1;
        sortedData.sort((a, b) => {
            let valA = a[currentSort.column];
            let valB = b[currentSort.column];
            
            if (currentSort.column === 'created_at') {
                valA = parseInt(valA);
                valB = parseInt(valB);
            }

            if (valA < valB) return -1 * order;
            if (valA > valB) return 1 * order;
            return 0;
        });
    }

    function updateStats() {
        const statsDiv = document.getElementById('viewerStats');
        const totalEvents = archiveData.length;
        const filteredEvents = sortedData.length;
        
        let statsText = `Total Events: ${totalEvents}`;
        if (searchConfig.term || searchConfig.selectedKinds.size || 
            searchConfig.dateRange.from || searchConfig.dateRange.to) {
            statsText += ` (Showing ${filteredEvents} matches)`;
        }
        statsText += '<br>Most Common Types: ';
        
        const kindCounts = sortedData.reduce((acc, event) => {
            acc[event.kind] = (acc[event.kind] || 0) + 1;
            return acc;
        }, {});
        
        const topKinds = Object.entries(kindCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([kind, count]) => `${getKindLabel(parseInt(kind))}: ${count}`);
        
        statsText += topKinds.join(' | ');
        
        statsDiv.innerHTML = statsText;
    }

    function renderTable() {
        const tbody = document.querySelector('#dataTable tbody');
        tbody.innerHTML = '';

        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const pageData = sortedData.slice(start, end);

        if (pageData.length === 0) {
            tbody.innerHTML = `<tr class="empty-message">
                <td colspan="5">No data loaded. Please load a JSON archive file.</td>
            </tr>`;
            return;
        }

        pageData.forEach((event, index) => {
            const row = document.createElement('tr');
            // In the renderTable function, update the row.innerHTML line
            row.innerHTML = `
                <td class="number-column">${start + index + 1}</td>
                <td>${new Date(event.created_at * 1000).toLocaleString()}</td>
                <td>${getKindLabel(event.kind)}</td>
                <td class="content-cell">${getContentDisplay(event, true)}</td>
                <td><button class="broadcast-btn" data-event-id="${event.id}">Broadcast</button></td>
            `;
            tbody.appendChild(row);
        });

        // Attach event listeners to the new broadcast buttons
        document.querySelectorAll('.broadcast-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const eventId = e.target.getAttribute('data-event-id');
                const event = archiveData.find(ev => ev.id === eventId);
                if (event) {
                    broadcastSingleEvent(event, e.target);
                } else {
                    alert('Event not found.');
                }
            });
        });

        updatePagination(end);
    }

    function updatePagination(end) {
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = end >= sortedData.length;
        document.getElementById('pageInfo').innerText = 
            `Page ${currentPage} of ${Math.ceil(sortedData.length / rowsPerPage)}`;
    }

    window.changePage = function(offset) {
        currentPage += offset;
        renderTable();
    };

    function sortTable(column) {
        if (currentSort.column === column) {
            currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.order = 'desc';
        }

        currentPage = 1;
        filterAndRenderTable();
    }
}

// =============== COLLECTOR FUNCTIONALITY ===============
function initializeCollector() {
    const form = document.getElementById('archiveForm');
    const statusDiv = document.getElementById('status');
    const downloadBtn = document.getElementById('downloadBtn');
    const spinner = document.getElementById('spinner');
    const progressContainer = document.getElementById('progressContainer');

    let collectedEvents = [];
    let subscriptions = [];
    let totalRelays = 0;
    let completedRelays = 0;

    function updateProgress() {
        const progress = (completedRelays / totalRelays) * 100;
        const progressBar = progressContainer.querySelector('.progress-bar');
        const progressText = progressContainer.querySelector('.progress-text');
        if (progressBar && progressText) {
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        collectedEvents = [];
        subscriptions = [];
        downloadBtn.style.display = 'none';
        statusDiv.innerHTML = 'Starting collection...';
        spinner.style.display = 'block';
        progressContainer.style.display = 'block';
        updateProgress();

        const npub = document.getElementById('npub').value.trim();
        const relayInput = document.getElementById('relays').value.trim();
        const relayUrls = relayInput.split('\n').map(url => url.trim()).filter(url => url);

        if (relayUrls.length === 0) {
            statusDiv.innerHTML = 'Please enter at least one relay URL.';
            spinner.style.display = 'none';
            progressContainer.style.display = 'none';
            return;
        }

        let pubkey;
        try {
            const decoded = NostrTools.nip19.decode(npub);
            if (decoded.type !== 'npub') throw new Error('Invalid type. Expected npub.');
            pubkey = decoded.data;
        } catch (error) {
            statusDiv.innerHTML = `Invalid NPub: ${error.message}`;
            spinner.style.display = 'none';
            progressContainer.style.display = 'none';
            return;
        }

        statusDiv.innerHTML = `Connecting to ${relayUrls.length} relay(s)...`;
        totalRelays = relayUrls.length;
        completedRelays = 0;
        updateProgress();

        const pool = new NostrTools.SimplePool();
        const eoseTracker = relayUrls.reduce((acc, url) => ({ ...acc, [url]: false }), {});
        const eventIds = new Set();

        const filter = {
            kinds: [0, 1, 2, 3, 4, 6, 7, 10002, 30023, 10509],
            authors: [pubkey],
        };

        relayUrls.forEach((url) => {
            try {
                const sub = pool.sub([url], [filter]);
                subscriptions.push(sub);

                sub.on('event', (event) => {
                    if (!eventIds.has(event.id)) {
                        switch (event.kind) {
                            case 0:
                                console.log('Profile Metadata captured:', event);
                                break;
                            case 2:
                                console.log('Relay Recommendation captured:', event);
                                break;
                            case 3:
                                console.log('Contact List captured:', event);
                                break;
                            case 4:
                                console.log('Encrypted DM captured:', event);
                                break;
                            case 10509:
                                console.log('Ephemeral DM captured:', event);
                                break;
                            case 30023:
                                console.log('Long-Form Content captured:', event);
                                break;
                            default:
                                console.log('Other event captured:', event);
                        }
                        collectedEvents.push(event);
                        eventIds.add(event.id);
                    }
                });

                sub.on('eose', () => {
                    eoseTracker[url] = true;
                    completedRelays++;
                    updateProgress();
                    console.log(`EOSE received from ${url}`);
                    statusDiv.innerHTML += `<br>EOSE received from ${url}`;
                    checkCompletion();
                });

                sub.on('error', (err) => {
                    console.error(`Error on ${url}:`, err);
                    statusDiv.innerHTML += `<br>Error on ${url}: ${err.message}`;
                    eoseTracker[url] = true;
                    completedRelays++;
                    updateProgress();
                    checkCompletion();
                });
            } catch (err) {
                console.error(`Subscription failed for ${url}:`, err);
                statusDiv.innerHTML += `<br>Subscription failed for ${url}: ${err.message}`;
                eoseTracker[url] = true;
                completedRelays++;
                updateProgress();
                checkCompletion();
            }
        });

        function checkCompletion() {
            if (Object.values(eoseTracker).every(status => status)) {
                finishCollection();
            }
        }

        function finishCollection() {
            spinner.style.display = 'none';
            statusDiv.innerHTML += `<br>Collection complete. ${collectedEvents.length} event(s) collected.`;
            downloadBtn.style.display = 'block';

            subscriptions.forEach(sub => sub.unsub());
            pool.close();
        }
    });

    downloadBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + 
            encodeURIComponent(JSON.stringify(collectedEvents, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", 
            `nostr_archive_${new Date().toISOString()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });
}

// =============== SHARED HELPER FUNCTIONS ===============
const POPULAR_RELAYS = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.nostr.band',
    'wss://nostr.wine'
];

function validateRelayUrls(urls) {
    const validUrlPattern = /^wss?:\/\/[^\s/$.?#].[^\s]*$/i;
    return urls.every(url => {
        // Check if URL matches basic websocket pattern
        if (!validUrlPattern.test(url)) {
            return false;
        }
        try {
            // Try to create URL object to validate further
            new URL(url);
            return true;
        } catch {
            return false;
        }
    });
}

// =============== VERIFICATION HELPER FUNCTION ===============
async function verifyEventOnRelay(eventId, relayUrl, existingPool = null) {
    const pool = existingPool || new NostrTools.SimplePool();
    try {
        const filter = {
            ids: [eventId]
        };
        
        const events = await pool.list([relayUrl], [filter]);
        return {
            found: events.length > 0,
            relay: relayUrl
        };
    } catch (err) {
        console.error(`Error verifying event on ${relayUrl}:`, err);
        return {
            found: false,
            relay: relayUrl,
            error: err.message
        };
    }
}

// =============== BATCH BROADCAST FUNCTIONALITY ===============
function initializeBroadcast() {
    const fileInput = document.getElementById('broadcastFileInput');
    const statusDiv = document.getElementById('broadcastStatus');
    const startButton = document.getElementById('startBroadcastBtn');
    const progressContainer = document.getElementById('broadcastProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    const progressText = progressContainer.querySelector('.progress-text');
    let loadedEvents = [];

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsedData = JSON.parse(e.target.result);
                if (!Array.isArray(parsedData)) throw new Error('Archive must be an array of events.');
                loadedEvents = parsedData;
                statusDiv.innerHTML = `Loaded ${loadedEvents.length} event(s) from the archive.`;
                startButton.style.display = 'inline-block';
            } catch (err) {
                console.error('Error loading archive:', err);
                statusDiv.innerHTML = `Failed to load archive: ${err.message}`;
                startButton.style.display = 'none';
            }
        };
        reader.readAsText(file);
    });

    async function processBatch(batch, relayUrls, pool) {
        // First, publish all events in the batch in parallel
        const publishPromises = batch.map(async event => {
            try {
                const published = await pool.publish(relayUrls, event);
                return {
                    event,
                    success: true,
                    published
                };
            } catch (err) {
                console.error(`Failed to publish event ${event.id}:`, err);
                return {
                    event,
                    success: false,
                    error: err.message
                };
            }
        });

        const publishResults = await Promise.allSettled(publishPromises);

        // Quick pause to let relays catch up
        await new Promise(resolve => setTimeout(resolve, 100));

        // Now verify all successful publishes in parallel
        const verifyPromises = publishResults
            .filter(result => result.value?.success)
            .map(result => {
                const event = result.value.event;
                return Promise.all(relayUrls.map(async relay => {
                    try {
                        const verified = await verifyEventOnRelay(event.id, relay, pool);
                        return {
                            eventId: event.id,
                            relay,
                            success: verified.found
                        };
                    } catch (err) {
                        return {
                            eventId: event.id,
                            relay,
                            success: false,
                            error: err.message
                        };
                    }
                }));
            });

        const verifyResults = await Promise.allSettled(verifyPromises);

        return {
            published: publishResults,
            verified: verifyResults
        };
    }

    function updateStatus(currentEvent, stats, batchResults = null) {
        const elapsedTime = (Date.now() - stats.startTime) / 1000;
        const avgTimePerEvent = stats.completedCount > 0 ? elapsedTime / stats.completedCount : 0;
        const remainingEvents = loadedEvents.length - stats.completedCount;
        const estimatedRemainingTime = Math.ceil(avgTimePerEvent * remainingEvents);
        
        const progress = (stats.completedCount / loadedEvents.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}% (${stats.completedCount}/${loadedEvents.length})`;

        let statusHTML = `
            <div class="broadcast-status">
                <div class="status-section">
                    <h3>Progress <span class="spinner"></span></h3>
                    <p>⏱️ ${Math.floor(elapsedTime / 60)}m ${Math.floor(elapsedTime % 60)}s elapsed</p>
                    <p>⏳ ~${Math.floor(estimatedRemainingTime / 60)}m remaining</p>
                    <p>📊 ${stats.completedCount}/${loadedEvents.length} processed</p>
                </div>

                <div class="status-section">
                    <h3>Status</h3>
                    <p>✅ ${stats.successCount} succeeded</p>
                    <p>❌ ${stats.failureCount} failed</p>
                    <p>✓ ${stats.verifiedCount} verified</p>
                </div>`;

        if (currentEvent) {
            statusHTML += `
                <div class="status-section">
                    <h3>Current Batch</h3>
                    <p>📝 Processing Kind ${currentEvent.kind}</p>
                    <p>
                        <span class="event-id">${currentEvent.id}</span>
                        <button class="copy-button" onclick="copyToClipboard('${currentEvent.id}', 'current-copy')">Copy</button>
                    </p>
                </div>`;
        }

        if (stats.latestVerified) {
            statusHTML += `
                <div class="status-section">
                    <h3>Latest Verified</h3>
                    <p>
                        <span class="event-id">${stats.latestVerified.eventId}</span>
                        <button class="copy-button" onclick="copyToClipboard('${stats.latestVerified.eventId}', 'latest-copy')">Copy</button>
                    </p>
                    <p>✓ Found on ${stats.latestVerified.count} relays</p>
                </div>`;
        }

        statusHTML += '</div>';
        statusDiv.innerHTML = statusHTML;
    }

    startButton.addEventListener('click', async () => {
        const relayUrls = document.getElementById('broadcastRelays')
            .value.trim()
            .split('\n')
            .map(url => url.trim())
            .filter(url => url);

        if (relayUrls.length === 0) {
            alert('Please enter at least one relay URL');
            return;
        }

        if (!validateRelayUrls(relayUrls)) {
            alert('One or more relay URLs are invalid. Please check and try again.');
            return;
        }

        if (loadedEvents.length === 0) {
            alert('No events loaded to broadcast');
            return;
        }

        startButton.disabled = true;
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';

        const stats = {
            startTime: Date.now(),
            completedCount: 0,
            successCount: 0,
            failureCount: 0,
            verifiedCount: 0,
            latestVerified: null
        };

        const pool = new NostrTools.SimplePool();
        const BATCH_SIZE = 10;

        try {
            // Process in batches
            for (let i = 0; i < loadedEvents.length; i += BATCH_SIZE) {
                const batch = loadedEvents.slice(i, i + BATCH_SIZE);
                updateStatus(batch[0], stats);

                const results = await processBatch(batch, relayUrls, pool);

                // Update stats based on batch results
                results.published.forEach(result => {
                    if (result.value?.success) {
                        stats.successCount++;
                    } else {
                        stats.failureCount++;
                    }
                });

                results.verified.forEach(verifyGroup => {
                    if (verifyGroup.value) {
                        const successfulVerifications = verifyGroup.value.filter(v => v.success).length;
                        stats.verifiedCount += successfulVerifications;

                        if (successfulVerifications > 0) {
                            stats.latestVerified = {
                                eventId: verifyGroup.value[0].eventId,
                                count: successfulVerifications
                            };
                        }
                    }
                });

                stats.completedCount += batch.length;
                updateStatus(batch[batch.length - 1], stats, results);
            }

            // Final summary
            const successRate = ((stats.successCount / loadedEvents.length) * 100).toFixed(1);
            const finalHTML = `
                <div class="final-summary">
                    <h3>📊 Broadcast Complete</h3>
                    <div class="summary-section">
                        <p>Total Events: ${loadedEvents.length}</p>
                        <p>Success Rate: ${successRate}%</p>
                        <p>✅ ${stats.successCount} succeeded</p>
                        <p>❌ ${stats.failureCount} failed</p>
                        <p>✓ ${stats.verifiedCount} verifications</p>
                        <p>⏱️ Total Time: ${Math.floor((Date.now() - stats.startTime) / 60000)}m ${Math.floor((Date.now() - stats.startTime) / 1000 % 60)}s</p>
                    </div>
                </div>`;

            statusDiv.innerHTML += finalHTML;

        } catch (err) {
            console.error('Unexpected error during batch broadcast:', err);
            statusDiv.innerHTML += `
                <div class="status-section error">
                    <h3>⚠️ Error</h3>
                    <p>${err.message}</p>
                </div>`;
        } finally {
            startButton.disabled = false;
        }
    });

    // Add copy to clipboard function if it doesn't exist
    if (!window.copyToClipboard) {
        window.copyToClipboard = async function(text, buttonId) {
            try {
                await navigator.clipboard.writeText(text);
                const button = document.getElementById(buttonId);
                button.textContent = 'Copied!';
                button.classList.add('copied');
                setTimeout(() => {
                    button.textContent = 'Copy';
                    button.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        };
    }
}

// =============== BROADCAST SINGLE EVENT FUNCTIONALITY ===============
async function broadcastSingleEvent(event, buttonElement) {
    const relayInput = document.getElementById('broadcastRelays').value.trim();
    const broadcastRelays = relayInput.split('\n').map(url => url.trim()).filter(url => url);

    if (broadcastRelays.length === 0) {
        alert('Please enter at least one relay URL in the Broadcast section.');
        return;
    }

    if (!validateRelayUrls(broadcastRelays)) {
        alert('One or more relay URLs are invalid. Please check and try again.');
        return;
    }

    if (!event) {
        alert('Invalid event selected.');
        return;
    }

    buttonElement.disabled = true;
    buttonElement.textContent = 'Broadcasting...';

    const pool = new NostrTools.SimplePool();
    const verificationResults = [];

    try {
        const publishResult = await pool.publish(broadcastRelays, event);

        if (publishResult) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            buttonElement.textContent = 'Verifying...';
            
            // Check all relays (broadcast targets + popular relays)
            const allRelaysToCheck = [...new Set([...broadcastRelays, ...POPULAR_RELAYS])];
            
            for (const relayUrl of allRelaysToCheck) {
                const result = await verifyEventOnRelay(event.id, relayUrl, pool);
                verificationResults.push(result);
            }
            
            const foundOn = verificationResults.filter(r => r.found).map(r => r.relay);
            const nostrBandLink = `https://nostr.band/event/${event.id}`;
            
            let message = `Event ID ${event.id} broadcast complete!\n\n`;
            message += `Found on ${foundOn.length} relay(s):\n${foundOn.join('\n')}\n\n`;
            message += `View on nostr.band: ${nostrBandLink}`;
            
            // Try to copy to clipboard
            try {
                await navigator.clipboard.writeText(event.id);
                message += '\n\nEvent ID copied to clipboard!';
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
            }

            alert(message);

            // Log detailed results to console for debugging
            console.log('Verification Results:', {
                eventId: event.id,
                results: verificationResults
            });
        } else {
            alert(`Event ID ${event.id} failed to broadcast to any relays.`);
        }
    } catch (err) {
        console.error('Unexpected error during broadcasting:', err);
        alert(`Unexpected error: ${err.message}`);
    } finally {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Broadcast';
    }
}

function getKindLabel(kind) {
    const kinds = {
        0: ['Profile Metadata', 'Basic profile information like name, about, and picture'],
        1: ['Short Text Note', 'Regular text posts and updates'],
        2: ['Recommend Relay', 'Relay recommendations for other users'],
        3: ['Contacts', 'List of followed users and their relays'],
        4: ['Encrypted DM', 'Direct messages encrypted for specific recipients'],
        6: ['Repost', 'Reposted content from other users'],
        7: ['Reaction', 'Reactions to other posts (likes, emojis, etc.)'],
        40: ['Channel Creation', 'Creates a new channel for group discussions'],
        41: ['Channel Metadata', 'Updates to channel information'],
        42: ['Channel Message', 'Messages posted in channels'],
        30023: ['Long-form Content', 'Blog posts, articles, and longer content'],
        9734: ['Zap Request', 'Lightning payment requests'],
        9735: ['Zap', 'Lightning payment confirmations'],
        10002: ['Relay List', 'List of preferred relays'],
        10003: ['Bookmark List', 'Saved posts and content'],
        30008: ['Profile Badges', 'Badges displayed on profiles'],
        30009: ['Badge Definition', 'Creates or defines new badges'],
        30078: ['Application Specific', 'Data specific to certain applications'],
        31989: ['Handler Recommendation', 'Recommended handlers for protocols'],
        31990: ['Handler Information', 'Information about protocol handlers']
    };

    const [label, description] = kinds[kind] || ['Unknown', 'Custom or application-specific event type'];
    return `<div class="tooltip">${kind} (${label})<span class="tooltip-text">${description}</span></div>`;
}

function getContentDisplay(event, highlight = true) {
    let content = '';
    
    if (event.kind === 0) {
        try {
            const profile = JSON.parse(event.content);
            content = `Name: ${profile.name || 'N/A'}<br>About: ${profile.about || 'N/A'}`;
        } catch {
            content = 'Invalid profile data';
        }
    } else if (event.kind === 4) {
        const recipient = event.tags.find(tag => tag[0] === 'p');
        content = `Encrypted Message: ${event.content || 'N/A'}<br>Recipient: ${recipient ? recipient[1] : 'Unknown'}`;
    } else if (event.kind === 3) {
        try {
            const contacts = JSON.parse(event.content);
            content = `Contact List: ${contacts.length} contacts`;
        } catch {
            content = 'Invalid contact list data';
        }
    } else {
        content = event.content || 'No content available';
    }

    if (highlight && window.searchConfig?.term) {
        let searchPattern = window.searchConfig.term;
        if (!window.searchConfig.useRegex) {
            searchPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        let regex;
        try {
            const flags = window.searchConfig.caseSensitive ? 'g' : 'gi';
            regex = new RegExp(searchPattern, flags);
        } catch (err) {
            // Invalid regex
            return content;
        }

        const highlightClass = window.searchConfig.useRegex ? 'regex-highlight' : 'search-highlight';
        content = content.replace(regex, match => 
            `<span class="${highlightClass}">${match}</span>`);
    }

    return content;
}