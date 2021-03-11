var LIVE_SITE = "/";
var QQ ={
  "info" : "?fun=GetMessages",
  "clearLog" : "?fun=Reset",
  "clearChat" : "?fun=ResetChat",
  "send" : "?fun=SendMessage",
  "setParams": "?fun=SetParams",
  "getParams": "?fun=GetParams",
  "historyLog": "?fun=HistoryLog",
  "historyChat": "?fun=HistoryChat"
};

FIRST_GET_SYMBOL="&";

var ID_FIELD = "id";

var CHECK_INTERVAL = 500;

/* Структура сообщения, которая возвращается при запросе GetMessages
{
    msg_id: id, - передается только в том случае, если скрипт не посылает msg_id
    new_messages: [ - в начальный момент может не передаваться, либо передаваться пустой массив
        {id: id1, State: State1, Type: Type1, Time: Time1, Text: Text1}, 
        {id: id2, State: State2, Type: Type2, Time: Time2, Text: Text2},
        ...
    ],
    log_id: id, - передается только в том случае, если скрипт не посылает log_id
    new_log_data: [ - в начальный момент может не передаваться, либо передаваться пустой массив
        {id: id1, Type: Type1, Time: Time1, Text: Text1}, 
        {id: id2, Type: Type2, Time: Time2, Text: Text2},
        ...
    ],
    msg_status{
        id1 : newStatus1,
        id2 : newStatus2
    }
}*/

var CHAT_STATE=[
  "DELIVERED",
  "SENDED",
  "FAIL"
];

var CHAT_TYPE=[
  "INCOMING",
  "OUTCOMING"
];

var LOG_STATE=[
  "ERROR",
  "PLAIN",
  "APPLICATION",
  "ADMIN",
  "COMMUNICATE",
  "SEPARATOR"
];

var LOG_TYPE=[
  "INCOMING",
  "OUTCOMING"
];


var STATE_CSS={
  "delivered": "fa-check",
  "sended": "fa-circle",
  "fail": "fa-times"
};

