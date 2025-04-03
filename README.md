# Moon Sighting Application

A simplified web application for tracking moon visibility and receiving notifications.

## Features

- Calculate moon visibility based on location and date
- Receive notifications about moon visibility
- Save and manage multiple locations
- Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/moon-sighting.git
   cd moon-sighting
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Development

To run the application in development mode with auto-restart:

```
npm run dev
```

## Project Structure

```
moon-sighting/
├── public/              # Static files
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side JavaScript
│   ├── index.html       # Main HTML file
│   ├── manifest.json    # PWA manifest
│   └── service-worker.js # Service worker for offline support
├── config.js            # Application configuration
├── server.js            # Express server
├── manage.sh            # Management script
├── package.json         # Project dependencies
└── README.md            # This file
```

## Management Script

The application includes a management script (`manage.sh`) that provides commands for common tasks:

```
./manage.sh [command]
```

Available commands:
- `start` - Start the application
- `stop` - Stop the application
- `restart` - Restart the application
- `status` - Check application status
- `logs` - View application logs
- `deploy` - Deploy to production
- `backup` - Create a backup
- `restore` - Restore from backup
- `update` - Update the application
- `help` - Show help message

## Configuration

The application can be configured by modifying the `config.js` file. Key settings include:

- API endpoints
- Moon visibility parameters
- Default location
- Notification settings
- Feature flags

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Astronomical calculations are simplified for demonstration purposes
- In a production environment, use a proper astronomical library for accurate calculations 