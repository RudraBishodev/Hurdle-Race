import * as THREE from 'three';
import { TRACK_COLOR, LINE_COLOR, START_LINE_COLOR, FINISH_LINE_COLOR, TRACK_LENGTH, TRACK_WIDTH, LANE_WIDTH, HURDLE_DIMENSIONS, HURDLE_Z_POSITIONS } from 'constants';
import { Hurdle } from 'Hurdle';
export class SceneSetup {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 15);

        this.addLights();
        this.createTrack();
        this.hurdles = []; // Initialize hurdles array
        this.createHurdles();
        this.createEnvironment();
    }
    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 75);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }

    createTrack() {
        // Main track surface
        const trackGeometry = new THREE.PlaneGeometry(TRACK_WIDTH, TRACK_LENGTH);
        const trackMaterial = new THREE.MeshStandardMaterial({ color: TRACK_COLOR, side: THREE.DoubleSide });
        const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
        trackMesh.rotation.x = -Math.PI / 2; // Lay flat
        trackMesh.position.y = -0.05; // Slightly below player
        trackMesh.position.z = -TRACK_LENGTH / 2;
        trackMesh.receiveShadow = true;
        this.scene.add(trackMesh);

        // Lane lines
        const numLanes = Math.floor(TRACK_WIDTH / LANE_WIDTH);
        const lineMaterial = new THREE.MeshStandardMaterial({ color: LINE_COLOR });
        const lineDepth = 0.02; // Make lines slightly raised for visibility

        for (let i = 0; i <= numLanes; i++) {
            const lineOffset = -TRACK_WIDTH / 2 + i * LANE_WIDTH;
            if (i > 0 && i < numLanes) { // Inner lane lines
                const lineGeometry = new THREE.BoxGeometry(0.1, lineDepth, TRACK_LENGTH);
                const lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
                lineMesh.position.set(lineOffset, 0, -TRACK_LENGTH / 2);
                lineMesh.castShadow = true;
                lineMesh.receiveShadow = true;
                this.scene.add(lineMesh);
            }
        }
        
        // Boundary lines
        const boundaryLineGeometry = new THREE.BoxGeometry(0.2, lineDepth, TRACK_LENGTH);
        const leftBoundary = new THREE.Mesh(boundaryLineGeometry, lineMaterial);
        leftBoundary.position.set(-TRACK_WIDTH / 2, 0, -TRACK_LENGTH / 2);
        this.scene.add(leftBoundary);
        const rightBoundary = new THREE.Mesh(boundaryLineGeometry, lineMaterial);
        rightBoundary.position.set(TRACK_WIDTH / 2, 0, -TRACK_LENGTH / 2);
        this.scene.add(rightBoundary);


        // Start line
        const startLineGeometry = new THREE.BoxGeometry(TRACK_WIDTH, 0.05, 0.2);
        const startLineMaterial = new THREE.MeshStandardMaterial({ color: START_LINE_COLOR });
        const startLineMesh = new THREE.Mesh(startLineGeometry, startLineMaterial);
        startLineMesh.position.set(0, 0.01, 0); // At z = 0
        this.scene.add(startLineMesh);

        // Finish line
        const finishLineGeometry = new THREE.BoxGeometry(TRACK_WIDTH, 0.05, 0.5); 
        const finishLineMaterial = new THREE.MeshStandardMaterial({ color: FINISH_LINE_COLOR, transparent: true, opacity: 0.7 });
        const finishLineMesh = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
        finishLineMesh.position.set(0, 0.01, -TRACK_LENGTH);
        this.scene.add(finishLineMesh);
        // Finish line texture banner
        const textureLoader = new THREE.TextureLoader();
        const finishTexture = textureLoader.load('https://play.rosebud.ai/assets/fin.png?gQGe');
        finishTexture.colorSpace = THREE.SRGBColorSpace; 
        
        const bannerSize = 2.5; // Make banner square to better fit the square texture
        // const bannerWidthProportion = 0.3; // No longer needed with fixed size
        // const bannerWidth = TRACK_WIDTH * bannerWidthProportion; // No longer needed
        const bannerGeometry = new THREE.PlaneGeometry(bannerSize, bannerSize);
        const bannerMaterial = new THREE.MeshStandardMaterial({ 
            map: finishTexture, 
            transparent: true, // Enable transparency for PNG
            side: THREE.DoubleSide, // Ensure visible from both sides
            alphaTest: 0.1 // Discard pixels with low alpha
        });
        const finishBannerMesh = new THREE.Mesh(bannerGeometry, bannerMaterial);
        // Position it slightly above the ground, at the finish line, slightly in front of the 3D line bar
        // Position it a bit higher and slightly behind the physical finish line bar
        finishBannerMesh.position.set(0, bannerSize / 2 + 0.2, -TRACK_LENGTH - 0.28); 
        finishBannerMesh.receiveShadow = false; // Usually banners don't receive strong shadows
        finishBannerMesh.castShadow = true; // But they can cast them
        this.scene.add(finishBannerMesh);
    }
    createHurdles() {
        const totalLanes = Math.floor(TRACK_WIDTH / LANE_WIDTH);
        const hurdleBaseY = 0; // Hurdles sit on the track surface
        for (let i = 0; i < totalLanes; i++) {
            const laneX = (-TRACK_WIDTH / 2) + (i + 0.5) * LANE_WIDTH;
            for (let j = 0; j < HURDLE_Z_POSITIONS.length; j++) {
                const hurdleZ = HURDLE_Z_POSITIONS[j];
                // Ensure hurdles are not placed beyond the track length (or too close to start if positive Z)
                if (Math.abs(hurdleZ) < TRACK_LENGTH - HURDLE_DIMENSIONS.depth / 2 && hurdleZ < -HURDLE_DIMENSIONS.depth / 2) {
                    const hurdle = new Hurdle(this.scene, new THREE.Vector3(laneX, hurdleBaseY, hurdleZ));
                    this.hurdles.push(hurdle);
                }
            }
        }
    }
    getHurdles() {
        return this.hurdles;
    }
    
    createEnvironment() {
        // Simple ground plane extending beyond the track
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x559955, side: THREE.DoubleSide }); // Grassy green
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -0.1; // Below track
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);

        // Simple stadium "walls" as tall boxes
        const wallHeight = 30;
        const wallThickness = 5;
        const wallDistance = TRACK_WIDTH / 2 + 20;
        const textureLoader = new THREE.TextureLoader();
        const baseCrowdTexture = textureLoader.load('https://play.rosebud.ai/assets/360_F_292382234_vQsjNbVHkVx9maKuORNDp50L1hwYekeQ.jpg?FX6c');
        baseCrowdTexture.colorSpace = THREE.SRGBColorSpace;
        const textureAspectRatio = 720 / 360; // width/height of the texture image
        // Material for Side Walls (Left/Right)
        const sideWallTexture = baseCrowdTexture.clone();
        sideWallTexture.needsUpdate = true; 
        sideWallTexture.wrapS = THREE.RepeatWrapping;
        sideWallTexture.wrapT = THREE.RepeatWrapping;
        const sideWallGeometryLength = TRACK_LENGTH + 40; // Actual length of the side wall geometry face
        sideWallTexture.repeat.set(sideWallGeometryLength / (wallHeight * textureAspectRatio), 1);
        const sideWallMaterial = new THREE.MeshStandardMaterial({ map: sideWallTexture });
        // Material for Back Wall
        const backWallTexture = baseCrowdTexture.clone();
        backWallTexture.needsUpdate = true;
        backWallTexture.wrapS = THREE.RepeatWrapping;
        backWallTexture.wrapT = THREE.RepeatWrapping;
        const backWallGeometryWidth = (TRACK_WIDTH / 2 + 20) * 2 + wallThickness; // Actual width of the back wall face
        backWallTexture.repeat.set(backWallGeometryWidth / (wallHeight * textureAspectRatio), 1);
        const texturedBackWallMaterial = new THREE.MeshStandardMaterial({ map: backWallTexture });
        
        // Fallback plain material (can be used if some walls should remain untextured)
        // const plainWallMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3 }); // Example if needed
        const wallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, TRACK_LENGTH + 40);
        const leftWall = new THREE.Mesh(wallGeometry, sideWallMaterial); // Use specific side wall material
        leftWall.position.set(-wallDistance, wallHeight / 2 - 0.1, -TRACK_LENGTH / 2);
        leftWall.receiveShadow = true;
        leftWall.castShadow = true;
        this.scene.add(leftWall);
        const rightWall = new THREE.Mesh(wallGeometry, sideWallMaterial); // Use specific side wall material
        rightWall.position.set(wallDistance, wallHeight / 2 - 0.1, -TRACK_LENGTH / 2);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        this.scene.add(rightWall);
        
        // Front and back walls (simplified)
        const endWallGeometry = new THREE.BoxGeometry(backWallGeometryWidth, wallHeight, wallThickness);
        const backWall = new THREE.Mesh(endWallGeometry, texturedBackWallMaterial); // Use textured material
        backWall.position.set(0, wallHeight/2 -0.1, TRACK_LENGTH * 0.05 + 20);
        this.scene.add(backWall);

        // No front wall at finish line to keep view open
    }
}