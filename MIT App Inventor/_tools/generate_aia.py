#!/usr/bin/env python3
"""
Generates minimal, valid MIT App Inventor .aia starter project files.

An .aia is a ZIP archive with this layout:
  youngandroidproject/project.properties
  src/appinventor/ai_<user>/<ProjectName>/Screen1.scm
  src/appinventor/ai_<user>/<ProjectName>/Screen1.bky
  assets/                (empty dir, placeholder)

Screen1.scm defines the component tree (JSON-ish, App Inventor's own format).
Screen1.bky defines the blocks (Blockly XML) - empty/starter here since the
actual logic is meant to be built by hand in the App Inventor editor.

Usage: python generate_aia.py
Reads project specs from PROJECTS list below and writes one .aia per project
into "../<Project Name>/<Project Name>.aia" (relative to this script's
--out-root, defaulting to the MIT App Inventor category folder).
"""
import io
import os
import zipfile
import argparse

# App Inventor project.properties template
PROJECT_PROPERTIES_TMPL = """main=appinventor.ai_{user}.{project}.Screen1
name={display_name}
assets=../assets
source=../src
build=../build
versioncode=1
versionname=1.0
useslocation=False
aname={display_name}
sizing=Responsive
showlistsasjson=True
actionbar=False
theme=AppTheme.Light.DarkActionBar
primarycolor=&H3F51B5&
primarycolordark=&H303F9F&
accentcolor=&HFF4081&
"""

# Minimal single-Screen1 .scm: just a Form with a title Label as a starting point.
SCM_TMPL = """#|
$JSON
{{
  "authURL": [],
  "YaVersion": "233",
  "Source": "Form",
  "Properties": {{
    "$Name": "Screen1",
    "$Type": "Form",
    "$Version": "31",
    "AppName": "{display_name}",
    "Title": "{display_name}",
    "Uuid": "0",
    "$Components": [
      {{
        "$Name": "TitleLabel",
        "$Type": "Label",
        "$Version": "5",
        "Text": "{display_name}",
        "FontSize": "20.0",
        "FontBold": "True",
        "Uuid": "1"
      }}
    ]
  }}
}}
|#
"""

# Empty starter blocks canvas (valid Blockly XML, no blocks placed yet).
BKY_TMPL = """<xml xmlns="http://www.w3.org/1999/xml"></xml>
"""

USER = "prdgmcreatives2_gmail_com"  # sanitized identifier used in package path


def sanitize_project_id(name: str) -> str:
    """App Inventor internal project identifiers must be alnum/underscore, start with a letter."""
    cleaned = "".join(c if c.isalnum() else "_" for c in name)
    if not cleaned or not cleaned[0].isalpha():
        cleaned = "App_" + cleaned
    return cleaned


def build_aia_bytes(display_name: str) -> bytes:
    project_id = sanitize_project_id(display_name)
    pkg_path = f"src/appinventor/ai_{USER}/{project_id}"

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(
            "youngandroidproject/project.properties",
            PROJECT_PROPERTIES_TMPL.format(user=USER, project=project_id, display_name=display_name),
        )
        zf.writestr(
            f"{pkg_path}/Screen1.scm",
            SCM_TMPL.format(display_name=display_name),
        )
        zf.writestr(f"{pkg_path}/Screen1.bky", BKY_TMPL)
        # placeholder so the assets dir exists in the archive
        zf.writestr("assets/.keep", "")
    return buf.getvalue()


# Source: "Arduino & MIT App Inventor - 250 Portfolio Projects" guide,
# Part I - MIT App Inventor, Basic Apps section, #01-#50 (this covers #01-#20).
# File: OneDrive\Desktop\Zips\Guides to web development projects\MIT_AppInventor_100_Projects.pdf
PROJECTS = [
    ("01", "Calculator", "Basic arithmetic with a clean UI."),
    ("02", "To-Do List", "Add, check, and delete daily tasks."),
    ("03", "Quiz App", "Multiple-choice quiz with scoring."),
    ("04", "Flashcard Viewer", "Study cards with flip animation."),
    ("05", "BMI Calculator", "Compute body mass index from inputs."),
    ("06", "Unit Converter", "Convert km, miles, kg, lbs, etc."),
    ("07", "Stopwatch", "Start, stop, and lap timer."),
    ("08", "Alarm Clock", "Set and trigger audio alarms."),
    ("09", "Digital Clock", "Live display of current time."),
    ("10", "Countdown Timer", "Countdown to a specific event."),
    ("11", "Tip Calculator", "Split bills and calculate tips."),
    ("12", "Age Calculator", "Compute exact age from birthdate."),
    ("13", "Note-Taking App", "Save and retrieve text notes."),
    ("14", "Paint / Drawing App", "Draw with finger on canvas."),
    ("15", "Flashlight App", "Turn on/off the phone camera flash."),
    ("16", "Voice Recorder", "Record and replay audio clips."),
    ("17", "Text-to-Speech", "Convert typed text to voice output."),
    ("18", "Speech-to-Text", "Transcribe spoken words to text."),
    ("19", "Weather App", "Fetch live weather via API."),
    ("20", "Currency Converter", "Live exchange rates from web API."),
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--out-root",
        default=r"C:\Users\Admin\100-days-of-code\MIT App Inventor",
        help="Category root to create project folders under.",
    )
    args = parser.parse_args()

    os.makedirs(args.out_root, exist_ok=True)

    created = []
    for num, name, desc in PROJECTS:
        # Windows-safe name for folder/file paths (name itself may contain "/" etc,
        # e.g. "Paint / Drawing App"); the display name in content stays unescaped.
        safe_name = "".join(c for c in name if c not in r'\/:*?"<>|').strip()
        safe_name = " ".join(safe_name.split())  # collapse extra spaces left by removal

        folder_name = f"{num} - {safe_name}"
        folder_path = os.path.join(args.out_root, folder_name)
        os.makedirs(folder_path, exist_ok=True)

        aia_bytes = build_aia_bytes(name)
        aia_path = os.path.join(folder_path, f"{safe_name}.aia")
        with open(aia_path, "wb") as f:
            f.write(aia_bytes)

        readme_path = os.path.join(folder_path, "README.md")
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(f"# {num} - {name}\n\n{desc}\n\n"
                     f"**Status:** starter skeleton generated, not yet built in App Inventor.\n\n"
                     f"To continue: import `{safe_name}.aia` into MIT App Inventor "
                     f"(File > Import project (.aia) from my computer), then build out the blocks.\n")

        created.append((num, name, aia_path))
        print(f"Created: {folder_path}")

    print(f"\nDone. {len(created)} project folders created under: {args.out_root}")


if __name__ == "__main__":
    main()
