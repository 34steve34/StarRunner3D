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
        this.respawnGrace = 0;   // frames to suppress lateral input after respawn
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
            this.phase = 'spiral';
            this.spiralProgress = 0;
            this.fadeToBlack = 0;
            
            // Clean up wormhole
            this.scene.remove(this.wormholeStructure);
            this.blueStars.forEach(star => this.scene.remove(star));
            this.blueStars = [];
            
            // Create spiral ribbon
            this.createSpiralRibbon();
			// This ensures they are only created ONCE when the level starts, 
	        // not every time the player respawns.
            
            // ADDED MISSING BRACKET HERE
            if (this.obstacles.length === 0) {
                this.createObstacles();
            }

            this.spiralProgress = 0.01;
            this.forwardVelocity = 0;
            this.lateralOffset = 0;
            this.respawnGrace = 120; // Set to 2 seconds

            const shipPos = this.spiralCurve.getPointAt(this.spiralProgress);
            const tangent = this.spiralCurve.getTangentAt(this.spiralProgress).normalize();
            const worldUp = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
            const up = new THREE.Vector3().crossVectors(tangent, right).normalize();

            ship.position.copy(shipPos).addScaledVector(up, 1);

            const matrix = new THREE.Matrix4();
            matrix.makeBasis(right, up, tangent);
            ship.quaternion.setFromRotationMatrix(matrix);
            
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
        
        // Create continuous flat ribbon geometry
        const ribbonGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const uvs = [];
        const indices = [];
        
        const worldUp = new THREE.Vector3(0, 1, 0);
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const curvePoint = this.spiralCurve.getPointAt(t);
            const tangent = this.spiralCurve.getTangentAt(t).normalize();
            
            // Calculate ribbon edge positions
            const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
            
            const leftEdge = curvePoint.clone().addScaledVector(right, -ribbonWidth / 2);
            const rightEdge = curvePoint.clone().addScaledVector(right, ribbonWidth / 2);
            
            // Add vertices (left, then right)
            vertices.push(leftEdge.x, leftEdge.y, leftEdge.z);
            vertices.push(rightEdge.x, rightEdge.y, rightEdge.z);
            
            // UV coordinates
            uvs.push(t, 0);
            uvs.push(t, 1);
            
            // Create triangles
            if (i < segments) {
                const base = i * 2;
                // First triangle
                indices.push(base, base + 1, base + 2);
                // Second triangle
                indices.push(base + 1, base + 3, base + 2);
            }
        }
        
        ribbonGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        ribbonGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        ribbonGeometry.setIndex(indices);
        ribbonGeometry.computeVertexNormals();
        
        // Create main orange material
        const mainMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff6600,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
            depthWrite: false
        });
        
        this.spiralRibbon = new THREE.Mesh(ribbonGeometry, mainMaterial);
        this.scene.add(this.spiralRibbon);
        
        // Add finish zone overlay (90-95% of the ribbon)
        this.createFinishZone(0.90, 0.95);
        this.createFinishLine();
    }

    createFinishZone(startT, endT) {
        const { ribbonWidth } = this.levelData;
        const segments = 16;
        const worldUp = new THREE.Vector3(0, 1, 0);
        
        const finishGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const uvs = [];
        const indices = [];
        
        for (let i = 0; i <= segments; i++) {
            const t = startT + (endT - startT) * (i / segments);
            const curvePoint = this.spiralCurve.getPointAt(t);
            const tangent = this.spiralCurve.getTangentAt(t).normalize();
            
            const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
            
            const leftEdge = curvePoint.clone().addScaledVector(right, -ribbonWidth / 2);
            const rightEdge = curvePoint.clone().addScaledVector(right, ribbonWidth / 2);
            
            vertices.push(leftEdge.x, leftEdge.y, leftEdge.z);
            vertices.push(rightEdge.x, rightEdge.y, rightEdge.z);
            
            uvs.push(t * 10, 0);
            uvs.push(t * 10, 1);
            
            if (i < segments) {
                const base = i * 2;
                indices.push(base, base + 1, base + 2);
                indices.push(base + 1, base + 3, base + 2);
            }
        }
        
        finishGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        finishGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        finishGeometry.setIndex(indices);
        finishGeometry.computeVertexNormals();
        
        // Create checkered texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const tileSize = 16;
        for (let y = 0; y < 64; y += tileSize) {
            for (let x = 0; x < 64; x += tileSize) {
                ctx.fillStyle = ((x + y) / tileSize) % 2 === 0 ? '#ffffff' : '#cccccc';
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
        
        const checkeredTexture = new THREE.CanvasTexture(canvas);
        checkeredTexture.wrapS = THREE.RepeatWrapping;
        checkeredTexture.wrapT = THREE.RepeatWrapping;
        
        const finishMaterial = new THREE.MeshBasicMaterial({ 
            map: checkeredTexture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
            depthWrite: false
        });
        
        const finishZone = new THREE.Mesh(finishGeometry, finishMaterial);
        this.scene.add(finishZone);
    }

   createFinishLine() {
        const finishProgress = 0.95;
        const curvePoint = this.spiralCurve.getPointAt(finishProgress);
        const tangent = this.spiralCurve.getTangentAt(finishProgress).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const ribbonRight = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
        const ribbonUp = new THREE.Vector3().crossVectors(tangent, ribbonRight).normalize();

        // 1. Create a Canvas to draw the text
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1024; // High resolution
        canvas.height = 256;

        // Background (Optional: semi-transparent blue)
        ctx.fillStyle = 'rgba(0, 136, 255, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Text Styling
        ctx.font = 'Bold 120px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw the text
        ctx.fillText('FINISH LINE', canvas.width / 2, canvas.height / 2);

        // 2. Create Texture from Canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // 3. Create the Banner Mesh
        const bannerGeometry = new THREE.PlaneGeometry(200, 50);
        const bannerMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
        
        // Position it above the track
        banner.position.copy(curvePoint).addScaledVector(ribbonUp, 30);

        // Orient the banner to face the player (flip 180 degrees)
        // We negate the tangent (Z) and right (X) vectors to turn it around
        const reverseTangent = tangent.clone().multiplyScalar(-1);
        const reverseRight = ribbonRight.clone().multiplyScalar(-1);
        
        const bannerMatrix = new THREE.Matrix4().makeBasis(reverseRight, ribbonUp, reverseTangent);
        banner.quaternion.setFromRotationMatrix(bannerMatrix);

        this.scene.add(banner);

        // 4. Optional: Add "Glow" markers
        for (let i = -1; i <= 1; i += 2) {
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(8, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0x00ffff })
            );
            marker.position.copy(curvePoint)
                .addScaledVector(ribbonRight, i * 100)
                .addScaledVector(ribbonUp, 5);
            this.scene.add(marker);
        }
    }

    createObstacles() {
        const { obstacleCount, ribbonWidth, spiralTurns, cylinderRadius, cylinderHeight } = this.levelData;
        
        for (const obstacle of this.obstacles) {
            this.scene.remove(obstacle);
        }
        this.obstacles = [];
        
        const worldUp = new THREE.Vector3(0, 1, 0);
        
        const sineWaveCount = Math.floor(obstacleCount * 0.4);
        for (let i = 0; i < sineWaveCount; i++) {
            const t = 0.15 + (i / sineWaveCount) * 0.80;
            const sineValue = Math.sin(t * spiralTurns * Math.PI * 2 * 3); 
            const lateralOffset = sineValue * (ribbonWidth * 0.35);
            this.placeObstacleAt(t, lateralOffset);
        }
        
        const laneBlockerCount = Math.floor(obstacleCount * 0.3);
        for (let i = 0; i < laneBlockerCount; i++) {
            const t = 0.18 + (i / laneBlockerCount) * 0.75;
            const side = i % 2 === 0 ? -1 : 1;
            const lateralOffset = side * (ribbonWidth * 0.30);
            this.placeObstacleAt(t, lateralOffset);
        }
        
        const centerCount = Math.floor(obstacleCount * 0.15);
        for (let i = 0; i < centerCount; i++) {
            const t = 0.20 + (i / centerCount) * 0.70;
            const lateralOffset = (Math.random() - 0.5) * (ribbonWidth * 0.2); 
            this.placeObstacleAt(t, lateralOffset);
        }
        
        const edgeCount = Math.floor(obstacleCount * 0.15);
        for (let i = 0; i < edgeCount; i++) {
            const t = 0.22 + (i / edgeCount) * 0.68;
            const edgeSide = Math.random() > 0.5 ? -1 : 1;
            const lateralOffset = edgeSide * (ribbonWidth * 0.38);
            this.placeObstacleAt(t, lateralOffset);
        }
        
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!this.isRibbonTraversable() && attempts < maxAttempts) {
            attempts++;
            
            for (const obstacle of this.obstacles) {
                this.scene.remove(obstacle);
            }
            this.obstacles = [];
            
            for (let i = 0; i < sineWaveCount; i++) {
                const t = 0.15 + (i / sineWaveCount) * 0.80;
                const sineValue = Math.sin(t * spiralTurns * Math.PI * 2 * 3 + Math.random() * 0.5);
                const lateralOffset = sineValue * (ribbonWidth * 0.35);
                this.placeObstacleAt(t, lateralOffset);
            }
            
            for (let i = 0; i < laneBlockerCount; i++) {
                const t = 0.18 + (i / laneBlockerCount) * 0.75;
                const side = i % 2 === 0 ? -1 : 1;
                const lateralOffset = side * (ribbonWidth * 0.30);
                this.placeObstacleAt(t, lateralOffset);
            }
            
            for (let i = 0; i < centerCount; i++) {
                const t = 0.20 + (i / centerCount) * 0.70;
                const lateralOffset = (Math.random() - 0.5) * (ribbonWidth * 0.2);
                this.placeObstacleAt(t, lateralOffset);
            }
            
            for (let i = 0; i < edgeCount; i++) {
                const t = 0.22 + (i / edgeCount) * 0.68;
                const edgeSide = Math.random() > 0.5 ? -1 : 1;
                const lateralOffset = edgeSide * (ribbonWidth * 0.38);
                this.placeObstacleAt(t, lateralOffset);
            }
        }
    }

    isRibbonTraversable() {
        const samples = 150;
        const { ribbonWidth } = this.levelData;
        const maxOffset = ribbonWidth / 2 - 15;
        const curveLength = this.spiralCurve.getLength();
        
        let reachableMin = -10;
        let reachableMax = 10;
        
        for (let i = 0; i < samples; i++) {
            const t = i / samples;
            const timeInSlice = (curveLength / samples) / 80;
            const maxLateralMove = 180 * timeInSlice;
            
            let foundGap = false;
            let newMin = Infinity, newMax = -Infinity;

            for (let offset = -maxOffset; offset <= maxOffset; offset += 10) {
                if (!this.isNearObstacle(t, offset, 25)) {
                    if (offset >= reachableMin - maxLateralMove && offset <= reachableMax + maxLateralMove) {
                        newMin = Math.min(newMin, offset);
                        newMax = Math.max(newMax, offset);
                        foundGap = true;
                    }
                }
            }
            if (!foundGap) return false;
            reachableMin = newMin;
            reachableMax = newMax;
        }
        return true;
    }

    placeObstacleAt(t, lateralOffset) {
        const { ribbonWidth } = this.levelData;
        const worldUp = new THREE.Vector3(0, 1, 0);
        
        const curvePoint = this.spiralCurve.getPointAt(t);
        const tangent = this.spiralCurve.getTangentAt(t).normalize();
        const ribbonRight = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
        const ribbonUp = new THREE.Vector3().crossVectors(tangent, ribbonRight).normalize();
        
        const maxOffset = ribbonWidth / 2 - 12;
        const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, lateralOffset));
        
        const obstacle = new THREE.Mesh(
            new THREE.BoxGeometry(18, 18, 18),
            new THREE.MeshBasicMaterial({ 
                color: 0x0088ff,
                transparent: true,
                opacity: 0.9
            })
        );
        
        obstacle.position.copy(curvePoint)
            .addScaledVector(ribbonRight, clampedOffset)
            .addScaledVector(ribbonUp, 2);
        
        this.obstacles.push(obstacle);
        this.scene.add(obstacle);
    }

    updateSpiral(ship, _camera, dt, tiltAngle, thrustValue) {
        const { ribbonWidth } = this.levelData;

        // Ghost recovery
        this.obstacles.forEach(obs => {
            if (obs.material.opacity < 1.0) {
                obs.material.opacity += dt * 0.24;
                if (obs.material.opacity >= 1.0) {
                    obs.material.opacity = 1.0;
                    obs.material.transparent = false;
                }
            }
        });

        // --- Forward speed with inertia ---
        const BASE_SPEED  = 60;   
        const BOOST_SPEED = 160;  
        const targetSpeed = BASE_SPEED + thrustValue * BOOST_SPEED;
        const lerpRate = thrustValue > 0 ? 4.0 : 1.5; 
        this.forwardVelocity += (targetSpeed - this.forwardVelocity) * Math.min(lerpRate * dt, 1.0);

        // --- Advance progress along curve ---
        const curveLength = this.spiralCurve.getLength();
        this.spiralProgress = Math.min(1, this.spiralProgress + (this.forwardVelocity * dt) / curveLength);

        // --- Ribbon frame at current progress ---
        const curvePoint = this.spiralCurve.getPointAt(this.spiralProgress);
        const tangent = this.spiralCurve.getTangentAt(this.spiralProgress).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const ribbonRight = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
        const ribbonUp = new THREE.Vector3().crossVectors(tangent, ribbonRight).normalize();

        // --- Lateral steering from tilt ---
        const DEADZONE   = 2.0;  
        const MAX_TILT   = 35.0; 
        const LATERAL_SPEED = 180; 
        let normalizedTilt = 0;
        
        if (this.respawnGrace > 0) {
            this.respawnGrace--;
        } else if (Math.abs(tiltAngle) > DEADZONE) {
            normalizedTilt = -Math.sign(tiltAngle) * Math.min(Math.abs(tiltAngle) / MAX_TILT, 1.0);
        }
        this.lateralOffset += normalizedTilt * LATERAL_SPEED * dt;

        // --- Place ship on ribbon surface ---
        ship.position.copy(curvePoint)
            .addScaledVector(ribbonRight, this.lateralOffset)
            .addScaledVector(ribbonUp, 1);

        // --- Lock orientation ---
        const bankAngle = normalizedTilt * 0.5; 
        const matrix = new THREE.Matrix4().makeBasis(ribbonRight, ribbonUp, tangent);
        const baseQuat = new THREE.Quaternion().setFromRotationMatrix(matrix);
        const bankQuat = new THREE.Quaternion().setFromAxisAngle(tangent, bankAngle);
        ship.quaternion.copy(baseQuat).multiply(bankQuat);

        // --- Fall-off check ---
        if (Math.abs(this.lateralOffset) >= ribbonWidth / 2) {
            this.phase = 'death';
            this.isDying = true;
            this.deathTime = 0;
            return { customControls: true };
        }

        // --- Obstacle collision ---
        if (this.checkObstacleCollisions(ship)) {
            this.phase = 'death';
            this.isDying = true;
            this.deathTime = 0;
            return { customControls: true };
        }

        if (this.spiralProgress >= 0.95) {
            return { levelComplete: true };
        }

        return { customControls: true };
    }

    updateDeath(ship, _camera, dt) {
        this.deathTime += dt;

        const axisPoint = new THREE.Vector3(0, ship.position.y, 0);
        const driftDir = new THREE.Vector3().subVectors(ship.position, axisPoint);
        if (driftDir.lengthSq() > 0.001) {
            ship.position.addScaledVector(driftDir.normalize(), dt * 40);
        }

        const fadeProgress = Math.min(1, this.deathTime / 2);

        if (this.deathTime >= 2) {
            // 1. Roll back progress 10%
            this.spiralProgress = Math.max(0.01, this.spiralProgress - 0.10);
            
            // 2. Kill momentum and center the ship
            this.forwardVelocity = 0;
            this.lateralOffset = 0; 
            
            // 3. Grace period (210 frames)
            this.respawnGrace = 210; 

            // Calculate exact respawn position
            const curvePoint = this.spiralCurve.getPointAt(this.spiralProgress);
            const tangent = this.spiralCurve.getTangentAt(this.spiralProgress).normalize();
            const worldUp = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
            const up = new THREE.Vector3().crossVectors(tangent, right).normalize();

            const newShipPos = curvePoint.clone().addScaledVector(up, 2);

            // Turn nearby obstacles into ghosts
            this.obstacles.forEach(obs => {
                if (newShipPos.distanceTo(obs.position) < 600) {
                    obs.material.transparent = true;
                    obs.material.opacity = 0.15;
                }
            });

            // Set final position
            ship.position.copy(newShipPos);
            const matrix = new THREE.Matrix4().makeBasis(right, up, tangent);
            ship.quaternion.setFromRotationMatrix(matrix);

            this.phase = 'spiral';
            this.isDying = false;
            this.deathTime = 0;
        }

        return { customControls: true, fadeToBlack: fadeProgress };
    }

    isNearObstacle(progress, lateralOffset, threshold = 25) {
        const curvePoint = this.spiralCurve.getPointAt(progress);
        const tangent = this.spiralCurve.getTangentAt(progress).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
        const up = new THREE.Vector3().crossVectors(tangent, right).normalize();
        
        const testPos = curvePoint.clone()
            .addScaledVector(right, lateralOffset)
            .addScaledVector(up, 1);
        
        for (const obstacle of this.obstacles) {
            if (testPos.distanceTo(obstacle.position) < threshold) {
                return true; 
            }
        }
        return false;
    }

 checkObstacleCollisions(ship) {
        for (const obstacle of this.obstacles) {
            // 1. Ignore ghosts
            if (obstacle.material.opacity < 1.0) continue; 
            
            // 2. THE FIX: Ignore obstacles on different loops of the spiral!
            // If the obstacle is more than ~2% of the total track length away from us 
            // forward or backward, it is mathematically impossible to hit it right now.
            if (Math.abs(obstacle.userData.t - this.spiralProgress) > 0.02) continue;

            // 3. Only now do we check the 3D distance
            if (ship.position.distanceTo(obstacle.position) < 20) {
                return true; 
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