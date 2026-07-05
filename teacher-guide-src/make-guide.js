/* Generates the SDSCPA Virtual Labs Teacher's Guide (.docx) */
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  LevelFormat, Footer, PageNumber, PageBreak, ImageRun
} = require("docx");
const fs = require("fs");
const path = require("path");

const SHOTS = path.join(__dirname, "shots");

/* ── palette (SDSCPA brand) ─────────────────────────── */
const INK = "1F2430";
const DIM = "6B7280";
const SCENIC = "92278F";   // purple
const LIGHT  = "D97706";   // amber (darkened for print vs #F7941E)
const SOUND  = "0284C7";   // cyan (darkened for print vs #00AEEF)
const COSTUME= "4D8F1F";   // green (darkened for print vs #7AC143)
const PINK   = "EC008C";

const BASE = "https://harrisonlange.github.io/Scenic-Construction-App/";

/* ── helpers ────────────────────────────────────────── */
const p = (text, opts = {}) => new Paragraph({
  spacing: { after: opts.after ?? 120, line: 264 },
  alignment: opts.align,
  children: [new TextRun({ text, size: opts.size ?? 21, bold: opts.bold, italics: opts.italics, color: opts.color ?? INK, font: opts.font })]
});

const rich = (runs, opts = {}) => new Paragraph({
  spacing: { after: opts.after ?? 120, line: 264 },
  children: runs.map(r => new TextRun({ size: 21, color: INK, ...r }))
});

const bullet = (runs, level = 0) => new Paragraph({
  numbering: { reference: "bullets", level },
  spacing: { after: 60, line: 264 },
  children: (Array.isArray(runs) ? runs : [{ text: runs }]).map(r => new TextRun({ size: 21, color: INK, ...r }))
});

const h1 = (text, color = INK) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 140 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: color, space: 3 } },
  children: [new TextRun({ text, bold: true, size: 30, color })]
});

const h2 = (text, color = INK) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 60 },
  children: [new TextRun({ text, bold: true, size: 25, color })]
});

const h3 = (text) => new Paragraph({
  spacing: { before: 160, after: 60 },
  children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 18, color: DIM })]
});

/* lab section header: title + direct link + goal quote */
function labHead(title, color, path, goalText) {
  return [
    h2(title, color),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: BASE + path, size: 17, color: DIM, font: "Consolas" })]
    }),
    new Paragraph({
      spacing: { after: 140 },
      indent: { left: 240 },
      border: { left: { style: BorderStyle.SINGLE, size: 16, color, space: 8 } },
      children: [
        new TextRun({ text: "Student goal: ", size: 21, bold: true, color: INK }),
        new TextRun({ text: "“" + goalText + "”", size: 21, italics: true, color: INK })
      ]
    })
  ];
}

/* table builder: widths in DXA, first row is header */
function tbl(widths, headerCells, rows, accent = "333333") {
  const mkCell = (content, w, isHeader) => new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: isHeader ? { type: ShadingType.CLEAR, fill: "EFEFEF" } : undefined,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children: (Array.isArray(content) ? content : [content]).map(t => new Paragraph({
      spacing: { after: 20, line: 252 },
      children: [new TextRun({ text: t, size: 19, bold: isHeader, color: isHeader ? accent : INK })]
    }))
  });
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headerCells.map((c, i) => mkCell(c, widths[i], true)) }),
      ...rows.map(r => new TableRow({ children: r.map((c, i) => mkCell(c, widths[i], false)) }))
    ]
  });
}

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

/* screenshot with caption; labs are 2160×1320, hub is 1770×2919 */
function shot(name, caption, dispWidthPx) {
  const file = path.join(SHOTS, name + ".png");
  const data = fs.readFileSync(file);
  // read aspect from known sizes
  const dims = name === "hub" ? [1770, 2919] : [2160, 1320];
  const w = dispWidthPx ?? 620;
  const h = Math.round(w * dims[1] / dims[0]);
  return [
    new Paragraph({
      spacing: { before: 120, after: 40 },
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ type: "png", data, transformation: { width: w, height: h } })]
    }),
    new Paragraph({
      spacing: { after: 160 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: caption, size: 17, italics: true, color: DIM })]
    })
  ];
}

/* ── document body ──────────────────────────────────── */
const children = [];

