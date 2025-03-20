var WORKSPACE_LABELS = [];
var DATABASE = null;
var WORKSPACES = [];
var CURRENT_WS = null;
var DATA = [];
var PARAMS = [];
var MAX_P = null;
var MAX_Q = null;
var SA, A, D, SD = null;
var EXPORTS = [];

function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function getWorkspaceIndex(id) {
  let n = 0;
  WORKSPACES.find(y => {
    if(y.id == id) return true;
    n += 1;
  });
  return n;
}

function getWorkspace(id) {
  return WORKSPACES.find(y => y.id == id);
}

function goto(page) {
  $("[data-page]").hide();
  $(`[data-page="${page}"]`).show();
}

var TOAST_TIMEOUT = null;
function toast(text) {
  function displayToast() {
    $("#toast-container").text(text);
    $("#toast-container").fadeIn(200);
    TOAST_TIMEOUT = setTimeout(() => {
      $("#toast-container").fadeOut(200);
      TOAST_TIMEOUT = null;
    }, 5200);
  }
  if(TOAST_TIMEOUT) {
    $("#toast-container").fadeOut(200);
    clearTimeout(TOAST_TIMEOUT);
    TOAST_TIMEOUT = null;
    setTimeout(displayToast, 300);
  } else displayToast();
}

function updateWorkInfo() {
  const left = (MAX_P - DATA.length) - 1;
  $("#workspace-paper").text(`Paper #${DATA.length + 1} (${left == 0 ? "no" : left} paper${left > 1 ? "s" : ""} left)`);
  $("#workspace-questions").text(`Question ${PARAMS.length + 1} out of ${MAX_Q}`);
  let pw = "";
  DATA.forEach((d, di) => {
    pw += `(Paper #${di + 1})\n`;
    pw += d.map((q, qi) => {
      let z = null;
      if(q == SA) z = "Strongly Agree";
      if(q == A) z = "Agree";
      if(q == D) z = "Disagree";
      if(q == SD) z = "Strongly Disagree";
      return `Question ${qi + 1}. ${z}`;
    }).join("\n");
    pw += "\n\n";
  });
  $("#workspace-preview-data").val(pw);
}

function nextPaper() {
  DATA.push(PARAMS);
  if(DATA.length >= MAX_P) {
    exportWorkspace();
  }
  PARAMS = [];
  updateWorkInfo();
  saveWorkspace();
}

function pushParam(val) {
  PARAMS.push(val);
  updateWorkInfo();
  if(PARAMS.length >= MAX_Q) {
    nextPaper();
  }
  saveWorkspace();
}

async function saveWorkspace() {
  const i = getWorkspaceIndex(CURRENT_WS);
  WORKSPACES[i].saved.params = PARAMS;
  WORKSPACES[i].saved.data = DATA;
  await DATABASE.set("workspaces", WORKSPACES);
}

function exportWorkspace() {
  const ws = getWorkspace(CURRENT_WS);
  const val = csv();
  let export_doc = "";
  EXPORTS.forEach(y => {
    export_doc += `<tr>${y.map(x => {
      return `<th class="fw-normal">${x}</th>`;
    })}</tr>`;
  });;
  $("#export-output").html(export_doc);
  const f = createFile(val);
  $("#export-download").attr("href", f).attr("download", `${ws.id}-${ws.label}.csv`)[0].click();
  DATA = [];
  goto("export");
  toast("Exporting file...");
}

function createFile(text) {
  const blob = new Blob([text], { type: "text/plain" });
  return URL.createObjectURL(blob);
}

function total(data) {
  return data.reduce((a, b) => a + b);
}

function avg(data) {
  return (total(data) / MAX_Q).toFixed(2);
}

function csv() {
  EXPORTS = [];
  let out = "RESPONDENTS";
  for(let i = 0; i < MAX_Q; i++) {
    out += `,Q${i + 1}`;
  }
  out += ",TOTAL,AVERAGE";
  for(let i = 0; i < DATA.length; i++) {
    const t = total(DATA[i]);
    const a = avg(DATA[i]);
    EXPORTS.push([`Respondent #${i + 1}`, t, a]);
    out += `\nRespondent #${i + 1},${DATA[i].join(",")},${t},${a}`;
  }
  out += "\nLegend";
  out += `\n${SA} - Strongly Agree`;
  out += `\n${A} - Agree`;
  out += `\n${D} - Disagree`;
  out += `\n${SD} - Strongly Disagree`;
  return out;
}