$(function(){

  var chat = {
    msg_id: 0,
    log_id: 0,
    messageToSend: '',

    init: function () {
      this.cacheDOM();
      this.bindEvents();
      setInterval(this.check.bind(this), CHECK_INTERVAL);
    },
    cacheDOM: function () {
      this.$chatHistory = $('.chat-history');
      this.$button = $('#btn-send');
      this.$textarea = $('#message-to-send');
      this.$chatHistoryList = this.$chatHistory.find('ul');
      this.$btnCleanLog = $('#btn-clean-log');
      this.$btnCleanChat = $('#btn-clean-chat');
      this.$btnHistoryLog = $('#btn-history-log');
      this.$btnHistoryChat = $('#btn-history-chat');
      this.$syncro = $('#chkSync');
      this.$log = $('#log-wrapper');
    },
    bindEvents: function () {
      this.$button.on('click', this.addMessage.bind(this));
      this.$textarea.on('keyup', this.addMessageEnter.bind(this));
      this.$btnCleanLog.on('click', this.cleanLog.bind(this));
      this.$btnCleanChat.on('click', this.cleanChat.bind(this));
      this.$btnHistoryLog.on('click', this.historyLog.bind(this));
      this.$btnHistoryChat.on('click', this.historyChat.bind(this));
      $('#btn-copy-log').on('click', this.copyToClipboard.bind(this));
      $('#save-settings').on('click', this.setParams.bind(this))

      var self = this;
      $('.sidebar a:first').click(function( event ) {
        event.preventDefault();
        self.showChat();
      });
      $('.sidebar a:eq(2)').click(function( event ) {
        event.preventDefault();
        self.showSettings();
      });
    },
    addMessage: function () {
      this.messageToSend = this.$textarea.val();
      var self = this;
      if (this.messageToSend.trim() !== '') {
        $.post( LIVE_SITE+QQ["send"], 
          { msg: this.messageToSend, chkSync: this.$syncro.is(":checked") } , function( data ) {
          self.$textarea.val('');
          self.scrollToBottom();
        });
      }
    },
    check: function (){

      var post_data = {"sended_ids": []};
      $('.message-data .'+STATE_CSS['sended'] ).each(function(i, el){
          post_data["sended_ids"].push($(el).attr("rel"));
      });
      if(this.msg_id>0)
        post_data["msg_id"] = this.msg_id;
      if(this.log_id>0)
        post_data["log_id"] = this.log_id;      

      var self = this;
      $.post( LIVE_SITE+QQ["info"], post_data,  function( data ) {
        if("new_messages" in data && data["new_messages"].length){
          for(var i=0; i<data["new_messages"].length; i++){
            var mInfo = data["new_messages"][i];

            self.$chatHistoryList.append(self.getMsgTmpl(mInfo));

            if(mInfo[ID_FIELD]>self.msg_id)
              self.msg_id = mInfo[ID_FIELD];
          }
          self.scrollToBottom();
        }else if("msg_id" in data){
          self.msg_id = data["msg_id"];
        }

        if("new_log_data" in data && data["new_log_data"].length){
          for(var i=0; i<data["new_log_data"].length; i++){
            var mInfo = data["new_log_data"][i];

            self.$log.append(self.getLogTmpl(mInfo));

            if(mInfo[ID_FIELD]>self.log_id)
              self.log_id = mInfo[ID_FIELD];
          }
          self.scrollLogToBottom();
        }else if("log_id" in data){
          self.log_id = data["log_id"];
        }
        if("msg_status" in data){
          for (mid in data["msg_status"]) {
            var state = parseInt(data["msg_status"][mid]);

            var mclass=STATE_CSS['fail'];
            if (state == CHAT_STATE.indexOf("DELIVERED"))
                mclass=STATE_CSS['delivered'];
            else if (state == CHAT_STATE.indexOf("SENDED"))
                mclass=STATE_CSS['sended'];

            $('#iot-msg-'+mid+" i")
              .removeClass(STATE_CSS['delivered']).removeClass(STATE_CSS['sended'])
              .removeClass(STATE_CSS['fail']).addClass(mclass);
          }
        }
      }, "json");
    },
    getMsgTmpl: function (item){


        var state = parseInt(item['State']);
        if (state == CHAT_STATE.indexOf("DELIVERED"))
            mtype=STATE_CSS['delivered'];
        else if (state == CHAT_STATE.indexOf("SENDED"))
            mtype=STATE_CSS['sended'];
        else
            mtype=STATE_CSS['fail'];

        if (item['Type'] == CHAT_TYPE.indexOf("INCOMING")){
            html = "<li id='iot-msg-"+item[ID_FIELD]+"'>\
                <div class='message-data'>\
                  <i rel='"+item[ID_FIELD]+"' class='fa "+mtype+" online'></i>\
                  <span class='message-data-name'> Клиент</span>\
                  <span class='message-data-time'>"+item['Time']+"</span>\
                </div><div class='message my-message'>"+item['Text']+"</div></li>";
        }else{
            html = "<li id='iot-msg-"+item[ID_FIELD]+"' class='clearfix'>\
                <div class='message-data align-right'>\
                  <span class='message-data-time' >"+item['Time']+"</span> &nbsp; &nbsp;\
                  <span class='message-data-name' >Сервер</span> \
                  <i rel='"+item[ID_FIELD]+"' class='fa "+mtype+" me'></i>\
                </div><div class='message other-message float-right'>"+item['Text']+"</div></li>";
            
        }
        return html
    },
    getLogTmpl: function (item){

        var state = parseInt(item['State']);
        err_class = LOG_STATE[state].toLowerCase();

        var type_class=('Type' in item)? LOG_TYPE[parseInt(item['Type'])].toLowerCase() : "none";

        if(err_class=="separator"){
           html = '<div id="iot-log-'+item[ID_FIELD]+'" rel="'+item[ID_FIELD]+
            '" class="iot-separator"></div>';
        }else{

          html = '<div id="iot-log-'+item[ID_FIELD]+'" class="log log-'
          html += err_class+' type-'+type_class+'" rel="'+item[ID_FIELD]+
            '"><span class="badge">'+item['Time']+'</span>' 
          html += item['Text'] + '</div>';
        }
        return html
    },

    addMessageEnter: function (event) {
      if (event.keyCode === 13) {
        this.addMessage();
      }
    },
    scrollToBottom: function () {
      this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
    },
    scrollLogToBottom: function () {
      this.$log.scrollTop(this.$log[0].scrollHeight);
    },
    cleanLog: function() {
      this.$log.html("");
    },
    cleanChat: function() {
      this.$chatHistoryList.html("");
    },
    historyLog: function(){
      var first_log_id = ($('#log-wrapper .log').length>0)? 
          FIRST_GET_SYMBOL+"log_id="+$('#log-wrapper .log:first').attr("rel") : "";
      var self = this;
      $.get( LIVE_SITE+QQ["historyLog"]+first_log_id, function( data ) {
          for(var i=data.length-1; i>=0; i--){
            self.$log.prepend(self.getLogTmpl(data[i]));
          }

      }, "json");
    },
    historyChat: function(){
      var first_msg_id = ($('.message-data>i').length>0)? 
          FIRST_GET_SYMBOL+"msg_id="+$('.message-data>i:first').attr("rel") : "";
      var self = this;
      $.get( LIVE_SITE+QQ["historyChat"]+first_msg_id, function( data ) {
          for(var i=data.length-1; i>=0; i--){
            self.$chatHistoryList.prepend(self.getMsgTmpl(data[i]));
          }
      }, "json");
    },
    copyToClipboard: function(){

      str = this.$log.html()
        .replace(/<\/div>/gi, "</div>\n")
        .replace(/<\/span>/gi, "</span>: ")
        .replace(/(<([^>]+)>)/ig,"");

      const elem = document.createElement('textarea');
      elem.value = $.trim(str);
      document.body.appendChild(elem);
      elem.select();
      document.execCommand('copy');
      document.body.removeChild(elem);
    },
    showChat: function(){
      $('.chat-container').show();
      $('#settings-container').hide();
      $('.sidebar a.active').removeClass("active");
      $('.sidebar a:first').addClass("active");
    },
    showSettings: function(){
      $('.chat-container').hide();
      $('#settings-container').show();
      $('.sidebar a.active').removeClass("active");
      $('.sidebar a:eq(2)').addClass("active");
      this.getParams();
    },
    setParams: function(){

        $.post( LIVE_SITE+QQ["setParams"], 
          { crypto_ip: $('#crypto_ip').val(), client_id: $('#client_id').val() } , function( data ) {
            alert("Настройки сохранены");
        });
    },
    getParams: function(){
      $.get( LIVE_SITE+QQ["getParams"], function( data ) {
        if("crypto_ip" in data)
          $('#crypto_ip').val(data["crypto_ip"]);
        if("client_id" in data)
          $('#client_id').val(data["client_id"]);
      }, "json");
    }     
  };

  $( document ).ready(function() {
    chat.init();
  });

});