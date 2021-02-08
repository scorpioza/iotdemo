#!/usr/bin/env python3
"""
Эмуляция серверной части для IOT
Usage::
    ./server.py [<port>]
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import logging
from urllib.parse import urlparse, parse_qs
import json
from datetime import datetime
import random
import os
import codecs

# текущая директория с файлами IOT
IOT_ROOT_DIR=os.path.dirname(os.path.abspath(__file__))
# директория, где лежат файлы с логом и сообщениями
DB_DIR=IOT_ROOT_DIR+"/db/" 
# если запуск из другой директории:
# DB_DIR=os.path.abspath(os.curdir) +"/db/"


CHAT_STATE=[
  "DELIVERED",
  "SENDED",
  "FAIL"
];

CHAT_TYPE=[
  "INCOMING",
  "OUTCOMING"
];

LOG_STATE=[
  "ERROR",
  "PLAIN",
  "APPLICATION",
  "ADMIN",
  "COMMUNICATE"
];

LOG_TYPE=[
  "INCOMING",
  "OUTCOMING"
];

HISTORY_COUNT=10

class S(BaseHTTPRequestHandler):

    def _set_response(self, mime):
        self.send_response(200)
        self.send_header('Content-type', mime)
        self.end_headers()

    def do_GET(self):

        #logging.info("GET request,\nPath: %s\nHeaders:\n%s\n", str(self.path), str(self.headers))
        resp = "{}".format(self.path)
        mime = 'text/html'

        if ".css" in resp or ".js" in resp or ".html" in resp:

            f = codecs.open(IOT_ROOT_DIR + "/" + os.path.basename(self.path), "r", "utf-8")
            out = f.read()
            ext = self.path.split(".")[-1]
            if ext == "css":
                mime = 'text/css'
            elif ext == "js":
                mime = 'text/javascript'
        else:
            q = parse_qs(urlparse(self.path).query)
            if "fun" in q:
                out = "Unknown function"
                if q["fun"][0] == "Reset":  
                    out = self.clearLog()
                elif q["fun"][0] == "ResetChat":  
                    out = self.clearChat()
                elif q["fun"][0] == "HistoryLog":  
                    out = self.historyLog()
                elif q["fun"][0] == "HistoryChat":  
                    out = self.historyChat()
                elif q["fun"][0] == "GetParams":  
                    out = self.getParams()
            else: 
                out = resp
 
        logging.info("\n\nSend:%s", out)
        self._set_response(mime)

        self.wfile.write(out.encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers['Content-Length']) # <--- Gets the size of data
        post_data = self.rfile.read(content_length) # <--- Gets the data itself

        out = "POST: "+post_data.decode('utf-8')
        q = parse_qs(urlparse(self.path).query)
        post_q = parse_qs(urlparse("/?"+post_data.decode('utf-8')).query)
        if "fun" in q:
            out = "Unknown function"
            if q["fun"][0] == "GetMessages":
                out = self.GetMessages(post_q)
            elif q["fun"][0] == "SendMessage":  
                out = self.SendMessage(post_q)
            elif q["fun"][0] == "SetParams":  
                out = self.setParams(post_q)

        
        logging.info("\n\nReceive:%s\nSend:%s", post_data.decode('utf-8'), out)

        self._set_response('text/html')
        self.wfile.write(out.encode('utf-8'))


    def _getMsgs(self):
        f = open(DB_DIR+"msg.json", "r")
        out = f.read()
        return json.loads(out) if out else list()

    def _setMsgs(self, msgs):
        f = open(DB_DIR+"msg.json", "w")
        f.write(json.dumps(msgs))
        f.close()


    def _getLogs(self):
        f = open(DB_DIR+"log.json", "r")
        out = f.read()
        return json.loads(out) if out else list()

    def _setLogs(self, msgs):
        f = open(DB_DIR+"log.json", "w")
        f.write(json.dumps(msgs))
        f.close()

    def _genServerMsg(self, id):
        messageResponses = [
            'Why did the web developer leave the restaurant? Because of the table layout.',
            'How do you comfort a JavaScript bug? You console it.',
            'An SQL query enters a bar, approaches two tables and asks: "May I join you?"',
            'What is the most used language in programming? Profanity.',
            'What is the object-oriented way to become wealthy? Inheritance.',
            'An SEO expert walks into a bar, bars, pub, tavern, public house, Irish pub, drinks, beer, alcohol']

        # Type 0 - INCOMING
        return {"id": id, "Text": str(id)+"). "+random.choice(messageResponses), "Type": 0, 
                "State":random.randint(0, len(CHAT_STATE)-1), "Time":self._getDate()}

    def _genLog(self, id):

        logResponses =  [
            'App Start',
            'Encrypted message: 00008185050000000100005900003A00645EC49310317B',
            'sending to scef: 00-00-81-85-05-00-00-00-01-00-00-59-00-00-3A-00-64-5E-C4-93-10-31-7B',
            'SCEF response:{"self":"/3gpp-nidd/v1/niimeid1/configurations/5f85a8cc0a0b009200014eda/downlink-data-deliveries/365","status":"BUFFERING_TEMPORARILY_NOT_REACHABLE","externalId":"m2m.default.1@177373663495.iot.mts.ru","reliableDataService":false}True',
            'sending to scef: AACBhQUAAAABAABZAAA6AGRexJMQMXs=',
            'Message data from scef:00008285080000000100007700005785005A82F7A8']

        # INCOMING, OUTCOMING
        ltype = random.randint(0, 1)

        return {"id": id, "Text": str(id)+"). "+str(ltype)+": "+random.choice(logResponses), 
                "State": random.randint(0, len(LOG_STATE)-1), "Type": ltype,
                "Time":self._getDate()}

    
    def _getDate(self):
        now = datetime.now()
        return now.strftime("%H.%M.%S")

    def getParams(self):
        f = open(DB_DIR+"settings.json", "r")
        out = f.read()
        return out       

    def setParams(self, q):
        settings = {
            "crypto_ip": q["crypto_ip"][0],
            "client_id": q["client_id"][0]
        }

        f = open(DB_DIR+"settings.json", "w")
        f.write(json.dumps(settings))
        f.close()
        return "OK"


    def SendMessage(self, q):


        chk = "checked" if q["chkSync"][0]=="true" else "unchecked"
        txt = q["msg"][0] + " ("+ chk+")"

        # CHAT_STATE=["DELIVERED", "SENDED", "FAIL"];
        cstate = random.randint(1,2)

        try:
            msgs = self._getMsgs()
            last_id = 0
            for m in msgs:
                if m["id"]>last_id:
                    last_id = m["id"]
            #TYPE 1 - OUTCOMING
            msg = {"id": last_id+1, "Text": txt, "Type": 1, 
                "State":cstate, "Time":self._getDate()}
            msgs.append(msg)
            self._setMsgs(msgs)
            return "SEND MSG SUCCESS: "+txt
        except:
            return "SEND MSG ERROR: "+txt



    def GetMessages(self, q):
        '''
        {
            new_messages: [
                msg1, 
                msg2,
                ...
            ],
            new_log_data: [
                log_msg1, 
                log_msg2,
                ...
            ],
            msg_status{
                id1 : newStatus1,
                id2 : newStatus2
            }
        }
        '''

        allmsgs = self._getMsgs()        

        if "msg_id" in q:
            msg_id = int(q["msg_id"][0])
        else:
            msg_id = 0
            for m in allmsgs:
                if m["id"]>msg_id:
                    msg_id = m["id"]

        unread = dict()
        msgs = list()
        max_id = 0
        k=0
        msg_changed = False
        for m in allmsgs:
            if int(m["id"])>msg_id:
                msgs.append(m)

            # CHAT_STATE=["DELIVERED", "SENDED", "FAIL"];
            elif m['State'] == 1 and random.randrange(10) == 8:
                unread[m["id"]]=0
                allmsgs[k]['State'] = 0
                msg_changed = True
            if int(m["id"])>max_id:
                max_id=int(m["id"])
            k=k+1



        alllogs = self._getLogs()

        if "log_id" in q:
            log_id = int(q["log_id"][0])
        else:
            log_id = 0
            for m in alllogs:
                if m["id"]>log_id:
                    log_id = m["id"]


        logs = list()
        max_log_id = 0
        for m in alllogs:
            if int(m["id"])>log_id:
                logs.append(m)
            if int(m["id"])>max_log_id:
                max_log_id=int(m["id"])                


        if random.randrange(50) == 8:
            m = self._genServerMsg(max_id+1)
            msgs.append(m)
            allmsgs.append(m)
            msg_changed = True

        if msg_changed:
            self._setMsgs(allmsgs)

        if random.randrange(10) == 8:
            m = self._genLog(max_log_id+1)
            logs.append(m)

            alllogs.append(m)
            self._setLogs(alllogs)

        data = {}
        if msgs:
            data["new_messages"]=msgs
        elif allmsgs:
            data["msg_id"]=allmsgs[-1]["id"]

        if logs:
            data["new_log_data"]=logs
        elif alllogs:
            data["log_id"]=alllogs[-1]["id"]

        if unread:
            data["msg_status"]=unread

        return json.dumps(data)

    def clearLog(self):
        self._setLogs(list())
        return "OK"

    def clearChat(self):
        self._setMsgs(list())
        return "OK"

    def historyLog(self):

        q = parse_qs(urlparse(self.path).query)
        l = self._getLogs()
        logs = []
        if "log_id" in q:
            for m in l:
                if m["id"]<int(q["log_id"][0]):
                    logs.append(m)
        else:
            logs = l

        return json.dumps(logs[-HISTORY_COUNT:] if len(logs)> HISTORY_COUNT else logs)

    def historyChat(self):

        q = parse_qs(urlparse(self.path).query)
        l = self._getMsgs()
        msgs = []
        if "msg_id" in q:
            for m in l:
                if m["id"]<int(q["msg_id"][0]):
                    msgs.append(m)
        else:
            msgs = l

        return json.dumps(msgs[-HISTORY_COUNT:] if len(msgs)> HISTORY_COUNT else msgs)


def run(server_class=HTTPServer, handler_class=S, port=8080):
    logging.basicConfig(level=logging.INFO)
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    logging.info('Starting httpd...\n')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logging.info('Stopping httpd...\n')

if __name__ == '__main__':
    from sys import argv

    if len(argv) == 2:
        run(port=int(argv[1]))
    else:
        run()

