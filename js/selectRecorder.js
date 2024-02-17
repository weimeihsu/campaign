
function getStorageId() {
  const key = 'storage';
  let array = JSON.parse(localStorage.getItem(key));
  if (!array) {
    array = []
  }
  return array;
}

function getUnSelectArray() {
  const onSelectStorage = createData.data.map(o => o.storageId);
  let array = getStorageId();
  array = array.filter(o => onSelectStorage.indexOf(o.storageId) === -1);
  return array;
}

function selectStorage(storyIndex, storageIndex) {
  const array = getUnSelectArray();
  createData.data[storyIndex].storageId = array[storageIndex].storageId;
  createData.data[storyIndex].duration = array[storageIndex].duration;
  var audio = $(".recPlay-" + storyIndex)[0];
  audio.controls = true;
  audio.src = API_URL + '/api/v1/story/' + array[storageIndex].storageId + '/audio';
  audio.load();
  $('#selectRecorder').modal('toggle');
}

function renderStorageIdList(storyIndex) {
  $( "#storage-list" ).empty();
  let array = getUnSelectArray();
  array.forEach((element, index) => {
    $('#storage-list').append(
      '<li class="list-group-item" onClick="selectStorage('+ storyIndex +','+ index + ')">' +
      element.name +
      '</li>'
    );
  });
}

function openSelectModal(index) {
  gtag('event', 'select-record-'+index, {
    'event_category': 'SelectRecord',
  });
  renderStorageIdList(index);
  // selectStorage(0,0);s
  $('#selectRecorder').modal()
}

(function() {
  $('.selectRecorderBtn').click(function() {
    const index = parseInt($(this).data('index'), 10);
    openSelectModal(index);
  })
})()