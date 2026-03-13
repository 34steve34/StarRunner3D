// Level 4: Wormhole Spiral - Epic cosmic journey down a ribbon road
import * as THREE from 'three';

export class WormholeSpiral {
    constructor() {
        this.phase = 'approach'; // approach, entrapment, spiral, death
        this.spiralRibbon = null;
        this.obstacles = [];
        this.blueStars = [];
        this.wormholeStructure = null;
        this.entrappedTime = 0;
        this.spiralProgress = 0;
        this.isDying = false;
        this.deathTime = 0;
        this.originalCameraRadius = 80;
    }

    spawn(scene, levelData, CONFIG, ship) {
        try {
            this.scene = scene;
            this.levelData = levelData;
            this.CONFIG = CONFIG;
            
            if (!ship) {
                console.error('Level 4 spawn failed: ship is null or undefined');
                return { phase: 'approach', customControls: false, error: 'Ship not loaded' };
            }
            
            console.log('🌀 Level 4: Wormhole Spiral - Beginning cosmic journey...');
            
            // Ship starts at origin, looking toward distant wormhole
            ship.position.set(0, 0, 0);
            ship.visible = true;
            ship.rotation.set(0, 0, 0);
            ship.rotateY(Math.PI);
            
            console.log('Ship spawned at:', ship.position);
            
            // Create wormhole far away
            this.createWormholeStructure();
            
            // Create blue stars flowing toward wormhole
            this.createBlueStarField();
            
            console.log('Level 4 spawn completed successfully');
            
            return {
                phase: this.phase,
                customControls: false
            };
        } catch (error) {
            console.error('Error in Level 4 spawn:', error);
            return {
                phase: 'approach',
                customControls: false,
                error: error.message
            };
        }
    }

    createWormholeStructure() {
        this.wormholeStructure = new THREE.Group();
        
        // Small distant blue ring - just a spec in the distance
        const ringGeometry = new THREE.TorusGeometry(40, 6, 8, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x0088ff, 
            transparent: true, 
            opacity: 1.0
        });
        const centralRing = new THREE.Mesh(ringGeometry, ringMaterial);
        centralRing.position.set(0, 0, -2000); // Far away
        this.wormholeStructure.add(centralRing);
        
        // Light to make it visible
        const ringLight = new THREE.PointLight(0x0088ff, 800, 500);
        ringLight.position.set(0, 0, -2000);
        this.wormholeStructure.add(ringLight);
        
        // Small distant plane
        const planeGeometry = new THREE.PlaneGeometry(150, 150, 8, 8);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x003366, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const poolPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        poolPlane.position.set(0, 0, -2000);
        poolPlane.rotation.x = -Math.PI / 2;
        this.wormholeStructure.add(poolPlane);
        
