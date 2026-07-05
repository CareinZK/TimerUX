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
let msgKey = "";
let msgIsError = false;

function t(key, params) {
  return window.i18n ? window.i18n.t(key, params) : key;
}

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
  return t("bad.clockFormat", { h: pad2(h), m: pad2(m), s: pad2(s) });
}

function setMsg(key, isError = false) {
  msgKey = key;
  msgIsError = isError;
  msgEl.textContent = key ? t(key) : "";
  msgEl.className = "bad-msg" + (isError ? " is-error" : "");
}

function setSelectsEnabled(enabled) {
  [hoursSelect, minutesSelect, secondsSelect, applyBtn].forEach((el) => {
    el.disabled = !enabled;
  });
}

function updateReadout() {
  if (isFinished) {
    readout.innerHTML = t("bad.readoutExpired");
    return;
  }

  if (isRunning) {
    readout.innerHTML =
      `<strong>${remainingSeconds}</strong> ${t("bad.readoutRunningSeconds")}<br>` +
      `${t("bad.readoutRunningApprox")} ${formatClock(remainingSeconds)}<br>` +
      t("bad.readoutRunningNote");
    return;
  }

  if (isPaused) {
    readout.innerHTML =
      `<strong>${t("bad.readoutPaused")}</strong><br>${remainingSeconds} ${t("bad.readoutPausedHold")}<br>` +
      formatClock(remainingSeconds);
    return;
  }

  if (appliedSeconds > 0) {
    readout.innerHTML =
      `${t("bad.readoutPending")} <strong>${appliedSeconds}</strong> ${t("bad.readoutPendingTotal")}<br>` +
      formatClock(appliedSeconds) +
      `<br>${t("bad.readoutPendingHint")}`;
  } else {
    readout.innerHTML = t("bad.readoutNotApplied");
  }
}

function updateControls() {
  ceaseBtn.disabled = !isRunning;
  restoreBtn.disabled = isRunning;

  if (isFinished) {
    proceedBtn.disabled = true;
    proceedBtn.textContent = t("bad.proceedBtnExpired");
    return;
  }

  if (isRunning) {
    proceedBtn.disabled = true;
    proceedBtn.textContent = t("bad.proceedBtnRunning");
    return;
  }

  if (isPaused) {
    proceedBtn.disabled = !confirmCheck.checked;
    proceedBtn.textContent = t("bad.proceedBtnPaused");
    return;
  }

  proceedBtn.disabled = !(appliedSeconds > 0 && confirmCheck.checked);
  proceedBtn.textContent = t("bad.proceedBtn");
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
  alert(t("bad.alertFinished"));
}

function applyDuration() {
  if (isRunning || isPaused) return;

  const seconds = readSelects();
  if (seconds <= 0) {
    setMsg("bad.msgDurationZero", true);
    appliedSeconds = 0;
    updateReadout();
    updateControls();
    return;
  }

  if (!window.confirm(t("bad.confirmApply"))) {
    return;
  }

  appliedSeconds = seconds;
  remainingSeconds = seconds;
  confirmCheck.checked = false;
  setMsg("bad.msgApplied");
  updateReadout();
  updateControls();
}

function activate() {
  if (isRunning) return;

  if (!confirmCheck.checked) {
    setMsg("bad.msgConfirmRequired", true);
    return;
  }

  if (isPaused) {
    if (!window.confirm(t("bad.confirmResume"))) return;
    endTimestamp = Date.now() + remainingSeconds * 1000;
    isRunning = true;
    isPaused = false;
    intervalId = setInterval(tick, 1000);
    setSelectsEnabled(false);
    setMsg("bad.msgCountdownRunning");
    updateReadout();
    updateControls();
    return;
  }

  if (appliedSeconds <= 0) {
    setMsg("bad.msgApplyFirst", true);
    return;
  }

  if (
    !window.confirm(
      t("bad.confirmStart", {
        seconds: appliedSeconds,
        clock: formatClock(appliedSeconds),
      })
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
  setMsg("bad.msgCountdownRunning");
  updateReadout();
  updateControls();
}

function cease() {
  if (!isRunning) return;
  if (!window.confirm(t("bad.confirmCease"))) return;

  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  isPaused = true;
  remainingSeconds = Math.max(0, Math.round((endTimestamp - Date.now()) / 1000));
  endTimestamp = null;
  setSelectsEnabled(false);
  setMsg("bad.msgPaused");
  confirmCheck.checked = false;
  updateReadout();
  updateControls();
}

function restore() {
  if (isRunning) return;
  if (!window.confirm(t("bad.confirmRestore"))) {
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
  if (!window.confirm(t("bad.confirmPreset", { seconds }))) {
    return;
  }

  hoursSelect.value = String(Math.floor(seconds / 3600));
  minutesSelect.value = String(Math.floor((seconds % 3600) / 60));
  secondsSelect.value = String(seconds % 60);
  appliedSeconds = 0;
  confirmCheck.checked = false;
  setMsg("bad.msgPresetLoaded");
  updateReadout();
  updateControls();
}

populateSelect(hoursSelect, 99);
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

document.addEventListener("languagechange", () => {
  if (msgKey) {
    setMsg(msgKey, msgIsError);
  }
  updateReadout();
  updateControls();
});

updateReadout();
updateControls();
