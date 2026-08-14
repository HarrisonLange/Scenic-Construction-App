import { Engine } from "./vendor/kiri/kiri-engine.js";
import {
  createDevice,
  createProcess,
  loadProfileSources,
  machineForKey,
  materialForKey,
  qualityForKey,
} from "./profiles.js";

const MAX_FILE_BYTES = 64 * 1024 * 1024;
const ENGINE_OPTIONS = Object.freeze({
  workURL: new URL("./vendor/kiri/kiri-worker.js", import.meta.url).href,
  poolURL: new URL("./vendor/kiri/kiri-pool.js", import.meta.url).href,
});

const elements = Object.freeze({
  bedLabel: document.getElementById("bedLabel"),
  brimToggle: document.getElementById("brimToggle"),
  chooseFileButton: document.getElementById("chooseFileButton"),
  dropZone: document.getElementById("dropZone"),
  emptyState: document.getElementById("emptyState"),
  exportButton: document.getElementById("exportButton"),
  infillOutput: document.getElementById("infillOutput"),
  infillRange: document.getElementById("infillRange"),
  localBadgeText: document.getElementById("localBadgeText"),
  modelCanvas: document.getElementById("modelCanvas"),
  modelFile: document.getElementById("modelFile"),
  modelName: document.getElementById("modelName"),
  modelSize: document.getElementById("modelSize"),
  modelStats: document.getElementById("modelStats"),
  printerSelect: document.getElementById("printerSelect"),
  progressBar: document.getElementById("progressBar"),
  progressTrack: document.getElementById("progressTrack"),
  qualitySelect: document.getElementById("qualitySelect"),
  resetModelButton: document.getElementById("resetModelButton"),
  resultBytes: document.getElementById("resultBytes"),
  resultCard: document.getElementById("resultCard"),
  resultLayers: document.getElementById("resultLayers"),
  resultProfile: document.getElementById("resultProfile"),
  rotateXButton: document.getElementById("rotateXButton"),
  rotateYButton: document.getElementById("rotateYButton"),
  rotateZButton: document.getElementById("rotateZButton"),
  sliceButton: document.getElementById("sliceButton"),
  sliceForm: document.getElementById("sliceForm"),
  statusIcon: document.getElementById("statusIcon"),
  statusMessage: document.getElementById("statusMessage"),
  statusPanel: document.getElementById("statusPanel"),
  statusTitle: document.getElementById("statusTitle"),
  supportsToggle: document.getElementById("supportsToggle"),
  toast: document.getElementById("toast"),
  triangleCount: document.getElementById("triangleCount"),
  viewerToolbar: document.getElementById("viewerToolbar"),
});

function initialState() {
  return Object.freeze({
    busy: false,
    engine: null,
    model: null,
    profileSourcesPromise: loadProfileSources(),
    result: null,
    sourceBuffer: null,
  });
}

let state = initialState();

