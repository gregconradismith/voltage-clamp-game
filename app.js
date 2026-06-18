'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const els = {
  roundLabel: document.getElementById('roundLabel'),
  scoreLabel: document.getElementById('scoreLabel'),
  streakLabel: document.getElementById('streakLabel'),
  scorePercent: document.getElementById('scorePercent'),
  correctCount: document.getElementById('correctCount'),
  attemptCount: document.getElementById('attemptCount'),
  currentStreak: document.getElementById('currentStreak'),
  bestStreak: document.getElementById('bestStreak'),
  promptText: document.getElementById('promptText'),
  answerGrid: document.getElementById('answerGrid'),
  nextButton: document.getElementById('nextButton'),
  newRoundButton: document.getElementById('newRoundButton'),
  resetButton: document.getElementById('resetButton'),
  revealPanel: document.getElementById('revealPanel'),
  verdictBurst: document.getElementById('verdictBurst'),
  resultLabel: document.getElementById('resultLabel'),
  resultText: document.getElementById('resultText'),
  resultDetail: document.getElementById('resultDetail'),
  showProtocolCheckbox: document.getElementById('showProtocolCheckbox'),
  showIvCheckbox: document.getElementById('showIvCheckbox'),
  speedSlider: document.getElementById('speedSlider'),
  answerKey: document.getElementById('answerKey'),
  erevText: document.getElementById('erevText'),
  gateText: document.getElementById('gateText'),
  tauText: document.getElementById('tauText'),
  historyList: document.getElementById('historyList'),
};

const colors = {
  blue: '#2557c7',
  green: '#23834f',
  red: '#d33838',
  cyan: '#167c8a',
  magenta: '#a33486',
  ink: '#20242a',
  muted: '#6a6f78',
  axis: '#a99f91',
  grid: '#ebe3d7',
  paper: '#fffdf8',
  amber: '#94651d',
};

const traceColors = ['#2557c7', '#23834f', '#d33838', '#167c8a', '#a33486', '#7b5bbd', '#c47f17'];
const voltage = makeRange(-150, 150, 1);
const time = makeRange(0, 500, 2);
const vtestList = [-80, -60, -40, -20, 0, 20, 40];
const erevList = [-100, -80, 0, 60, 120];
const v0List = [-60, -40, -20];
const v1List = [10, 20, 30];
const vhold = -100;

const state = {
  round: 0,
  attempts: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  revealed: false,
  history: [],
  roundData: null,
};

