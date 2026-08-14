# SDSCPA Safety Lab Canvas modules

The `dist` folder contains one Canvas Common Cartridge package for each requested grade. Each package imports:

- one published, sequential Canvas module;
- one branded Canvas page for every Safety Lab module assigned to that grade;
- one grade-specific Canvas quiz with unlimited attempts;
- module requirements that make students view every page and earn 100% on the test.

The certification test builds on each student's last attempt. Correct responses carry forward, and each new attempt presents only the questions the student previously missed. Question feedback names the related module so the student can review it before trying those questions again.

## Import into Canvas

1. Open the destination Canvas course and select **Settings**.
2. Select **Import Course Content**.
3. Choose **Common Cartridge 1.x Package**.
4. Upload the `.imscc` file for the course's grade from `canvas/dist`.
5. If Canvas displays **Import existing quizzes as New Quizzes**, select it. Build on Last Attempt is a New Quizzes feature.
6. Select **All content**, then start the import.
7. Open **Modules** and confirm the imported grade-level module and its items are published.
8. Open the certification test settings and confirm **Allow multiple attempts** and **Build on Last Attempt** are enabled.
9. Use **Student View** once to confirm the final test requires the full point total shown in the module requirement.

Import only the package that matches the students in that Canvas course. The pages are self-contained and do not link to the Railway or GitHub-hosted Safety Lab.

## Rebuild after Safety Lab content changes

Run:

```sh
node canvas/build-safety-modules.mjs
```

The generator reads `safety/index.html`, applies the same cumulative grade filters as the live lab, validates every test answer, and replaces the three packages in `canvas/dist`.
