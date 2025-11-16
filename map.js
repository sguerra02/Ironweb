// Map Constants
const MAP_WIDTH_MILES = 1200; // Total width of the map in miles
const MAP_SCALES = [100, 50, 20, 10, 5, 1]; // Available scale distances in miles

// Map Zoom System
let scale = 1;
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;
const mapWrapper = document.querySelector('.map-wrapper');
const mapContainer = document.getElementById('map-container');
const mapImage = document.getElementById('main-map');

// Map Marker System
let markers = JSON.parse(localStorage.getItem('ironswornMarkers')) || [];
let currentMarker = null;

function initializeMapZoom() {
    // Mouse wheel zoom
    mapWrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.min(Math.max(0.5, scale + delta), 3);
        
        // Calculate zoom center relative to map container
        const rect = mapWrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate current scroll percentages
        const scrollXPercent = mapWrapper.scrollLeft / (mapWrapper.scrollWidth - mapWrapper.clientWidth);
        const scrollYPercent = mapWrapper.scrollTop / (mapWrapper.scrollHeight - mapWrapper.clientHeight);
        
        scale = newScale;
        updateMapTransform();
        updateZoomInfo();
        updateMapScale();
        
        // Try to maintain zoom center
        setTimeout(() => {
            const newScrollLeft = scrollXPercent * (mapWrapper.scrollWidth - mapWrapper.clientWidth);
            const newScrollTop = scrollYPercent * (mapWrapper.scrollHeight - mapWrapper.clientHeight);
            mapWrapper.scrollLeft = newScrollLeft;
            mapWrapper.scrollTop = newScrollTop;
        }, 10);
    });

    // Drag to pan
    mapWrapper.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - mapWrapper.offsetLeft;
        startY = e.pageY - mapWrapper.offsetTop;
        scrollLeft = mapWrapper.scrollLeft;
        scrollTop = mapWrapper.scrollTop;
        mapWrapper.style.cursor = 'grabbing';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        mapWrapper.style.cursor = 'grab';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - mapWrapper.offsetLeft;
        const y = e.pageY - mapWrapper.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        mapWrapper.scrollLeft = scrollLeft - walkX;
        mapWrapper.scrollTop = scrollTop - walkY;
    });

    // Touch events for mobile
    let touchStartX, touchStartY, touchScrollLeft, touchScrollTop;

    mapWrapper.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.pageX;
        touchStartY = touch.pageY;
        touchScrollLeft = mapWrapper.scrollLeft;
        touchScrollTop = mapWrapper.scrollTop;
        mapWrapper.style.cursor = 'grabbing';
    });

    mapWrapper.addEventListener('touchmove', (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touch = e.touches[0];
        const walkX = (touch.pageX - touchStartX) * 2;
        const walkY = (touch.pageY - touchStartY) * 2;
        
        mapWrapper.scrollLeft = touchScrollLeft - walkX;
        mapWrapper.scrollTop = touchScrollTop - walkY;
        
        e.preventDefault();
    });

    mapWrapper.addEventListener('touchend', () => {
        touchStartX = null;
        touchStartY = null;
        mapWrapper.style.cursor = 'grab';
    });

    // Pinch to zoom for touch devices
    let initialDistance = null;

    mapWrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialDistance = getDistance(e.touches[0], e.touches[1]);
        }
    });

    mapWrapper.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && initialDistance !== null) {
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const delta = (currentDistance - initialDistance) * 0.01;
            
            const newScale = Math.min(Math.max(0.5, scale + delta), 3);
            scale = newScale;
            
            updateMapTransform();
            updateZoomInfo();
            updateMapScale();
            
            initialDistance = currentDistance;
            e.preventDefault();
        }
    });

    mapWrapper.addEventListener('touchend', () => {
        initialDistance = null;
    });

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
        scale = Math.min(scale + 0.1, 3);
        updateMapTransform();
        updateZoomInfo();
        updateMapScale();
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        scale = Math.max(scale - 0.1, 0.5);
        updateMapTransform();
        updateZoomInfo();
        updateMapScale();
    });

    document.getElementById('reset-zoom').addEventListener('click', () => {
        scale = 1;
        updateMapTransform();
        updateZoomInfo();
        updateMapScale();
        mapWrapper.scrollLeft = 0;
        mapWrapper.scrollTop = 0;
    });

    // Initialize scale
    updateMapScale();
}

