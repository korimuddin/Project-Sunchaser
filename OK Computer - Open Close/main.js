// Nearby Places Discovery App - Main JavaScript
class NearbyPlacesApp {
    constructor() {
        this.map = null;
        this.userLocation = null;
        this.places = [];
        this.markers = [];
        this.currentView = 'map';
        this.activeCategories = ['all'];
        this.timers = new Map();
        this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeMap();
        this.startLocationDetection();
    }

    setupEventListeners() {
        // View toggle buttons
        document.getElementById('mapViewBtn').addEventListener('click', () => this.switchView('map'));
        document.getElementById('listViewBtn').addEventListener('click', () => this.switchView('list'));
        
        // Category filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleCategory(e.target.dataset.category));
        });
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        
        // Location centering
        document.getElementById('centerLocationBtn').addEventListener('click', () => this.centerOnLocation());
        
        // Handle page visibility changes for timer updates
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateAllTimers();
            }
        });
    }

    initializeMap() {
        const mapOptions = {
            zoom: 15,
            center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
            styles: [
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', stylers: [{ visibility: 'off' }] }
            ],
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false
        };
        
        this.map = new google.maps.Map(document.getElementById('map'), mapOptions);
        
        // Add custom map styling
        this.map.setOptions({
            styles: [
                {
                    "featureType": "all",
                    "elementType": "geometry",
                    "stylers": [{ "color": "#f5f5f5" }]
                },
                {
                    "featureType": "water",
                    "elementType": "geometry",
                    "stylers": [{ "color": "#c9c9c9" }]
                },
                {
                    "featureType": "poi.business",
                    "stylers": [{ "visibility": "off" }]
                }
            ]
        });
    }

    startLocationDetection() {
        this.updateLocationStatus('Locating...', 'animate-pulse');
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    this.map.setCenter(this.userLocation);
                    this.addUserLocationMarker();
                    this.updateLocationStatus('Location found', 'bg-green-400');
                    this.searchNearbyPlaces();
                },
                (error) => {
                    console.error('Location error:', error);
                    this.updateLocationStatus('Location unavailable', 'bg-red-400');
                    this.searchNearbyPlaces(); // Use default location
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        } else {
            this.updateLocationStatus('Geolocation not supported', 'bg-red-400');
            this.searchNearbyPlaces();
        }
    }

    updateLocationStatus(text, pulseClass) {
        const statusEl = document.getElementById('locationStatus');
        const dot = statusEl.querySelector('div');
        const textEl = statusEl.querySelector('span');
        
        dot.className = `w-2 h-2 rounded-full mr-2 ${pulseClass}`;
        textEl.textContent = text;
    }

    addUserLocationMarker() {
        new google.maps.Marker({
            position: this.userLocation,
            map: this.map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
            },
            title: 'Your Location'
        });
    }

    searchNearbyPlaces() {
        try {
            const service = new google.maps.places.PlacesService(this.map);
            const location = this.userLocation || { lat: 40.7128, lng: -74.0060 };
            
            const request = {
                location: location,
                radius: 2000,
                type: ['restaurant', 'cafe', 'store', 'movie_theater', 'museum', 'tourist_attraction'],
                openNow: true
            };
            
            service.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    this.places = results;
                    this.processPlaces();
                    this.hideLoading();
                } else {
                    console.error('Places search failed:', status);
                    this.loadMockData();
                }
            });
        } catch (error) {
            console.error('Error in searchNearbyPlaces:', error);
            this.loadMockData();
        }
    }

    loadMockData() {
        // Fallback mock data when API fails
        const mockPlaces = [
            {
                place_id: 'mock1',
                name: 'The Coffee House',
                vicinity: '123 Main St, Downtown',
                types: ['cafe', 'restaurant'],
                rating: 4.5,
                geometry: { location: { lat: 40.7128, lng: -74.0060 } },
                details: {
                    formatted_address: '123 Main St, Downtown, NY 10001',
                    formatted_phone_number: '(555) 123-4567',
                    website: 'https://coffeehouse.com',
                    opening_hours: {
                        periods: [
                            { open: { time: 600 }, close: { time: 2200 } },
                            { open: { time: 600 }, close: { time: 2200 } },
                            { open: { time: 600 }, close: { time: 2200 } },
                            { open: { time: 600 }, close: { time: 2200 } },
                            { open: { time: 600 }, close: { time: 2300 } },
                            { open: { time: 700 }, close: { time: 2300 } },
                            { open: { time: 700 }, close: { time: 2100 } }
                        ]
                    }
                }
            },
            {
                place_id: 'mock2',
                name: 'City Museum of Art',
                vicinity: '456 Art District, Museum Quarter',
                types: ['museum'],
                rating: 4.8,
                geometry: { location: { lat: 40.7589, lng: -73.9851 } },
                details: {
                    formatted_address: '456 Art District, Museum Quarter, NY 10002',
                    formatted_phone_number: '(555) 234-5678',
                    website: 'https://citymuseum.org',
                    opening_hours: {
                        periods: [
                            { open: { time: 1000 }, close: { time: 1800 } },
                            { open: { time: 900 }, close: { time: 1700 } },
                            { open: { time: 900 }, close: { time: 1700 } },
                            { open: { time: 900 }, close: { time: 1700 } },
                            { open: { time: 900 }, close: { time: 2100 } },
                            { open: { time: 900 }, close: { time: 2100 } },
                            { open: { time: 1000 }, close: { time: 1800 } }
                        ]
                    }
                }
            },
            {
                place_id: 'mock3',
                name: 'Bella Italia Restaurant',
                vicinity: '789 Little Italy, Food Street',
                types: ['restaurant'],
                rating: 4.3,
                geometry: { location: { lat: 40.7505, lng: -73.9934 } },
                details: {
                    formatted_address: '789 Little Italy, Food Street, NY 10003',
                    formatted_phone_number: '(555) 345-6789',
                    website: 'https://bellaitalia.com',
                    opening_hours: {
                        periods: [
                            null,
                            { open: { time: 1700 }, close: { time: 2300 } },
                            { open: { time: 1700 }, close: { time: 2300 } },
                            { open: { time: 1700 }, close: { time: 2300 } },
                            { open: { time: 1700 }, close: { time: 2400 } },
                            { open: { time: 1700 }, close: { time: 2400 } },
                            { open: { time: 1600 }, close: { time: 2300 } }
                        ]
                    }
                }
            },
            {
                place_id: 'mock4',
                name: 'Grand Cinema Complex',
                vicinity: '321 Theater District, Entertainment Ave',
                types: ['movie_theater'],
                rating: 4.1,
                geometry: { location: { lat: 40.7614, lng: -73.9776 } },
                details: {
                    formatted_address: '321 Theater District, Entertainment Ave, NY 10004',
                    formatted_phone_number: '(555) 456-7890',
                    website: 'https://grandcinema.com',
                    opening_hours: {
                        periods: [
                            { open: { time: 1100 }, close: { time: 2300 } },
                            { open: { time: 1500 }, close: { time: 2300 } },
                            { open: { time: 1500 }, close: { time: 2300 } },
                            { open: { time: 1500 }, close: { time: 2300 } },
                            { open: { time: 1500 }, close: { time: 2400 } },
                            { open: { time: 1100 }, close: { time: 2400 } },
                            { open: { time: 1100 }, close: { time: 2400 } }
                        ]
                    }
                }
            },
            {
                place_id: 'mock5',
                name: 'Fashion Boutique',
                vicinity: '654 Shopping Mall, Retail Boulevard',
                types: ['store'],
                rating: 4.0,
                geometry: { location: { lat: 40.7282, lng: -73.9942 } },
                details: {
                    formatted_address: '654 Shopping Mall, Retail Boulevard, NY 10005',
                    formatted_phone_number: '(555) 567-8901',
                    website: 'https://fashionboutique.com',
                    opening_hours: {
                        periods: [
                            { open: { time: 1000 }, close: { time: 2100 } },
                            { open: { time: 1000 }, close: { time: 2100 } },
                            { open: { time: 1000 }, close: { time: 2100 } },
                            { open: { time: 1000 }, close: { time: 2100 } },
                            { open: { time: 1000 }, close: { time: 2200 } },
                            { open: { time: 1000 }, close: { time: 2200 } },
                            { open: { time: 1100 }, close: { time: 2000 } }
                        ]
                    }
                }
            },
            {
                place_id: 'mock6',
                name: 'Skyline Observation Deck',
                vicinity: '987 Tower Heights, View Point',
                types: ['tourist_attraction'],
                rating: 4.7,
                geometry: { location: { lat: 40.7489, lng: -73.9680 } },
                details: {
                    formatted_address: '987 Tower Heights, View Point, NY 10006',
                    formatted_phone_number: '(555) 678-9012',
                    website: 'https://skylineobservatory.com',
                    opening_hours: {
                        periods: [
                            { open: { time: 800 }, close: { time: 2200 } },
                            { open: { time: 800 }, close: { time: 2200 } },
                            { open: { time: 800 }, close: { time: 2200 } },
                            { open: { time: 800 }, close: { time: 2200 } },
                            { open: { time: 800 }, close: { time: 2300 } },
                            { open: { time: 800 }, close: { time: 2300 } },
                            { open: { time: 800 }, close: { time: 2200 } }
                        ]
                    }
                }
            }
        ];

        this.places = mockPlaces;
        this.processPlaces();
        this.hideLoading();
        this.showNotification('Using demo data - some features may be limited');
    }

    processPlaces() {
        this.clearMarkers();
        this.places.forEach(place => {
            this.getPlaceDetails(place);
        });
        this.updateListView();
    }

    getPlaceDetails(place) {
        const service = new google.maps.places.PlacesService(this.map);
        
        service.getDetails({
            placeId: place.place_id,
            fields: ['name', 'geometry', 'opening_hours', 'formatted_address', 'formatted_phone_number', 'rating', 'photos', 'website']
        }, (placeDetails, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                place.details = placeDetails;
                this.addPlaceMarker(place);
                this.updateListView();
            }
        });
    }

    addPlaceMarker(place) {
        const category = this.getPlaceCategory(place);
        const icon = this.getCategoryIcon(category);
        
        const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: this.map,
            icon: {
                url: icon,
                scaledSize: new google.maps.Size(30, 30)
            },
            title: place.name
        });
        
        const infoWindow = new google.maps.InfoWindow({
            content: this.createInfoWindowContent(place)
        });
        
        marker.addListener('click', () => {
            infoWindow.open(this.map, marker);
            this.showPlaceDetails(place);
        });
        
        this.markers.push(marker);
    }

    getPlaceCategory(place) {
        const types = place.types || [];
        if (types.includes('restaurant')) return 'restaurant';
        if (types.includes('cafe') || types.includes('coffee')) return 'cafe';
        if (types.includes('store') || types.includes('shopping')) return 'store';
        if (types.includes('movie_theater')) return 'movie_theater';
        if (types.includes('museum')) return 'museum';
        if (types.includes('tourist_attraction')) return 'tourist_attraction';
        return 'other';
    }

    getCategoryIcon(category) {
        const icons = {
            restaurant: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiNGRjZCNkIiLz4KPHN2ZyB4PSI3IiB5PSI3IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNOC4xIDEzLjM0bDIuODMtMi44M0wzLjkxIDMuNWMtMS41NiAxLjU2LTEuNTYgNC4wOSAwIDUuNjZsNC4xOSA0LjE4em02Ljc4LTEuODFjMS41My45NCAzLjUuNDcgNC40My0xLjA2LjkyLTEuNTIuNDctMy41NS0xLjA2LTQuNDNsLTEuMjMgMS4yMy0yLjA3LTIuMDcgMS4yMy0xLjIzYy0xLjUzLS45NC0zLjUtLjQ3LTQuNDMgMS4wNi0uOTIgMS41Mi0uNDcgMy41NSAxLjA2IDQuNDNsMi44MyAyLjgzeiIvPgo8L3N2Zz4KPC9zdmc+',
            cafe: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiM4QjQ1MTMiLz4KPHN2ZyB4PSI3IiB5PSI3IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTggMzJ2LTJoLTJ2LTRoMnYtMmgtMnYtNGgydi0ySDEwVjEwSDh2MmgydjJoLTJ2MmgydjJoLTJ2MmgydjJoLTJ2MmgydjJoLTJ2MmgydjJoNHYySDE4eiIvPgo8L3N2Zz4KPC9zdmc+',
            store: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiM5QzI3QjAiLz4KPHN2ZyB4PSI3IiB5PSI3IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNNyAxOGMtMS4xIDAtMi0uOS0yLTJzLjktMiAyLTIgMiAuOSAyIDItLjkgMi0yIDJ6TTE3IDE4Yy0xLjEgMC0yLS45LTItMnMuOS0yIDItMiAyIC45IDIgMi0uOSAyLTIgMnptLTguNS0xNGwtMS41IDJoLTZsLS41IDFoMTcuNWwtMS41LTVoLTYuNWwtMS41IDJ6Ii8+Cjwvc3ZnPgo8L3N2Zz4=',
            movie_theater: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiNEMzJGMkYiLz4KPHN2ZyB4PSI3IiB5PSI3IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTggNHYxNmgtMTJ2LTE2aDEybTItMmgtMTZjLjc1IDAgMS40Mi4yNSAxLjk1LjY4bDMuMDUgMy4wNmg2bDMuMDUtMy4wNmMuNTMtLjQzIDEuMi0uNjggMS45NS0uNjh2MTh6Ii8+Cjwvc3ZnPgo8L3N2Zz4=',
            museum: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiMzRjUxQjUiLz4KPHN2ZyB4PSI3IiB5PSI3IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTAgMnYyaDh2LTRoLTEwdjJoMnptNCA2aC0zdi0yaC0ydjJoLTN2MmgzdjJoMnYtMmgzdi0yem0wIDRoLTN2LTJoLTJ2MmgtM3YyaDN2Mmgydi0yaDN2LTJ6Ii8+Cjwvc3ZnPgo8L3N2Zz4=',
            tourist_attraction: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiNGRkM0MDAiLz4KPHN2ZyB4PSI3IiB5PSI3IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTIgMmwtMy43IDcuNi04LjMgMS44IDYuMiA2LjEuNCA4LjUgMy40LTQuNyA0LjIgNS4xLS4zLTguNSA2LjItNi4xLTguMy0xLjh6Ii8+Cjwvc3ZnPgo8L3N2Zz4=',
            other: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiM2QjczODAiLz4KPHN2ZyB4PSI3IiB5PSI3IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIi8+Cjwvc3ZnPgo8L3N2Zz4='
        };
        return icons[category] || icons.other;
    }

    createInfoWindowContent(place) {
        const closingTime = this.getClosingTime(place);
        const timeRemaining = this.getTimeRemaining(closingTime);
        const urgencyClass = this.getTimerUrgencyClass(timeRemaining);
        
        return `
            <div class="p-3 max-w-xs">
                <h3 class="font-semibold text-gray-800 mb-2">${place.name}</h3>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-600">Closing in:</span>
                    <span class="text-sm font-bold ${urgencyClass}">${this.formatTimeRemaining(timeRemaining)}</span>
                </div>
                <p class="text-xs text-gray-500 mb-2">${place.vicinity || 'Address not available'}</p>
                <button onclick="app.showPlaceDetails('${place.place_id}')" 
                        class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                    View Details
                </button>
            </div>
        `;
    }

    getClosingTime(place) {
        if (place.details && place.details.opening_hours) {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const periods = place.details.opening_hours.periods;
            
            if (periods && periods[dayOfWeek]) {
                const closeTime = periods[dayOfWeek].close;
                if (closeTime) {
                    const closingDate = new Date();
                    closingDate.setHours(Math.floor(closeTime.time / 100), closeTime.time % 100, 0, 0);
                    return closingDate;
                }
            }
        }
        
        // Default closing time (11 PM)
        const defaultClosing = new Date();
        defaultClosing.setHours(23, 0, 0, 0);
        return defaultClosing;
    }

    getTimeRemaining(closingTime) {
        const now = new Date();
        const timeDiff = closingTime.getTime() - now.getTime();
        return Math.max(0, timeDiff);
    }

    getTimerUrgencyClass(timeRemaining) {
        const hours = timeRemaining / (1000 * 60 * 60);
        if (hours < 0.5) return 'text-red-600 timer-urgent';
        if (hours < 2) return 'text-orange-600 timer-warning';
        return 'text-green-600';
    }

    formatTimeRemaining(timeRemaining) {
        if (timeRemaining <= 0) return 'Closed';
        
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    switchView(view) {
        this.currentView = view;
        
        const mapView = document.getElementById('mapView');
        const listView = document.getElementById('listView');
        const mapBtn = document.getElementById('mapViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        
        if (view === 'map') {
            mapView.classList.remove('hidden');
            listView.classList.add('hidden');
            mapBtn.classList.add('bg-white', 'shadow-sm', 'text-blue-600');
            mapBtn.classList.remove('text-gray-600');
            listBtn.classList.remove('bg-white', 'shadow-sm', 'text-blue-600');
            listBtn.classList.add('text-gray-600');
            
            // Trigger map resize
            setTimeout(() => {
                google.maps.event.trigger(this.map, 'resize');
                if (this.userLocation) {
                    this.map.setCenter(this.userLocation);
                }
            }, 100);
        } else {
            mapView.classList.add('hidden');
            listView.classList.remove('hidden');
            listBtn.classList.add('bg-white', 'shadow-sm', 'text-blue-600');
            listBtn.classList.remove('text-gray-600');
            mapBtn.classList.remove('bg-white', 'shadow-sm', 'text-blue-600');
            mapBtn.classList.add('text-gray-600');
        }
        
        // Animate view transition
        anime({
            targets: view === 'map' ? mapView : listView,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 300,
            easing: 'easeOutQuad'
        });
    }

    toggleCategory(category) {
        const btn = document.querySelector(`[data-category="${category}"]`);
        
        if (category === 'all') {
            // Handle "all" category selection
            if (this.activeCategories.includes('all')) {
                // If all is active, do nothing (must have at least one category)
                return;
            } else {
                // Select all categories
                this.activeCategories = ['all'];
                document.querySelectorAll('.category-btn').forEach(b => {
                    b.classList.remove('category-active');
                    b.classList.add('category-inactive');
                });
                btn.classList.remove('category-inactive');
                btn.classList.add('category-active');
            }
        } else {
            // Handle individual category selection
            if (this.activeCategories.includes('all')) {
                // Remove "all" and select individual category
                this.activeCategories = [category];
                document.querySelector('[data-category="all"]').classList.remove('category-active');
                document.querySelector('[data-category="all"]').classList.add('category-inactive');
                btn.classList.remove('category-inactive');
                btn.classList.add('category-active');
            } else {
                // Toggle individual category
                if (this.activeCategories.includes(category)) {
                    // Remove category
                    this.activeCategories = this.activeCategories.filter(c => c !== category);
                    btn.classList.remove('category-active');
                    btn.classList.add('category-inactive');
                    
                    // If no categories selected, select "all"
                    if (this.activeCategories.length === 0) {
                        this.activeCategories = ['all'];
                        document.querySelector('[data-category="all"]').classList.remove('category-inactive');
                        document.querySelector('[data-category="all"]').classList.add('category-active');
                    }
                } else {
                    // Add category
                    this.activeCategories.push(category);
                    btn.classList.remove('category-inactive');
                    btn.classList.add('category-active');
                }
            }
        }
        
        // Animate button press
        anime({
            targets: btn,
            scale: [1, 0.95, 1],
            duration: 200,
            easing: 'easeOutQuad'
        });
        
        this.filterPlaces();
    }

    filterPlaces() {
        let filteredPlaces = this.places;
        
        if (!this.activeCategories.includes('all')) {
            filteredPlaces = this.places.filter(place => {
                const category = this.getPlaceCategory(place);
                return this.activeCategories.includes(category);
            });
        }
        
        this.updateMarkersVisibility(filteredPlaces);
        this.updateListView(filteredPlaces);
    }

    updateMarkersVisibility(visiblePlaces) {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
        
        visiblePlaces.forEach(place => {
            this.addPlaceMarker(place);
        });
    }

    updateListView(placesToShow = null) {
        const places = placesToShow || this.places;
        const placesList = document.getElementById('placesList');
        
        if (places.length === 0) {
            placesList.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">No places found</p>
                </div>
            `;
            return;
        }
        
        placesList.innerHTML = places.map(place => this.createPlaceCard(place)).join('');
        
        // Start countdown timers for visible cards
        this.startCountdownTimers();
    }

    createPlaceCard(place) {
        const category = this.getPlaceCategory(place);
        const categoryName = this.getCategoryDisplayName(category);
        const closingTime = this.getClosingTime(place);
        const timeRemaining = this.getTimeRemaining(closingTime);
        const urgencyClass = this.getTimerUrgencyClass(timeRemaining);
        const rating = place.rating || 0;
        const isFavorite = this.favorites.includes(place.place_id);
        
        return `
            <div class="place-card bg-white rounded-lg card-shadow p-4 cursor-pointer" 
                 onclick="app.showPlaceDetails('${place.place_id}')">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-800 text-sm mb-1">${place.name}</h3>
                        <p class="text-xs text-gray-500">${categoryName}</p>
                    </div>
                    <button onclick="event.stopPropagation(); app.toggleFavorite('${place.place_id}')" 
                            class="p-2 ${isFavorite ? 'text-red-500' : 'text-gray-300'}">
                        <svg class="w-4 h-4" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <div class="flex items-center">
                            ${this.renderStars(rating)}
                            <span class="text-xs text-gray-500 ml-1">${rating.toFixed(1)}</span>
                        </div>
                        <span class="text-xs text-gray-400">•</span>
                        <span class="text-xs text-gray-500">${this.formatDistance(place)}</span>
                    </div>
                </div>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <span class="text-xs text-gray-600">Open Now</span>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-gray-500">Closing in</div>
                        <div class="text-sm font-bold ${urgencyClass}" data-place-id="${place.place_id}" data-timer="${closingTime.getTime()}">
                            ${this.formatTimeRemaining(timeRemaining)}
                        </div>
                    </div>
                </div>
                
                <p class="text-xs text-gray-400 mt-2">${place.vicinity || 'Address not available'}</p>
            </div>
        `;
    }

    getCategoryDisplayName(category) {
        const names = {
            restaurant: 'Restaurant',
            cafe: 'Café',
            store: 'Shop',
            movie_theater: 'Movie Theater',
            museum: 'Museum',
            tourist_attraction: 'Attraction',
            other: 'Place'
        };
        return names[category] || names.other;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<svg class="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>';
        }
        
        if (hasHalfStar) {
            stars += '<svg class="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0v15z"/></svg>';
        }
        
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<svg class="w-3 h-3 text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>';
        }
        
        return stars;
    }

    formatDistance(place) {
        if (!this.userLocation || !place.geometry) return 'Unknown';
        
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(this.userLocation),
            place.geometry.location
        );
        
        if (distance < 1000) {
            return `${Math.round(distance)}m`;
        } else {
            return `${(distance / 1000).toFixed(1)}km`;
        }
    }

    startCountdownTimers() {
        // Clear existing timers
        this.timers.forEach(timer => clearInterval(timer));
        this.timers.clear();
        
        // Start new timers for visible cards
        const timerElements = document.querySelectorAll('[data-timer]');
        timerElements.forEach(element => {
            const placeId = element.dataset.placeId;
            const closingTime = parseInt(element.dataset.timer);
            
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const timeRemaining = closingTime - now;
                
                if (timeRemaining <= 0) {
                    element.textContent = 'Closed';
                    element.className = 'text-sm font-bold text-red-600';
                    clearInterval(timer);
                } else {
                    element.textContent = this.formatTimeRemaining(timeRemaining);
                    element.className = `text-sm font-bold ${this.getTimerUrgencyClass(timeRemaining)}`;
                }
            }, 60000); // Update every minute
            
            this.timers.set(placeId, timer);
        });
    }

    updateAllTimers() {
        this.startCountdownTimers();
    }

    handleSearch(query) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    performSearch(query = '') {
        if (!query.trim()) {
            this.filterPlaces();
            return;
        }
        
        const filteredPlaces = this.places.filter(place => 
            place.name.toLowerCase().includes(query.toLowerCase()) ||
            (place.vicinity && place.vicinity.toLowerCase().includes(query.toLowerCase()))
        );
        
        this.updateMarkersVisibility(filteredPlaces);
        this.updateListView(filteredPlaces);
    }

    centerOnLocation() {
        if (this.userLocation) {
            this.map.setCenter(this.userLocation);
            this.map.setZoom(15);
            
            // Animate button press
            anime({
                targets: '#centerLocationBtn',
                scale: [1, 0.9, 1],
                duration: 200,
                easing: 'easeOutQuad'
            });
        }
    }

    showPlaceDetails(placeId) {
        const place = this.places.find(p => p.place_id === placeId);
        if (place) {
            // Store place data for details page
            localStorage.setItem('selectedPlace', JSON.stringify(place));
            window.location.href = 'details.html';
        }
    }

    toggleFavorite(placeId) {
        const index = this.favorites.indexOf(placeId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(placeId);
        }
        
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.updateListView();
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        anime({
            targets: loadingState,
            opacity: [1, 0],
            duration: 300,
            easing: 'easeOutQuad',
            complete: () => {
                loadingState.style.display = 'none';
            }
        });
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-20 left-4 right-4 bg-red-500 text-white p-4 rounded-lg z-50';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Animate in
        anime({
            targets: errorDiv,
            translateY: [-20, 0],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuad'
        });
        
        // Remove after 5 seconds
        setTimeout(() => {
            anime({
                targets: errorDiv,
                translateY: [0, -20],
                opacity: [1, 0],
                duration: 300,
                easing: 'easeOutQuad',
                complete: () => {
                    document.body.removeChild(errorDiv);
                }
            });
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NearbyPlacesApp();
});

// Handle page visibility changes for better timer management
document.addEventListener('visibilitychange', () => {
    if (window.app && !document.hidden) {
        window.app.updateAllTimers();
    }
});

// Export for global access
window.NearbyPlacesApp = NearbyPlacesApp;