function updateState(changes) {
  state = Object.freeze({ ...state, ...changes });
  return state;
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

function createBedGrid(three, machine) {
  const group = new three.Group();
  const step = machine.width > 300 ? 20 : 16;
  const positions = [];
  for (let x = -machine.width / 2; x <= machine.width / 2 + 0.01; x += step) {
    positions.push(x, -machine.depth / 2, 0, x, machine.depth / 2, 0);
  }
  for (let y = -machine.depth / 2; y <= machine.depth / 2 + 0.01; y += step) {
    positions.push(-machine.width / 2, y, 0, machine.width / 2, y, 0);
  }
  const gridGeometry = new three.BufferGeometry();
  gridGeometry.setAttribute("position", new three.Float32BufferAttribute(positions, 3));
  const gridMaterial = new three.LineBasicMaterial({ color: 0x31425a, transparent: true, opacity: 0.48 });
  group.add(new three.LineSegments(gridGeometry, gridMaterial));

  const plateGeometry = new three.BoxGeometry(machine.width, machine.depth, 2.4);
  const plateMaterial = new three.MeshStandardMaterial({ color: 0x111b29, metalness: 0.35, roughness: 0.8 });
  const plate = new three.Mesh(plateGeometry, plateMaterial);
  plate.position.z = -1.3;
  group.add(plate);

  const edgeGeometry = new three.EdgesGeometry(plateGeometry);
  const edgeMaterial = new three.LineBasicMaterial({ color: 0x00aeef, transparent: true, opacity: 0.55 });
  const edges = new three.LineSegments(edgeGeometry, edgeMaterial);
  edges.position.copy(plate.position);
  group.add(edges);
  return group;
}

function createPreview(canvas) {
  const three = globalThis.THREE;
  if (!three) {
    throw new Error("The local Kiri:Moto bundle did not expose the Three.js preview runtime.");
  }
  const renderer = new three.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = three.SRGBColorSpace;

  const scene = new three.Scene();
  const camera = new three.PerspectiveCamera(34, 1, 0.1, 5000);
  camera.up.set(0, 0, 1);
  scene.add(new three.HemisphereLight(0xddefff, 0x182233, 1.8));
  const keyLight = new three.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(180, -130, 280);
  scene.add(keyLight);

  let bedObject = null;
  let modelObject = null;
  let target = new three.Vector3(0, 0, 30);
  let distance = 520;
  let view = Object.freeze({ yaw: -0.72, pitch: 0.62, dragging: false, x: 0, y: 0 });

  function updateCamera() {
    const horizontal = Math.cos(view.pitch) * distance;
    camera.position.set(
      Math.cos(view.yaw) * horizontal,
      Math.sin(view.yaw) * horizontal,
      Math.sin(view.pitch) * distance + target.z * 0.2,
    );
    camera.lookAt(target);
    renderer.render(scene, camera);
  }

  function resize() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    if (canvas.width !== Math.round(width * renderer.getPixelRatio()) || canvas.height !== Math.round(height * renderer.getPixelRatio())) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    updateCamera();
  }

  function setBed(machine) {
    if (bedObject) {
      scene.remove(bedObject);
      disposeObject(bedObject);
    }
    bedObject = createBedGrid(three, machine);
    scene.add(bedObject);
    distance = Math.max(machine.width, machine.depth) * 1.75;
    updateCamera();
  }

  function setModel(geometry, bounds) {
    if (modelObject) {
      scene.remove(modelObject);
      disposeObject(modelObject);
    }
    const modelGeometry = geometry.clone();
    modelGeometry.computeVertexNormals();
    const material = new three.MeshStandardMaterial({
      color: 0x00aeef,
      metalness: 0.08,
      roughness: 0.58,
      side: three.DoubleSide,
    });
    const solid = new three.Mesh(modelGeometry, material);
    const wireGeometry = new three.EdgesGeometry(modelGeometry, 28);
    const wireMaterial = new three.LineBasicMaterial({ color: 0xbceeff, transparent: true, opacity: 0.18 });
    const wire = new three.LineSegments(wireGeometry, wireMaterial);
    modelObject = new three.Group();
    modelObject.add(solid, wire);
    scene.add(modelObject);
    target = new three.Vector3(0, 0, bounds.z * 0.42);
    distance = Math.max(180, Math.max(bounds.x, bounds.y, bounds.z) * 2.6);
    updateCamera();
  }

  function clearModel() {
    if (!modelObject) return;
    scene.remove(modelObject);
    disposeObject(modelObject);
    modelObject = null;
    updateCamera();
  }

  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    view = Object.freeze({ ...view, dragging: true, x: event.clientX, y: event.clientY });
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!view.dragging) return;
    const nextYaw = view.yaw - (event.clientX - view.x) * 0.008;
    const nextPitch = Math.max(0.12, Math.min(1.38, view.pitch + (event.clientY - view.y) * 0.006));
    view = Object.freeze({ yaw: nextYaw, pitch: nextPitch, dragging: true, x: event.clientX, y: event.clientY });
    updateCamera();
  });
  const stopDragging = () => {
    view = Object.freeze({ ...view, dragging: false });
  };
  canvas.addEventListener("pointerup", stopDragging);
  canvas.addEventListener("pointercancel", stopDragging);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    distance = Math.max(80, Math.min(1800, distance * (event.deltaY > 0 ? 1.08 : 0.92)));
    updateCamera();
  }, { passive: false });
  globalThis.addEventListener("resize", resize);
  resize();
  return Object.freeze({ clearModel, resize, setBed, setModel });
}

