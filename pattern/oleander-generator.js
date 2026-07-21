/* Native Pattern Lab patterns. A generator can opt into fixedSizes to use only
   its publisher-provided cut lines instead of the made-to-measure controls. */
(function(){
  'use strict';

  const SOURCE='https://blog.moodfabrics.com/the-oleander-dress-free-sewing-pattern/';
  const MM_PER_IN=25.4;

  // The PDF combines adjacent published sizes into one cut line. Each entry
  // uses the upper labeled size from Mood's chart, which is the safe fit value
  // for that shared line. Draft values are fixed grading records, not editable
  // measurements; selecting another size swaps the entire record.
  const SIZE_ROWS=[
    {id:'0/2',  chartSize:'2',  published:{neck:12.5,bust:32.5,waist:24.5,hips:34.5}, draft:{highBust:30.5,bustSpan:6.5,hpsToBust:9.5,waistToUnderbust:3.75,waistToFloor:41,waistToHips:8,waistToKnee:23.5}},
    {id:'4/6',  chartSize:'6',  published:{neck:13,bust:34.5,waist:25.5,hips:35.5}, draft:{highBust:32.5,bustSpan:6.875,hpsToBust:9.625,waistToUnderbust:3.875,waistToFloor:41.25,waistToHips:8,waistToKnee:23.75}},
    {id:'8/10', chartSize:'10', published:{neck:14,bust:36.5,waist:27.5,hips:37.5}, draft:{highBust:34.5,bustSpan:7.125,hpsToBust:9.75,waistToUnderbust:4,waistToFloor:41.5,waistToHips:8.125,waistToKnee:24}},
    {id:'12/14',chartSize:'14', published:{neck:15,bust:39.5,waist:30.5,hips:40.5}, draft:{highBust:37.5,bustSpan:7.5,hpsToBust:9.875,waistToUnderbust:4.125,waistToFloor:41.75,waistToHips:8.25,waistToKnee:24.25}},
    {id:'16/18',chartSize:'18', published:{neck:16.5,bust:43.5,waist:34.5,hips:45}, draft:{highBust:41.5,bustSpan:8.5,hpsToBust:10,waistToUnderbust:4.25,waistToFloor:42,waistToHips:8.375,waistToKnee:24.5}},
    {id:'20/22',chartSize:'22', published:{neck:17.5,bust:48.5,waist:39.5,hips:51}, draft:{highBust:46.5,bustSpan:9.5,hpsToBust:10.25,waistToUnderbust:4.5,waistToFloor:42.25,waistToHips:8.5,waistToKnee:24.75}},
    {id:'24/26',chartSize:'26', published:{neck:18.5,bust:53.5,waist:44.5,hips:57}, draft:{highBust:51.5,bustSpan:10.25,hpsToBust:10.5,waistToUnderbust:4.75,waistToFloor:42.5,waistToHips:8.625,waistToKnee:25}},
    {id:'28/30',chartSize:'30', published:{neck:19.5,bust:58.5,waist:49.5,hips:63}, draft:{highBust:56.5,bustSpan:11,hpsToBust:10.75,waistToUnderbust:5,waistToFloor:42.75,waistToHips:8.75,waistToKnee:25.25}}
  ];
  // Exact publisher cut-line geometry recovered from the supplied tiled PDF.
  // Coordinates are normalized millimeters; selecting a size swaps the whole
  // source plate instead of mathematically grading a neighboring size.
  const SOURCE_PLATES={"28/30":{"centerFront":[140.51,225.22,"M 0 224.34 L 0.99 80.16 L 3.72 76.26 L 6.95 71.99 C 16.69 59.41 27.95 47.96 40.69 38.41 L 44.81 35.25 L 49.13 32.27 C 63.7 22.44 79.66 14.59 96.49 9.5 L 101.49 8.14 L 110.0 6.1 L 122.82 3.48 L 140.35 0 L 140.51 93.6 L 139.84 101.79 L 138.24 117.08 L 136.33 132.27 L 134.13 147.47 L 132.9 154.96 L 132.05 161.75 L 130.77 172.45 L 129.81 182.73 L 129.02 192.92 L 128.46 202.83 L 127.61 225.22 L 0 224.34 Z"],"sideBack":[267.5,167.39,"M 0 0 L 267.5 0 L 260.39 167.39 L 9.4 167.39 L 0 0 Z"],"back":[155.6,167.49,"M 0 0 L 155.6 0 L 155.6 167.49 L 7.2 167.49 L 0 0 Z"],"sideFront":[284.71,217.8,"M 42.9 1.59 L 48.41 2.39 L 53.81 3.3 L 59.01 4.3 L 64.11 5.5 L 66.51 6.1 L 71.9 7.49 L 284.71 54.5 L 274.91 116.8 L 261.92 217.8 L 10.6 217.8 L 10.1 204.7 L 9.61 195.09 L 9.1 187.49 L 8.3 177.5 L 7.41 167.79 L 6.2 158.39 L 5.02 149.29 L 3.92 141.8 L 2.5 135.3 L 1.4 128.29 L 0.8 123.7 L 0.4 119.19 L 0.11 114.7 L 0 110.19 L 0 105.71 L 0.21 101.2 L 0.61 96.69 L 1.1 92.31 L 2.12 85.09 L 3.22 77.3 L 4.0 72.2 L 5.1 66.8 L 6.31 61.3 L 7.51 56.2 L 10.5 45.59 L 13.91 35.2 L 16.3 28.81 L 29.7 0 L 42.9 1.59 Z"],"skirt":[834.94,988.81,"M 0 987.51 L 1.54 0 L 834.94 1.3 L 833.39 988.81 L 0 987.51 Z"],"lowerBack":[376.79,163.49,"M 376.79 0.59 L 376.79 143.59 L 285.9 143.59 L 277.09 143.89 L 268.1 144.29 L 259.19 144.99 L 250.3 145.8 L 241.38 146.71 L 232.49 147.89 L 223.69 149.29 L 214.8 150.79 L 209.3 151.41 L 203.09 151.89 L 196.89 152.1 L 183.68 152.51 L 176.78 152.8 L 169.29 153.29 L 149.8 154.79 L 31.5 163.49 L 9.99 63.61 L 0 25.59 L 65.7 16.0 C 95.44 11.73 125.3 7.81 155.19 4.8 L 173.48 3.09 L 191.79 1.8 L 210.18 0.8 L 228.49 0.19 L 246.89 0 L 265.28 0.11 L 283.7 0.59 L 376.79 0.59 Z"],"lowerFront":[356.8,166.33,"M 0.83 0 L 80.73 0.46 L 95.82 0.74 L 104.73 0.98 L 111.12 1.42 L 116.33 1.77 L 123.23 1.7 L 132.01 1.86 C 151.98 2.12 171.4 4.04 191.3 5.3 L 203.81 6.28 L 220.98 7.78 C 252.39 10.8 283.59 14.63 314.82 19.22 L 332.6 21.82 L 356.8 25.56 L 349.57 63.32 L 333.16 166.33 L 214.43 156.44 L 193.03 155.8 L 184.82 155.35 L 177.33 154.91 L 170.14 154.27 L 163.24 153.54 L 156.75 152.69 L 150.45 151.66 L 140.36 149.91 L 130.57 148.35 L 120.37 146.98 L 109.99 145.82 L 99.79 144.87 L 89.89 144.11 L 80.09 143.65 L 70.21 143.39 L 0 142.98 L 0.83 0 Z"]},"24/26":{"centerFront":[134.08,218.93,"M 0 218.1 L 0.97 77.01 L 2.98 74.12 L 6.01 70.03 L 9.13 65.95 L 12.35 62.08 L 15.68 58.31 L 19.22 54.52 L 22.84 50.85 L 26.65 47.27 L 30.28 43.91 L 34.21 40.64 L 38.13 37.45 L 42.15 34.49 L 46.28 31.51 L 50.49 28.75 L 54.7 26.17 L 59.03 23.6 L 63.54 21.13 L 68.17 18.77 L 72.78 16.6 L 77.49 14.52 L 82.2 12.66 L 87.02 10.98 L 91.73 9.43 L 96.54 7.96 L 100.04 7.07 L 104.64 6.0 L 116.96 3.4 L 133.89 0 L 134.08 90.51 L 133.41 98.8 L 131.8 113.99 L 129.9 129.18 L 127.7 144.38 L 126.44 151.87 L 125.61 158.36 L 124.34 168.55 L 123.36 178.45 L 122.59 188.14 L 122.04 197.54 L 121.09 218.93 L 0 218.1 Z"],"sideBack":[242.29,164.19,"M 0 0 L 242.29 0 L 235.1 164.19 L 9.5 164.19 L 0 0 Z"],"back":[149.31,164.3,"M 0 0 L 149.31 0 L 149.31 164.3 L 7.2 164.3 L 0 0 Z"],"sideFront":[259.29,211.39,"M 42.8 1.61 L 48.3 2.39 C 56.45 3.56 63.98 5.43 71.9 7.49 L 259.29 51.5 L 249.49 113.6 L 236.41 211.39 L 10.6 211.39 L 9.99 198.8 C 9.23 180.96 7.45 163.46 4.91 145.8 L 3.81 138.6 L 2.39 132.1 L 1.29 125.09 C 0.25 117.71 -0.35 109.86 0 102.4 L 0.11 97.9 L 0.51 93.41 L 0.99 89.01 L 2.01 81.81 L 3.2 74.4 L 4.0 69.51 L 5.1 64.49 L 6.31 59.39 L 7.49 54.5 L 10.5 44.6 L 13.91 34.8 L 16.19 28.7 L 29.59 0 L 42.8 1.61 Z"],"skirt":[825.28,893.38,"M 0 892.09 L 1.39 0 L 825.28 1.29 L 823.89 893.38 L 0 892.09 Z"],"lowerBack":[345.1,160.21,"M 345.1 0.3 L 345.1 140.1 L 260.6 140.1 L 251.8 140.4 L 242.8 140.8 L 233.91 141.5 L 224.9 142.3 L 216.11 143.21 L 207.2 144.4 L 198.31 145.8 L 189.4 147.3 L 184.7 147.81 L 179.41 148.31 L 162.71 149.1 L 150.3 149.9 L 133.41 151.41 L 31.6 160.21 L 10.01 63.42 L 0 25.4 L 59.8 16.11 L 89.51 11.71 L 116.5 8.11 L 130.81 6.31 L 141.31 5.1 L 158.01 3.51 L 174.71 2.12 L 191.41 1.1 L 208.11 0.4 L 224.81 0 L 241.6 0 L 258.4 0.3 L 345.1 0.3 Z"],"lowerFront":[325.07,163.14,"M 0.81 0 L 77.12 0.44 L 91.11 0.71 L 99.21 1.06 L 105.2 1.41 L 110.0 1.73 L 116.2 1.77 L 124.01 1.9 L 134.7 2.47 L 145.09 3.12 L 152.68 3.67 L 158.69 4.22 L 177.08 5.62 L 188.27 6.68 L 203.56 8.16 L 220.25 10.08 L 232.44 11.55 L 260.63 15.31 L 287.51 19.36 L 303.39 21.95 L 325.07 25.57 L 317.84 63.14 L 301.37 163.14 L 199.12 153.34 L 180.63 152.45 L 167.24 151.46 L 160.93 150.83 L 155.05 150.1 L 149.45 149.37 L 144.06 148.43 L 134.37 146.68 L 124.98 145.23 L 115.19 143.86 L 105.18 142.59 L 95.39 141.65 L 85.89 141.0 L 76.39 140.44 L 66.91 140.17 L 0 139.78 L 0.81 0 Z"]},"20/22":{"centerFront":[127.64,212.62,"M 0 211.84 L 0.95 73.73 L 2.06 72.04 L 4.98 68.06 C 14.78 54.87 26.34 43.49 39.51 33.69 L 43.43 30.82 L 47.44 28.15 L 51.57 25.58 L 55.69 23.11 L 60.01 20.64 L 64.42 18.36 L 68.84 16.3 L 73.34 14.32 L 77.86 12.47 L 82.47 10.78 L 86.99 9.23 L 91.59 7.86 L 99.41 5.9 L 111.22 3.3 L 127.46 0 L 127.64 87.4 L 126.99 95.69 L 125.39 110.88 L 123.48 126.07 L 121.28 141.27 L 120.03 148.75 L 119.18 155.03 L 118.01 164.64 L 117.06 174.03 L 116.19 183.31 L 115.62 192.33 L 114.7 212.62 L 0 211.84 Z"],"sideBack":[217,160.99,"M 0 0 L 217.0 0 L 209.8 160.99 L 9.5 160.99 L 0 0 Z"],"back":[142.92,161.01,"M 0 0 L 142.92 0 L 142.92 161.01 L 7.3 161.01 L 0 0 Z"],"sideFront":[234.1,205,"M 42.9 1.61 L 48.41 2.41 C 56.55 3.57 64.22 5.39 72.11 7.6 L 234.1 48.51 L 224.3 110.51 L 211.2 205.0 L 10.71 205.0 L 9.61 184.21 C 8.73 170.09 7.1 156.3 5.02 142.3 L 3.92 135.51 L 2.5 128.9 L 1.4 121.9 L 0.8 117.31 L 0.4 112.8 L 0.11 108.2 L 0 103.7 L 0 99.21 L 0.21 94.62 L 0.61 90.21 C 1.53 80.85 3.14 71.37 5.31 62.21 L 6.5 57.3 L 7.7 52.81 L 10.71 43.5 L 14.1 34.31 L 16.4 28.6 L 29.7 0 L 42.9 1.61 Z"],"skirt":[815.55,797.96,"M 0 796.69 L 1.24 0 L 815.55 1.27 L 814.3 797.96 L 0 796.69 Z"],"lowerBack":[313.29,157.1,"M 313.29 0.11 L 313.29 136.69 L 235.18 136.69 L 226.4 136.99 L 217.38 137.39 L 208.49 138.09 L 199.6 138.9 L 190.69 139.81 L 181.8 140.99 L 173.0 142.39 L 164.08 143.89 L 160.08 144.4 L 155.7 144.8 L 141.58 145.8 L 131.19 146.71 L 117.09 148.21 L 31.69 157.1 L 9.88 63.2 L 0 25.4 L 53.78 16.3 L 80.58 12.11 L 104.9 8.59 L 127.3 5.59 L 142.28 4.0 L 157.4 2.6 L 172.38 1.5 L 187.49 0.7 L 202.59 0.19 L 217.7 0 L 232.9 0.11 L 313.29 0.11 Z"],"lowerFront":[293.26,160.06,"M 0.79 0 L 73.5 0.42 L 86.28 0.69 L 93.79 1.05 L 99.3 1.38 L 103.68 1.7 L 109.09 1.83 L 116.08 2.07 L 125.47 2.63 L 134.57 3.38 L 141.28 3.91 L 146.67 4.55 L 162.85 6.04 L 172.75 7.09 L 186.25 8.57 L 211.74 12.02 L 236.5 15.68 L 260.29 19.6 L 274.27 22.08 L 293.26 25.59 L 286.14 62.95 L 269.57 160.06 L 183.82 150.16 L 168.33 148.97 L 157.04 147.91 L 146.84 146.65 L 137.56 145.19 L 128.36 143.45 C 112.86 140.8 97.58 138.9 81.89 137.78 L 72.79 137.22 L 63.69 136.96 L 0 136.59 L 0.79 0 Z"]},"16/18":{"centerFront":[121.23,206.42,"M 0 205.68 L 0.93 70.47 L 3.96 66.19 L 6.78 62.51 L 9.7 58.82 L 12.74 55.25 L 15.96 51.78 L 19.28 48.31 L 22.69 45.03 L 26.01 41.85 L 29.55 38.77 L 33.17 35.79 L 36.78 33.02 L 40.59 30.25 L 44.42 27.56 L 48.33 25.09 L 52.24 22.73 L 56.37 20.34 L 60.59 18.17 L 64.9 16.11 L 69.21 14.14 L 73.42 12.37 L 77.83 10.69 L 82.25 9.22 L 86.66 7.85 L 94.16 5.91 L 105.48 3.39 L 121.0 0 L 121.23 84.4 L 120.58 92.69 L 118.97 107.88 L 117.07 123.06 L 114.87 138.35 L 113.61 145.85 L 112.77 151.73 L 111.6 160.83 L 110.65 169.82 L 109.79 178.51 L 109.22 187.12 L 108.2 206.42 L 0 205.68 Z"],"sideBack":[191.81,157.8,"M 0 0 L 191.81 0 L 184.51 157.8 L 9.61 157.8 L 0 0 Z"],"back":[136.5,157.82,"M 0 0 L 136.5 0 L 136.5 157.82 L 7.3 157.82 L 0 0 Z"],"sideFront":[208.39,198.61,"M 42.59 1.61 L 48.09 2.41 C 56.25 3.57 63.95 5.46 71.88 7.6 L 208.39 45.61 L 198.69 107.32 L 185.48 198.61 L 10.5 198.61 L 9.88 187.11 L 9.4 178.71 L 8.78 172.11 L 7.98 163.41 L 6.98 154.92 L 5.88 146.81 L 4.7 138.81 L 3.6 132.31 L 2.18 125.71 L 1.08 118.62 L 0.49 114.11 C -0.35 106.25 -0.53 99.2 0 91.31 L 0.3 86.91 L 0.78 82.4 C 2.03 73.3 3.74 64.25 6.29 55.41 L 7.6 51.12 L 10.5 42.42 L 13.89 33.8 L 16.09 28.51 L 29.38 0 L 42.59 1.61 Z"],"skirt":[805.89,702.36,"M 0 701.1 L 1.1 0 L 805.89 1.26 L 804.8 702.36 L 0 701.1 Z"],"lowerBack":[281.6,154.2,"M 281.6 0 L 281.6 133.39 L 209.91 133.39 L 201.1 133.69 L 192.11 134.09 L 183.2 134.79 L 174.31 135.59 L 165.4 136.5 L 156.51 137.69 L 147.7 139.09 L 138.81 140.59 L 132.21 141.39 L 120.61 142.6 L 112.31 143.59 L 100.8 145.1 L 31.9 154.2 L 9.91 63.2 L 0 25.4 L 48.01 16.7 L 71.8 12.59 L 93.41 9.1 L 113.41 6.29 L 126.7 4.59 L 140.21 3.09 L 153.61 1.99 L 167.0 1.1 L 180.51 0.49 L 194.01 0.11 L 207.5 0 L 281.6 0 Z"],"lowerFront":[261.53,157.18,"M 0.77 0 L 69.88 0.4 L 81.56 0.77 L 93.37 1.34 L 97.37 1.66 L 102.07 1.9 L 108.06 2.23 L 116.27 2.87 L 130.06 4.24 L 134.65 4.88 L 148.63 6.47 L 168.91 9.08 L 191.01 12.41 L 212.48 16.02 L 232.97 19.85 L 261.53 25.62 L 254.41 62.88 L 237.67 157.18 L 168.43 147.07 L 155.93 145.6 L 146.83 144.44 L 138.65 143.3 L 131.14 141.96 L 122.26 140.3 L 113.68 138.77 L 104.67 137.51 L 95.59 136.36 L 86.58 135.31 L 77.89 134.65 L 69.19 134.11 L 60.49 133.74 L 0 133.39 L 0.77 0 Z"]},"12/14":{"centerFront":[114.81,200.11,"M 0 199.41 L 0.9 67.23 L 2.94 64.35 L 5.54 60.77 L 8.38 57.19 L 11.31 53.8 L 14.23 50.33 L 17.45 47.05 L 20.67 43.85 C 27.16 37.34 33.88 32.25 41.38 27.0 L 48.82 22.26 C 57.88 16.96 67.38 12.34 77.4 9.14 L 81.73 7.78 L 88.83 5.84 L 99.64 3.31 L 114.57 0 L 114.81 81.3 L 114.17 89.6 L 112.56 104.78 L 110.65 120.08 L 108.46 135.26 L 107.2 142.76 L 106.35 148.35 L 105.19 157.04 L 104.25 165.44 L 103.39 173.73 L 102.82 181.83 L 101.7 200.11 L 0 199.41 Z"],"sideBack":[172.8,154.6,"M 0 0 L 172.8 0 L 165.5 154.6 L 9.59 154.6 L 0 0 Z"],"back":[130.2,154.6,"M 0 0 L 130.2 0 L 130.2 154.6 L 7.3 154.6 L 0 0 Z"],"sideFront":[188.62,192.19,"M 41.8 1.59 L 47.31 2.39 L 52.7 3.3 L 57.91 4.3 L 63.01 5.48 L 65.4 6.1 L 71.2 7.6 L 188.62 42.59 L 178.9 104.1 L 165.61 192.19 L 9.8 192.19 L 9.1 181.29 L 8.61 173.29 L 8.0 166.98 L 7.2 158.69 L 6.2 150.69 L 5.1 142.9 L 3.92 135.3 L 2.82 129.1 L 1.4 122.49 L 0.3 115.4 C -1.52 103.21 -1.44 91.32 0 79.1 L 1.1 71.8 L 2.41 65.7 L 3.3 61.79 L 4.4 57.59 L 5.71 53.3 L 6.9 49.38 L 9.91 41.3 L 13.21 33.3 L 15.41 28.38 L 28.6 0 L 41.8 1.59 Z"],"skirt":[796.16,625.53,"M 0 624.29 L 0.98 0 L 796.16 1.24 L 795.19 625.53 L 0 624.29 Z"],"lowerBack":[256.1,151.49,"M 256.1 0 L 256.1 130.2 L 190.8 130.2 L 181.99 130.49 L 173.0 130.89 L 164.11 131.59 L 155.19 132.4 L 146.3 133.31 L 137.39 134.49 L 128.61 135.89 L 119.7 137.39 L 104.8 139.59 L 88.6 142.09 L 32.0 151.49 L 9.91 63.2 L 0 25.59 L 43.5 17.1 L 65.11 13.1 L 84.71 9.69 L 102.81 6.79 L 115.0 5.1 L 127.11 3.7 L 139.3 2.5 L 151.49 1.5 L 163.81 0.7 L 176.0 0.19 L 188.4 0 L 256.1 0 Z"],"lowerFront":[236,154.33,"M 0.76 0 L 62.65 0.36 C 73.56 0.41 84.47 1.01 95.34 1.95 L 107.84 3.03 L 119.94 4.5 L 124.13 5.12 L 136.42 6.8 L 154.31 9.51 L 173.79 12.82 L 192.77 16.42 L 210.85 20.12 L 236.0 25.66 L 228.89 62.73 L 212.06 154.33 L 155.22 144.01 L 137.54 141.11 L 124.65 138.73 C 105.22 134.74 85.4 131.95 65.59 130.89 L 57.3 130.53 L 0 130.19 L 0.76 0 Z"]},"4/6":{"centerFront":[101.97,187.71,"M 0 187.1 L 0.87 60.7 L 3.17 57.41 L 5.69 54.15 C 13.18 44.39 22.23 35.89 31.97 28.42 L 35.29 25.94 L 38.61 23.76 L 42.03 21.48 L 45.64 19.3 L 49.25 17.34 L 52.87 15.35 L 56.58 13.58 L 60.3 11.91 L 64.1 10.33 L 67.92 8.96 L 71.71 7.69 L 78.23 5.83 L 88.15 3.29 L 101.57 0 L 101.97 75.29 L 101.29 83.59 L 99.69 98.88 L 97.78 114.07 L 95.58 129.35 L 94.33 136.84 L 93.51 141.85 L 92.36 149.53 L 91.39 157.03 L 90.54 164.33 L 89.9 171.52 L 88.79 187.71 L 0 187.1 Z"],"sideBack":[153.8,148.19,"M 0 0 L 153.8 0 L 146.39 148.19 L 9.69 148.19 L 0 0 Z"],"back":[117.31,148.21,"M 0 0 L 117.31 0 L 117.31 148.21 L 7.3 148.21 L 0 0 Z"],"sideFront":[170.5,179.41,"M 42.8 1.61 L 48.3 2.39 L 53.7 3.3 L 58.91 4.3 L 64.01 5.5 L 66.4 6.1 L 72.2 7.6 L 170.5 36.09 L 160.8 97.79 L 147.4 179.41 L 11.01 179.41 L 9.61 162.39 C 8.22 149.12 6.57 135.87 3.81 122.81 L 2.39 116.2 L 1.29 109.01 L 0.7 104.39 L 0.3 99.8 L 0 95.21 L 0 86.11 L 0.21 81.41 L 0.51 76.9 L 0.99 72.39 L 2.1 65.11 L 3.49 59.9 L 5.69 52.9 L 6.9 49.4 L 8.19 45.89 L 11.09 38.99 L 14.39 32.19 L 16.51 28.0 L 29.59 0 L 42.8 1.61 Z"],"skirt":[776.92,528.62,"M 0 527.41 L 0.82 0 L 776.92 1.21 L 776.1 528.62 L 0 527.41 Z"],"lowerBack":[224.2,145.9,"M 224.2 0 L 224.2 123.8 L 171.7 123.8 L 162.9 124.1 L 153.9 124.5 L 144.99 125.2 L 136.1 126.01 L 127.3 126.92 L 118.41 128.1 L 109.6 129.5 L 100.71 130.92 L 89.11 133.31 L 76.5 136.1 L 32.49 145.9 L 9.91 63.42 L 0 25.8 L 39.01 17.5 L 58.4 13.61 L 76.09 10.2 L 92.31 7.41 L 103.21 5.72 L 114.11 4.21 L 125.09 2.9 L 136.1 1.9 L 147.11 1.02 L 158.09 0.4 L 169.21 0 L 224.2 0 Z"],"lowerFront":[204.07,148.74,"M 0.72 0 L 59.12 0.34 L 67.41 0.79 L 75.71 1.32 L 78.52 1.55 L 82.12 1.87 L 93.01 3.14 L 103.58 4.79 L 107.09 5.32 L 117.88 7.07 L 133.36 9.87 L 150.25 13.17 L 166.63 16.75 L 182.3 20.34 L 204.07 25.78 L 196.95 62.63 L 179.75 148.74 L 121.73 134.5 L 111.54 132.13 L 103.95 130.59 L 96.58 129.15 L 88.88 127.92 L 80.99 126.77 L 73.29 125.81 L 65.8 125.07 L 58.29 124.52 L 50.8 124.08 L 0 123.78 L 0.72 0 Z"]},"0/2":{"centerFront":[95.53,181.61,"M 0 181.05 L 0.85 57.44 L 1.96 55.86 L 4.26 52.76 L 6.78 49.69 L 9.22 46.61 L 11.93 43.63 L 14.66 40.75 L 17.36 38.06 L 20.2 35.39 L 23.11 32.8 L 26.14 30.33 L 29.14 27.85 L 32.26 25.56 L 35.37 23.38 L 38.58 21.2 L 42.0 19.13 L 45.42 17.14 L 48.93 15.28 L 52.43 13.51 L 55.96 11.82 L 59.57 10.34 L 63.18 8.97 L 66.78 7.7 L 73.0 5.84 L 82.31 3.3 L 95.14 0 L 95.53 72.39 L 94.88 80.69 L 93.27 95.98 L 91.37 111.27 L 89.17 126.45 L 87.91 134.04 L 87.08 138.63 L 85.95 145.84 L 84.99 152.82 L 84.14 159.72 L 83.5 166.42 L 82.19 181.61 L 0 181.05 Z"],"sideBack":[147.51,144.99,"M 0 0 L 147.51 0 L 140.1 144.99 L 9.8 144.99 L 0 0 Z"],"back":[111,145.01,"M 0 0 L 111.0 0 L 111.0 145.01 L 7.39 145.01 L 0 0 Z"],"sideFront":[164.21,173,"M 42.8 1.61 L 48.3 2.41 C 56.49 3.57 64.15 5.43 72.09 7.6 L 164.21 32.7 L 154.41 94.7 L 140.91 173.0 L 11.09 173.0 L 10.31 163.81 L 9.61 156.99 L 9.0 151.7 L 8.11 144.7 L 7.09 137.9 L 6.01 131.3 L 4.91 124.9 L 3.81 119.7 L 2.39 113.01 L 1.29 105.81 L 0.7 101.2 L 0.3 96.6 L 0 91.91 L 0 82.7 L 0.21 78.1 L 0.59 73.6 L 1.1 69.0 L 2.2 61.59 L 3.6 56.9 L 5.8 50.5 L 8.4 44.11 L 11.3 37.8 L 14.5 31.6 L 16.59 27.81 L 29.59 0 L 42.8 1.61 Z"],"skirt":[767.36,489.79,"M 0 488.59 L 0.76 0 L 767.36 1.2 L 766.59 489.79 L 0 488.59 Z"],"lowerBack":[211.39,143.09,"M 211.39 0 L 211.39 120.59 L 165.29 120.59 L 156.49 120.88 L 147.6 121.28 L 138.71 121.9 L 129.79 122.79 L 120.9 123.7 L 112.1 124.88 L 103.29 126.2 L 94.4 127.7 L 90.09 128.69 L 83.9 130.2 L 72.5 132.99 L 32.7 143.09 L 9.91 63.39 L 0 25.89 L 37.49 17.7 L 56.2 13.8 L 73.09 10.39 L 88.79 7.6 C 106.19 4.55 123.89 2.42 141.5 1.1 L 152.1 0.38 L 162.69 0 L 211.39 0 Z"],"lowerFront":[191.24,145.87,"M 0.7 0 L 55.6 0.32 L 62.69 0.76 L 69.8 1.29 L 72.19 1.52 L 85.98 3.18 L 95.97 4.85 L 99.37 5.38 L 109.56 7.24 L 124.24 9.92 L 140.22 13.3 L 155.8 16.9 L 170.59 20.48 L 191.24 25.91 L 184.24 62.66 L 166.86 145.87 L 126.73 134.74 L 114.24 131.26 L 105.05 128.9 L 97.86 127.35 L 90.88 126.02 L 83.59 124.77 L 76.08 123.63 L 68.78 122.7 L 61.69 121.85 L 54.61 121.3 L 47.5 120.86 L 0 120.58 L 0.7 0 Z"]},"8/10":{"centerFront":[108.4,193.91,"M 0 193.26 L 0.88 63.97 L 1.91 62.48 L 4.43 59.09 L 7.06 55.7 L 9.77 52.44 L 12.59 49.15 L 15.61 45.87 L 18.64 42.78 L 21.75 39.9 L 24.88 37.02 L 28.2 34.25 L 31.42 31.56 L 34.82 29.01 L 38.35 26.51 L 41.86 24.14 L 45.48 21.86 L 49.19 19.68 L 53.02 17.61 L 56.93 15.65 L 60.84 13.77 L 64.74 12.0 L 68.75 10.42 L 72.68 9.05 L 76.69 7.68 L 83.6 5.82 L 93.91 3.29 L 108.13 0 L 108.4 78.3 L 107.73 86.49 L 106.14 101.78 L 104.24 117.07 L 102.02 132.25 C 99.52 146.95 97.37 161.74 96.42 176.62 L 95.21 193.91 L 0 193.26 Z"],"sideBack":[160.1,151.38,"M 0 0 L 160.1 0 L 152.8 151.38 L 9.61 151.38 L 0 0 Z"],"back":[123.7,151.41,"M 0 0 L 123.7 0 L 123.7 151.41 L 7.3 151.41 L 0 0 Z"],"sideFront":[175.81,185.8,"M 41.8 1.59 L 47.31 2.39 L 52.7 3.3 L 57.91 4.3 L 63.01 5.5 L 65.4 6.1 L 71.31 7.6 L 175.81 39.39 L 166.12 100.99 L 152.8 185.8 L 9.8 185.8 L 8.61 167.89 L 8.0 161.9 C 6.76 149.79 5.18 137.96 2.82 126.01 L 1.4 119.4 L 0.3 112.29 C -1.51 100.0 -1.44 88.11 0 75.8 L 1.1 68.39 L 2.41 62.8 L 4.51 55.29 L 5.8 51.39 L 7.11 47.69 L 10.01 40.2 L 13.21 32.79 L 15.41 28.19 L 28.6 0 L 41.8 1.59 Z"],"skirt":[786.57,567.44,"M 0 566.21 L 0.88 0 L 786.57 1.23 L 785.68 567.44 L 0 566.21 Z"],"lowerBack":[236.9,148.8,"M 236.9 0 L 236.9 127.0 L 178.01 127.0 L 169.21 127.3 L 160.21 127.7 L 151.3 128.31 L 142.41 129.2 L 133.6 130.11 L 124.69 131.3 L 115.91 132.61 L 107.0 134.11 L 94.3 136.4 L 80.39 139.11 L 32.19 148.8 L 9.8 63.31 L 0 25.8 L 40.49 17.4 L 60.6 13.4 L 78.91 10.1 L 95.69 7.2 L 107.0 5.5 L 118.41 4.0 L 129.79 2.79 L 141.1 1.71 L 152.61 0.91 L 164.0 0.3 L 175.49 0 L 236.9 0 Z"],"lowerFront":[216.79,151.63,"M 0.74 0 L 62.73 0.36 L 72.13 0.73 L 81.63 1.38 L 84.82 1.59 L 88.63 1.93 L 100.01 3.18 L 111.12 4.64 L 114.9 5.28 L 126.09 7.03 L 142.48 9.73 L 160.15 13.03 L 177.45 16.65 L 193.92 20.34 L 216.79 25.76 L 209.78 62.72 L 192.75 151.63 L 144.21 140.94 L 118.06 135.49 C 99.65 131.42 80.69 129.03 61.89 127.67 L 54.0 127.31 L 0 127.0 L 0.74 0 Z"]}};
  const SOURCE_POCKET=[280.86,189.86,"M 0.12 188.24 L 280.86 189.86 L 280.86 2.43 L 65.53 0 C 55.1 24.23 42.58 47.5 28.1 69.54 C 9.71 97.17 0 129.74 0.26 163.0 L 0.12 188.24 Z"];
  const FIXED_SIZES={
    label:'Published size',
    default:'8/10',
    seamAllowanceMM:12.7,
    seamAllowanceText:'The original 1/2-inch seam allowance is included on sewn edges; place-on-fold edges have none.',
    combinedSizes:true,
    unit:'in',
    measurementLabels:{neck:'Neck',bust:'Bust',waist:'Waist',hips:'Hip'},
    entries:SIZE_ROWS.map(row=>({id:row.id,chartSize:row.chartSize,measurements:{...row.published}}))
  };
  const sizeRow=value=>SIZE_ROWS.find(row=>row.id===value)||SIZE_ROWS.find(row=>row.id===FIXED_SIZES.default);
  const toMM=value=>value*MM_PER_IN;
  function measurementsForSize(value){
    const row=sizeRow(value), p=row.published, d=row.draft;
    return {
      chest:toMM(p.bust), waist:toMM(p.waist), hips:toMM(p.hips), highBust:toMM(d.highBust),
      bustSpan:toMM(d.bustSpan), hpsToBust:toMM(d.hpsToBust), waistToUnderbust:toMM(d.waistToUnderbust),
      waistToFloor:toMM(d.waistToFloor), waistToHips:toMM(d.waistToHips), waistToKnee:toMM(d.waistToKnee)
    };
  }

  const GUIDE=`## Before sewing

- Make a muslin of the fitted bodice before cutting the final fabric.
- Every published size includes the original 1/2-inch seam allowance on sewn edges. Place-on-fold edges have no seam allowance.
- Suggested fabrics include crepe, jacquard, mikado, brocade, cotton sateen, or linen.
- Gather lining, fusible interfacing, four 1-inch ribbon ties, and a 24-inch invisible zipper.

## Step 1: Stabilize the bodice

Fuse interfacing to the outer upper-bodice pieces. Add bra cups to the lining if desired.

## Step 2: Assemble the upper bodice

Match A to join each side-front to the center front. Match B1/B2 at the side-front and side-back side seams, then match C1/C2 to join each side-back to a back bodice. Press seams open and repeat for the lining. The center-back edges remain open for the invisible zipper.

## Step 3: Assemble the lower bodice

Join the lower front and back sections at the side seams. Press, then repeat for the lining.

## Step 4: Join upper and lower bodice

Match the underbust seam letters and sew the upper bodice to the lower bodice. Press the allowance downward and topstitch if desired.

## Steps 5-7: Add ribbon straps and lining

Cut four ribbon pieces at least 18 inches long. Staystitch them at the two front A-seam junctions and the two back C-seam junctions along the upper edge. Sew the lined and outer bodices together along the upper edge, enclosing the ribbons; clip curves, turn, and press.

## Steps 8-9: Build the skirt

Insert the pockets at the skirt side seams, then join the skirt panels. Fold each pleat arrow toward its marked center line and staystitch the pleats with the pockets facing forward.

## Steps 10-12: Finish the waist and zipper

Attach the outer bodice to the skirt. Install the invisible zipper at center back, close the remaining seam, then turn under the bodice lining and slipstitch it along the zipper and waist.

## Step 13: Hem

Finish the skirt with a 1-inch hem. Check the length while wearing the intended shoes before trimming.`;

  const CONFIG={
    measurements:[],
    optionalMeasurements:[],
    options:{}
  };

  const ABOUT={
    name:'Sweetheart Maxi Dress',
    description:'A publisher-graded sweetheart dress with ribbon straps, a princess-seamed fitted bodice, pleated skirt, and in-seam pockets. Choose one of the original fixed cut-line sizes.',
    difficulty:3,
    yardage:'5-6 yd',
    tags:['dresses'],
    techniques:['princess-seams','lining','pleats','in-seam-pockets','invisible-zipper'],
    illustration:'illustrations/oleander.svg',
    sourceUrl:SOURCE,
    sourceLabel:'Based on the linked publisher pattern',
    generated:true,
    fixedSizing:true
  };

  const I18N={};

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const num=value=>Number.isFinite(Number(value))?Number(value):0;
  const fmt=value=>Number(value.toFixed(2));
  const xml=value=>String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
  function cubicPoint(p0,p1,p2,p3,t){
    const mt=1-t;
    return {
      x:mt*mt*mt*p0.x+3*mt*mt*t*p1.x+3*mt*t*t*p2.x+t*t*t*p3.x,
      y:mt*mt*mt*p0.y+3*mt*mt*t*p1.y+3*mt*t*t*p2.y+t*t*t*p3.y
    };
  }
  const lerpPoint=(p0,p1,t)=>({x:p0.x+(p1.x-p0.x)*t,y:p0.y+(p1.y-p0.y)*t});

  function line(x1,y1,x2,y2,cls='mark'){
    return '<line class="'+cls+'" x1="'+fmt(x1)+'" y1="'+fmt(y1)+'" x2="'+fmt(x2)+'" y2="'+fmt(y2)+'"/>';
  }
  // Match marks begin on the stitch line and point into the pattern. Keeping
  // both the guide and its letter on the seam-allowance side of the cut line
  // prevents the reference from disappearing when the piece is cut out.
  function notch(x,y,inwardAngle=0,label=''){
    const length=8,rad=inwardAngle*Math.PI/180;
    const dx=Math.cos(rad)*length,dy=Math.sin(rad)*length;
    const labelX=x+Math.cos(rad)*(length+5),labelY=y+Math.sin(rad)*(length+5);
    return line(x,y,x+dx,y+dy,'notch')+(label?'<text class="seam-letter" x="'+fmt(labelX)+'" y="'+fmt(labelY)+'">'+xml(label)+'</text>':'');
  }
  function grain(x,y,length){
    return '<g class="grain">'+line(x,y,x,y+length,'grain-line')+
      '<path d="M '+fmt(x)+' '+fmt(y)+' l -4 8 h 8 z M '+fmt(x)+' '+fmt(y+length)+' l -4 -8 h 8 z"/>'+
      '<text x="'+fmt(x+7)+'" y="'+fmt(y+length/2)+'" transform="rotate(90 '+fmt(x+7)+' '+fmt(y+length/2)+')">GRAINLINE</text></g>';
  }
  function horizontalGrain(x,y,length){
    return '<g class="grain">'+line(x,y,x+length,y,'grain-line')+
      '<path d="M '+fmt(x)+' '+fmt(y)+' l 8 -4 v 8 z M '+fmt(x+length)+' '+fmt(y)+' l -8 -4 v 8 z"/>'+
      '<text class="horizontal-grain-text" x="'+fmt(x+length/2)+'" y="'+fmt(y-7)+'">GRAINLINE</text></g>';
  }
  function fold(x,y,length){
    const arrow=at=>'<path class="fold-arrow" d="M '+fmt(x+20)+' '+fmt(at)+' H '+fmt(x+2)+' m 0 0 l 5 -3 m -5 3 l 5 3"/>';
    return line(x,y,x,y+length,'fold-line')+arrow(y+length*.30)+arrow(y+length*.70)+
      '<text class="fold-text" x="'+fmt(x+27)+'" y="'+fmt(y+length/2)+'" transform="rotate(90 '+fmt(x+27)+' '+fmt(y+length/2)+')">PLACE ON FOLD</text>';
  }
  function horizontalFold(x,y,length){
    const arrow=at=>'<path class="fold-arrow" d="M '+fmt(at)+' '+fmt(y-20)+' V '+fmt(y-2)+' m 0 0 l -3 -5 m 3 5 l 3 -5"/>';
    return line(x,y,x+length,y,'fold-line')+arrow(x+length*.30)+arrow(x+length*.70)+
      '<text class="fold-text fold-horizontal-text" x="'+fmt(x+length/2)+'" y="'+fmt(y-8)+'">PLACE ON FOLD</text>';
  }
  function wrapText(value,maxChars){
    const words=String(value).trim().split(/\s+/),rows=[];
    let row='';
    words.forEach(word=>{
      if(!row) row=word;
      else if((row+' '+word).length<=maxChars) row+=' '+word;
      else { rows.push(row); row=word; }
    });
    if(row) rows.push(row);
    return rows;
  }
  function title(name,number,cut,x,y,sizeLabel){
    const rawCut=String(cut);
    const cutParts=rawCut.includes('|')?rawCut.split('|'):(()=>{ const parts=rawCut.split(' from '); return parts[1]?[parts[0],'from '+parts.slice(1).join(' from ')]:parts; })();
    const nameRows=wrapText(name,24);
    const cutRows=cutParts.flatMap(part=>wrapText(part,26));
    let rowY=-10;
    const nameLines=nameRows.map(part=>{
      const output='<text class="piece-name text-md fill-current" x="22" y="'+rowY+'">'+xml(part)+'</text>';
      rowY+=6;
      return output;
    }).join('');
    const patternY=rowY;
    rowY+=6;
    const cutLines=cutRows.map(part=>{
      const output='<text class="cut-instruction text-sm fill-current" x="22" y="'+rowY+'">'+xml(part)+'</text>';
      rowY+=5;
      return output;
    }).join('');
    return '<g class="piece-label" transform="translate('+fmt(x)+' '+fmt(y)+')">'+
      '<text class="piece-number text-4xl fill-note" x="0" y="0">'+number+'</text>'+
      '<text class="text-sm fill-current" x="22" y="-17">Published size '+xml(sizeLabel)+'</text>'+nameLines+
      '<text class="pattern-name text-sm fill-note" x="22" y="'+patternY+'">Sweetheart Maxi Dress</text>'+cutLines+'</g>';
  }
  function piece(id,name,w,h,body){
    return {id,name,w:fmt(w),h:fmt(h),body};
  }


  function parseSourcePath(path){
    const tokens=String(path).match(/[MLCZ]|-?(?:\d+(?:\.\d+)?|\.\d+)/g)||[],segments=[];
    let index=0,start=null,current=null;
    const point=()=>({x:Number(tokens[index++]),y:Number(tokens[index++])});
    while(index<tokens.length){
      const command=tokens[index++];
      if(command==='M'){start=point();current=start;}
      else if(command==='L'){const target=point();segments.push({command,from:current,points:[target],to:target});current=target;}
      else if(command==='C'){const a=point(),b=point(),target=point();segments.push({command,from:current,points:[a,b,target],to:target});current=target;}
      else if(command==='Z'&&start&&current&&(Math.abs(current.x-start.x)>.01||Math.abs(current.y-start.y)>.01)){
        segments.push({command:'L',from:current,points:[start],to:start});current=start;
      }
    }
    return {start,segments};
  }
  function sourceSamples(plate){
    const samples=[];
    parseSourcePath(plate[2]).segments.forEach(segment=>{
      const steps=segment.command==='C'?24:12;
      for(let step=0;step<=steps;step++){
        const t=step/steps;
        samples.push(segment.command==='C'?cubicPoint(segment.from,segment.points[0],segment.points[1],segment.points[2],t):lerpPoint(segment.from,segment.to,t));
      }
    });
    return samples;
  }
  function sourceFoldSegment(plate,edgeName){
    const height=plate[1],distance=point=>edgeName==='left'?point.x:height-point.y;
    const matches=parseSourcePath(plate[2]).segments.filter(segment=>segment.command==='L'&&distance(segment.from)<2.25&&distance(segment.to)<2.25&&Math.hypot(segment.to.x-segment.from.x,segment.to.y-segment.from.y)>20);
    if(!matches.length) throw new Error('Could not locate the '+edgeName+' publisher fold edge.');
    return matches.sort((a,b)=>Math.hypot(b.to.x-b.from.x,b.to.y-b.from.y)-Math.hypot(a.to.x-a.from.x,a.to.y-a.from.y))[0];
  }
  function stitchPath(plate,inset,foldEdge=''){
    const width=plate[0],height=plate[1],parsed=parseSourcePath(plate[2]);
    const transform=point=>foldEdge==='left'?{x:point.x*(width-inset)/width,y:inset+point.y*(height-2*inset)/height}:
      foldEdge==='bottom'?{x:inset+point.x*(width-2*inset)/width,y:inset+point.y*(height-inset)/height}:
      {x:inset+point.x*(width-2*inset)/width,y:inset+point.y*(height-2*inset)/height};
    const output=segment=>segment.command+' '+segment.points.map(point=>{const result=transform(point);return fmt(result.x)+' '+fmt(result.y);}).join(' ');
    if(foldEdge){
      const excluded=sourceFoldSegment(plate,foldEdge),foldIndex=parsed.segments.indexOf(excluded);
      const ordered=parsed.segments.slice(foldIndex+1).concat(parsed.segments.slice(0,foldIndex)),start=transform(excluded.to);
      return 'M '+fmt(start.x)+' '+fmt(start.y)+' '+ordered.map(output).join(' ');
    }
    const start=transform(parsed.start);
    return 'M '+fmt(start.x)+' '+fmt(start.y)+' '+parsed.segments.map(output).join(' ')+' Z';
  }
  function sourceGeometry(plate,x,y,foldEdge=''){
    return '<path class="cut" transform="translate('+fmt(x)+' '+fmt(y)+')" d="'+plate[2]+'"/>'+
      '<path class="stitch" transform="translate('+fmt(x)+' '+fmt(y)+')" d="'+stitchPath(plate,FIXED_SIZES.seamAllowanceMM,foldEdge)+'"/>';
  }
  function sourceEdgeNotch(plate,x,y,targetX,targetY,label){
    const samples=sourceSamples(plate),target={x:plate[0]*targetX,y:plate[1]*targetY};
    const boundary=samples.reduce((best,point)=>{const d=(point.x-target.x)**2+(point.y-target.y)**2;return !best||d<best.d?{point,d}:best;},null).point;
    const center=samples.reduce((sum,point)=>({x:sum.x+point.x/samples.length,y:sum.y+point.y/samples.length}),{x:0,y:0});
    const length=Math.hypot(center.x-boundary.x,center.y-boundary.y)||1,ux=(center.x-boundary.x)/length,uy=(center.y-boundary.y)/length;
    const sx=x+boundary.x+ux*FIXED_SIZES.seamAllowanceMM,sy=y+boundary.y+uy*FIXED_SIZES.seamAllowanceMM;
    return line(sx,sy,sx+ux*8,sy+uy*8,'notch')+'<text class="seam-letter" x="'+fmt(sx+ux*14)+'" y="'+fmt(sy+uy*14+2)+'">'+xml(label)+'</text>';
  }
  function foldGeometry(plate,x,y,edgeName,offset=0,label='PLACE ON FOLD'){
    const segment=sourceFoldSegment(plate,edgeName),samples=sourceSamples(plate);
    const center=samples.reduce((sum,point)=>({x:sum.x+point.x/samples.length,y:sum.y+point.y/samples.length}),{x:0,y:0});
    const dx=segment.to.x-segment.from.x,dy=segment.to.y-segment.from.y,length=Math.hypot(dx,dy)||1,tx=dx/length,ty=dy/length;
    let nx=-ty,ny=tx;const middle={x:(segment.from.x+segment.to.x)/2,y:(segment.from.y+segment.to.y)/2};
    if((center.x-middle.x)*nx+(center.y-middle.y)*ny<0){nx=-nx;ny=-ny;}
    const a={x:x+segment.from.x+nx*offset,y:y+segment.from.y+ny*offset},b={x:x+segment.to.x+nx*offset,y:y+segment.to.y+ny*offset};
    const arrows=[.30,.70].map(fraction=>{const px=a.x+(b.x-a.x)*fraction,py=a.y+(b.y-a.y)*fraction,tailX=px+nx*22,tailY=py+ny*22;return '<path class="fold-arrow" d="M '+fmt(tailX)+' '+fmt(tailY)+' L '+fmt(px)+' '+fmt(py)+' M '+fmt(px)+' '+fmt(py)+' L '+fmt(px+nx*6+tx*3)+' '+fmt(py+ny*6+ty*3)+' M '+fmt(px)+' '+fmt(py)+' L '+fmt(px+nx*6-tx*3)+' '+fmt(py+ny*6-ty*3)+'"/>';}).join('');
    let angle=Math.atan2(dy,dx)*180/Math.PI;if(angle>90||angle<-90)angle+=angle>90?-180:180;
    const labelX=(a.x+b.x)/2+nx*15,labelY=(a.y+b.y)/2+ny*15;
    return line(a.x,a.y,b.x,b.y,'fold-line')+arrows+'<text class="fold-text" x="'+fmt(labelX)+'" y="'+fmt(labelY)+'" transform="rotate('+fmt(angle)+' '+fmt(labelX)+' '+fmt(labelY)+')" text-anchor="middle">'+xml(label)+'</text>';
  }

  function buildPieces(settings){
    const selectedSize=sizeRow(settings&&settings.options&&settings.options.publishedSize),m=measurementsForSize(selectedSize.id),plates=SOURCE_PLATES[selectedSize.id];
    const edge=8,sa=FIXED_SIZES.seamAllowanceMM,pieces=[],pieceTitle=(name,number,cut,x,y)=>title(name,number,cut,x,y,selectedSize.id);
    const add=(id,name,key,foldEdge,body)=>{const plate=key==='pocket'?SOURCE_POCKET:plates[key],bw=plate[0],bh=plate[1],x=edge,y=edge;pieces.push(piece(id,name,bw+2*edge,bh+2*edge,sourceGeometry(plate,x,y,foldEdge)+(foldEdge?foldGeometry(plate,x,y,foldEdge):'')+body(plate,bw,bh,x,y)));};

    add(1,'Center Front Bodice','centerFront','left',(plate,bw,bh,x,y)=>
      grain(x+bw*.47,y+bh*.31,bh*.23)+sourceEdgeNotch(plate,x,y,.95,.55,'A')+sourceEdgeNotch(plate,x,y,.58,.98,'E')+
      pieceTitle('Center Front Bodice',1,'Cut 1 on fold from fabric, lining & interfacing',x+bw*.22,y+bh*.70));
    add(2,'Side Front Bodice','sideFront','',(plate,bw,bh,x,y)=>
      grain(x+bw*.67,y+bh*.28,bh*.24)+sourceEdgeNotch(plate,x,y,.01,.55,'A')+sourceEdgeNotch(plate,x,y,.91,.43,'B1')+sourceEdgeNotch(plate,x,y,.88,.68,'B2')+sourceEdgeNotch(plate,x,y,.52,.98,'F')+
      pieceTitle('Side Front Bodice',2,'Cut 2 mirrored from fabric, lining & interfacing',x+bw*.12,y+bh*.72));
    add(3,'Side Back Bodice','sideBack','',(plate,bw,bh,x,y)=>
      grain(x+bw*.70,y+bh*.18,bh*.28)+sourceEdgeNotch(plate,x,y,.02,.42,'B1')+sourceEdgeNotch(plate,x,y,.03,.68,'B2')+sourceEdgeNotch(plate,x,y,.98,.42,'C1')+sourceEdgeNotch(plate,x,y,.98,.68,'C2')+sourceEdgeNotch(plate,x,y,.50,.98,'G')+
      pieceTitle('Side Back Bodice',3,'Cut 2 mirrored from fabric, lining & interfacing',x+bw*.30,y+bh*.64));
    add(4,'Back Bodice','back','',(plate,bw,bh,x,y)=>
      grain(x+bw*.72,y+bh*.17,bh*.29)+line(x+bw-sa,y+10,x+bw-sa,y+bh-10,'zip-line')+sourceEdgeNotch(plate,x,y,.02,.42,'C1')+sourceEdgeNotch(plate,x,y,.03,.68,'C2')+sourceEdgeNotch(plate,x,y,.58,.98,'H')+
      pieceTitle('Back Bodice',4,'Cut 2 mirrored from fabric, lining & interfacing',x+bw*.23,y+bh*.68));
    add(5,'Lower Front Bodice','lowerFront','left',(plate,bw,bh,x,y)=>
      grain(x+bw*.74,y+bh*.13,bh*.30)+sourceEdgeNotch(plate,x,y,.33,.04,'E')+sourceEdgeNotch(plate,x,y,.69,.06,'F')+sourceEdgeNotch(plate,x,y,.66,.96,'J')+
      pieceTitle('Lower Front Bodice',5,'Cut 1 on fold from fabric & lining',x+bw*.20,y+bh*.58));
    add(6,'Lower Back Bodice','lowerBack','',(plate,bw,bh,x,y)=>
      grain(x+bw*.75,y+bh*.13,bh*.30)+line(x+bw-sa,y+10,x+bw-sa,y+bh*.82,'zip-line')+sourceEdgeNotch(plate,x,y,.34,.04,'G')+sourceEdgeNotch(plate,x,y,.76,.02,'H')+sourceEdgeNotch(plate,x,y,.70,.92,'K')+
      pieceTitle('Lower Back Bodice',6,'Cut 2 mirrored from fabric & lining',x+bw*.37,y+bh*.60));

    add(7,'Front / Back Skirt','skirt','',(plate,bw,bh,x,y)=>{
      const centers=[.22,.50,.78];let pleats='';
      centers.forEach((fraction,index)=>{const cy=y+bh*fraction,half=Math.min(28,bh*.045);pleats+=line(x+sa,cy-half,x+42,cy-half,'pleat-line')+line(x+sa,cy,x+47,cy,'pleat-center')+line(x+sa,cy+half,x+42,cy+half,'pleat-line')+'<path class="pleat-arrow" d="M '+fmt(x+28)+' '+fmt(cy-half)+' V '+fmt(cy)+' l -3 -6 m 3 6 l 3 -6 M '+fmt(x+35)+' '+fmt(cy+half)+' V '+fmt(cy)+' l -3 6 m 3 -6 l 3 6"/><circle class="pleat-center" cx="'+fmt(x+47)+'" cy="'+fmt(cy)+'" r="4"/><text class="pleat-text" x="'+fmt(x+56)+'" y="'+fmt(cy+2)+'">PLEAT '+(index+1)+'</text>';});
      const foldAndBack=foldGeometry(plate,x,y,'bottom',sa,'PLACE ON FOLD');
      const foldSegment=sourceFoldSegment(plate,'bottom'),dx=foldSegment.to.x-foldSegment.from.x,dy=foldSegment.to.y-foldSegment.from.y;
      let angle=Math.atan2(dy,dx)*180/Math.PI;if(angle>90||angle<-90)angle+=angle>90?-180:180;
      const cutX=x+(foldSegment.from.x+foldSegment.to.x)/2,cutY=y+(foldSegment.from.y+foldSegment.to.y)/2-4;
      const cutLabel='<text class="center-back-text" x="'+fmt(cutX)+'" y="'+fmt(cutY)+'" transform="rotate('+fmt(angle)+' '+fmt(cutX)+' '+fmt(cutY)+')" text-anchor="middle">CENTER BACK CUT LINE</text>'+
        '<text class="center-back-text" x="'+fmt(cutX)+'" y="'+fmt(cutY-14)+'" transform="rotate('+fmt(angle)+' '+fmt(cutX)+' '+fmt(cutY-14)+')" text-anchor="middle">CENTER BACK STITCH LINE - BACK</text>';
      const hipDrop=clamp(num(m.waistToHips),110,300),pocketX1=clamp(hipDrop*.58,100,190),pocketX2=pocketX1+155;
      const testX=x+bw*.72,testY=y+bh*.64,calibration='<g class="calibration-group" transform="translate('+fmt(testX)+' '+fmt(testY)+')"><rect class="calibration-clear" x="-7" y="-7" width="39.4" height="49"/><rect class="calibration" width="25.4" height="25.4"/><text class="calibration-text" x="12.7" y="32.5">1 IN TEST</text><text class="calibration-text" x="12.7" y="38">25.4 MM</text></g>';
      return foldAndBack+cutLabel+pleats+sourceEdgeNotch(plate,x,y,.01,.15,'J')+sourceEdgeNotch(plate,x,y,.01,.85,'K')+sourceEdgeNotch(plate,x,y,pocketX1/bw,.01,'P')+sourceEdgeNotch(plate,x,y,pocketX2/bw,.01,'P')+
        horizontalGrain(x+bw*.31,y+bh*.35,bw*.39)+line(x+bw-sa,y+18,x+bw-sa,y+bh-18,'hem-line')+
        pieceTitle('Front / Back Skirt',7,'Front: Cut 1 on fold from fabric|Back: Cut 2 face-to-face from fabric',x+bw*.31,y+bh*.53)+calibration;
    });
    add(8,'Pockets','pocket','bottom',(plate,bw,bh,x,y)=>
      horizontalGrain(x+bw*.29,y+bh*.62,bw*.48)+sourceEdgeNotch(plate,x,y,.34,.02,'P')+sourceEdgeNotch(plate,x,y,.82,.02,'P')+
      pieceTitle('Pockets',8,'Cut 2 on fold from lining',x+bw*.35,y+bh*.48));
    return pieces;
  }

  function render(settings){
    const pieces=buildPieces(settings);
    const maxWidth=Math.max(400,Math.min(Number(settings.maxWidth)||900,904.4));
    const gap=10, margin=10;
    const ordered=[...pieces].sort((a,b)=>b.h-a.h);
    if(ordered.some(item=>item.w>maxWidth-2*margin)){
      const item=ordered.find(piece=>piece.w>maxWidth-2*margin);
      throw new Error(item.name+' is wider than a 36-inch roll at this published size.');
    }
    // Anchor the tallest plate at the left, then fill its unused right-hand
    // column in compact shelves. Only true overflow is placed below it.
    const anchor=ordered.shift();
    anchor.x=margin; anchor.y=margin;
    const rightX=margin+anchor.w+gap, rightWidth=maxWidth-margin-rightX;
    const overflow=[];
    const uniqueOrders=[];
    const addOrder=list=>{ const key=list.map(item=>item.id).join(','); if(!uniqueOrders.some(entry=>entry.key===key)) uniqueOrders.push({key,list}); };
    addOrder([...ordered]);
    addOrder([...ordered].sort((a,b)=>b.w*b.h-a.w*a.h));
    addOrder([...ordered].sort((a,b)=>b.w-a.w||b.h-a.h));
    const shelfPlan=(items,capacity)=>{
      let px=0,py=0,rowH=0,usedW=0;
      const positions=[];
      for(const item of items){
        if(item.w>capacity) return null;
        if(px>0&&px+item.w>capacity){ px=0; py+=rowH+gap; rowH=0; }
        if(py+item.h>anchor.h) return null;
        positions.push({item,x:px,y:py});
        px+=item.w+gap; rowH=Math.max(rowH,item.h); usedW=Math.max(usedW,px-gap);
      }
      return {positions,usedW,usedH:py+rowH};
    };
    let best=null;
    const minColumn=Math.ceil(Math.max(...ordered.map(item=>item.w)));
    for(let capacity=minColumn;capacity<=Math.floor(rightWidth);capacity++){
      for(const order of uniqueOrders){
        const plan=shelfPlan(order.list,capacity);
        if(plan&&(!best||plan.usedW<best.usedW||(plan.usedW===best.usedW&&plan.usedH<best.usedH))) best=plan;
      }
    }
    if(best){
      best.positions.forEach(position=>{ position.item.x=rightX+position.x; position.item.y=margin+position.y; });
    }else{
      let x=rightX,y=margin,rowH=0;
      for(const item of ordered){
        if(item.w>rightWidth){ overflow.push(item); continue; }
        if(x>rightX&&x+item.w>maxWidth-margin){ x=rightX; y+=rowH+gap; rowH=0; }
        if(y+item.h>margin+anchor.h){ overflow.push(item); continue; }
        item.x=x; item.y=y; x+=item.w+gap; rowH=Math.max(rowH,item.h);
      }
    }
    let overflowY=margin+anchor.h+gap, overflowX=margin, overflowRowH=0;
    for(const item of overflow){
      if(overflowX>margin && overflowX+item.w>maxWidth-margin){ overflowX=margin; overflowY+=overflowRowH+gap; overflowRowH=0; }
      item.x=overflowX; item.y=overflowY; overflowX+=item.w+gap; overflowRowH=Math.max(overflowRowH,item.h);
    }
    const placed=[anchor,...ordered];
    const width=Math.min(maxWidth,Math.max(400,...placed.map(item=>item.x+item.w+margin)));
    const totalH=Math.max(...placed.map(item=>item.y+item.h+margin));
    const css=`text{font-size:5px;font-family:-apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;fill:#000;text-anchor:start;font-weight:200;dominant-baseline:ideographic}.cut{fill:white;stroke:#212121;stroke-width:.6;vector-effect:non-scaling-stroke}.stitch{fill:none;stroke:#212121;stroke-width:.4;stroke-dasharray:.4 .8;vector-effect:non-scaling-stroke}.mark,.notch,.pleat-line,.pleat-center,.pleat-arrow{fill:none;stroke:#3b82f6;stroke-width:.4;vector-effect:non-scaling-stroke}.fold-line,.fold-arrow,.grain-line,.zip-line,.hem-line{fill:none;stroke:#8b5cf6;stroke-width:.4;vector-effect:non-scaling-stroke}.fold-line{stroke-dasharray:15 1.5 1 1.5}.zip-line,.hem-line{stroke-dasharray:1 1.5}.pleat-line{stroke-dasharray:1 1.5}.pleat-center{stroke-dasharray:.4 .8}.strap-mark{fill:none;stroke:#ec4899;stroke-width:.8;vector-effect:non-scaling-stroke}.text-xs{font-size:3px}.text-sm{font-size:4px}.text-md{font-size:5px}.text-lg{font-size:7px}.text-4xl{font-size:36px}.fill-note,.pattern-name{fill:#8b5cf6}.piece-number{font-size:36px}.piece-name{font-size:5px}.grain text,.fold-text{font-size:5px;fill:#8b5cf6}.horizontal-grain-text,.fold-horizontal-text{text-anchor:middle}.center-back-text{font-size:5px;fill:#000}.pleat-text,.seam-letter{font-size:5px;fill:#3b82f6}.seam-letter,.calibration-text{text-anchor:middle;dominant-baseline:central;font-weight:600}.grain path{fill:#8b5cf6;stroke:none}.calibration-clear{fill:white;stroke:none}.calibration{fill:white;stroke:#212121;stroke-width:.6}.calibration-text{font-size:3px;fill:#000;font-weight:400}`;
    const groups=placed.map(item=>'<g id="oleander-stack-'+item.id+'" data-piece="'+item.id+'" data-width="'+item.w+'" data-height="'+item.h+'" data-layout-x="'+fmt(item.x)+'" data-layout-y="'+fmt(item.y)+'" transform="translate('+fmt(item.x)+' '+fmt(item.y)+')">'+item.body+'</g>').join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="'+fmt(width)+'mm" height="'+fmt(totalH)+'mm" viewBox="0 0 '+fmt(width)+' '+fmt(totalH)+'"><style>'+css+'</style><rect width="100%" height="100%" fill="white"/>'+groups+'</svg>';
  }

  window.PatternGenerators=window.PatternGenerators||{};
  window.PatternGenerators.oleander={about:ABOUT,config:CONFIG,instructions:GUIDE,i18n:I18N,fixedSizes:FIXED_SIZES,measurementsForSize,render};
})();
