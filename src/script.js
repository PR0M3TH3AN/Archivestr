document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('archiveForm');
    const statusDiv = document.getElementById('status');
    const downloadBtn = document.getElementById('downloadBtn');
    const spinner = document.getElementById('spinner');
    const broadcastBtn = document.createElement('button');
    const fileInput = document.createElement('input');

    // Configure file input for archive selection
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    form.appendChild(fileInput);

    broadcastBtn.textContent = 'Broadcast from Archive';
    broadcastBtn.style.display = 'none'; // Initially hidden
    form.appendChild(broadcastBtn);

    let collectedEvents = [];
    let loadedEvents = []; // Events loaded from a file
    let subscriptions = []; // Track active subscriptions

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        collectedEvents = []; // Reset previous data
        subscriptions = []; // Clear previous subscriptions
        downloadBtn.style.display = 'none';
        broadcastBtn.style.display = 'none';
        statusDiv.innerHTML = 'Starting collection...';
        spinner.style.display = 'block';

        const npub = document.getElementById('npub').value.trim();
        const relayInput = document.getElementById('relays').value.trim();
        const relayUrls = relayInput.split('\n').map(url => url.trim()).filter(url => url);

        let pubkey;
        try {
            const decoded = NostrTools.nip19.decode(npub);
            if (decoded.type !== 'npub') throw new Error('Invalid type. Expected npub.');
            pubkey = decoded.data;
        } catch (error) {
            statusDiv.innerHTML = `Invalid NPub: ${error.message}`;
            spinner.style.display = 'none';
            return;
        }

        statusDiv.innerHTML = `Connecting to ${relayUrls.length} relay(s)...`;

        const pool = new NostrTools.SimplePool();
        const eoseTracker = relayUrls.reduce((acc, url) => ({ ...acc, [url]: false }), {});
        const eventIds = new Set();

        // Update the filter to include additional kinds
        const filter = {
            kinds: [0, 1, 2, 3, 4, 6, 7, 10002, 30023, 10509], // Include all relevant kinds
            authors: [pubkey], // Fetch events from the specified pubkey
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
                        
                        collectedEvents.push(event); // Store the raw event data
                        eventIds.add(event.id);
                    }
                });

                sub.on('eose', () => {
                    eoseTracker[url] = true;
                    console.log(`EOSE received from ${url}`);
                    statusDiv.innerHTML += `<br>EOSE received from ${url}`;
                    checkCompletion();
                });

                sub.on('error', (err) => {
                    console.error(`Error on ${url}:`, err);
                    statusDiv.innerHTML += `<br>Error on ${url}: ${err.message}`;
                });
            } catch (err) {
                console.error(`Subscription failed for ${url}:`, err);
                statusDiv.innerHTML += `<br>Subscription failed for ${url}: ${err.message}`;
            }
        });

        function checkCompletion() {
            if (Object.values(eoseTracker).every((status) => status)) {
                finishCollection();
            }
        }

        function finishCollection() {
            spinner.style.display = 'none';
            statusDiv.innerHTML += `<br>Collection complete. ${collectedEvents.length} event(s) collected.`;
            downloadBtn.style.display = 'block';
            broadcastBtn.style.display = 'block';

            subscriptions.forEach(sub => sub.unsub());
            pool.close();
        }
    });

    downloadBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collectedEvents, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        const filename = `nostr_archive_${new Date().toISOString()}.json`;
        downloadAnchor.setAttribute("download", filename);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    // Handle file selection for broadcasting
    broadcastBtn.addEventListener('click', () => {
        fileInput.click(); // Trigger file input
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsedData = JSON.parse(e.target.result);
                if (!Array.isArray(parsedData)) throw new Error('Archive must be an array of events.');
                loadedEvents = parsedData; // Safely assign parsed data
                statusDiv.innerHTML = `Loaded ${loadedEvents.length} event(s) from the archive. Ready to broadcast.`;
                promptAndBroadcast();
            } catch (err) {
                console.error('Error loading archive:', err);
                statusDiv.innerHTML = `Failed to load archive: ${err.message}`;
            }
        };
        reader.readAsText(file);
    });

    function promptAndBroadcast() {
        const relayInput = prompt('Enter relay URLs (one per line) for broadcasting:');
        if (!relayInput) return;

        const relayUrls = relayInput.split('\n').map(url => url.trim()).filter(url => url);
        if (relayUrls.length === 0) {
            alert('No valid relays provided.');
            return;
        }

        const pool = new NostrTools.SimplePool();
        statusDiv.innerHTML = `Broadcasting to ${relayUrls.length} relay(s)...`;

        let successCount = 0;
        let failureCount = 0;

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
                            case 30023:
                                console.log('Long-Form Content captured:', event);
                                break;
                            default:
                                console.log('Other event captured:', event);
                        }
                        collectedEvents.push(event); // Store the raw event data
                        eventIds.add(event.id);
                    }
                });
        
                sub.on('eose', () => {
                    eoseTracker[url] = true;
                    console.log(`EOSE received from ${url}`);
                    statusDiv.innerHTML += `<br>EOSE received from ${url}`;
                    checkCompletion();
                });
        
                sub.on('error', (err) => {
                    console.error(`Error on ${url}:`, err);
                    statusDiv.innerHTML += `<br>Error on ${url}: ${err.message}`;
                    // Mark the relay as complete to avoid stalling collection
                    eoseTracker[url] = true;
                    checkCompletion();
                });
            } catch (err) {
                console.error(`Subscription failed for ${url}:`, err);
                statusDiv.innerHTML += `<br>Subscription failed for ${url}: ${err.message}`;
                // Mark the relay as complete to avoid stalling collection
                eoseTracker[url] = true;
                checkCompletion();
            }
        });
        
        pool.close();
        statusDiv.innerHTML += `<br>Broadcast complete: ${successCount} success(es), ${failureCount} failure(s).`;
    }
});
