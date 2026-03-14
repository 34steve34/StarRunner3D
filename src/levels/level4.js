// Level 4: Wormhole Spiral - Reverse Infinity Pool with Circular Waterfall
import * as THREE from 'three';

export class WormholeSpiral {
    constructor() {
        this.phase = 'approach'; // approach, entrapment, spiral, death
        this.spiralRibbon = null;
        this.spiralCurve = null; // Store the curve for accurate positioning
        this.obstacles = [];
        this.blueStars = [];
        this.wormholeStructure = null;
        this.cylinder = null;
        this.plane = null;
        this.centralRing = null;
        this.entrappedTime = 0;
        this.spiralProgress = 0; // 0 to 1 along the curve
        this.isDying = false;
        this.deathTime = 0;
        this.fadeToBlack = 0;
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
            
            // Ship starts looking into blank space from 45 degree angle
            ship.position.set(-1000, 500, 500); // 45 degree approach angle
            ship.visible = true;
            ship.rotation.set(0, 0, 0);
            ship.rotateY(Math.PI * 0.75); // Face toward wormhole at angle
            
            console.log('Ship spawned at:', ship.position);
            
            // Create the wormhole structure far away
            this.createWormholeStructure();
            
            // Create blue stars on the plane
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
        
        // Large horizontal plane - the infinity pool surface
        const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 32, 32);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x001a4d,
            transparent: true, 
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.position.set(0, 0, -2000);
        this.wormholeStructure.add(this.plane);
        
