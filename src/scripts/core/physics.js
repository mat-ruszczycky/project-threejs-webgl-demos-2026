import * as THREE from "three";

export async function initPhysics() {
  try {
    const RAPIER = await import("@dimforge/rapier3d");
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    return { RAPIER, world };
  } catch (error) {
    console.error("Physics init failed:", error);
    return null;
  }
}

export function stepPhysics(world) {
  const t = world.time;
  t.accumulator += t.delta;

  let steps = 0;
  while (t.accumulator >= t.fixedStep && steps < t.maxSubSteps) {
    world.physics.world.step();
    t.accumulator -= t.fixedStep;
    steps++;
  }
}

export function createGround(RAPIER, world) {
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(125, 0.1, 125)
      .setFriction(0.8)
      .setRestitution(0.15)
  );
}

export function createBall(RAPIER, world, radius, startY = 6) {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, startY, 0)
      .setGravityScale(8, true)
      .setLinearDamping(0.5)
      .setCanSleep(true)
  );

  world.createCollider(
    RAPIER.ColliderDesc.ball(radius).setFriction(0.6).setRestitution(0.96),
    body
  );

  return body;
}

export function updateBallControls(world) {
  const body = world.physics.ball;
  if (!body) return;

  const dir = { x: 0, y: 0, z: 0 };
  const force = 0.2;

  if (world.input.forward) dir.z -= force;
  if (world.input.backward) dir.z += force;
  if (world.input.left) dir.x -= force;
  if (world.input.right) dir.x += force;

  if (world.input.jump) {
    dir.y += 8;
    world.input.jump = false;
  }

  if (dir.x || dir.y || dir.z) {
    body.applyImpulse(dir, true);
  }
}

// Extract magic numbers to constants:
// const BALL_FORCE = 0.2;
// const JUMP_IMPULSE = 8;
// const GRAVITY_SCALE = 8;

export function postPhysicsUpdate(world) {
  const body = world.physics.ball;
  const mesh = world.objects.ball;

  let pos = body.translation();

  if (pos.y < -10) {
    body.setTranslation({ x: 6, y: 10, z: 6 }, true);
    pos = body.translation();
    world.time.accumulator = 0;
    return;
  }

  // Update OrbitControls target smoothly to the ball
  const ballPos = new THREE.Vector3(pos.x, pos.y, pos.z);
  const p = world.controls.target.lerp(ballPos, 0.1);
  mesh.position.set(p.x, ballPos.y, p.z);

  // Smooth follow: move camera relative to its current offset from target
  const offset = new THREE.Vector3();
  offset.subVectors(world.camera.position, world.controls.target); // current offset from target

  const desiredPos = ballPos.clone().add(offset); // maintain offset relative to ball

  const rot = body.rotation();
  mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);

  if (world.keyDown) {
    world.camera.position.lerp(
      { x: ballPos.x + 6, y: 6, z: ballPos.z + 6 },
      0.05
    );
  } else {
    world.camera.position.lerp(desiredPos, 0.1); // smooth follow
  }

  world.controls.update();
}
