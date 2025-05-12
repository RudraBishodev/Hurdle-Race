import * as THREE from 'three';
import { PLAYER_COLOR, MAX_SPEED, ACCELERATION, DECELERATION, SPRINT_BOOST, SPRINT_DECAY_RATE, PLAYER_JUMP_FORCE, GRAVITY, AIR_DECELERATION_FACTOR } from 'constants';
const PLAYER_TEXTURE_URL = 'https://play.rosebud.ai/assets/usain-bolt (1).jpg?5Pr1';
export class Player {
    constructor(scene, initialLaneX = 0) {
        this.baseY = 0.9; // Base Y position for the center of the player model
        this.mesh = new THREE.Group();
        this.mesh.position.set(initialLaneX, this.baseY, 0);
        scene.add(this.mesh);
        const textureLoader = new THREE.TextureLoader();
        const playerTexture = textureLoader.load(PLAYER_TEXTURE_URL);
        playerTexture.colorSpace = THREE.SRGBColorSpace;
        // To make the texture wrap around the torso, we might need to adjust UVs or repeat.
        // For a simple box, it might be okay by default on some faces.
        // Adjusting texture wrapping and repeat for better fit on the torso
        playerTexture.wrapS = THREE.RepeatWrapping;
        playerTexture.wrapT = THREE.RepeatWrapping;
        // The texture is 360x450 (width x height). Torso front face is 0.4x0.7.
        // We want to map the main part of the image to the front.
        // This might require more complex UV mapping for a perfect fit.
        // For a basic application:
        // playerTexture.repeat.set(1, 1); // Default, might stretch.
        const playerMaterial = new THREE.MeshStandardMaterial({
            map: playerTexture,
            color: PLAYER_COLOR, // Base color, will be tinted by texture if map is not fully opaque
        });
        
        const defaultMaterial = new THREE.MeshStandardMaterial({ color: PLAYER_COLOR });
        // Torso
        const torsoGeometry = new THREE.BoxGeometry(0.4, 0.7, 0.25); // width, height, depth
        const torso = new THREE.Mesh(torsoGeometry, playerMaterial); // Apply textured material to torso
        torso.castShadow = true;
        torso.receiveShadow = true; // Torso can receive shadow from head
        this.mesh.add(torso); // Centered at group's origin by default
        // Head
        const headRadius = 0.22;
        const headGeometry = new THREE.SphereGeometry(headRadius, 16, 12);
        const head = new THREE.Mesh(headGeometry, defaultMaterial); // Use default material for head
        head.position.y = torsoGeometry.parameters.height / 2 + headRadius * 0.9; // Place on top of torso
        head.castShadow = true;
        this.mesh.add(head);
        // Legs
        const legRadius = 0.1;
        const legLength = 0.6; // Cylinder part of capsule
        const legGeometry = new THREE.CapsuleGeometry(legRadius, legLength, 4, 8);
        
        const legYPosition = -(torsoGeometry.parameters.height / 2) - (legLength / 2) + legRadius * 0.5; // Adjust to connect properly
        const leftLeg = new THREE.Mesh(legGeometry, defaultMaterial); // Use default material for legs
        leftLeg.position.set(-0.12, legYPosition, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        this.mesh.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeometry, defaultMaterial); // Use default material for legs
        rightLeg.position.set(0.12, legYPosition, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        this.mesh.add(rightLeg);
        // Arms
        const armRadius = 0.08;
        const armLength = 0.5;
        const armGeometry = new THREE.CapsuleGeometry(armRadius, armLength, 4, 8);
        const armYPosition = torsoGeometry.parameters.height / 2 - armLength / 2 - armRadius; // Mid-torso
        const leftArm = new THREE.Mesh(armGeometry, defaultMaterial); // Use default material for arms
        leftArm.position.set(-(torsoGeometry.parameters.width / 2 + armRadius * 0.8), armYPosition, 0);
        leftArm.rotation.z = THREE.MathUtils.degToRad(20); // Slightly angled
        leftArm.castShadow = true;
        this.mesh.add(leftArm);
        const rightArm = new THREE.Mesh(armGeometry, defaultMaterial); // Use default material for arms
        rightArm.position.set(torsoGeometry.parameters.width / 2 + armRadius * 0.8, armYPosition, 0);
        rightArm.rotation.z = THREE.MathUtils.degToRad(-20); // Slightly angled
        rightArm.castShadow = true;
        this.mesh.add(rightArm);
        
        // Player Identifier (Halo)
        const identifierGeometry = new THREE.TorusGeometry(headRadius * 1.3, 0.05, 8, 32);
        const identifierMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FFFF, // Bright Cyan
            transparent: true, 
            opacity: 0.7,
            side: THREE.DoubleSide 
        });
        this.playerIdentifier = new THREE.Mesh(identifierGeometry, identifierMaterial);
        this.playerIdentifier.rotation.x = Math.PI / 2; // Rotate to be horizontal
        this.playerIdentifier.position.y = head.position.y + headRadius * 0.5; // Position above the head
        this.mesh.add(this.playerIdentifier);
        // Overall group shadow casting
        this.mesh.castShadow = true; // Though individual parts handle it, good to have.
        this.currentSpeed = 0;
        this.sprintEnergy = 0;
        this.lastSprintKey = null;
        this.isRunning = false;
        this.sprintBoostEffectActive = false;
        this.sprintBoostEffectTimer = 0;
        this.sprintBoostEffectDuration = 0.2; // seconds
        this.originalIdentifierColor = new THREE.Color(0x00FFFF); // Store original color
        this.boostIdentifierColor = new THREE.Color(0xFFFFFF); // White for boost
        this.originalIdentifierScale = 1.3;
        this.boostIdentifierScale = 1.6;
        this.isFinished = false;
        this.finishTime = 0;
        // Jump state
        this.isJumping = false;
        this.verticalVelocity = 0;
        this.onGround = true;
        // this.collidedLastFrame = false; // If we need to prevent multiple penalties for one collision
    }
    getBoundingBox() {
        if (!this.boundingBox) {
            this.boundingBox = new THREE.Box3();
        }
        this.mesh.updateMatrixWorld(true); // Ensure matrixWorld is up to date
        this.boundingBox.setFromObject(this.mesh);
        return this.boundingBox;
    }