function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateMapTransform() {
    mapContainer.style.transform = `scale(${scale})`;
}

function updateZoomInfo() {
    document.getElementById('zoom-level').textContent = `${Math.round(scale * 100)}%`;
}

// Map Scale System
function updateMapScale() {
    const scaleElement = document.getElementById('map-scale');
    const scaleBar = document.getElementById('scale-bar');
    const scaleLabel = document.getElementById('scale-label');
    
    // Calculate the appropriate scale distance based on zoom level
    const viewportWidth = mapWrapper.clientWidth;
    const mapWidthPixels = mapImage.naturalWidth * scale;
    const pixelsPerMile = mapWidthPixels / MAP_WIDTH_MILES;
    
    // Find the best scale distance that fits well in the viewport
    let bestScaleDistance = MAP_SCALES[0];
    for (const scaleDistance of MAP_SCALES) {
        const scaleWidthPixels = scaleDistance * pixelsPerMile;
        if (scaleWidthPixels <= viewportWidth * 0.3) { // Max 30% of viewport width
            bestScaleDistance = scaleDistance;
            break;
        }
    }
    
    // Calculate the width of the scale bar in pixels
    const scaleBarWidth = bestScaleDistance * pixelsPerMile;
    
    // Update the scale bar and label
    scaleBar.style.width = `${scaleBarWidth}px`;
    scaleLabel.textContent = `${bestScaleDistance} mile${bestScaleDistance !== 1 ? 's' : ''}`;
    
    // Show or hide scale based on zoom level (hide when too zoomed out)
    if (scale < 0.3) {
        scaleElement.style.display = 'none';
    } else {
        scaleElement.style.display = 'block';
    }
}

// Map Marker System
function initializeMapMarkers() {
    const mapMarkersContainer = document.getElementById('map-markers');
    mapMarkersContainer.innerHTML = '';
    
    markers.forEach(marker => {
        createMapMarker(marker);
    });
}

function createMapMarker(markerData) {
    const mapMarkersContainer = document.getElementById('map-markers');
    
    const marker = document.createElement('div');
    marker.className = 'map-marker';
    marker.style.left = `${markerData.x}%`;
    marker.style.top = `${markerData.y}%`;
    marker.dataset.markerId = markerData.id;
    
    marker.addEventListener('click', (e) => {
        e.stopPropagation();
        showMarkerPopup(markerData);
    });
    
    mapMarkersContainer.appendChild(marker);
}

function showMarkerPopup(markerData) {
    currentMarker = markerData;
    
    document.getElementById('marker-name').value = markerData.name || '';
    document.getElementById('marker-notes').value = markerData.notes || '';
    document.getElementById('marker-type').value = markerData.type || 'landmark';
    
    document.getElementById('marker-modal').classList.add('active');
}

function addMarkerToMap(x, y) {
    const markerId = Date.now().toString();
    const markerData = {
        id: markerId,
        x: x,
        y: y,
        name: 'New Location',
        notes: '',
        type: 'landmark'
    };
    
    markers.push(markerData);
    saveMarkers();
    createMapMarker(markerData);
    
    // Also create a corresponding location entry
    const locationData = {
        id: markerId,
        name: 'New Location',
        type: 'landmark',
        notes: '',
        description: '',
        characters: '',
        events: '',
        resources: '',
        quests: ''
    };
    
    // Access the global locations array from index.js
    if (typeof locations !== 'undefined') {
        locations.push(locationData);
        saveLocations();
    }
    
    showMarkerPopup(markerData);
}

function saveMarkers() {
    localStorage.setItem('ironswornMarkers', JSON.stringify(markers));
}

