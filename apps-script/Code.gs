const SHEET_ID = '1Sxl9t9KuYSM1vgkZwQLOZCIh1BAOq2F7QXNVpF-1DSA';

function doGet(e) {
  const p = e.parameter || {};
  try {
    if (p.action === 'poll') return json(getPoll_(p.id));
    if (p.action === 'results') return json(getResults_(p.id));
    return json({ error: 'Hành động không hợp lệ' });
  } catch (err) {
    return json({ error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'create') return json(createPoll_(body));
    if (body.action === 'vote') return json(vote_(body));
    return json({ error: 'Hành động không hợp lệ' });
  } catch (err) {
    return json({ error: String(err.message || err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name, headers) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
  }
  return sh;
}

const pollsSheet_ = () => sheet_('Polls', ['PollId', 'Tiêu đề', 'Ứng viên', 'Ngày tạo']);
const votesSheet_ = () => sheet_('Votes', ['Thời gian', 'PollId', 'Ứng viên', 'Người vote', 'VoterId']);

// Prevent spreadsheet formula injection from user input.
function safe_(v) {
  const s = String(v == null ? '' : v).trim().slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function createPoll_(body) {
  const adminKey = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!adminKey || body.adminKey !== adminKey) throw new Error('Sai mã admin');

  const title = safe_(body.title);
  const candidates = (body.candidates || []).map(safe_).filter(String);
  if (!title) throw new Error('Thiếu tiêu đề');
  if (candidates.length < 3 || candidates.length > 4) throw new Error('Cần 3 hoặc 4 ứng viên');
  if (new Set(candidates).size !== candidates.length) throw new Error('Tên ứng viên bị trùng');

  const id = Utilities.getUuid().replace(/-/g, '').slice(0, 10);
  pollsSheet_().appendRow([id, title, JSON.stringify(candidates), new Date()]);
  return { id: id };
}

function findPoll_(id) {
  const rows = pollsSheet_().getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) return { id: id, title: rows[i][1], candidates: JSON.parse(rows[i][2]) };
  }
  return null;
}

function getPoll_(id) {
  const poll = findPoll_(id);
  if (!poll) throw new Error('Không tìm thấy cuộc bình chọn');
  return poll;
}

function vote_(body) {
  const poll = getPoll_(body.pollId);
  if (poll.candidates.indexOf(body.candidate) === -1) throw new Error('Ứng viên không hợp lệ');
  const voterId = String(body.voterId || '').slice(0, 64);
  if (!voterId) throw new Error('Thiếu voterId');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = votesSheet_();
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === poll.id && rows[i][4] === voterId) throw new Error('Bạn đã bình chọn rồi');
    }
    sh.appendRow([new Date(), poll.id, body.candidate, safe_(body.voterName), voterId]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function getResults_(id) {
  const poll = getPoll_(id);
  const counts = {};
  poll.candidates.forEach(c => (counts[c] = 0));
  votesSheet_().getDataRange().getValues().slice(1).forEach(r => {
    if (r[1] === id && r[2] in counts) counts[r[2]]++;
  });
  return { id: id, title: poll.title, counts: counts };
}
