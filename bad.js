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
  return `${pad2(h)} ч. ${pad2(m)} мин. ${pad2(s)} сек.`;
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
      "<strong>СТАТУС: ИСТЕКЛО</strong><br>Обратный отсчёт достиг нуля. Закройте системное уведомление, затем нажмите «Восстановить по умолчанию».";
    return;
  }

  if (isRunning) {
    readout.innerHTML =
      `<strong>${remainingSeconds}</strong> (секунд)<br>` +
      `Приблизительная расшифровка: ${formatClock(remainingSeconds)}<br>` +
      "Примечание: значение обновляется раз в секунду.";
    return;
  }

  if (isPaused) {
    readout.innerHTML =
      `<strong>ПАУЗА</strong><br>${remainingSeconds} секунд на удержании.<br>` +
      `${formatClock(remainingSeconds)}`;
    return;
  }

  if (appliedSeconds > 0) {
    readout.innerHTML =
      `Ожидающая длительность (зафиксирована): <strong>${appliedSeconds}</strong> секунд всего.<br>` +
      formatClock(appliedSeconds) +
      "<br>Отметьте поле ниже, затем запустите.";
  } else {
    readout.innerHTML =
      "Длительность не зафиксирована. Настройте списки, затем нажмите «Зафиксировать длительность на устройстве».";
  }
}

function updateControls() {
  ceaseBtn.disabled = !isRunning;
  restoreBtn.disabled = isRunning;

  if (isFinished) {
    proceedBtn.disabled = true;
    proceedBtn.textContent = "Запустить обратный отсчёт (истекло)";
    return;
  }

  if (isRunning) {
    proceedBtn.disabled = true;
    proceedBtn.textContent = "Запустить обратный отсчёт (недоступно во время работы)";
    return;
  }

  if (isPaused) {
    proceedBtn.disabled = !confirmCheck.checked;
    proceedBtn.textContent = "Запустить обратный отсчёт (продолжить — нужно подтверждение)";
    return;
  }

  proceedBtn.disabled = !(appliedSeconds > 0 && confirmCheck.checked);
  proceedBtn.textContent = "Запустить обратный отсчёт";
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
  alert("Таймер завершён.\n\nОбратный отсчёт окончен. Нажмите ОК, чтобы продолжить.");
}

function applyDuration() {
  if (isRunning || isPaused) return;

  const seconds = readSelects();
  if (seconds <= 0) {
    setMsg("Длительность должна быть больше нуля. Настройте списки и зафиксируйте снова.", true);
    appliedSeconds = 0;
    updateReadout();
    updateControls();
    return;
  }

  if (!window.confirm("Зафиксировать эту длительность?\n\nЗапуск обратного отсчёта всё равно потребуется отдельно.")) {
    return;
  }

  appliedSeconds = seconds;
  remainingSeconds = seconds;
  confirmCheck.checked = false;
  setMsg("Длительность зафиксирована. Отметьте поле подтверждения, затем запустите.");
  updateReadout();
  updateControls();
}

function activate() {
  if (isRunning) return;

  if (!confirmCheck.checked) {
    setMsg("Перед запуском необходимо отметить поле подтверждения.", true);
    return;
  }

  if (isPaused) {
    if (!window.confirm("Продолжить обратный отсчёт с приостановленного значения?")) return;
    endTimestamp = Date.now() + remainingSeconds * 1000;
    isRunning = true;
    isPaused = false;
    intervalId = setInterval(tick, 1000);
    setSelectsEnabled(false);
    setMsg("Обратный отсчёт продолжается.");
    updateReadout();
    updateControls();
    return;
  }

  if (appliedSeconds <= 0) {
    setMsg("Сначала зафиксируйте длительность.", true);
    return;
  }

  if (
    !window.confirm(
      `Запустить обратный отсчёт на ${appliedSeconds} секунд?\n\n(${formatClock(appliedSeconds)})`
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
  setMsg("Обратный отсчёт продолжается.");
  updateReadout();
  updateControls();
}

function cease() {
  if (!isRunning) return;
  if (!window.confirm("Остановить течение времени?\n\nОбратный отсчёт будет приостановлен.")) return;

  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  isPaused = true;
  remainingSeconds = Math.max(0, Math.round((endTimestamp - Date.now()) / 1000));
  endTimestamp = null;
  setSelectsEnabled(false);
  setMsg("Пауза. Для продолжения нужно подтверждение.");
  confirmCheck.checked = false;
  updateReadout();
  updateControls();
}

function restore() {
  if (isRunning) return;
  if (!window.confirm("Восстановить заводские настройки таймера?\n\nЗафиксированная длительность будет сброшена.")) {
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
  if (!window.confirm(`Загрузить пресет на ${seconds} секунд? Всё равно нужны фиксация и запуск.`)) {
    return;
  }

  hoursSelect.value = String(Math.floor(seconds / 3600));
  minutesSelect.value = String(Math.floor((seconds % 3600) / 60));
  secondsSelect.value = String(seconds % 60);
  appliedSeconds = 0;
  confirmCheck.checked = false;
  setMsg("Пресет загружен в списки. Нажмите «Зафиксировать длительность на устройстве».");
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