// Map event listeners
function initializeMapEventListeners() {
    document.getElementById('add-marker-btn').addEventListener('click', () => {
        // Enable click-to-add mode
        mapContainer.style.cursor = 'crosshair';
        
        const clickHandler = (e) => {
            const rect = mapContainer.getBoundingClientRect();
            const scrollX = mapWrapper.scrollLeft;
            const scrollY = mapWrapper.scrollTop;
            
            // Calculate position relative to the scaled map
            const x = ((e.clientX - rect.left + scrollX) / (rect.width * scale)) * 100;
            const y = ((e.clientY - rect.top + scrollY) / (rect.height * scale)) * 100;
            
            addMarkerToMap(x, y);
            
            // Remove the click handler after adding one marker
            mapContainer.removeEventListener('click', clickHandler);
            mapContainer.style.cursor = 'default';
        };
        
        mapContainer.addEventListener('click', clickHandler);
    });

    document.getElementById('clear-markers-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all markers? This cannot be undone.')) {
            markers = [];
            saveMarkers();
            initializeMapMarkers();
            
            // Also clear associated locations if locations array exists
            if (typeof locations !== 'undefined' && typeof initializeLocationsList !== 'undefined') {
                // Filter locations to only keep those without markers
                const markerIds = markers.map(m => m.id);
                locations = locations.filter(loc => markerIds.includes(loc.id));
                saveLocations();
                initializeLocationsList();
            }
        }
    });

    // Modal event listeners
    document.getElementById('close-marker-modal').addEventListener('click', () => {
        document.getElementById('marker-modal').classList.remove('active');
    });

    document.getElementById('save-marker').addEventListener('click', () => {
        if (currentMarker) {
            const markerIndex = markers.findIndex(m => m.id === currentMarker.id);
            
            if (markerIndex !== -1) {
                markers[markerIndex].name = document.getElementById('marker-name').value;
                markers[markerIndex].notes = document.getElementById('marker-notes').value;
                markers[markerIndex].type = document.getElementById('marker-type').value;
            }
            
            // Update corresponding location if locations array exists
            if (typeof locations !== 'undefined') {
                const locationIndex = locations.findIndex(l => l.id === currentMarker.id);
                if (locationIndex !== -1) {
                    locations[locationIndex].name = document.getElementById('marker-name').value;
                    locations[locationIndex].type = document.getElementById('marker-type').value;
                    locations[locationIndex].notes = document.getElementById('marker-notes').value;
                    saveLocations();
                    
                    if (typeof initializeLocationsList !== 'undefined') {
                        initializeLocationsList();
                    }
                }
            }
            
            saveMarkers();
            initializeMapMarkers();
            
            document.getElementById('marker-modal').classList.remove('active');
        }
    });

    document.getElementById('delete-marker').addEventListener('click', () => {
        if (currentMarker && confirm('Are you sure you want to delete this marker?')) {
            markers = markers.filter(m => m.id !== currentMarker.id);
            
            // Also delete corresponding location if locations array exists
            if (typeof locations !== 'undefined') {
                locations = locations.filter(l => l.id !== currentMarker.id);
                saveLocations();
                
                if (typeof initializeLocationsList !== 'undefined') {
                    initializeLocationsList();
                }
            }
            
            saveMarkers();
            initializeMapMarkers();
            
            document.getElementById('marker-modal').classList.remove('active');
        }
    });
}

// Measurement System
let isMeasuring = false;
let measurementPoints = [];
let currentMeasurement = null;

function initializeMeasurementSystem() {
    const measureBtn = document.getElementById('measure-distance-btn');
    const clearMeasurementBtn = document.getElementById('clear-measurement');
    
    measureBtn.addEventListener('click', startMeasurement);
    clearMeasurementBtn.addEventListener('click', clearMeasurement);
}

