// var timeLimit = 180 * 1000;
// var API_URL = 'http://18.138.42.246:5000';
// var API_URL = 'http://10.0.0.10:4000';
var API_URL = '';
var timeLimit = 5 * 1000;
var maxTime = 10 * 60 * 1000;
var rec = {};
var recResult = {};
var createData = {
  data: [{
    category: 0,
    emotion: 0,
    duration: 0,
    beforeScore: 5,
    afterScore: 5,
    filter: 0,
    storageId: '',
    tag: '',
  }, {
    category: 0,
    emotion: 0,
    duration: 0,
    beforeScore: 5,
    afterScore: 5,
    filter: 0,
    storageId: '',
    tag: '',
  }, {
    category: 0,
    emotion: 0,
    duration: 0,
    beforeScore: 5,
    afterScore: 5,
    filter: 0,
    storageId: '',
    tag: '',
  }, {
    category: 0,
    emotion: 0,
    duration: 0,
    beforeScore: 5,
    afterScore: 5,
    filter: 0,
    storageId: '',
    tag: '',
  }, {
    category: 0,
    emotion: 0,
    duration: 0,
    beforeScore: 5,
    afterScore: 5,
    filter: 0,
    storageId: '',
    tag: '',
  }],
  deviceToken: getDeviceToken(),
  agreePrivacyPolicyAt: new Date(),
  name: '',
  email: '',
  phone: '',
  address: '',
};

function reclog(s) {
  // console.log('Log: -------------------');
  // console.log('Log: reclog -> s', s);
  // console.log('Log: -------------------');
  // $(".reclog").prepend('<div>['+new Date().toLocaleTimeString()+']'+s+'</div>');
};

function recopen(key, cb) {
  checkBrowser();
  var type = 'mp3'; // 類型
  var bit = 32; // 比特律
  var sample = 24000; // 採樣率
  recResult[key] = {};
  rec[key] = Recorder({
    type: type,
    bitRate: bit,
    sampleRate: sample,
    onProcess: function (buffers, level, time, sampleRate) {
      createData.data[parseInt(key, 10)].duration = time;
      recResult[key].time = time;
      if (time > maxTime) {
        stopButtonOnClick(key);
      }
      var timeSec = time / 1000;
      var leftPaf = function (str) {
        var pad = "00"
        var result = pad.substring(0, pad.length - str.length) + str;
        return result;
      }
      var sec = leftPaf(Math.floor(timeSec % 60) + '');
      var min = leftPaf(Math.floor(timeSec / 60) + '');
      $('#record-time-' + key).text(' ' + min + ':' + sec)
    }
  });
  rec[key].open(function () {
    reclog("已打开:" + type + " " + bit + "kbps");
    cb();
  }, function (e, isUserNotAllow) {
    if (isUserNotAllow) {
      Swal.fire(
        '錯誤',
        '請允許錄音權限',
        'error'
      );
    }
    reclog((isUserNotAllow ? "UserNotAllow，" : "") + "打开失败：" + e);
  });
};

function recclose(key) {
  if (rec) {
    rec[key].close(function () {
      reclog("已关闭");
    });
  }
};

function recstart(key) {
  checkCampaignStatus();
  if (rec) {
    recopen(key, function () {
      gtag('event', 'start-'+key, {
        'event_category': 'Record',
      });
      rec[key].start();
      $('#record-start-' + key).toggle();
      $('#record-stop-' + key).toggle();
      reclog("录制中...");
    })
  };
};

function recpause(key) {
  if (rec) {
    rec[key].pause();
    reclog("已暂停");
  };
};

function recresume(key) {
  if (rec) {
    rec[key].resume();
    reclog("继续录音中...");
  };
};
var recblob = {};
var RandomId = 0;

function RandomKey() {
  return "randomkey" + (RandomId++);
};

function stopButtonOnClick(key) {
  var time = recResult[key].time;
  if (time < timeLimit) {
    recpause(key);
    Swal.fire({
      title: '警告',
      text: '時間需在 3 分鐘以上',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: '繼續',
      cancelButtonText: '停止'
    }).then((result) => {
      if (result.value) {
        // confirm
        recresume(key)
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // cancel
        $('#record-start-' + key).toggle();
        $('#record-stop-' + key).toggle();
        recclose(key)
      }
    })
  } else {
    recstop(key)
  }
}

