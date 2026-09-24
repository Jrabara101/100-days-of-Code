#!/usr/bin/env python3
"""
Builds the full "01 - Calculator" project: Designer UI + Blocks.

Features: + − × ÷, decimals, chained operators (left to right), repeated "=",
divide-by-zero error, float rounding, 12-digit limit, backspace, ±, %,
and a history list saved in TinyDB.

Usage: python build_calculator.py
Writes ../01 - Calculator/Calculator.aia (overwrites it).
"""
import os

from aia_lib import *  # noqa: F401,F403  (block DSL)
from aia_lib import FILL_PARENT, percent, component, build_scm, build_bky, validate, write_aia

PROJECT_ID = "Calculator"
DISPLAY_NAME = "Calculator"
OUT = os.path.join(os.path.dirname(__file__), "..", "01 - Calculator", "Calculator.aia")

# Colors (&HAARRGGBB)
BG = "&HFFF5F5F5"
WHITE = "&HFFFFFFFF"
DARK_TEXT = "&HFF212121"
GREY_TEXT = "&HFF757575"
FUNC_KEY = "&HFFE0E0E0"
OP_KEY = "&HFFFF9800"
EQ_KEY = "&HFF3F51B5"

OPERATORS = "+−×÷"  # the Unicode signs shown on the buttons

# --------------------------------------------------------------------------
# Designer
# --------------------------------------------------------------------------

KEY_STYLE = {
    "digit": dict(BackgroundColor=WHITE, TextColor=DARK_TEXT),
    "func": dict(BackgroundColor=FUNC_KEY, TextColor=DARK_TEXT),
    "op": dict(BackgroundColor=OP_KEY, TextColor=WHITE),
    "eq": dict(BackgroundColor=EQ_KEY, TextColor=WHITE),
}

KEYPAD = [
    [("BtnClear", "C", "func"), ("BtnBack", "⌫", "func"), ("BtnPercent", "%", "func"), ("BtnDiv", "÷", "op")],
    [("Btn7", "7", "digit"), ("Btn8", "8", "digit"), ("Btn9", "9", "digit"), ("BtnMul", "×", "op")],
    [("Btn4", "4", "digit"), ("Btn5", "5", "digit"), ("Btn6", "6", "digit"), ("BtnSub", "−", "op")],
    [("Btn1", "1", "digit"), ("Btn2", "2", "digit"), ("Btn3", "3", "digit"), ("BtnAdd", "+", "op")],
    [("BtnSign", "±", "digit"), ("Btn0", "0", "digit"), ("BtnDot", ".", "digit"), ("BtnEquals", "=", "eq")],
]


def key(name, text, style):
    return component("Button", name, Text=text, FontSize="24", FontBold="True", Shape="1",
                     Width=FILL_PARENT, Height=percent(9), **KEY_STYLE[style])


designer = [
    component("HorizontalArrangement", "HeaderRow", Width=FILL_PARENT, AlignVertical="2", children=[
        component("Label", "TitleLabel", Text="Calculator", FontSize="20", FontBold="True",
                  TextColor=DARK_TEXT, Width=FILL_PARENT),
        component("Button", "BtnHistory", Text="History", FontSize="14", Shape="1",
                  BackgroundColor=FUNC_KEY, TextColor=DARK_TEXT),
    ]),
    component("Label", "ExpressionLabel", Text="", FontSize="18", TextColor=GREY_TEXT,
              TextAlignment="2", Width=FILL_PARENT),
    component("Label", "Display", Text="0", FontSize="40", FontBold="True", TextColor=DARK_TEXT,
              TextAlignment="2", Width=FILL_PARENT),
    *[component("HorizontalArrangement", f"Row{i + 1}", Width=FILL_PARENT,
                children=[key(*k) for k in row])
      for i, row in enumerate(KEYPAD)],
    component("VerticalArrangement", "HistoryPanel", Visible="False", Width=FILL_PARENT,
              Height=FILL_PARENT, children=[
                  component("ListView", "HistoryList", Width=FILL_PARENT, Height=FILL_PARENT,
                            BackgroundColor=WHITE, TextColor=DARK_TEXT),
                  component("Button", "BtnClearHistory", Text="Clear History", Width=FILL_PARENT,
                            Shape="1", BackgroundColor=FUNC_KEY, TextColor=DARK_TEXT),
              ]),
    component("TinyDB", "HistoryDB", Namespace="Calculator"),
    component("Notifier", "Notifier1"),
]

scm = build_scm(DISPLAY_NAME, designer, BackgroundColor=BG, TitleVisible="False",
                ScreenOrientation="portrait", Sizing="Responsive",
                VersionCode="1", VersionName="1.0")

