
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
let input = { left: false, right: false, jump: false };

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") input.left = true;
  if (e.key === "ArrowRight" || e.key === "d") input.right = true;
  if (e.key === " " || e.key === "ArrowUp") input.jump = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") input.left = false;
  if (e.key === "ArrowRight" || e.key === "d") input.right = false;
  if (e.key === " " || e.key === "ArrowUp") input.jump = false;
});

const createScene = async () => {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);

  const camera = new BABYLON.FollowCamera("camera", new BABYLON.Vector3(0, 2, -10), scene);
  camera.radius = 12;
  camera.heightOffset = 2;
  camera.attachControl(canvas, true);

  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 300, height: 10 }, scene);
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  ground.material = groundMat;

  const bgPlane = BABYLON.MeshBuilder.CreatePlane("bg", { width: 300, height: 10 }, scene);
  bgPlane.position.z = 5;
  bgPlane.position.y = 2.5;
  const bgMat = new BABYLON.StandardMaterial("bgMat", scene);
  bgMat.diffuseTexture = new BABYLON.Texture("assets/cenario-campina.png", scene);
  bgPlane.material = bgMat;

  const result = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/", "Jacare.glb.txt", scene);
  const jacare = result.meshes[0];
  const skeleton = result.skeletons[0];
  jacare.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
  jacare.position = new BABYLON.Vector3(0, 0.5, 0);
  camera.lockedTarget = jacare;

  let currentAnim = null;
  const animations = {};

  const loadAnim = async (name, file) => {
    const animResult = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/", file, scene);
    const animGroup = animResult.animationGroups[0];
    animations[name] = animGroup;
    animGroup.stop();
    animResult.meshes.forEach(m => m.dispose());
  };

  await loadAnim("idle", "Idle.glb");
  await loadAnim("walk", "Walking.glb");
  await loadAnim("run", "Running.glb");
  await loadAnim("jump", "Jumping.glb");

  const playAnim = (name) => {
    if (currentAnim === name) return;
    if (currentAnim) animations[currentAnim].stop();
    animations[name].play(true);
    currentAnim = name;
  };

  playAnim("idle");

  scene.onBeforeRenderObservable.add(() => {
    const delta = engine.getDeltaTime() / 1000;
    let moved = false;

    if (input.left) {
      jacare.position.x -= 3 * delta;
      jacare.rotation.y = Math.PI;
      playAnim("walk");
      moved = true;
    }
    if (input.right) {
      jacare.position.x += 3 * delta;
      jacare.rotation.y = 0;
      playAnim("walk");
      moved = true;
    }
    if (input.jump) {
      playAnim("jump");
      moved = true;
    }
    if (!moved) playAnim("idle");
  });

  return scene;
};

createScene().then(scene => engine.runRenderLoop(() => scene.render()));
window.addEventListener("resize", () => engine.resize());
