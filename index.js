var PARAMS = [];
var DATA = [];
var MAX_Q, MAX_P = null;
var SA, A, D, SD = null;

function init() {
  MAX_Q = parseInt($("#setup-questions").val());
  MAX_P = parseInt($("#setup-papers").val());
  if(isNaN(MAX_Q) || isNaN(MAX_P)) return alert("Fill out mo yung form te");
  if(MAX_Q <= 0 || MAX_P <= 0) return alert("Ayusin mo te");
  if($("#legend-1")[0].checked) {
    SA = 1;
    A = 2;
    D = 3;
    SD = 4;
  } else {
    SA = 4;
    A = 3;
    D = 2;
    SD = 1;
  }
  navigatePage("editor");
  $("#editor-question").text(`Question 1 out of ${MAX_Q}`);
  $("#editor-paper").text(`Paper #1 (${MAX_P - DATA.length} papers left)`);
}

function navigatePage(page) {
  $("[data-page]").hide();
  $(`[data-page="${page}"]`).show();
}

function nextData() {
  DATA.push(PARAMS);
  if(DATA.length == MAX_P) {
    return exportAll();
  }
  $("#editor-question").text(`Question 1 out of ${MAX_Q}`);
  $("#editor-paper").text(`Paper #${DATA.length + 1} (${MAX_P - DATA.length} papers left)`);
  PARAMS = [];
}

function setParam(data) {
  PARAMS.push(data);
  $("#editor-question").text(`Question ${PARAMS.length + 1} out of ${MAX_Q}`);
  if(PARAMS.length == MAX_Q) {
    nextData();
  }
}

function resetParams() {
  if(confirm("This will restart all the tallied questions for this current paper. Sure ka te?") != true) return;
  PARAMS = [];
  $("#editor-question").text(`Question 1 out of ${MAX_Q}`);
}

function exportAll() {
  navigatePage("complete");
  saveFile(`${MAX_Q}-questions-tally.csv`, csv());
  DATA = [];
  PARAMS = [];
  $("#editor-question").text(`Question 1 out of ${MAX_Q}`);
  $("#editor-paper").text(`Paper #1 (${MAX_P - DATA.length} papers left)`);
}

function csv() {
  let out = "Respondents";
  for(let i = 0; i < MAX_Q; i++) {
    out += `,Q${i + 1}`;
  }
  for(let i = 0; i < DATA.length; i++) {
    out += `\nRespondent #${i + 1},${DATA[i].join(",")}`;
  }
  out += "\nLegend";
  out += `\n${SA} - Strongly Agree`;
  out += `\n${A} - Agree`;
  out += `\n${D} - Disagree`;
  out += `\n${SD} - Strongly Disagree`;
  return out;
}

function saveFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain" });
 const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}