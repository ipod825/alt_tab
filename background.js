chrome.commands.onCommand.addListener(function (command) {
  if (command === "ALTTAB_ActivateLast") {
    ActivateLast(1);
  }
});

let _alttab_queue = {};
// 3 is minimum so that give history [1, 2, 3], closing 3 and entering 2, we
// still have 1 in the history.
let _alttab_queue_capacity = 3;
function getQueue(windowId) {
  if (!(windowId in _alttab_queue)) {
    _alttab_queue[windowId] = [];
  }
  return _alttab_queue[windowId];
}
function setQueue(windowId, q) {
  _alttab_queue[windowId] = q;
}

chrome.tabs.onActivated.addListener((activeIndo) => {
  let { tabId, windowId } = activeIndo;
  updateQueue(tabId, windowId);
});

async function updateQueue(tabId, windowId) {
  let q = getQueue(windowId);
  let newq = [];
  for (let i = 0; i < q.length; ++i) {
    if (q[i] == tabId) {
      continue;
    }
    try {
      await chrome.tabs.get(q[i]);
    } catch (error) {
      continue;
    }
    newq.push(q[i]);
    if (newq.length == _alttab_queue_capacity - 1) {
      break;
    }
  }
  newq.unshift(tabId);
  setQueue(windowId, newq);
}

async function ActivateLast() {
  let windowId = (await chrome.windows.getCurrent()).id;
  let q = await getQueue(windowId);
  let current = q[0];
  let last = q[1];
  if (last == null) {
    return;
  }
  q.shift();
  q.shift();
  q.unshift(current);
  await chrome.tabs.update(last, { active: true });
}