function startMeasurement() {
    if (isMeasuring) {
        cancelMeasurement();
        return;
    }
    
    isMeasuring = true;
    measurementPoints = [];
    
    // Update UI state
    document.getElementById('measure-distance-btn').classList.add('active');
    document.getElementById('map-container').classList.add('measuring-active');
    document.getElementById('measurement-info').style.display = 'block';
    
    // Show instructions
    showMeasurementInstructions();
    
    // Set up click handler for measurement points
    const clickHandler = (e) => {
        const rect = mapContainer.getBoundingClientRect();
        const scrollX = mapWrapper.scrollLeft;
        const scrollY = mapWrapper.scrollTop;
        
        // Calculate position relative to the scaled map
        const x = ((e.clientX - rect.left + scrollX) / (rect.width * scale)) * 100;
        const y = ((e.clientY - rect.top + scrollY) / (rect.height * scale)) * 100;
        
        addMeasurementPoint(x, y);
        
        // If we have two points, complete the measurement
        if (measurementPoints.length === 2) {
            completeMeasurement();
        }
    };
    
    mapContainer.addEventListener('click', clickHandler);
    
    // Store the click handler for cleanup
    currentMeasurement = {
        clickHandler: clickHandler
    };
}

function addMeasurementPoint(x, y) {
    measurementPoints.push({ x, y });
    updateMeasurementDisplay();
}

function updateMeasurementDisplay() {
    const measurementsContainer = document.getElementById('map-measurements');
    
    // Clear previous measurement
    measurementsContainer.innerHTML = '';
    
    // Create SVG for measurement visualization
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    
    // Draw points and lines
    measurementPoints.forEach((point, index) => {
        // Draw point
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', `${point.x}%`);
        circle.setAttribute('cy', `${point.y}%`);
        circle.setAttribute('r', '6');
        circle.setAttribute('class', 'measurement-point');
        circle.setAttribute('data-point', index + 1);
        svg.appendChild(circle);
        
        // Draw line between points
        if (index > 0) {
            const prevPoint = measurementPoints[index - 1];
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', `${prevPoint.x}%`);
            line.setAttribute('y1', `${prevPoint.y}%`);
            line.setAttribute('x2', `${point.x}%`);
            line.setAttribute('y2', `${point.y}%`);
            line.setAttribute('class', 'measurement-line');
            svg.appendChild(line);
            
            // Calculate and display distance
            if (measurementPoints.length === 2) {
                const distance = calculateDistance(prevPoint, point);
                displayDistance(distance);
            }
        }
    });
    
    measurementsContainer.appendChild(svg);
}

function calculateDistance(point1, point2) {
    // Calculate pixel positions
    const mapWidthPixels = mapImage.naturalWidth;
    const mapHeightPixels = mapImage.naturalHeight;
    
    const x1 = (point1.x / 100) * mapWidthPixels;
    const y1 = (point1.y / 100) * mapHeightPixels;
    const x2 = (point2.x / 100) * mapWidthPixels;
    const y2 = (point2.y / 100) * mapHeightPixels;
    
    // Calculate distance in pixels
    const pixelDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    // Convert to miles using the map scale
    const pixelsPerMile = mapWidthPixels / MAP_WIDTH_MILES;
    const distanceMiles = pixelDistance / pixelsPerMile;
    
    return distanceMiles;
}

function displayDistance(distance) {
    const distanceElement = document.getElementById('measurement-distance');
    distanceElement.textContent = distance.toFixed(1);
    
    // Update instructions
    updateMeasurementInstructions('complete');
}

function completeMeasurement() {
    // Clean up measurement state
    if (currentMeasurement && currentMeasurement.clickHandler) {
        mapContainer.removeEventListener('click', currentMeasurement.clickHandler);
    }
    
    // Update UI
    document.getElementById('measure-distance-btn').classList.remove('active');
    document.getElementById('map-container').classList.remove('measuring-active');
    
    // Update instructions
    updateMeasurementInstructions('complete');
}

function cancelMeasurement() {
    // Clean up measurement state
    if (currentMeasurement && currentMeasurement.clickHandler) {
        mapContainer.removeEventListener('click', currentMeasurement.clickHandler);
    }
    
    // Reset everything
    isMeasuring = false;
    measurementPoints = [];
    currentMeasurement = null;
    
    // Update UI
    document.getElementById('measure-distance-btn').classList.remove('active');
    document.getElementById('map-container').classList.remove('measuring-active');
    document.getElementById('measurement-info').style.display = 'none';
    
    // Clear measurement display
    document.getElementById('map-measurements').innerHTML = '';
    
    // Remove instructions
    hideMeasurementInstructions();
}

