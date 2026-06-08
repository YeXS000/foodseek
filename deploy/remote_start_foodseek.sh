#!/usr/bin/env bash
set -euo pipefail

REMOTE_DIR="${1:-$HOME/foodseek-h5}"
HTTP_PORT="${2:-8089}"
APP_DIR="$REMOTE_DIR/current"
LOG_FILE="$REMOTE_DIR/foodseek-h5.log"
PID_FILE="$REMOTE_DIR/foodseek-h5.pid"

if [ ! -d "$APP_DIR" ]; then
  echo "App directory does not exist: $APP_DIR" >&2
  exit 1
fi

PYTHON_BIN="$(command -v python3 || command -v python || true)"
if [ -z "$PYTHON_BIN" ]; then
  echo "python3/python not found on remote host" >&2
  exit 1
fi

mkdir -p "$REMOTE_DIR"

install_user_systemd() {
  if ! command -v systemctl >/dev/null 2>&1; then
    return 1
  fi

  mkdir -p "$HOME/.config/systemd/user"
  cat > "$HOME/.config/systemd/user/foodseek-h5.service" <<EOF
[Unit]
Description=Foodseek H5 static server
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
ExecStart=$PYTHON_BIN -m http.server $HTTP_PORT --bind 0.0.0.0 --directory $APP_DIR
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
EOF

  systemctl --user daemon-reload
  systemctl --user enable --now foodseek-h5.service
}

start_nohup() {
  if [ -f "$PID_FILE" ]; then
    OLD_PID="$(cat "$PID_FILE" || true)"
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
      kill "$OLD_PID" || true
      sleep 1
    fi
  fi

  pkill -f "http.server $HTTP_PORT .*--directory $APP_DIR" 2>/dev/null || true
  nohup "$PYTHON_BIN" -m http.server "$HTTP_PORT" --bind 0.0.0.0 --directory "$APP_DIR" > "$LOG_FILE" 2>&1 &
  echo "$!" > "$PID_FILE"
}

if install_user_systemd; then
  echo "Started foodseek-h5 with user systemd on port $HTTP_PORT"
else
  start_nohup
  echo "Started foodseek-h5 with nohup on port $HTTP_PORT"
fi

echo "App path: $APP_DIR"
