const CIRCUMFERENCE = 2 * Math.PI * 54;

const display = document.getElementById("display");
const setupForm = document.getElementById("setup-form");
const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const statusEl = document.getElementById("status");
const ringFg = document.querySelector(".ring-fg");

let totalSeconds = 0;
let remainingSeconds = 0;
let intervalId = null;
let endTimestamp = null;
let isRunning = false;
let isPaused = false;
let isFinished = false;
let alarmCtx = null;
let alarmOsc = null;
let alarmGain = null;
let alarmPulseInterval = null;

function clampInput(input, max) {
  let value = parseInt(input.value, 10);
  if (Number.isNaN(value) || value < 0) value = 0;
  if (value > max) value = max;
  input.value = value;
  return value;
}

function readDuration() {
  const hours = clampInput(hoursInput, 99);
  const minutes = clampInput(minutesInput, 59);
  const seconds = clampInput(secondsInput, 59);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatTime(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function setInputsFromSeconds(total) {
  hoursInput.value = Math.floor(total / 3600);
  minutesInput.value = Math.floor((total % 3600) / 60);
  secondsInput.value = total % 60;
}

function updateRing() {
  if (totalSeconds <= 0) {
    ringFg.style.strokeDashoffset = "0";
    return;
  }
  const progress = remainingSeconds / totalSeconds;
  ringFg.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress));
}

function updateDisplay() {
  display.textContent = formatTime(remainingSeconds);
  updateRing();
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = "status" + (type ? ` ${type}` : "");
}

function setSetupEnabled(enabled) {
  setupForm.classList.toggle("disabled", !enabled);
}

function updateButtons() {
  const hasTime = remainingSeconds > 0;
  const idle = !isRunning && !isPaused && !isFinished;

  startBtn.textContent = isPaused ? "Продолжить" : isRunning ? "Идёт" : "Старт";
  startBtn.disabled = isRunning || isFinished || (!hasTime && idle);

  pauseBtn.disabled = !isRunning;
  resetBtn.textContent = isFinished ? "Стоп" : "Сброс";
  resetBtn.disabled = !isFinished && idle && !hasTime && totalSeconds === 0;

  display.classList.toggle("is-hidden", idle);
  display.setAttribute("aria-hidden", idle ? "true" : "false");
}

function tick() {
  const left = Math.max(0, Math.round((endTimestamp - Date.now()) / 1000));
  remainingSeconds = left;
  updateDisplay();

  if (left <= 0) {
    finish();
  }
}

function startAlarm() {
  stopAlarm();
  try {
    alarmCtx = new AudioContext();
    alarmGain = alarmCtx.createGain();
    alarmGain.gain.value = 0;
    alarmGain.connect(alarmCtx.destination);

    alarmOsc = alarmCtx.createOscillator();
    alarmOsc.type = "square";
    alarmOsc.frequency.value = 880;
    alarmOsc.connect(alarmGain);
    alarmOsc.start();
    if (alarmCtx.state === "suspended") {
      alarmCtx.resume();
    }

    let on = true;
    alarmPulseInterval = setInterval(() => {
      if (!alarmCtx || !alarmGain) return;
      on = !on;
      alarmGain.gain.setTargetAtTime(on ? 0.2 : 0, alarmCtx.currentTime, 0.02);
    }, 400);
  } catch {
    /* audio unavailable */
  }
}

function stopAlarm() {
  if (alarmPulseInterval) {
    clearInterval(alarmPulseInterval);
    alarmPulseInterval = null;
  }
  if (alarmOsc) {
    try {
      alarmOsc.stop();
    } catch {
      /* already stopped */
    }
    alarmOsc.disconnect();
    alarmOsc = null;
  }
  if (alarmGain) {
    alarmGain.disconnect();
    alarmGain = null;
  }
  if (alarmCtx) {
    alarmCtx.close();
    alarmCtx = null;
  }
}

function finish() {
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  isPaused = false;
  isFinished = true;
  remainingSeconds = 0;
  endTimestamp = null;

  display.classList.add("finished");
  display.classList.remove("running");
  setSetupEnabled(true);
  setStatus("Время вышло! Нажмите «Стоп», чтобы выключить сигнал.", "active");
  updateButtons();
  updateDisplay();
  startAlarm();

  if (document.hidden && "Notification" in window && Notification.permission === "granted") {
    new Notification("Таймер завершён", { body: "Обратный отсчёт завершён." });
  }
}

function start() {
  if (isRunning) return;

  if (isPaused) {
    endTimestamp = Date.now() + remainingSeconds * 1000;
    isRunning = true;
    isPaused = false;
    intervalId = setInterval(tick, 200);
    display.classList.add("running");
    display.classList.remove("finished");
    setSetupEnabled(false);
    setStatus("Таймер запущен…");
    updateButtons();
    return;
  }

  const duration = readDuration();
  if (duration <= 0) {
    setStatus("Укажите длительность больше нуля.", "error");
    return;
  }

  totalSeconds = duration;
  remainingSeconds = duration;
  endTimestamp = Date.now() + duration * 1000;
  isRunning = true;
  isPaused = false;

  ringFg.style.strokeDasharray = String(CIRCUMFERENCE);
  intervalId = setInterval(tick, 200);
  display.classList.add("running");
  display.classList.remove("finished");
  setSetupEnabled(false);
  setStatus("Таймер запущен…");
  updateDisplay();
  updateButtons();
}

function pause() {
  if (!isRunning) return;
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  isPaused = true;
  remainingSeconds = Math.max(0, Math.round((endTimestamp - Date.now()) / 1000));
  endTimestamp = null;
  setStatus("Пауза");
  updateButtons();
}

function reset() {
  stopAlarm();
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  isPaused = false;
  isFinished = false;
  endTimestamp = null;
  totalSeconds = 0;
  remainingSeconds = readDuration();
  display.classList.remove("running", "finished");
  setSetupEnabled(true);
  setStatus("");
  updateDisplay();
  updateButtons();
}

function applyPreset(seconds) {
  if (isRunning || isPaused || isFinished) return;
  setInputsFromSeconds(seconds);
  remainingSeconds = seconds;
  updateDisplay();
  setStatus("");
}

document.querySelectorAll(".preset").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyPreset(parseInt(btn.dataset.seconds, 10));
  });
});

[startBtn, pauseBtn, resetBtn].forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn === startBtn) start();
    else if (btn === pauseBtn) pause();
    else reset();
  });
});

[hoursInput, minutesInput, secondsInput].forEach((input) => {
  input.addEventListener("change", () => {
    if (!isRunning && !isPaused) {
      remainingSeconds = readDuration();
      updateDisplay();
    }
    clampInput(input, input === hoursInput ? 99 : 59);
  });
});

setupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  start();
});

if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

ringFg.style.strokeDasharray = String(CIRCUMFERENCE);
remainingSeconds = readDuration();
updateDisplay();
updateButtons();
