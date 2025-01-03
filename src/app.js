// Global variables
let archiveData = [];
let sortedData = [];
let currentSort = { column: 'created_at', order: 'desc' };
const rowsPerPage = 100;
let currentPage = 1;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fileInput').addEventListener('change', handleFileLoad);
    
    // Add click listeners to sortable headers
    document.querySelectorAll('#dataTable th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            sortTable(th.dataset.sort);
        });
    });
});

// File handling
function handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) throw new Error('Invalid archive format: Expected an array.');
            archiveData = data;
            sortedData = [...archiveData];
            updateStats();
            sortTable(currentSort.column); // Initial sort
        } catch (err) {
            alert(`Failed to load archive: ${err.message}`);
        }
    };
    reader.readAsText(file);
}

// Statistics
function updateStats() {
    const statsDiv = document.getElementById('stats');
    const kindCounts = archiveData.reduce((acc, event) => {
        acc[event.kind] = (acc[event.kind] || 0) + 1;
        return acc;
    }, {});
    
    const totalEvents = archiveData.length;
    let statsText = `Total Events: ${totalEvents}<br>`;
    statsText += 'Most Common Types: ';
    
    const topKinds = Object.entries(kindCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([kind, count]) => `${getKindLabel(parseInt(kind))}: ${count}`);
    
    statsText += topKinds.join(' | ');
    
    statsDiv.innerHTML = statsText;
}

// Table rendering
function renderTable() {
    const tbody = document.querySelector('#dataTable tbody');
    tbody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = sortedData.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr class="empty-message">
            <td colspan="4">No data loaded. Please load a JSON archive file.</td>
        </tr>`;
        return;
    }

    pageData.forEach((event, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="number-column">${start + index + 1}</td>
            <td>${new Date(event.created_at * 1000).toLocaleString()}</td>
            <td>${getKindLabel(event.kind)}</td>
            <td class="content-cell">${getContentDisplay(event)}</td>
        `;
        tbody.appendChild(row);
    });

    updatePagination(end);
}

// Pagination
function updatePagination(end) {
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = end >= sortedData.length;
    document.getElementById('pageInfo').innerText = `Page ${currentPage} of ${Math.ceil(sortedData.length / rowsPerPage)}`;
}

function changePage(offset) {
    currentPage += offset;
    renderTable();
}

// Sorting
function sortTable(column) {
    if (currentSort.column === column) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.order = 'desc';
    }

    const order = currentSort.order === 'asc' ? 1 : -1;
    sortedData.sort((a, b) => {
        if (a[column] < b[column]) return -1 * order;
        if (a[column] > b[column]) return 1 * order;
        return 0;
    });

    currentPage = 1;
    renderTable();
}

// Helper functions
function getKindLabel(kind) {
    const kinds = {
        0: 'Profile Metadata',
        1: 'Short Text Note',
        2: 'Recommend Relay',
        3: 'Contacts',
        4: 'Encrypted DM',
        6: 'Repost',
        7: 'Reaction',
        40: 'Channel Creation',
        41: 'Channel Metadata',
        42: 'Channel Message',
        30023: 'Long-form Content',
        // Add more as needed
    };
    return `${kind} (${kinds[kind] || 'Unknown'})`;
}

function getContentDisplay(event) {
    if (event.kind === 4) {
        const recipient = event.tags.find(tag => tag[0] === 'p');
        return `Encrypted Message: ${event.content || 'N/A'}<br>Recipient: ${recipient ? recipient[1] : 'Unknown'}`;
    }
    return event.content || 'No content available';
}