        // Large central ring - the drain (using RingGeometry for guaranteed 360°)
        const ringGeometry = new THREE.RingGeometry(170, 230, 64); // inner radius, outer radius, segments
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x0088ff,
            transparent: true, 
            opacity: 1.0,
            emissive: 0x0088ff,
            emissiveIntensity: 0.8,
            side: THREE.DoubleSide
        });
        this.centralRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.centralRing.position.set(0, 0, -2000);
        // RingGeometry is already flat in XY plane, no rotation needed for horizontal
        this.wormholeStructure.add(this.centralRing);
        
        // Cylinder - the waterfall
        const cylinderGeometry = new THREE.CylinderGeometry(200, 200, 1000, 32, 1, true);
        const cylinderMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x0044aa,
            transparent: true, 
            opacity: 0.3,
            side: THREE.BackSide,
            emissive: 0x0044aa,
            emissiveIntensity: 0.4
        });
        this.cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        this.cylinder.position.set(0, -500, -2000); // Extends downward
        this.wormholeStructure.add(this.cylinder);
        
        // Bright lights to create glow
        const light1 = new THREE.PointLight(0x0088ff, 2000, 1000);
        light1.position.set(0, 0, -2000);
        this.wormholeStructure.add(light1);
        
        const light2 = new THREE.PointLight(0x0044aa, 1500, 800);
        light2.position.set(0, -500, -2000);
        this.wormholeStructure.add(light2);
        
        console.log('Wormhole structure created at z=-2000');
        this.scene.add(this.wormholeStructure);
    }

    createBlueStarField() {
        const starCount = 300;
        const planeZ = -2000;
        const planeSize = 1000;
        
        for (let i = 0; i < starCount; i++) {
            const star = new THREE.Mesh(
                new THREE.SphereGeometry(3, 8, 8),
                new THREE.MeshBasicMaterial({ 
                    color: 0x0088ff,
                    emissive: 0x0088ff,
                    emissiveIntensity: 0.6
                })
            );
            
            // Random position on the plane surface
            const x = (Math.random() - 0.5) * planeSize;
            const y = 0; // On the plane
            const z = planeZ + (Math.random() - 0.5) * 100; // Slight z variation
            
            star.position.set(x, y, z);
            
            // Calculate distance from center for flow direction
            const distFromCenter = Math.sqrt(x * x);
            
            star.userData = { 
                startX: x,
                startY: y,
                startZ: z,
                distFromCenter: distFromCenter,
                flowSpeed: 1.0 + Math.random() * 1.5, // Speed toward center
                fallSpeed: 2.0 + Math.random() * 2.0, // Speed downward
                phase: 'flowing' // flowing or falling
            };
            
            this.blueStars.push(star);
            this.scene.add(star);
        }
        console.log('Created', starCount, 'blue stars on plane');
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
        // Update blue stars - flow toward center ring, then fall through cylinder
        this.blueStars.forEach(star => {
            if (star.userData.phase === 'flowing') {
                // Flow inward toward center
                const centerX = 0;
                const centerY = 0;
                const currentX = star.position.x;
                const currentY = star.position.y;
                
                const distToCenter = Math.sqrt(currentX * currentX + currentY * currentY);
                
                if (distToCenter > 50) {
                    // Move toward center
                    const dirX = -currentX / distToCenter;
                    const dirY = -currentY / distToCenter;
                    
                    star.position.x += dirX * star.userData.flowSpeed * dt * 100;
                    star.position.y += dirY * star.userData.flowSpeed * dt * 100;
                } else {
                    // Reached center - start falling
                    star.userData.phase = 'falling';
                }
            } else if (star.userData.phase === 'falling') {
                // Fall downward through cylinder
                star.position.y -= star.userData.fallSpeed * dt * 100;
                
                // Reset if fallen too far
                if (star.position.y < -1000) {
                    star.position.set(star.userData.startX, star.userData.startY, star.userData.startZ);
                    star.userData.phase = 'flowing';
                }
            }
        });
        
        // Check if ship reached the plane
        const distanceToPlane = Math.abs(ship.position.z - (-2000));
        const distanceToCenter = Math.sqrt(ship.position.x * ship.position.x + ship.position.y * ship.position.y);
        
        console.log('Distance to plane:', distanceToPlane.toFixed(0), 'Distance to center:', distanceToCenter.toFixed(0));
        
        if (distanceToPlane < 500 && distanceToCenter < 600) {
            this.phase = 'entrapment';
            this.entrappedTime = 0;
            console.log('🌀 Ship reached the wormhole plane!');
            return { customControls: true };
        }
        
        return { customControls: false };
    }

    updateEntrapment(ship, camera, dt) {
        this.entrappedTime += dt;
        console.log('Entrapment time:', this.entrappedTime.toFixed(1), '/ 15 seconds');
        
        // OVERRIDE: Force ship movement regardless of player input
        // Pull ship toward center of plane
        const planeCenter = new THREE.Vector3(0, 0, -2000);
        const direction = new THREE.Vector3().subVectors(planeCenter, ship.position).normalize();
        
        // First phase: pull toward center on plane
        if (this.entrappedTime < 7) {
            ship.position.add(direction.multiplyScalar(dt * 150));
        } else {
            // Second phase: pull downward through cylinder
            const downwardPull = new THREE.Vector3(0, -1, 0);
            ship.position.add(downwardPull.multiplyScalar(dt * 200));
            
            // Also keep pulling toward center
            const horizontalDir = new THREE.Vector3(ship.position.x, ship.position.y, 0).normalize().multiplyScalar(-1);
            ship.position.add(horizontalDir.multiplyScalar(dt * 100));
        }
        
        // Dramatic camera effects
        if (Math.random() < 0.4) {
            camera.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 5
            ));
        }
        
        // Rotate ship to show the descent
        ship.rotateX(dt * 0.5);
        ship.rotateZ(dt * 0.3);
        
        // After 15 seconds, transition to spiral with fade
        if (this.entrappedTime >= 15) {
            console.log('Entrapment complete - fading to black');
            this.phase = 'spiral';
            this.spiralProgress = 0;
            this.fadeToBlack = 0;
            
            // Clean up wormhole
            this.scene.remove(this.wormholeStructure);
            this.blueStars.forEach(star => this.scene.remove(star));
            this.blueStars = [];
            
            // Create spiral ribbon
            this.createSpiralRibbon();
            
            // Position ship ON the spiral ribbon using the curve
            this.spiralProgress = 0.01; // Start just after beginning (avoid curve edge issues)
            
            const shipPos = this.spiralCurve.getPointAt(this.spiralProgress);
            const tangent = this.spiralCurve.getTangentAt(this.spiralProgress).normalize();
            
            // Position ship slightly above the ribbon surface
            ship.position.copy(shipPos);
            ship.position.y += 5; // Lift ship 5 units above ribbon
            
            // Orient ship to face along the tangent (down the spiral)
            // Calculate rotation from tangent vector
            const forward = tangent;
            const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
            const up = new THREE.Vector3().crossVectors(forward, right).normalize();
            
            // Create rotation matrix from forward/up/right vectors
            const matrix = new THREE.Matrix4();
            matrix.makeBasis(right, up, forward);
            
            ship.quaternion.setFromRotationMatrix(matrix);
            
            console.log('🎢 Ship on spiral at:', ship.position, 'tangent:', tangent);
            return { customControls: false, fadeToBlack: true };
        }
        
        return { customControls: true, disableThrust: true }; // Disable thrust during star-fall
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
        
        // Create curve for accurate ship positioning
        this.spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
        this.spiralCurve.curveType = 'catmullrom';
        this.spiralCurve.tension = 0.5;
        
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
        const { ribbonWidth } = this.levelData;
        
        // Find closest point on curve to ship's current position
        // This allows player to move the ship, and we track their progress
        let closestT = this.spiralProgress;
        let closestDist = Infinity;
        
        // Search nearby curve positions (within ±0.1 of current progress)
        const searchStart = Math.max(0, this.spiralProgress - 0.05);
        const searchEnd = Math.min(1, this.spiralProgress + 0.15);
        const searchSteps = 20;
        
        for (let i = 0; i <= searchSteps; i++) {
            const t = searchStart + (searchEnd - searchStart) * (i / searchSteps);
            const curvePoint = this.spiralCurve.getPointAt(t);
            const dist = ship.position.distanceTo(curvePoint);
            
            if (dist < closestDist) {
                closestDist = dist;
                closestT = t;
            }
        }
        
        // Update progress (only allow forward movement)
        this.spiralProgress = Math.max(this.spiralProgress, closestT);
        
        // Get curve data at current progress
        const curvePoint = this.spiralCurve.getPointAt(this.spiralProgress);
        const tangent = this.spiralCurve.getTangentAt(this.spiralProgress).normalize();
        
        // Gently pull ship toward the ribbon surface (not forced, just guided)
        const targetPos = curvePoint.clone();
        targetPos.y += 5; // 5 units above ribbon
        
        // Lerp ship position toward target (allows player control but prevents drifting too far)
        ship.position.lerp(targetPos, 0.05);
        
        // Orient ship to face along the tangent (down the spiral)
        const forward = tangent;
        const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
        const up = new THREE.Vector3().crossVectors(forward, right).normalize();
        
        // Create target rotation from forward/up/right vectors
        const matrix = new THREE.Matrix4();
        matrix.makeBasis(right, up, forward);
        const targetQuat = new THREE.Quaternion().setFromRotationMatrix(matrix);
        
        // Slerp ship rotation toward target (allows player roll control)
        ship.quaternion.slerp(targetQuat, 0.1);
        
        // Check if ship fell off ribbon edge (horizontal distance from curve)
        const horizontalDist = Math.sqrt(
            (ship.position.x - curvePoint.x) ** 2 + 
            (ship.position.z - curvePoint.z) ** 2
        );
        
        if (horizontalDist > ribbonWidth / 2) {
            this.phase = 'death';
            this.isDying = true;
            this.deathTime = 0;
            console.log('💀 Ship fell off the ribbon road!');
            return { customControls: true };
        }
        
        this.checkObstacleCollisions(ship);
        
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
            ship.rotation.set(0, 0, 0);
            ship.rotateY(Math.PI);
            ship.rotateX(Math.PI / 2);
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
