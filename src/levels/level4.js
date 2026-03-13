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
        this.spiralProgress = 0; // 0 to 1 down the spiral
        this.isDying = false;
        this.deathTime = 0;
        this.originalCameraRadius = 80;
    }

    spawn(scene, levelData, CONFIG, ship) {
        try {
            this.scene = scene;
            this.levelData = levelData;
            this.CONFIG = CONFIG;
            
            console.log('🌀 Level 4: Wormhole Spiral - Beginning cosmic journey...');
            console.log('Ship position at spawn:', ship?.position);
            console.log('Ship visible:', ship?.visible);
            
            // Start with approach phase - ship stays in its current position
            this.createWormholeStructure();
            this.createBlueStarField();
            
            console.log('Level 4 spawn completed successfully');
            
            return {
                phase: this.phase,
                customControls: false // Normal controls during approach
            };
        } catch (error) {
            console.error('Error in Level 4 spawn:', error);
            // Return safe defaults if spawn fails
            return {
                phase: 'approach',
                customControls: false
            };
        }
    }

    createWormholeStructure() {
        // Create the distant blue infinity pool structure
        this.wormholeStructure = new THREE.Group();
        
        // Central ring (the drain)
        const ringGeometry = new THREE.TorusGeometry(200, 20, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x0088ff, 
            transparent: true, 
            opacity: 0.8 
        });
        const centralRing = new THREE.Mesh(ringGeometry, ringMaterial);
        centralRing.position.set(0, 0, -3000); // Far away initially
        this.wormholeStructure.add(centralRing);
        
        // Infinity pool plane
        const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 32, 32);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x001144, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const poolPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        poolPlane.position.set(0, 0, -3000);
        poolPlane.rotation.x = -Math.PI / 2;
        this.wormholeStructure.add(poolPlane);
        
        this.scene.add(this.wormholeStructure);
    }

    createBlueStarField() {
        // Create flowing blue stars around the wormhole
        const starCount = 500;
        for (let i = 0; i < starCount; i++) {
            const star = new THREE.Mesh(
                new THREE.SphereGeometry(2, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0x0088ff })
            );
            
            // Random position around the wormhole
            const angle = Math.random() * Math.PI * 2;
            const distance = 500 + Math.random() * 1500;
            star.position.set(
                Math.cos(angle) * distance,
                (Math.random() - 0.5) * 200,
                -3000 + (Math.random() - 0.5) * 500
            );
            
            star.userData = { 
                angle: angle,
                distance: distance,
                flowSpeed: 0.5 + Math.random() * 1.0
            };
            
            this.blueStars.push(star);
            this.scene.add(star);
        }
    }

    createSpiralRibbon() {
        // Create the spiral ribbon road
        const { spiralTurns, ribbonWidth, cylinderRadius, cylinderHeight } = this.levelData;
        
        // Create spiral path points
        const spiralPoints = [];
        const segments = spiralTurns * 32; // 32 segments per turn
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * spiralTurns * Math.PI * 2;
            const y = -t * cylinderHeight; // Descend as we spiral
            
            const x = Math.cos(angle) * cylinderRadius;
            const z = Math.sin(angle) * cylinderRadius;
            
            spiralPoints.push(new THREE.Vector3(x, y, z));
        }
        
        // Create ribbon geometry along the spiral
        this.spiralRibbon = new THREE.Group();
        
        for (let i = 0; i < spiralPoints.length - 1; i++) {
            const point1 = spiralPoints[i];
            const point2 = spiralPoints[i + 1];
            
            // Create ribbon segment
            const segmentGeometry = new THREE.PlaneGeometry(ribbonWidth, point1.distanceTo(point2));
            const segmentMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff6600, // Orange road
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            });
            
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            
            // Position and orient segment
            segment.position.copy(point1).add(point2).multiplyScalar(0.5);
            segment.lookAt(point2);
            segment.rotateX(Math.PI / 2);
            
            this.spiralRibbon.add(segment);
        }
        
        this.scene.add(this.spiralRibbon);
        this.createObstacles();
    }

    createObstacles() {
        // Create blue obstacles on the ribbon
        const { obstacleCount, ribbonWidth, spiralTurns, cylinderRadius, cylinderHeight } = this.levelData;
        
        for (let i = 0; i < obstacleCount; i++) {
            const obstacle = new THREE.Mesh(
                new THREE.BoxGeometry(15, 15, 15),
                new THREE.MeshBasicMaterial({ color: 0x0088ff })
            );
            
            // Random position along spiral
            const t = Math.random();
            const angle = t * spiralTurns * Math.PI * 2;
            const y = -t * cylinderHeight;
            
            // Random position across ribbon width
            const ribbonOffset = (Math.random() - 0.5) * (ribbonWidth * 0.8); // Stay within ribbon
            
            const centerX = Math.cos(angle) * cylinderRadius;
            const centerZ = Math.sin(angle) * cylinderRadius;
            
            // Offset perpendicular to spiral direction
            const perpAngle = angle + Math.PI / 2;
            obstacle.position.set(
                centerX + Math.cos(perpAngle) * ribbonOffset,
                y + 10, // Slightly above ribbon
                centerZ + Math.sin(perpAngle) * ribbonOffset
            );
            
            this.obstacles.push(obstacle);
            this.scene.add(obstacle);
        }
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

    updateApproach(ship, camera, dt) {
        // Update flowing blue stars
        this.blueStars.forEach(star => {
            // Flow toward center
            star.userData.distance -= star.userData.flowSpeed * dt * 50;
            
            if (star.userData.distance < 50) {
                // Reset star to outer edge
                star.userData.distance = 500 + Math.random() * 1500;
            }
            
            star.position.set(
                Math.cos(star.userData.angle) * star.userData.distance,
                star.position.y,
                star.position.z
            );
        });
        
        // Check if ship is close enough to get trapped
        const distanceToWormhole = ship.position.distanceTo(new THREE.Vector3(0, 0, -3000));
        if (distanceToWormhole < 800) {
            this.phase = 'entrapment';
            this.entrappedTime = 0;
            console.log('🌀 Ship caught in wormhole gravity!');
            return { customControls: true }; // Disable player control
        }
        
        return { customControls: false };
    }

    updateEntrapment(ship, camera, dt) {
        this.entrappedTime += dt;
        
        // Pull ship toward wormhole center
        const wormholeCenter = new THREE.Vector3(0, 0, -3000);
        const direction = new THREE.Vector3().subVectors(wormholeCenter, ship.position).normalize();
        ship.position.add(direction.multiplyScalar(dt * 200));
        
        // Dramatic camera pullback
        const targetRadius = this.originalCameraRadius + (this.entrappedTime * 100);
        camera.position.sub(ship.position).normalize().multiplyScalar(targetRadius).add(ship.position);
        
        // After 30 seconds, transition to spiral
        if (this.entrappedTime >= 30) {
            this.phase = 'spiral';
            this.spiralProgress = 0;
            
            // Clean up wormhole visuals
            this.scene.remove(this.wormholeStructure);
            this.blueStars.forEach(star => this.scene.remove(star));
            
            // Create spiral ribbon
            this.createSpiralRibbon();
            
            // Position ship at top of spiral
            ship.position.set(this.levelData.cylinderRadius, 0, 0);
            ship.rotation.set(0, 0, 0); // Reset ship rotation
            
            console.log('🎢 Beginning spiral descent!');
            return { customControls: false, fadeToBlack: true }; // Brief fade transition
        }
        
        return { customControls: true };
    }

    updateSpiral(ship, camera, dt) {
        // Ship is constrained to spiral ribbon
        const { spiralTurns, cylinderRadius, cylinderHeight, ribbonWidth } = this.levelData;
        
        // Calculate current position on spiral based on ship's angle
        const currentAngle = Math.atan2(ship.position.z, ship.position.x);
        const spiralT = (currentAngle + Math.PI) / (spiralTurns * Math.PI * 2);
        
        // Keep ship on spiral height
        const targetY = -spiralT * cylinderHeight;
        ship.position.y = targetY;
        
        // Check if ship fell off ribbon edge
        const distanceFromCenter = Math.sqrt(ship.position.x ** 2 + ship.position.z ** 2);
        const ribbonRadius = cylinderRadius;
        const ribbonHalfWidth = ribbonWidth / 2;
        
        // Simple edge detection - if too far from spiral center line
        if (Math.abs(distanceFromCenter - ribbonRadius) > ribbonHalfWidth) {
            this.phase = 'death';
            this.isDying = true;
            this.deathTime = 0;
            console.log('💀 Ship fell off the ribbon road!');
            return { customControls: true }; // Disable controls during death
        }
        
        // Check obstacle collisions
        this.checkObstacleCollisions(ship);
        
        // Update spiral progress
        this.spiralProgress = Math.max(0, Math.min(1, -ship.position.y / cylinderHeight));
        
        // Check if reached bottom
        if (this.spiralProgress >= 0.95) {
            console.log('🏁 Spiral descent complete!');
            return { levelComplete: true };
        }
        
        return { customControls: false };
    }

    updateDeath(ship, camera, dt) {
        this.deathTime += dt;
        
        // Ship drifts away from ribbon
        const driftDirection = new THREE.Vector3().subVectors(ship.position, new THREE.Vector3(0, ship.position.y, 0)).normalize();
        ship.position.add(driftDirection.multiplyScalar(dt * 50));
        
        // Fade to black over 3 seconds
        const fadeProgress = Math.min(1, this.deathTime / 3);
        
        if (this.deathTime >= 3) {
            // Respawn at top of spiral
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
            if (distance < 25) { // Collision threshold
                // Shake effect and slight delay
                console.log('💥 Hit obstacle!');
                // Could add shake effect here
            }
        });
    }

    cleanup(scene) {
        // Clean up all level objects
        if (this.spiralRibbon) scene.remove(this.spiralRibbon);
        if (this.wormholeStructure) scene.remove(this.wormholeStructure);
        
        this.obstacles.forEach(obs => scene.remove(obs));
        this.blueStars.forEach(star => scene.remove(star));
        
        this.obstacles = [];
        this.blueStars = [];
    }
}