const FORM_BASE_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd_D9OiuBJIqe91hYBAN4Puh1HszyLjn9KgA_7OHQ0wQsd9Cg/viewform?usp=pp_url&entry.1818261576=";
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz_qw40KJp1A68OLLDMPnebTcGIck-zvlRconsQrunedob26YE2kkW7DaRlD44dJ1yk7A/exec";
const SPREADSHEET_ID = "1TRUrNI6myVxLbiG4EvRcqpZnwdY4IA97HK7wLraHobA";function registerNewEquipment() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt("New Equipment Registration", "Enter equipment name:", ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const equipmentName = response.getResponseText();
  if (!equipmentName) return;

  const result = addNewEquipment(equipmentName);
  ui.alert("Registered: " + result.equipmentId);
}

function addNewEquipment(equipmentName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Equipment_Master");

  const values = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
  let maxId = 0;

  values.forEach(row => {
    if (row[0]) {
      const num = parseInt(String(row[0]).replace("EQ", ""));
      if (num > maxId) maxId = num;
    }
  });

  const equipmentId = "EQ" + String(maxId + 1).padStart(4, "0");
  const portalUrl = WEB_APP_URL + "?id=" + equipmentId;
  const qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(portalUrl);

  sheet.appendRow([
    equipmentId,
    equipmentName,
    portalUrl,
    new Date(),
    "Active",
    ""
  ]);

  const newRow = sheet.getLastRow();
  sheet.getRange(newRow, 6).setFormula('=IMAGE("' + qrImageUrl + '")');
  sheet.setRowHeight(newRow, 160);
  sheet.setColumnWidth(6, 160);

  return { equipmentId, equipmentName, portalUrl };
}

