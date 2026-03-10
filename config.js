// Star Runner 3D v2.0.0 - Game Configuration

export const CONFIG = {
    MAX_VELOCITY: 1.5, DRIFT_INERTIA: 0.95, ACCEL_FORCE: 0.08, BULLET_SPEED: 9,
    PITCH_SENSITIVITY: 0.02, YAW_SENSITIVITY: 0.018, EXPONENT: 2.0, DEADZONE: 1.2,
    SECTOR_SIZE: 3500, LOCAL_STAR_COUNT: 800, LOCAL_STAR_RANGE: 1800,
    CAMERA_RADIUS: 80, BASE_FOV: 75, MAX_FOV_BOOST: 18,
    FOV_SMOOTHING: 0.03, EXPLOSION_SHARDS: 20, SHAKE_INTENSITY: 18,
    GATE_RADIUS: 60, GATE_THICKNESS: 8, DEBRIS_COUNT: 5, DEBRIS_SPEED: 2,
    RESPAWN_TIME: 3000
};

export const LEVELS = {
    1: { 
        courseType: 'cylindrical',
        gates: 5, 
        targets: 3, 
        debris: 3,
        star3: 90, // 1:30 for 3 stars
        star2: 120, // 2:00 for 2 stars
        star1: 150 // 2:30 for 1 star
    },
    2: { 
        courseType: 'rectangular',
        gates: 8, 
        targets: 5, 
        debris: 5,
        star3: 120,
        star2: 150,
        star1: 180
    },
    3: {
        courseType: 'spheres',
        spheres: 3,
        orbsPerSphere: [3, 4, 5],
        star3: 180,
        star2: 240,
        star1: 300
    }
};