function recstop(key) {
  if (rec) {
    $('#loading-back').show();
    reclog("正在编码" + rec[key].set.type + "...");
    var t1 = Date.now();
    rec[key].stop(function (blob, time) {
      // Swal.fire(
      //   '錄製完成',
      //   '',
      //   'success'
      // );
      var id = RandomKey(16);
      recblob[id] = {
        blob: blob,
        set: $.extend({}, rec[key].set),
        time: time
      };
      reclog("已录制:" + intp(rec[key].set.bitRate, 3) + "kbps " + intp(rec[key].set.sampleRate, 5) + "hz 花" + intp(Date.now() - t1, 4) + "ms编码" + intp(blob.size, 6) + "b [" + rec[key].set.type + "]" + intp(time, 6) + 'ms <button onclick="recdown(\'' + id + '\')">下载</button> <button onclick="recplay(\'' + id + '\')">播放</button> <span class="p' + id + '"></span> <span class="d' + id + '"></span>');
      recplay(id, key);
      recdown(id);
      recclose(key)
      $('#record-start-' + key).toggle();
      $('#record-stop-' + key).toggle();
      console.log('Log: ------------------------');
      console.log('Log: recstop -> rec', rec);
      console.log('Log: ------------------------');
    }, function (s) {
      Swal.fire(
        '失敗',
        '尚未開始錄音',
        'error'
      );
      reclog("失败：" + s);
    });
  };
};

var intp = function (s, len) {
  s = s == null ? "-" : s + "";
  if (s.length >= len) return s;
  return ("_______" + s).substr(-len);
};

function recplay(id, key) {
  console.log('Log: ------------------------');
  console.log('Log: recplay -> id', id);
  console.log('Log: ------------------------');
  var o = recblob[id];
  if (o) {
    var audio = $(".recPlay-" + key)[0];
    audio.controls = true;
    if (!(audio.ended || audio.paused)) {
      audio.pause();
    };
    o.play = (o.play || 0) + 1;
    var logmsg = function (msg) {
      $(".p" + id).html('<span style="color:green">' + o.play + '</span> ' + new Date().toLocaleTimeString() + " " + msg);
    };
    logmsg("");

    var end = function (blob) {
      audio.src = URL.createObjectURL(blob);
      upload(id, key);
      // audio.play();
    };
    end(o.blob);
  };
};

function recdown(id) {
  var o = recblob[id];
  if (o) {
    // saveAs(o.blob, "test.mp3");
  };
};

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getDeviceToken() {
  const key = 'token';
  var token = localStorage.getItem(key);
  if (!token) {
    token = makeid(30);
    localStorage.setItem(key, token);
  }
  return token;
}

function leftPad(str) {
  var pad = "00";
  var ans = pad.substring(0, pad.length - str.length) + str;
  return ans;
}

function setStorageIdToLocal(storageId, storyIndex) {
  const key = 'storage';
  let array = JSON.parse(localStorage.getItem(key));
  let datatime = new Date()
  let month = leftPad((datatime.getMonth() + 1) + '');
  let day = leftPad(datatime.getDate() + '');
  let hour = leftPad(datatime.getHours() + '');
  let min = leftPad(datatime.getMinutes() + '');
  let sec = leftPad(datatime.getSeconds() + '');
  let formattedDate = datatime.getFullYear() + '/' + month + '/' + day + ' ' + hour + ':' + min + ':' + sec;
  console.log(formattedDate)
  var name = formattedDate;
  if (!array) {
    array = []
    array.unshift({
      storageId,
      name,
      duration: recResult[storyIndex].time,
    });
  } else {
    array.unshift({
      storageId,
      name,
      duration: recResult[storyIndex].time,
    });
  }
  localStorage.setItem(key, JSON.stringify(array));
}

function uploadApi(key, formData) {
  $.ajax({
    url: API_URL + '/api/v1/story/upload',
    cache: false,
    contentType: false,
    processData: false,
    data: formData, //data只能指定單一物件                 
    type: 'post',
    success: function (data) {
      let storageId = data.data.storageId;
      setStorageIdToLocal(data.data.storageId, key);
      createData.data[parseInt(key, 10)].storageId = storageId;
      $('#loading-back').hide();
    },
    error: function() {
      $('#loading-back').hide();
    }
  });
}

function upload(id, key) {
  var o = recblob[id];
  if (o) {
    var token = getDeviceToken();
    var blob = o.blob
    // var file_data = $('#blockimg').prop('files')[0]; //取得上傳檔案屬性
    var formData = new FormData();
    formData.append('file', blob, 'audio.mp4');
    formData.append('deviceToken', token);
    uploadApi(key, formData);
  }
}

function create() {
  $.ajax({
    url: API_URL + '/api/v1/story',
    contentType: "application/json; charset=utf-8",
    dataType: 'json',
    data: JSON.stringify(createData),
    type: 'post',
    success: function (data) {
      Swal.fire(
        '成功',
        '',
        'success'
      );
    },
    error: function (data) {
      Swal.fire(
        '錯誤',
        data.responseJSON.message,
        'error'
      );
    }
  });
}

function checkCampaignStatus() {
  $.ajax({
    url: API_URL + '/api/v1/campaign/status',
    type: 'get',
    error: function (data) {
      gtag('event', 'activity-end', {
        'event_category': 'CheckCampaignStatus',
      });
      Swal.fire(
        '警告',
        data.responseJSON.message,
        'warning'
      );
    }
  });
}

