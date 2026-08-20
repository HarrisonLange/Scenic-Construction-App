# 3D Printing Lab — open-source notices

This browser application performs all model processing and slicing locally on the student's device.

## Kiri:Moto

The STL parsing and 3D preview engine is built from [GridSpace/grid-apps](https://github.com/GridSpace/grid-apps) commit `d138275bbe9d4e4030d8cb8b2dcf66607da9295a`. Kiri:Moto is Copyright 2014–2018 Stewart Allen and is distributed under the MIT License. The full license is included at `licenses/KIRI-MOTO-MIT.txt`.

## CuraEngine WebAssembly

Local toolpath generation, including tree supports, uses [Cloud-CNC/cura-wasm](https://github.com/Cloud-CNC/cura-wasm) version `1.5.2`, which embeds Ultimaker CuraEngine `4.6.1` as WebAssembly. The combined MIT, LGPL-3.0-or-later, and AGPL-3.0-or-later license text supplied with that distribution is included at `licenses/CURA-WASM-LICENSE.txt`. The corresponding published source is available from the linked repository and its documented CuraEngine upstream.

## Bambu Studio profiles

The Bambu Lab H2S and P1S machine, project, and G-code profile data is taken from [bambulab/BambuStudio](https://github.com/bambulab/BambuStudio) commit `9a530f77c23d8c3430d1dbef02e103cd8bd6480e`. Bambu Studio is distributed under the GNU Affero General Public License version 3. The full license is included at `licenses/BAMBU-STUDIO-AGPL-3.0.txt`.

## OrcaSlicer profile model

The simplified material/process controls follow the open profile organization used by [OrcaSlicer](https://github.com/OrcaSlicer/OrcaSlicer), which is distributed under the GNU Affero General Public License version 3. This app does not claim to be an official OrcaSlicer or Bambu Lab product.
