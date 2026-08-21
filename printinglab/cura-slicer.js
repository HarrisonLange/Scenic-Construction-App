import { CuraWASM } from "./vendor/cura/cura-wasm.js";

const TEXT_DECODER = new TextDecoder();
const MACHINE_START_MARKER = "; SDSCPA_MACHINE_START_GCODE";
const MACHINE_END_MARKER = "; SDSCPA_MACHINE_END_GCODE";

function curaOverride(key, value) {
  return Object.freeze({ key, value });
}

function curaExtruderOverride(key, value) {
  return Object.freeze({ key, scope: "e0", value });
}

function transformedCoordinate(position, offset, matrix) {
  const x = position.getX(offset);
  const y = position.getY(offset);
  const z = position.getZ(offset);
  return Object.freeze({
    x: matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    y: matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    z: matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  });
}

function triangleNormal(a, b, c) {
  const ab = Object.freeze({ x: b.x - a.x, y: b.y - a.y, z: b.z - a.z });
  const ac = Object.freeze({ x: c.x - a.x, y: c.y - a.y, z: c.z - a.z });
  const normal = Object.freeze({
    x: ab.y * ac.z - ab.z * ac.y,
    y: ab.z * ac.x - ab.x * ac.z,
    z: ab.x * ac.y - ab.y * ac.x,
  });
  const length = Math.hypot(normal.x, normal.y, normal.z);
  if (!Number.isFinite(length) || length === 0) {
    throw new TypeError("The transformed STL contains a degenerate triangle.");
  }
  return Object.freeze({ x: normal.x / length, y: normal.y / length, z: normal.z / length });
}

function geometryTriangles(mesh) {
  if (!mesh?.geometry?.attributes?.position) {
    throw new TypeError("A parsed triangle mesh is required for local slicing.");
  }
  if (mesh.parent) mesh.parent.updateMatrixWorld(true);
  mesh.updateMatrixWorld(true);
  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const index = geometry.index;
  const vertexCount = index ? index.count : position.count;
  if (vertexCount < 3 || vertexCount % 3 !== 0) {
    throw new TypeError(`The transformed STL has an invalid vertex count: ${String(vertexCount)}.`);
  }
  const matrix = mesh.matrixWorld.elements;
  const triangles = [];
  for (let offset = 0; offset < vertexCount; offset += 3) {
    const indices = index
      ? [index.getX(offset), index.getX(offset + 1), index.getX(offset + 2)]
      : [offset, offset + 1, offset + 2];
    triangles.push(Object.freeze(indices.map((vertexIndex) => transformedCoordinate(position, vertexIndex, matrix))));
  }
  return triangles;
}

function writeVector(view, offset, vector, zOffset) {
  view.setFloat32(offset, vector.x, true);
  view.setFloat32(offset + 4, vector.y, true);
  view.setFloat32(offset + 8, vector.z + zOffset, true);
}

function serializeMeshToBinaryStl(mesh) {
  const triangles = geometryTriangles(mesh);
  let minimumZ = Number.POSITIVE_INFINITY;
  triangles.forEach((triangle) => {
    triangle.forEach((vertex) => {
      minimumZ = Math.min(minimumZ, vertex.z);
    });
  });
  if (!Number.isFinite(minimumZ)) {
    throw new TypeError("The transformed STL has an invalid Z position.");
  }
  const zOffset = -minimumZ;
  const buffer = new ArrayBuffer(84 + triangles.length * 50);
  const header = new TextEncoder().encode("SDSCPA local CuraEngine tree-support input");
  new Uint8Array(buffer, 0, Math.min(80, header.length)).set(header.subarray(0, 80));
  const view = new DataView(buffer);
  view.setUint32(80, triangles.length, true);
  triangles.forEach((triangle, triangleIndex) => {
    const offset = 84 + triangleIndex * 50;
    writeVector(view, offset, triangleNormal(triangle[0], triangle[1], triangle[2]), 0);
    writeVector(view, offset + 12, triangle[0], zOffset);
    writeVector(view, offset + 24, triangle[1], zOffset);
    writeVector(view, offset + 36, triangle[2], zOffset);
    view.setUint16(offset + 48, 0, true);
  });
  return buffer;
}

