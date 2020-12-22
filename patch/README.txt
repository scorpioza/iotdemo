/* Encoding: UTF-8 */

Поддержаны ajax-запросы (соответствуют текущим /HOME/запрос):
GET:
1) Reset - очистка лога
2) ResetChat - очистка чата
3) GetParams - запрос настроек. Возвращает json-объект с ключами crypto_ip и client_id

POST:
1) GetMessages - циклический запрос сообщений чата, лога и измененных статусов для сообщений. 
Отправляет параметры log_id и msg_id, соответствующие последнему сообщению в логе и чате.
В начале работы скрипта посылает log_id=0 и msg_id=0
Возвращает следующую структуру
{
    new_messages: [
        {id: id1, State: State1, Type: Type1, Time: Time1, Text: Text1}, 
        {id: id2, State: State2, Type: Type2, Time: Time2, Text: Text2},
        ...
    ],
    new_log_data: [
        {id: id1, Type: Type1, Time: Time1, Text: Text1}, 
        {id: id2, Type: Type2, Time: Time2, Text: Text2},
        ...
    ],
    msg_status{
        id1 : newStatus1,
        id2 : newStatus2
    }
}



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



2) SetParams - передача настроек. 
Отправляет параметры crypto_ip и client_id
3) SendMessage - отправка сообщения. 
Отправляет параметры msg (текст сообщения) и chkSync (true/false)