function makeRange(start, stop, step) {
  const values = [];
  for (let value = start; value <= stop + step / 2; value += step) {
    values.push(Number(value.toFixed(8)));
  }
  return values;
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function minf(v, v0, v1) {
  return 0.5 * (1 + Math.tanh((v - v0) / v1));
}

function vCommand(t, vtest) {
  return t >= 100 && t <= 400 ? vtest : vhold;
}

function generateRound() {
  const erev = randomChoice(erevList);
  const v0 = randomChoice(v0List);
  const v1 = randomChoice(v1List);
  const tau = Number(els.speedSlider.value);
  const traces = vtestList.map((vtest, index) => simulateTrace(vtest, erev, v0, v1, tau, traceColors[index]));
  const iv = traces.map(trace => ({
    vtest: trace.vtest,
    current: trace.sampleCurrent,
    color: trace.color,
  }));
  return {
    erev,
    v0,
    v1,
    tau,
    traces,
    iv,
    minfCurve: voltage.map(v => minf(v, v0, v1)),
    driving: voltage.map(v => v - erev),
    currentCurve: voltage.map(v => minf(v, v0, v1) * (v - erev)),
    choices: shuffledChoices(erev),
  };
}

function simulateTrace(vtest, erev, v0, v1, tau, color) {
  let m = minf(vhold, v0, v1);
  const current = [];
  const command = [];
  let sampleCurrent = 0;

  time.forEach((t, index) => {
    const v = vCommand(t, vtest);
    const target = minf(v, v0, v1);
    if (index > 0) {
      const dt = time[index] - time[index - 1];
      m += ((target - m) / tau) * dt;
    }
    const i = m * (v - erev);
    current.push(i);
    command.push(v);
    if (Math.abs(t - 250) < 1e-6) sampleCurrent = i;
  });

  return { vtest, color, current, command, sampleCurrent };
}

function shuffledChoices(answer) {
  return [answer, ...erevList.filter(value => value !== answer)].sort(() => Math.random() - 0.5);
}

function startRound() {
  state.round += 1;
  state.revealed = false;
  state.roundData = generateRound();
  els.revealPanel.hidden = true;
  els.answerKey.hidden = true;
  els.revealPanel.className = 'reveal-panel';
  els.verdictBurst.className = 'verdict-burst';
  els.promptText.textContent = 'Use the clamp current traces to estimate the reversal potential.';
  renderChoices();
  updateLabels();
  draw();
}

function resetGame() {
  state.round = 0;
  state.attempts = 0;
  state.correct = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.history = [];
  renderHistory();
  startRound();
}

function renderChoices() {
  els.answerGrid.innerHTML = '';
  state.roundData.choices.forEach(choice => {
    const button = document.createElement('button');
    button.className = 'answer-button';
    button.type = 'button';
    button.textContent = `${choice} mV`;
    button.addEventListener('click', () => answer(choice));
    els.answerGrid.appendChild(button);
  });
}

function answer(choice) {
  if (state.revealed) return;
  const gotIt = choice === state.roundData.erev;
  state.revealed = true;
  state.attempts += 1;
  if (gotIt) {
    state.correct += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
  } else {
    state.streak = 0;
  }

  state.history.unshift({
    round: state.round,
    gotIt,
    answer: `${state.roundData.erev} mV`,
  });
  state.history = state.history.slice(0, 6);

  [...els.answerGrid.children].forEach(button => {
    const value = Number(button.textContent.replace(' mV', ''));
    button.disabled = true;
    button.classList.toggle('correct', value === state.roundData.erev);
    button.classList.toggle('incorrect', value === choice && !gotIt);
  });

  els.resultLabel.textContent = gotIt ? 'Correct' : 'Not quite';
  els.resultText.textContent = gotIt ? 'Correct!' : 'Not quite';
  els.resultDetail.textContent = `The sampled I-V relation crosses zero at ${state.roundData.erev} mV.`;
  els.promptText.textContent = gotIt
    ? 'Right: clamp currents reverse sign at the reversal potential.'
    : 'Compare which voltage steps produce inward versus outward current.';
  els.revealPanel.classList.toggle('is-correct', gotIt);
  els.revealPanel.classList.toggle('is-incorrect', !gotIt);
  els.answerKey.hidden = false;
  els.revealPanel.hidden = false;
  renderAnswerKey();
  renderHistory();
  updateLabels();
  draw();
}

function updateLabels() {
  els.roundLabel.textContent = `Round ${state.round}`;
  els.scoreLabel.textContent = `${state.correct} / ${state.attempts}`;
  els.streakLabel.textContent = `Streak ${state.streak}`;
  els.correctCount.textContent = state.correct;
  els.attemptCount.textContent = state.attempts;
  els.currentStreak.textContent = state.streak;
  els.bestStreak.textContent = state.bestStreak;
  els.scorePercent.textContent = state.attempts === 0
    ? '0%'
    : `${Math.round((state.correct / state.attempts) * 100)}%`;
}

function renderAnswerKey() {
  els.erevText.textContent = `${state.roundData.erev} mV`;
  els.gateText.textContent = `m_inf midpoint ${state.roundData.v0} mV, slope ${state.roundData.v1} mV`;
  els.tauText.textContent = `${state.roundData.tau} ms`;
}

function renderHistory() {
  els.historyList.innerHTML = '';
  state.history.forEach(item => {
    const li = document.createElement('li');
    li.className = item.gotIt ? 'correct' : 'incorrect';
    li.textContent = `Round ${item.round}: ${item.answer}`;
    els.historyList.appendChild(li);
  });
}

function draw() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(680, Math.floor(rect.width * ratio));
  canvas.height = Math.max(430, Math.floor(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const width = canvas.width / ratio;
  const height = canvas.height / ratio;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, width, height);

  const gap = 28;
  if (state.revealed) {
    const colW = (width - 92 - gap) / 2;
    const rowH = (height - 92 - gap) / 2;
    drawTimePlot({
      rect: { x: 46, y: 34, width: colW, height: rowH },
      title: 'Voltage command',
      key: 'command',
      yLabel: 'mV',
      enabled: true,
    });
    drawIvMechanism({
      rect: { x: 46 + colW + gap, y: 34, width: colW, height: rowH },
      title: 'm_inf, V - Erev, I(V)',
    });
    drawTimePlot({
      rect: { x: 46, y: 34 + rowH + gap, width: colW, height: rowH },
      title: 'Clamp currents',
      key: 'current',
      yLabel: 'current',
      enabled: true,
    });
    drawIvDots({
      rect: { x: 46 + colW + gap, y: 34 + rowH + gap, width: colW, height: rowH },
      title: 'Sampled I-V relation',
      revealLine: true,
    });
  } else {
    const topH = els.showProtocolCheckbox.checked ? height * 0.32 : 0;
    if (els.showProtocolCheckbox.checked) {
      drawTimePlot({
        rect: { x: 48, y: 34, width: width - 82, height: topH - 44 },
        title: 'Voltage command',
        key: 'command',
        yLabel: 'mV',
        enabled: true,
      });
    }
    drawTimePlot({
      rect: { x: 48, y: topH + 34, width: width - 82, height: height - topH - 76 },
      title: 'Clamp currents',
      key: 'current',
      yLabel: 'current',
      enabled: true,
    });
    if (els.showIvCheckbox.checked) {
      drawIvDots({
        rect: { x: width - 240, y: 54, width: 180, height: 140 },
        title: 'sample',
        revealLine: false,
      });
    }
  }
}

function drawTimePlot({ rect, title, key, yLabel }) {
  const series = state.roundData.traces.map(trace => ({
    values: trace[key],
    color: trace.color,
    label: `${trace.vtest} mV`,
  }));
  drawPlot({
    x: time,
    series,
    rect,
    title,
    xMin: 0,
    xMax: 500,
    yLabel,
  });
}

function drawIvMechanism({ rect, title }) {
  const maxCurrent = maxAbs(state.roundData.currentCurve);
  drawPlot({
    x: voltage,
    series: [
      { values: state.roundData.minfCurve.map(value => value * maxCurrent), color: colors.blue, label: 'm_inf scaled' },
      { values: state.roundData.driving, color: colors.green, label: 'V - Erev' },
      { values: state.roundData.currentCurve, color: colors.red, label: 'I(V)' },
    ],
    rect,
    title,
    xMin: -150,
    xMax: 150,
    markerX: state.roundData.erev,
  });
}

function drawIvDots({ rect, title, revealLine }) {
  const yValues = state.roundData.iv.map(point => point.current);
  const xMin = -120;
  const xMax = 130;
  let yMin = Math.min(...yValues, 0);
  let yMax = Math.max(...yValues, 0);
  const margin = Math.max(1, (yMax - yMin) * 0.18);
  yMin -= margin;
  yMax += margin;

  ctx.save();
  drawFrame(rect, xMin, xMax, yMin, yMax);
  if (revealLine) {
    drawAxis(rect, xMin, xMax, yMin, yMax, 0, 'x');
    const xErev = xToCanvas(state.roundData.erev, rect, xMin, xMax);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xErev, rect.y);
    ctx.lineTo(xErev, rect.y + rect.height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  state.roundData.iv.forEach(point => {
    const x = xToCanvas(point.vtest, rect, xMin, xMax);
    const y = yToCanvas(point.current, rect, yMin, yMax);
    ctx.fillStyle = point.color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = colors.ink;
  ctx.font = '800 15px ui-sans-serif, system-ui';
  ctx.fillText(title, rect.x, rect.y - 10);
  ctx.restore();
}

function drawPlot({ x, series, rect, title, xMin, xMax, yLabel, markerX = null }) {
  const allValues = series.flatMap(item => item.values);
  let yMin = Math.min(...allValues, 0);
  let yMax = Math.max(...allValues, 0);
  const margin = Math.max(1, (yMax - yMin) * 0.12);
  yMin -= margin;
  yMax += margin;
  drawFrame(rect, xMin, xMax, yMin, yMax);
  drawAxis(rect, xMin, xMax, yMin, yMax, 0, 'x');

  series.forEach(item => drawSeries(x, item.values, rect, xMin, xMax, yMin, yMax, item.color));

  if (markerX !== null) {
    const xPos = xToCanvas(markerX, rect, xMin, xMax);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xPos, rect.y);
    ctx.lineTo(xPos, rect.y + rect.height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = colors.ink;
  ctx.font = '800 15px ui-sans-serif, system-ui';
  ctx.fillText(title, rect.x, rect.y - 10);
  ctx.fillStyle = colors.muted;
  ctx.font = '12px ui-sans-serif, system-ui';
  ctx.fillText(yLabel, rect.x + rect.width - 48, rect.y + 16);
}

function drawFrame(rect, xMin, xMax, yMin, yMax) {
  ctx.save();
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = rect.y + (i / 4) * rect.height;
    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.width, y);
    ctx.stroke();
  }
  for (let value = Math.ceil(xMin / 50) * 50; value <= xMax; value += 50) {
    const x = xToCanvas(value, rect, xMin, xMax);
    ctx.beginPath();
    ctx.moveTo(x, rect.y);
    ctx.lineTo(x, rect.y + rect.height);
    ctx.stroke();
  }
  ctx.strokeStyle = colors.axis;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

function drawAxis(rect, xMin, xMax, yMin, yMax, value, axis) {
  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  if (axis === 'x') {
    const y = yToCanvas(value, rect, yMin, yMax);
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.width, y);
  } else {
    const x = xToCanvas(value, rect, xMin, xMax);
    ctx.moveTo(x, rect.y);
    ctx.lineTo(x, rect.y + rect.height);
  }
  ctx.stroke();
  ctx.restore();
}

function drawSeries(x, values, rect, xMin, xMax, yMin, yMax, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  values.forEach((value, index) => {
    const xPos = xToCanvas(x[index], rect, xMin, xMax);
    const yPos = yToCanvas(value, rect, yMin, yMax);
    if (index === 0) ctx.moveTo(xPos, yPos);
    else ctx.lineTo(xPos, yPos);
  });
  ctx.stroke();
  ctx.restore();
}

function xToCanvas(value, rect, xMin, xMax) {
  return rect.x + ((value - xMin) / (xMax - xMin)) * rect.width;
}

function yToCanvas(value, rect, yMin, yMax) {
  return rect.y + (1 - (value - yMin) / (yMax - yMin)) * rect.height;
}

function maxAbs(values) {
  return Math.max(...values.map(value => Math.abs(value)), 1);
}

els.nextButton.addEventListener('click', startRound);
els.newRoundButton.addEventListener('click', startRound);
els.resetButton.addEventListener('click', resetGame);
els.showProtocolCheckbox.addEventListener('change', draw);
els.showIvCheckbox.addEventListener('change', draw);
els.speedSlider.addEventListener('input', () => {
  state.roundData = generateRound();
  renderChoices();
  if (state.revealed) renderAnswerKey();
  draw();
});
window.addEventListener('resize', draw);

resetGame();
