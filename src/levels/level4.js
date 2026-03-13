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
            
            // Validate ship exists
            if (!ship) {
                console.error('Level 4 spawn failed: ship is null or undefined');
                return {
                    phase: 'approach',
                    customControls: false,
                    error: 'Ship not loaded'
                };
            }
            
            console.log('🌀 Level 4: Wormhole Spiral - Beginning cosmic journey...');
            console.log('Ship position at spawn:', ship.position);
            console.log('Ship visible:', ship.visible);
            
            // Position ship for Level 4 approach phase
            ship.position.set(0, 0, -100); // Start position
            ship.visible = true; // Ensure ship is visible
            ship.rotation.set(0, 0, 0); // Reset rotation
            ship.rotateY(Math.PI); // Face forward (ship model faces backward by default)
            
            console.log('Ship positioned at:', ship.position.x, ship.position.y, ship.position.z);
            console.log('Ship visible set to:', ship.visible);
            
            // Store original camera radius for later use
            this.originalCameraRadius = CONFIG.CAMERA_RADIUS || 80;
            
            // Start with approach phase - ship stays in its current position
            this.createWormholeStructure();
            this.createBlueStarField();
            
            console.log('Level 4 spawn completed successfully');
            console.log('Ship final position:', ship.position);
            console.log('Ship final visibility:', ship.visible);
            console.log('Wormhole structure created:', !!this.wormholeStructure);
            console.log('Blue stars created:', this.blueStars.length);
            
            return {
                phase: this.phase,
                customControls: false // Normal controls during approach
            };
        } catch (error) {
            console.error('Error in Level 4 spawn:', error);
            // Return safe defaults if spawn fails
            return {
                phase: 'approach',
                customControls: false,
                error: error.message
            };
        }
    }

    createWormholeStructure() {
        // Create the distant blue infinity pool structure
        this.wormholeStructure = new THREE.Group();
        
        // Central ring (the drain) - bigger and closer
        const ringGeometry = new THREE.TorusGeometry(150, 25, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00aaff, 
            transparent: true, 
            opacity: 1.0
        });
        const centralRing = new THREE.Mesh(ringGeometry, ringMaterial);
        centralRing.position.set(0, 0, -300); // Even closer
        this.wormholeStructure.add(centralRing);
        
        // Add a bright light to make it visible
        const ringLight = new THREE.PointLight(0x00aaff, 3000, 800);
        ringLight.position.set(0, 0, -300);
        this.wormholeStructure.add(ringLight);
        
        // Infinity pool plane - bigger and more dramatic
        const planeGeometry = new THREE.PlaneGeometry(800, 800, 16, 16);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x003388, 
            transparent: true, 
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const poolPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        poolPlane.position.set(0, 0, -300);
        poolPlane.rotation.x = -Math.PI / 2;
        this.wormholeStructure.add(poolPlane);
        
        console.log('Wormhole structure created at z=-300');
        
        this.scene.add(this.wormholeStructure);
    }

    createBlueStarField() {
        // Create flowing blue stars properly aligned around the wormhole
        const starCount = 300; // Fewer but more visible
        const wormholeZ = -300; // Match wormhole position
        
        for (let i = 0; i < starCount; i++) {
            const star = new THREE.Mesh(
                new THREE.SphereGeometry(3, 8, 8), // Bigger stars
                new THREE.MeshBasicMaterial({ color: 0x0088ff })
            );
            
            // Position stars in a cylinder around the wormhole
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 400; // 200-600 units from center
            const height = (Math.random() - 0.5) * 300; // ±150 units vertically
            
            star.position.set(
                Math.cos(angle) * distance,
                height,
                wormholeZ + (Math.random() - 0.5) * 200 // ±100 units around wormhole Z
            );
            
            star.userData = { 
                angle: angle,
                distance: distance,
                originalZ: star.position.z,
                flowSpeed: 0.3 + Math.random() * 0.7
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
        console.log('Level 4 update called, phase:', this.phase);
        console.log('Ship position in update:', ship.position.x, ship.position.y, ship.position.z);
        console.log('Ship visible in update:', ship.visible);
        
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
        // Update flowing blue stars - flow toward wormhole center
        this.blueStars.forEach(star => {
            // Flow inward toward wormhole
            star.userData.distance -= star.userData.flowSpeed * dt * 30;
            
            if (star.userData.distance < 100) {
                // Reset star to outer edge
                star.userData.distance = 200 + Math.random() * 400;
            }
            
            // Update position
            star.position.set(
                Math.cos(star.userData.angle) * star.userData.distance,
                star.position.y,
                star.userData.originalZ
            );
        });
        
        // Check if ship is close enough to get trapped
        const distanceToWormhole = ship.position.distanceTo(new THREE.Vector3(0, 0, -300));
        if (distanceToWormhole < 250) {
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
        const wormholeCenter = new THREE.Vector3(0, 0, -300);
        const direction = new THREE.Vector3().subVectors(wormholeCenter, ship.position).normalize();
        ship.position.add(direction.multiplyScalar(dt * 150));
        
        // DON'T zoom camera out - keep it close for drama
        // Just add some gentle shake instead
        if (Math.random() < 0.3) {
            camera.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 2
            ));
        }
        
        // Shorter entrapment time - 5 seconds instead of 30
        if (this.entrappedTime >= 5) {
            this.phase = 'spiral';
            this.spiralProgress = 0;
            
            // Clean up wormhole visuals
            this.scene.remove(this.wormholeStructure);
            this.blueStars.forEach(star => this.scene.remove(star));
            this.blueStars = [];
            
            // Create spiral ribbon
            this.createSpiralRibbon();
            
            // Position ship properly at START of spiral
            ship.position.set(this.levelData.cylinderRadius, 50, 0); // Elevated above spiral
            ship.rotation.set(0, 0, 0); // Reset ship rotation
            ship.rotateY(Math.PI); // Face forward
            
            console.log('🎢 Beginning spiral descent!');
            console.log('Ship positioned at spiral start:', ship.position);
            return { customControls: false }; // Re-enable controls
        }
        
        return { customControls: true };
    }

    updateSpiral(ship, _camera, _dt) {
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

    updateDeath(ship, _camera, dt) {
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