const preview = createPreview(elements.modelCanvas);

function formattedBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formattedMillimeters(value) {
  return Number(value).toFixed(value >= 100 ? 0 : 1);
}

function filenameBase(filename) {
  return filename.replace(/\.stl$/i, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "model";
}

function selectedMaterialKey() {
  const selected = document.querySelector('input[name="material"]:checked');
  if (!selected) throw new Error("No material is selected.");
  return selected.value;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  globalThis.setTimeout(() => { elements.toast.hidden = true; }, 6000);
}

function showStatus(kind, icon, title, message, progress) {
  elements.statusPanel.className = `status-panel${kind ? ` ${kind}` : ""}`;
  elements.statusIcon.textContent = icon;
  elements.statusTitle.textContent = title;
  elements.statusMessage.textContent = message;
  const hasProgress = Number.isFinite(progress);
  elements.progressTrack.hidden = !hasProgress;
  elements.progressBar.style.width = hasProgress ? `${Math.max(0, Math.min(100, progress * 100))}%` : "0%";
}

function setBusy(busy) {
  updateState({ busy });
  elements.sliceForm.querySelectorAll("input, select, button").forEach((control) => {
    control.disabled = busy;
  });
  elements.rotateXButton.disabled = busy;
  elements.rotateYButton.disabled = busy;
  elements.rotateZButton.disabled = busy;
  elements.resetModelButton.disabled = busy;
  refreshSliceReadiness();
}

function clearResult() {
  if (!state.result) return;
  updateState({ result: null });
  elements.exportButton.hidden = true;
  elements.resultCard.hidden = true;
}

function currentBounds() {
  if (!state.engine) throw new Error("No slicer engine is connected to a model.");
  const bounds = state.engine.widget.getBoundingBox(true);
  return Object.freeze({
    x: bounds.max.x - bounds.min.x,
    y: bounds.max.y - bounds.min.y,
    z: bounds.max.z - bounds.min.z,
  });
}

function fitProblem(bounds, machine) {
  const limits = Object.freeze({ x: machine.width - 4, y: machine.depth - 4, z: machine.height - 2 });
  const tooLarge = bounds.x > limits.x || bounds.y > limits.y || bounds.z > limits.z;
  if (!tooLarge) return null;
  return `Model is ${formattedMillimeters(bounds.x)} × ${formattedMillimeters(bounds.y)} × ${formattedMillimeters(bounds.z)} mm, but the safe ${machine.name} area is ${limits.x} × ${limits.y} × ${limits.z} mm.`;
}

function refreshSliceReadiness() {
  const machineKey = elements.printerSelect.value;
  const canSlice = Boolean(state.model && machineKey && !state.busy);
  elements.sliceButton.disabled = !canSlice;
  if (!state.model || !machineKey) return;
  const machine = machineForKey(machineKey);
  const bounds = currentBounds();
  const problem = fitProblem(bounds, machine);
  elements.sliceButton.disabled = Boolean(problem) || state.busy;
  if (problem) {
    showStatus("error", "!", "Model does not fit", problem, Number.NaN);
  }
}

function updateModelDisplay() {
  if (!state.model || !state.engine) return;
  const bounds = currentBounds();
  const geometry = state.engine.widget.mesh.geometry;
  preview.setModel(geometry, bounds);
  elements.modelName.textContent = state.model.name;
  elements.modelSize.textContent = `${formattedMillimeters(bounds.x)} × ${formattedMillimeters(bounds.y)} × ${formattedMillimeters(bounds.z)} mm`;
  elements.triangleCount.textContent = state.model.triangles.toLocaleString();
  refreshSliceReadiness();
}

function createEngine() {
  return new Engine(ENGINE_OPTIONS);
}

function assertStlFile(file) {
  if (!file.name.toLowerCase().endsWith(".stl")) {
    throw new TypeError(`Unsupported file "${file.name}". Choose an STL file.`);
  }
  if (file.size === 0) {
    throw new RangeError(`STL file "${file.name}" is empty.`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new RangeError(`STL file "${file.name}" is ${formattedBytes(file.size)}. The Chromebook limit is ${formattedBytes(MAX_FILE_BYTES)}.`);
  }
}

async function parseModel(file, sourceBuffer) {
  const engine = createEngine();
  try {
    await engine.parse(sourceBuffer.slice(0));
  } catch (error) {
    throw new TypeError(`Could not parse STL file "${file.name}". ${String(error.message || error)}`);
  }
  const geometry = engine.widget.mesh.geometry;
  const position = geometry?.attributes?.position;
  if (!position || position.count < 12 || position.count % 3 !== 0) {
    throw new TypeError(`STL file "${file.name}" does not contain a valid triangle mesh.`);
  }
  const bounds = engine.widget.getBoundingBox(true);
  const dimensions = [
    bounds.max.x - bounds.min.x,
    bounds.max.y - bounds.min.y,
    bounds.max.z - bounds.min.z,
  ];
  if (dimensions.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new TypeError(`STL file "${file.name}" has invalid model dimensions: ${dimensions.join(" × ")}.`);
  }
  return Object.freeze({
    engine,
    model: Object.freeze({ name: file.name, bytes: file.size, triangles: position.count / 3 }),
  });
}

async function loadModel(file) {
  assertStlFile(file);
  clearResult();
  showStatus("working", "…", "Reading model", `${file.name} stays on this Chromebook.`, 0.04);
  const sourceBuffer = await file.arrayBuffer();
  const parsed = await parseModel(file, sourceBuffer);
  updateState({ engine: parsed.engine, model: parsed.model, sourceBuffer, result: null });
  elements.emptyState.hidden = true;
  elements.viewerToolbar.hidden = false;
  elements.modelStats.hidden = false;
  updateModelDisplay();

  const machineKey = elements.printerSelect.value;
  if (machineKey) {
    const problem = fitProblem(currentBounds(), machineForKey(machineKey));
    if (problem) {
      showStatus("error", "!", "Model does not fit", problem, Number.NaN);
      return;
    }
  }
  showStatus("success", "✓", "Model ready", "Drag the preview to inspect it, rotate if needed, then choose Slice model.", Number.NaN);
}

async function resetModel() {
  if (!state.model || !state.sourceBuffer) {
    throw new Error("Load a model before resetting it.");
  }
  clearResult();
  showStatus("working", "…", "Resetting model", "Restoring the original orientation and scale.", 0.1);
  const syntheticFile = new File([state.sourceBuffer], state.model.name, { type: "model/stl" });
  const parsed = await parseModel(syntheticFile, state.sourceBuffer);
  updateState({ engine: parsed.engine, model: Object.freeze({ ...parsed.model, bytes: state.model.bytes }), result: null });
  updateModelDisplay();
  showStatus("success", "✓", "Model reset", "The original STL orientation has been restored.", Number.NaN);
}

function rotateModel(x, y, z) {
  if (!state.engine) {
    showToast("Load an STL before rotating it.");
    return;
  }
  clearResult();
  state.engine.rotate(x, y, z);
  updateModelDisplay();
  const machineKey = elements.printerSelect.value;
  const problem = machineKey ? fitProblem(currentBounds(), machineForKey(machineKey)) : null;
  if (!problem) {
    showStatus("success", "✓", "Orientation updated", "Check that the widest flat face is on the build plate.", Number.NaN);
  }
}

function stageProgress(event) {
  if (event.slice && Number.isFinite(event.slice.update)) {
    return Object.freeze({ progress: 0.08 + event.slice.update * 0.48, message: event.slice.message || "Building layers" });
  }
  if (event.prepare && Number.isFinite(event.prepare.update)) {
    return Object.freeze({ progress: 0.58 + event.prepare.update * 0.30, message: "Planning print paths" });
  }
  if (event.export && event.export.segment) {
    return Object.freeze({ progress: 0.92, message: "Writing G-code" });
  }
  return null;
}

function validateGcode(gcode, machine) {
  const bytes = new Blob([gcode]).size;
  if (bytes < 1000) {
    throw new Error(`Generated G-code is unexpectedly small (${bytes} bytes). Export was stopped.`);
  }
  const unresolved = gcode.match(/\{(?:if|elsif|else|endif)\b|\[(?:bed_temperature|nozzle_temperature|initial_|overall_|total_layer_count|max_)/i);
  if (unresolved) {
    throw new Error(`Generated G-code contains unresolved profile token "${unresolved[0]}". Export was stopped.`);
  }
  const invalidValue = gcode
    .split(/\r?\n/)
    .find((line) => !line.trimStart().startsWith(";") && /\b(?:NaN|undefined)\b/.test(line));
  if (invalidValue) {
    throw new Error(`Generated G-code contains an invalid value in "${invalidValue.trim().slice(0, 180)}". Export was stopped.`);
  }
  const required = [
    [/(?:^|\n)G28\b/m, "homing command G28"],
    [/(?:^|\n)M83\b/m, "relative extrusion command M83"],
    [/(?:^|\n)G[01]\b[^\n]*\bE-?\d/m, "extrusion movement"],
    [machine.key === "h2s" ? /machine: H2S/i : /machine: P1S/i, `${machine.name} identity`],
  ];
  const missing = required.filter(([pattern]) => !pattern.test(gcode)).map(([, label]) => label);
  if (missing.length) {
    throw new Error(`Generated G-code is missing ${missing.join(", ")}. Export was stopped.`);
  }
  return bytes;
}

function layerCountFromGcode(gcode) {
  const totals = [...gcode.matchAll(/layer num\/total_layer_count:\s*\d+\/(\d+)/gi)]
    .map((match) => Number.parseInt(match[1], 10))
    .filter(Number.isFinite);
  if (totals.length) return Math.max(...totals);
  const markers = gcode.match(/(?:^|\n);\s*(?:change_layer|layer\b)/gi);
  return markers ? markers.length : 0;
}

async function sliceModel() {
  if (!state.engine || !state.model) {
    throw new Error("Load an STL before slicing.");
  }
  const machineKey = elements.printerSelect.value;
  if (!machineKey) {
    throw new Error("Choose the exact printer model before slicing.");
  }
  const machine = machineForKey(machineKey);
  const bounds = currentBounds();
  const problem = fitProblem(bounds, machine);
  if (problem) throw new RangeError(problem);

  const materialKey = selectedMaterialKey();
  const qualityKey = elements.qualitySelect.value;
  const infill = Number.parseInt(elements.infillRange.value, 10);
  const profileSources = await state.profileSourcesPromise;
  const device = createDevice(machineKey, materialKey, bounds, profileSources);
  const process = createProcess(materialKey, qualityKey, infill, elements.supportsToggle.checked, elements.brimToggle.checked);
  let exportMetadata = null;
  state.engine
    .setDevice(device)
    .setProcess(process)
    .setController({ threaded: true })
    .setListener((event) => {
      if (event.export?.done) exportMetadata = event.export.done;
      const stage = stageProgress(event);
      if (stage) showStatus("working", "…", "Slicing on this Chromebook", stage.message, stage.progress);
    });

  setBusy(true);
  showStatus("working", "…", "Slicing on this Chromebook", "Building model layers. Large files may take a few minutes.", 0.05);
  try {
    await state.engine.slice();
    showStatus("working", "…", "Slicing on this Chromebook", "Planning print paths.", 0.58);
    await state.engine.prepare();
    showStatus("working", "…", "Slicing on this Chromebook", "Writing and checking G-code.", 0.90);
    const gcode = await state.engine.export();
    const bytes = validateGcode(gcode, machine);
    const material = materialForKey(materialKey);
    const quality = qualityForKey(qualityKey);
    const result = Object.freeze({
      bytes,
      gcode,
      layers: layerCountFromGcode(gcode),
      machine,
      material,
      metadata: exportMetadata,
      quality,
    });
    updateState({ result });
    elements.resultLayers.textContent = result.layers ? result.layers.toLocaleString() : "Ready";
    elements.resultBytes.textContent = formattedBytes(result.bytes);
    elements.resultProfile.textContent = `${material.code} · ${quality.layerHeight.toFixed(2)}`;
    elements.resultCard.hidden = false;
    elements.exportButton.hidden = false;
    showStatus("success", "✓", "G-code ready", `Checked for ${machine.name}. Download it, then have your teacher verify the first test file.`, Number.NaN);
  } finally {
    setBusy(false);
  }
}

function downloadResult() {
  if (!state.result || !state.model) {
    throw new Error("Slice a model before downloading G-code.");
  }
  const supports = elements.supportsToggle.checked ? "supports" : "no-supports";
  const filename = `${filenameBase(state.model.name)}-${state.result.machine.key}-${state.result.material.key}-${supports}.gcode`;
  const blob = new Blob([state.result.gcode], { type: "text/x-gcode;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showStatus("success", "↓", "G-code downloaded", `${filename} is ready in your Downloads folder.`, Number.NaN);
}

function handleError(error, action) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("3D printing lab action failed", { action, message, error });
  showStatus("error", "!", `${action} failed`, message, Number.NaN);
  showToast(message);
}

function handleFile(file) {
  loadModel(file).catch((error) => handleError(error, "Model import"));
}

function markSettingsChanged() {
  clearResult();
  if (state.model) {
    showStatus("", "2", "Settings changed", "Choose Slice model to create updated G-code.", Number.NaN);
  }
}

function updatePrinter() {
  clearResult();
  const machineKey = elements.printerSelect.value;
  if (!machineKey) {
    elements.bedLabel.textContent = "Choose a printer to see its build plate";
    elements.sliceButton.disabled = true;
    showStatus("", "1", "Confirm the printer", "“H1S” is not a Bambu Lab model. Select the model printed on your machine.", Number.NaN);
    return;
  }
  const machine = machineForKey(machineKey);
  preview.setBed(machine);
  elements.bedLabel.textContent = `${machine.name} · ${machine.width} × ${machine.depth} × ${machine.height} mm`;
  if (!state.model) {
    showStatus("", "2", "Load an STL", "Drop a model into the preview or choose a file from your Chromebook.", Number.NaN);
  } else {
    const problem = fitProblem(currentBounds(), machine);
    showStatus(
      problem ? "error" : "success",
      problem ? "!" : "✓",
      problem ? "Model does not fit" : "Printer confirmed",
      problem || `${machine.name} profile selected. Choose Slice model when the settings look right.`,
      Number.NaN,
    );
  }
  refreshSliceReadiness();
}

function registerOfflineApp() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("service-worker.js", { scope: "./", updateViaCache: "none" })
    .then(() => navigator.serviceWorker.ready)
    .then(() => { elements.localBadgeText.textContent = "Ready offline"; })
    .catch((error) => {
      console.warn("Offline cache registration failed", { error: error.message });
      elements.localBadgeText.textContent = "Local processing";
    });
}

elements.chooseFileButton.addEventListener("click", () => elements.modelFile.click());
elements.modelFile.addEventListener("change", () => {
  const file = elements.modelFile.files?.[0];
  if (file) handleFile(file);
  elements.modelFile.value = "";
});
elements.dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.dropZone.classList.add("dragging");
});
elements.dropZone.addEventListener("dragleave", () => elements.dropZone.classList.remove("dragging"));
elements.dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  elements.dropZone.classList.remove("dragging");
  const file = event.dataTransfer?.files?.[0];
  if (file) handleFile(file);
});
elements.printerSelect.addEventListener("change", updatePrinter);
elements.infillRange.addEventListener("input", () => {
  elements.infillOutput.value = `${elements.infillRange.value}%`;
  markSettingsChanged();
});
elements.qualitySelect.addEventListener("change", markSettingsChanged);
elements.supportsToggle.addEventListener("change", markSettingsChanged);
elements.brimToggle.addEventListener("change", markSettingsChanged);
document.querySelectorAll('input[name="material"]').forEach((input) => input.addEventListener("change", markSettingsChanged));
elements.rotateXButton.addEventListener("click", () => rotateModel(Math.PI / 2, 0, 0));
elements.rotateYButton.addEventListener("click", () => rotateModel(0, Math.PI / 2, 0));
elements.rotateZButton.addEventListener("click", () => rotateModel(0, 0, Math.PI / 2));
elements.resetModelButton.addEventListener("click", () => resetModel().catch((error) => handleError(error, "Model reset")));
elements.sliceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sliceModel().catch((error) => handleError(error, "Slicing"));
});
elements.exportButton.addEventListener("click", () => {
  try {
    downloadResult();
  } catch (error) {
    handleError(error, "Download");
  }
});

registerOfflineApp();
preview.resize();
