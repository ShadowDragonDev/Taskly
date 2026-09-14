# Taskly

A lightweight, high-performance **Single Page Application (SPA)** Todo web app built entirely with **Vanilla JavaScript, HTML5, and CSS3**. This project features zero external framework dependencies, custom Client-Side Routing, and persistent local storage.

🔗 **Live Demo:** [Taskly](https://shadowdragondev-taskly.netlify.app)

## Features

- **Zero Frameworks:** Built using pure JavaScript to optimize loading speeds and reduce bundle size.
- **SPA Client-Side Routing:** Custom routing system that switches views without page reloads.
- **Persistent Storage:** LocalStorage integration to save and sync tasks automatically.
- **Task Management:** Full CRUD capabilities (Create, Read, Update, Delete) with task filtering (All, Active, Completed).
- **Responsive Design:** Mobile-first user interface optimized for all screen sizes.

## Tech Stack

- **Core Language:** Vanilla JavaScript
- **State & Routing:** Custom Store & History API Router
- **Structuring:** Semantic HTML5
- **Styling:** Modern CSS3

## Execution

### Prerequisites

You only need a modern web browser and Python installed locally to handle development server routing paths correctly.

### Installation & Running Locally

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ShadowDragonDev/Taskly
   ```

2. **Navigate to the project folder:**

   ```bash
   cd Taskly
   ```

3. **Launch your local server:**

   ```bash
   python3 -m http.server 8000
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:8000`.

> **Important Routing Note:** Because this app uses a custom History API router for clean URLs, refreshing the page on deep sub-paths (like `/inbox` or `/settings`) while running a basic static server like Python's `http.server` will trigger a **404 Not Found** error. To avoid this, always enter the application from the root URL (`http://localhost:8000`) or use a development server configured for SPA single-entry routing redirects to `index.html`.

## Author

Created and maintained by [ShadowDragonDev](https://github.com/ShadowDragonDev). Feel free to check out my other projects!
