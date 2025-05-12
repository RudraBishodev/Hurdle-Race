import { EventEmitter } from 'eventEmitter';

const SPRINT_KEYS_MAP = {
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
};
const ACTION_KEYS_MAP = {
    'Space': 'jump'
};
const KEY_PAIRS = [['left', 'right']];
export class InputHandler extends EventEmitter {
    constructor() {
        super();
        this.sprintKeys = { left: false, right: false };
        this.lastActiveKey = null;
        this.keyStates = {}; // Tracks pressed state for movement and action keys

        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(event) {
        const sprintKeyName = SPRINT_KEYS_MAP[event.code];
        const actionKeyName = ACTION_KEYS_MAP[event.code];
        if (sprintKeyName && !this.keyStates[sprintKeyName]) { // Process sprint key on new press
            this.keyStates[sprintKeyName] = true;
            this.sprintKeys[sprintKeyName] = true;
            if (this.isValidAlternation(sprintKeyName)) {
                this.emit('sprintKeyPressed', sprintKeyName);
                this.lastActiveKey = sprintKeyName;
            }
        } else if (actionKeyName && !this.keyStates[actionKeyName]) { // Process action key on new press
            this.keyStates[actionKeyName] = true;
            this.emit(`${actionKeyName}Pressed`); // e.g., 'jumpPressed'
        }
    }
    onKeyUp(event) {
        const sprintKeyName = SPRINT_KEYS_MAP[event.code];
        const actionKeyName = ACTION_KEYS_MAP[event.code];
        if (sprintKeyName) {
            this.keyStates[sprintKeyName] = false;
            this.sprintKeys[sprintKeyName] = false;
            if (this.lastActiveKey === sprintKeyName) {
                 for (const pair of KEY_PAIRS) {
                    if (pair.includes(sprintKeyName)) {
                        const otherKey = pair[0] === sprintKeyName ? pair[1] : pair[0];
                        if (this.keyStates[otherKey]) { 
                            this.lastActiveKey = otherKey; 
                            this.emit('sprintKeyPressed', otherKey); 
                        }
                        break;
                    }
                }
            }
        } else if (actionKeyName) {
            this.keyStates[actionKeyName] = false;
            // Optionally emit actionKeyReleased if needed by other systems
            // this.emit(`${actionKeyName}Released`);
        }
    }
    
    isValidAlternation(newKey) {
        if (!this.lastActiveKey) return true; // First key press is always valid

        for (const pair of KEY_PAIRS) {
            if (pair.includes(this.lastActiveKey) && pair.includes(newKey) && this.lastActiveKey !== newKey) {
                return true; // Valid alternation within a pair
            }
        }
        // Allow switching between pairs (e.g., Q/W to Left/Right)
        let lastKeyInPair = false;
        let newKeyInPair = false;
        for (const pair of KEY_PAIRS) {
            if(pair.includes(this.lastActiveKey)) lastKeyInPair = true;
            if(pair.includes(newKey)) newKeyInPair = true;
        }
        if(lastKeyInPair && newKeyInPair) { // Both keys are part of some pair
             const lastKeyPair = KEY_PAIRS.find(p => p.includes(this.lastActiveKey));
             const newKeyPair = KEY_PAIRS.find(p => p.includes(newKey));
             if(lastKeyPair !== newKeyPair) return true; // Different pairs, allow switch
        }

        return false; // Not a valid alternation
    }

    isAlternating() { // A simplified check for initial game start
        let pressedCount = 0;
        let lastPressed = null;
        const activeKeys = [];

        for (const key in this.sprintKeys) {
            if (this.sprintKeys[key]) {
                activeKeys.push(key);
            }
        }
        if (activeKeys.length === 0) return false; // No keys pressed

        // This is a basic check for game start, not the continuous sprint logic
        if (this.lastActiveKey && activeKeys.includes(this.lastActiveKey) && activeKeys.length === 1) return true;
        if (activeKeys.length >=1 && this.isValidAlternation(activeKeys[activeKeys.length-1])) return true;

        return false;
    }
}