# --------------------------------------------------------------------------
# Blocks
# --------------------------------------------------------------------------


def D():
    return prop_get("Label", "Display", "Text")


def set_D(v):
    return prop_set("Label", "Display", "Text", v)


def set_expr(v):
    return prop_set("Label", "ExpressionLabel", "Text", v)


def show_history():
    return prop_set("ListView", "HistoryList", "Elements", gget("history"))


def last_char(t):
    return segment(t, length(t), num(1))


def drop_last_char(t_get, t_get2):
    return segment(t_get, num(1), sub(length(t_get2), num(1)))


col = [0, 520, 1040]
blocks = []

# Globals
for i, (name, init) in enumerate([
    ("firstNumber", num(0)),
    ("operator", txt("")),
    ("startNewNumber", boolean(True)),
    ("lastOperand", num(0)),
    ("lastOperator", txt("")),
    ("history", empty_list()),
]):
    blocks.append(global_decl(name, init, (col[0], 20 + i * 40)))

# Return procedures first so calls know their params
blocks.append(proc_ret("formatResult", ["n"],
    local_expr("s", format_decimal(lget("n"), num(10)), do_result([
        if_((contains(lget("s"), txt(".")), [
            while_(eq(last_char(lget("s")), txt("0")), [
                lset("s", drop_last_char(lget("s"), lget("s"))),
            ]),
            if_((eq(last_char(lget("s")), txt(".")), [
                lset("s", drop_last_char(lget("s"), lget("s"))),
            ])),
        ])),
        if_((eq(lget("s"), txt("-0")), [lset("s", txt("0"))])),
    ], lget("s"))),
    xy=(col[0], 300)))

blocks.append(proc_ret("compute", ["a", "op", "b"],
    choose(and_(eq(lget("op"), txt("÷")), mcmp("EQ", lget("b"), num(0))),
           txt("Error"),
           call_ret("formatResult",
                    choose(eq(lget("op"), txt("+")), add(lget("a"), lget("b")),
                    choose(eq(lget("op"), txt("−")), sub(lget("a"), lget("b")),
                    choose(eq(lget("op"), txt("×")), mul(lget("a"), lget("b")),
                           div(lget("a"), lget("b"))))))),
    xy=(col[0], 620)))

blocks.append(proc("pressClear", [], [
    set_D(txt("0")),
    set_expr(txt("")),
    gset("firstNumber", num(0)),
    gset("operator", txt("")),
    gset("lastOperator", txt("")),
    gset("lastOperand", num(0)),
    gset("startNewNumber", boolean(True)),
], xy=(col[0], 820)))

blocks.append(proc("showError", [], [
    call("pressClear"),
    set_D(txt("Error")),
    method("Notifier", "Notifier1", "ShowAlert", txt("Cannot divide by zero")),
], xy=(col[0], 1040)))

blocks.append(proc("clearIfError", [], [
    if_((eq(D(), txt("Error")), [call("pressClear")])),
], xy=(col[0], 1160)))

blocks.append(proc("addToHistory", ["entry"], [
    list_insert(gget("history"), num(1), lget("entry")),
    if_((mcmp("GT", list_length(gget("history")), num(50)), [
        list_remove(gget("history"), num(51)),
    ])),
    method("TinyDB", "HistoryDB", "StoreValue", txt("history"), gget("history")),
    show_history(),
], xy=(col[0], 1260)))

blocks.append(proc("pressDigit", ["d"], [
    call("clearIfError"),
    if_((or_(gget("startNewNumber"), eq(D(), txt("0"))), [
            set_D(lget("d")),
            gset("startNewNumber", boolean(False)),
        ]),
        (mcmp("LT", length(D()), num(12)), [
            set_D(join(D(), lget("d"))),
        ])),
], xy=(col[1], 20)))

blocks.append(proc("pressDot", [], [
    call("clearIfError"),
    if_((gget("startNewNumber"), [
            set_D(txt("0.")),
            gset("startNewNumber", boolean(False)),
        ]),
        (not_(contains(D(), txt("."))), [
            set_D(join(D(), txt("."))),
        ])),
], xy=(col[1], 260)))

blocks.append(proc("pressOperator", ["op"], [
    call("clearIfError"),
    # Chaining: 2 + 3 then "×" first shows 5
    if_((and_(neq(gget("operator"), txt("")), not_(gget("startNewNumber"))), [
        local_stmt("result", call_ret("compute", gget("firstNumber"), gget("operator"), D()), [
            if_((eq(lget("result"), txt("Error")), [call("showError")]),
                else_=[set_D(lget("result"))]),
        ]),
    ])),
    if_((neq(D(), txt("Error")), [
        gset("firstNumber", D()),
        gset("operator", lget("op")),
        gset("startNewNumber", boolean(True)),
        set_expr(join(D(), txt(" "), lget("op"))),
    ])),
], xy=(col[1], 480)))