        console.log('Wormhole created at z=-2000');
        this.scene.add(this.wormholeStructure);
    }

    createBlueStarField() {
        const starCount = 200;
        const wormholeZ = -2000;
        
        for (let i = 0; i < starCount; i++) {
            const star = new THREE.Mesh(
                new THREE.SphereGeometry(2, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0x0088ff })
            );
            
            // Random position in space between ship and wormhole
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 1000;
            const height = (Math.random() - 0.5) * 500;
            const depth = -500 - Math.random() * 1500; // Between ship (z=0) and wormhole (z=-2000)
            
            star.position.set(
                Math.cos(angle) * distance,
                height,
                depth
            );
            
            star.userData = { 
                angle: angle,
                distance: distance,
                originalZ: depth,
                flowSpeed: 0.5 + Math.random() * 0.5,
                targetZ: wormholeZ
            };
            
            this.blueStars.push(star);
            this.scene.add(star);
        }
        console.log('Created', starCount, 'blue stars');
    }

    update(ship, camera, dt) {
        if (this.phase === 'approach') {
            return this.updateApproach(ship, camera, dt);
        } else if (this.phase === 'entrapment') {
            return this.updateEntrapment(ship, camera, dt);
        } else if (this.phase === 'spiral') {
            return this.updateSpiral(ship, camera, dt);
        } else if (this.phase === 'death') {
            return this.updateDeath(ship, camera, dt);
        }
    }

    updateApproach(ship, _camera, dt) {
        // Update blue stars - flow toward wormhole
        this.blueStars.forEach(star => {
            // Move toward wormhole
            star.position.z -= star.userData.flowSpeed * dt * 100;
            
            // Reset if passed wormhole
            if (star.position.z < -2100) {
                star.position.z = -500 - Math.random() * 1500;
            }
        });
        
        // Check if ship reached wormhole
        const distanceToWormhole = ship.position.distanceTo(new THREE.Vector3(0, 0, -2000));
        console.log('Distance to wormhole:', distanceToWormhole.toFixed(0));
        
        if (distanceToWormhole < 400) {
            this.phase = 'entrapment';
            this.entrappedTime = 0;
            console.log('🌀 Ship caught in wormhole gravity!');
            return { customControls: true };
        }
        
        return { customControls: false };
    }

    updateEntrapment(ship, camera, dt) {
        this.entrappedTime += dt;
        console.log('Entrapment time:', this.entrappedTime.toFixed(1));
        
        // Pull ship toward wormhole
        const wormholeCenter = new THREE.Vector3(0, 0, -2000);
        const direction = new THREE.Vector3().subVectors(wormholeCenter, ship.position).normalize();
        ship.position.add(direction.multiplyScalar(dt * 200));
        
        // Gentle camera shake
        if (Math.random() < 0.2) {
            camera.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 1
            ));
        }
        
        // After 3 seconds, transition to spiral
        if (this.entrappedTime >= 3) {
            console.log('Transitioning to spiral phase');
            this.phase = 'spiral';
            this.spiralProgress = 0;
            
            // Clean up wormhole
            this.scene.remove(this.wormholeStructure);
            this.blueStars.forEach(star => this.scene.remove(star));
            this.blueStars = [];
            
            // Create spiral
            this.createSpiralRibbon();
            
            // Position ship ON the spiral ribbon
            ship.position.set(this.levelData.cylinderRadius, 0, 0);
            ship.rotation.set(0, 0, 0);
            ship.rotateY(Math.PI);
            
            console.log('🎢 Ship on spiral at:', ship.position);
            return { customControls: false };
        }
        
        return { customControls: true };
    }

    createSpiralRibbon() {
        const { spiralTurns, ribbonWidth, cylinderRadius, cylinderHeight } = this.levelData;
        
        const spiralPoints = [];
        const segments = spiralTurns * 32;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * spiralTurns * Math.PI * 2;
            const y = -t * cylinderHeight;
            
            const x = Math.cos(angle) * cylinderRadius;
            const z = Math.sin(angle) * cylinderRadius;
            
            spiralPoints.push(new THREE.Vector3(x, y, z));
        }
        
        this.spiralRibbon = new THREE.Group();
        
        for (let i = 0; i < spiralPoints.length - 1; i++) {
            const point1 = spiralPoints[i];
            const point2 = spiralPoints[i + 1];
            
            const segmentGeometry = new THREE.PlaneGeometry(ribbonWidth, point1.distanceTo(point2));
            const segmentMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff6600,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            });
            
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.position.copy(point1).add(point2).multiplyScalar(0.5);
            segment.lookAt(point2);
            segment.rotateX(Math.PI / 2);
            
            this.spiralRibbon.add(segment);
        }
        
        this.scene.add(this.spiralRibbon);
        this.createObstacles();
    }

    createObstacles() {
        const { obstacleCount, ribbonWidth, spiralTurns, cylinderRadius, cylinderHeight } = this.levelData;
        
        for (let i = 0; i < obstacleCount; i++) {
            const obstacle = new THREE.Mesh(
                new THREE.BoxGeometry(15, 15, 15),
                new THREE.MeshBasicMaterial({ color: 0x0088ff })
            );
            
            const t = Math.random();
            const angle = t * spiralTurns * Math.PI * 2;
            const y = -t * cylinderHeight;
            
            const ribbonOffset = (Math.random() - 0.5) * (ribbonWidth * 0.8);
            
            const centerX = Math.cos(angle) * cylinderRadius;
            const centerZ = Math.sin(angle) * cylinderRadius;
            
            const perpAngle = angle + Math.PI / 2;
            obstacle.position.set(
                centerX + Math.cos(perpAngle) * ribbonOffset,
                y + 10,
                centerZ + Math.sin(perpAngle) * ribbonOffset
            );
            
            this.obstacles.push(obstacle);
            this.scene.add(obstacle);
        }
    }

    updateSpiral(ship, _camera, _dt) {
        const { spiralTurns, cylinderRadius, cylinderHeight, ribbonWidth } = this.levelData;
        
        const currentAngle = Math.atan2(ship.position.z, ship.position.x);
        const spiralT = (currentAngle + Math.PI) / (spiralTurns * Math.PI * 2);
        
        const targetY = -spiralT * cylinderHeight;
        ship.position.y = targetY;
        
        const distanceFromCenter = Math.sqrt(ship.position.x ** 2 + ship.position.z ** 2);
        const ribbonRadius = cylinderRadius;
        const ribbonHalfWidth = ribbonWidth / 2;
        
        if (Math.abs(distanceFromCenter - ribbonRadius) > ribbonHalfWidth) {
            this.phase = 'death';
            this.isDying = true;
            this.deathTime = 0;
            console.log('💀 Ship fell off the ribbon road!');
            return { customControls: true };
        }
        
        this.checkObstacleCollisions(ship);
        
        this.spiralProgress = Math.max(0, Math.min(1, -ship.position.y / cylinderHeight));
        
        if (this.spiralProgress >= 0.95) {
            console.log('🏁 Spiral descent complete!');
            return { levelComplete: true };
        }
        
        return { customControls: false };
    }

    updateDeath(ship, _camera, dt) {
        this.deathTime += dt;
        
        const driftDirection = new THREE.Vector3().subVectors(ship.position, new THREE.Vector3(0, ship.position.y, 0)).normalize();
        ship.position.add(driftDirection.multiplyScalar(dt * 50));
        
        const fadeProgress = Math.min(1, this.deathTime / 3);
        
        if (this.deathTime >= 3) {
            ship.position.set(this.levelData.cylinderRadius, 0, 0);
            this.phase = 'spiral';
            this.isDying = false;
            this.deathTime = 0;
            console.log('🔄 Respawning at top of spiral...');
        }
        
        return { 
            customControls: true,
            fadeToBlack: fadeProgress
        };
    }

    checkObstacleCollisions(ship) {
        this.obstacles.forEach(obstacle => {
            const distance = ship.position.distanceTo(obstacle.position);
            if (distance < 25) {
                console.log('💥 Hit obstacle!');
            }
        });
    }

    cleanup(scene) {
        if (this.spiralRibbon) scene.remove(this.spiralRibbon);
        if (this.wormholeStructure) scene.remove(this.wormholeStructure);
        
        this.obstacles.forEach(obs => scene.remove(obs));
        this.blueStars.forEach(star => scene.remove(star));
        
        this.obstacles = [];
        this.blueStars = [];
    }
}
