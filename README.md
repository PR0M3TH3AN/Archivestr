# Archivestr

Archivestr is a Nostr tool for creating, browsing, and broadcasting archives. It provides a seamless way to interact with Nostr archives through a collector interface for creating archives in JSON format and a viewer for browsing archive files.

## Features

- **Collector**: Collects and archives Nostr data in JSON format. The collector can also broadcast the archives to Nostr relays.
- **Viewer**: Loads and browses existing archive files with sorting and detailed views of event metadata and content.

## Project Structure

- **`index.html`**: The landing page with navigation links to the collector and viewer tools.
- **`collector.html`**: The interface for collecting and archiving Nostr events.
- **`view-archive.html`**: The interface for browsing archived JSON files.
- **`script.js`**: The logic for interacting with Nostr relays in the collector tool.

## Getting Started

### Prerequisites

Ensure you have the following installed:
- A modern web browser (Chrome, Firefox, etc.)
- Basic knowledge of Nostr events and relays

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PR0M3TH3AN/Archivestr.git
   ```
2. Navigate to the project directory:
   ```bash
   cd archivestr
   ```
3. Open `index.html` in a browser to get started.

## Usage

### Collector

1. Navigate to `collector.html`.
2. Enter the NPub (public key) and relay URLs to collect data.
3. Start collecting events, and download the archive as a JSON file.

### Viewer

1. Navigate to `view-archive.html`.
2. Load a JSON archive file.
3. Browse, sort, and view details of the events in the archive.

## Development

Feel free to contribute or customize the project:

1. Modify `collector.html` or `view-archive.html` as needed.
2. Enhance the functionality in `script.js`.
3. Update the styling in the `<style>` sections or move styles to external CSS files.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## GitHub Repository

Visit the [GitHub repository](https://github.com/PR0M3TH3AN/Archivestr) for the source code and updates.
