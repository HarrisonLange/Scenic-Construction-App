const PROFILE_REVISION = "Bambu Studio 9a530f7 · Kiri:Moto d138275";

const HARDENED_STEEL_NOZZLE = Object.freeze({
  diameter: 0.4,
  extruderType: "Direct Drive",
  extruderVariant: "Direct Drive Standard",
  type: "hardened_steel",
  volumeType: "Standard",
});

const MACHINES = Object.freeze({
  h2s: Object.freeze({
    key: "h2s",
    name: "Bambu Lab H2S",
    nozzle: HARDENED_STEEL_NOZZLE,
    width: 340,
    depth: 320,
    height: 340,
  }),
  p1s: Object.freeze({
    key: "p1s",
    name: "Bambu Lab P1S",
    nozzle: HARDENED_STEEL_NOZZLE,
    width: 256,
    depth: 256,
    height: 256,
  }),
});

const MATERIALS = Object.freeze({
  pla: Object.freeze({
    key: "pla",
    name: "Generic PLA",
    code: "PLA",
    filamentId: "GFL99",
    nozzle: 220,
    bed: 55,
    fan: 255,
    flow: 0.98,
    maxFlow: 12,
    density: 1.24,
    vitrification: 45,
  }),
  petg: Object.freeze({
    key: "petg",
    name: "Generic PETG",
    code: "PETG",
    filamentId: "GFG99",
    nozzle: 255,
    bed: 70,
    fan: 190,
    flow: 0.95,
    maxFlow: 12,
    density: 1.27,
    vitrification: 70,
  }),
});

const QUALITIES = Object.freeze({
  draft: Object.freeze({ key: "draft", name: "Draft", layerHeight: 0.28, firstLayerHeight: 0.28 }),
  standard: Object.freeze({ key: "standard", name: "Standard", layerHeight: 0.20, firstLayerHeight: 0.24 }),
  fine: Object.freeze({ key: "fine", name: "Fine", layerHeight: 0.16, firstLayerHeight: 0.20 }),
});

class ProfileLoadError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProfileLoadError";
  }
}

class TemplateRenderError extends Error {
  constructor(message) {
    super(message);
    this.name = "TemplateRenderError";
  }
}

function requireRecord(record, key, recordName) {
  const value = record[key];
  if (!value) {
    throw new RangeError(`Unknown ${recordName} "${key}".`);
  }
  return value;
}

async function fetchJsonAttempt(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    const responseBody = await response.text();
    throw new ProfileLoadError(`Could not load profile ${url}. HTTP ${response.status}. Response: ${responseBody.slice(0, 300)}`);
  }
  try {
    return await response.json();
  } catch (error) {
    throw new ProfileLoadError(`Profile ${url} is not valid JSON. ${error.message}`);
  }
}

async function fetchJsonWithRetries(url, attempts) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchJsonAttempt(url);
    } catch (error) {
      lastError = error;
      console.warn("Profile request failed", { url, attempt, attempts, error: error.message });
    }
  }
  throw lastError;
}

