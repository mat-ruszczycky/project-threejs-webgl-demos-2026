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

// “Fixed Time Step” pattern
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

  let rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
  let rigidBody = world.createRigidBody(rigidBodyDesc);

  let colliderDesc = RAPIER.ColliderDesc.cuboid(4.5, 1.5, 4.5)
    .setFriction(0.75) // Sets surface friction. 1 means high friction, so objects will resist sliding.
    .setRestitution(0.33); // Sets how bouncy the object is. 0.25 means it barely bounces.
  let collider = world.createCollider(colliderDesc, rigidBody);
}

export function createBall(RAPIER, world, radius, startY = 6) {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, startY, 0) // Sets the starting position of the object in 3D space (x, y, z).
      .setGravityScale(8, true) // Makes gravity 8× stronger for this object; the 'true' may mean it resets velocity when changed.
      .setLinearDamping(0.9) // Slows down straight-line movement over time (like air resistance).
      .setAngularDamping(1.15) // Slows down rotation over time.
      .setCanSleep(true) // Allows the object to go to "sleep" when at rest to save performance.
  );

  world.createCollider(
    RAPIER.ColliderDesc.ball(radius).setFriction(0.75).setRestitution(0.9),
    body
  );

  return body;
}

export function updateBallMovement(world) {
  const body = world.physics.ball;
  if (!body) return;

  const impulse = { x: 0, y: 0, z: 0 };
  const moveForce = world.time.delta * 15;

  if (world.input.forward) impulse.z -= moveForce;
  if (world.input.backward) impulse.z += moveForce;
  if (world.input.left) impulse.x -= moveForce;
  if (world.input.right) impulse.x += moveForce;

  if (world.input.jump) {
    impulse.y += world.keyDown ? 10 : 1;
    world.input.jump = false;
  }

  // Quick stop damping
  const vel = body.linvel();
  if (impulse.x === 0) vel.x *= 0.9;
  if (impulse.z === 0) vel.z *= 0.9;

  body.setLinvel(vel, true);
  body.applyImpulse(impulse, true);
}

export function postPhysicsUpdate(world) {
  const ballRigidBody = world.physics.ball;
  if (!ballRigidBody) return;

  const rigidPosition = ballRigidBody.translation();
  const rigidRot = ballRigidBody.rotation();

  if (rigidPosition.y < -10) {
    ballRigidBody.setTranslation({ x: 0, y: 10, z: 0 }, true);
    ballRigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    ballRigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
    world.time.accumulator = 0;
    return;
  }

  const ball = world.objects.ball;

  const ballTargetPosition = new THREE.Vector3(
    rigidPosition.x,
    rigidPosition.y,
    rigidPosition.z
  );

  const ballTargetQuat = new THREE.Quaternion(
    rigidRot.x,
    rigidRot.y,
    rigidRot.z,
    rigidRot.w
  );

  const lerpedBallTargetPosition = world.controls.target.lerp(
    ballTargetPosition,
    0.1
  );

  ball.position.set(
    lerpedBallTargetPosition.x,
    ballTargetPosition.y, // Intentional as gravity will control this
    lerpedBallTargetPosition.z
  );

  ball.quaternion.copy(ballTargetQuat);

  if (world.keyDown) {
    const pos = ballTargetPosition.clone().add(new THREE.Vector3(6, 6, 6));
    world.camera.position.lerp(pos, 0.05);
  } else {
    // Smooth follow - move camera relative to its current offset from target
    const cameraOffset = new THREE.Vector3();
    cameraOffset.subVectors(world.camera.position, world.controls.target);

    // Maintain offset relative to ball
    const cameraDesiredPos = ballTargetPosition.clone().add(cameraOffset);
    world.camera.position.lerp(cameraDesiredPos, 0.1);
  }

  world.controls.update();
}
