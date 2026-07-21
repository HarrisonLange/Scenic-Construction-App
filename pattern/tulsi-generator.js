/* Fixed publisher-sized implementation of Mood's Tulsi top.
   Only the 18 original single-size cut lines are selectable. Body samples,
   measurements, seam settings, and design options never re-grade the plates. */
(function(){
  'use strict';

  const SOURCE='https://blog.moodfabrics.com/the-tulsi-top-free-sewing-pattern/';
  const MM_PER_IN=25.4;
  const SIZE_ROWS=[
    {id:'00',bust:31,waist:23,hips:34,finishedWrap:17.25},
    {id:'0',bust:32,waist:24,hips:35,finishedWrap:18.25},
    {id:'2',bust:33,waist:25,hips:36,finishedWrap:19.25},
    {id:'4',bust:34,waist:26,hips:37,finishedWrap:20.25},
    {id:'6',bust:35,waist:27,hips:38,finishedWrap:21.25},
    {id:'8',bust:36,waist:28,hips:39,finishedWrap:22.25},
    {id:'10',bust:37.5,waist:29.5,hips:40.5,finishedWrap:23.25},
    {id:'12',bust:39,waist:31,hips:42,finishedWrap:24.25},
    {id:'14',bust:40.5,waist:32.5,hips:43.5,finishedWrap:25.25},
    {id:'16',bust:42.5,waist:34.5,hips:45.5,finishedWrap:26.25},
    {id:'18',bust:44.5,waist:36.5,hips:47.5,finishedWrap:28.25},
    {id:'20',bust:46.5,waist:38.5,hips:49.5,finishedWrap:30.25},
    {id:'22',bust:48.5,waist:40.5,hips:51.5,finishedWrap:32.25},
    {id:'24',bust:50.5,waist:42.5,hips:53.5,finishedWrap:34.25},
    {id:'26',bust:52.75,waist:44.75,hips:56,finishedWrap:36.25},
    {id:'28',bust:55,waist:47,hips:58.5,finishedWrap:38.25},
    {id:'30',bust:57.25,waist:49.25,hips:61,finishedWrap:40.25},
    {id:'32',bust:59.5,waist:51.5,hips:63.5,finishedWrap:42.25}
  ];
  // Exact selected-size extents extracted from the publisher's vector cut
  // lines (MDF256, pattern tiles 1-9). These are cut dimensions, including
  // the publisher's allowance on sewn edges. The 69.89 mm front fold edge is
  // shared by every published size.
  // Publisher vector cut lines, normalized and rotated 90 degrees so the
  // long wrap pieces pack efficiently on a 36-inch roll. Coordinates stay
  // within 0.01 mm of the supplied PDF paths.
  const REFERENCE_FRONT_PATHS={"32":"M 366.9 4.8 L 353.21 54.59 L 341.1 98.7 L 332 130.89 L 323.6 160 L 314.9 189.59 L 306.2 218.19 L 297.01 247.99 L 287.7 277.09 L 273.6 320.8 L 265.6 346.2 L 259.69 364.79 L 251.21 392.71 L 245.89 409.19 L 236.9 436.2 L 232.79 449.39 L 229.3 461.79 L 226.29 473.6 L 223.8 484.89 L 221.51 497.2 L 219.71 509.59 L 218.29 521.4 L 218.29 568.49 L 148.4 568.49 L 148.4 521.4 L 146.9 508.3 L 144.91 494.5 L 142.3 480.89 L 141.1 475 L 139.59 468.5 L 137.9 461.69 L 136.29 455.49 L 132.4 441.68 L 127.91 427.1 L 118 397.3 L 111.99 378.4 L 102.81 348.09 L 94 319.89 L 87.61 299.3 L 72.01 250.99 L 61.89 218.8 L 51.6 185.7 L 42.1 154.2 L 32.51 121.5 L 23.3 89.3 L 0 4.89 L 25 4.3 L 37.51 3.3 L 50.1 2.5 L 64.01 1.8 L 79.1 1.29 L 100.31 0.89 L 136.91 0.19 L 162.5 0.11 L 183.41 0.11 L 204.3 0 L 229.89 0.3 C 263.14 0.99 296.14 0.79 329.31 3.3 L 341.91 4.3 L 352.51 4.7 L 366.9 4.8 Z","30":"M 357.4 4.78 L 344.11 53.3 L 332.3 95.8 L 323.6 127 L 315.51 155.09 L 307 183.6 L 298.7 211.2 L 289.71 239.99 L 280.71 267.99 L 267.1 310.2 L 253.7 352.7 L 245.41 379.69 L 240.31 395.58 L 231.61 421.6 L 227.71 434.38 L 224.3 446.38 L 221.4 457.69 L 218.91 468.59 L 216.7 480.48 L 215.01 492.48 L 213.59 503.89 L 213.59 550.99 L 143.7 550.99 L 143.7 503.89 L 142.2 491.19 L 140.29 477.9 L 137.79 464.8 L 135.21 452.8 L 133.6 446.3 L 132 440.18 L 128.21 426.89 L 123.8 412.69 L 114.3 383.98 L 108.5 365.7 L 99.61 336.49 L 84.79 289.28 L 69.81 242.7 L 59.9 211.58 L 50 179.6 L 40.81 149.1 L 31.5 117.58 L 22.61 86.38 L 0 4.89 L 24.41 4.3 L 36.6 3.28 C 68.96 0.83 101.05 0.95 133.5 0.3 L 158.41 0 L 178.71 0.08 L 199.09 0 L 224.01 0.3 C 256.41 0.97 288.48 0.82 320.8 3.28 L 333.1 4.19 L 343.41 4.59 L 357.4 4.78 Z","28":"M 347.9 4.8 L 334.9 51.9 L 323.6 93.01 L 315.11 123 L 307.3 150.11 L 299.11 177.61 L 291 204.22 L 282.41 231.9 L 273.71 259.02 L 260.6 299.7 L 247.61 340.7 L 239.61 366.61 L 234.7 382.02 L 226.31 407.1 L 222.5 419.4 L 219.2 430.91 L 216.41 441.9 L 214.1 452.42 L 211.9 463.91 L 210.21 475.4 L 208.89 486.41 L 208.89 533.51 L 139 533.51 L 139 486.41 L 137.6 474.2 L 135.7 461.31 L 133.31 448.71 L 130.7 437.11 L 129.2 430.91 L 127.7 424.9 L 123.99 412.11 L 119.8 398.4 L 110.51 370.71 L 104.9 353.1 L 96.31 324.8 L 88.1 298.6 L 82 279.32 L 67.5 234.31 L 58 204.3 L 48.41 173.5 L 39.5 144.1 L 30.5 113.6 L 21.8 83.61 L 0 4.91 L 23.71 4.3 L 35.71 3.3 L 47.6 2.5 L 60.71 1.8 L 75.1 1.31 L 95.21 0.91 L 129.9 0.3 L 154.2 0 L 193.8 0 L 218.1 0.3 L 252.9 0.91 L 272.9 1.31 L 287.3 1.8 L 300.4 2.5 L 312.29 3.3 L 324.21 4.21 L 334.2 4.61 L 347.9 4.8 Z","26":"M 338.2 4.8 L 325.59 50.61 L 314.6 90.11 L 306.49 119 L 298.89 145.1 L 291 171.6 L 283.29 197.21 L 274.89 223.9 L 266.59 250 L 253.89 289.09 L 246.59 311.91 L 233.6 353.61 L 228.9 368.41 L 220.79 392.49 L 217.09 404.41 L 213.89 415.5 L 211.29 426 L 209 436.2 L 206.88 447.21 L 205.3 458.3 L 203.98 468.91 L 203.98 516 L 134.09 516 L 134.09 468.91 L 132.69 457.09 L 130.89 444.71 L 128.59 432.5 L 126.09 421.41 L 123.08 409.6 L 119.59 397.3 L 115.49 384.11 L 106.6 357.4 L 101.2 340.4 L 92.9 313.2 L 79.1 269.41 L 65.09 226 L 55.9 197 L 46.59 167.3 L 38.1 139 L 29.4 109.6 L 21 80.71 L 0 4.8 L 22.99 4.21 L 34.59 3.3 L 46.19 2.5 L 58.99 1.8 L 72.98 1.31 L 92.39 0.91 L 126.3 0.21 L 149.9 0 L 188.3 0 L 211.98 0.3 L 245.79 0.91 L 265.3 1.31 L 279.29 1.9 L 291.99 2.5 L 303.59 3.3 L 315.19 4.21 L 324.89 4.59 L 338.2 4.8 Z","24":"M 328.8 4.8 L 316.48 49.3 L 305.9 87.29 L 298.09 115 L 290.79 140.1 L 283.19 165.59 L 275.7 190.2 L 267.59 215.9 L 259.59 240.9 L 247.4 278.6 L 235.29 316.51 L 227.9 340.49 L 223.29 354.8 L 215.5 377.99 L 211.98 389.4 L 208.89 400.01 L 206.29 410.19 L 204.09 419.9 L 202.1 430.59 L 200.49 441.2 L 199.28 451.4 L 199.28 498.5 L 129.39 498.5 L 129.39 451.4 L 128.1 440.1 L 126.3 428.1 L 124.1 416.39 L 121.69 405.6 L 118.79 394.4 L 115.4 382.5 L 111.48 369.8 L 102.89 344.11 L 97.68 327.7 L 89.6 301.6 L 76.39 259.4 L 62.8 217.59 L 54 189.8 L 45 161.21 L 36.79 133.9 L 28.38 105.6 L 20.3 77.79 L 0 4.8 L 22.39 4.19 L 33.7 3.3 L 44.89 2.5 L 57.3 1.9 L 70.89 1.4 L 89.89 0.89 L 122.79 0.3 L 145.69 0 L 183.09 0 L 205.99 0.3 L 238.89 0.89 L 257.89 1.29 L 271.48 1.9 L 283.89 2.5 L 295.08 3.3 L 306.39 4.19 L 315.79 4.59 L 328.8 4.8 Z","22":"M 319.21 4.8 L 307.21 48.09 L 297.12 84.71 L 289.52 111.4 L 282.51 135.59 L 275.21 160.1 L 268.01 183.81 L 260.2 208.6 L 252.52 232.71 L 240.71 269.01 L 229.11 305.5 L 222.02 328.7 L 217.61 342.39 L 210.1 364.81 L 206.71 375.71 L 203.71 386 L 201.21 395.8 L 199.11 405.19 L 197.21 415.4 L 195.71 425.7 L 194.5 435.5 L 194.5 482.6 L 124.61 482.6 L 124.61 435.5 L 123.32 424.6 L 121.6 413 L 119.51 401.81 L 117.2 391.39 L 114.41 380.49 L 111.1 369 L 107.4 356.81 L 99.1 332 L 94.11 316.21 L 86.32 291 L 73.51 250.3 L 60.52 209.99 L 52.01 183.2 L 43.41 155.6 L 35.41 129.31 L 27.3 102 L 19.6 75.21 L 0 4.8 L 21.8 4.19 L 32.7 3.3 L 43.6 2.5 L 55.71 1.9 L 68.92 1.4 L 87.31 0.91 L 119.21 0.3 L 141.41 0 L 177.8 0 L 200 0.3 L 231.9 0.91 L 250.32 1.4 L 263.5 1.9 L 275.61 2.5 L 286.51 3.3 L 297.52 4.19 L 306.62 4.59 L 319.21 4.8 Z","20":"M 309.6 4.78 L 298.01 46.88 C 281.91 106.47 264.37 165.86 245.41 224.6 L 234.1 259.48 L 223.01 294.68 L 216.11 316.89 L 211.9 330.09 L 204.7 351.68 L 201.4 362.18 L 198.61 372.09 L 196.21 381.49 L 194.2 390.48 L 192.3 400.39 L 190.8 410.19 L 189.7 419.69 L 189.7 466.79 L 119.8 466.79 L 119.8 419.69 L 118.6 409.19 L 116.9 398.08 L 114.91 387.18 L 112.71 377.19 L 110 366.69 L 106.91 355.68 L 103.21 343.89 L 95.31 320 L 90.4 304.8 L 83.02 280.48 L 70.7 241.3 L 58.21 202.59 L 49.91 176.7 L 41.7 150.09 L 34.01 124.8 L 26.2 98.49 L 18.8 72.69 L 0 4.89 L 21.1 4.3 L 31.71 3.39 L 42.31 2.58 C 73.86 0.84 105.62 0.55 137.2 0.08 L 154.81 0 L 172.4 0.08 L 194.01 0.38 L 225 1.08 L 242.8 1.48 L 255.61 1.99 L 267.31 2.58 L 277.9 3.39 L 288.5 4.3 L 297.41 4.7 L 309.6 4.78 Z","18":"M 300 4.78 L 288.8 45.7 L 279.4 79.59 L 272.39 104.29 L 266 126.6 L 259.29 149.29 L 252.6 171.2 L 245.49 194.1 L 238.29 216.39 L 227.5 249.89 L 216.81 283.7 L 210.21 305.1 L 206.21 317.8 L 199.3 338.39 L 196.11 348.59 L 193.4 358.1 L 191.09 367.09 L 189.21 375.79 L 187.41 385.19 L 185.99 394.69 L 184.89 403.8 L 184.89 450.89 L 115 450.89 L 115 403.8 L 113.79 393.7 L 112.31 382.99 L 110.3 372.6 L 108.2 362.9 L 105.6 352.89 L 102.59 342.29 L 99.1 330.9 L 91.4 307.89 L 86.8 293.29 L 79.61 269.9 L 67.8 232.28 L 55.8 194.99 L 47.9 170.1 L 40 144.48 L 32.6 120.18 L 25.21 94.89 L 17.99 70.08 L 0 4.89 L 20.4 4.19 L 30.69 3.39 L 41 2.6 L 52.3 1.99 L 64.71 1.5 L 82 1.1 L 111.99 0.4 L 132.91 0.08 L 150.01 0 L 167.11 0.08 L 188 0.4 L 218 1.1 L 235.31 1.5 L 247.69 1.99 L 259 2.6 L 269.3 3.39 L 279.59 4.19 L 288.2 4.59 L 300 4.78 Z","16":"M 290.39 4.8 L 279.51 44.49 C 261.78 110.37 242.26 175.51 220.9 240.31 L 210.59 272.69 L 204.3 293.2 L 200.49 305.39 L 193.89 325.2 L 190.8 334.9 L 188.19 344.11 L 185.99 352.7 L 184.19 361 L 182.5 370.1 L 181.1 379.2 L 180.09 387.9 L 180.09 435 L 110.19 435 L 110.19 387.9 L 109.09 378.21 L 107.59 367.9 L 105.69 357.91 L 103.7 348.7 L 101.2 339.01 L 98.3 328.8 L 95 317.9 L 87.59 295.8 L 83.21 281.79 L 76.31 259.4 L 65 223.2 L 53.49 187.39 L 45.89 163.49 L 38.29 139 L 31.31 115.59 L 24.09 91.29 L 17.29 67.5 L 0 4.89 L 19.79 4.19 L 29.7 3.39 L 39.69 2.69 L 50.59 1.99 L 62.59 1.5 L 79.4 1.1 L 108.39 0.4 L 128.69 0.11 L 145.2 0 L 161.69 0.11 L 181.99 0.4 L 210.99 1.1 L 227.8 1.5 L 239.8 1.99 L 250.8 2.6 L 260.69 3.39 L 270.7 4.19 L 279 4.59 L 290.39 4.8 Z","14":"M 284.2 4.8 L 274.6 39.5 L 267.4 64.79 L 260.71 87.69 L 253.81 111 L 246.91 133.39 L 239.5 156.91 L 232.2 179.81 L 221 214.21 L 210.02 248.79 L 203.12 270.81 L 199.01 283.8 L 191.9 304.99 L 188.59 315.4 L 185.8 325.1 L 183.41 334.39 L 181.4 343.3 L 179.6 353 L 178.1 362.69 L 177 372 L 177 419.1 L 107.1 419.1 L 107.1 372 L 106 362.69 L 104.5 352.81 L 102.7 343.2 L 100.71 334.39 L 98.3 325.1 L 95.5 315.3 L 92.2 304.91 L 85.11 283.7 L 80.81 270.3 L 74.21 248.79 L 63.2 214.1 L 52.01 179.81 L 44.7 156.91 L 37.3 133.39 L 30.4 111 L 23.5 87.69 L 16.81 64.79 L 0 4.8 L 19.41 4.19 L 29.1 3.41 L 38.8 2.6 L 49.51 2.01 L 61.3 1.5 L 77.7 1.1 L 106.11 0.4 L 125.9 0 L 142.11 0 L 158.31 0.11 L 178.1 0.4 L 206.5 1.1 L 222.91 1.5 L 234.7 2.01 L 245.41 2.6 L 255.1 3.41 L 264.9 4.19 L 273.11 4.59 L 284.2 4.8 Z","12":"M 278 4.8 L 268.58 38.29 C 255.81 83.73 242.04 128.89 227.5 173.8 L 216.6 206.9 L 205.89 240.41 L 199.28 261.6 L 195.2 274.11 L 188.3 294.6 L 185.19 304.61 L 182.5 314.01 L 180.09 323 L 178.2 331.6 L 176.4 340.91 L 174.98 350.31 L 173.88 359.3 L 173.88 406.4 L 103.99 406.4 L 103.99 359.3 L 102.89 350.31 L 101.49 340.8 L 99.7 331.49 L 97.68 323 L 95.4 314.01 L 92.69 304.61 L 89.49 294.6 L 82.7 274.11 L 78.49 261.2 L 71.99 240.41 L 61.3 206.9 L 50.5 173.8 L 43.39 151.7 L 36.2 129.01 L 29.59 107.29 L 22.8 84.9 L 16.3 62.8 L 0 4.91 L 18.99 4.19 L 28.49 3.41 L 37.99 2.71 C 66.36 1 94.79 0.56 123.19 0.11 L 139 0 L 154.79 0.11 L 174.2 0.4 L 201.99 1.1 L 218 1.61 L 229.49 2.1 L 239.99 2.71 L 249.49 3.41 L 259 4.19 L 267 4.59 L 278 4.8 Z","10":"M 271.59 4.8 L 262.49 37.11 L 255.69 60.71 L 249.49 82 L 242.89 103.7 L 236.5 124.61 L 229.49 146.41 L 222.59 167.7 L 212.09 199.71 L 201.7 231.9 L 195.3 252.39 L 191.39 264.5 L 184.7 284.2 L 181.69 293.9 L 179.01 303 L 176.81 311.59 L 174.9 319.89 L 173.21 328.91 L 171.79 337.9 L 170.69 346.6 L 170.69 393.7 L 100.8 393.7 L 100.8 346.6 L 99.69 337.9 L 98.3 328.8 L 96.6 319.81 L 94.7 311.59 L 92.5 303 L 89.79 293.9 L 86.8 284.2 L 80.09 264.5 L 75.99 252.01 L 69.81 231.9 L 59.39 199.71 C 46.49 160.62 33.76 121.47 22.1 82 L 15.79 60.71 L 0 4.91 L 18.5 4.19 L 27.79 3.41 L 37.11 2.71 C 64.8 0.99 92.56 0.56 120.29 0.11 L 135.81 0 L 151.3 0.11 L 170.2 0.4 L 197.4 1.1 L 213 1.61 L 224.3 2.1 L 234.51 2.71 L 243.8 3.41 L 253.09 4.19 L 260.9 4.59 L 271.59 4.8 Z","8":"M 265.41 4.8 L 250 58.61 L 243.9 79.21 L 237.62 99.99 L 231.31 120.1 L 224.6 141.2 L 217.91 161.69 L 207.71 192.51 L 197.72 223.5 L 191.52 243.2 L 187.71 254.8 L 181.21 273.79 L 178.31 283.21 L 175.7 291.91 L 173.5 300.21 L 171.7 308.21 L 170.01 316.91 L 168.7 325.61 L 167.6 333.9 L 167.6 381 L 97.71 381 L 97.71 333.9 L 96.71 325.61 L 95.31 316.8 L 93.6 308.1 L 91.8 300.21 L 89.6 291.91 L 87.02 283.1 L 84.12 273.79 L 77.6 254.8 L 73.7 242.8 L 67.61 223.5 L 57.62 192.4 L 47.41 161.69 L 34.01 120.1 L 27.81 99.99 L 21.51 79.21 L 15.41 58.7 L 0 4.91 L 18.1 4.3 L 27.2 3.49 L 36.3 2.71 L 46.31 2.2 L 57.3 1.61 L 72.6 1.21 L 99.1 0.4 L 117.6 0.11 L 132.72 0 L 147.81 0.11 L 166.31 0.4 L 192.81 1.21 C 211.07 1.46 229.14 2.49 247.31 4.19 L 254.91 4.59 L 265.41 4.8 Z","6":"M 259 4.89 L 250.38 34.99 L 244.09 57.11 L 238.19 77 L 232.09 97.3 L 226 116.8 L 219.5 137.2 L 213.08 157.2 L 203.2 187.09 L 193.48 217.19 L 187.49 236.3 L 183.79 247.61 L 177.59 266.11 L 174.69 275.1 L 172.19 283.59 L 170.1 291.7 L 168.3 299.4 L 166.69 307.89 L 165.4 316.29 L 164.38 324.4 L 164.38 371.5 L 94.49 371.5 L 94.49 324.4 L 93.49 316.29 L 92.18 307.81 L 90.59 299.4 L 88.79 291.7 L 86.7 283.59 L 84.18 275.1 L 81.28 266 L 75.1 247.61 L 71.29 235.9 L 65.38 217.19 L 55.69 187.01 L 45.89 157.2 L 39.39 137.2 L 32.89 116.8 L 26.88 97.3 L 20.68 77.09 L 14.88 57.11 L 0 4.89 L 17.7 4.3 L 26.59 3.49 L 35.39 2.79 C 61.82 1.08 88.32 0.73 114.79 0.11 L 129.5 0 L 144.19 0.11 C 170.66 0.73 197.15 1.08 223.58 2.79 L 232.49 3.49 L 241.3 4.3 L 248.79 4.59 L 259 4.89 Z","4":"M 252.6 4.89 L 244.28 34.18 L 238.19 55.58 L 232.49 74.89 L 226.59 94.59 L 220.79 113.5 L 214.5 133.29 L 208.2 152.7 L 198.69 181.69 L 189.29 210.88 L 183.49 229.38 L 180 240.39 L 173.88 258.3 L 171.09 267.1 L 168.7 275.29 L 166.69 283.08 L 164.99 290.6 L 163.39 298.79 L 162.2 307 L 161.18 314.9 L 161.18 361.99 L 91.29 361.99 L 91.29 314.9 L 90.4 307.09 L 89.09 298.79 L 87.5 290.6 L 85.79 283.19 L 83.8 275.29 L 81.39 267.1 L 78.59 258.3 L 72.6 240.39 L 68.9 229.09 L 63.2 210.88 L 53.89 181.59 L 44.3 152.7 C 33.93 120.45 23.69 88.16 14.39 55.58 L 0 4.89 L 17.19 4.3 L 25.89 3.49 L 34.5 2.79 L 43.98 2.29 L 54.5 1.8 L 69 1.29 L 94.3 0.49 L 111.89 0.19 L 126.3 0 L 140.69 0.19 L 158.28 0.49 L 183.49 1.29 L 198.1 1.8 L 208.49 2.29 L 218.1 2.79 L 226.69 3.49 L 235.39 4.3 L 242.59 4.7 L 252.6 4.89 Z","2":"M 246.19 5 L 238.19 33.38 L 232.3 54.08 L 226.8 72.79 L 221.11 91.88 L 215.5 110.3 L 209.4 129.39 L 203.39 148.19 L 194.2 176.3 L 185.1 204.6 L 179.49 222.59 L 176.11 233.19 L 170.2 250.59 L 167.6 259.08 L 165.21 267 L 163.3 274.6 L 161.69 281.9 L 160.1 289.79 L 158.9 297.79 L 157.99 305.39 L 157.99 352.49 L 88.1 352.49 L 88.1 305.39 L 87.21 297.79 L 86 289.79 L 84.39 281.9 L 82.8 274.6 L 80.9 267.08 L 78.51 259.08 L 75.9 250.49 L 70 233.19 L 66.51 222.19 C 53.18 178.6 38.19 135.54 25.1 91.88 L 19.3 72.9 L 13.91 54.08 L 0 5 L 16.81 4.38 L 25.19 3.6 L 33.7 2.9 L 42.9 2.29 L 53.11 1.8 L 67.29 1.4 L 91.91 0.59 L 109.09 0.19 L 123.11 0 L 137.1 0.19 L 154.31 0.59 L 178.9 1.4 L 193.1 1.8 L 203.31 2.29 L 212.6 2.9 L 221 3.6 L 229.4 4.38 L 236.5 4.7 L 246.19 5 Z","0":"M 239.8 4.91 L 232.09 32.41 L 226.4 52.49 L 221.11 70.59 L 215.6 89.01 L 210.21 106.81 L 204.3 125.39 L 198.5 143.59 L 189.7 170.79 L 180.91 198.2 L 175.49 215.6 L 172.21 225.89 L 166.6 242.7 L 164 250.99 L 161.8 258.7 L 159.89 266 L 158.31 273.09 L 156.8 280.69 L 155.7 288.4 L 154.79 295.8 L 154.79 342.9 L 84.9 342.9 L 84.9 295.8 L 84.01 288.4 L 82.91 280.69 L 81.41 273.01 L 79.8 266 C 75.66 248.61 69.41 232.34 64.09 215.31 L 58.8 198.2 L 50.1 170.79 C 39.16 137.58 28.49 104.13 18.61 70.59 L 13.4 52.49 L 0 5 L 16.4 4.3 L 24.6 3.6 L 32.81 2.9 L 41.8 2.31 L 51.79 1.8 L 65.6 1.29 L 89.49 0.51 L 106.3 0.11 L 119.91 0 L 133.5 0.11 L 150.3 0.51 L 174.31 1.29 L 188.11 1.8 L 197.99 2.31 L 207.01 2.9 L 215.2 3.49 L 223.39 4.3 L 230.29 4.7 L 239.8 4.91 Z","00":"M 233.4 5 L 226 31.5 L 220.51 50.99 C 211.97 80.44 203.2 109.85 193.7 139 L 185.1 165.4 L 176.7 191.9 L 171.51 208.7 L 168.3 218.69 L 162.9 234.91 L 160.4 242.89 L 158.31 250.4 L 156.51 257.49 L 155 264.29 L 153.61 271.7 L 152.51 279.19 L 151.6 286.3 L 151.6 333.4 L 81.7 333.4 L 81.7 286.3 L 80.9 279.19 L 79.71 271.59 L 78.3 264.29 L 76.81 257.49 L 75.01 250.4 L 72.9 242.89 L 70.4 234.91 L 65 218.69 L 61.7 208.41 L 56.6 191.9 C 45.69 156.63 33.69 121.7 23.2 86.3 L 17.91 68.5 L 12.81 50.99 L 0 5 L 15.9 4.4 L 23.9 3.6 L 31.9 2.9 L 40.7 2.39 L 50.4 1.91 L 63.8 1.4 L 87.1 0.59 L 103.4 0.19 L 116.71 0 L 130.01 0.19 L 146.3 0.59 L 169.61 1.4 L 183.01 1.91 L 192.7 2.39 L 201.51 2.9 L 217.51 4.3 L 224.2 4.7 L 233.4 5 Z"};
  const REFERENCE_DIMENSIONS={
    '00':{frontLength:333.40,frontWide:233.40,backSpan:161.90,backDepth:136.50},
    '0': {frontLength:342.90,frontWide:239.80,backSpan:168.30,backDepth:139.70},
    '2': {frontLength:352.49,frontWide:246.19,backSpan:174.60,backDepth:142.90},
    '4': {frontLength:361.99,frontWide:252.60,backSpan:181.00,backDepth:146.11},
    '6': {frontLength:371.50,frontWide:259.00,backSpan:187.30,backDepth:149.29},
    '8': {frontLength:381.00,frontWide:265.41,backSpan:193.70,backDepth:152.51},
    '10':{frontLength:393.70,frontWide:271.59,backSpan:203.20,backDepth:155.70},
    '12':{frontLength:406.40,frontWide:278.00,backSpan:212.70,backDepth:158.90},
    '14':{frontLength:419.10,frontWide:284.20,backSpan:222.19,backDepth:162.09},
    '16':{frontLength:435.00,frontWide:290.39,backSpan:234.89,backDepth:165.29},
    '18':{frontLength:450.89,frontWide:300.00,backSpan:247.59,backDepth:168.51},
    '20':{frontLength:466.79,frontWide:309.60,backSpan:260.29,backDepth:171.70},
    '22':{frontLength:482.60,frontWide:319.21,backSpan:272.99,backDepth:174.90},
    '24':{frontLength:498.50,frontWide:328.80,backSpan:285.69,backDepth:178.10},
    '26':{frontLength:516.00,frontWide:338.20,backSpan:300.00,backDepth:181.29},
    '28':{frontLength:533.51,frontWide:347.90,backSpan:314.30,backDepth:184.51},
    '30':{frontLength:550.99,frontWide:357.40,backSpan:328.59,backDepth:187.71},
    '32':{frontLength:568.49,frontWide:366.90,backSpan:342.90,backDepth:190.90}
  };
  const FIXED_SIZES={
    label:'Published size',
    default:'10',
    seamAllowanceMM:9.525,
    seamAllowanceText:'The original 3/8-inch seam allowance is included on sewn edges; place-on-fold edges have none.',
    unit:'in',
    fitNote:'This style has negative ease for fabric with approximately 60% stretch. Use four-way stretch, compare its recovery with a test swatch, and make a test garment if unsure.',
    measurementLabels:{
      bust:'Body bust',waist:'Body waist',hips:'Body hips',
      finishedWrap:'Finished center-back over bust to center-back waist'
    },
    entries:SIZE_ROWS.map(row=>({
      id:row.id,chartSize:row.id,
      measurements:{bust:row.bust,waist:row.waist,hips:row.hips,finishedWrap:row.finishedWrap}
    }))
  };
  const sizeRow=value=>SIZE_ROWS.find(row=>row.id===String(value))||SIZE_ROWS.find(row=>row.id===FIXED_SIZES.default);

  const GUIDE=`## Before sewing

- Select one of the publisher's original single sizes 00-32. A 3/8-inch seam allowance is included on sewn edges; place-on-fold edges have none.
- Use a four-way stretch knit with approximately 60% stretch. Keep the printed grainline aligned with the fabric grain and, as the publisher instructs, verify that the widest stretch runs along each piece's long axis before cutting.
- Cut wrap front A once on the fold from fashion fabric and once on the fold from lining. Cut back band B the same way.
- Mark the right side of every layer, the fold lines, the S side-seam marks, and the gather range before removing the pattern.

## 1. Join the wrap-front layers (A)

Place the fashion and lining layers of A right sides together. Pin closely so the knit cannot roll. Sew the two long tapered edges with a stretch or overlock stitch, leaving both gathered ends open.

## 2. Turn and press A

Turn A right side out through an open end. Smooth the long seams and press on a low setting suitable for the chosen knit.

## 3. Gather both ends of A

Sew two parallel rows of gathering stitches inside the seam allowance at each marked end of A. Leave long thread tails and do not gather until matching A to B.

## 4. Join the back-band layers (B)

Place the fashion and lining layers of B right sides together. Sew the two long edges with a stretch or overlock stitch, leaving both S side-seam ends open. Turn right side out and press.

## 5. Join the first side seam (A to B)

Pull the gathering threads so one end of A fits the S edge of B. Join that side with a French seam: sew 1/8 inch wrong sides together, trim carefully, then sew 1/4 inch right sides together.

## 6. Form the infinity twist

Lay the joined top flat with the marked garment face upward. Twist A twice, checking that the designated face returns to the outside after the second twist and that neither long edge is rolled inside the twist.

## 7. Join the second side seam

Gather the remaining end of A to the open S edge of B. Confirm the two twists and the front crossover, then close the second side with the same 1/8-inch plus 1/4-inch French seam.

## 8. Final check

Distribute the gathers evenly, press the side seams toward B, and try the top on without overstretching the neckline loop. Check that all seams recover smoothly before wearing it as a top or swim top.`;

  const CONFIG={measurements:[],optionalMeasurements:[],options:{}};
  const ABOUT={
    name:'Twist-Front Halter Crop Top',
    description:'A lined infinity-wrap crop top with a double-twist halter neckline, gathered side seams, and a fitted stretch back band.',
    difficulty:2,
    yardage:'1-2 yd',
    yardageNote:'Official materials estimate: 1-2 yards of four-way stretch jersey; fabric width is not specified.',
    tags:['tops','swimwear'],
    techniques:['four-way-stretch','bagged-lining','gathers','french-seams','twist-construction'],
    illustration:'illustrations/tulsi.svg',
    sourceUrl:SOURCE,
    sourceLabel:'Based on the linked publisher pattern',
    generated:true,
    fixedSizing:true
  };

  const fmt=value=>Number(Number(value).toFixed(2));
  const xml=value=>String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
  function insetPathWithoutFold(path,width,height,inset){
    const tokens=String(path).match(/[MLCZ]|-?(?:\d+(?:\.\d+)?|\.\d+)/g)||[];
    const segments=[];
    let index=0,start=null,current=null;
    const point=()=>({x:Number(tokens[index++]),y:Number(tokens[index++])});
    while(index<tokens.length){
      const command=tokens[index++];
      if(command==='M'){
        start=point();current=start;
      }else if(command==='L'){
        const target=point();segments.push({command,from:current,points:[target],to:target});current=target;
      }else if(command==='C'){
        const control1=point(),control2=point(),target=point();
        segments.push({command,from:current,points:[control1,control2,target],to:target});current=target;
      }else if(command==='Z'&&start&&current&&(Math.abs(current.x-start.x)>.01||Math.abs(current.y-start.y)>.01)){
        segments.push({command:'L',from:current,points:[start],to:start});current=start;
      }
    }
    const foldIndex=segments.findIndex(segment=>segment.command==='L'&&
      Math.abs(segment.from.y-height)<.15&&Math.abs(segment.to.y-height)<.15&&
      Math.abs(segment.from.x-segment.to.x)>20);
    if(foldIndex<0) throw new Error('Could not locate the publisher fold edge.');
    const scaleX=(width-2*inset)/width,scaleY=(height-inset)/height;
    const transform=source=>({x:inset+source.x*scaleX,y:inset+source.y*scaleY});
    const startPoint=transform(segments[foldIndex].to);
    const ordered=segments.slice(foldIndex+1).concat(segments.slice(0,foldIndex));
    return 'M '+fmt(startPoint.x)+' '+fmt(startPoint.y)+' '+ordered.map(segment=>
      segment.command+' '+segment.points.map(source=>{const target=transform(source);return fmt(target.x)+' '+fmt(target.y);}).join(' ')
    ).join(' ');
  }
  function line(x1,y1,x2,y2,cls='mark'){
    return '<line class="'+cls+'" x1="'+fmt(x1)+'" y1="'+fmt(y1)+'" x2="'+fmt(x2)+'" y2="'+fmt(y2)+'"/>';
  }
  function matchMark(x,y,inwardX,inwardY,label){
    const length=Math.hypot(inwardX,inwardY)||1,ux=inwardX/length,uy=inwardY/length;
    return line(x+ux*2,y+uy*2,x+ux*10,y+uy*10,'notch')+
      '<text class="seam-letter" x="'+fmt(x+ux*15)+'" y="'+fmt(y+uy*15+2)+'">'+xml(label)+'</text>';
  }
  function crossGrain(x,y,length,label='GRAINLINE'){
    return '<g class="grain">'+line(x,y,x+length,y,'grain-line')+
      '<path d="M '+fmt(x)+' '+fmt(y)+' l 8 -4 v 8 z M '+fmt(x+length)+' '+fmt(y)+' l -8 -4 v 8 z"/>'+
      '<text x="'+fmt(x+length/2)+'" y="'+fmt(y-7)+'" text-anchor="middle">'+xml(label)+'</text></g>';
  }
  function crossFold(x,y,length,interiorDirection){
    const dir=interiorDirection<0?-1:1,tipY=y+dir*5,tailY=y+dir*27,headY=tipY+dir*6;
    const arrows=[.28,.72].map(fraction=>{
      const ax=x+length*fraction;
      return '<path class="fold-arrow" d="M '+fmt(ax)+' '+fmt(tailY)+' L '+fmt(ax)+' '+fmt(tipY)+' M '+fmt(ax)+' '+fmt(tipY)+' L '+fmt(ax-3)+' '+fmt(headY)+' M '+fmt(ax)+' '+fmt(tipY)+' L '+fmt(ax+3)+' '+fmt(headY)+'"/>';
    }).join('');
    return line(x,y,x+length,y,'fold-line')+arrows+
      '<text class="fold-text" x="'+fmt(x+length/2)+'" y="'+fmt(y+dir*16+(dir>0?3:0))+'">PLACE ON FOLD</text>';
  }
  function gather(x1,y1,x2,y2){
    // Keep the instruction clear of the centered S seam-match letter.
    return line(x1,y1,x2,y2,'gather-line')+'<text class="gather-text" x="'+fmt((x1+x2)/2)+'" y="'+fmt((y1+y2)/2+25)+'" text-anchor="middle">TWO ROWS - GATHER TO B</text>';
  }
  function title(letter,name,cut,x,y,sizeLabel){
    const rows=String(cut).split('|');
    return '<g class="piece-label" transform="translate('+fmt(x)+' '+fmt(y)+')">'+
      '<text class="piece-number text-4xl fill-note" x="0" y="0">'+xml(letter)+'</text>'+
      '<text class="text-sm fill-current" x="24" y="-18">Published size '+xml(sizeLabel)+'</text>'+
      '<text class="piece-name text-lg fill-current" x="24" y="-10">'+xml(name)+'</text>'+
      '<text class="pattern-name fill-note" x="24" y="-2">Twist-Front Halter Crop Top</text>'+
      rows.map((row,index)=>'<text class="cut-instruction text-md fill-current" x="24" y="'+(7+index*7)+'">'+xml(row)+'</text>').join('')+'</g>';
  }
  function piece(id,letter,name,w,h,body){return {id,letter,name,w:fmt(w),h:fmt(h),body};}

  function buildPieces(settings){
    const row=sizeRow(settings&&settings.options&&settings.options.publishedSize);
    const reference=REFERENCE_DIMENSIONS[row.id],sa=FIXED_SIZES.seamAllowanceMM,edge=sa+8;
    const label=(letter,name,cut,x,y)=>title(letter,name,cut,x,y,row.id);
    const pieces=[];

    // A - source wedge rotated 90 degrees for a compact roll marker. The wide
    // gathered edge is at the top and the narrow fold edge is at the bottom.
    {
      const length=reference.frontLength,wide=reference.frontWide,narrow=69.89;
      const w=wide+2*edge,h=length+2*edge,x=edge,y=edge;
      const left=x+(wide-narrow)/2,right=left+narrow;
      const stitch=insetPathWithoutFold(REFERENCE_FRONT_PATHS[row.id],wide,length,sa);
      const testX=x+wide*.36,testY=y+length*.62;
      const calibration='<g class="calibration-group" transform="translate('+fmt(testX)+' '+fmt(testY)+')"><rect class="calibration-clear" x="-7" y="-7" width="39.4" height="49"/><rect class="calibration" width="25.4" height="25.4"/><text class="calibration-text" x="12.7" y="32.5" text-anchor="middle">1 IN TEST</text><text class="calibration-text" x="12.7" y="38" text-anchor="middle">25.4 MM</text></g>';
      const sourceCut='<path class="cut" transform="translate('+fmt(x)+' '+fmt(y)+')" d="'+REFERENCE_FRONT_PATHS[row.id]+'"/>';
      pieces.push(piece(1,'A','Infinity Wrap Front',w,h,sourceCut+'<path class="stitch" transform="translate('+fmt(x)+' '+fmt(y)+')" d="'+stitch+'"/>'+gather(x+sa+18,y+sa+3,x+wide-sa-18,y+sa+3)+matchMark(x+wide*.5,y+sa,0,1,'S')+crossFold(left+6,y+length,narrow-12,-1)+crossGrain(x+wide*.25,y+length*.52,wide*.50)+label('A','Infinity Wrap Front','Cut 1 on fold from fashion fabric|Cut 1 on fold from lining',x+wide*.18,y+length*.39)+calibration));
    }

    // B - source back band rotated 90 degrees beside A.
    {
      const depth=reference.backDepth,halfSpan=reference.backSpan;
      const w=depth+2*edge,h=halfSpan+2*edge,x=edge,y=edge;
      const seam='M '+fmt(x+depth-sa)+' '+y+' L '+fmt(x+depth-sa)+' '+fmt(y+halfSpan-sa)+' L '+fmt(x+sa)+' '+fmt(y+halfSpan-sa)+' L '+fmt(x+sa)+' '+y;
      const cut='M '+x+' '+y+' L '+fmt(x+depth)+' '+y+' L '+fmt(x+depth)+' '+fmt(y+halfSpan)+' L '+x+' '+fmt(y+halfSpan)+' Z';
      pieces.push(piece(2,'B','Stretch Back Band',w,h,'<path class="cut" d="'+cut+'"/><path class="stitch" d="'+seam+'"/>'+crossFold(x+8,y,depth-16,1)+crossGrain(x+26,y+halfSpan*.38,depth-52)+matchMark(x+depth*.5,y+halfSpan-sa,0,-1,'S')+label('B','Stretch Back Band','Cut 1 on fold from fashion fabric|Cut 1 on fold from lining',x+depth*.10,y+halfSpan*.64)));
    }
    return pieces;
  }

  function render(settings){
    const pieces=buildPieces(settings||{}),front=pieces[0],back=pieces[1];
    const maxWidth=Math.max(500,Math.min(Number(settings&&settings.maxWidth)||900,904.4));
    const gap=10,margin=10;
    if(pieces.some(item=>item.w>maxWidth-2*margin)){
      const item=pieces.find(candidate=>candidate.w>maxWidth-2*margin);
      throw new Error(item.name+' is wider than the selected roll width at this published size.');
    }
    if(front.w+back.w+gap<=maxWidth-2*margin){
      front.x=margin;front.y=margin;back.x=margin+front.w+gap;back.y=margin;
    }else{
      front.x=margin;front.y=margin;back.x=margin;back.y=margin+front.h+gap;
    }
    const width=Math.min(maxWidth,Math.max(500,...pieces.map(item=>item.x+item.w+margin)));
    const height=Math.max(...pieces.map(item=>item.y+item.h+margin));
    const css=`text{font-size:5px;font-family:-apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;fill:#000;text-anchor:start;font-weight:200;dominant-baseline:ideographic}.cut{fill:white;stroke:#212121;stroke-width:.6;vector-effect:non-scaling-stroke}.stitch{fill:none;stroke:#212121;stroke-width:.4;stroke-dasharray:.4 .8;vector-effect:non-scaling-stroke}.mark,.notch,.gather-line{fill:none;stroke:#3b82f6;stroke-width:.4;vector-effect:non-scaling-stroke}.gather-line{stroke-dasharray:1 1.5}.fold-line,.fold-arrow,.grain-line{fill:none;stroke:#8b5cf6;stroke-width:.4;vector-effect:non-scaling-stroke}.fold-line{stroke-dasharray:15 1.5 1 1.5}.text-sm{font-size:4px}.text-md{font-size:5px}.text-lg{font-size:7px}.text-4xl{font-size:36px}.fill-note,.pattern-name{fill:#8b5cf6}.piece-number{font-size:36px}.piece-name{font-size:7px}.grain text,.fold-text{font-size:5px;fill:#8b5cf6;text-anchor:middle}.grain path{fill:#8b5cf6;stroke:none}.seam-letter,.gather-text{font-size:5px;fill:#3b82f6;text-anchor:middle}.calibration-clear{fill:white;stroke:none}.calibration{fill:white;stroke:#212121;stroke-width:.6}.calibration-text{font-size:3px;fill:#000;text-anchor:middle}`;
    const groups=pieces.map(item=>'<g id="tulsi-stack-'+item.id+'" data-piece="'+item.letter+'" data-width="'+item.w+'" data-height="'+item.h+'" data-layout-x="'+fmt(item.x)+'" data-layout-y="'+fmt(item.y)+'" transform="translate('+fmt(item.x)+' '+fmt(item.y)+')">'+item.body+'</g>').join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="'+fmt(width)+'mm" height="'+fmt(height)+'mm" viewBox="0 0 '+fmt(width)+' '+fmt(height)+'"><style>'+css+'</style><rect width="100%" height="100%" fill="white"/>'+groups+'</svg>';
  }

  window.PatternGenerators=window.PatternGenerators||{};
  window.PatternGenerators.tulsi={about:ABOUT,config:CONFIG,instructions:GUIDE,i18n:{},fixedSizes:FIXED_SIZES,render};
})();
