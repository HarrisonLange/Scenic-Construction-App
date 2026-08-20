function positiveSeconds(value, label) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new RangeError(`${label} must be a positive number of seconds. Received ${String(value)}.`);
  }
  return Math.round(seconds);
}

function estimatedPrintSeconds(gcode, metadata) {
  const metadataSeconds = positiveSeconds(metadata?.printTime, "CuraEngine print time");
  const timeMarker = gcode.match(/(?:^|\n);TIME:(\d+(?:\.\d+)?)(?:\n|$)/i);
  if (!timeMarker) {
    throw new Error("CuraEngine G-code is missing its total print-time estimate.");
  }
  positiveSeconds(timeMarker[1], "CuraEngine G-code time");
  return metadataSeconds;
}

function formattedDuration(seconds) {
  const roundedSeconds = positiveSeconds(seconds, "Print duration");
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor(roundedSeconds % 3600 / 60);
  const remainder = roundedSeconds % 60;
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (hours || minutes) parts.push(`${minutes}m`);
  parts.push(`${remainder}s`);
  return parts.join(" ");
}

function finalElapsedSeconds(lines) {
  const values = lines
    .map((line) => line.match(/^;TIME_ELAPSED:(\d+(?:\.\d+)?)$/i))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  if (!values.length || values.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("CuraEngine G-code is missing valid per-layer time estimates.");
  }
  return Math.max(...values);
}

function layerTimeCommand(layerIndex, elapsedSeconds, finalElapsed, totalSeconds, previousProgress, previousMinutes) {
  const ratio = Math.max(0, Math.min(1, elapsedSeconds / finalElapsed));
  const progress = Math.max(previousProgress, Math.min(99, Math.floor(ratio * 100)));
  const minutes = Math.min(previousMinutes, Math.max(0, Math.floor(totalSeconds * (1 - ratio) / 60)));
  return Object.freeze({
    command: `M73 L${layerIndex + 1}\nM73 P${progress} R${minutes}`,
    minutes,
    progress,
  });
}

function addBambuTimeEstimates(gcode, totalSeconds, expectedLayers) {
  const seconds = positiveSeconds(totalSeconds, "Bambu print time");
  if (!Number.isInteger(expectedLayers) || expectedLayers < 1) {
    throw new RangeError(`Bambu time estimates require a positive layer count. Received ${String(expectedLayers)}.`);
  }
  const normalizedSource = gcode.replace(/\r\n/g, "\n").trimEnd();
  const timeMarkers = normalizedSource.match(/(?:^|\n);TIME:\d+(?:\.\d+)?(?=\n|$)/gi) || [];
  if (timeMarkers.length !== 1) {
    throw new Error(`CuraEngine G-code contains ${timeMarkers.length} total time markers; exactly one is required.`);
  }
  const normalized = normalizedSource.replace(/(^|\n);TIME:\d+(?:\.\d+)?(?=\n|$)/i, `$1;TIME:${seconds}`);
  if (/(?:^|\n)M73\s+P\d+/i.test(normalized)) {
    throw new Error("CuraEngine G-code already contains active M73 progress commands.");
  }
  const lines = normalized.split("\n");
  const finalElapsed = finalElapsedSeconds(lines);
  let elapsedSeconds = 0;
  let previousProgress = 0;
  let previousMinutes = Math.floor(seconds / 60);
  let layerCommands = 0;
  const output = [`M73 P0 R${previousMinutes}`];

  lines.forEach((line) => {
    output.push(line);
    const elapsedMatch = line.match(/^;TIME_ELAPSED:(\d+(?:\.\d+)?)$/i);
    if (elapsedMatch) elapsedSeconds = Number(elapsedMatch[1]);
    const layerMatch = line.match(/^;LAYER:(\d+)$/i);
    if (!layerMatch) return;
    const layerIndex = Number.parseInt(layerMatch[1], 10);
    if (layerIndex !== layerCommands) {
      throw new Error(`CuraEngine layer sequence expected ${layerCommands}, but found ${layerIndex}.`);
    }
    const timeCommand = layerTimeCommand(
      layerIndex,
      elapsedSeconds,
      finalElapsed,
      seconds,
      previousProgress,
      previousMinutes,
    );
    output.push("; update printer progress and time remaining", timeCommand.command);
    previousProgress = timeCommand.progress;
    previousMinutes = timeCommand.minutes;
    layerCommands += 1;
  });

  if (layerCommands !== expectedLayers) {
    throw new Error(`Bambu time estimates found ${layerCommands} layers, but the slicer reported ${expectedLayers}.`);
  }
  output.push("M73 P100 R0");
  return `${output.join("\n")}\n`;
}

export { addBambuTimeEstimates, estimatedPrintSeconds, formattedDuration };
