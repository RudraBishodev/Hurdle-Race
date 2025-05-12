export const TRACK_LENGTH = 100; // meters
export const TRACK_WIDTH = 9.0;   // meters, increased to accommodate 6 racers (1 player + 5 AI)
export const LANE_WIDTH = 1.22; // Standard lane width
// Colors
export const PLAYER_COLOR = 0xFFFF00; // Yellow
export const TRACK_COLOR = 0xAF4F41;  // Terracotta/brick red
export const LINE_COLOR = 0xFFFFFF;   // White
export const START_LINE_COLOR = 0xFFFFFF; // White
export const FINISH_LINE_COLOR = 0x00DD00; // Bright Green
export const AI_OPPONENT_COLOR_VARIATIONS = [0xFF6347, 0x4682B4, 0x32CD32, 0xFFD700, 0x6A5ACD]; // Tomato, SteelBlue, LimeGreen, Gold, SlateBlue
// Player physics
export const MAX_SPEED = 10; // meters per second (world record ~12.2 m/s for 100m)
export const ACCELERATION = 2.5; // m/s^2, base acceleration
export const DECELERATION = 5; // m/s^2, when no keys are pressed
export const SPRINT_BOOST = 1.5; // Speed bonus per alternating key press, reduced for more challenge
export const SPRINT_DECAY_RATE = 4.2; // How quickly sprint boost fades, increased for more challenge
export const PLAYER_JUMP_FORCE = 7.5; // Initial upward velocity for jump (m/s)
export const GRAVITY = 22; // Acceleration due to gravity (m/s^2)
export const AIR_DECELERATION_FACTOR = 0.2; // How much player decelerates in air if not pressing sprint keys (0 means no air drag on base speed, 1 means same as ground)
// Game settings
export const NUM_AI_OPPONENTS = 5; // Number of AI opponents, ensure track has enough lanes
export const COUNTDOWN_SECONDS = 3; // Duration of the pre-race countdown
export const GAME_STATE = {
    READY: 'ready',
    COUNTDOWN: 'countdown',
    RUNNING: 'running',
    FINISHED: 'finished'
};
// Hurdle Constants
export const HURDLE_DIMENSIONS = { width: 1.18, height: 0.914, depth: 0.1 }; // Standard women's 100m hurdles height, width slightly less than lane
export const HURDLE_COLOR = 0xDC143C; // Crimson Red
// Defines Z-coordinates for each hurdle. Negative values as they are in front of player.
// e.g., -20 is 20m from start line, -80 is 20m before finish line (at -100m).
export const HURDLE_Z_POSITIONS = [-20, -80];