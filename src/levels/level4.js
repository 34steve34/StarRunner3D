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
            this.respawnGrace = 90;

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
        
        this.createObstacles();
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
        // Create a blue ribbon/finish line at 95% progress
        const finishProgress = 0.95;
        const curvePoint = this.spiralCurve.getPointAt(finishProgress);
        const tangent = this.spiralCurve.getTangentAt(finishProgress).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const ribbonRight = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
        const ribbonUp = new THREE.Vector3().crossVectors(tangent, ribbonRight).normalize();
        
        // Create a banner across the finish
        const bannerGeometry = new THREE.PlaneGeometry(200, 30);
        const bannerMaterial = new THREE.MeshBasicMaterial({
            color: 0x0088ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            emissive: 0x0088ff,
            emissiveIntensity: 0.5
        });
        
        const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
        banner.position.copy(curvePoint).addScaledVector(ribbonUp, 15);
        banner.lookAt(curvePoint.clone().add(tangent));
        banner.rotateX(Math.PI / 2);
        
        this.spiralRibbon.add(banner);
        
        // Add "FINISH" text using simple geometry
        const finishGroup = new THREE.Group();
        
        // Create letters F I N I S H with simple boxes
        const letterWidth = 15;
        const letterHeight = 20;
        const letterThickness = 3;
        const letterSpacing = 5;
        
        const createLetter = (pattern, startX) => {
            const letterGroup = new THREE.Group();
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            
            pattern.forEach(([x, y, w, h]) => {
                const box = new THREE.Mesh(
                    new THREE.BoxGeometry(w, h, letterThickness),
                    material
                );
                box.position.set(startX + x + w/2, y + h/2, 0);
                letterGroup.add(box);
            });
            
            return letterGroup;
        };
        
        // F: vertical + top horizontal + middle horizontal
        const letterF = createLetter([
            [0, 0, letterThickness, letterHeight],  // vertical
            [0, letterHeight - letterThickness, letterWidth * 0.7, letterThickness],  // top
            [0, letterHeight / 2, letterWidth * 0.5, letterThickness]  // middle
        ], 0);
        
        // I: vertical
        const letterI = createLetter([
            [letterWidth / 2 - letterThickness / 2, 0, letterThickness, letterHeight]
        ], letterWidth + letterSpacing);
        
        // N: vertical left + diagonal + vertical right
        const letterN = createLetter([
            [0, 0, letterThickness, letterHeight],  // left
            [letterWidth - letterThickness, 0, letterThickness, letterHeight]  // right
        ], letterWidth * 2 + letterSpacing * 2);
        
        // I: vertical
        const letterI2 = createLetter([
            [letterWidth / 2 - letterThickness / 2, 0, letterThickness, letterHeight]
        ], letterWidth * 3 + letterSpacing * 3);
        
        // S: curves made of boxes
        const letterS = createLetter([
            [0, letterHeight - letterThickness, letterWidth, letterThickness],  // top
            [0, 0, letterThickness, letterHeight],  // left
            [letterWidth - letterThickness, 0, letterThickness, letterHeight],  // right
            [0, 0, letterWidth, letterThickness],  // bottom
            [letterWidth - letterThickness, letterHeight / 2, letterThickness, letterThickness]  // middle right
        ], letterWidth * 4 + letterSpacing * 4);
        
        // H: vertical left + horizontal + vertical right
        const letterH = createLetter([
            [0, 0, letterThickness, letterHeight],  // left
            [0, letterHeight / 2 - letterThickness / 2, letterWidth, letterThickness],  // middle
            [letterWidth - letterThickness, 0, letterThickness, letterHeight]  // right
        ], letterWidth * 5 + letterSpacing * 5);
        
        finishGroup.add(letterF, letterI, letterN, letterI2, letterS, letterH);
        
        // Position the text above and across the finish line
        finishGroup.position.copy(curvePoint)
            .addScaledVector(ribbonUp, 35)
            .addScaledVector(ribbonRight, -letterWidth * 3);
        finishGroup.lookAt(curvePoint.clone().add(tangent));
        
        this.spiralRibbon.add(finishGroup);
        
        // Add glowing finish zone markers
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(5, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: 0x00ffff,
                    emissive: 0x00ffff,
                    emissiveIntensity: 0.8
                })
            );
            
            const markerPos = curvePoint.clone()
                .addScaledVector(ribbonRight, Math.cos(angle) * 80)
                .addScaledVector(ribbonUp, 5);
            marker.position.copy(markerPos);
            
            this.spiralRibbon.add(marker);
        }
    }

    createObstacles() {
        const { obstacleCount, ribbonWidth, spiralTurns, cylinderRadius, cylinderHeight } = this.levelData;
        
        // Clear any existing obstacles
        for (const obstacle of this.obstacles) {
            this.scene.remove(obstacle);
        }
        this.obstacles = [];
        
        // Use mathematical patterns to force steering instead of random placement
        // This prevents smart pilots from just riding the edge
        
        const worldUp = new THREE.Vector3(0, 1, 0);
        
        // Pattern 1: Sine wave obstacles that sweep across the ribbon
        const sineWaveCount = Math.floor(obstacleCount * 0.4);
        for (let i = 0; i < sineWaveCount; i++) {
            const t = 0.15 + (i / sineWaveCount) * 0.80;
            
            // Sine wave that oscillates across the full ribbon width
            const sineValue = Math.sin(t * spiralTurns * Math.PI * 2 * 3); // 3 full oscillations
            const lateralOffset = sineValue * (ribbonWidth * 0.35);
            
            this.placeObstacleAt(t, lateralOffset);
        }
        
        // Pattern 2: Alternating left/right obstacles (lane blockers)
        const laneBlockerCount = Math.floor(obstacleCount * 0.3);
        for (let i = 0; i < laneBlockerCount; i++) {
            const t = 0.18 + (i / laneBlockerCount) * 0.75;
            
            // Alternate between left and right sides
            const side = i % 2 === 0 ? -1 : 1;
            const lateralOffset = side * (ribbonWidth * 0.30);
            
            this.placeObstacleAt(t, lateralOffset);
        }
        
        // Pattern 3: Center obstacles that force you to the edges
        const centerCount = Math.floor(obstacleCount * 0.15);
        for (let i = 0; i < centerCount; i++) {
            const t = 0.20 + (i / centerCount) * 0.70;
            const lateralOffset = (Math.random() - 0.5) * (ribbonWidth * 0.2); // Near center
            
            this.placeObstacleAt(t, lateralOffset);
        }
        
        // Pattern 4: Edge chasers - obstacles near edges that punish staying too far left/right
        const edgeCount = Math.floor(obstacleCount * 0.15);
        for (let i = 0; i < edgeCount; i++) {
            const t = 0.22 + (i / edgeCount) * 0.68;
            
            // Randomly pick left or right edge
            const edgeSide = Math.random() > 0.5 ? -1 : 1;
            const lateralOffset = edgeSide * (ribbonWidth * 0.38);
            
            this.placeObstacleAt(t, lateralOffset);
        }
    }

    placeObstacleAt(t, lateralOffset) {
        const { ribbonWidth } = this.levelData;
        const worldUp = new THREE.Vector3(0, 1, 0);
        
        const curvePoint = this.spiralCurve.getPointAt(t);
        const tangent = this.spiralCurve.getTangentAt(t).normalize();
        const ribbonRight = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
        const ribbonUp = new THREE.Vector3().crossVectors(tangent, ribbonRight).normalize();
        
        // Clamp lateral offset to stay on ribbon
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
        if (this.respawnGrace > 0) {
            this.respawnGrace--;
        } else if (Math.abs(tiltAngle) > DEADZONE) {
            // Negate so tilt-right moves right on the ribbon
            normalizedTilt = -Math.sign(tiltAngle) * Math.min(Math.abs(tiltAngle) / MAX_TILT, 1.0);
        }
        this.lateralOffset += normalizedTilt * LATERAL_SPEED * dt;

        // --- Place ship on ribbon surface ---
        ship.position.copy(curvePoint)
            .addScaledVector(ribbonRight, this.lateralOffset)
            .addScaledVector(ribbonUp, 1);

        // --- Lock orientation: face down tangent, bank on tilt ---
        const bankAngle = normalizedTilt * 0.5; // bank into the turn
        const matrix = new THREE.Matrix4().makeBasis(ribbonRight, ribbonUp, tangent);
        const baseQuat = new THREE.Quaternion().setFromRotationMatrix(matrix);
        const bankQuat = new THREE.Quaternion().setFromAxisAngle(tangent, bankAngle);
        ship.quaternion.copy(baseQuat).multiply(bankQuat);

        // --- Fall-off check (no clamp — let offset exceed edge to trigger death) ---
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
            // Set back 10% instead of restarting from beginning
            this.spiralProgress = Math.max(0.01, this.spiralProgress - 0.10);
            this.forwardVelocity = 0;
            this.respawnGrace = 90; // ~1.5 sec grace period — no lateral input

            // Find a safe lateral position (away from obstacles)
            this.lateralOffset = this.findSafeLateralPosition(this.spiralProgress);

            const curvePoint = this.spiralCurve.getPointAt(this.spiralProgress);
            const tangent = this.spiralCurve.getTangentAt(this.spiralProgress).normalize();
            const worldUp = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
            const up = new THREE.Vector3().crossVectors(tangent, right).normalize();

            // Place ship on ribbon surface at safe lateral position
            ship.position.copy(curvePoint)
                .addScaledVector(right, this.lateralOffset)
                .addScaledVector(up, 1);

            const matrix = new THREE.Matrix4().makeBasis(right, up, tangent);
            ship.quaternion.setFromRotationMatrix(matrix);

            this.phase = 'spiral';
            this.isDying = false;
            this.deathTime = 0;
            console.log(`🔄 Respawning 10% back at progress ${(this.spiralProgress * 100).toFixed(1)}%...`);
        }

        return { customControls: true, fadeToBlack: fadeProgress };
    }

    findSafeLateralPosition(progress) {
        const { ribbonWidth } = this.levelData;
        const maxOffset = ribbonWidth / 2 - 5; // Stay 5 units away from edge
        
        // First, check if center is clear (can fly straight through)
        if (!this.isNearObstacle(progress, 0)) {
            return 0;
        }
        
        // Find the position furthest from any obstacle at this progress
        let bestOffset = 0;
        let bestDistance = 0;
        
        // Sample many positions across the ribbon width
        const samples = 20;
        for (let i = 0; i <= samples; i++) {
            const offset = -maxOffset + (2 * maxOffset * i / samples);
            const minObstacleDist = this.getMinObstacleDistance(progress, offset);
            
            if (minObstacleDist > bestDistance) {
                bestDistance = minObstacleDist;
                bestOffset = offset;
            }
            
            // If we find a position with good clearance, use it
            if (minObstacleDist > 30) {
                return offset;
            }
        }
        
        return bestOffset;
    }

    getMinObstacleDistance(progress, lateralOffset) {
        const curvePoint = this.spiralCurve.getPointAt(progress);
        const tangent = this.spiralCurve.getTangentAt(progress).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
        const up = new THREE.Vector3().crossVectors(tangent, right).normalize();
        
        const testPos = curvePoint.clone()
            .addScaledVector(right, lateralOffset)
            .addScaledVector(up, 1);
        
        let minDist = Infinity;
        for (const obstacle of this.obstacles) {
            const dist = testPos.distanceTo(obstacle.position);
            if (dist < minDist) {
                minDist = dist;
            }
        }
        return minDist;
    }

    isNearObstacle(progress, lateralOffset) {
        const curvePoint = this.spiralCurve.getPointAt(progress);
        const tangent = this.spiralCurve.getTangentAt(progress).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
        const up = new THREE.Vector3().crossVectors(tangent, right).normalize();
        
        const testPos = curvePoint.clone()
            .addScaledVector(right, lateralOffset)
            .addScaledVector(up, 1);
        
        for (const obstacle of this.obstacles) {
            if (testPos.distanceTo(obstacle.position) < 25) {
                return true; // Too close to obstacle
            }
        }
        return false;
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
