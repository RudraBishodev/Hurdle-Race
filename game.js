import * as THREE from 'three';
import { SceneSetup } from 'sceneSetup';
import { Player } from 'player';
import { AIOpponent } from 'AIOpponent';
import { InputHandler } from 'inputHandler';
import { UI } from 'ui';
import { AudioManager } from 'AudioManager';
import { TRACK_LENGTH, GAME_STATE, LANE_WIDTH, NUM_AI_OPPONENTS, AI_OPPONENT_COLOR_VARIATIONS, TRACK_WIDTH, COUNTDOWN_SECONDS } from 'constants';
import { EffectComposer, RenderPass, BloomEffect, EffectPass } from 'postprocessing';
export class Game {
    constructor(renderDiv) {
        this.renderDiv = renderDiv;
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance" // Important for postprocessing
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderDiv.appendChild(this.renderer.domElement);
        this.sceneSetup = new SceneSetup();
        this.scene = this.sceneSetup.scene;
        this.camera = this.sceneSetup.camera;
        // Post-processing
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloomEffect = new BloomEffect({
            luminanceThreshold: 0.5, // Lower to make more things bloom slightly
            luminanceSmoothing: 0.2,
            intensity: 0.8, // Subtle bloom
            // mipmapBlur: true, // Can improve performance and quality
        });
        this.composer.addPass(new EffectPass(this.camera, bloomEffect));
        this.player = new Player(this.scene, 0); // Player in lane 0 (center)
        this.inputHandler = new InputHandler();
        this.ui = new UI();
        this.audioManager = new AudioManager(this.camera); // Pass camera to AudioManager
        this.aiOpponents = [];
        this.clock = new THREE.Clock();
        this.gameState = GAME_STATE.READY;
        this.raceTime = 0;
        this.playerFinished = false;
        this.allOpponentsFinished = false;
        this.countdownValue = -1; // -1 indicates not counting down
        this.audioManager.loadSounds(() => {
            console.log("All sounds loaded.");
            // Sounds are loaded, game can proceed with sound functionality
        });
        this.setupAI();
        this.hurdles = this.sceneSetup.getHurdles(); // Get hurdle instances
        this.bindEventListeners();
        this.setupInitialCamera();
    }
    setupAI() {
        const availableLanes = [];
        const totalLanes = Math.floor(TRACK_WIDTH / LANE_WIDTH);
        const playerLaneIndex = Math.floor(totalLanes / 2); // Player in the middle-ish lane
        // Assign player a specific lane coordinate
        this.player.mesh.position.x = (-TRACK_WIDTH / 2) + (playerLaneIndex + 0.5) * LANE_WIDTH;
        for (let i = 0; i < totalLanes; i++) {
            if (i !== playerLaneIndex) { // Don't use player's lane
                 availableLanes.push((-TRACK_WIDTH / 2) + (i + 0.5) * LANE_WIDTH);
            }
        }
        
        // Shuffle available lanes for AIs
        for (let i = availableLanes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableLanes[i], availableLanes[j]] = [availableLanes[j], availableLanes[i]];
        }
        for (let i = 0; i < NUM_AI_OPPONENTS && i < availableLanes.length; i++) {
            const laneX = availableLanes[i];
            const color = AI_OPPONENT_COLOR_VARIATIONS[i % AI_OPPONENT_COLOR_VARIATIONS.length];
            this.aiOpponents.push(new AIOpponent(this.scene, laneX, color));
        }
    }
    bindEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.inputHandler.on('sprintKeyPressed', (key) => { // Still listen for sprint keys during race
            if (this.gameState === GAME_STATE.RUNNING) {
                this.player.sprint(key);
            }
        });
        this.inputHandler.on('jumpPressed', () => {
            if (this.gameState === GAME_STATE.RUNNING) {
                this.player.jump();
            }
        });
    }
    startCountdown() {
        if (this.gameState === GAME_STATE.READY) {
            this.gameState = GAME_STATE.COUNTDOWN;
            this.countdownValue = COUNTDOWN_SECONDS;
            this.player.reset();
            this.aiOpponents.forEach(op => op.reset());
            this.playerFinished = false;
            this.allOpponentsFinished = false;
            this.raceTime = 0;
            this.ui.hideInstructions();
            this.ui.hideStartButton();
            this.ui.displayCountdownMessage(Math.ceil(this.countdownValue));
        }
    }
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    setupInitialCamera() {
        this.camera.position.set(this.player.mesh.position.x, 5, 7 + this.player.mesh.position.z); 
        this.camera.lookAt(this.player.mesh.position.x, this.player.mesh.position.y + 1, this.player.mesh.position.z);
    }
    updateCamera() {
        const targetPosition = new THREE.Vector3(
            this.player.mesh.position.x,
            this.player.mesh.position.y + 4, // Slightly higher
            this.player.mesh.position.z + 8  // Further behind
        );
        this.camera.position.lerp(targetPosition, 0.1);
        
        const lookAtPosition = new THREE.Vector3(
            this.player.mesh.position.x,
            this.player.mesh.position.y + 1, // Look slightly above player's feet
            this.player.mesh.position.z
        );
        this.camera.lookAt(lookAtPosition);
    }
    
    start() {
        this.ui.showInstructions("Alternate Left and Right Arrows to SPRINT!<br>Click 'START NOW' to begin.");
        this.ui.showStartButton(() => this.startCountdown());
        this.animate();
    }
    update(deltaTime) {
        if (this.gameState === GAME_STATE.COUNTDOWN) {
            this.countdownValue -= deltaTime;
            let messageToShow = "";
            const currentCeil = Math.ceil(this.countdownValue);
            // GO! message duration is 1 second (from 0 down to -1)
            // When countdownValue drops below -1, the race starts.
            if (this.countdownValue <= -1) { 
                this.gameState = GAME_STATE.RUNNING;
                this.ui.hideInstructions(); // Hides "GO!" or any prior message
                this.ui.showTimer();
                this.raceTime = 0; // Official race start time
                this.audioManager.playSound('crowdCheer');
            } else if (this.countdownValue <= 0) { // Display "GO!" (value is between 0 and -1)
                messageToShow = "GO!";
            } else { // Display countdown number (3, 2, 1)
                messageToShow = currentCeil.toString();
            }
            if (this.gameState === GAME_STATE.COUNTDOWN && this.ui.getCurrentMessage() !== messageToShow) {
                this.ui.displayCountdownMessage(messageToShow);
            }
        } else if (this.gameState === GAME_STATE.RUNNING) {
            if (!this.player.isFinished) {
                this.player.update(deltaTime, this.inputHandler.sprintKeys, this.hurdles);
                 if (this.player.mesh.position.z <= -TRACK_LENGTH) {
                    if (!this.player.isFinished) { // Play sound only on first finish
                        this.player.finish(this.raceTime);
                        this.playerFinished = true;
                        this.audioManager.playSound('finishLine'); 
                    }
                }
            }
            this.aiOpponents.forEach(opponent => {
                if (!opponent.isFinished) {
                    opponent.update(deltaTime, this.raceTime); // Pass raceTime to AI update
                }
            });
            
            this.raceTime += deltaTime; // Accumulate race time
            this.ui.updateTimer(this.raceTime);
            this.allOpponentsFinished = NUM_AI_OPPONENTS > 0 ? this.aiOpponents.every(op => op.isFinished) : true;
            if (this.playerFinished && (this.allOpponentsFinished || NUM_AI_OPPONENTS === 0)) { // Also handle solo player case
                if (this.gameState !== GAME_STATE.FINISHED) { // Ensure this block runs only once
                    this.gameState = GAME_STATE.FINISHED;
                    // Ensure all racers have a valid finishTime, especially AIs if they didn't "cross" the line due to timing
                    // This is a safeguard; ideally, their finishTime is set in their update() or finish() method.
                    // For player, finishTime is set in player.finish().
                    // For AIs, their finishTime is implicitly their current raceTime when they cross -TRACK_LENGTH.
                    // Let's explicitly assign finishTime to AIs if they finished.
                    this.aiOpponents.forEach(op => {
                        if (op.isFinished && op.finishTime === undefined) { // AIs might not have finishTime explicitly set
                            op.finishTime = this.raceTime; // Approximate with current raceTime if they just finished
                        }
                    });
                    
                    const allRacers = [this.player, ...this.aiOpponents];
                    
                    // Sort racers by their finishTime. Racers who haven't finished (undefined finishTime) go last.
                    allRacers.sort((a, b) => {
                        if (a.finishTime === undefined && b.finishTime === undefined) return 0; // Both DNF, keep order
                        if (a.finishTime === undefined) return 1;  // a DNF, b finished, so a is after b
                        if (b.finishTime === undefined) return -1; // b DNF, a finished, so a is before b
                        return a.finishTime - b.finishTime; // Both finished, sort by time
                    });
                    let playerRank = allRacers.findIndex(racer => racer === this.player) + 1;
                    if (playerRank === 0) { // Should not happen if player is in allRacers
                        console.error("Error: Player not found in sorted racers list.");
                        playerRank = 1; // Fallback
                    }
                    
                    this.ui.showResults(this.player.finishTime, playerRank, allRacers.length);
                }
            }
        } else if (this.gameState === GAME_STATE.READY) {
            // Player interaction to start countdown is handled by the start button click
            // and the startCountdown method.
        }
        this.updateCamera();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        // this.renderer.render(this.scene, this.camera); // Old rendering
        this.composer.render(deltaTime); // New rendering with post-processing
    }
}