function checkBrowser() {
  var ua = navigator.userAgent.toLowerCase();
  isLineApp = ua.indexOf("line") > -1, // Line 內建瀏覽器
  isFbApp = ua.indexOf("fbid") > -1; // FB App 內建瀏覽器

  if (isFbApp) {
    Swal.fire(
      '錯誤',
      '請使用 Safari 或 Chrome 開啟活動連結',
      'error',
    );
  }
  if (isLineApp) {
    Swal.fire(
      '錯誤',
      '請使用 Safari 或 Chrome 開啟活動連結',
      'error',
    );
  }
}

function checkIOS() {
  var ua = navigator.userAgent.toLowerCase();
  isiPhone = ua.indexOf("iphone") > -1, // FB App 內建瀏覽器
  isiPad = ua.indexOf("ipad") > -1; // FB App 內建瀏覽器
  if (isiPad || isiPhone) {
    $('.upload-btn').hide();
  }
}

(function() {
  checkIOS();
  $('input[type=radio][name=storyType]').change(function() {
    const value = parseInt(this.value, 10);
    const index = parseInt($(this).data('index'), 10);
    createData.data[index].category = value;
  });

  $('input[type=radio][name=emotion]').change(function() {
    const value = parseInt(this.value, 10);
    const index = parseInt($(this).data('index'), 10);
    createData.data[index].emotion = value;
  });

  $('.storyTitle').change(function() {
    const value = this.value;
    const index = parseInt($(this).data('index'), 10);
    createData.data[index].tag = value;
  });

  $('#name').change(function() {
    const value = this.value;
    createData.name = value;
  });
  $('#email').change(function() {
    const value = this.value;
    createData.email = value;
  });
  $('#phone').change(function() {
    const value = this.value;
    createData.phone = value;
  });
  $('#address').change(function() {
    const value = this.value;
    createData.address = value;
  });

  $('#agree').change(function() {
    if(this.checked) {
      createData.agreePrivacyPolicyAt = new Date();
      $("#create-story").removeAttr('disabled');
    } else {
      $("#create-story").prop("disabled", true);
    }
  });

  $('.upload-audio').change('change', function(){ 
    const index = $(this).data('index');
    var audio = $(".recPlay-" + index)[0];
    var fileThis = this;
    var reader = new FileReader();
    reader.onload = function(e) {
      $(".recPlay-" + index).one("loadedmetadata", function() {
        var time = audio.duration * 1000;
        var isError = false;
        if (time > maxTime) {
          Swal.fire(
            '錯誤',
            '請選擇 10 分鐘以下的檔案',
            'error'
          );
          isError = true;
        }
        if (time < timeLimit) {
          Swal.fire(
            '錯誤',
            '請選擇 3 分鐘以上的檔案',
            'error'
          );
          isError = true;
        }
        if (isError) {
          audio.src = '';
          audio.controls = true;
        } else {
          gtag('event', 'upload-file', {
            'event_category': 'SelectFile',
          });
          recResult[index] = {};
          recResult[index].time = time;
          createData.data[parseInt(index, 10)].duration = time;
          $('#loading-back').show();
          var token = getDeviceToken();
          var formData = new FormData();
          formData.append('file', fileThis.files[0]);
          formData.append('deviceToken', token);
          uploadApi(index, formData);
        }
      }); 
      audio.src = this.result;
      audio.controls = true;
    };
    reader.readAsDataURL(this.files[0]);
    
  });

  $('.form-control').jqBootstrapValidation({
    submitError: function ($form, event, errors) { 
      console.log('error');
    },
    submitSuccess: function() {

      var storageValidate = true;
      var storageValidateIndex = null;

      var tagValidate = true;
      var tagInValidateIndex = null;
      createData.data.forEach((o, index) => {
        if (!o.storageId ) {
          storageValidate = false;
          if (storageValidateIndex === null) storageValidateIndex = index;
          $('#audio-validate-' + index).show();
        } else {
          $('#audio-validate-' + index).hide();
        }
      });
      createData.data.forEach((o, index) => {
        if (!o.tag) {
          tagValidate = false;
          if (tagInValidateIndex === null) tagInValidateIndex = index;
          $('#tag-validate-' + index).show();
        } else {
          $('#tag-validate-' + index).hide();
        }
      })
      if (storageValidate) {
        if (tagValidate) {
          $('#exampleModalLong').modal()
        } else {
          $('html, body').animate({
            scrollTop: $('#tag-validate-' + tagInValidateIndex).offset().top - 300
          }, 500);
        }
      } else {
        $('html, body').animate({
          scrollTop: $('#audio-validate-' + storageValidateIndex).offset().top - 300
        }, 500);
      }
    }
  });

  $('#create-story').click(function() {
    gtag('event', 'create', {
      'event_category': 'CreateSubmit',
    });
    $('#exampleModalLong').modal('toggle');
    create();
  })

})()