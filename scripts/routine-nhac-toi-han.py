#!/usr/bin/env python3
"""Vỏ bọc cho LaunchAgent `com.huy.justus-nhac-toi-han` (07:30 hằng ngày).

Việc duy nhất của vỏ bọc: chạy `nhac-toi-han.py` và KÊU qua Telegram khi nó trượt.
Không có vỏ bọc thì script lỗi là lỗi câm — launchd nuốt mã thoát, log nằm im trong
`scripts/logs/`, và thông báo đơn giản là không tới, không dấu hiệu nào.
"""
import sys
from pathlib import Path

sys.path.insert(0, "/Users/Huy/Claude/HeThong")
import routine_lib  # noqa: E402

CHINH = Path(__file__).resolve().parent / "nhac-toi-han.py"

raise SystemExit(routine_lib.chay_va_keu_khi_loi(
    "Just Us — nhắc mục tới hạn",
    [sys.executable, str(CHINH)],
    timeout=600,
))