function createCuraOverrides(machine, material, quality, infillPercent, supportsEnabled, brimEnabled) {
  if (!Number.isFinite(infillPercent) || infillPercent < 5 || infillPercent > 30) {
    throw new RangeError(`Infill must be from 5 to 30 percent. Received ${String(infillPercent)}.`);
  }
  const fanPercent = Math.round(material.fan / 255 * 100);
  return Object.freeze([
    curaOverride("machine_width", machine.width),
    curaOverride("machine_depth", machine.depth),
    curaOverride("machine_height", machine.height),
    curaOverride("machine_nozzle_size", machine.nozzle.diameter),
    curaOverride("machine_gcode_flavor", "RepRap (Marlin/Sprinter)"),
    curaOverride("machine_start_gcode", MACHINE_START_MARKER),
    curaOverride("machine_end_gcode", MACHINE_END_MARKER),
    curaOverride("layer_height", quality.layerHeight),
    curaOverride("layer_height_0", quality.firstLayerHeight),
    curaOverride("line_width", 0.42),
    curaOverride("wall_line_width", 0.42),
    curaOverride("wall_line_count", 3),
    curaOverride("bottom_layers", 3),
    curaOverride("top_layers", 4),
    curaOverride("infill_sparse_density", infillPercent),
    curaOverride("infill_pattern", "gyroid"),
    curaOverride("speed_print", 110),
    curaOverride("speed_wall_0", 80),
    curaOverride("speed_travel", 300),
    curaOverride("speed_layer_0", 35),
    curaOverride("relative_extrusion", true),
    curaOverride("support_enable", supportsEnabled),
    curaOverride("support_structure", "tree"),
    curaOverride("support_type", "buildplate"),
    curaOverride("support_angle", 50),
    curaOverride("support_tree_angle", 40),
    curaOverride("support_tree_branch_distance", 1),
    curaOverride("support_tree_branch_diameter", 2),
    curaOverride("support_tree_branch_diameter_angle", 5),
    curaOverride("support_tree_collision_resolution", 0.2),
    curaOverride("support_interface_enable", true),
    curaOverride("support_roof_enable", true),
    curaOverride("support_z_distance", quality.layerHeight),
    curaOverride("support_xy_distance", 0.5),
    curaOverride("adhesion_type", brimEnabled ? "brim" : "none"),
    curaOverride("brim_width", 5),
    curaExtruderOverride("material_diameter", 1.75),
    curaExtruderOverride("material_flow", material.flow * 100),
    curaExtruderOverride("material_flow_layer_0", material.flow * 100),
    curaExtruderOverride("material_print_temperature", material.nozzle),
    curaExtruderOverride("material_print_temperature_layer_0", material.nozzle),
    curaExtruderOverride("material_initial_print_temperature", material.nozzle),
    curaExtruderOverride("material_final_print_temperature", material.nozzle),
    curaExtruderOverride("material_bed_temperature", material.bed),
    curaExtruderOverride("material_bed_temperature_layer_0", material.bed),
    curaExtruderOverride("cool_fan_speed", fanPercent),
    curaExtruderOverride("cool_fan_speed_0", 0),
    curaExtruderOverride("cool_fan_full_layer", material.key === "pla" ? 2 : 3),
    curaExtruderOverride("cool_min_layer_time", 8),
    curaExtruderOverride("retraction_amount", 0.8),
    curaExtruderOverride("retraction_speed", 35),
    curaExtruderOverride("retraction_hop", 0.2),
  ]);
}

function replaceMachineMarker(gcode, marker, replacement, label) {
  const markerCount = gcode.split(marker).length - 1;
  if (markerCount !== 1) {
    throw new Error(`CuraEngine G-code contains ${markerCount} ${label} markers; exactly one is required.`);
  }
  return gcode.replace(marker, replacement);
}

function injectDeviceGcode(gcode, device) {
  if (!Array.isArray(device.gcodePre) || !device.gcodePre.length) {
    throw new TypeError("The selected printer profile is missing start G-code.");
  }
  if (!Array.isArray(device.gcodePost) || !device.gcodePost.length) {
    throw new TypeError("The selected printer profile is missing end G-code.");
  }
  const withStart = replaceMachineMarker(gcode, MACHINE_START_MARKER, device.gcodePre.join("\n"), "machine-start");
  return replaceMachineMarker(withStart, MACHINE_END_MARKER, device.gcodePost.join("\n"), "machine-end");
}

async function destroyLoadedSlicer(slicer) {
  if (!slicer.loaded) return;
  await slicer.destroy();
}

async function sliceWithCura(stlBuffer, overrides, progressListener) {
  const slicer = new CuraWASM({ overrides, transfer: true, verbose: false });
  slicer.on("progress", progressListener);
  let result;
  try {
    result = await slicer.slice(stlBuffer, "stl");
  } catch (error) {
    await destroyLoadedSlicer(slicer);
    throw error;
  }
  await destroyLoadedSlicer(slicer);
  if (!(result.gcode instanceof ArrayBuffer)) {
    throw new TypeError("Local CuraEngine slicing did not return a G-code buffer.");
  }
  const gcode = TEXT_DECODER.decode(result.gcode);
  if (gcode.length < 1000 || !/(?:^|\n);LAYER:0(?:\n|$)/.test(gcode)) {
    throw new Error(`Local CuraEngine returned invalid G-code (${gcode.length} characters).`);
  }
  return Object.freeze({ gcode, metadata: result.metadata });
}

export { createCuraOverrides, injectDeviceGcode, serializeMeshToBinaryStl, sliceWithCura };