/* Title block */
children.push(
  new Paragraph({
    spacing: { before: 200, after: 40 },
    children: [new TextRun({ text: "SDSCPA Design & Production Virtual Labs", bold: true, size: 46, color: INK })]
  }),
  new Paragraph({
    spacing: { after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: PINK, space: 10 } },
    children: [new TextRun({ text: "Teacher’s Guide", bold: true, size: 30, color: PINK })]
  }),
  p("How each of the ten labs works, what evidence they produce, and how to fold them into tech theatre courses for grades 6–10 — plus photography and film/video classes. Activities are cross-referenced to the California CTE Model Curriculum Standards, Arts, Entertainment & Design cluster (Stage & Event Technology focus area).", { italics: true, color: DIM, after: 200 }),

  h1("About the Labs"),
  p("The Design & Production Virtual Labs are ten free, browser-based simulations built for theatre students. Each lab gives students a safe, repeatable way to practice a real production skill — reading a tape measure, drafting to scale, programming a light board, mixing a musical, designing costumes — before (or alongside) doing it with real lumber, real consoles, and real budgets."),
  bullet([{ text: "Nothing to install, nothing to buy, no accounts. ", bold: true }, { text: "The labs are plain web pages. There is nothing for IT to deploy and no licenses to manage." }]),
  bullet([{ text: "Runs on anything. ", bold: true }, { text: "Chromebooks, PCs, and Macs in any modern browser (Chrome or Edge recommended). A mouse helps in the drawing-based labs; the three sound labs need headphones or speakers." }]),
  bullet([{ text: "Student work stays on the computer. ", bold: true }, { text: "There is no server and no data collection: progress, projects, and the optional student name are stored only in that browser on that machine (details under Logistics & Privacy)." }]),
  rich([
    { text: "The hub lives at " },
    { text: BASE, font: "Consolas", size: 19, color: SOUND },
    { text: ". Students pick a lab from the hub; every lab links back with the ‹ Labs button in its top-left corner. Each lab card states a one-sentence learning goal in student language (“I can …”) — those goals are quoted throughout this guide and make ready-made objectives for your whiteboard. The screenshots throughout this guide show the labs exactly as students see them." }
  ], { after: 200 }),
  ...shot("hub", "The hub: ten labs across Costumes, Lighting, Scenic, and Sound. Every card states the lab’s learning goal; completed labs earn a ✓ chip and feed the printable progress strip.", 400),

  h3("Standards alignment in this guide"),
  p("Lab activities throughout this guide are cross-referenced to the California Career Technical Education Model Curriculum Standards, Arts, Entertainment & Design career cluster — specifically the Stage & Event Technology focus area of the Performance, Music, & Live Entertainment pathway. Those standards (cited here by their ST codes, e.g., ST.17.7 Lighting) describe production design, scenic construction, power and signal, lighting, audio, console operation, and live-event execution — the exact territory these labs cover. Each lab section below lists its strongest connections, and a full lab-to-standard mapping table appears under Assessment & Grading."),
  p("The citations carry the most weight in grades 9–10 and CTE-articulated courses, where they can go straight into course outlines and program review. In grades 6–8, read them as the destination the labs are pointed at.", { italics: true, color: DIM, after: 200 }),

  h1("What Every Lab Shares"),
  p("All ten labs sit on one shared learning system, so once students have used one lab they know how to learn from all of them:"),
  bullet([{ text: "Glossary + flash cards. ", bold: true }, { text: "A floating 📖 Words button opens a searchable glossary of that lab’s vocabulary. “Test me” turns it into a five-question flash-card quiz: the definition is shown, the student picks the term." }]),
  bullet([{ text: "Self-checking lessons and challenges. ", bold: true }, { text: "Guided tutorials and challenges verify themselves as students work in the lab — not by asking questions about the work afterward. Feedback is specific and corrective (“Your rectangle is 7′-6″ × 4′-0″ — aim for 8′-0″ × 4′-0″.”)." }]),
  bullet([{ text: "Certificates. ", bold: true }, { text: "Completing a lab’s quiz, lessons, challenges, or briefs triggers a downloadable PNG certificate with the student’s name, the date, and their stats. (Confetti included.)" }]),
  bullet([{ text: "Progress tracking and a printable report. ", bold: true }, { text: "The hub shows “X of 10 labs completed” with each lab’s best score. The 🖨 Print report button produces a one-page progress report with student and teacher signature lines — a ready-made artifact to turn in. Best scores are kept across retries, so retrying is always rewarded." }]),
  p("Because scoring and completion are automatic, most labs work as self-grading assignments: collect the certificate, the exported design, or the printed progress report.", { after: 200 }),

  h1("The Labs at a Glance"),
  p("Times assume ~50-minute periods and are deliberately rough — every lab also works in smaller bites.", { italics: true, color: DIM }),
  tbl(
    [1980, 3280, 3076, 1600],
    ["Lab", "Students practice…", "Built-in assessment & evidence", "Suggested time"],
    [
      ["Scenic Construction", "Reading a tape measure, laying out lumber to scale, flat & platform anatomy, cut lists", "Timed 10-build quiz; tape-measure drills; 2-min warm-up; score card PNG", "2–3 periods, + 10-min drills"],
      ["Drafting", "Drafting to scale on 11″×17″ paper, dimensioning, line weights", "6 “Draft This” challenges at 2 difficulty levels; certificate", "1–2 periods"],
      ["Scenic Design", "Stage areas, composition, focus, sightlines; ground plan ↔ audience view", "5 composition challenges; certificate; exported design sheet", "1–2 periods"],
      ["Lighting Design", "Color, angle, gobos; recording & running cues; Eos-style console syntax", "4 self-checking lessons; certificate; cue-sheet, PNG & video exports", "2–3 periods"],
      ["Portrait Lighting", "Key / fill / back / hair lights; classic portrait patterns", "8-round recreate-the-look quiz (2 levels); 2-min warm-up", "1–2 periods"],
      ["Studio Lighting", "Lighting for camera: three-point, low key, product, noir", "5 checked challenges; certificate; printable shot plan", "1–2 periods"],
      ["Live Sound", "Signal flow, PA design, power distribution, cabling, troubleshooting", "5-scenario timed quiz; fault-finding mode; teacher scenario builder; certificate", "2–3 periods"],
      ["Sound Cue", "Cue stacks, fades, follows; running a show on GO", "Self-checking “first show” tutorial; certificate; standalone show-file export", "1–2 periods + project"],
      ["Line Mixing", "Line-by-line DCA mixing, the A1 skill for musicals", "5-minute scored quiz (accuracy %); certificate; 2-min warm-up", "20–40 min, repeatable"],
      ["Costume Design", "Period silhouettes, color & pattern, costume plots", "8 design briefs with reflection prompts; certificate; plot PNG", "2–3 periods"]
    ]
  ),
  pageBreak(),

  /* ────────────────────────── SCENIC ────────────────────────── */
  h1("Scenic Labs", SCENIC),

  ...labHead("Scenic Construction Lab", SCENIC, "scenic/", "I can measure with a tape, lay out lumber to scale, and build a cut list for a flat or platform."),
  ...shot("scenic", "Training mode mid-build: step 5 of a Broadway flat explains the cross bracing while the stock-materials palette waits at right and the cut list writes itself."),
  h3("How it works"),
  p("A virtual drafting table for scenery. Students place stock lumber and fabricated parts on graph paper at a chosen scale (1/4″ to 1″ = 1′-0″) and assemble Broadway flats, Hollywood flats, and platforms rail by rail and stile by stile."),
  bullet([{ text: "Sizing a board means using the tape measure: ", bold: true }, { text: "scroll to pull the tape from its case, hover for a magnifier, and click the right mark (or type a length such as 8′ 0″). Students also choose flat vs. on-edge orientation — just like in the shop." }]),
  bullet([{ text: "A live Materials List (cut list) ", bold: true }, { text: "builds itself from the placed pieces, so students watch the shop paperwork emerge from their drawing." }]),
  bullet([{ text: "Training mode ", bold: true }, { text: "walks through each build step by step (Broadway flat, Hollywood flat, platform; door and window flats unlock with the Advanced toggle)." }]),
  bullet([{ text: "Pro drawing tools: ", bold: true }, { text: "dimension and annotation tools label the drawing like a drafting plate, an isometric preview shows the build in 3D, and advanced students can add miter cuts. A first-run tour orients new students automatically." }]),
  h3("Built-in practice & assessment"),
  bullet([{ text: "Quiz: ", bold: true }, { text: "ten timed builds, each auto-verified against correct construction. Easy mode adds a parts checklist for support. Results show per-build times and export as a score-card PNG with the student’s name. Finishing the quiz completes the lab (Easy vs. Standard is recorded)." }]),
  bullet([{ text: "Tape-measure drill: ", bold: true }, { text: "“find the length” — ten fractional-inch marks, timed and scored. Quietly excellent fraction practice." }]),
  bullet([{ text: "Warm-Up: ", bold: true }, { text: "a two-minute speed build, made for bell work." }]),
  h3("What to collect"),
  bullet("Quiz score card PNG, exported drawing PNG — or a Glowforge-ready SVG if you want to laser-cut a scale model of a flat."),
  h3("Standards connections"),
  bullet([{ text: "ST.17.4 Scenic & Props: ", bold: true }, { text: "“design, source and construct scenic and property elements … apply safety practices, adhere to industry-standard regulations, and ensure technical reliability.” Framing anatomy, correct part placement, and the verified build quiz are this standard in miniature." }]),
  bullet([{ text: "ST.18.1 Reading Technical Drawings: ", bold: true }, { text: "“translate documents into actionable production tasks using scale and industry notation.” Scale selection, dimensioning, and the self-building cut list train exactly that translation." }]),
  h3("Classroom ideas"),
  bullet("The natural first lab of a construction unit: run Training together on the projector, then let students take the quiz solo."),
  bullet("Grades 6–8: standard flats with Easy-mode checklists; use the tape drill as a recurring math warm-up. Grades 9–10: Advanced door/window flats and miters, then export a cut list for something you actually build."),
  bullet("Certification gate: require the quiz score card before students use real shop tools — motivating and easy to defend."),

  ...labHead("Scenic Design Lab", SCENIC, "designlab/", "I can stage a scene with clear focus and keep every actor visible to the audience."),
  ...shot("designlab", "Audience view above, ground plan below: flats, furniture, actors, and a backdrop arranged on labeled stage areas, with the composition challenges at right."),
  h3("How it works"),
  p("Students arrange set pieces, furniture, and actors on a top-down ground plan while the same design renders live in a perspective “audience view” — every choice made from above is instantly judged from the house."),
  bullet([{ text: "Stage-area labels ", bold: true }, { text: "teach the nine acting areas (down-left through up-right) while students drag pieces around." }]),
  bullet([{ text: "Sightline tools: ", bold: true }, { text: "house-distance and eye-height sliders show the view from different seats, and the lab warns when an actor is hidden behind scenery." }]),
  bullet([{ text: "Scenes save like cues: ", bold: true }, { text: "students can store an arrangement, rearrange for the next scene, and step back and forth — a multi-scene design in one sitting. Production title and designer name stamp the exports." }]),
  h3("Built-in practice & assessment"),
  bullet("Five self-checking composition challenges, each teaching a design principle: Strong diagonal, Furnished interior, Levels create focus, Center of attention, and Everybody visible (fix the sightline warnings). All five earn the certificate."),
  h3("What to collect"),
  bullet("Exported PNG — audience view and labeled ground plan on one sheet, or audience view alone."),
  h3("Standards connections"),
  bullet([{ text: "ST.17.1 Production Design Fundamentals: ", bold: true }, { text: "“apply principles of art and design to production elements … to shape audience perception and performer interaction” — shaping audience perception is the explicit point of all five composition challenges." }]),
  bullet([{ text: "ST.18.2 Event Design Software Tools: ", bold: true }, { text: "“create virtual stage models … and determine technical feasibility and alignment with creative direction.” The lab is precisely such a previsualization tool, with sightline feasibility checked live." }]),
  h3("Classroom ideas"),
  bullet("The best companion to teaching stage directions: students learn the areas by using them, not by memorizing a diagram."),
  bullet("Use it as blocking previsualization: student directors sketch a scene, then defend their focus choices with the perspective view."),
  bullet("Grades 6–8: vocabulary plus the challenges. Grades 9–10: design an assigned scene from your season and present both views."),
  bullet("Film crossover: composition, levels, and “what the camera actually sees” transfer directly (see the Photography & Film section)."),

  ...labHead("Drafting Lab", SCENIC, "draftinglab/", "I can draft a scaled drawing whose dimensions match the plan."),
  ...shot("draftinglab", "A dimensioned rectangle and a selected circle on the 11″ × 17″ sheet — Object Info shows the circle’s radius as an editable dimension, and the challenge list waits at right."),
  h3("How it works"),
  p("Virtual 11″ × 17″ grid paper with professional drafting tools: line, rectangle, circle, arc, dimension, and text, plus line weights (including dashed), hatch fills, and grid/object snapping (hold Shift to draw freehand). Click any object and type the dimension it should be — the same workflow as industry CAD."),
  h3("Built-in practice & assessment"),
  bullet("Six “Draft This” challenges with preview thumbnails, from a 4′×8′ stock platform up to a fully labeled plate. Every requirement checks itself and reports what the student actually drew. Beginner tolerance is ±3″; Advanced is ±1″. All six earn the certificate."),
  h3("What to collect"),
  bullet("Exported PNG of the drafting sheet; challenge score on the hub report."),
  h3("Standards connections"),
  bullet([{ text: "ST.18.1 Reading Technical Drawings: ", bold: true }, { text: "“interpret technical drawings, stage plots, schematics … using scale and industry notation to ensure precision, safety, and alignment with design intent.” The Draft This challenges grade precisely that precision, at two tolerances." }]),
  bullet([{ text: "ST.18.2 Event Design Software Tools: ", bold: true }, { text: "the lab mirrors the “industry-standard software (e.g., CAD …)” workflow the standard names — snapping, editable dimensions, line weights — without the license cost." }]),
  h3("Classroom ideas"),
  bullet("The bridge between hand drafting and CAD: the same discipline — scale, dimension lines, line weight — with instant feedback and no expensive seats."),
  bullet("Grades 6–8 run Beginner; grades 9–10 run Advanced as the gateway to a Vectorworks/AutoCAD unit."),
  bullet("Math connection: scale conversion with immediate, non-judgmental checking."),
  pageBreak(),

  /* ────────────────────────── LIGHTING ────────────────────────── */
  h1("Lighting & Camera Labs", LIGHT),

  ...labHead("Lighting Design Lab", LIGHT, "lighting/", "I can build a lighting look with color and angle, record it as a cue, and run the show."),
  ...shot("lighting", "A four-cue stack running: cue 1 is live and cue 2 is next as dancers sit in side light against a color-washed cyc; per-dancer channel readouts run along the bottom."),
  h3("How it works"),
  p("A virtual rep plot over a stage with three movable performers (more can be added). Eighteen channels hang in real positions — front, left and right sides at high/mid/low, top, back, and a three-color cyc. Each channel has intensity, gel color, a gobo (window, blinds, branches, dots), and focus, and every change renders live on the performers."),
  bullet([{ text: "The console is the real thing: ", bold: true }, { text: "an ETC Eos-style command line and keypad. Students type “1 @ 70 Enter” and “Record Cue 2 Time 3 Enter” — muscle memory that transfers straight to the actual board." }]),
  bullet([{ text: "A cue stack with fade and hold times ", bold: true }, { text: "runs with GO / Stop / Back, and an Auto mode plays the whole stack like a show run." }]),
  h3("Built-in practice & assessment"),
  bullet("Four guided lessons that check themselves as students work: a warm front wash, an actor special, a blue cyc transition, and blackout-and-run-the-show. Two lessons record partial credit; all four earn 100% and the certificate."),
  h3("What to collect"),
  bullet("Scene PNG, a printable cue sheet, the project file — or the crowd-pleaser: a WebM video of the student’s entire cue stack playing with real fade and hold timings."),
  h3("Standards connections"),
  bullet([{ text: "ST.17.7 Lighting: ", bold: true }, { text: "“control intensity, hue, saturation, position, and effects to enhance mood, direct audience focus, and ensure performer and production safety.” The lab’s channels, gels, gobos, and focus tools map onto this standard one for one." }]),
  bullet([{ text: "ST.18.3 Console Operation: ", bold: true }, { text: "“program and operate control consoles for lighting … manage cues, transitions, and real-time adjustments (e.g., levels, timing).” The Eos-style command line and cue stack are a direct rehearsal for the real console." }]),
  h3("Classroom ideas"),
  bullet("Teach the angle jobs — front for faces, side to sculpt, back to separate — with immediate visual proof on the performers."),
  bullet("Pre-board training: students arrive at the real console already speaking Eos syntax."),
  bullet("Grades 6–8: the four lessons plus a free-design look. Grades 9–10: cue a full song or scene, export the video, and defend the choices in critique."),
  bullet("Film crossover: color-and-mood studies (day/night, warm/cool) read instantly on the figures."),

  ...labHead("Portrait Lighting Lab", LIGHT, "lighting-people/", "I can name the four portrait lights — key, fill, back, hair — and place each one."),
  ...shot("lighting-people", "The Rembrandt preset applied: key, fill, back, and hair lights sit around the 3D head, and the Analysis panel confirms the pattern and the 4.5:1 key-to-fill ratio."),
  h3("How it works"),
  p("A 3D-rendered head in a virtual studio. Students position Key, Fill, Back, and Hair lights — each with intensity, color temperature (Kelvin), height, angle, distance, and softness — over selectable skin tones and backdrops, and watch the portrait update in real time. Views include the 3D render, a top-down diagram, and a printable setup sheet."),
  bullet([{ text: "Presets teach the classic patterns: ", bold: true }, { text: "Rembrandt, Butterfly, Split, Loop, Broad, Short, Rim Light, and 3-Point. Students toggle between them and compare what moved." }]),
  bullet([{ text: "Projects save ", bold: true }, { text: "in the browser or as JSON files, and side-by-side comparison sheets export for critique." }]),
  h3("Built-in practice & assessment"),
  bullet("Quiz: eight rounds of “recreate this pattern.” The lab names a look; the student builds it; placement is checked within tolerance (Beginner is generous, Advanced is tight). Timed, scored, and recorded to the hub."),
  bullet("Warm-Up: a two-minute preset sprint — how many patterns can you nail?"),
  h3("What to collect"),
  bullet("Downloaded 3D view, printed setup sheet, side-by-side comparison exports, quiz score."),
  h3("Standards connections"),
  bullet([{ text: "ST.17.7 Lighting: ", bold: true }, { text: "controlling “intensity, hue, saturation, position, and effects to enhance mood [and] direct audience focus” applies to a lens exactly as it does to a stage — here with instant feedback on a rendered face." }]),
  bullet([{ text: "ST.18.4 Design & Test: ", bold: true }, { text: "“evaluate, and refine technical and creative design elements … to finalize artistic decisions.” The recreate-a-pattern quiz is a tight evaluate-and-refine loop with tolerances." }]),
  h3("Classroom ideas"),
  bullet("Photography-first (see the Photography & Film section): the vocabulary here — key-to-fill ratio, short vs. broad, softness — is the vocabulary of every studio portrait unit."),
  bullet("Assignment that works: recreate a pattern in the lab, then recreate it for real with one light and a reflector; submit both images side by side."),
  bullet("Theatre crossover: follow-spot and special placement intuition, and headshot lighting for the program."),

  ...labHead("Studio Lighting Lab", LIGHT, "studiolab/", "I can light a subject for camera and explain what job each light is doing."),
  ...shot("studiolab", "The three-point starting rig — key softbox, fill umbrella, back fresnel — with the Learning Meter reading exposure, ratio, fill, and shadow, and the shot plan building at right."),
  h3("How it works"),
  p("A still-studio renderer for film and photography. A subject and camera sit in a studio; students add lights — softbox, fresnel, LED panel, practical — then set spread, height, compass angle, distance, colored gels, and breakup gobos while balancing exposure, contrast ratio, and shadow detail in the rendered image."),
  bullet([{ text: "One-click starting rigs ", bold: true }, { text: "(Three-point, Low key, Product, Noir edge) plus a 🎓 Tour that explains the job each light is doing." }]),
  bullet([{ text: "Shot Plan: ", bold: true }, { text: "print or copy a shareable plan of the whole setup — positions, settings, notes — the paperwork a gaffer would actually want." }]),
  h3("Built-in practice & assessment"),
  bullet("Five checked challenges, each a real-world brief: Magazine cover (soft and even), Detective movie (hard and contrasty), Mystery guest (a lit silhouette), Golden hour (warm gelled key), and Clean catalog shot. All five earn the certificate."),
  h3("What to collect"),
  bullet("The printed/copied shot plan, challenge score, and screenshots of the rendered still."),
  h3("Standards connections"),
  bullet([{ text: "ST.17.1 Production Design Fundamentals: ", bold: true }, { text: "“determine design and technical requirements for various types of venues and live events (e.g., … presentations)” — each challenge is exactly such a requirements brief (cover shoot, interview, catalog)." }]),
  bullet([{ text: "ST.17.7 Lighting: ", bold: true }, { text: "installing, operating, and adjusting instruments to “enhance mood [and] direct audience focus,” with the shot plan documenting the choices the way a crew would need them." }]),
  h3("Classroom ideas"),
  bullet("Film: the interview-setup trainer — three-point lighting before anyone touches real kit; genre looks (noir, golden hour) slot into film-language units."),
  bullet("Photography: product lighting and low-key/high-key studies without booking the studio."),
  bullet("Theatre: “light for the lens” — why the streamed or archival performance is lit differently than the live house."),
  pageBreak(),

  /* ────────────────────────── SOUND ────────────────────────── */
  h1("Sound Labs", SOUND),

  ...labHead("Live Sound Lab", SOUND, "sound/", "I can trace the signal path from microphone to speaker and set safe levels."),
  ...shot("sound", "A speech-reinforcement design under test: stage, audience, and FOH zones with gear placed — and the Test Checklist explaining exactly what still blocks the signal path."),
  h3("How it works"),
  p("Students design complete PA systems on a scaled room plan. They draw stage, audience, and front-of-house zones; place equipment (microphones, mixer, powered and passive speakers, amplifiers, stands, and power — wall outlets, power strips, extension cables); then switch to Cable mode and physically connect everything: XLR for signal, Speakon for speakers, IEC and Edison for power. “Test System” validates the whole design — the signal path and the power path."),
  bullet([{ text: "Basic and Advanced skill modes, ", bold: true }, { text: "plus an Advanced Library with equipment-specific models (e.g., JBL PRX speakers, Crown amplifiers)." }]),
  bullet([{ text: "Five built-in scenarios ", bold: true }, { text: "climb from beginner speech reinforcement through choir and small band to musical theatre and a large multi-zone event." }]),
  h3("Built-in practice & assessment"),
  bullet([{ text: "Quiz mode: ", bold: true }, { text: "five complete systems, timed, with placement checked against target zones; a summary reports per-scenario times and earns the certificate." }]),
  bullet([{ text: "Troubleshooting mode: ", bold: true }, { text: "the lab breaks a working system and students hunt down the fault; “New Fault” deals another. This is the skill every crew actually needs at 7:58 p.m." }]),
  bullet([{ text: "Teacher mode: ", bold: true }, { text: "a scenario builder just for you — set the title, difficulty, allowed inventory, and instructions, then save/load scenarios as JSON files you can hand to students. Recreate your own auditorium rig." }]),
  h3("What to collect"),
  bullet("Screenshots, saved project JSON, the quiz summary and certificate."),
  h3("Standards connections"),
  bullet([{ text: "ST.17.8 Audio: ", bold: true }, { text: "“select, install, operate, and adjust sound equipment (e.g., microphones, speakers, mixers, amplifiers …); route audio, and calibrate systems to deliver clear, balanced, and reliable sound.” This is the whole lab in one sentence." }]),
  bullet([{ text: "ST.17.5 Power & Data Systems: ", bold: true }, { text: "“signal flow, networking, connectors, cabling, show power” — Test System refuses to pass a design until both the audio path and the power path are safe and complete." }]),
  bullet([{ text: "ST.18.7 Live Equipment Troubleshooting: ", bold: true }, { text: "“diagnose and correct equipment issues (e.g., cabling faults …).” Troubleshooting mode is this standard turned into a game." }]),
  h3("Classroom ideas"),
  bullet("Anchor of a signal-flow unit: nothing teaches mic → mixer → amp → speaker like being unable to pass Test System until it’s right."),
  bullet("Troubleshooting mode makes a great crew-tryout or challenge station."),
  bullet("Grades 9–10: use the Teacher Builder to model your actual space, then hand every student the same venue file as tech-rehearsal prep."),

  ...labHead("Sound Cue Lab", SOUND, "soundcues/", "I can build a cue stack with fades and follows, then run it live with GO."),
  ...shot("soundcues", "The “Build your first show” tutorial checking itself off: four synthesized practice sounds in a six-cue stack with a Fade and a Wait, and the GO button armed."),
  h3("How it works"),
  p("A QLab-style show-control trainer. Students build a cue list from Audio, Fade, Stop, Group, Wait, and Memo cues — with pre-waits, auto-follows, loops, and levels in a proper inspector — then run the show: GO on the spacebar, panic-stop on Escape, and a live “now playing” panel."),
  bullet([{ text: "Works with zero source material: ", bold: true }, { text: "students can import their own audio files (which stay on the computer), or click ✨ Practice sounds to synthesize four test sounds instantly." }]),
  bullet([{ text: "Export Show ", bold: true }, { text: "writes a standalone HTML file that plays the whole show offline on any computer — and re-imports into the lab for further editing." }]),
  h3("Built-in practice & assessment"),
  bullet("A 🎓 Tutorial (“Build your first show”) opens automatically for new students and checks off its task list as they work; finishing it completes the lab and offers the certificate."),
  h3("What to collect"),
  bullet("The exported show file itself — open it, press GO, grade it. It runs anywhere, which makes it a perfect LMS submission."),
  h3("Standards connections"),
  bullet([{ text: "ST.18.3 Console Operation: ", bold: true }, { text: "“manage cues, transitions, and real-time adjustments” — cue types, pre-waits, auto-follows, and fade curves are the transition grammar of every show-control system." }]),
  bullet([{ text: "ST.18.8 Live Event Execution: ", bold: true }, { text: "“operate all technical systems during a live event, following cues, maintaining safety, and managing show flow.” Running the stack on GO — with a panic stop — is show flow in miniature." }]),
  bullet([{ text: "ST.18.2 Event Design Software Tools: ", bold: true }, { text: "the lab is one of the “show flow [and] cuing … programs” the standard expects students to use." }]),
  h3("Classroom ideas"),
  bullet("Sound-design project: score a one-act, a radio drama, or a scene from the season show."),
  bullet("Board-op training: build the actual production’s preshow/intermission stack in the lab first."),
  bullet("Film & media: build the audio bed for a short film or podcast episode (see the Photography & Film section)."),

  ...labHead("Line Mixing Lab", SOUND, "linemixing/", "I can open the right performer’s channel exactly while they speak — and only then."),
  ...shot("linemixing", "Practice on The Importance of Being Earnest: Gwendolen’s line falls toward the mix line while the teleprompter scrolls the scene above and the DCA faders wait below."),
  h3("How it works"),
  p("Line mixing — the A1 skill of musicals — taught as a rhythm game. Each character sits on a DCA bound to a key from Z to M. Lines fall down a highway toward the mix line; students open the fader in the lead-in zone, hold through the line, and close in the trail zone, while a teleprompter scrolls the script in each character’s color."),
  bullet([{ text: "Three built-in public-domain scripts ", bold: true }, { text: "(The Importance of Being Earnest, Romeo and Juliet, and Trifles) — or paste any script; the first seven speakers map to keys automatically." }]),
  bullet([{ text: "Pace control from Relaxed to Rapid, ", bold: true }, { text: "and an Advanced mode that hides the lanes entirely so students mix from the script alone — exactly like the real console." }]),
  h3("Built-in practice & assessment"),
  bullet("Quiz: five scored minutes from a random spot in the script; accuracy percentage is recorded and earns the certificate. Warm-Up: two minutes with a savable score image. Practice: endless."),
  h3("What to collect"),
  bullet("Certificate with accuracy stats; warm-up score images as exit tickets."),
  h3("Standards connections"),
  bullet([{ text: "ST.17.8 Audio: ", bold: true }, { text: "operating mixers “to deliver clear, balanced, and reliable sound” — line mixing is the discipline that keeps a musical’s dialogue clear and its stage quiet." }]),
  bullet([{ text: "ST.18.3 Console Operation and ST.18.8 Live Event Execution: ", bold: true }, { text: "“real-time adjustments (e.g., levels, timing)” while “following cues … and managing show flow” — the game loop is literally these two standards at performance tempo." }]),
  h3("Classroom ideas"),
  bullet("Musical prep: paste scenes from the actual book and train your mix team weeks before the sitzprobe."),
  bullet("A standing bell-ringer: two-minute warm-up on entry; watch accuracy climb across a semester."),
  bullet("It doubles as listening training for actors and calling practice for stage managers — anticipate the line, commit, release."),
  pageBreak(),

  /* ────────────────────────── COSTUME ────────────────────────── */
  h1("Costume Lab", COSTUME),

  ...labHead("Costume Design Lab", COSTUME, "costume/", "I can design a costume that fits the character, the time period, and the scene."),
  ...shot("costume", "A named look in progress (“Capt. Silver — Act I”): era-tagged wardrobe pieces at right, the colour-and-pattern panel open, and one of the eight design briefs at lower left."),
  h3("How it works"),
  p("Students add figures to a stage (choosing body type and skin tone), then dress them from a wardrobe organized the way costume shops think — headwear, tops, bottoms, dresses, outerwear, shoes, accessories — with recognizable silhouettes spanning ancient Egypt and Greece, the Renaissance and Elizabethan court, the 1700s and Rococo, the Victorian and Edwardian eras, and every twentieth-century decade from flappers to disco. Each garment recolors by region (bodice vs. trim) with patterns, and every figure is labeled with a character name and scene — so the stage becomes a real costume plot."),
  h3("Built-in practice & assessment"),
  bullet("🎭 Briefs: eight design briefs with story context and era expectations — Lady Bracknell’s garden party, Viola at Orsino’s court, a Gatsby party guest, the pirate captain of the Hispaniola, a disco headliner, Cleopatra receiving Rome, a Rococo concert patron, and a 1950s greaser. The lab checks that the look uses right-era pieces and is complete, then poses reflection prompts (“My colors say wealthy and in charge, not wallflower”). All eight earn the certificate."),
  h3("What to collect"),
  bullet("The exported costume-plot PNG: the full cast, labeled by character and scene."),
  h3("Standards connections"),
  bullet([{ text: "ST.17.3 Costumes & Makeup Design: ", bold: true }, { text: "“design, source, and assemble costumes … that reflect aesthetic and cultural context … support storytelling, define character, and engage audiences.” The eight briefs check period accuracy and character logic against exactly these criteria, and the reflection prompts make students argue the storytelling case." }]),
  h3("Classroom ideas"),
  bullet("Character analysis made visible: read the scene, design the look, defend it using the brief’s reflection prompts."),
  bullet("Period-research unit: each student draws a different brief and presents their era to the class."),
  bullet("Grades 6–8: run the briefs as written. Grades 9–10: design the actual season show and export the plot as the design presentation."),
  bullet("Film crossover: character look-books and wardrobe continuity."),
  pageBreak(),

  /* ────────────────────────── COURSE INTEGRATION ────────────────────────── */
  h1("Building the Labs into a Tech Theatre Course (Grades 6–10)"),
  h3("Five ways to deploy them"),
  bullet([{ text: "Guided intro, independent finish. ", bold: true }, { text: "Project the lab, do the first steps together, then let students finish the tutorial or lessons solo. Because everything self-checks, the room self-paces." }]),
  bullet([{ text: "Station rotation. ", bold: true }, { text: "When shop space, consoles, or budgets are limited, the labs make ideal stations: tape-measure drills, a drafting challenge, a line-mixing warm-up, and glossary flash cards make a tidy four-station, 12-minute rotation." }]),
  bullet([{ text: "Bell ringers. ", bold: true }, { text: "Three labs ship two-minute warm-up modes (Scenic Construction, Portrait Lighting, Line Mixing) — a standing entry routine with score images as exit tickets." }]),
  bullet([{ text: "Pre-crew certification. ", bold: true }, { text: "Gate real equipment on the virtual version: the construction quiz before shop tools, the Live Sound certificate before the rig, a line-mixing accuracy bar before A1 assignments. It is also a defensible record that students practiced console operation (ST.18.3) and rehearsal workflow (ST.18.6) before touching production-critical gear." }]),
  bullet([{ text: "Sub-day plans. ", bold: true }, { text: "Every lab explains itself (tours, tutorials, glossaries). “Finish the drafting challenges, print your progress report, leave it on my desk” survives any substitute." }]),

  h3("Differentiation by grade band"),
  tbl(
    [2000, 3968, 3968],
    ["Lab", "Grades 6–8", "Grades 9–10"],
    [
      ["Scenic Construction", "Training mode; Easy-mode quiz; standard flats; tape drills as math warm-ups", "Standard quiz; Advanced door/window flats and miters; export cut lists for real builds"],
      ["Drafting", "Beginner tolerance (±3″)", "Advanced tolerance (±1″); fully labeled plate; springboard to CAD"],
      ["Scenic Design", "Challenges + stage-area vocabulary", "Design an assigned scene; defend sightlines and focus in critique"],
      ["Lighting Design", "The four lessons; free-design looks", "Cue a full song or scene; export the video; Eos syntax fluency"],
      ["Portrait / Studio", "Presets, guided challenges, Beginner quiz", "Advanced quiz tolerance; replicate setups with real cameras and lights"],
      ["Live Sound", "Basic skill mode; beginner scenarios", "Advanced mode and library; troubleshooting; teacher-built venue scenarios"],
      ["Sound Cue", "Tutorial with practice sounds", "Full show design with imported audio; standalone export as the deliverable"],
      ["Line Mixing", "Relaxed/Normal pace with lanes", "Brisk+ pace; Advanced (no lanes); scenes pasted from the real show"],
      ["Costume Design", "Briefs as written", "Season-show designs presented from the exported plot"]
    ]
  ),

  h3("A sample middle-school semester (intro course)"),
  p("Assuming roughly two lab days per week alongside your regular curriculum:"),
  bullet("Week 1: hub tour; students try each glossary and its flash cards. Weeks 2–4: Scenic Construction (training → quiz → drills). Weeks 5–6: Drafting Lab challenges. Weeks 7–8: Scenic Design challenges. Weeks 9–10: Costume briefs. Weeks 11–13: Lighting lessons plus a free design. Weeks 14–15: Sound Cue tutorial and a mini sound story. Week 16: Line Mixing + Live Sound taster stations. Final week: print progress reports for portfolios or conferences."),
  h3("A sample high-school year (tied to your production calendar)"),
  bullet([{ text: "Pre-season (Sept.): ", bold: true }, { text: "Scenic Construction and Drafting — the crew walks into build week reading plates and cut lists." }]),
  bullet([{ text: "Before hang (Oct.): ", bold: true }, { text: "Lighting Design lessons — hang and focus with shared vocabulary and console syntax." }]),
  bullet([{ text: "Tech month: ", bold: true }, { text: "Sound Cue Lab on the actual show’s cues; Line Mixing for the musical’s mix team. This is the stage-and-event core of the standards in production context: rehearsal workflow (ST.18.6), live event execution (ST.18.8), and the stage manager’s cue-calling ecosystem the operators plug into (ST.18.5)." }]),
  bullet([{ text: "Post-strike / spring: ", bold: true }, { text: "Scenic and Costume Design labs to propose next season’s designs; Live Sound teacher-scenarios of your venue; Portrait and Studio labs when the program shoots headshots and promos." }]),

  h3("Assessment & grading"),
  bullet([{ text: "Completion grades: ", bold: true }, { text: "certificates and the hub’s printable report (best score and completion date per lab, with signature lines)." }]),
  bullet([{ text: "Skill grades: ", bold: true }, { text: "quiz percentages — line-mixing accuracy, portrait-quiz score, challenges and briefs completed. Best-ever scores are kept, so retakes are built in; grade the best attempt on purpose." }]),
  bullet([{ text: "Design grades: ", bold: true }, { text: "for open-ended exports (designs, plots, shows, shot plans), use a short rubric such as:" }]),
  tbl(
    [2100, 2612, 2612, 2612],
    ["Criterion", "Exceeds (4)", "Meets (3)", "Developing (2–1)"],
    [
      ["Design intent", "Choices clearly serve character, scene, and story; student articulates why unprompted", "Choices mostly support the scene; reasoning is sound when asked", "Choices are decorative or arbitrary; reasoning is thin"],
      ["Technical accuracy", "Dimensions, era, angles, or signal path are correct and precise", "Minor errors that don’t break the design", "Errors a shop, board op, or crew could not work from"],
      ["Craft & completeness", "Labeled, dimensioned, tidy; every required element present", "Complete with small gaps in labeling or polish", "Missing required elements or unreadable"],
      ["Vocabulary & reflection", "Uses the lab’s terms precisely in presentation or reflection", "Uses most terms correctly", "Avoids or misuses the vocabulary"]
    ]
  ),
  h3("Standards map — CA CTE, Stage & Event Technology"),
  p("For syllabi, course outlines, and CTE program review, the table below maps each lab to the Stage & Event Technology standards it most directly serves (California CTE Model Curriculum Standards, Arts, Entertainment & Design career cluster; Performance, Music, & Live Entertainment pathway). The per-lab sections above quote the relevant standard language."),
  tbl(
    [2400, 7536],
    ["Lab", "Stage & Event Technology standards addressed"],
    [
      ["Scenic Construction", "ST.17.4 Scenic & Props · ST.18.1 Reading Technical Drawings"],
      ["Drafting", "ST.18.1 Reading Technical Drawings · ST.18.2 Event Design Software Tools"],
      ["Scenic Design", "ST.17.1 Production Design Fundamentals · ST.18.2 Event Design Software Tools · ST.18.4 Design & Test"],
      ["Lighting Design", "ST.17.7 Lighting · ST.18.3 Console Operation"],
      ["Portrait Lighting", "ST.17.7 Lighting · ST.18.4 Design & Test"],
      ["Studio Lighting", "ST.17.1 Production Design Fundamentals · ST.17.7 Lighting"],
      ["Live Sound", "ST.17.5 Power & Data Systems · ST.17.8 Audio · ST.18.7 Live Equipment Troubleshooting"],
      ["Sound Cue", "ST.18.2 Event Design Software Tools · ST.18.3 Console Operation · ST.18.8 Live Event Execution"],
      ["Line Mixing", "ST.17.8 Audio · ST.18.3 Console Operation · ST.18.8 Live Event Execution"],
      ["Costume Design", "ST.17.3 Costumes & Makeup Design"],
      ["All ten together", "ST.19.2 Production Technology and ST.19.3 Creative Direction — rotating through the hub is a hands-on career survey of the production crafts, trades, and design roles"]
    ]
  ),
  p("Beyond the pathway standards, every lab exercises the cluster’s Career Ready and Cross-Pathway expectations — collaboration, technical literacy, and safe work practices — and the design labs also sit comfortably under the National Core Arts Standards for Theatre (developing and realizing technical elements of design) if your course maps to arts credit rather than CTE.", { italics: true, color: DIM }),
  pageBreak(),

  /* ────────────────────────── PHOTO & FILM ────────────────────────── */
  h1("Using the Labs in Photography & Film Courses"),
  p("Two labs were built specifically for camera work — Portrait Lighting and Studio Lighting — and five more transfer cleanly. None of them require any theatre context to be useful."),
  p("CTE note: film and photography courses map primarily to the Media Production pathway of the same standards document. The citations below deliberately stay within the Stage & Event Technology focus area, whose lighting (ST.17.7), audio (ST.17.8), and console (ST.18.3) skill-building standards apply wherever those crafts are taught.", { italics: true, color: DIM }),
  h3("Photography"),
  bullet([{ text: "Portrait Lighting Lab is the studio-portraiture unit: ", bold: true }, { text: "eight classic patterns (Rembrandt, Butterfly, Split, Loop, Broad, Short, Rim, 3-Point), key-to-fill ratio, color temperature, and softness. Assignment ladder: recreate every preset and export the comparison sheet → pass the recreate-the-look quiz → reproduce one pattern with a real subject using one light and a reflector, submitting lab render and photograph side by side." }]),
  bullet([{ text: "Studio Lighting Lab ", bold: true }, { text: "covers product and catalog lighting, low-key vs. high-key, and contrast control — and its printable Shot Plan teaches students to plan a setup before touching gear." }]),
  h3("Film / video production"),
  bullet([{ text: "Studio Lighting Lab: ", bold: true }, { text: "the three-point interview setup, plus genre looks — noir edge and golden hour map straight onto film-language units. Require a shot plan as a pre-production deliverable (ST.17.7; ST.17.1)." }]),
  bullet([{ text: "Sound Cue Lab: ", bold: true }, { text: "design the sound bed for a short film scene, radio play, or podcast episode; the standalone export plays anywhere, so critique day needs no special software (ST.18.3; ST.18.8)." }]),
  bullet([{ text: "Scenic Design Lab: ", bold: true }, { text: "production-design previsualization — the ground-plan-to-camera-view pairing is exactly the plan-vs-frame thinking a production designer does." }]),
  bullet([{ text: "Line Mixing Lab: ", bold: true }, { text: "production-audio empathy — why dialogue must be ridden line by line; a memorable one-day station in a post-audio unit." }]),
  bullet([{ text: "Lighting Design Lab and Drafting Lab: ", bold: true }, { text: "color-and-mood studies (with cue videos as motion mood boards) and set-construction drawings for larger productions." }]),
  tbl(
    [2000, 3968, 3968],
    ["Lab", "Photography course use", "Film / video course use"],
    [
      ["Portrait Lighting", "Core studio-portrait unit: patterns, ratios, Kelvin, softness", "Close-up and beauty lighting; continuity between setups"],
      ["Studio Lighting", "Product/catalog lighting; high-key vs. low-key; planning with shot plans", "Three-point interviews; genre looks; lighting plans in pre-production"],
      ["Scenic Design", "Composition studies: diagonals, levels, frame focus", "Production-design previz; blocking for the lens"],
      ["Sound Cue", "—", "Soundscapes, Foley beds, podcast episodes; portable playback"],
      ["Line Mixing", "—", "Dialogue-mixing awareness in post-audio units"],
      ["Lighting Design", "Color temperature and mood intuition", "Motivated color studies; cue-stack videos as motion mood boards"],
      ["Drafting", "—", "Set-construction drawings for production design"]
    ]
  ),
  pageBreak(),

  /* ────────────────────────── LOGISTICS ────────────────────────── */
  h1("Logistics, Privacy & Troubleshooting"),
  h3("Devices & setup"),
  bullet("Any modern browser on Chromebooks, PCs, or Macs; Chrome or Edge recommended. No installation and no accounts."),
  bullet("A mouse makes the drawing labs (Scenic Construction, Drafting, Scenic Design) noticeably easier than a trackpad."),
  bullet("Headphones for the three sound labs — thirty students discovering the GO button at once is its own kind of theatre."),
  h3("How saving works (worth two minutes with your class)"),
  bullet("Progress and projects save automatically per browser, per computer. A student who sits at the same machine keeps everything; a different machine is a fresh start."),
  bullet("Downloads are forever: certificates, score cards, exports, and printed reports don’t depend on the machine. Make “download your evidence before the bell” the routine, and collect it through your LMS."),
  bullet("Shared computers mingle progress across periods. Have students put their name on certificates (the labs remember it per machine — confirm it’s theirs), and treat the hub’s Reset button with respect: it permanently clears every lab’s progress on that machine. Use it between semesters, not between periods."),
  h3("Privacy"),
  bullet("There is no server, no account, and no analytics: nothing a student does in the labs leaves the computer. The only personal information anywhere is an optional, self-entered name used to stamp certificates and reports, stored on that machine alone."),
  bullet("The site is plain static files, so IT can mirror it on a school server (or even a USB stick) if your network is restrictive."),
  h3("Quick troubleshooting"),
  bullet([{ text: "“It looks broken/stale after an update” ", bold: true }, { text: "— hard refresh (Ctrl+F5 / Cmd+Shift+R)." }]),
  bullet([{ text: "“No sound” ", bold: true }, { text: "— browsers block audio until the page is clicked once; press GO again after any click. Check the tab isn’t muted." }]),
  bullet([{ text: "“My progress disappeared” ", bold: true }, { text: "— different machine, different browser, a cleared cache, or someone pressed Reset. The downloaded artifacts are the durable record." }]),
  bullet([{ text: "“The report won’t print” ", bold: true }, { text: "— allow pop-ups for the site; the report opens in a new window." }]),
  bullet([{ text: "Imported audio in the Sound Cue Lab ", bold: true }, { text: "lives in the browser’s storage — keep clips reasonably short on shared machines, or export the show file to keep it portable." }]),

  new Paragraph({
    spacing: { before: 360, after: 0 },
    border: { top: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC", space: 8 } },
    children: [new TextRun({ text: "Maintained by the SDSCPA Design & Production program. The labs are free to use and grow with the program — if a lesson lands (or flops), tell us so the next version teaches better.", italics: true, size: 20, color: DIM })]
  })
);

/* ── document ───────────────────────────────────────── */
const doc = new Document({
  creator: "SDSCPA Design & Production",
  title: "SDSCPA Design & Production Virtual Labs — Teacher’s Guide",
  description: "How each virtual lab works and how to use them in grades 6–10 tech theatre, photography, and film courses.",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 21, color: INK } }
    }
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 200 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 200 } } } }
      ]
    }]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },           // US Letter
        margin: { top: 1080, bottom: 1080, left: 1152, right: 1152 }
      }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "SDSCPA Design & Production Virtual Labs · Teacher’s Guide · page ", size: 17, color: DIM }),
            new TextRun({ children: [PageNumber.CURRENT], size: 17, color: DIM })
          ]
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  const out = "C:\\Users\\harri\\Scenic Construction App\\SDSCPA-Virtual-Labs-Teacher-Guide.docx";
  fs.writeFileSync(out, buf);
  console.log("Wrote", out, buf.length, "bytes");
});
