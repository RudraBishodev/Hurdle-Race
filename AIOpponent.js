import * as THREE from 'three';
import { 
    MAX_SPEED, ACCELERATION, DECELERATION, AI_OPPONENT_COLOR_VARIATIONS, TRACK_LENGTH,
    PLAYER_JUMP_FORCE, GRAVITY, HURDLE_DIMENSIONS, HURDLE_Z_POSITIONS
} from 'constants';
export class AIOpponent {
    constructor(scene, lane, color) {
        this.baseY = 0.9; // Base Y position for the center of the AI model
        this.mesh = new THREE.Group();
        this.mesh.position.set(lane, this.baseY, 0);
        scene.add(this.mesh);
        const material = new THREE.MeshStandardMaterial({ color: color || 0xff0000 });
        // Torso
        const torsoGeometry = new THREE.BoxGeometry(0.4, 0.7, 0.25);
        const torso = new THREE.Mesh(torsoGeometry, material);
        torso.castShadow = true;
        torso.receiveShadow = true;
        this.mesh.add(torso);
        // Head
        const headRadius = 0.22;
        const headGeometry = new THREE.SphereGeometry(headRadius, 16, 12);
        const head = new THREE.Mesh(headGeometry, material);
        head.position.y = torsoGeometry.parameters.height / 2 + headRadius * 0.9;
        head.castShadow = true;
        this.mesh.add(head);
        // Legs
        const legRadius = 0.1;
        const legLength = 0.6;
        const legGeometry = new THREE.CapsuleGeometry(legRadius, legLength, 4, 8);
        const legYPosition = -(torsoGeometry.parameters.height / 2) - (legLength / 2) + legRadius * 0.5;
        const leftLeg = new THREE.Mesh(legGeometry, material);
        leftLeg.position.set(-0.12, legYPosition, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        this.mesh.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeometry, material);
        rightLeg.position.set(0.12, legYPosition, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        this.mesh.add(rightLeg);
        // Arms
        const armRadius = 0.08;
        const armLength = 0.5;
        const armGeometry = new THREE.CapsuleGeometry(armRadius, armLength, 4, 8);
        const armYPosition = torsoGeometry.parameters.height / 2 - armLength / 2 - armRadius;
        const leftArm = new THREE.Mesh(armGeometry, material);
        leftArm.position.set(-(torsoGeometry.parameters.width / 2 + armRadius * 0.8), armYPosition, 0);
        leftArm.rotation.z = THREE.MathUtils.degToRad(20);
        leftArm.castShadow = true;
        this.mesh.add(leftArm);
        const rightArm = new THREE.Mesh(armGeometry, material);
        rightArm.position.set(torsoGeometry.parameters.width / 2 + armRadius * 0.8, armYPosition, 0);
        rightArm.rotation.z = THREE.MathUtils.degToRad(-20);
        rightArm.castShadow = true;
        this.mesh.add(rightArm);
        
        this.mesh.castShadow = true; // Ensure group casts shadow
        this.currentSpeed = 0;
        this.targetSpeed = MAX_SPEED * (0.78 + Math.random() * 0.21); // Range: 0.78 to 0.99 of MAX_SPEED
        this.acceleration = ACCELERATION * (0.85 + Math.random() * 0.35); // Range: 0.85 to 1.2 of ACCELERATION
        this.isFinished = false;
        this.finishTime = undefined;
        // Jump related properties
        this.isJumping = false;
        this.verticalVelocity = 0;
        this.onGround = true;
        this.jumpForce = PLAYER_JUMP_FORCE * (0.85 + Math.random() * 0.3); // 85% to 115% of player's jump force
        this.gravity = GRAVITY;
        this.currentHurdleIndex = 0;
        // Adjust jump decision distance based on target speed: faster AIs look further ahead
        const speedFactor = this.targetSpeed / MAX_SPEED; // Factor from ~0.78 to ~0.99
        this.jumpDecisionDistance = 2.5 + speedFactor * 2.5; // Range: ~4.45m to ~4.975m. Min 2.5m, Max 5m
    }
    finish(raceTime) { // Method to call when AI crosses the finish line
        if (!this.isFinished) {
            this.isFinished = true;
            this.finishTime = raceTime;
            this.currentSpeed = 0;
        }
    }
    jump() {
        if (this.onGround && !this.isFinished && !this.isJumping) {
            this.isJumping = true;
            this.onGround = false;
            this.verticalVelocity = this.jumpForce;
        }
    }
    update(deltaTime, currentRaceTime) { // Pass currentRaceTime
        if (this.isFinished) return;
        if (this.mesh.position.z <= -TRACK_LENGTH) {
            this.finish(currentRaceTime);
            return;
        }
        // Jump physics
        if (this.isJumping) {
            this.mesh.position.y += this.verticalVelocity * deltaTime;
            this.verticalVelocity -= this.gravity * deltaTime;
            if (this.mesh.position.y <= this.baseY) {
                this.mesh.position.y = this.baseY;
                this.isJumping = false;
                this.onGround = true;
                this.verticalVelocity = 0;
            }
        }
        // Hurdle detection and jumping logic (only if on ground)
        if (this.onGround && !this.isJumping && this.currentHurdleIndex < HURDLE_Z_POSITIONS.length) {
            const hurdleZPosition = HURDLE_Z_POSITIONS[this.currentHurdleIndex];
            const distanceToHurdle = this.mesh.position.z - hurdleZPosition; // Positive if AI is before hurdle (e.g. AI at -10, hurdle at -20 -> -10 - (-20) = 10)
            if (distanceToHurdle > 0 && distanceToHurdle < this.jumpDecisionDistance) {
                this.jump();
            }
            // Check if AI has passed the current hurdle's Z position (center of hurdle)
            if (this.mesh.position.z < hurdleZPosition - HURDLE_DIMENSIONS.depth / 2) {
                this.currentHurdleIndex++;
            }
        }
        
        // AI simple logic: accelerate towards target speed (only if on ground or not significantly affected by jump)
        // For simplicity, AI maintains horizontal speed logic even while jumping for now.
        if (this.currentSpeed < this.targetSpeed) {
            this.currentSpeed += this.acceleration * deltaTime;
            this.currentSpeed = Math.min(this.currentSpeed, this.targetSpeed);
        } else if (this.currentSpeed > this.targetSpeed) {
            this.currentSpeed -= DECELERATION * deltaTime * 0.5;
            this.currentSpeed = Math.max(this.currentSpeed, this.targetSpeed * 0.9);
        }
        
        // Random speed variation
        if (Math.random() < 0.01) {
            const currentTargetSpeedFactor = this.targetSpeed / MAX_SPEED;
            const minFactor = Math.max(0.75, currentTargetSpeedFactor - 0.05); 
            const maxFactor = Math.min(0.99, currentTargetSpeedFactor + 0.05); 
            this.targetSpeed = MAX_SPEED * (minFactor + Math.random() * (maxFactor - minFactor));
        }
        this.mesh.position.z -= this.currentSpeed * deltaTime;
        // Bobbing animation for AI (only if on ground and moving)
        if (this.onGround) {
            if (this.currentSpeed > 0.1) {
                this.mesh.position.y = this.baseY + Math.sin(Date.now() * 0.015 * this.currentSpeed + this.mesh.position.x) * 0.05;
            } else {
                this.mesh.position.y = this.baseY; // Reset to baseY if on ground and not moving
            }
        }
    }
    reset() {
        this.mesh.position.set(this.mesh.position.x, this.baseY, 0); // Use baseY for reset
        this.currentSpeed = 0;
        this.targetSpeed = MAX_SPEED * (0.78 + Math.random() * 0.21); // Consistent with constructor on reset
        this.isFinished = false;
        this.finishTime = undefined; // Reset finishTime
        // Reset jump state
        this.isJumping = false;
        this.verticalVelocity = 0;
        this.onGround = true;
        this.mesh.position.y = this.baseY;
        this.currentHurdleIndex = 0;
        // Re-calculate jumpDecisionDistance as targetSpeed might be different if logic changes later
        const speedFactor = this.targetSpeed / MAX_SPEED;
        this.jumpDecisionDistance = 2.5 + speedFactor * 2.5;
    }
}