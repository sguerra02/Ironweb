// Global variables
let locations = JSON.parse(localStorage.getItem('ironswornLocations')) || [];
let characters = JSON.parse(localStorage.getItem('ironswornCharacters')) || [
    {
        id: '1',
        name: 'Kaelen the Smith',
        role: 'ally',
        disposition: 'friendly',
        location: '',
        goal: 'Protect his family and maintain his forge',
        details: 'Burly man with soot-stained hands and a warm smile. Always has a story to tell.',
        backstory: 'Former Ironlander soldier who lost his family in a raider attack. Now dedicates his life to protecting his new community.',
        notes: 'Can craft quality weapons and armor. Knows much about the local region.'
    },
    {
        id: '2',
        name: 'Morwen the Shadowed',
        role: 'neutral',
        disposition: 'suspicious',
        location: '',
        goal: 'Gather information and maintain her network of spies',
        details: 'Slender woman with sharp eyes and quiet movements. Dresses in dark, practical clothing.',
        backstory: 'Exiled from her clan for uncovering secrets they wanted buried.',
        notes: 'Has information about the old ruins to the north. Will trade secrets for favors.'
    }
];
let currentCharacter = null;

// Tab switching functionality
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        
        // Refresh character locations when characters tab is opened
        if (tab.dataset.tab === 'characters') {
            updateCharacterLocationDropdown();
        }
    });
});

// Momentum functionality
let momentum = 2;

document.querySelector('.momentum-increase').addEventListener('click', () => {
    momentum++;
    updateMomentumDisplay();
});

document.querySelector('.momentum-reset').addEventListener('click', () => {
    momentum = 2;
    updateMomentumDisplay();
});

function updateMomentumDisplay() {
    const momentumValue = document.getElementById('momentum-value');
    momentumValue.textContent = momentum >= 0 ? `+${momentum}` : `${momentum}`;
}

// Locations System
function saveLocations() {
    localStorage.setItem('ironswornLocations', JSON.stringify(locations));
    updateCharacterLocationDropdown();
}

function initializeLocationsList() {
    const locationsList = document.getElementById('locations-list');
    locationsList.innerHTML = '';
    
    // Populate location dropdown in character modal
    updateCharacterLocationDropdown();
    
    locations.forEach(location => {
        const locationCard = document.createElement('div');
        locationCard.className = 'location-card';
        locationCard.dataset.locationId = location.id;
        
        locationCard.innerHTML = `
            <div class="location-header">
                <h3 class="location-name">${location.name}</h3>
                <span class="location-type">${location.type}</span>
            </div>
            <p class="location-preview">${location.notes || location.description || 'No notes available'}</p>
        `;
        
        locationCard.addEventListener('click', () => {
            showLocationEditor(location);
        });
        
        locationsList.appendChild(locationCard);
    });
}

function showLocationEditor(locationData) {
    currentLocation = locationData;
    
    document.getElementById('location-name').value = locationData.name || '';
    document.getElementById('location-type').value = locationData.type || 'landmark';
    document.getElementById('location-notes').value = locationData.notes || '';
    document.getElementById('location-description').value = locationData.description || '';
    document.getElementById('location-characters').value = locationData.characters || '';
    document.getElementById('location-events').value = locationData.events || '';
    document.getElementById('location-resources').value = locationData.resources || '';
    document.getElementById('location-quests').value = locationData.quests || '';
    
    document.getElementById('location-modal').classList.add('active');
}

// Location Modal Event Listeners
document.getElementById('close-location-modal').addEventListener('click', () => {
    document.getElementById('location-modal').classList.remove('active');
});

document.getElementById('save-location').addEventListener('click', () => {
    if (currentLocation) {
        const locationIndex = locations.findIndex(l => l.id === currentLocation.id);
        
        if (locationIndex !== -1) {
            locations[locationIndex].name = document.getElementById('location-name').value;
            locations[locationIndex].type = document.getElementById('location-type').value;
            locations[locationIndex].notes = document.getElementById('location-notes').value;
            locations[locationIndex].description = document.getElementById('location-description').value;
            locations[locationIndex].characters = document.getElementById('location-characters').value;
            locations[locationIndex].events = document.getElementById('location-events').value;
            locations[locationIndex].resources = document.getElementById('location-resources').value;
            locations[locationIndex].quests = document.getElementById('location-quests').value;
        }
        
        saveLocations();
        initializeLocationsList();
        
        document.getElementById('location-modal').classList.remove('active');
    }
});

