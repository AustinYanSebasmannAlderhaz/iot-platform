#!/bin/bash

# 啟動 tmux session 叫 "iot"
tmux new-session -d -s iot

# 窗格 1：TCP Server
tmux send-keys -t iot 'cd /home/austin/IOT_Sensor && node TCP_Server_postgresSQL.js' C-m

# 分割窗格，啟動 Auth API
tmux split-window -h -t iot
tmux send-keys -t iot 'cd /home/austin/IOT_Sensor/auth-api && node server.js' C-m

# 切換到第一個窗格
tmux select-pane -t iot:0.0

# attach 到 tmux session
tmux attach -t iot

# http://127.0.0.1:4000/register.html &