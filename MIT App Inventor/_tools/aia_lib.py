"""
Helpers for building full MIT App Inventor .aia projects in Python:
Designer components (.scm JSON) and Blocks (.bky Blockly XML).

See ../APP_INVENTOR_REFERENCE.md for the file formats.

Block helpers return xml.etree Elements. Statement lists are plain Python lists;
the helpers chain them together with <next> automatically.
"""
import io
import json
import zipfile
import xml.etree.ElementTree as ET
from itertools import count

# Kept a little behind appinventor-sources master (YaVersion 237 / language 39):
# App Inventor upgrades older projects on import but rejects newer ones.
YA_VERSION = "233"
BLOCKS_LANGUAGE_VERSION = "37"

COMPONENT_VERSIONS = {
    "Form": "31",
    "Button": "7",
    "Label": "5",
    "HorizontalArrangement": "4",
    "VerticalArrangement": "4",
    "ListView": "10",
    "TinyDB": "2",
    "Notifier": "6",
}

USER = "prdgmcreatives2_gmail_com"

# Designer size constants
FILL_PARENT = "-2"
AUTOMATIC = "-1"


def percent(p: int) -> str:
    """Width/Height as a percentage of the screen, e.g. percent(10) -> '-1010'."""
    return str(-1000 - p)


# --------------------------------------------------------------------------
# Designer (.scm)
# --------------------------------------------------------------------------

_uuids = count(1)


def component(ctype: str, name: str, children=None, **props) -> dict:
    comp = {
        "$Name": name,
        "$Type": ctype,
        "$Version": COMPONENT_VERSIONS[ctype],
        **{k: str(v) for k, v in props.items()},
        "Uuid": str(next(_uuids)),
    }
    if children:
        comp["$Components"] = children
    return comp


def build_scm(app_name: str, children: list, **form_props) -> str:
    form = {
        "$Name": "Screen1",
        "$Type": "Form",
        "$Version": COMPONENT_VERSIONS["Form"],
        "AppName": app_name,
        "Title": app_name,
        **{k: str(v) for k, v in form_props.items()},
        "Uuid": "0",
        "$Components": children,
    }
    doc = {"authURL": [], "YaVersion": YA_VERSION, "Source": "Form", "Properties": form}
    return "#|\n$JSON\n" + json.dumps(doc, indent=2, ensure_ascii=False) + "\n|#\n"


def iter_components(children):
    for c in children:
        yield c
        yield from iter_components(c.get("$Components", []))


# --------------------------------------------------------------------------
# Blocks (.bky)
# --------------------------------------------------------------------------

_block_ids = count(1)


def _mutation(attrs=None, children=()):
    m = ET.Element("mutation", {k: str(v) for k, v in (attrs or {}).items()})
    for tag, name in children:
        ET.SubElement(m, tag, name=name)
    return m


def chain(stmts):
    """Link a list of statement blocks with <next>; returns the first one."""
    stmts = [s for s in stmts if s is not None]
    for a, b in zip(stmts, stmts[1:]):
        ET.SubElement(a, "next").append(b)
    return stmts[0] if stmts else None


def block(btype, mutation=None, fields=None, values=None, statements=None, xy=None):
    attrs = {"type": btype, "id": f"b{next(_block_ids)}"}
    if xy:
        attrs["x"], attrs["y"] = str(xy[0]), str(xy[1])
    b = ET.Element("block", attrs)
    if mutation is not None:
        b.append(mutation)
    for name, val in (fields or {}).items():
        ET.SubElement(b, "field", name=name).text = str(val)
    for name, child in (values or {}).items():
        ET.SubElement(b, "value", name=name).append(child)
    for name, stmts in (statements or {}).items():
        first = chain(stmts)
        if first is not None:
            ET.SubElement(b, "statement", name=name).append(first)
    return b


# --- literals -------------------------------------------------------------
def num(n):
    return block("math_number", fields={"NUM": n})


def txt(s):
    return block("text", fields={"TEXT": s})


def boolean(v: bool):
    return block("logic_boolean", fields={"BOOL": "TRUE" if v else "FALSE"})


def empty_list():
    return block("lists_create_with", _mutation({"items": 0}))


# --- variables ------------------------------------------------------------
def global_decl(name, value, xy):
    return block("global_declaration", fields={"NAME": name}, values={"VALUE": value}, xy=xy)


def gget(name):
    return block("lexical_variable_get", fields={"VAR": f"global {name}"})


def gset(name, value):
    return block("lexical_variable_set", fields={"VAR": f"global {name}"}, values={"VALUE": value})


def lget(name):
    """Get a procedure parameter or local variable."""
    return block("lexical_variable_get", fields={"VAR": name})


def lset(name, value):
    return block("lexical_variable_set", fields={"VAR": name}, values={"VALUE": value})


