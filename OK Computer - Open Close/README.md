# Nearby Places Discovery App

A comprehensive mobile web application that integrates with Google Maps API to discover nearby places that are currently open, featuring real-time countdown timers and interactive maps.

## Features

### 🗺️ **Interactive Map & List Views**
- Dual view system with smooth transitions
- Interactive Google Maps with custom markers
- Scrollable list view with place cards
- Real-time location detection and centering

### ⏰ **Live Countdown Timers**
- Real-time countdown showing time until closing
- Color-coded urgency indicators (green >2hrs, yellow 30min-2hrs, red <30min)
- Animated timer updates every minute
- Extended countdown details on place pages

### 🎛️ **Advanced Filtering**
- Category toggle buttons (Restaurants, Cafés, Shops, Theatres, Museums, Attractions)
- Multi-select filtering with visual feedback
- Real-time search functionality
- Sort options (Name, Distance, Closing Time, Rating)

### 📱 **Mobile-Optimized Design**
- Touch-friendly interface with proper touch targets
- Responsive design for various screen sizes
- Bottom navigation for easy thumb access
- Smooth animations and micro-interactions

### ❤️ **Favorites System**
- Save places to favorites with local storage
- Manage favorites with search and filter
- Quick access to saved places
- Persistent storage across sessions

### 📊 **Rich Place Information**
- Detailed place cards with ratings and reviews
- Photo galleries with swipe navigation
- Operating hours display
- Contact information (phone, website, address)
- Directions integration

## Technical Implementation

### Libraries Used
- **Google Maps JavaScript API**: Core mapping and places functionality
- **Anime.js**: Smooth animations and micro-interactions
- **Splide.js**: Photo carousels and image galleries
- **ECharts.js**: Data visualization for ratings
- **Tailwind CSS**: Utility-first styling framework

### Core Functionality
- GPS location detection with error handling
- Google Places API integration for nearby search
- Real-time countdown timer management
- Local storage for favorites and preferences
- Progressive web app features

## File Structure
```
├── index.html          # Main discovery interface
├── details.html        # Place details page
├── favorites.html      # Favorites management
├── main.js            # Core application logic
├── resources/         # Images and assets
│   ├── cafe-atmosphere.png
│   ├── cinema-hall.png
│   └── attraction-landmark.png
└── README.md          # Documentation
```

## Usage

1. **Location Detection**: App automatically detects your location on load
2. **Browse Places**: Switch between map and list views
3. **Filter Results**: Use category toggles to filter by place type
4. **View Details**: Tap any place to see detailed information
5. **Save Favorites**: Heart icon to save places for later
6. **Get Directions**: One-tap directions to any place

## Browser Compatibility

- Modern mobile browsers (Chrome, Safari, Firefox)
- Progressive Web App (PWA) support
- Offline capability with cached data
- GPS and geolocation support required

## Performance Features

- Lazy loading for images and map tiles
- Efficient timer management with requestAnimationFrame
- Debounced search and filter operations
- Memory leak prevention with proper cleanup
- Battery optimization for GPS usage

## Design Philosophy

- **Mobile-First**: Optimized for touch interactions
- **Minimalist Aesthetic**: Clean, uncluttered interface
- **High Contrast**: Accessible color schemes
- **Consistent Branding**: Cohesive visual language
- **Performance Focused**: Smooth 60fps animations

## Privacy & Security

- No user data collection
- Local storage only for favorites
- Secure Google Maps API integration
- Location data used only for place discovery

---

**Built with modern web technologies for the best mobile experience**