document.getElementById('delete-location').addEventListener('click', () => {
    if (currentLocation && confirm('Are you sure you want to delete this location?')) {
        locations = locations.filter(l => l.id !== currentLocation.id);
        saveLocations();
        initializeLocationsList();
        document.getElementById('location-modal').classList.remove('active');
    }
});

document.getElementById('add-location-btn').addEventListener('click', () => {
    const locationId = Date.now().toString();
    const newLocation = {
        id: locationId,
        name: 'New Location',
        type: 'landmark',
        notes: '',
        description: '',
        characters: '',
        events: '',
        resources: '',
        quests: ''
    };
    
    locations.push(newLocation);
    saveLocations();
    initializeLocationsList();
    showLocationEditor(newLocation);
});

// Character System
function initializeCharactersList() {
    const charactersList = document.getElementById('characters-list');
    charactersList.innerHTML = '';
    
    // Populate location dropdown in character modal
    updateCharacterLocationDropdown();
    
    characters.forEach(character => {
        const characterCard = document.createElement('div');
        characterCard.className = 'character-card';
        characterCard.dataset.characterId = character.id;
        
        const locationName = character.location ? 
            locations.find(loc => loc.id === character.location)?.name || 'Unknown Location' : 
            'No Location Set';
        
        characterCard.innerHTML = `
            <div class="character-header">
                <h3 class="character-name">${character.name}</h3>
                <div class="character-badges">
                    <span class="character-role" data-role="${character.role}">${character.role}</span>
                    <span class="character-disposition" data-disposition="${character.disposition}">${character.disposition}</span>
                </div>
            </div>
            ${character.location ? `
                <div class="character-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${locationName}
                </div>
            ` : ''}
            <p class="character-preview">${character.details || 'No description available'}</p>
            ${character.goal ? `
                <div class="character-goal-preview">
                    <strong>Goal:</strong> ${character.goal}
                </div>
            ` : ''}
        `;
        
        characterCard.addEventListener('click', () => {
            showCharacterEditor(character);
        });
        
        charactersList.appendChild(characterCard);
    });
}

function updateCharacterLocationDropdown() {
    const locationDropdown = document.getElementById('character-location');
    locationDropdown.innerHTML = '<option value="">None</option>';
    
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = location.name;
        locationDropdown.appendChild(option);
    });
}

function showCharacterEditor(characterData) {
    currentCharacter = characterData;
    
    document.getElementById('character-name').value = characterData.name || '';
    document.getElementById('character-role').value = characterData.role || 'neutral';
    document.getElementById('character-disposition').value = characterData.disposition || 'indifferent';
    document.getElementById('character-location').value = characterData.location || '';
    document.getElementById('character-goal').value = characterData.goal || '';
    document.getElementById('character-details').value = characterData.details || '';
    document.getElementById('character-backstory').value = characterData.backstory || '';
    document.getElementById('character-notes').value = characterData.notes || '';
    
    document.getElementById('character-modal').classList.add('active');
}

function saveCharacters() {
    localStorage.setItem('ironswornCharacters', JSON.stringify(characters));
}

// Character Modal Event Listeners
document.getElementById('close-character-modal').addEventListener('click', () => {
    document.getElementById('character-modal').classList.remove('active');
});

