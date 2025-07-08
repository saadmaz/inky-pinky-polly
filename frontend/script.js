// Game State
let gameState = {
    playerName: '',
    playerScore: 0,
    computerScore: 0,
    currentScreen: 'welcome',
    gameHistory: [],
    theme: localStorage.getItem('theme') || 'light'
};

// Game choices and rules
const choices = ['pinky', 'inky', 'polly'];
const choiceEmojis = {
    pinky: '🌸',
    inky: '🖤',
    polly: '🦜'
};

const gameRules = {
    pinky: 'inky',    // Pinky beats Inky
    inky: 'polly',    // Inky beats Polly
    polly: 'pinky'    // Polly beats Pinky
};

// Theme Management
const initTheme = () => {
    document.documentElement.setAttribute('data-theme', gameState.theme);
    updateThemeIcon();
};

const toggleTheme = () => {
    gameState.theme = gameState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', gameState.theme);
    localStorage.setItem('theme', gameState.theme);
    updateThemeIcon();
    playSound('click');
};

const updateThemeIcon = () => {
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = gameState.theme === 'light' ? '🌙' : '☀️';
};

// Optimized Sound effects using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const soundCache = {};

const playSound = (type) => {
    if (!audioContext || audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    let frequency;
    let duration = 0.2;
    
    switch(type) {
        case 'click':
            frequency = 800;
            duration = 0.1;
            break;
        case 'win':
            frequency = 600;
            duration = 0.3;
            break;
        case 'lose':
            frequency = 300;
            duration = 0.3;
            break;
        case 'tie':
            frequency = 500;
            duration = 0.2;
            break;
        default:
            frequency = 400;
    }
    
    // Use cached oscillator settings for better performance
    const cacheKey = `${type}_${frequency}`;
    if (!soundCache[cacheKey]) {
        soundCache[cacheKey] = { frequency, duration };
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
};

// Optimized screen management with fade transitions
const showScreen = (screenName) => {
    const currentScreen = document.querySelector('.screen.active');
    const newScreen = document.getElementById(`${screenName}-screen`);
    
    if (currentScreen) {
        currentScreen.style.opacity = '0';
        setTimeout(() => {
            currentScreen.classList.remove('active');
            newScreen.classList.add('active');
            newScreen.style.opacity = '0';
            setTimeout(() => {
                newScreen.style.opacity = '1';
            }, 50);
        }, 200);
    } else {
        newScreen.classList.add('active');
    }
    
    gameState.currentScreen = screenName;
};

// Initialize game with optimized event listeners
const initGame = () => {
    // Initialize theme
    initTheme();
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', toggleTheme);
    
    // Welcome screen event listeners
    const startBtn = document.getElementById('start-game-btn');
    const readMoreBtn = document.getElementById('read-more-btn');
    const backBtn = document.getElementById('back-btn');
    
    startBtn.addEventListener('click', startGame);
    readMoreBtn.addEventListener('click', () => {
        playSound('click');
        showScreen('read-more');
    });
    backBtn.addEventListener('click', () => {
        playSound('click');
        showScreen('welcome');
    });
    
    // Game screen event listeners with optimized delegation
    const choiceButtons = document.querySelector('.choice-buttons');
    choiceButtons.addEventListener('click', (e) => {
        const choiceBtn = e.target.closest('.choice-btn');
        if (choiceBtn && !choiceBtn.disabled) {
            playSound('click');
            const choice = choiceBtn.dataset.choice;
            playRound(choice);
        }
    });
    
    document.getElementById('end-game-btn').addEventListener('click', endGame);
    
    // Modal event listeners
    document.getElementById('play-again-btn').addEventListener('click', resetGame);
    document.getElementById('back-to-menu-btn').addEventListener('click', backToMenu);
    
    // Load saved data
    loadGameHistory();
    
    // Add CSS transitions to screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.transition = 'opacity 0.3s ease';
    });
};

const startGame = () => {
    const playerNameInput = document.getElementById('player-name');
    const playerName = playerNameInput.value.trim();
    
    if (!playerName) {
        // Enhanced input validation with visual feedback
        playerNameInput.style.borderColor = 'var(--accent-orange)';
        playerNameInput.placeholder = 'Please enter your name!';
        playerNameInput.focus();
        setTimeout(() => {
            playerNameInput.style.borderColor = '';
            playerNameInput.placeholder = 'Enter your name';
        }, 2000);
        return;
    }
    
    gameState.playerName = playerName;
    document.getElementById('player-name-display').textContent = playerName;
    
    playSound('click');
    showScreen('game');
    updateScores();
};

