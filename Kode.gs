function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === 'getUsers') return getUsers();
    if (action === 'getRequests') return getRequests();
    return JSON_RESPONSE({error: "Aksi tidak ditemukan"});
  } catch (err) {
    return JSON_RESPONSE({error: err.toString()});
  }
}

function getUsers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Users');
  if (!sheet) return JSON_RESPONSE({users: []});
  var data = sheet.getDataRange().getValues();
  var users = [];
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    var user = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j].toString().toLowerCase().replace(/ /g, "");
      user[key] = data[i][j];
    }
    users.push(user);
  }
  return JSON_RESPONSE({users: users});
}

// Mapping dari Header di Sheet ke Key di Aplikasi
var HEADER_MAP = {
  'ID Pengajuan': 'id',
  'Tanggal': 'dateSubmitted',
  'Nama Instruktur': 'instructorName',
  'Proglat': 'proglat',
  'Program Pelatihan': 'trainingTitle',
  'Jenis Pelatihan': 'trainingType',
  'Kejuruan': 'vocation',
  'Status': 'status',
  'Catatan': 'notes',
  'Catatan Penyelenggara': 'organizerComment',
  'Catatan TU': 'tuComment',
  'Catatan PPK': 'ppkComment',
  'Lampiran': 'attachmentData',
  'Data Lampiran': 'attachmentData',
  'TTE': 'signedDocumentData',
  'Data TTE': 'signedDocumentData',
  'History': 'history'
};

function getRequests() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Requests');
  if (!sheet) return JSON_RESPONSE({requests: []});
  var data = sheet.getDataRange().getValues();
  var requests = [];
  var headers = data[0];
  
  for (var i = 1; i < data.length; i++) {
    var req = {};
    for (var j = 0; j < headers.length; j++) {
      var headerName = headers[j];
      // Prioritaskan mapping eksplisit
      var key = HEADER_MAP[headerName] || headerName.toLowerCase().replace(/ /g, "");
      var val = data[i][j];
      
      if (key === 'history' && typeof val === 'string' && val.startsWith('[')) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      req[key] = val;
    }
    requests.push(req);
  }
  return JSON_RESPONSE({requests: requests});
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Requests');
  // Header standar yang diinginkan aplikasi
  var standardHeaders = [
    'ID Pengajuan', 
    'Tanggal', 
    'Nama Instruktur', 
    'Proglat', 
    'Program Pelatihan', 
    'Jenis Pelatihan', 
    'Kejuruan', 
    'Status', 
    'Catatan', 
    'Catatan Penyelenggara', 
    'Catatan TU', 
    'Catatan PPK', 
    'Data Lampiran', 
    'Data TTE', 
    'History'
  ];

  if (!sheet) {
    sheet = ss.insertSheet('Requests');
    sheet.appendRow(standardHeaders);
  }

  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action; 
    var req = body.request;
    
    // Ambil header saat ini dari sheet
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    function getCol(name) {
      // Cari index berdasarkan nama header langsung
      var idx = currentHeaders.indexOf(name);
      if (idx !== -1) return idx + 1;
      
      // Jika tidak ketemu, cari berdasarkan mapping terbalik
      for (var h in HEADER_MAP) {
        if (HEADER_MAP[h] === name) {
          var foundIdx = currentHeaders.indexOf(h);
          if (foundIdx !== -1) return foundIdx + 1;
        }
      }
      return -1;
    }

    if (action === 'ADD') {
      var fileUrl = req.attachmentData || "";
      if (typeof fileUrl === 'string' && fileUrl.includes("base64")) {
        fileUrl = uploadToDrive(fileUrl, req.attachmentName, "17KiAjemSf_1Waau6TWTHnb81KMpq_tal");
      }
      
      var rowData = new Array(currentHeaders.length).fill("");
      var mapping = {
        'id': req.id,
        'dateSubmitted': req.dateSubmitted,
        'instructorName': req.instructorName,
        'proglat': req.proglat,
        'trainingTitle': req.trainingTitle,
        'trainingType': req.trainingType,
        'vocation': req.vocation,
        'status': req.status,
        'notes': req.notes || "",
        'attachmentData': fileUrl,
        'history': JSON.stringify(req.history || [])
      };

      for (var j = 0; j < currentHeaders.length; j++) {
        var h = currentHeaders[j];
        var key = HEADER_MAP[h] || h.toLowerCase().replace(/ /g, "");
        if (mapping[key] !== undefined) {
          rowData[j] = mapping[key];
        }
      }
      
      sheet.appendRow(rowData);
      return JSON_RESPONSE({result: "success"});
    } 
    
    if (action === 'UPDATE') {
      var data = sheet.getDataRange().getValues();
      var found = false;
      var idCol = getCol('id');
      var idColIdx = idCol !== -1 ? idCol - 1 : 0;

      for (var i = 1; i < data.length; i++) {
        if (data[i][idColIdx].toString() === req.id.toString()) {
          var row = i + 1;
          
          var statusCol = getCol('status');
          if (statusCol !== -1) sheet.getRange(row, statusCol).setValue(req.status);
          
          var orgCol = getCol('organizerComment');
          if (orgCol !== -1) sheet.getRange(row, orgCol).setValue(req.organizerComment || "");
          
          var tuCol = getCol('tuComment');
          if (tuCol !== -1) sheet.getRange(row, tuCol).setValue(req.tuComment || "");
          
          var ppkCol = getCol('ppkComment');
          if (ppkCol !== -1) sheet.getRange(row, ppkCol).setValue(req.ppkComment || "");
          
          if (req.signedDocumentData && req.signedDocumentData.includes("base64")) {
             var tteUrl = uploadToDrive(req.signedDocumentData, req.signedDocumentName, "17KiAjemSf_1Waau6TWTHnb81KMpq_tal");
             var tteCol = getCol('signedDocumentData');
             if (tteCol !== -1) sheet.getRange(row, tteCol).setValue(tteUrl);
          }
          
          var histCol = getCol('history');
          if (histCol !== -1) sheet.getRange(row, histCol).setValue(JSON.stringify(req.history || []));
          
          found = true;
          break;
        }
      }
      if (found) {
        return JSON_RESPONSE({result: "success"});
      } else {
        return JSON_RESPONSE({result: "error", error: "ID Pengajuan tidak ditemukan."});
      }
    }
  } catch (error) { return JSON_RESPONSE({result: "error", error: error.toString()}); }
}

function uploadToDrive(base64Data, fileName, folderId) {
  try {
    var folder = DriveApp.getFolderById(folderId);
    var parts = base64Data.split(",");
    var contentType = parts[0].split(":")[1].split(";")[0];
    var decoded = Utilities.base64Decode(parts[1]);
    var file = folder.createFile(Utilities.newBlob(decoded, contentType, fileName || "file.pdf"));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) { return "Error"; }
}

function JSON_RESPONSE(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
