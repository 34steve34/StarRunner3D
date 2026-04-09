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
            
            ship.position.set(-1000, 500, 500);
            ship.visible = true;
            ship.rotation.set(0, 0, 0);
            ship.rotateY(Math.PI * 0.75);
            
            this.createWormholeStructure();
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
        
        const ringGeometry = new THREE.RingGeometry(170, 230, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x0088ff,
            transparent: true, 
            opacity: 1.0,
            side: THREE.DoubleSide
        });
        this.centralRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.centralRing.position.set(0, 0, -2000);
        this.wormholeStructure.add(this.centralRing);
        
        const cylinderGeometry = new THREE.CylinderGeometry(200, 200, 1000, 32, 1, true);
        const cylinderMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x0044aa,
            transparent: true, 
            opacity: 0.3,
            side: THREE.BackSide
        });
        this.cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        this.cylinder.position.set(0, -500, -2000);
        this.wormholeStructure.add(this.cylinder);
        
        const light1 = new THREE.PointLight(0x0088ff, 2000, 1000);
        light1.position.set(0, 0, -2000);
        this.wormholeStructure.add(light1);
        
        this.scene.add(this.wormholeStructure);
    }

    createBlueStarField() {
        const starCount = 300;
        const planeZ = -2000;
        const planeSize = 1000;
        
        for (let i = 0; i < starCount; i++) {
            const star = new THREE.Mesh(
                new THREE.SphereGeometry(3, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x0088ff })
            );
            
            const x = (Math.random() - 0.5) * planeSize;
            const y = 0;
            const z = planeZ + (Math.random() - 0.5) * 100;
            
            star.position.set(x, y, z);
            
            star.userData = { 
                startX: x,
                startY: y,
                startZ: z,
                flowSpeed: 1.0 + Math.random() * 1.5,
                fallSpeed: 2.0 + Math.random() * 2.0,
                phase: 'flowing'
            };
            
            this.blueStars.push(star);
            this.scene.add(star);
        }
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
        this.blueStars.forEach(star => {
            if (star.userData.phase === 'flowing') {
                const currentX = star.position.x;
                const currentY = star.position.y;
                const distToCenter = Math.sqrt(currentX * currentX + currentY * currentY);
                
                if (distToCenter > 50) {
                    const dirX = -currentX / distToCenter;
                    const dirY = -currentY / distToCenter;
                    star.position.x += dirX * star.userData.flowSpeed * dt * 100;
                    star.position.y += dirY * star.userData.flowSpeed * dt * 100;
                } else {
                    star.userData.phase = 'falling';
                }
            } else if (star.userData.phase === 'falling') {
                star.position.y -= star.userData.fallSpeed * dt * 100;
                if (star.position.y < -1000) {
                    star.position.set(star.userData.startX, star.userData.startY, star.userData.startZ);
                    star.userData.phase = 'flowing';
                }
            }
        });
        
        const distanceToPlane = Math.abs(ship.position.z - (-2000));
        const distanceToCenter = Math.sqrt(ship.position.x * ship.position.x + ship.position.y * ship.position.y);
        
        if (distanceToPlane < 500 && distanceToCenter < 600) {
            this.phase = 'entrapment';
            this.entrappedTime = 0;
            return { customControls: true };
        }
        
        return { customControls: false };
    }

    updateEntrapment(ship, camera, dt) {
        this.entrappedTime += dt;
        const planeCenter = new THREE.Vector3(0, 0, -2000);
        const direction = new THREE.Vector3().subVectors(planeCenter, ship.position).normalize();
        
        if (this.entrappedTime < 7) {
            ship.position.add(direction.multiplyScalar(dt * 150));
        } else {
            ship.position.add(new THREE.Vector3(0, -1, 0).multiplyScalar(dt * 200));
            const horizontalDir = new THREE.Vector3(ship.position.x, ship.position.y, 0).normalize().multiplyScalar(-1);
            ship.position.add(horizontalDir.multiplyScalar(dt * 100));
        }
        
        ship.rotateX(dt * 0.5);
        ship.rotateZ(dt * 0.3);
        
        if (this.entrappedTime >= 15) {
            this.phase = 'spiral';
            this.spiralProgress = 0;
            this.scene.remove(this.wormholeStructure);
            this.blueStars.forEach(star => this.scene.remove(star));
            this.blueStars = [];
            
            this.createSpiralRibbon();
            if (this.obstacles.length === 0) {
                this.createObstacles();
            }

            this.spiralProgress = 0.01;
            this.forwardVelocity = 0;
            this.lateralOffset = 0;
            this.respawnGrace = 120;

            const shipPos = this.spiralCurve.getPointAt(this.spiralProgress);
            const tangent = this.spiralCurve.getTangentAt(this.spiralProgress).normalize();
            const worldUp = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
            const up = new THREE.Vector3().crossVectors(tangent, right).normalize();

            ship.position.copy(shipPos).addScaledVector(up, 1);
            const matrix = new THREE.Matrix4().makeBasis(right, up, tangent);
            ship.quaternion.setFromRotationMatrix(matrix);
            
            return { customControls: false, fadeToBlack: true };
        }
        
        return { customControls: true, disableThrust: true };
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
        
        this.spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
        this.spiralCurve.curveType = 'catmullrom';
        
        const ribbonGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const uvs = [];
        const indices = [];
        const worldUp = new THREE.Vector3(0, 1, 0);
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const curvePoint = this.spiralCurve.getPointAt(t);
            const tangent = this.spiralCurve.getTangentAt(t).normalize();
            const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
            
            const leftEdge = curvePoint.clone().addScaledVector(right, -ribbonWidth / 2);
            const rightEdge = curvePoint.clone().addScaledVector(right, ribbonWidth / 2);
            
            vertices.push(leftEdge.x, leftEdge.y, leftEdge.z);
            vertices.push(rightEdge.x, rightEdge.y, rightEdge.z);
            uvs.push(t, 0, t, 1);
            
            if (i < segments) {
                const base = i * 2;
                indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
            }
        }
        
        ribbonGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        ribbonGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        ribbonGeometry.setIndex(indices);
        ribbonGeometry.computeVertexNormals();
        
        this.spiralRibbon = new THREE.Mesh(ribbonGeometry, new THREE.MeshBasicMaterial({ 
            color: 0xff6600, side: THREE.DoubleSide, transparent: true, opacity: 0.6, depthWrite: false 
        }));
        this.scene.add(this.spiralRibbon);
        
        this.createFinishZone(0.90, 0.95);
        this.createFinishLine();
    }

    createFinishZone(startT, endT) {
        const { ribbonWidth } = this.levelData;
        const segments = 16;
        const worldUp = new THREE.Vector3(0, 1, 0);
        const finishGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        for (let i = 0; i <= segments; i++) {
            const t = startT + (endT - startT) * (i / segments);
            const curvePoint = this.spiralCurve.getPointAt(t);
            const tangent = this.spiralCurve.getTangentAt(t).normalize();
            const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
            const leftEdge = curvePoint.clone().addScaledVector(right, -ribbonWidth / 2);
            const rightEdge = curvePoint.clone().addScaledVector(right, ribbonWidth / 2);
            vertices.push(leftEdge.x, leftEdge.y, leftEdge.z, rightEdge.x, rightEdge.y, rightEdge.z);
            if (i < segments) {
                const base = i * 2;
                indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
            }
        }
        finishGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        finishGeometry.setIndex(indices);
        this.scene.add(new THREE.Mesh(finishGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })));
    }

    createFinishLine() {
        const finishProgress = 0.95;
        const curvePoint = this.spiralCurve.getPointAt(finishProgress);
        const tangent = this.spiralCurve.getTangentAt(finishProgress).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(worldUp, tangent).normalize();
        const up = new THREE.Vector3().crossVectors(tangent, right).normalize();

        const banner = new THREE.Mesh(new THREE.PlaneGeometry(200, 50), new THREE.MeshBasicMaterial({ color: 0x0088ff }));
        banner.position.copy(curvePoint).addScaledVector(up, 30);
        banner.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, tangent));
        this.scene.add(banner);
    }

    createObstacles() {
        const { obstacleCount, ribbonWidth, spiralTurns } = this.levelData;
        this.obstacles.forEach(obs => this.scene.remove(obs));
        this.obstacles = [];
        
        for (let i = 0; i < obstacleCount; i++) {
            const t = 0.15 + (i / obstacleCount) * 0.75;
            const lateralOffset = (Math.sin(t * spiralTurns * Math.PI * 6)) * (ribbonWidth * 0.35);
            this.placeObstacleAt(t, lateralOffset);
        }
        
        let attempts = 0;
        while (!this.isRibbonTraversable() && attempts < 5) {
            attempts++;
            this.obstacles.forEach(obs => this.scene.remove(obs));
            this.obstacles = [];
            for (let i = 0; i < obstacleCount; i++) {
                const t = 0.15 + (i / obstacleCount) * 0.75;
                const lateralOffset = (Math.random() - 0.5) * ribbonWidth * 0.7;
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
        const curvePoint = this.spiralCurve.getPointAt(t);
        const tangent = this.spiralCurve.getTangentAt(t).normalize();
        const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent).normalize();
        const up = new THREE.Vector3().crossVectors(tangent, right).normalize();
        
        const obstacle = new THREE.Mesh(new THREE.BoxGeometry(18, 18, 18), new THREE.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 1.0 }));
        obstacle.position.copy(curvePoint).addScaledVector(right, lateralOffset).addScaledVector(up, 2);
        this.obstacles.push(obstacle);
        this.scene.add(obstacle);
    }

    updateSpiral(ship, _camera, dt, tiltAngle, thrustValue) {
        const { ribbonWidth } = this.levelData;
        
        // Ghost recovery
        this.obstacles.forEach(obs => {
            if (obs.material.opacity < 1.0) {
                obs.material.opacity += dt * 0.35;
                if (obs.material.opacity >= 1.0) {
                    obs.material.opacity = 1.0;
                    obs.material.transparent = false;
                }
            }
        });

        const targetSpeed = 60 + thrustValue * 160;
        this.forwardVelocity += (targetSpeed - this.forwardVelocity) * Math.min(4 * dt, 1.0);
        this.spiralProgress = Math.min(1, this.spiralProgress + (this.forwardVelocity * dt) / this.spiralCurve.getLength());

        const curvePoint = this.spiralCurve.getPointAt(this.spiralProgress);
        const tangent = this.spiralCurve.getTangentAt(this.spiralProgress).normalize();
        const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent).normalize();
        const up = new THREE.Vector3().crossVectors(tangent, right).normalize();

        if (this.respawnGrace > 0) {
            this.respawnGrace--;
        } else if (Math.abs(tiltAngle) > 2.0) {
            this.lateralOffset += -Math.sign(tiltAngle) * Math.min(Math.abs(tiltAngle) / 35, 1.0) * 180 * dt;
        }

        ship.position.copy(curvePoint).addScaledVector(right, this.lateralOffset).addScaledVector(up, 1);
        ship.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, tangent));

        if (Math.abs(this.lateralOffset) >= ribbonWidth / 2 || this.checkObstacleCollisions(ship)) {
            this.phase = 'death';
            this.isDying = true;
            this.deathTime = 0;
            return { customControls: true };
        }

        if (this.spiralProgress >= 0.95) return { levelComplete: true };
        return { customControls: true };
    }

