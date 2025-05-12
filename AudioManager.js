import * as THREE from 'three';

export class AudioManager {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        if (camera) {
            camera.add(this.listener);
        } else {
            console.warn('AudioManager: Camera not provided, positional audio might not work as expected.');
        }
        this.audioLoader = new THREE.AudioLoader();
        this.sounds = {};
        this.soundConfigs = {
            crowdCheer: { url: 'https://play.rosebud.ai/assets/crowd-cheers-314921.mp3?jbaf', volume: 0.5, loop: false },
            // We'll use crowdCheer for finish as well, until a specific sound is available
            finishLine: { url: 'https://play.rosebud.ai/assets/crowd-cheers-314921.mp3?jbaf', volume: 0.7, loop: false } 
        };
    }

    loadSounds(callback) {
        let soundsToLoad = Object.keys(this.soundConfigs).length;
        if (soundsToLoad === 0 && callback) {
            callback();
            return;
        }

        for (const key in this.soundConfigs) {
            const config = this.soundConfigs[key];
            this.audioLoader.load(config.url, (buffer) => {
                const sound = new THREE.Audio(this.listener);
                sound.setBuffer(buffer);
                sound.setLoop(config.loop);
                sound.setVolume(config.volume);
                this.sounds[key] = sound;
                
                soundsToLoad--;
                if (soundsToLoad === 0 && callback) {
                    callback();
                }
            }, undefined, (err) => {
                console.error(`AudioManager: Error loading sound ${key}:`, err);
                soundsToLoad--;
                 if (soundsToLoad === 0 && callback) {
                    callback(); // Still call callback even if some sounds fail, to not block game
                }
            });
        }
    }

    playSound(key) {
        const sound = this.sounds[key];
        if (sound) {
            if (sound.isPlaying) {
                sound.stop(); // Stop and replay if already playing
            }
            sound.play();
        } else {
            console.warn(`AudioManager: Sound "${key}" not found or not loaded.`);
        }
    }

    stopSound(key) {
        const sound = this.sounds[key];
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }

    setVolume(key, volume) {
        const sound = this.sounds[key];
        if (sound) {
            sound.setVolume(volume);
        }
    }
}