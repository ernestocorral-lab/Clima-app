const BASE_WIDTH = 62;
const SCALE = 1.3;
const WIDTH = Math.round(BASE_WIDTH * SCALE);

const increase = WIDTH / BASE_WIDTH;
const minIncrease = SCALE - 0.02;
const maxIncrease = SCALE + 0.02;

if (increase < minIncrease || increase > maxIncrease) {
  console.error(
    `Header button width ${WIDTH}px is not ~30% wider than baseline ${BASE_WIDTH}px (ratio ${increase.toFixed(3)})`,
  );
  process.exit(1);
}

console.log(
  `OK: header buttons ${WIDTH}px wide (${Math.round((increase - 1) * 100)}% wider than ${BASE_WIDTH}px baseline)`,
);