function clearMeasurement() {
    cancelMeasurement();
}

function showMeasurementInstructions() {
    // Remove any existing instructions
    hideMeasurementInstructions();
    
    const instructions = document.createElement('div');
    instructions.className = 'measurement-instructions';
    instructions.id = 'measurement-instructions';
    
    instructions.innerHTML = `
        <div class="step">Click on the map to set start point</div>
        <div class="step">Click again to set end point</div>
        <div style="margin-top: 5px; font-size: 0.8em; color: var(--color-parchment-dark);">
            Click the ruler button again to cancel
        </div>
    `;
    
    document.getElementById('map-container').appendChild(instructions);
}

function updateMeasurementInstructions(step) {
    const instructions = document.getElementById('measurement-instructions');
    if (!instructions) return;
    
    if (step === 'first') {
        instructions.innerHTML = `
            <div class="step">✓ Start point set</div>
            <div class="step">Click to set end point</div>
            <div style="margin-top: 5px; font-size: 0.8em; color: var(--color-parchment-dark);">
                Click the ruler button again to cancel
            </div>
        `;
    } else if (step === 'complete') {
        instructions.innerHTML = `
            <div class="step">✓ Measurement complete</div>
            <div style="margin-top: 5px; font-size: 0.8em; color: var(--color-parchment-dark);">
                Click "×" to clear or measure again
            </div>
        `;
    }
}

function hideMeasurementInstructions() {
    const instructions = document.getElementById('measurement-instructions');
    if (instructions) {
        instructions.remove();
    }
}

// Update the initializeMap function to include measurement system
function initializeMap() {
    // Wait for the map image to load before initializing scale
    mapImage.onload = function() {
        initializeMapZoom();
        updateMapScale();
    };
    
    // If image is already loaded (cached)
    if (mapImage.complete) {
        initializeMapZoom();
        updateMapScale();
    }
    
    initializeMapMarkers();
    initializeMapEventListeners();
    initializeMeasurementSystem(); // Add this line
    updateZoomInfo();
}

// Update the add marker button to cancel measurement if active
// Add this to the existing add marker event listener
document.getElementById('add-marker-btn').addEventListener('click', () => {
    // Cancel any active measurement
    if (isMeasuring) {
        cancelMeasurement();
    }
    
    // ... rest of existing code for adding markers
});

// Update the clear markers button to also clear measurements
document.getElementById('clear-markers-btn').addEventListener('click', () => {
    // Clear any active measurement
    if (isMeasuring) {
        cancelMeasurement();
    }
    
    // ... rest of existing code for clearing markers
});

// Initialize map when DOM is loaded
function initializeMap() {
    // Wait for the map image to load before initializing scale
    mapImage.onload = function() {
        initializeMapZoom();
        updateMapScale();
    };
    
    // If image is already loaded (cached)
    if (mapImage.complete) {
        initializeMapZoom();
        updateMapScale();
    }
    
    initializeMapMarkers();
    initializeMapEventListeners();
    updateZoomInfo();
}

// Hexagon Grid System
let isColoringHexagon = false;
let coloredHexagons = JSON.parse(localStorage.getItem('ironswornColoredHexagons')) || [];
let currentHexagon = null;
const HEX_RADIUS = 12.5; // 25px diameter / 2
const HEX_WIDTH = 25;
const HEX_HEIGHT = 21.65; // height = sqrt(3) * radius

function initializeHexagonSystem() {
    const colorHexagonBtn = document.getElementById('color-hexagon-btn');
    const clearHexagonBtn = document.getElementById('clear-hexagon');
    
    colorHexagonBtn.addEventListener('click', toggleHexagonColoring);
    clearHexagonBtn.addEventListener('click', clearHexagonSelection);
    
    drawHexagonGrid();
    updateHexagonDisplay();
}

