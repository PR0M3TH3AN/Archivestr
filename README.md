# Archivestr

**Archivestr** is a Nostr tool designed to help you create, browse, and broadcast archives. Whether you're archiving your own Nostr activity, exploring event metadata, or sharing archives with others, Archivestr offers an intuitive and efficient way to manage your Nostr data.

## Features

- **Collector**: Gather Nostr events by entering an NPub (public key) and a list of relay URLs. Save collected events as a JSON archive or broadcast them directly to relays.
- **Viewer**: Load JSON archives to browse and analyze event data. Includes advanced filtering options like regex search, date ranges, and kind filtering.
- **Broadcast**: Distribute archived events to multiple relays with progress tracking and verification.

## Supported Event Kinds

Archivestr collects the following types of Nostr events:

| **Kind** | **Description**                                    |
|----------|----------------------------------------------------|
| 0        | **Profile Metadata**: Information like name, bio, and picture. |
| 1        | **Short Text Note**: Regular posts and updates.    |
| 2        | **Relay Recommendation**: Suggested relays for others to use. |
| 3        | **Contacts**: List of followed users and their relays. |
| 4        | **Encrypted DM**: Direct messages encrypted for specific recipients. |
| 6        | **Repost**: Shared content from other users.       |
| 7        | **Reaction**: Reactions to posts, such as likes or emojis. |
| 10002    | **Relay List**: Preferred relays for an account.   |
| 30023    | **Long-Form Content**: Blog posts, articles, or other extended content. |
| 10509    | **Ephemeral DM**: Short-lived direct messages.     |

## Getting Started

### Prerequisites

To use Archivestr, you'll need:
- A modern web browser (e.g., Chrome, Firefox)
- An active Nostr public key (NPub) and access to relay URLs

### Usage

1. **Collector**:
   - Enter your NPub and relay URLs.
   - Click "Start Collecting" to fetch events from relays.
   - Download the archive as a JSON file for storage or analysis.

2. **Viewer**:
   - Load a JSON archive to browse events.
   - Use filters to search by content, event kind, or date.
   - Sort and paginate through event metadata and content.

3. **Broadcast**:
   - Upload a JSON archive file.
   - Specify relay URLs to share the events across the Nostr network.
   - Track progress and verify broadcast success.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PR0M3TH3AN/Archivestr.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Archivestr
   ```
3. Open `index.html` in a browser to start using Archivestr.

## Why Use Archivestr?

- **Simplicity**: No need for complex setups—just open the tool and start managing your archives.
- **Flexibility**: Collect, browse, and broadcast archives, all in one place.
- **Control**: Maintain your own data and decide how and where it's shared.

## License

Archivestr is released under the **CC0 - No Rights Reserved** license. Use it, modify it, and share it freely.

---

For updates and contributions, visit the [GitHub repository](https://github.com/PR0M3TH3AN/Archivestr).