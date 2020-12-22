var LIVE_SITE = "/";
var QQ ={
  "info" : "?fun=GetMessages",
  "clearLog" : "?fun=Reset",
  "clearChat" : "?fun=ResetChat",
  "send" : "?fun=SendMessage",
  "setParams": "?fun=SetParams",
  "getParams": "?fun=GetParams"
};

var ID_FIELD = "id";

/* Структура сообщения, которая возвращается при запросе GetMessages
{
    new_messages: [
        msg1,  - содержит объект с ключами ID_FIELD, State, Type, Time, Text
        msg2,
        ...
    ],
    new_log_data: [
        log_msg1, - содержит объект с ключами ID_FIELD, Type, Time, Text
        log_msg2,
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
  "COMMUNICATE"
];

var LOG_TYPE=[
  "INCOMING",
  "OUTCOMING"
];


$(function(){

  var chat = {
    msg_id: 0,
    log_id: 0,
    messageToSend: '',

    init: function () {
      this.cacheDOM();
      this.bindEvents();
      setInterval(this.check.bind(this), 500);
    },
    cacheDOM: function () {
      this.$chatHistory = $('.chat-history');
      this.$button = $('#btn-send');
      this.$textarea = $('#message-to-send');
      this.$chatHistoryList = this.$chatHistory.find('ul');
      this.$btnCleanLog = $('#btn-clean-log');
      this.$btnCleanChat = $('#btn-clean-chat');
      this.$syncro = $('#chkSync');
      this.$log = $('#log-wrapper');
    },
    bindEvents: function () {
      this.$button.on('click', this.addMessage.bind(this));
      this.$textarea.on('keyup', this.addMessageEnter.bind(this));
      this.$btnCleanLog.on('click', this.cleanLog.bind(this));
      this.$btnCleanChat.on('click', this.cleanChat.bind(this));
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
      var self = this;
      $.post( LIVE_SITE+QQ["info"], 
          { msg_id: this.msg_id, log_id: this.log_id },  function( data ) {
        if("new_messages" in data && data["new_messages"].length){
          for(var i=0; i<data["new_messages"].length; i++){
            var mInfo = data["new_messages"][i];

            self.$chatHistoryList.append(self.getMsgTmpl(mInfo));

            if(mInfo[ID_FIELD]>self.msg_id)
              self.msg_id = mInfo[ID_FIELD];
          }
          self.scrollToBottom();
        }
        if("new_log_data" in data && data["new_log_data"].length){
          for(var i=0; i<data["new_log_data"].length; i++){
            var mInfo = data["new_log_data"][i];

            self.$log.append(self.getLogTmpl(mInfo));

            if(mInfo[ID_FIELD]>self.log_id)
              self.log_id = mInfo[ID_FIELD];
          }
          self.scrollLogToBottom();
        }
        if("msg_status" in data){
          for (mid in data["msg_status"]) {
            var state = parseInt(data["msg_status"][mid]);

            var mclass="fa-times";
            if (state == CHAT_STATE.indexOf("DELIVERED"))
                mclass="fa-check"
            else if (state == CHAT_STATE.indexOf("SENDED"))
                mclass="fa-circle"

            $('#iot-msg-'+mid+" i")
              .removeClass('fa-check').removeClass('fa-circle')
              .removeClass('fa-times').addClass(mclass);
          }
        }
      }, "json");
    },
    getMsgTmpl: function (item){


        var state = parseInt(item['State']);
        if (state == CHAT_STATE.indexOf("DELIVERED"))
            mtype="fa-check";
        else if (state == CHAT_STATE.indexOf("SENDED"))
            mtype="fa-circle";
        else
            mtype="fa-times";

        if (item['Type'] == CHAT_TYPE.indexOf("OUTCOMING")){
            html = "<li id='iot-msg-"+item[ID_FIELD]+"'>\
                <div class='message-data'>\
                  <i class='fa "+mtype+" online'></i>\
                  <span class='message-data-name'> Сервер</span>\
                  <span class='message-data-time'>"+item['Time']+"</span>\
                </div><div class='message my-message'>"+item['Text']+"</div></li>";
        }else{
            html = "<li id='iot-msg-"+item[ID_FIELD]+"' class='clearfix'>\
                <div class='message-data align-right'>\
                  <span class='message-data-time' >"+item['Time']+"</span> &nbsp; &nbsp;\
                  <span class='message-data-name' >Клиент</span> \
                  <i class='fa "+mtype+" me'></i>\
                </div><div class='message other-message float-right'>"+item['Text']+"</div></li>";
            
        }
        return html
    },
    getLogTmpl: function (item){

        var state = parseInt(item['State']);
        if (state == LOG_STATE.indexOf("ERROR"))
            err_class = "error";
        else if (state == LOG_STATE.indexOf("ADMIN"))
            err_class = "admin";
        else if (state == LOG_STATE.indexOf("COMMUNICATE"))
            err_class = "communicate";
        else // PLAIN and APPLICATION
            err_class = "info log-info-"+LOG_STATE[state].toLowerCase();

        var type_class=('Type' in item)? LOG_TYPE[parseInt(item['Type'])].toLowerCase() : "none";

        html = '<div id="iot-log-'+item[ID_FIELD]+'" class="log log-'
        html += err_class+' type-'+type_class+'"><span class="badge">'+item['Time']+'</span>' 
        html += item['Text'] + '</div>'
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
      var self = this;
      $.get( LIVE_SITE+QQ["clearLog"], function( data ) {
        self.log_id=0;
        self.$log.html("");
      });
    },
    cleanChat: function() {
      var self = this;
      $.get( LIVE_SITE+QQ["clearChat"], function( data ) {
        self.msg_id=0;
        self.$chatHistoryList.html("");
      });
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