sprint(key) {
    if (this.isFinished) return; // Allow sprint input processing even if jumping
    // this.isRunning state will be determined in update() based on active sprintKeys.
    // This method now focuses on managing sprintEnergy and visual feedback.
    if (this.lastSprintKey !== key) {
            this.sprintEnergy += SPRINT_BOOST;
            this.sprintEnergy = Math.min(this.sprintEnergy, MAX_SPEED * 0.85); 
            this.sprintBoostEffectActive = true;
            this.sprintBoostEffectTimer = this.sprintBoostEffectDuration;
            if (this.playerIdentifier) {
                this.playerIdentifier.material.color.set(this.boostIdentifierColor);
                this.playerIdentifier.scale.set(this.boostIdentifierScale, this.boostIdentifierScale, this.boostIdentifierScale);
            }
        }
        this.lastSprintKey = key;
    }
    jump() {
        if (this.onGround && !this.isFinished) {
            this.isJumping = true;
            this.onGround = false;
            this.verticalVelocity = PLAYER_JUMP_FORCE;
            // Optional: play jump sound
            // this.audioManager.playSound('jump'); 
        }
    }
    
    stop() { 
        this.isRunning = false;
    }
    finish(time) {
        if (!this.isFinished) {
            this.isFinished = true;
            this.finishTime = time;
            this.currentSpeed = 0; // Stop abruptly at finish line
            this.sprintEnergy = 0;
            this.isRunning = false;
        }
    }
    reset() {
        this.mesh.position.z = 0;
        this.mesh.position.y = this.baseY; // Reset Y position
        this.currentSpeed = 0;
        this.sprintEnergy = 0;
        this.isRunning = false;
        this.isFinished = false;
        this.finishTime = 0;
        this.lastSprintKey = null;
        this.isJumping = false;
        this.verticalVelocity = 0;
        this.onGround = true;
        // this.collidedLastFrame = false;
    }
    handleHurdleCollision() {
        // Penalty for hitting a hurdle
        this.currentSpeed = 0;
        this.sprintEnergy = 0;
        this.isRunning = false; 
        // Optional: small visual/audio feedback for collision
        // Optional: slight nudge back
        // this.mesh.position.z += 0.1; // Small nudge backward
    }
    checkHurdleCollisions(hurdles) {
        if (this.isFinished) return;
        const playerBox = this.getBoundingBox();
        for (const hurdle of hurdles) {
            // Basic proximity check in Z before more expensive BBox calculation & check
            const dz = Math.abs(this.mesh.position.z - hurdle.mesh.position.z);
            if (dz > 2) { // If hurdle is too far in Z, skip ( hurdle depth + player depth + buffer)
                continue;
            }
            
            const hurdleBox = hurdle.getBoundingBox();
            if (playerBox.intersectsBox(hurdleBox)) {
                // Check if player's feet are lower than hurdle top.
                // Player's lowest point vs Hurdle's highest point essentially.
                // Player's model center is at this.mesh.position.y
                // Hurdle's model center is at hurdle.mesh.position.y (which is dimensions.height / 2)
                // A simple intersection is a good start. If the player's jump isn't high enough,
                // their lower body will intersect.
                this.handleHurdleCollision();
                break; // Apply penalty once per frame
            }
        }
    }
    update(deltaTime, sprintKeys, hurdles = []) {
        if (this.isFinished) return;
        // Check for collisions before movement updates for this frame
        // if (!this.isJumping || this.verticalVelocity < 0) { // Only check if on ground or falling
             this.checkHurdleCollisions(hurdles);
        // }
        
        // If a collision occurred, speed/sprintEnergy are now 0. Subsequent logic will use these values.
        // Handle sprint boost visual effect
        if (this.sprintBoostEffectActive) {
            this.sprintBoostEffectTimer -= deltaTime;
            if (this.sprintBoostEffectTimer <= 0) {
                this.sprintBoostEffectActive = false;
                if (this.playerIdentifier) {
                    this.playerIdentifier.material.color.set(this.originalIdentifierColor);
                    const headRadius = 0.22; 
                    const torusRadius = this.playerIdentifier.geometry.parameters.radius;
                    const scale = (headRadius * this.originalIdentifierScale) / torusRadius;
                    this.playerIdentifier.scale.set(scale, scale, scale);
                }
            }
        }
        // Horizontal movement logic
        // 1. Determine if player is actively trying to run based on current key presses
        let activeSprintInput = false;
        for (const k in sprintKeys) {
            if (sprintKeys[k]) {
                activeSprintInput = true;
                break;
            }
        }
        this.isRunning = activeSprintInput; // Update player's internal state
        // 2. Apply acceleration or deceleration to base speed (this.currentSpeed)
        if (this.isRunning) {
            this.currentSpeed += ACCELERATION * deltaTime;
        } else {
            // Apply deceleration if not actively running
            if (this.onGround) {
                this.currentSpeed -= DECELERATION * deltaTime;
            } else {
                // Apply air deceleration only if there's some speed to begin with
                // and player is not actively trying to maintain/gain speed via jump force (covered by vertical physics)
                if (this.currentSpeed > 0) { 
                    this.currentSpeed -= DECELERATION * AIR_DECELERATION_FACTOR * deltaTime;
                }
            }
        }
        this.currentSpeed = Math.max(0, this.currentSpeed); // Prevent base speed from going negative
        // 3. Sprint energy decay (applies regardless of input, acts as a depleting bonus)
        this.sprintEnergy -= SPRINT_DECAY_RATE * deltaTime;
        this.sprintEnergy = Math.max(0, this.sprintEnergy);
        // 4. Calculate final speed for this frame
        // Combine base speed (from accel/decel) with the temporary sprintEnergy boost
        let finalSpeed = this.currentSpeed + this.sprintEnergy;
        finalSpeed = Math.min(finalSpeed, MAX_SPEED); // Cap at max speed
        finalSpeed = Math.max(0, finalSpeed);         // Ensure speed is not negative overall
        // 5. Apply movement using the calculated finalSpeed
        // this.currentSpeed is the persistent base speed, finalSpeed is for this frame's movement
        this.mesh.position.z -= finalSpeed * deltaTime;
        // Jumping physics
        if (this.isJumping) {
            this.mesh.position.y += this.verticalVelocity * deltaTime;
            this.verticalVelocity -= GRAVITY * deltaTime;
            if (this.mesh.position.y <= this.baseY) {
                this.mesh.position.y = this.baseY;
                this.isJumping = false;
                this.onGround = true;
                this.verticalVelocity = 0;
            }
        }
        // Bobbing animation (only if on ground and moving)
        if (this.onGround && this.currentSpeed > 0.1) {
            const bobAmount = Math.sin(Date.now() * 0.01 * this.currentSpeed + this.mesh.position.x) * 0.05;
            this.mesh.position.y = this.baseY + bobAmount;
        } else if (this.onGround) { // Ensure player is at baseY if on ground and not bobbing
            this.mesh.position.y = this.baseY;
        }
        // Animate identifier (e.g., gentle rotation)
        if (this.playerIdentifier && !this.sprintBoostEffectActive) { 
            this.playerIdentifier.rotation.z += 0.02; 
        }
        // Re-apply original scale if not boosting
        if (this.playerIdentifier && !this.sprintBoostEffectActive) {
            const torusRadius = this.playerIdentifier.geometry.parameters.radius; 
            const desiredVisualRadius = 0.22 * this.originalIdentifierScale; 
            const scale = desiredVisualRadius / torusRadius;
            this.playerIdentifier.scale.set(scale, scale, scale);
        }
    }
}