document.getElementById('save-character').addEventListener('click', () => {
    if (currentCharacter) {
        const characterIndex = characters.findIndex(c => c.id === currentCharacter.id);
        
        if (characterIndex !== -1) {
            characters[characterIndex].name = document.getElementById('character-name').value;
            characters[characterIndex].role = document.getElementById('character-role').value;
            characters[characterIndex].disposition = document.getElementById('character-disposition').value;
            characters[characterIndex].location = document.getElementById('character-location').value;
            characters[characterIndex].goal = document.getElementById('character-goal').value;
            characters[characterIndex].details = document.getElementById('character-details').value;
            characters[characterIndex].backstory = document.getElementById('character-backstory').value;
            characters[characterIndex].notes = document.getElementById('character-notes').value;
        }
        
        saveCharacters();
        initializeCharactersList();
        document.getElementById('character-modal').classList.remove('active');
    }
});

document.getElementById('delete-character').addEventListener('click', () => {
    if (currentCharacter && confirm('Are you sure you want to delete this character?')) {
        characters = characters.filter(c => c.id !== currentCharacter.id);
        saveCharacters();
        initializeCharactersList();
        document.getElementById('character-modal').classList.remove('active');
    }
});

document.getElementById('add-character-btn').addEventListener('click', () => {
    const characterId = Date.now().toString();
    const newCharacter = {
        id: characterId,
        name: 'New Character',
        role: 'neutral',
        disposition: 'indifferent',
        location: '',
        goal: '',
        details: '',
        backstory: '',
        notes: ''
    };
    
    characters.push(newCharacter);
    saveCharacters();
    initializeCharactersList();
    showCharacterEditor(newCharacter);
});

// Progress Tracking System
const questLevels = {
    'troublesome': { name: 'Troublesome', progressPerMark: 3 },
    'dangerous': { name: 'Dangerous', progressPerMark: 2 },
    'formidable': { name: 'Formidable', progressPerMark: 1 },
    'extreme': { name: 'Extreme', progressPerMark: 0.67 }, // 2 ticks = 2/3 progress
    'epic': { name: 'Epic', progressPerMark: 0.33 } // 1 tick = 1/3 progress
};

let progressTracks = JSON.parse(localStorage.getItem('ironswornProgressTracks')) || [
    {
        id: '1',
        name: 'Find the Lost Crown',
        level: 'dangerous',
        progress: 0
    },
    {
        id: '2', 
        name: 'Journey to the Ironlands',
        level: 'troublesome',
        progress: 0
    },
    {
        id: '3',
        name: 'Defeat the Corrupted Guardian',
        level: 'formidable',
        progress: 0
    }
];

function initializeProgressTracks() {
    const progressTracker = document.getElementById('progress-tracker');
    progressTracker.innerHTML = '';
    
    progressTracks.forEach(track => {
        createProgressTrack(track);
    });
}