def event_param(name):
    return block("lexical_variable_get", _mutation(children=[("eventparam", name)]),
                 fields={"VAR": name})


def local_stmt(name, init, body):
    """initialize local <name> to <init> in <body statements>"""
    return block("local_declaration_statement", _mutation(children=[("localname", name)]),
                 fields={"VAR0": name}, values={"DECL0": init}, statements={"STACK": body})


def local_expr(name, init, result):
    """initialize local <name> to <init> in <result expression>"""
    return block("local_declaration_expression", _mutation(children=[("localname", name)]),
                 fields={"VAR0": name}, values={"DECL0": init, "RETURN": result})


# --- control --------------------------------------------------------------
def if_(*branches, else_=None):
    """if_((cond, [stmts]), (cond, [stmts]), ..., else_=[stmts])"""
    attrs = {}
    if len(branches) > 1:
        attrs["elseif"] = len(branches) - 1
    if else_:
        attrs["else"] = 1
    values, statements = {}, {}
    for i, (cond, body) in enumerate(branches):
        values[f"IF{i}"] = cond
        statements[f"DO{i}"] = body
    if else_:
        statements["ELSE"] = else_
    return block("controls_if", _mutation(attrs), values=values, statements=statements)


def choose(test, then, otherwise):
    """Inline if-then-else expression."""
    return block("controls_choose", values={"TEST": test, "THENRETURN": then, "ELSERETURN": otherwise})


def while_(test, body):
    return block("controls_while", values={"TEST": test}, statements={"DO": body})


def do_result(stmts, result):
    return block("controls_do_then_return", statements={"STM": stmts}, values={"VALUE": result})


# --- logic ----------------------------------------------------------------
def eq(a, b):
    return block("logic_compare", fields={"OP": "EQ"}, values={"A": a, "B": b})


def neq(a, b):
    return block("logic_compare", fields={"OP": "NEQ"}, values={"A": a, "B": b})


def not_(x):
    return block("logic_negate", values={"BOOL": x})


def and_(a, b):
    return block("logic_operation", _mutation({"items": 2}), fields={"OP": "AND"}, values={"A": a, "B": b})


def or_(a, b):
    return block("logic_operation", _mutation({"items": 2}), fields={"OP": "OR"}, values={"A": a, "B": b})


# --- math -----------------------------------------------------------------
def mcmp(op, a, b):
    """op: EQ NEQ LT LTE GT GTE"""
    return block("math_compare", fields={"OP": op}, values={"A": a, "B": b})


def add(a, b):
    return block("math_add", _mutation({"items": 2}), values={"NUM0": a, "NUM1": b})


def mul(a, b):
    return block("math_multiply", _mutation({"items": 2}), values={"NUM0": a, "NUM1": b})


def sub(a, b):
    return block("math_subtract", values={"A": a, "B": b})


def div(a, b):
    return block("math_division", values={"A": a, "B": b})


def format_decimal(n, places):
    return block("math_format_as_decimal", values={"NUM": n, "PLACES": places})


# --- text -----------------------------------------------------------------
def join(*parts):
    return block("text_join", _mutation({"items": len(parts)}),
                 values={f"ADD{i}": p for i, p in enumerate(parts)})


def length(t):
    return block("text_length", values={"VALUE": t})


def segment(t, start, n):
    return block("text_segment", values={"TEXT": t, "START": start, "LENGTH": n})


def contains(t, piece):
    return block("text_contains", _mutation({"mode": "CONTAINS"}), fields={"OP": "CONTAINS"},
                 values={"TEXT": t, "PIECE": piece})


# --- lists ----------------------------------------------------------------
def list_insert(lst, index, item):
    return block("lists_insert_item", values={"LIST": lst, "INDEX": index, "ITEM": item})


def list_remove(lst, index):
    return block("lists_remove_item", values={"LIST": lst, "INDEX": index})


def list_length(lst):
    return block("lists_length", values={"LIST": lst})


# --- components -----------------------------------------------------------
def event(ctype, inst, name, body, xy):
    return block("component_event",
                 _mutation({"component_type": ctype, "is_generic": "false",
                            "instance_name": inst, "event_name": name}),
                 fields={"COMPONENT_SELECTOR": inst}, statements={"DO": body}, xy=xy)


def generic_event(ctype, name, body, xy):
    """when any <ctype>.<name>  (params: component, notAlreadyHandled, ...)"""
    return block("component_event",
                 _mutation({"component_type": ctype, "is_generic": "true", "event_name": name}),
                 statements={"DO": body}, xy=xy)


def prop_get(ctype, inst, prop):
    return block("component_set_get",
                 _mutation({"component_type": ctype, "set_or_get": "get", "property_name": prop,
                            "is_generic": "false", "instance_name": inst}),
                 fields={"COMPONENT_SELECTOR": inst, "PROP": prop})


