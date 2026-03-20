// Level 4: Wormhole Spiral - Reverse Infinity Pool with Circular Waterfall
import * as THREE from 'three';

export class WormholeSpiral {
    constructor() {
        this.phase = 'approach'; // approach, entrapment, spiral, death
        this.spiralRibbon = null;
        this.spiralCurve = null;
        this.obstacles = [];
        this.blueStars = [];
        this.wormholeStructure = null;
        this.cylinder = null;
        this.plane = null;
        this.centralRing = null;
        this.entrappedTime = 0;
        this.spiralProgress = 0; // 0 to 1 along the curve
        this.forwardVelocity = 0; // current forward speed with inertia
        this.lateralOffset = 0;  // current lateral position on ribbon (units from center)
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

    update(ship, camera, dt, tiltAngle = 0, thrustValue = 0) {
        if (this.phase === 'approach') {
            return this.updateApproach(ship, camera, dt);
        } else if (this.phase === 'entrapment') {
            return this.updateEntrapment(ship, camera, dt);
        } else if (this.phase === 'spiral') {
            return this.updateSpiral(ship, camera, dt, tiltAngle, thrustValue);
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

            this.spiralProgress = 0.01;
            this.forwardVelocity = 0;
            this.lateralOffset = 0;

            const shipPos = this.spiralCurve.getPointAt(this.spiralProgress);
            const tangent = this.spiralCurve.getTangentAt(this.spiralProgress).normalize();
            const worldUp = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
            const up = new THREE.Vector3().crossVectors(tangent, right).normalize();

            ship.position.copy(shipPos).addScaledVector(up, 1);

            const matrix = new THREE.Matrix4();
            matrix.makeBasis(right, up, tangent);
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

            // Keep first 15% of spiral clear so camera isn't blocked at start
            const t = 0.15 + Math.random() * 0.85;
            const angle = t * spiralTurns * Math.PI * 2;
            const y = -t * cylinderHeight;

            const ribbonOffset = (Math.random() - 0.5) * (ribbonWidth * 0.7);

            const centerX = Math.cos(angle) * cylinderRadius;
            const centerZ = Math.sin(angle) * cylinderRadius;

            const perpAngle = angle + Math.PI / 2;
            obstacle.position.set(
                centerX + Math.cos(perpAngle) * ribbonOffset,
                y + 2,
                centerZ + Math.sin(perpAngle) * ribbonOffset
            );

            this.obstacles.push(obstacle);
            this.scene.add(obstacle);
        }
    }

    updateSpiral(ship, _camera, dt, tiltAngle, thrustValue) {
        const { ribbonWidth } = this.levelData;

        // --- Forward speed with inertia ---
        const BASE_SPEED  = 60;   // units/sec always moving
        const BOOST_SPEED = 160;  // additional units/sec at full thrust
        const targetSpeed = BASE_SPEED + thrustValue * BOOST_SPEED;
        // Lerp toward target: accelerate quickly, decelerate with inertia
        const lerpRate = thrustValue > 0 ? 4.0 : 1.5; // faster accel than decel
        this.forwardVelocity += (targetSpeed - this.forwardVelocity) * Math.min(lerpRate * dt, 1.0);

        // --- Advance progress along curve ---
        // Convert forward velocity to curve parameter advance
        const curveLength = this.spiralCurve.getLength();
        this.spiralProgress = Math.min(1, this.spiralProgress + (this.forwardVelocity * dt) / curveLength);

        // --- Ribbon frame at current progress ---
        const curvePoint = this.spiralCurve.getPointAt(this.spiralProgress);
        const tangent = this.spiralCurve.getTangentAt(this.spiralProgress).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const ribbonRight = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
        const ribbonUp = new THREE.Vector3().crossVectors(tangent, ribbonRight).normalize();

        // --- Lateral steering from tilt (no auto-centering) ---
        const DEADZONE   = 2.0;  // degrees
        const MAX_TILT   = 35.0; // degrees = full lateral speed
        const LATERAL_SPEED = 180; // units/sec at full tilt
        let normalizedTilt = 0;
        if (Math.abs(tiltAngle) > DEADZONE) {
            normalizedTilt = Math.sign(tiltAngle) * Math.min(Math.abs(tiltAngle) / MAX_TILT, 1.0);
        }
        this.lateralOffset += normalizedTilt * LATERAL_SPEED * dt;
        // Clamp so we can detect fall-off cleanly
        this.lateralOffset = Math.max(-ribbonWidth / 2, Math.min(ribbonWidth / 2, this.lateralOffset));

        // --- Place ship on ribbon surface ---
        ship.position.copy(curvePoint)
            .addScaledVector(ribbonRight, this.lateralOffset)
            .addScaledVector(ribbonUp, 1); // 1 unit clearance so ship sits on surface

        // --- Lock orientation: face down tangent, bank on tilt ---
        const bankAngle = -normalizedTilt * 0.5; // max ~30° visual bank
        const matrix = new THREE.Matrix4().makeBasis(ribbonRight, ribbonUp, tangent);
        const baseQuat = new THREE.Quaternion().setFromRotationMatrix(matrix);
        const bankQuat = new THREE.Quaternion().setFromAxisAngle(tangent, bankAngle);
        ship.quaternion.copy(baseQuat).multiply(bankQuat);

        // --- Fall-off check ---
        if (Math.abs(this.lateralOffset) >= ribbonWidth / 2) {
            this.phase = 'death';
            this.isDying = true;
            this.deathTime = 0;
            console.log('💀 Ship fell off the ribbon road!');
            return { customControls: true };
        }

        // --- Obstacle collision → death ---
        if (this.checkObstacleCollisions(ship)) {
            this.phase = 'death';
            this.isDying = true;
            this.deathTime = 0;
            console.log('� Hit obstacle - death!');
            return { customControls: true };
        }

        if (this.spiralProgress >= 0.95) {
            console.log('🏁 Spiral descent complete!');
            return { levelComplete: true };
        }

        return { customControls: true };
    }

    updateDeath(ship, _camera, dt) {
        this.deathTime += dt;

        // Drift ship outward from spiral axis — guard against zero vector at center
        const axisPoint = new THREE.Vector3(0, ship.position.y, 0);
        const driftDir = new THREE.Vector3().subVectors(ship.position, axisPoint);
        if (driftDir.lengthSq() > 0.001) {
            ship.position.addScaledVector(driftDir.normalize(), dt * 50);
        }

        const fadeProgress = Math.min(1, this.deathTime / 3);

        if (this.deathTime >= 3) {
            this.spiralProgress = 0.01;
            this.forwardVelocity = 0;
            this.lateralOffset = 0;

            const curvePoint = this.spiralCurve.getPointAt(this.spiralProgress);
            const tangent = this.spiralCurve.getTangentAt(this.spiralProgress).normalize();
            const worldUp = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
            const up = new THREE.Vector3().crossVectors(tangent, right).normalize();

            // Place ship exactly on ribbon surface at center, matching updateSpiral logic
            ship.position.copy(curvePoint).addScaledVector(up, 1);

            const matrix = new THREE.Matrix4().makeBasis(right, up, tangent);
            ship.quaternion.setFromRotationMatrix(matrix);

            this.phase = 'spiral';
            this.isDying = false;
            this.deathTime = 0;
            console.log('🔄 Respawning at top of spiral...');
        }

        return { customControls: true, fadeToBlack: fadeProgress };
    }

    checkObstacleCollisions(ship) {
        for (const obstacle of this.obstacles) {
            if (ship.position.distanceTo(obstacle.position) < 20) {
                return true; // hit
            }
        }
        return false;
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