function drawHexagonGrid() {
    const hexagonContainer = document.getElementById('map-hexagons');
    hexagonContainer.innerHTML = '';
    
    // Create SVG for hexagon visualization
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    
    // Draw hexagon grid (optional - for visualization)
    // drawHexagonGridOverlay(svg);
    
    // Draw colored hexagons
    coloredHexagons.forEach(hex => {
        drawHexagon(svg, hex.q, hex.r, true);
    });
    
    hexagonContainer.appendChild(svg);
}

function drawHexagonGridOverlay(svg) {
    // Draw a subtle hexagon grid overlay for reference
    const mapWidth = mapImage.naturalWidth;
    const mapHeight = mapImage.naturalHeight;
    
    for (let q = 0; q < mapWidth / (HEX_WIDTH * 0.75); q++) {
        for (let r = 0; r < mapHeight / HEX_HEIGHT; r++) {
            drawHexagon(svg, q, r, false);
        }
    }
}

function drawHexagon(svg, q, r, isColored) {
    const center = hexToPixel(q, r);
    const points = calculateHexagonPoints(center.x, center.y);
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    
    if (isColored) {
        polygon.setAttribute('class', 'hexagon-highlight');
        polygon.setAttribute('data-hex-q', q);
        polygon.setAttribute('data-hex-r', r);
    } else {
        polygon.setAttribute('class', 'hexagon-overlay');
    }
    
    svg.appendChild(polygon);
}

function calculateHexagonPoints(centerX, centerY) {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = 2 * Math.PI / 6 * i;
        const x = centerX + HEX_RADIUS * Math.cos(angle);
        const y = centerY + HEX_RADIUS * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    return points;
}

function hexToPixel(q, r) {
    const x = HEX_WIDTH * 0.75 * q;
    const y = HEX_HEIGHT * (r + 0.5 * (q % 2));
    return { x, y };
}

function pixelToHex(x, y) {
    // Convert pixel coordinates to hex coordinates
    const q = Math.floor(x / (HEX_WIDTH * 0.75));
    const r = Math.floor((y - (q % 2) * HEX_HEIGHT * 0.5) / HEX_HEIGHT);
    
    return { q, r };
}

function toggleHexagonColoring() {
    if (isColoringHexagon) {
        cancelHexagonColoring();
        return;
    }
    
    isColoringHexagon = true;
    
    // Update UI state
    document.getElementById('color-hexagon-btn').classList.add('active');
    document.getElementById('map-container').classList.add('hexagon-coloring-active');
    document.getElementById('hexagon-info').style.display = 'block';
    
    // Show instructions
    showHexagonInstructions();
    
    // Set up click handler for hexagon selection
    const clickHandler = (e) => {
        const rect = mapContainer.getBoundingClientRect();
        const scrollX = mapWrapper.scrollLeft;
        const scrollY = mapWrapper.scrollTop;
        
        // Calculate position relative to the scaled map in image coordinates
        const imageX = ((e.clientX - rect.left + scrollX) / (rect.width * scale)) * mapImage.naturalWidth;
        const imageY = ((e.clientY - rect.top + scrollY) / (rect.height * scale)) * mapImage.naturalHeight;
        
        selectHexagon(imageX, imageY);
    };
    
    mapContainer.addEventListener('click', clickHandler);
    
    // Store the click handler for cleanup
    currentHexagon = {
        clickHandler: clickHandler
    };
}

function selectHexagon(x, y) {
    const hexCoords = pixelToHex(x, y);
    
    // Check if this hexagon is already colored
    const existingIndex = coloredHexagons.findIndex(hex => 
        hex.q === hexCoords.q && hex.r === hexCoords.r
    );
    
    if (existingIndex === -1) {
        // Add new colored hexagon
        coloredHexagons.push(hexCoords);
    } else {
        // Remove existing colored hexagon
        coloredHexagons.splice(existingIndex, 1);
    }
    
    saveColoredHexagons();
    drawHexagonGrid();
    updateHexagonDisplay(hexCoords);
}

