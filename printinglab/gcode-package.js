const TEXT_ENCODER = new TextEncoder();

const CRC32_TABLE = Object.freeze(Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  }
  return value >>> 0;
}));

const MD5_SHIFTS = Object.freeze([
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]);

const MD5_CONSTANTS = Object.freeze(Array.from(
  { length: 64 },
  (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0,
));

function encodedText(value) {
  return TEXT_ENCODER.encode(value);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function rotateLeft(value, shift) {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function md5Hex(bytes) {
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const bitLength = bytes.length * 8;
  const paddedView = new DataView(padded.buffer);
  paddedView.setUint32(paddedLength - 8, bitLength >>> 0, true);
  paddedView.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true);

  let hashA = 0x67452301;
  let hashB = 0xefcdab89;
  let hashC = 0x98badcfe;
  let hashD = 0x10325476;

  for (let offset = 0; offset < paddedLength; offset += 64) {
    const words = Array.from({ length: 16 }, (_, index) => paddedView.getUint32(offset + index * 4, true));
    let a = hashA;
    let b = hashB;
    let c = hashC;
    let d = hashD;

    for (let index = 0; index < 64; index += 1) {
      let value = 0;
      let wordIndex = 0;
      if (index < 16) {
        value = (b & c) | (~b & d);
        wordIndex = index;
      } else if (index < 32) {
        value = (d & b) | (~d & c);
        wordIndex = (5 * index + 1) % 16;
      } else if (index < 48) {
        value = b ^ c ^ d;
        wordIndex = (3 * index + 5) % 16;
      } else {
        value = c ^ (b | ~d);
        wordIndex = (7 * index) % 16;
      }
      const previousD = d;
      d = c;
      c = b;
      const sum = (a + value + MD5_CONSTANTS[index] + words[wordIndex]) >>> 0;
      b = (b + rotateLeft(sum, MD5_SHIFTS[index])) >>> 0;
      a = previousD;
    }

    hashA = (hashA + a) >>> 0;
    hashB = (hashB + b) >>> 0;
    hashC = (hashC + c) >>> 0;
    hashD = (hashD + d) >>> 0;
  }

  return [hashA, hashB, hashC, hashD]
    .flatMap((value) => [0, 8, 16, 24].map((shift) => ((value >>> shift) & 0xff).toString(16).padStart(2, "0")))
    .join("")
    .toUpperCase();
}

function localZipEntry(nameBytes, data, checksum) {
  const entry = new Uint8Array(30 + nameBytes.length + data.length);
  const view = new DataView(entry.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0x5c21, true);
  view.setUint32(14, checksum, true);
  view.setUint32(18, data.length, true);
  view.setUint32(22, data.length, true);
  view.setUint16(26, nameBytes.length, true);
  view.setUint16(28, 0, true);
  entry.set(nameBytes, 30);
  entry.set(data, 30 + nameBytes.length);
  return entry;
}

function centralZipEntry(nameBytes, dataLength, checksum, localOffset) {
  const entry = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(entry.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0x5c21, true);
  view.setUint32(16, checksum, true);
  view.setUint32(20, dataLength, true);
  view.setUint32(24, dataLength, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, localOffset, true);
  entry.set(nameBytes, 46);
  return entry;
}

function endOfCentralDirectory(fileCount, centralSize, centralOffset) {
  const entry = new Uint8Array(22);
  const view = new DataView(entry.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, fileCount, true);
  view.setUint16(10, fileCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);
  return entry;
}

function storedZip(files) {
  const localEntries = [];
  const centralEntries = [];
  let localOffset = 0;
  for (const file of files) {
    const nameBytes = encodedText(file.name);
    const data = typeof file.contents === "string" ? encodedText(file.contents) : file.contents;
    const checksum = crc32(data);
    const localEntry = localZipEntry(nameBytes, data, checksum);
    localEntries.push(localEntry);
    centralEntries.push(centralZipEntry(nameBytes, data.length, checksum, localOffset));
    localOffset += localEntry.length;
  }
  const centralSize = centralEntries.reduce((total, entry) => total + entry.length, 0);
  return new Blob(
    [...localEntries, ...centralEntries, endOfCentralDirectory(files.length, centralSize, localOffset)],
    { type: "model/3mf" },
  );
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function coordinate(value) {
  return Number(value.toFixed(5)).toString();
}

function contentTypes() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
 <Default Extension="png" ContentType="image/png"/>
 <Default Extension="gcode" ContentType="text/x.gcode"/>
</Types>`;
}

function rootRelationships() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}

function modelRelationships() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/3D/Objects/object_1.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
}

function gcodeRelationships() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/Metadata/plate_1.gcode" Id="rel-1" Type="http://schemas.bambulab.com/package/2021/gcode"/>
</Relationships>`;
}

function objectModel(bounds) {
  const x = coordinate(bounds.x / 2);
  const y = coordinate(bounds.y / 2);
  const z = coordinate(bounds.z / 2);
  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p">
 <metadata name="BambuStudio:3mfVersion">1</metadata>
 <resources>
  <object id="1" p:UUID="00010000-81cb-4c03-9d28-80fed5dfa1dc" type="model">
   <mesh>
    <vertices>
     <vertex x="-${x}" y="-${y}" z="-${z}"/><vertex x="${x}" y="${y}" z="-${z}"/><vertex x="${x}" y="-${y}" z="-${z}"/><vertex x="-${x}" y="${y}" z="-${z}"/>
     <vertex x="-${x}" y="-${y}" z="${z}"/><vertex x="${x}" y="-${y}" z="${z}"/><vertex x="${x}" y="${y}" z="${z}"/><vertex x="-${x}" y="${y}" z="${z}"/>
    </vertices>
    <triangles>
     <triangle v1="0" v2="1" v3="2"/><triangle v1="0" v2="3" v3="1"/><triangle v1="4" v2="5" v3="6"/><triangle v1="4" v2="6" v3="7"/>
     <triangle v1="0" v2="2" v3="5"/><triangle v1="0" v2="5" v3="4"/><triangle v1="2" v2="1" v3="6"/><triangle v1="2" v2="6" v3="5"/>
     <triangle v1="1" v2="3" v3="7"/><triangle v1="1" v2="7" v3="6"/><triangle v1="3" v2="0" v3="4"/><triangle v1="3" v2="4" v3="7"/>
    </triangles>
   </mesh>
  </object>
 </resources>
 <build/>
</model>`;
}

function rootModel(bounds, machine) {
  const componentX = coordinate(bounds.x / 2);
  const componentY = coordinate(bounds.y / 2);
  const componentZ = coordinate(bounds.z / 2);
  const plateX = coordinate((machine.width - bounds.x) / 2);
  const plateY = coordinate((machine.depth - bounds.y) / 2);
  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p">
 <metadata name="Application">BambuStudio-02.08.02.60</metadata>
 <metadata name="BambuStudio:3mfVersion">1</metadata>
 <resources>
  <object id="2" p:UUID="00000001-61cb-4c03-9d28-80fed5dfa1dc" type="model">
   <components><component p:path="/3D/Objects/object_1.model" objectid="1" p:UUID="00010000-b206-40ff-9872-83e8017abed1" transform="1 0 0 0 1 0 0 0 1 ${componentX} ${componentY} ${componentZ}"/></components>
  </object>
 </resources>
 <build p:UUID="2c7c17d8-22b5-4d84-8835-1976022ea369">
  <item objectid="2" p:UUID="00000002-b1ec-4553-aec9-835e5b724bb4" transform="1 0 0 0 1 0 0 0 1 ${plateX} ${plateY} 0" printable="1"/>
 </build>
</model>`;
}

function modelSettings(modelName, bounds) {
  const name = xmlEscape(modelName);
  const x = coordinate(bounds.x / 2);
  const y = coordinate(bounds.y / 2);
  const z = coordinate(bounds.z / 2);
  return `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="2">
    <metadata key="name" value="${name}"/><metadata key="extruder" value="1"/><metadata face_count="12"/>
    <part id="1" subtype="normal_part" uuid="8b26948e-0bed-457a-b9b3-761034739e9f">
      <metadata key="name" value="${name}"/><metadata key="matrix" value="1 0 0 ${x} 0 1 0 ${y} 0 0 1 ${z} 0 0 0 1"/><metadata key="source_file" value="${name}"/>
      <metadata key="source_object_id" value="0"/><metadata key="source_volume_id" value="0"/><metadata key="source_offset_x" value="${x}"/><metadata key="source_offset_y" value="${y}"/><metadata key="source_offset_z" value="${z}"/>
      <mesh_stat face_count="12" edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>
    </part>
  </object>
  <plate>
    <metadata key="plater_id" value="1"/><metadata key="plater_name" value=""/><metadata key="locked" value="false"/><metadata key="filament_map_mode" value="Auto For Flush"/><metadata key="filament_maps" value="1"/><metadata key="filament_volume_maps" value="0"/>
    <metadata key="gcode_file" value="Metadata/plate_1.gcode"/>
    <metadata key="thumbnail_file" value="Metadata/plate_1.png"/><metadata key="thumbnail_no_light_file" value="Metadata/plate_no_light_1.png"/><metadata key="top_file" value="Metadata/top_1.png"/><metadata key="pick_file" value="Metadata/pick_1.png"/>
    <model_instance><metadata key="object_id" value="2"/><metadata key="instance_id" value="0"/><metadata key="identify_id" value="1"/></model_instance>
  </plate>
  <assemble></assemble>
</config>`;
}

function plateJson(modelName, bounds, machine, material, quality) {
  const minX = (machine.width - bounds.x) / 2;
  const minY = (machine.depth - bounds.y) / 2;
  const maxX = minX + bounds.x;
  const maxY = minY + bounds.y;
  return JSON.stringify({
    bbox_all: [minX, minY, maxX, maxY],
    bbox_objects: [{ area: bounds.x * bounds.y, bbox: [minX, minY, maxX, maxY], id: 1, layer_height: quality.layerHeight, name: modelName }],
    bed_type: "textured_plate",
    filament_colors: ["#00AEEF"],
    filament_ids: [0],
    first_extruder: 0,
    first_layer_time: 0,
    is_seq_print: false,
    nozzle_diameter: machine.nozzle.diameter,
    version: 2,
  });
}

function sliceInfo(modelName, machine, material, layers, estimatedSeconds, supportsEnabled) {
  const name = xmlEscape(modelName);
  const layerEnd = Math.max(0, layers - 1);
  return `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <header><header_item key="X-BBL-Client-Type" value="slicer"/><header_item key="X-BBL-Client-Version" value="02.08.02.60"/></header>
  <plate>
    <metadata key="index" value="1"/><metadata key="extruder_type" value="0"/><metadata key="nozzle_volume_type" value="0"/><metadata key="printer_model_id" value=""/><metadata key="nozzle_diameters" value="${machine.nozzle.diameter}"/>
    <metadata key="timelapse_type" value="0"/><metadata key="prediction" value="${estimatedSeconds}"/><metadata key="weight" value=""/><metadata key="pause_count" value="0"/><metadata key="first_layer_time" value="0.000000"/><metadata key="outside" value="false"/>
    <metadata key="support_used" value="${supportsEnabled ? "true" : "false"}"/><metadata key="label_object_enabled" value="false"/><metadata key="support_material_on_wipe_tower" value="false"/><metadata key="enable_filament_dynamic_map" value="false"/><metadata key="has_filament_switcher" value="true"/>
    <metadata key="filament_maps" value="1"/><metadata key="limit_filament_maps" value="0"/>
    <object identify_id="1" name="${name}" skipped="false"/>
    <filament id="1" tray_info_idx="${xmlEscape(material.filamentId)}" type="${xmlEscape(material.code)}" color="#00AEEF" used_m="0.00" used_g="0.00" group_id="0" nozzle_diameter="${machine.nozzle.diameter.toFixed(2)}" volume_type="${xmlEscape(machine.nozzle.volumeType)}" used_for_object="true" used_for_support="${supportsEnabled ? "true" : "false"}" total_load_time="0.00" total_unload_time="0.00"/>
    <nozzle id="0" extruder_id="1" nozzle_diameter="${machine.nozzle.diameter}" volume_type="${xmlEscape(machine.nozzle.volumeType)}"/>
    <layer_filament_lists><layer_filament_list filament_list="0" layer_ranges="0 ${layerEnd}"/></layer_filament_lists>
  </plate>
</config>`;
}

function projectSettings(template, machine, material, quality, supportsEnabled, brimEnabled) {
  if (!template || typeof template !== "object" || Array.isArray(template)) {
    throw new TypeError(`A complete ${machine.name} project settings profile is required.`);
  }
  const plateTemperature = [String(material.bed)];
  const nozzleTypeCount = Array.isArray(template.nozzle_type) ? template.nozzle_type.length : 1;
  return JSON.stringify({
    ...template,
    brim_type: brimEnabled ? "outer_only" : "no_brim",
    curr_bed_type: "Textured PEI Plate",
    cool_plate_temp: plateTemperature,
    cool_plate_temp_initial_layer: plateTemperature,
    enable_support: supportsEnabled ? "1" : "0",
    eng_plate_temp: plateTemperature,
    eng_plate_temp_initial_layer: plateTemperature,
    extruder_type: [machine.nozzle.extruderType],
    filament_colour: ["#00AEEF"],
    filament_density: [String(material.density)],
    filament_diameter: ["1.75"],
    filament_extruder_variant: [machine.nozzle.extruderVariant],
    filament_flow_ratio: [String(material.flow)],
    filament_ids: [material.filamentId],
    filament_map: ["1"],
    filament_map_2: ["1"],
    filament_map_mode: "Auto For Flush",
    filament_max_volumetric_speed: [String(material.maxFlow)],
    filament_self_index: ["1"],
    filament_settings_id: [`${material.name} @SDSCPA`],
    filament_type: [material.code],
    filament_vendor: ["Generic"],
    filament_volume_map: ["0"],
    hot_plate_temp: plateTemperature,
    hot_plate_temp_initial_layer: plateTemperature,
    initial_layer_print_height: String(quality.firstLayerHeight),
    has_filament_switcher: "1",
    layer_height: String(quality.layerHeight),
    name: "project_settings",
    nozzle_diameter: [String(machine.nozzle.diameter)],
    nozzle_temperature: [String(material.nozzle)],
    nozzle_temperature_initial_layer: [String(material.nozzle)],
    nozzle_temperature_range_high: [String(material.nozzle + 20)],
    nozzle_temperature_range_low: [String(material.nozzle - 20)],
    nozzle_type: Array.from({ length: nozzleTypeCount }, () => machine.nozzle.type),
    nozzle_volume_type: [machine.nozzle.volumeType],
    printable_height: String(machine.height),
    printer_extruder_variant: [machine.nozzle.extruderVariant],
    printer_model: machine.name,
    printer_settings_id: `${machine.name} ${machine.nozzle.diameter} nozzle`,
    printer_technology: "FFF",
    printer_variant: String(machine.nozzle.diameter),
    print_settings_id: `${quality.name} ${quality.layerHeight.toFixed(2)} mm @SDSCPA`,
    single_extruder_multi_material: "1",
    supertack_plate_temp: plateTemperature,
    supertack_plate_temp_initial_layer: plateTemperature,
    support_critical_regions_only: "0",
    support_on_build_plate_only: "1",
    support_remove_small_overhang: "1",
    support_style: "default",
    support_type: "tree(auto)",
    textured_plate_temp: plateTemperature,
    textured_plate_temp_initial_layer: plateTemperature,
  }, null, 2);
}

function cutInformation() {
  return `<?xml version="1.0" encoding="utf-8"?>
<objects><object id="1"><cut_id id="0" check_sum="1" connectors_cnt="0"/></object></objects>`;
}

function filamentSequence() {
  return JSON.stringify({ plate_1: { nozzle_sequence: [0], optimal_assignment: [0], sequence: [1] } });
}

function assertPackageInputs(gcode, modelName, bounds, layers, estimatedSeconds) {
  if (typeof gcode !== "string" || gcode.length < 1000) {
    throw new TypeError("A Bambu print package requires validated G-code.");
  }
  if (typeof modelName !== "string" || !modelName.trim()) {
    throw new TypeError("A Bambu print package requires a model name.");
  }
  if (![bounds.x, bounds.y, bounds.z].every((value) => Number.isFinite(value) && value > 0)) {
    throw new RangeError("A Bambu print package requires positive model dimensions.");
  }
  if (!Number.isInteger(layers) || layers < 1) {
    throw new RangeError("A Bambu print package requires a positive layer count.");
  }
  if (!Number.isInteger(estimatedSeconds) || estimatedSeconds < 1) {
    throw new RangeError("A Bambu print package requires a positive whole-second time estimate.");
  }
}

function createGcode3mf(gcode, modelName, bounds, machine, material, quality, layers, estimatedSeconds, projectSettingsTemplate, packageThumbnails, supportsEnabled, brimEnabled) {
  assertPackageInputs(gcode, modelName, bounds, layers, estimatedSeconds);
  if (!(packageThumbnails?.full instanceof Uint8Array) || !(packageThumbnails?.small instanceof Uint8Array)) {
    throw new TypeError("A Bambu print package requires full-size and small PNG thumbnails.");
  }
  const gcodeBytes = encodedText(gcode);
  const files = [
    { name: "[Content_Types].xml", contents: contentTypes() },
    { name: "_rels/.rels", contents: rootRelationships() },
    { name: "Metadata/plate_1.png", contents: packageThumbnails.full },
    { name: "Metadata/plate_1_small.png", contents: packageThumbnails.small },
    { name: "Metadata/plate_no_light_1.png", contents: packageThumbnails.full },
    { name: "Metadata/top_1.png", contents: packageThumbnails.full },
    { name: "Metadata/pick_1.png", contents: packageThumbnails.full },
    { name: "3D/3dmodel.model", contents: rootModel(bounds, machine) },
    { name: "3D/_rels/3dmodel.model.rels", contents: modelRelationships() },
    { name: "3D/Objects/object_1.model", contents: objectModel(bounds) },
    { name: "Metadata/project_settings.config", contents: projectSettings(projectSettingsTemplate, machine, material, quality, supportsEnabled, brimEnabled) },
    { name: "Metadata/model_settings.config", contents: modelSettings(modelName, bounds) },
    { name: "Metadata/_rels/model_settings.config.rels", contents: gcodeRelationships() },
    { name: "Metadata/cut_information.xml", contents: cutInformation() },
    { name: "Metadata/plate_1.json", contents: plateJson(modelName, bounds, machine, material, quality) },
    { name: "Metadata/slice_info.config", contents: sliceInfo(modelName, machine, material, layers, estimatedSeconds, supportsEnabled) },
    { name: "Metadata/filament_sequence.json", contents: filamentSequence() },
    { name: "Metadata/plate_1.gcode.md5", contents: md5Hex(gcodeBytes) },
    { name: "Metadata/plate_1.gcode", contents: gcodeBytes },
  ];
  return storedZip(files);
}

export { createGcode3mf };
