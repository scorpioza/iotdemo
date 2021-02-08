/* Encoding: UTF-8 */

08.02 CHANGELOG: 
1) Добавлены HistoryLog и HistoryСhat
2) Убраны запросы на удаление лога и чата
3) Добавлен параметр sended_ids для GetMessages. В начале работы не передаются log_id и msg_id и мне необходимо получить их значения на вход

Поддержаны ajax-запросы (соответствуют текущим /HOME/запрос):
GET:
1) HistoryLog - подгрузка истории лога. В случае, если в логе есть сообщения, передается параметр log_id, равный первой отображаемой записи в логе. 
2) HistoryСhat - подгрузка истории чата. В случае, если в чате есть сообщения, передается параметр msg_id, равный первой отображаемой записи в чате.
Количество записей для вывода в историю я не передаю - эта информация определяется на серверной стороне.
3) GetParams - запрос настроек. Возвращает json-объект с ключами crypto_ip и client_id

POST:
1) GetMessages - циклический запрос сообщений чата, лога и измененных статусов для сообщений. 
Отправляет параметры log_id, msg_id и sended_ids. 
log_id и msg_id соответствуют последнему сообщению в логе и чате.
sended_ids - массив id сообщений со статусом SENDED
В начале работы скрипт не посылает log_id и msg_id
Возвращает следующую структуру
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