function updateHexagonDisplay(hexCoords = null) {
    if (hexCoords) {
        document.getElementById('hexagon-coords').textContent = `${hexCoords.q},${hexCoords.r}`;
    }
    
    // Update instructions
    if (coloredHexagons.length > 0) {
        updateHexagonInstructions('colored');
    } else {
        updateHexagonInstructions('active');
    }
}

function cancelHexagonColoring() {
    // Clean up hexagon coloring state
    if (currentHexagon && currentHexagon.clickHandler) {
        mapContainer.removeEventListener('click', currentHexagon.clickHandler);
    }
    
    // Reset state
    isColoringHexagon = false;
    currentHexagon = null;
    
    // Update UI
    document.getElementById('color-hexagon-btn').classList.remove('active');
    document.getElementById('map-container').classList.remove('hexagon-coloring-active');
    
    // Remove instructions
    hideHexagonInstructions();
}

function clearHexagonSelection() {
    coloredHexagons = [];
    saveColoredHexagons();
    drawHexagonGrid();
    document.getElementById('hexagon-info').style.display = 'none';
    cancelHexagonColoring();
}

function saveColoredHexagons() {
    localStorage.setItem('ironswornColoredHexagons', JSON.stringify(coloredHexagons));
}

function showHexagonInstructions() {
    // Remove any existing instructions
    hideHexagonInstructions();
    
    const instructions = document.createElement('div');
    instructions.className = 'hexagon-instructions';
    instructions.id = 'hexagon-instructions';
    
    instructions.innerHTML = `
        <div class="step">Click on any hexagon to color it blue</div>
        <div class="step">Click again to remove the color</div>
        <div style="margin-top: 5px; font-size: 0.8em; color: var(--color-parchment-dark);">
            Click the brush button again to exit coloring mode
        </div>
    `;
    
    document.getElementById('map-container').appendChild(instructions);
}

function updateHexagonInstructions(state) {
    const instructions = document.getElementById('hexagon-instructions');
    if (!instructions) return;
    
    if (state === 'colored') {
        instructions.innerHTML = `
            <div class="step">✓ Hexagon colored</div>
            <div class="step">Click other hexagons to color them</div>
            <div style="margin-top: 5px; font-size: 0.8em; color: var(--color-parchment-dark);">
                Click the brush button again to exit or "×" to clear all
            </div>
        `;
    }
}

function hideHexagonInstructions() {
    const instructions = document.getElementById('hexagon-instructions');
    if (instructions) {
        instructions.remove();
    }
}

// Update the initializeMap function to include hexagon system
function initializeMap() {
    // Wait for the map image to load before initializing scale and hexagons
    mapImage.onload = function() {
        initializeMapZoom();
        updateMapScale();
        initializeHexagonSystem(); // Add this line
    };
    
    // If image is already loaded (cached)
    if (mapImage.complete) {
        initializeMapZoom();
        updateMapScale();
        initializeHexagonSystem(); // Add this line
    }
    
    initializeMapMarkers();
    initializeMapEventListeners();
    initializeMeasurementSystem();
    updateZoomInfo();
}

// Update the add marker button to cancel hexagon coloring if active
document.getElementById('add-marker-btn').addEventListener('click', () => {
    // Cancel any active hexagon coloring
    if (isColoringHexagon) {
        cancelHexagonColoring();
    }
    
    // ... rest of existing code for adding markers
});

// Update the measurement button to cancel hexagon coloring if active
document.getElementById('measure-distance-btn').addEventListener('click', () => {
    // Cancel any active hexagon coloring
    if (isColoringHexagon) {
        cancelHexagonColoring();
    }
    
    // ... rest of existing measurement code
});

// Update the clear markers button to also maintain hexagon state
document.getElementById('clear-markers-btn').addEventListener('click', () => {
    // Clear any active hexagon coloring
    if (isColoringHexagon) {
        cancelHexagonColoring();
    }
    
    // ... rest of existing code for clearing markers
});

// Update scale when window resizes
window.addEventListener('resize', () => {
    updateMapScale();
});

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeMap,
        markers,
        currentMarker,
        addMarkerToMap,
        saveMarkers
    };
}