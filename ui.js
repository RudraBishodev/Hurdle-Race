export class UI {
    constructor() {
        this.messageElement = this.createElement('div', {
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '32px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px #000000',
            textAlign: 'center',
            display: 'none',
            zIndex: '100'
        });
        document.body.appendChild(this.messageElement);

        this.timerElement = this.createElement('div', {
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: '48px',
            fontFamily: '"Courier New", Courier, monospace',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px #000000',
            display: 'none',
            zIndex: '100'
        });
        document.body.appendChild(this.timerElement);
        this.startButton = this.createElement('button', {
            position: 'absolute',
            top: '70%', // Position below the instructions
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '15px 30px',
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: '#4CAF50', // Green
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            display: 'none', // Initially hidden
            zIndex: '101' // Above other UI elements
        });
        this.startButton.textContent = "START NOW";
        document.body.appendChild(this.startButton);
    }
    createElement(type, style) {
        const element = document.createElement(type);
        Object.assign(element.style, style);
        return element;
    }
    showStartButton(onClickCallback) {
        this.startButton.style.display = 'block';
        // Remove previous event listener to avoid multiple triggers
        if (this.startButtonClickListener) {
            this.startButton.removeEventListener('click', this.startButtonClickListener);
        }
        this.startButtonClickListener = onClickCallback;
        this.startButton.addEventListener('click', this.startButtonClickListener);
    }
    hideStartButton() {
        this.startButton.style.display = 'none';
        if (this.startButtonClickListener) {
            this.startButton.removeEventListener('click', this.startButtonClickListener);
            this.startButtonClickListener = null;
        }
    }
    showInstructions(htmlContent) {
        this.messageElement.innerHTML = htmlContent; // Use innerHTML to support <br>
        this.messageElement.style.fontSize = '32px'; // Reset font size for standard instructions
        this.messageElement.style.top = '30%';
        this.messageElement.style.left = '50%';
        this.messageElement.style.transform = 'translate(-50%, -50%)';
        this.messageElement.style.display = 'block';
    }
    hideInstructions() { // More generic name now
        this.messageElement.style.display = 'none';
    }
    displayCountdownMessage(message) {
        this.messageElement.textContent = message;
        this.messageElement.style.fontSize = '96px'; // Larger font for countdown
        this.messageElement.style.top = '50%'; // Centered for countdown
        this.messageElement.style.left = '50%';
        this.messageElement.style.transform = 'translate(-50%, -50%)';
        this.messageElement.style.display = 'block';
    }
    getCurrentMessage() {
        return this.messageElement.style.display === 'none' ? '' : this.messageElement.textContent;
    }
    showTimer() {
        this.timerElement.style.display = 'block';
        this.updateTimer(0);
    }
    updateTimer(time) {
        this.timerElement.textContent = time.toFixed(2);
    }
showResults(finalTime, rank, totalRacers) {
        this.hideTimer(); // Hide the gameplay timer
        let rankText = '';
        let mainMessage = "FINISHED!"; // Default, will be overwritten by more specific messages
        // Suffix function for ordinal numbers (1st, 2nd, 3rd, etc.)
        const suffix = (r) => {
            if (r === null || typeof r === 'undefined') return ''; // Safety check
            if (r % 10 === 1 && r % 100 !== 11) return 'st';
            if (r % 10 === 2 && r % 100 !== 12) return 'nd';
            if (r % 10 === 3 && r % 100 !== 13) return 'rd';
            return 'th';
        };
        if (rank && totalRacers) { // Ensure we have valid rank and total racers
            // Always generate rankText if rank and totalRacers are valid.
            // Solo races will now also show "You finished 1st out of 1!"
            rankText = `You finished ${rank}${suffix(rank)} out of ${totalRacers}!<br>`;
            if (totalRacers === 1) {
                // For a solo race, rank must be 1.
                mainMessage = "SOLO RUN COMPLETE!";
            } else { // For multiplayer races (totalRacers > 1)
                if (rank === 1) {
                    mainMessage = "VICTORY!";
                } else if (rank === totalRacers) { // Player is last (and not 1st)
                    mainMessage = "TRY AGAIN!";
                } else { // Player is in a middle rank (e.g. 2nd out of 3, 2nd/3rd out of 4)
                    mainMessage = `${rank}${suffix(rank)} PLACE!`;
                }
            }
        }
        // If rank or totalRacers were somehow not provided (falsy),
        // mainMessage remains "FINISHED!" and rankText remains empty.
        // This maintains a graceful fallback, though game.js should provide valid data.
        this.messageElement.innerHTML = `${mainMessage}<br>${rankText}Your Time: ${finalTime.toFixed(2)}s<br><small style="font-size:24px; line-height: 1.5em;">Refresh to play again!</small>`;
        this.messageElement.style.fontSize = '48px'; // Larger font size for the main message and results
        this.messageElement.style.top = '50%'; // Centered
        this.messageElement.style.left = '50%'; // Ensure centered
        this.messageElement.style.transform = 'translate(-50%, -50%)'; // Ensure centered
        this.messageElement.style.display = 'block';
        this.hideStartButton(); // Ensure start button is hidden on results screen
    }
    hideTimer() {
        this.timerElement.style.display = 'none';
    }
}