updateDeath(ship, _camera, dt) {
        this.deathTime += dt;
        if (this.deathTime >= 2) {
            // 1. Roll back 10%
            this.spiralProgress = Math.max(0.01, this.spiralProgress - 0.10);
            this.forwardVelocity = 0;
            this.lateralOffset = 0;
            this.respawnGrace = 120; // 2 seconds at 60fps

            // 2. Calculate the NEW respawn position FIRST
            const cp = this.spiralCurve.getPointAt(this.spiralProgress);
            const tg = this.spiralCurve.getTangentAt(this.spiralProgress).normalize();
            const rt = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tg).normalize();
            const up = new THREE.Vector3().crossVectors(tg, rt).normalize();
            
            const newShipPos = cp.clone().addScaledVector(up, 2);

            // 3. NOW turn nearby obstacles into ghosts based on the NEW position
            this.obstacles.forEach(obs => {
                // Increased distance to 600 to ensure a solid 2-second safe runway
                if (newShipPos.distanceTo(obs.position) < 600) {
                    obs.material.transparent = true;
                    obs.material.opacity = 0.3;
                }
            });

            // 4. Finally, move the ship and reset rotation
            ship.position.copy(newShipPos);
            ship.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(rt, up, tg));

            this.phase = 'spiral';
            this.isDying = false;
            this.deathTime = 0;
        }
        return { customControls: true, fadeToBlack: Math.min(1, this.deathTime / 2) };
    }

    checkObstacleCollisions(ship) {
        return this.obstacles.some(obs => obs.material.opacity >= 1.0 && ship.position.distanceTo(obs.position) < 20);
    }

    cleanup(scene) {
        if (this.spiralRibbon) scene.remove(this.spiralRibbon);
        if (this.wormholeStructure) scene.remove(this.wormholeStructure);
        this.obstacles.forEach(obs => scene.remove(obs));
        this.blueStars.forEach(star => scene.remove(star));
    }
}