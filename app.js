// Mock profile data
const profiles = [
    {
        name: "Sarah",
        age: 24,
        bio: "Coffee enthusiast ☕ | Adventure seeker 🏔️ | Dog mom 🐕",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=600&fit=crop"
    },
    {
        name: "Jessica",
        age: 26,
        bio: "Artist 🎨 | Yoga lover 🧘‍♀️ | Plant parent 🌱",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=600&fit=crop"
    },
    {
        name: "Emily",
        age: 23,
        bio: "Foodie 🍕 | Traveler ✈️ | Music festival addict 🎵",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=600&fit=crop"
    },
    {
        name: "Amanda",
        age: 27,
        bio: "Fitness junkie 💪 | Bookworm 📚 | Beach lover 🏖️",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=600&fit=crop"
    },
    {
        name: "Rachel",
        age: 25,
        bio: "Chef in training 👩‍🍳 | Wine enthusiast 🍷 | Comedy fan 😂",
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=600&fit=crop"
    }
];

// App state
let currentProfileIndex = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let swipeResults = [];

// DOM elements
const card = document.getElementById('card');
const cardImage = document.getElementById('cardImage');
const cardName = document.getElementById('cardName');
const likeIndicator = document.getElementById('likeIndicator');
const nopeIndicator = document.getElementById('nopeIndicator');
const likeBtn = document.getElementById('likeBtn');
const nopeBtn = document.getElementById('nopeBtn');

// Initialize app
function init() {
    // Clear previous swipe results
    localStorage.removeItem('swipeResults');
    swipeResults = [];
    loadProfile(currentProfileIndex);
    setupEventListeners();
}

// Load profile data into card
function loadProfile(index) {
    if (index >= profiles.length) {
        redirectToComplete();
        return;
    }
    
    const profile = profiles[index];
    cardImage.style.backgroundImage = `url(${profile.image})`;
    cardName.textContent = profile.name;
    
    // Reset card position and indicators
    card.style.transform = '';
    card.classList.remove('swiped-left', 'swiped-right');
    likeIndicator.style.opacity = '0';
    nopeIndicator.style.opacity = '0';
}

// Setup event listeners
function setupEventListeners() {
    // Mouse events
    card.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    
    // Touch events
    card.addEventListener('touchstart', onDragStart, { passive: true });
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
    
    // Button events
    likeBtn.addEventListener('click', () => swipe('right'));
    nopeBtn.addEventListener('click', () => swipe('left'));
}

// Drag start handler
function onDragStart(e) {
    isDragging = true;
    card.classList.add('dragging');
    
    if (e.type === 'mousedown') {
        startX = e.clientX;
        startY = e.clientY;
    } else {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }
}

// Drag move handler
function onDragMove(e) {
    if (!isDragging) return;
    
    if (e.type === 'mousemove') {
        currentX = e.clientX;
        currentY = e.clientY;
    } else {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
    }
    
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // Calculate rotation based on horizontal movement
    const rotation = deltaX * 0.1;
    
    // Apply transform
    card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
    
    // Show indicators based on swipe direction
    const threshold = 50;
    if (deltaX > threshold) {
        likeIndicator.style.opacity = Math.min(deltaX / 150, 1);
        nopeIndicator.style.opacity = '0';
    } else if (deltaX < -threshold) {
        nopeIndicator.style.opacity = Math.min(Math.abs(deltaX) / 150, 1);
        likeIndicator.style.opacity = '0';
    } else {
        likeIndicator.style.opacity = '0';
        nopeIndicator.style.opacity = '0';
    }
}

// Drag end handler
function onDragEnd(e) {
    if (!isDragging) return;
    
    isDragging = false;
    card.classList.remove('dragging');
    
    const deltaX = currentX - startX;
    const threshold = 100;
    
    if (Math.abs(deltaX) > threshold) {
        // Swipe detected
        if (deltaX > 0) {
            swipe('right');
        } else {
            swipe('left');
        }
    } else {
        // Snap back
        card.style.transform = '';
        likeIndicator.style.opacity = '0';
        nopeIndicator.style.opacity = '0';
    }
}

// Swipe function
function swipe(direction) {
    // Disable interactions during animation
    card.style.pointerEvents = 'none';
    
    // Hide indicators immediately
    likeIndicator.style.opacity = '0';
    nopeIndicator.style.opacity = '0';
    
    // Track the swipe result
    const profile = profiles[currentProfileIndex];
    swipeResults.push({
        name: profile.name,
        age: profile.age,
        bio: profile.bio,
        image: profile.image,
        direction: direction
    });
    
    // Save to localStorage
    localStorage.setItem('swipeResults', JSON.stringify(swipeResults));
    
    if (direction === 'right') {
        card.classList.add('swiped-right');
    } else {
        card.classList.add('swiped-left');
    }
    
    // Move to next profile after animation
    setTimeout(() => {
        currentProfileIndex++;
        
        if (currentProfileIndex >= profiles.length) {
            redirectToComplete();
        } else {
            loadProfile(currentProfileIndex);
            card.style.pointerEvents = 'auto';
        }
    }, 300);
}

// Redirect to complete page
function redirectToComplete() {
    window.location.href = 'complete.html';
}

// Export functions for testing (browser global scope)
function getCurrentProfileIndex() {
    return currentProfileIndex;
}

function setCurrentProfileIndex(index) {
    currentProfileIndex = index;
}

// Make functions and data available globally for testing
window.profiles = profiles;
window.getCurrentProfileIndex = getCurrentProfileIndex;
window.setCurrentProfileIndex = setCurrentProfileIndex;
window.loadProfile = loadProfile;
window.swipe = swipe;

// Start the app (only if not in test mode)
if (!window.location.pathname.includes('test')) {
    init();
}

// Export functions for testing (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        profiles,
        init,
        loadProfile,
        swipe,
        getCurrentProfileIndex,
        setCurrentProfileIndex
    };
}