function doGet(e) {
  const id = e.parameter.id;

  if (id === "new") {
    return HtmlService.createHtmlOutput(`
    <html>
     <head>
  <link rel="apple-touch-icon"
        href="https://kiyomaw.github.io/equipment-master-icon/icon.png.png?v=2">
  <meta name="apple-mobile-web-app-title" content="New Equipment">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>

      <body style="
font-family:Arial;
padding:16px;
margin:0;
">
<div style="width:100%; max-width:420px; margin:0 auto;">
        <h2>New Equipment</h2>
        <label>Equipment Name</label><br>
        <input id="name" style="width:100%; box-sizing:border-box; padding:14px; font-size:18px; margin:10px 0;" required>
        <button onclick="register()" style="width:100%; box-sizing:border-box; padding:16px; font-size:18px; background:#673ab7; color:white; border:0; border-radius:8px;">
          Register
        </button>

        <script>
          function register() {
            const name = document.getElementById("name").value;
            if (!name) {
              alert("Enter equipment name");
              return;
            }
            window.top.location.href = "${WEB_APP_URL}?id=register&name=" + encodeURIComponent(name);
          }
        </script>
        </div>
      </body>
    </html>
  `);
}
if (id === "list") {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const master = ss.getSheetByName("Equipment_Master");
  const data = master.getDataRange().getValues();

  let items = [];

  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;

    items.push({
      id: data[i][0],
      name: data[i][1],
      url: data[i][2]
    });
  }

  items.reverse();

  return ContentService
    .createTextOutput("loadEquipmentList(" + JSON.stringify(items) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

if (id === "label") {

  const eq = e.parameter.eq;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const master = ss.getSheetByName("Equipment_Master");
  const data = master.getDataRange().getValues();

  let equipmentName = "";
  let portalUrl = "";

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === eq) {
      equipmentName = data[i][1];
      portalUrl = data[i][2];
      break;
    }
  }

  const qrImageUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" +
    encodeURIComponent(portalUrl);

  return HtmlService.createHtmlOutput(`
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>

  <body style="
    margin:0;
    padding:10px;
    text-align:center;
    font-family:Arial;
  ">

   <img src="${qrImageUrl}" style="width:180px;"><br>

    <div style="font-size:28px;font-weight:bold;">
      ${eq}
    </div>

    <div style="font-size:18px;">
      ${equipmentName}
    </div>

  </body>
  </html>
  `);
}
if (id === "print") {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const master = ss.getSheetByName("Equipment_Master");
  const data = master.getDataRange().getValues();

  let labelsHtml = "";

  for (let i = 1; i < data.length; i++) {
    const equipmentId = data[i][0];
    const equipmentName = data[i][1];
    const portalUrl = data[i][2];

    if (!equipmentId || !portalUrl) continue;

    const qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(portalUrl);

    labelsHtml += `
      <div class="label">
        <img src="${qrImageUrl}">
        <div class="id">${equipmentId}</div>
        <div class="name">${equipmentName}</div>
      </div>
    `;
  }


 
  return HtmlService.createHtmlOutput(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: Arial;
            padding: 20px;
          }

          .toolbar {
            margin-bottom: 20px;
          }

          button {
            padding: 12px 20px;
            font-size: 16px;
            background: #673ab7;
            color: white;
            border: 0;
            border-radius: 8px;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }

          .label {
            border: 1px solid #000;
            padding: 10px;
            text-align: center;
            page-break-inside: avoid;
          }

          .label img {
            width: 150px;
            height: 150px;
          }

          .id {
            font-size: 18px;
            font-weight: bold;
            margin-top: 5px;
          }

          .name {
            font-size: 14px;
          }

          @media print {
            .toolbar {
              display: none;
            }

            body {
              padding: 0;
            }

            .label {
              break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>
        <div class="toolbar">
          <button onclick="window.print()">Print QR Labels</button>
        </div>

        <div class="grid">
          ${labelsHtml}
        </div>
      </body>
    </html>
  `);
}


if (id === "register") {
  const equipmentName = e.parameter.name;
  const result = addNewEquipment(equipmentName);
  const maintenanceUrl = FORM_BASE_URL + result.equipmentId;
  const newEquipmentUrl = WEB_APP_URL + "?id=new";

const successUrl =
  "https://kiyomaw.github.io/equipment-master-icon/success.html" +
  "?eq=" + encodeURIComponent(result.equipmentId) +
  "&name=" + encodeURIComponent(result.equipmentName);

return HtmlService.createHtmlOutput(`
  <html>
    <head>
      <meta http-equiv="refresh" content="0; url=${successUrl}">
    </head>
    <body>
      <script>
        window.top.location.href = "${successUrl}";
      </script>

      <p>Redirecting...</p>
      <a href="${successUrl}">Open Success Page</a>
    </body>
  </html>
`);
}
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const master = ss.getSheetByName("Equipment_Master");
  const responses = ss.getSheetByName("Form_Responses");

  const masterData = master.getDataRange().getValues();
  let equipmentName = "";

  for (let i = 1; i < masterData.length; i++) {
    if (masterData[i][0] === id) {
      equipmentName = masterData[i][1];
      break;
    }
  }

  const formUrl = FORM_BASE_URL + id;
  const data = responses.getDataRange().getValues();
  let history = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === id) {
    history.push({
  date: Utilities.formatDate(
    new Date(data[i][0]),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd HH:mm"
  ),
  note: data[i][2] || "",
  photo: convertDriveUrlToImageUrl(data[i][3] || ""),
  photoLink: data[i][3] || ""
});
    }
  }

  history.reverse();

  let historyHtml = history.length === 0
  ? "<p>No history yet.</p>"
  : history.map(row => `
    <div style="border:1px solid #ddd; padding:10px; margin:10px 0; border-radius:8px;">
      <b>${row.date}</b><br>

     ${row.note ? "<b>Note:</b><br>" + row.note + "<br><br>" : ""}

${row.photo ?
`<a href="${row.photoLink}" target="_blank">
  <img src="${row.photo}" style="max-width:250px; border-radius:8px; margin-top:10px;">
</a>`
: ""}
    </div>
  `).join("");

  return HtmlService.createHtmlOutput(`
    <html>
    <head>
        <link rel="apple-touch-icon" href="https://kiyomaw.github.io/equipment-master-icon/icon.png.png?v=2">
        <meta name="apple-mobile-web-app-title" content="New Equipment">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>

      <body style="
font-family:Arial;
padding:16px;
margin:0;
">
<div style="width:100%; max-width:420px; margin:0 auto;">
        <h2>${id}</h2>
        <h3>${equipmentName}</h3>

       <a href="${formUrl}" target="_blank" style="display:block; background:#673ab7; color:white; padding:15px; text-align:center; text-decoration:none; border-radius:8px; margin:15px 0;">
  Add Maintenance Record
  
</a>
<a href="https://kiyomaw.github.io/equipment-master-icon/label.html?eq=${id}&name=${encodeURIComponent(equipmentName)}&url=${encodeURIComponent(WEB_APP_URL + '?id=' + id)}" target="_blank" style="
display:block;
background:#444;
color:white;
padding:15px;
text-align:center;
text-decoration:none;
border-radius:8px;
margin:15px 0;
">
Print QR Label
</a>

        <h3>過去履歴</h3>
        ${historyHtml}
        </div>
      </body>
    </html>
  `);
}
function convertDriveUrlToImageUrl(url) {
  if (!url) return "";

  const match = String(url).match(/[-\w]{25,}/);
  if (!match) return url;

  const fileId = match[0];
  return "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w800";
}