async function fetchBytesAttempt(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    const responseBody = await response.text();
    throw new ProfileLoadError(`Could not load package asset ${url}. HTTP ${response.status}. Response: ${responseBody.slice(0, 300)}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function fetchBytesWithRetries(url, attempts) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchBytesAttempt(url);
    } catch (error) {
      lastError = error;
      console.warn("Package asset request failed", { url, attempt, attempts, error: error.message });
    }
  }
  throw lastError;
}

async function loadProfileSources() {
  const [h2sStart, h2sEnd, h2sProjectSettings, p1s, p1sProjectSettings, packageThumbnail, packageThumbnailSmall] = await Promise.all([
    fetchJsonWithRetries("vendor/profiles/h2s-start.json", 3),
    fetchJsonWithRetries("vendor/profiles/h2s-end.json", 3),
    fetchJsonWithRetries("vendor/profiles/h2s-project-settings.json", 3),
    fetchJsonWithRetries("vendor/profiles/p1s.json", 3),
    fetchJsonWithRetries("vendor/profiles/p1s-project-settings.json", 3),
    fetchBytesWithRetries("assets/package-thumbnail-512.png", 3),
    fetchBytesWithRetries("assets/package-thumbnail-128.png", 3),
  ]);
  return Object.freeze({ h2sStart, h2sEnd, h2sProjectSettings, p1s, p1sProjectSettings, packageThumbnail, packageThumbnailSmall });
}

function evaluateTemplateExpression(expression, context) {
  const names = Object.keys(context);
  const values = names.map((name) => context[name]);
  try {
    const evaluator = Function(...names, `"use strict"; return (${expression});`);
    const result = evaluator(...values);
    if (result === undefined || Number.isNaN(result)) {
      throw new TypeError(`Expression returned ${String(result)}.`);
    }
    return result;
  } catch (error) {
    throw new TemplateRenderError(`Could not evaluate trusted Bambu profile expression "${expression}". ${error.message}`);
  }
}

function currentConditionalState(stack) {
  return stack.length === 0 ? true : stack[stack.length - 1].active;
}

function renderConditionalBlocks(template, context) {
  const tokenPattern = /\{(if|elsif)([\s\S]*?)\}|\{(else|endif)\}/g;
  const stack = [];
  const output = [];
  let cursor = 0;
  let match = tokenPattern.exec(template);

  while (match) {
    if (currentConditionalState(stack)) {
      output.push(template.slice(cursor, match.index));
    }

    const branch = match[1] || match[3];
    if (branch === "if") {
      const parentActive = currentConditionalState(stack);
      const condition = parentActive ? Boolean(evaluateTemplateExpression(match[2].trim(), context)) : false;
      stack.push({ parentActive, branchMatched: condition, active: parentActive && condition });
    } else if (branch === "elsif") {
      if (stack.length === 0) {
        throw new TemplateRenderError("Bambu profile contains an elsif block without a matching if block.");
      }
      const previous = stack.pop();
      const condition = previous.parentActive && !previous.branchMatched
        ? Boolean(evaluateTemplateExpression(match[2].trim(), context))
        : false;
      stack.push({
        parentActive: previous.parentActive,
        branchMatched: previous.branchMatched || condition,
        active: previous.parentActive && !previous.branchMatched && condition,
      });
    } else if (branch === "else") {
      if (stack.length === 0) {
        throw new TemplateRenderError("Bambu profile contains an else block without a matching if block.");
      }
      const previous = stack.pop();
      stack.push({
        parentActive: previous.parentActive,
        branchMatched: true,
        active: previous.parentActive && !previous.branchMatched,
      });
    } else if (branch === "endif") {
      if (stack.length === 0) {
        throw new TemplateRenderError("Bambu profile contains an endif block without a matching if block.");
      }
      stack.pop();
    }

    cursor = tokenPattern.lastIndex;
    match = tokenPattern.exec(template);
  }

  if (stack.length !== 0) {
    throw new TemplateRenderError(`Bambu profile contains ${stack.length} unclosed conditional block(s).`);
  }
  output.push(template.slice(cursor));
  return output.join("");
}

function renderValueExpressions(template, context) {
  const curlyRendered = template.replace(/\{([^{}\n]+)\}/g, (token, expression) => {
    return String(evaluateTemplateExpression(expression.trim(), context));
  });
  return curlyRendered.replace(/\[([A-Za-z_][A-Za-z0-9_]*)\]/g, (token, expression) => {
    return String(evaluateTemplateExpression(expression, context));
  });
}

function renderBambuTemplate(template, context, sourceName) {
  const conditionalRendered = renderConditionalBlocks(template, context);
  const rendered = renderValueExpressions(conditionalRendered, context);
  const unresolved = rendered.match(/\{[^\n]*\}|\[[A-Za-z_][A-Za-z0-9_]*\]/);
  if (unresolved) {
    throw new TemplateRenderError(`Profile ${sourceName} still contains unresolved token "${unresolved[0]}".`);
  }
  return rendered.split(/\r?\n/);
}

function isSectionHeader(line) {
  return /^;=+.+?=+\s*$/.test(line.trim());
}

function isBedLevelingSectionStart(line) {
  return /^;=+\s*bed leveling\s*=+\s*$/i.test(line.trim());
}

function isBedLevelingSectionEnd(line) {
  return /^;=+\s*bed leveling end\s*=+\s*$/i.test(line.trim());
}

function isActiveBedLevelingDirective(line) {
  const command = line.trim();
  if (!command || command.startsWith(";")) return false;
  return /^G29(?:\s|$)/i.test(command)
    || /^G29\.20(?:\s|$)/i.test(command)
    || /^M1002\s+judge_flag\s+g29_before_print_flag(?:\s|$)/i.test(command)
    || /^M1002\s+gcode_claim_action\s*:\s*1(?:\s*;|\s*$)/i.test(command);
}

function removeAutomaticBedLeveling(lines, sourceName) {
  if (!Array.isArray(lines)) {
    throw new TypeError(`Profile ${sourceName} start G-code must be an array of lines.`);
  }

  const filtered = [];
  let removingLevelingSection = false;
  let simplifyingHomeSection = false;
  let removedLevelingSection = false;

  for (const line of lines) {
    if (typeof line !== "string") {
      throw new TypeError(`Profile ${sourceName} start G-code contains a non-string line.`);
    }

    if (removingLevelingSection) {
      if (isBedLevelingSectionEnd(line)) {
        removingLevelingSection = false;
        continue;
      }
      if (!isSectionHeader(line)) continue;
      removingLevelingSection = false;
    }

    if (isBedLevelingSectionStart(line)) {
      removingLevelingSection = true;
      removedLevelingSection = true;
      continue;
    }

    const normalized = line.trim().toLowerCase();
    if (/^;=+\s*home after wipe mouth\s*=+\s*$/.test(normalized)) {
      simplifyingHomeSection = true;
      filtered.push(line);
      continue;
    }
    if (/^;=+\s*home after wipe mouth end\s*=+\s*$/.test(normalized)) {
      simplifyingHomeSection = false;
      filtered.push(line);
      continue;
    }
    if (simplifyingHomeSection && (
      /g29_before_print_flag/i.test(line)
      || /^\s*M622\s+J0(?:\s|$)/i.test(line)
      || /^\s*M623(?:\s|$)/i.test(line)
    )) {
      continue;
    }

    filtered.push(line);
  }

  if (removingLevelingSection) {
    throw new TemplateRenderError(`Profile ${sourceName} contains an unclosed automatic bed-leveling section.`);
  }
  if (simplifyingHomeSection) {
    throw new TemplateRenderError(`Profile ${sourceName} contains an unclosed post-wipe homing section.`);
  }
  if (!removedLevelingSection) {
    throw new TemplateRenderError(`Profile ${sourceName} does not contain the expected automatic bed-leveling section.`);
  }
  const activeDirective = filtered.find(isActiveBedLevelingDirective);
  if (activeDirective) {
    throw new TemplateRenderError(`Profile ${sourceName} still contains active bed-leveling directive "${activeDirective.trim()}".`);
  }
  return filtered;
}

function createTemplateContext(material, bounds) {
  const printMin = [
    Math.max(0, (340 - bounds.x) / 2),
    Math.max(0, (320 - bounds.y) / 2),
  ];
  return Object.freeze({
    bed_temperature_initial_layer_single: material.bed,
    cooling_filter_enabled: false,
    curr_bed_type: "Textured PEI Plate",
    filament_max_volumetric_speed: [material.maxFlow],
    filament_type: [material.code],
    first_layer_print_min: printMin,
    first_layer_print_size: [bounds.x, bounds.y],
    flush_temperatures: [material.nozzle],
    flush_volumetric_speeds: [material.maxFlow],
    has_tpu_in_first_layer: false,
    initial_no_support_extruder: 0,
    is_all_bbl_filament: false,
    max_layer_z: bounds.z,
    max_print_z: bounds.z,
    min_vitrification_temperature: material.vitrification,
    nozzle_diameter: [HARDENED_STEEL_NOZZLE.diameter],
    nozzle_temperature: [material.nozzle],
    nozzle_temperature_initial_layer: [material.nozzle],
    overall_chamber_temperature: 0,
  });
}

function buildH2sDevice(profileSources, material, bounds) {
  const context = createTemplateContext(material, bounds);
  const startTemplate = profileSources.h2sStart.machine_start_gcode;
  const endTemplate = profileSources.h2sEnd.machine_end_gcode;
  if (typeof startTemplate !== "string" || typeof endTemplate !== "string") {
    throw new ProfileLoadError("The H2S profile JSON is missing machine_start_gcode or machine_end_gcode.");
  }
  const profileHeader = [
    "; SDSCPA 3D Printing Lab",
    `; Profile sources: ${PROFILE_REVISION}`,
    `; Printer: Bambu Lab H2S 0.4 mm | Material: ${material.name}`,
    "; Filament source: AMS (automatic slot mapping)",
    "; Automatic bed leveling: disabled",
  ];
  const startGcode = renderBambuTemplate(startTemplate, context, "H2S start");
  return Object.freeze({
    mode: "FDM",
    internal: 0,
    bedHeight: 2.5,
    bedWidth: 340,
    bedDepth: 320,
    bedRound: false,
    maxHeight: 340,
    originCenter: false,
    extrudeAbs: false,
    gcodeFan: ["M106 P1 S{fan_speed}"],
    gcodeTrack: ["M73 P{progress}"],
    gcodeLayer: [
      "; layer num/total_layer_count: {layer}/{layers}",
      "M73 L{layer}",
      "M991 S0 P{layer-1} ; notify layer change",
    ],
    gcodePre: [...profileHeader, ...removeAutomaticBedLeveling(startGcode, "H2S start")],
    gcodePost: renderBambuTemplate(endTemplate, context, "H2S end"),
    gcodeFExt: "gcode",
    gcodeTime: 1,
    deviceName: "Bambu Lab H2S 0.4 hardened steel nozzle",
    extruders: [{ extFilament: 1.75, extNozzle: HARDENED_STEEL_NOZZLE.diameter, extOffsetX: 0, extOffsetY: 0 }],
  });
}

function buildP1sDevice(profileSources, material) {
  const source = profileSources.p1s;
  if (!Array.isArray(source.gcodePre) || !Array.isArray(source.gcodePost)) {
    throw new ProfileLoadError("The P1S profile JSON is missing gcodePre or gcodePost.");
  }
  return Object.freeze({
    ...source,
    deviceName: "Bambu Lab P1S 0.4 hardened steel nozzle",
    gcodePre: [
      "; SDSCPA 3D Printing Lab",
      `; Profile sources: ${PROFILE_REVISION}`,
      `; Printer: Bambu Lab P1S 0.4 mm | Material: ${material.name}`,
      "; Filament source: AMS (automatic slot mapping)",
      "; Automatic bed leveling: disabled",
      ...removeAutomaticBedLeveling(source.gcodePre, "P1S start"),
    ],
  });
}

function createDevice(machineKey, materialKey, bounds, profileSources) {
  const machine = requireRecord(MACHINES, machineKey, "machine");
  const material = requireRecord(MATERIALS, materialKey, "material");
  return machine.key === "h2s"
    ? buildH2sDevice(profileSources, material, bounds)
    : buildP1sDevice(profileSources, material);
}

function createProcess(materialKey, qualityKey, infillPercent, supportsEnabled, brimEnabled) {
  const material = requireRecord(MATERIALS, materialKey, "material");
  const quality = requireRecord(QUALITIES, qualityKey, "quality");
  if (!Number.isFinite(infillPercent) || infillPercent < 5 || infillPercent > 40) {
    throw new RangeError(`Infill must be from 5 to 40 percent. Received ${String(infillPercent)}.`);
  }
  return Object.freeze({
    processName: `${quality.name} ${material.code}`,
    sliceHeight: quality.layerHeight,
    firstSliceHeight: quality.firstLayerHeight,
    sliceLineWidth: 0.42,
    sliceShells: 3,
    sliceShellOrder: "in-out",
    sliceBottomLayers: 3,
    sliceTopLayers: 4,
    sliceFillSparse: infillPercent / 100,
    sliceFillType: "gyroid",
    sliceFillAngle: 45,
    sliceFillOverlap: 0.18,
    sliceFillRepeat: 1,
    sliceDetectThin: "basic",
    sliceSupportType: supportsEnabled ? "automatic" : "disabled",
    sliceSupportTree: false,
    sliceSupportAngle: 50,
    sliceSupportDensity: 0.15,
    sliceSupportOffset: 0.5,
    sliceSupportGap: true,
    sliceSupportOutline: true,
    outputTemp: material.nozzle,
    firstLayerNozzleTemp: material.nozzle,
    outputBedTemp: material.bed,
    firstLayerBedTemp: material.bed,
    outputFanSpeed: material.fan,
    firstLayerFanSpeed: 0,
    outputFanLayer: material.key === "pla" ? 2 : 3,
    outputFeedrate: 110,
    outputFinishrate: 80,
    outputSeekrate: 300,
    firstLayerRate: 35,
    firstLayerFillRate: 45,
    outputShellMult: material.flow,
    outputFillMult: material.flow,
    outputSparseMult: material.flow,
    outputMaxFlowrate: material.maxFlow,
    outputRetractDist: 0.8,
    outputRetractSpeed: 35,
    outputRetractWipe: 0,
    outputMinLayerTime: 8,
    outputMinSpeed: 10,
    outputAvoidGaps: true,
    outputBrimCount: brimEnabled ? 6 : 0,
    outputBrimOffset: 0.2,
    firstLayerBrim: brimEnabled ? 5 : 0,
    firstLayerBrimGap: 0,
    outputRaft: false,
    zHopDistance: 0.2,
    ranges: [],
  });
}

function machineForKey(machineKey) {
  return requireRecord(MACHINES, machineKey, "machine");
}

function materialForKey(materialKey) {
  return requireRecord(MATERIALS, materialKey, "material");
}

function qualityForKey(qualityKey) {
  return requireRecord(QUALITIES, qualityKey, "quality");
}

export {
  MACHINES,
  MATERIALS,
  QUALITIES,
  createDevice,
  createProcess,
  loadProfileSources,
  machineForKey,
  materialForKey,
  removeAutomaticBedLeveling,
  qualityForKey,
};