// Optimized game round with better performance
const playRound = async (playerChoice) => {
    // Disable choice buttons with visual feedback
    const choiceButtons = document.querySelectorAll('.choice-btn');
    choiceButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.6';
    });
    
    // Get computer choice
    const computerChoice = getComputerChoice();
    
    // Show choices with animation
    displayChoices(playerChoice, computerChoice);
    
    // Determine winner
    const result = determineWinner(playerChoice, computerChoice);
    
    // Update scores based on result
    updateGameState(result);
    
    // Display result
    displayRoundResult(result, playerChoice, computerChoice);
    
    // Send result to Python backend (if available)
    try {
        await sendGameData({
            playerName: gameState.playerName,
            playerChoice,
            computerChoice,
            result,
            playerScore: gameState.playerScore,
            computerScore: gameState.computerScore
        });
    } catch (error) {
        console.log('Backend not available:', error);
    }
    
    // Re-enable choice buttons after animation
    setTimeout(() => {
        choiceButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }, 2000);
};

const getComputerChoice = () => {
    return choices[Math.floor(Math.random() * choices.length)];
};

const determineWinner = (playerChoice, computerChoice) => {
    if (playerChoice === computerChoice) {
        return 'tie';
    }
    
    if (gameRules[playerChoice] === computerChoice) {
        return 'player';
    } else {
        return 'computer';
    }
};

const updateGameState = (result) => {
    if (result === 'player') {
        gameState.playerScore++;
        playSound('win');
    } else if (result === 'computer') {
        gameState.computerScore++;
        playSound('lose');
    } else {
        playSound('tie');
    }
    
    updateScores();
    
    // Save to history with timestamp
    gameState.gameHistory.push({
        timestamp: new Date().toISOString(),
        result,
        playerScore: gameState.playerScore,
        computerScore: gameState.computerScore
    });
    
    saveGameHistory();
};

const displayChoices = (playerChoice, computerChoice) => {
    const playerChoiceEl = document.getElementById('player-choice');
    const computerChoiceEl = document.getElementById('computer-choice');
    
    playerChoiceEl.innerHTML = `${choiceEmojis[playerChoice]} ${playerChoice.charAt(0).toUpperCase() + playerChoice.slice(1)}`;
    computerChoiceEl.innerHTML = `${choiceEmojis[computerChoice]} ${computerChoice.charAt(0).toUpperCase() + computerChoice.slice(1)}`;
    
    // Add animation classes
    playerChoiceEl.style.animation = 'scaleIn 0.5s ease';
    computerChoiceEl.style.animation = 'scaleIn 0.5s ease 0.2s both';
};

const displayRoundResult = (result, playerChoice, computerChoice) => {
    const roundResult = document.getElementById('round-result');
    const roundWinner = document.getElementById('round-winner');
    
    let message = '';
    let className = '';
    
    if (result === 'tie') {
        message = "It's a Tie!";
        className = 'tie';
    } else if (result === 'player') {
        message = `${gameState.playerName} Wins! ${playerChoice.charAt(0).toUpperCase() + playerChoice.slice(1)} beats ${computerChoice.charAt(0).toUpperCase() + computerChoice.slice(1)}`;
        className = 'player-win';
    } else {
        message = `BOT-47 Wins! ${computerChoice.charAt(0).toUpperCase() + computerChoice.slice(1)} beats ${playerChoice.charAt(0).toUpperCase() + playerChoice.slice(1)}`;
        className = 'computer-win';
    }
    
    roundWinner.textContent = message;
    roundWinner.className = `round-winner ${className}`;
    
    roundResult.classList.remove('hidden');
    
    // Hide result after 3 seconds with fade out
    setTimeout(() => {
        roundResult.style.opacity = '0';
        setTimeout(() => {
            roundResult.classList.add('hidden');
            roundResult.style.opacity = '1';
        }, 300);
    }, 3000);
};

const updateScores = () => {
    const playerScoreEl = document.getElementById('player-score');
    const computerScoreEl = document.getElementById('computer-score');
    
    // Animate score updates
    playerScoreEl.style.transform = 'scale(1.2)';
    computerScoreEl.style.transform = 'scale(1.2)';
    
    playerScoreEl.textContent = gameState.playerScore;
    computerScoreEl.textContent = gameState.computerScore;
    
    setTimeout(() => {
        playerScoreEl.style.transform = 'scale(1)';
        computerScoreEl.style.transform = 'scale(1)';
    }, 200);
};