def prop_set(ctype, inst, prop, value):
    return block("component_set_get",
                 _mutation({"component_type": ctype, "set_or_get": "set", "property_name": prop,
                            "is_generic": "false", "instance_name": inst}),
                 fields={"COMPONENT_SELECTOR": inst, "PROP": prop}, values={"VALUE": value})


def generic_prop_get(ctype, prop, comp):
    return block("component_set_get",
                 _mutation({"component_type": ctype, "set_or_get": "get", "property_name": prop,
                            "is_generic": "true"}),
                 fields={"PROP": prop}, values={"COMPONENT": comp})


def method(ctype, inst, name, *args):
    """Component method call; works both as a statement and as an expression."""
    return block("component_method",
                 _mutation({"component_type": ctype, "method_name": name,
                            "is_generic": "false", "instance_name": inst}),
                 fields={"COMPONENT_SELECTOR": inst},
                 values={f"ARG{i}": a for i, a in enumerate(args)})


# --- procedures -----------------------------------------------------------
_proc_params = {}


def proc(name, params, body, xy):
    _proc_params[name] = params
    return block("procedures_defnoreturn", _mutation(children=[("arg", p) for p in params]),
                 fields={"NAME": name, **{f"VAR{i}": p for i, p in enumerate(params)}},
                 statements={"STACK": body}, xy=xy)


def proc_ret(name, params, result, xy):
    _proc_params[name] = params
    return block("procedures_defreturn", _mutation(children=[("arg", p) for p in params]),
                 fields={"NAME": name, **{f"VAR{i}": p for i, p in enumerate(params)}},
                 values={"RETURN": result}, xy=xy)


def _call(btype, name, args, params):
    return block(btype, _mutation({"name": name}, [("arg", p) for p in params]),
                 fields={"PROCNAME": name}, values={f"ARG{i}": a for i, a in enumerate(args)})


def call(name, *args, params=None):
    return _call("procedures_callnoreturn", name, args, params or _proc_params.get(name, []))


def call_ret(name, *args, params=None):
    return _call("procedures_callreturn", name, args, params or _proc_params.get(name, []))


def build_bky(top_blocks) -> str:
    root = ET.Element("xml", {"xmlns": "http://www.w3.org/1999/xhtml"})
    for b in top_blocks:
        root.append(b)
    ET.SubElement(root, "yacodeblocks",
                  {"ya-version": YA_VERSION, "language-version": BLOCKS_LANGUAGE_VERSION})
    ET.indent(root, space="  ")
    return ET.tostring(root, encoding="unicode", short_empty_elements=False) + "\n"


# --------------------------------------------------------------------------
# Validation + packaging
# --------------------------------------------------------------------------

def validate(scm_children, bky_xml: str):
    """Check that blocks only reference components/procedures that exist."""
    comps = {c["$Name"]: c["$Type"] for c in iter_components(scm_children)}
    comps["Screen1"] = "Form"
    # Drop the default namespace so tags match plain names like "block"
    root = ET.fromstring(bky_xml.replace(' xmlns="http://www.w3.org/1999/xhtml"', "", 1))
    errors = []
    defined = {f.text for b in root.iter("block")
               if b.get("type") in ("procedures_defnoreturn", "procedures_defreturn")
               for f in b.findall("field") if f.get("name") == "NAME"}
    for m in root.iter("mutation"):
        inst, ctype = m.get("instance_name"), m.get("component_type")
        if inst and comps.get(inst) != ctype:
            errors.append(f"block references {ctype} '{inst}', designer has {comps.get(inst)}")
        if m.get("name") and m.get("name") not in defined:
            errors.append(f"call to undefined procedure '{m.get('name')}'")
    if errors:
        raise ValueError("\n".join(errors))
    return len(list(root.iter("block")))


def project_properties(project_id: str, display_name: str) -> str:
    return (
        f"main=appinventor.ai_{USER}.{project_id}.Screen1\n"
        f"name={project_id}\n"
        "assets=../assets\nsource=../src\nbuild=../build\n"
        "versioncode=1\nversionname=1.0\nuseslocation=False\n"
        f"aname={display_name}\n"
        "sizing=Responsive\nshowlistsasjson=True\nactionbar=False\n"
        "theme=AppTheme.Light.DarkActionBar\n"
        "color.primary=&HFF3F51B5\ncolor.primary.dark=&HFF303F9F\ncolor.accent=&HFFFF9800\n"
    )


def write_aia(path, project_id, display_name, scm: str, bky: str):
    pkg = f"src/appinventor/ai_{USER}/{project_id}"
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("youngandroidproject/project.properties",
                    project_properties(project_id, display_name))
        zf.writestr(f"{pkg}/Screen1.scm", scm.encode("utf-8"))
        zf.writestr(f"{pkg}/Screen1.bky", bky.encode("utf-8"))
        zf.writestr("assets/.keep", "")
    with open(path, "wb") as f:
        f.write(buf.getvalue())