function createProgressTrack(trackData) {
    const progressTracker = document.getElementById('progress-tracker');
    const track = document.createElement('div');
    track.className = 'progress-track';
    track.dataset.trackId = trackData.id;
    
    const progressPerMark = questLevels[trackData.level].progressPerMark;
    const maxProgress = 10; // 10 progress spots
    const currentProgress = trackData.progress || 0;
    
    // Calculate filled progress spots and ticks
    const fullSpots = Math.floor(currentProgress);
    const partialTicks = Math.round((currentProgress - fullSpots) * 3);
    
    track.innerHTML = `
        <div class="track-header">
            <div class="track-title editable" contenteditable="true">${trackData.name}</div>
            <div class="track-controls">
                <button class="btn btn-danger remove-track">×</button>
            </div>
        </div>
        <div class="quest-info">${questLevels[trackData.level].name} quest: ${getProgressDescription(trackData.level)}</div>
        
        <div class="track-level-controls">
            ${Object.entries(questLevels).map(([key, level]) => `
                <button class="level-btn ${key === trackData.level ? 'active' : ''}" data-level="${key}">
                    ${level.name}
                </button>
            `).join('')}
        </div>
        
        <div class="progress-container">
            <div class="progress-spots">
                ${Array.from({length: 10}, (_, i) => {
                    const spotProgress = Math.min(Math.max(currentProgress - i, 0), 1);
                    const ticks = spotProgress === 1 ? 3 : (spotProgress > 0 ? Math.round(spotProgress * 3) : 0);
                    
                    return `
                        <div class="progress-spot ${spotProgress === 1 ? 'full' : ''}" 
                             data-ticks="${ticks}" data-spot="${i}">
                            <div class="ticks">
                                <div class="tick ${ticks >= 1 ? 'filled' : ''}"></div>
                                <div class="tick ${ticks >= 2 ? 'filled' : ''}"></div>
                                <div class="tick ${ticks >= 3 ? 'filled' : ''}"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="progress-actions">
                <button class="btn btn-primary mark-progress">Mark Progress</button>
                <button class="btn btn-danger unmark-progress">Unmark Progress</button>
            </div>
            
            <div class="progress-summary">
                Progress: ${currentProgress.toFixed(1)} / ${maxProgress} 
                (${Math.round((currentProgress / maxProgress) * 100)}%)
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(currentProgress / maxProgress) * 100}%"></div>
            </div>
        </div>
    `;
    
    // Add event listeners
    const markBtn = track.querySelector('.mark-progress');
    const unmarkBtn = track.querySelector('.unmark-progress');
    const removeBtn = track.querySelector('.remove-track');
    const levelBtns = track.querySelectorAll('.level-btn');
    const title = track.querySelector('.track-title');
    
    markBtn.addEventListener('click', () => {
        const trackIndex = progressTracks.findIndex(t => t.id === trackData.id);
        if (trackIndex !== -1) {
            const progressPerMark = questLevels[progressTracks[trackIndex].level].progressPerMark;
            progressTracks[trackIndex].progress = Math.min(
                progressTracks[trackIndex].progress + progressPerMark, 
                10
            );
            saveProgressTracks();
            initializeProgressTracks();
        }
    });
    
    unmarkBtn.addEventListener('click', () => {
        const trackIndex = progressTracks.findIndex(t => t.id === trackData.id);
        if (trackIndex !== -1) {
            const progressPerMark = questLevels[progressTracks[trackIndex].level].progressPerMark;
            progressTracks[trackIndex].progress = Math.max(
                progressTracks[trackIndex].progress - progressPerMark, 
                0
            );
            saveProgressTracks();
            initializeProgressTracks();
        }
    });
    
    removeBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to remove this track?')) {
            progressTracks = progressTracks.filter(t => t.id !== trackData.id);
            saveProgressTracks();
            initializeProgressTracks();
        }
    });
    
    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const level = btn.dataset.level;
            const trackIndex = progressTracks.findIndex(t => t.id === trackData.id);
            if (trackIndex !== -1) {
                progressTracks[trackIndex].level = level;
                saveProgressTracks();
                initializeProgressTracks();
            }
        });
    });
    
    title.addEventListener('blur', () => {
        const trackIndex = progressTracks.findIndex(t => t.id === trackData.id);
        if (trackIndex !== -1) {
            progressTracks[trackIndex].name = title.textContent;
            saveProgressTracks();
        }
    });
    
    progressTracker.appendChild(track);
}

function getProgressDescription(level) {
    const descriptions = {
        'troublesome': 'Mark 3 progress per action',
        'dangerous': 'Mark 2 progress per action', 
        'formidable': 'Mark 1 progress per action',
        'extreme': 'Mark 2 ticks (2/3 progress) per action',
        'epic': 'Mark 1 tick (1/3 progress) per action'
    };
    return descriptions[level] || '';
}

function saveProgressTracks() {
    localStorage.setItem('ironswornProgressTracks', JSON.stringify(progressTracks));
}

// Add new track functionality
document.getElementById('add-new-track').addEventListener('click', () => {
    const newTrack = {
        id: Date.now().toString(),
        name: 'New Quest',
        level: 'dangerous',
        progress: 0
    };
    
    progressTracks.push(newTrack);
    saveProgressTracks();
    initializeProgressTracks();
});

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Prevent editable fields from losing focus on Enter key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.classList.contains('editable')) {
        e.preventDefault();
        e.target.blur();
    }
});

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map system
    if (typeof initializeMap !== 'undefined') {
        initializeMap();
    }
    
    initializeLocationsList();
    initializeCharactersList();
    initializeProgressTracks();
    updateMomentumDisplay();
});