blocks.append(proc("runEquals", ["a"], [
    local_stmt("expr", join(call_ret("formatResult", lget("a")), txt(" "), gget("lastOperator"),
                            txt(" "), call_ret("formatResult", gget("lastOperand"))), [
        local_stmt("result", call_ret("compute", lget("a"), gget("lastOperator"), gget("lastOperand")), [
            if_((eq(lget("result"), txt("Error")), [call("showError")]), else_=[
                set_D(lget("result")),
                set_expr(join(lget("expr"), txt(" ="))),
                call("addToHistory", join(lget("expr"), txt(" = "), lget("result"))),
                gset("operator", txt("")),
                gset("startNewNumber", boolean(True)),
            ]),
        ]),
    ]),
], xy=(col[1], 820)))

blocks.append(proc("pressEquals", [], [
    call("clearIfError"),
    if_((neq(gget("operator"), txt("")), [
            gset("lastOperator", gget("operator")),
            gset("lastOperand", D()),
            call("runEquals", gget("firstNumber")),
        ]),
        # Repeated "=": apply the last operation again (5 + 2 = = = -> 7, 9, 11)
        (neq(gget("lastOperator"), txt("")), [
            call("runEquals", D()),
        ])),
], xy=(col[1], 1160)))

blocks.append(proc("pressBack", [], [
    call("clearIfError"),
    if_((not_(gget("startNewNumber")), [
        if_((mcmp("LTE", length(D()), num(1)), [set_D(txt("0"))]),
            else_=[set_D(drop_last_char(D(), D()))]),
        if_((eq(D(), txt("-")), [set_D(txt("0"))])),
    ])),
], xy=(col[2], 20)))

blocks.append(proc("pressSign", [], [
    call("clearIfError"),
    if_((neq(D(), txt("0")), [
        set_D(call_ret("formatResult", mul(D(), num(-1)))),
    ])),
], xy=(col[2], 300)))

blocks.append(proc("pressPercent", [], [
    call("clearIfError"),
    set_D(call_ret("formatResult", div(D(), num(100)))),
], xy=(col[2], 460)))

# Events
blocks.append(event("Form", "Screen1", "Initialize", [
    gset("history", method("TinyDB", "HistoryDB", "GetValue", txt("history"), empty_list())),
    show_history(),
], xy=(col[2], 600)))

# One generic handler for all 20 keypad buttons, dispatched on the button's text.
# BtnHistory / BtnClearHistory texts match nothing here, so they are ignored.
blocks.append(generic_event("Button", "Click", [
    local_stmt("key", generic_prop_get("Button", "Text", event_param("component")), [
        if_((contains(txt("0123456789"), lget("key")), [call("pressDigit", lget("key"))]),
            (eq(lget("key"), txt(".")), [call("pressDot")]),
            (contains(txt(OPERATORS), lget("key")), [call("pressOperator", lget("key"))]),
            (eq(lget("key"), txt("=")), [call("pressEquals")]),
            (eq(lget("key"), txt("C")), [call("pressClear")]),
            (eq(lget("key"), txt("⌫")), [call("pressBack")]),
            (eq(lget("key"), txt("±")), [call("pressSign")]),
            (eq(lget("key"), txt("%")), [call("pressPercent")])),
    ]),
], xy=(col[2], 760)))

blocks.append(event("Button", "BtnHistory", "Click", [
    prop_set("VerticalArrangement", "HistoryPanel", "Visible",
             not_(prop_get("VerticalArrangement", "HistoryPanel", "Visible"))),
], xy=(col[2], 1160)))

blocks.append(event("Button", "BtnClearHistory", "Click", [
    gset("history", empty_list()),
    method("TinyDB", "HistoryDB", "ClearTag", txt("history")),
    show_history(),
], xy=(col[2], 1280)))

bky = build_bky(blocks)

if __name__ == "__main__":
    n_blocks = validate(designer, bky)
    write_aia(OUT, PROJECT_ID, DISPLAY_NAME, scm, bky)
    print(f"Wrote {os.path.abspath(OUT)}")
    print(f"  {sum(1 for _ in __import__('aia_lib').iter_components(designer))} components, "
          f"{n_blocks} blocks, {len(blocks)} top-level block groups")
