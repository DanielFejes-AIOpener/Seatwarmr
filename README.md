# 🔥 Seatwarmr

A Tinder-style dating app with swipe functionality built with vanilla HTML, CSS, and JavaScript.

## Features

- 💳 Swipeable profile cards with drag-to-swipe mechanic
- 📱 Touch and mouse support
- 🎨 Tinder-style UI with smooth animations
- 📊 Progress tracking (5 profiles)
- ✨ Visual feedback during swipes
- 🎯 Action buttons for manual swiping

## Getting Started

### Running the App

Simply open `index.html` in your web browser, or use a local server:

```bash
# Using Python
python3 -m http.server 8000
# Then visit: http://localhost:8000

# Using Node.js (if you have http-server installed)
npx http-server
```

### Running Tests

Open `test/test.html` in your browser to run the test suite.

See `test/README.md` for more details.

## How to Use

1. **Swipe Right (Like)**: Drag the card to the right or click the heart button
2. **Swipe Left (Pass)**: Drag the card to the left or click the X button
3. **Visual Feedback**: The card follows your drag with rotation effects
4. **Progress**: Track your progress through the 5 profiles with the progress bar
5. **Completion**: After swiping through all profiles, you'll be redirected to a completion page

## Project Structure

```
.
├── index.html          # Main swiping interface
├── complete.html       # Completion page
├── styles.css          # Tinder-style CSS
├── app.js              # Swipe logic and interactions
├── test/
│   ├── test.html       # Test suite
│   └── README.md       # Test documentation
└── README.md           # This file
```

## Technologies

- HTML5
- CSS3 (Animations, Flexbox, Grid)
- Vanilla JavaScript (ES6+)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT

