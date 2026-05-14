// 检查点：异物尺寸会同步影响视觉比例、冲击次数和进度条。
const OBJECT_SIZES = {
  small: {
    label: "小",
    scale: 0.72,
    thrusts: 3,
  },
  medium: {
    label: "中",
    scale: 1,
    thrusts: 5,
  },
  large: {
    label: "大",
    scale: 1.34,
    thrusts: 7,
  },
};

const stateText = {
  breathing: {
    pill: "正常呼吸",
    phase: "呼吸",
    air: "通畅",
    object: "未进入",
  },
  blocked: {
    pill: "气道阻塞",
    phase: "阻塞",
    air: "中断",
    object: "咽喉入口",
  },
  rescue: {
    pill: "正在急救",
    phase: "急救",
    air: "受压上冲",
    object: "逐步上移",
  },
  expelled: {
    pill: "异物排出",
    phase: "排异物",
    air: "恢复通畅",
    object: "已排出",
  },
};

const objectPositions = [
  { x: 492, y: 248, scale: 1 },
  { x: 489, y: 229, scale: 0.98 },
  { x: 483, y: 207, scale: 0.96 },
  { x: 465, y: 191, scale: 0.94 },
  { x: 443, y: 181, scale: 0.92 },
  { x: 424, y: 178, scale: 0.9 },
  { x: 407, y: 176, scale: 0.88 },
  { x: 590, y: 172, scale: 0.84, rotate: 18 },
];

const body = document.body;
const model = document.querySelector("#rescueModel");
const foreignBody = document.querySelector("#foreignBody");
const statusPill = document.querySelector("#statusPill");
const phaseReadout = document.querySelector("#phaseReadout");
const airReadout = document.querySelector("#airReadout");
const objectReadout = document.querySelector("#objectReadout");
const sizeReadout = document.querySelector("#sizeReadout");
const meterFill = document.querySelector("#meterFill");
const meterText = document.querySelector("#meterText");
const phases = document.querySelectorAll(".phase");
const sizeInputs = document.querySelectorAll('input[name="objectSize"]');
const breatheBtn = document.querySelector("#breatheBtn");
const blockBtn = document.querySelector("#blockBtn");
const thrustBtn = document.querySelector("#thrustBtn");
const resetBtn = document.querySelector("#resetBtn");

let currentState = "breathing";
let thrustCount = 0;
let objectSize = "medium";

function getSizeConfig() {
  return OBJECT_SIZES[objectSize];
}

function getRequiredThrusts() {
  return getSizeConfig().thrusts;
}

function setForeignBodyPosition(position) {
  const rotate = position.rotate ?? 0;
  const scale = position.scale * getSizeConfig().scale;
  foreignBody.style.transform = `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotate}deg)`;
}

function hideForeignBody() {
  foreignBody.style.transform = "translate(1020px, 250px)";
}

function updateMeter() {
  const requiredThrusts = getRequiredThrusts();
  const width = Math.round((Math.min(thrustCount, requiredThrusts) / requiredThrusts) * 188);
  meterFill.setAttribute("width", String(width));
  meterText.textContent = `${thrustCount} / ${requiredThrusts}`;
}

function getPositionForProgress() {
  const requiredThrusts = getRequiredThrusts();
  const lastIndex = objectPositions.length - 1;
  const rawIndex = Math.round((thrustCount / requiredThrusts) * lastIndex);
  return objectPositions[Math.min(rawIndex, lastIndex)];
}

function setState(nextState) {
  currentState = nextState;
  body.dataset.state = nextState;
  body.dataset.objectSize = objectSize;

  const text = stateText[nextState];
  statusPill.textContent = text.pill;
  phaseReadout.textContent = text.phase;
  airReadout.textContent = text.air;
  objectReadout.textContent = text.object;
  sizeReadout.textContent = getSizeConfig().label;

  phases.forEach((phase) => {
    phase.classList.toggle("active", phase.dataset.phase === nextState);
  });

  thrustBtn.disabled = nextState !== "blocked" && nextState !== "rescue";
  blockBtn.disabled = nextState === "blocked" || nextState === "rescue";
  breatheBtn.disabled = nextState === "breathing";

  if (nextState === "breathing") {
    hideForeignBody();
  }

  if (nextState === "blocked") {
    setForeignBodyPosition(objectPositions[0]);
  }

  if (nextState === "expelled") {
    setForeignBodyPosition(objectPositions[objectPositions.length - 1]);
    thrustBtn.disabled = true;
    blockBtn.disabled = false;
  }
}

function resetModel() {
  thrustCount = 0;
  updateMeter();
  model.classList.remove("thrusting");
  setState("breathing");
}

function blockAirway() {
  thrustCount = 0;
  updateMeter();
  setState("blocked");
}

function doThrust() {
  if (currentState !== "blocked" && currentState !== "rescue") {
    return;
  }

  thrustCount = Math.min(thrustCount + 1, getRequiredThrusts());
  updateMeter();
  setState(thrustCount >= getRequiredThrusts() ? "expelled" : "rescue");
  setForeignBodyPosition(getPositionForProgress());

  model.classList.remove("thrusting");
  void model.offsetWidth;
  model.classList.add("thrusting");

  window.setTimeout(() => {
    model.classList.remove("thrusting");
  }, 430);
}

function restoreBreathing() {
  resetModel();
}

function changeObjectSize(event) {
  objectSize = event.target.value;
  thrustCount = Math.min(thrustCount, getRequiredThrusts());
  updateMeter();
  sizeReadout.textContent = getSizeConfig().label;

  if (currentState === "blocked") {
    setForeignBodyPosition(objectPositions[0]);
  }

  if (currentState === "rescue") {
    if (thrustCount >= getRequiredThrusts()) {
      setState("expelled");
      return;
    }

    setForeignBodyPosition(getPositionForProgress());
  }
}

breatheBtn.addEventListener("click", restoreBreathing);
blockBtn.addEventListener("click", blockAirway);
thrustBtn.addEventListener("click", doThrust);
resetBtn.addEventListener("click", resetModel);
sizeInputs.forEach((input) => {
  input.addEventListener("change", changeObjectSize);
});

resetModel();
