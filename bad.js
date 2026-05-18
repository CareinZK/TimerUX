const readout = document.getElementById("readout");
const hoursSelect = document.getElementById("hours-select");
const minutesSelect = document.getElementById("minutes-select");
const secondsSelect = document.getElementById("seconds-select");
const applyBtn = document.getElementById("apply-btn");
const proceedBtn = document.getElementById("proceed-btn");
const ceaseBtn = document.getElementById("cease-btn");
const restoreBtn = document.getElementById("restore-btn");
const confirmCheck = document.getElementById("confirm-check");
const msgEl = document.getElementById("msg");

let appliedSeconds = 0;
let remainingSeconds = 0;
let intervalId = null;
let endTimestamp = null;
let isRunning = false;
let isPaused = false;
let isFinished = false;

function populateSelect(select, max) {
  for (let i = 0; i <= max; i += 1) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = String(i);
    select.appendChild(opt);
  }
}

function readSelects() {
  return (
    parseInt(hoursSelect.value, 10) * 3600 +
    parseInt(minutesSelect.value, 10) * 60 +
    parseInt(secondsSelect.value, 10)
  );
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatClock(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)} hours ${pad2(m)} minutes ${pad2(s)} seconds`;
}

function setMsg(text, isError = false) {
  msgEl.textContent = text;
  msgEl.className = "bad-msg" + (isError ? " is-error" : "");
}

function setSelectsEnabled(enabled) {
  [hoursSelect, minutesSelect, secondsSelect, applyBtn].forEach((el) => {
    el.disabled = !enabled;
  });
}

function updateReadout() {
  if (isFinished) {
    readout.innerHTML =
      "<strong>STATUS: ELAPSED</strong><br>Countdown reached zero. Dismiss the system notice, then use Restore defaults.";
    return;
  }

  if (isRunning) {
    readout.innerHTML =
      `<strong>${remainingSeconds}</strong> (seconds)<br>` +
      `Approximate breakdown: ${formatClock(remainingSeconds)}<br>` +
      "Note: value updates once per second.";
    return;
  }

  if (isPaused) {
    readout.innerHTML =
      `<strong>PAUSED</strong><br>${remainingSeconds} seconds on hold.<br>` +
      `${formatClock(remainingSeconds)}`;
    return;
  }

  if (appliedSeconds > 0) {
    readout.innerHTML =
      `Pending duration (applied): <strong>${appliedSeconds}</strong> seconds total.<br>` +
      formatClock(appliedSeconds) +
      "<br>Check the box below, then Activate.";
  } else {
    readout.innerHTML =
      "No duration applied. Adjust selectors, then press “Commit duration to device”.";
  }
}

function updateControls() {
  ceaseBtn.disabled = !isRunning;
  restoreBtn.disabled = isRunning;

  if (isFinished) {
    proceedBtn.disabled = true;
    proceedBtn.textContent = "Activate countdown (elapsed)";
    return;
  }

  if (isRunning) {
    proceedBtn.disabled = true;
    proceedBtn.textContent = "Activate countdown (unavailable while running)";
    return;
  }

  if (isPaused) {
    proceedBtn.disabled = !confirmCheck.checked;
    proceedBtn.textContent = "Activate countdown (resume — confirmation required)";
    return;
  }

  proceedBtn.disabled = !(appliedSeconds > 0 && confirmCheck.checked);
  proceedBtn.textContent = "Activate countdown";
}

function tick() {
  remainingSeconds = Math.max(0, Math.round((endTimestamp - Date.now()) / 1000));
  updateReadout();

  if (remainingSeconds <= 0) {
    finish();
  }
}

function finish() {
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  isPaused = false;
  isFinished = true;
  endTimestamp = null;
  remainingSeconds = 0;
  setSelectsEnabled(true);
  setMsg("");
  updateReadout();
  updateControls();
  alert("Timer complete.\n\nThe countdown has ended. Click OK to continue.");
}

function applyDuration() {
  if (isRunning || isPaused) return;

  const seconds = readSelects();
  if (seconds <= 0) {
    setMsg("Duration must be greater than zero. Adjust selectors and commit again.", true);
    appliedSeconds = 0;
    updateReadout();
    updateControls();
    return;
  }

  if (!window.confirm("Commit this duration?\n\nYou will still need to activate the countdown separately.")) {
    return;
  }

  appliedSeconds = seconds;
  remainingSeconds = seconds;
  confirmCheck.checked = false;
  setMsg("Duration committed. Check the acknowledgment box, then activate.");
  updateReadout();
  updateControls();
}

function activate() {
  if (isRunning) return;

  if (!confirmCheck.checked) {
    setMsg("You must check the acknowledgment box before activating.", true);
    return;
  }

  if (isPaused) {
    if (!window.confirm("Resume the countdown from the paused value?")) return;
    endTimestamp = Date.now() + remainingSeconds * 1000;
    isRunning = true;
    isPaused = false;
    intervalId = setInterval(tick, 1000);
    setSelectsEnabled(false);
    setMsg("Countdown advancing.");
    updateReadout();
    updateControls();
    return;
  }

  if (appliedSeconds <= 0) {
    setMsg("Commit a duration before activating.", true);
    return;
  }

  if (
    !window.confirm(
      `Activate countdown for ${appliedSeconds} seconds?\n\n(${formatClock(appliedSeconds)})`
    )
  ) {
    return;
  }

  remainingSeconds = appliedSeconds;
  endTimestamp = Date.now() + remainingSeconds * 1000;
  isRunning = true;
  isPaused = false;
  isFinished = false;
  intervalId = setInterval(tick, 1000);
  setSelectsEnabled(false);
  setMsg("Countdown advancing.");
  updateReadout();
  updateControls();
}

function cease() {
  if (!isRunning) return;
  if (!window.confirm("Cease temporal advance?\n\nThe countdown will pause.")) return;

  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  isPaused = true;
  remainingSeconds = Math.max(0, Math.round((endTimestamp - Date.now()) / 1000));
  endTimestamp = null;
  setSelectsEnabled(false);
  setMsg("Paused. Acknowledgment required to resume.");
  confirmCheck.checked = false;
  updateReadout();
  updateControls();
}

function restore() {
  if (isRunning) return;
  if (!window.confirm("Restore factory timer defaults?\n\nThis clears your committed duration.")) {
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  isPaused = false;
  isFinished = false;
  endTimestamp = null;
  appliedSeconds = 0;
  remainingSeconds = 0;

  hoursSelect.value = "0";
  minutesSelect.value = "5";
  secondsSelect.value = "0";
  confirmCheck.checked = false;

  setSelectsEnabled(true);
  setMsg("");
  updateReadout();
  updateControls();
}

function preset(seconds) {
  if (isRunning || isPaused || isFinished) return;
  if (!window.confirm(`Load preset of ${seconds} seconds? You must still commit and activate.`)) {
    return;
  }

  hoursSelect.value = String(Math.floor(seconds / 3600));
  minutesSelect.value = String(Math.floor((seconds % 3600) / 60));
  secondsSelect.value = String(seconds % 60);
  appliedSeconds = 0;
  confirmCheck.checked = false;
  setMsg("Preset loaded into selectors. Press Commit duration to device.");
  updateReadout();
  updateControls();
}

populateSelect(hoursSelect, 23);
populateSelect(minutesSelect, 59);
populateSelect(secondsSelect, 59);
minutesSelect.value = "5";

applyBtn.addEventListener("click", applyDuration);
proceedBtn.addEventListener("click", activate);
ceaseBtn.addEventListener("click", cease);
restoreBtn.addEventListener("click", restore);
confirmCheck.addEventListener("change", updateControls);

document.querySelectorAll("[data-preset]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    preset(parseInt(link.dataset.preset, 10));
  });
});

updateReadout();
updateControls();
