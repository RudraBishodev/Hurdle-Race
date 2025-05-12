import * as THREE from 'three';
import { HURDLE_COLOR, HURDLE_DIMENSIONS } from 'constants';

export class Hurdle {
    constructor(scene, position) {
        this.dimensions = HURDLE_DIMENSIONS; // { width, height, depth }
        
        const geometry = new THREE.BoxGeometry(this.dimensions.width, this.dimensions.height, this.dimensions.depth);
        const material = new THREE.MeshStandardMaterial({ color: HURDLE_COLOR });
        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.position.set(position.x, position.y + this.dimensions.height / 2, position.z); // Position is base center
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        // Add a "sign" panel on top of the hurdle bar
        const signHeight = 0.15;
        const signDepth = 0.02;
        const signWidth = this.dimensions.width * 0.8; // Slightly narrower than the hurdle bar
        
        const signGeometry = new THREE.BoxGeometry(signWidth, signHeight, signDepth);
        // A contrasting color for the sign, e.g., white or a light color
        const signMaterial = new THREE.MeshStandardMaterial({ color: 0xF0F0F0 }); 
        const signMesh = new THREE.Mesh(signGeometry, signMaterial);
        // Position the sign on top of the main hurdle bar
        // The hurdle bar's top surface is at its own local y = this.dimensions.height / 2
        // The main hurdle mesh itself is already positioned so its center is at dimensions.height / 2 from the ground.
        // So, the sign needs to be placed relative to the hurdle's group origin.
        // The hurdle bar's top is effectively at group's origin (y=0 within the group, as group is elevated).
        // Sign's center y = 0 (top of bar) + signHeight / 2
        signMesh.position.set(0, signHeight / 2, (this.dimensions.depth / 2) + (signDepth / 2) ); // Position on the front-top edge of the bar
        signMesh.castShadow = true;
        signMesh.receiveShadow = true;
        this.mesh.add(signMesh); // Add to the hurdle's group
        scene.add(this.mesh);
    }
    getBoundingBox() {
        if (!this.boundingBox) {
            this.boundingBox = new THREE.Box3();
        }
        this.mesh.updateMatrixWorld(true); // Ensure matrixWorld is up to date
        this.boundingBox.setFromObject(this.mesh);
        return this.boundingBox;
    }
    // Future methods for interaction (e.g., collision, topple) can be added here
}