const endGame = () => {
    playSound('click');
    showGameOverModal();
};

const showGameOverModal = () => {
    const modal = document.getElementById('game-over-modal');
    const finalScores = document.getElementById('final-scores');
    const finalWinner = document.getElementById('final-winner');
    
    finalScores.innerHTML = `
        <div style="display: flex; justify-content: center; gap: 40px; margin: 20px 0; flex-wrap: wrap;">
            <div style="text-align: center;">
                <div style="font-size: 18px; color: var(--accent-blue); font-weight: bold;">${gameState.playerName}</div>
                <div style="font-size: 36px; color: var(--accent-teal); font-weight: bold;">${gameState.playerScore}</div>
            </div>
            <div style="font-size: 24px; color: var(--accent-orange); font-weight: bold; display: flex; align-items: center;">VS</div>
            <div style="text-align: center;">
                <div style="font-size: 18px; color: var(--accent-blue); font-weight: bold;">BOT-47</div>
                <div style="font-size: 36px; color: var(--accent-teal); font-weight: bold;">${gameState.computerScore}</div>
            </div>
        </div>
    `;
    
    let winnerMessage = '';
    if (gameState.playerScore > gameState.computerScore) {
        winnerMessage = `🎉 ${gameState.playerName} Wins! 🎉`;
        playSound('win');
    } else if (gameState.computerScore > gameState.playerScore) {
        winnerMessage = '🤖 BOT-47 Wins! 🤖';
        playSound('lose');
    } else {
        winnerMessage = "🤝 It's a Tie! 🤝";
        playSound('tie');
    }
    
    finalWinner.innerHTML = `<h3 style="color: var(--accent-blue); margin: 20px 0;">${winnerMessage}</h3>`;
    
    modal.classList.remove('hidden');
};

const resetGame = () => {
    gameState.playerScore = 0;
    gameState.computerScore = 0;
    updateScores();
    document.getElementById('game-over-modal').classList.add('hidden');
    document.getElementById('round-result').classList.add('hidden');
    playSound('click');
};

const backToMenu = () => {
    resetGame();
    showScreen('welcome');
    document.getElementById('player-name').value = '';
    gameState.playerName = '';
    playSound('click');
};

// Backend Integration with error handling
const sendGameData = async (gameData) => {
    try {
        const response = await fetch('http://localhost:5000/api/game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gameData),
            timeout: 5000 // 5 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    } catch (error) {
        console.log('Backend connection failed:', error.message);
        throw error;
    }
};

// Optimized Local Storage operations
const saveGameHistory = () => {
    try {
        // Only keep last 50 games to prevent excessive storage
        const recentHistory = gameState.gameHistory.slice(-50);
        localStorage.setItem('inkyPinkyPollyHistory', JSON.stringify(recentHistory));
        localStorage.setItem('inkyPinkyPollyPlayerName', gameState.playerName);
    } catch (error) {
        console.warn('Could not save game history:', error);
    }
};

const loadGameHistory = () => {
    try {
        const saved = localStorage.getItem('inkyPinkyPollyHistory');
        const savedPlayerName = localStorage.getItem('inkyPinkyPollyPlayerName');
        
        if (saved) {
            gameState.gameHistory = JSON.parse(saved);
        }
        
        if (savedPlayerName) {
            document.getElementById('player-name').value = savedPlayerName;
        }
    } catch (error) {
        console.warn('Could not load game history:', error);
        gameState.gameHistory = [];
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);

// Handle browser back button
window.addEventListener('popstate', (e) => {
    if (gameState.currentScreen !== 'welcome') {
        showScreen('welcome');
    }
});

// Optimized keyboard event handling
document.addEventListener('keydown', (e) => {
    if (e.target.id === 'player-name' && e.key === 'Enter') {
        e.preventDefault();
        startGame();
    }
    
    // Add keyboard shortcuts
    if (gameState.currentScreen === 'game' && ['1', '2', '3'].includes(e.key)) {
        const choiceIndex = parseInt(e.key) - 1;
        const choice = choices[choiceIndex];
        if (choice) {
            playRound(choice);
        }
    }
});

// Add visibility change handler to pause audio context when tab is not active
document.addEventListener('visibilitychange', () => {
    if (document.hidden && audioContext.state === 'running') {
        audioContext.suspend();
    } else if (!document.hidden && audioContext.state === 'suspended') {
        audioContext.resume();
    }
});

// Performance monitoring (optional)
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log(`Page load time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
        }, 0);
    });
}