async function createWorkspace() {
  let label = $("#setup-label").val().trim();
  const questions = parseInt($("#setup-questions").val());
  const papers = parseInt($("#setup-papers").val());
  const sa = parseInt($("#setup-legend-sa").val());
  const a = parseInt($("#setup-legend-a").val());
  const d = parseInt($("#setup-legend-d").val());
  const sd = parseInt($("#setup-legend-sd").val());
  if(isNaN(questions) || isNaN(papers) || questions <= 0 || papers <= 0) return toast("Invalid or incomplete inputs.");
  if(isNaN(sa) || sa <= 0 || sa >= 5 ||
     isNaN(a) || a <= 0 || a >= 5 ||
     isNaN(d) || d <= 0 || d >= 5 ||
     isNaN(sd) || sd <= 0 || sd >= 5) {
    return toast("Invalid or incomplete legend. You can only use 1-4 numeric scale.");
  }
  const id = crypto.randomUUID();
  if(label.length == 0) {
    label = WORKSPACE_LABELS[random(0, WORKSPACE_LABELS.length - 1)];
  }
  WORKSPACES.push({
    id, label, sa, a, d, sd, papers, questions,
    saved: {
      params: [],
      data: []
    }
  });
  await DATABASE.set("workspaces", WORKSPACES);
  openWorkspace(id);
}

function openWorkspace(id) {
  CURRENT_WS = id;
  const ws = getWorkspace(id);
  MAX_P = ws.papers;
  MAX_Q = ws.questions;
  DATA = ws.saved.data;
  PARAMS = ws.saved.params;
  SA = ws.sa;
  A = ws.a;
  D = ws.d;
  SD = ws.sd;
  updateWorkInfo();
  if(DATA.length != 0 || PARAMS.length != 0) toast("Your progress has been restored");
  $("#workspace-label").text(ws.label);
  goto("workspace");
}

function forceExport() {
  if(DATA.length == 0) return toast("You need to complete at least one paper to export.");
  exportWorkspace();
  toast("Exporting file...");
}

function restartParam() {
  if(confirm("This will restart all the tallied questions for this current paper. Are you sure?") != true) return;
  PARAMS = [];
  updateWorkInfo();
  saveWorkspace();
}

function restartAll() {
  if(confirm("This will restart all the tallied questions. Are you sure?") != true) return;
  PARAMS = [];
  DATA = [];
  updateWorkInfo();
  saveWorkspace();
}

function undo() {
  if(DATA.length == 0 && PARAMS.length == 0) return toast("No data to undo");
  if(PARAMS.length == 0) {
    const z = DATA.pop();
    PARAMS = z;
  } else {
    PARAMS.pop();
  }
  updateWorkInfo();
  saveWorkspace();
  toast("Data reverted successfully");
}

$(document).ready(async () => {
  DATABASE = await Indexed.open("tally-kineme-v1");
  WORKSPACES = await DATABASE.get("workspaces", []);
  $("#main-empty-label").toggle(WORKSPACES.length == 0);
  let ws_doc = "";
  WORKSPACES.forEach(ws => {
    ws_doc += `<li class="list-group-item d-flex justify-content-end align-items-center gap-2 p-3"><p class="m-0 fw-bold flex-grow-1">${ws.label}</p><p class="m-0 me-2">P${ws.papers}&nbsp;:&nbsp;Q${ws.questions}</p><button class="btn btn-primary" onclick="openWorkspace('${ws.id}')">View</button></li>`;
  });
  $("#workspace-list").html(ws_doc);
  [...$("[data-navigate]")].forEach(y => {
    $(y).on("click", evt => {
      goto($(evt.target).attr("data-navigate"));
    });
  });
  fetch("lib/workspace-labels.json").then(async x => {
    WORKSPACE_LABELS = await x.json();
  });
});