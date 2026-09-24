# MIT App Inventor Reference

Quick reference for generating `.aia` projects in this folder: designer components
(`.scm`) and blocks (`.bky`) can be written as text, so the UI does not have to be
dragged in by hand in the Designer.

## Links

| What | URL |
|---|---|
| App Inventor editor (my account) | https://ai2a.appinventor.mit.edu/ |
| Library / docs hub | https://appinventor.mit.edu/explore/library |
| Component reference | https://ai2a.appinventor.mit.edu/reference/components/ |
| Blocks reference | https://ai2a.appinventor.mit.edu/reference/blocks/ |
| Community forum | https://community.appinventor.mit.edu |
| Source code (formats, block types) | https://github.com/mit-cml/appinventor-sources |

`ai2.appinventor.mit.edu` redirects to `ai2a.appinventor.mit.edu`.

## `.aia` file layout

An `.aia` is a ZIP archive:

```
youngandroidproject/project.properties         app name, theme, colors, version
src/appinventor/ai_<user>/<Project>/Screen1.scm   Designer: component tree (JSON)
src/appinventor/ai_<user>/<Project>/Screen1.bky   Blocks: logic (Blockly XML)
assets/                                          images, sounds, fonts
```

- Each extra screen adds its own `ScreenN.scm` + `ScreenN.bky` pair.
- Skeleton generator: `_tools/generate_aia.py` (only a title label and empty blocks).
  **Re-running it overwrites every project's `.aia`, including fully built ones.**
- Full builds: `_tools/aia_lib.py` (component + block helpers, reference validator, zip writer)
  plus one `build_<project>.py` per app, e.g. `_tools/build_calculator.py`.
- Import: App Inventor → **Projects → Import project (.aia) from my computer**.

## Palette: components by category

The `$Type` in `.scm` is the component name exactly as listed.

| Palette category | Components |
|---|---|
| **User Interface** | Button, CheckBox, CircularProgress, DatePicker, Image, Label, LinearProgress, ListPicker, ListView, Notifier, PasswordTextBox, Screen, Slider, Spinner, Switch, TextBox, TimePicker, WebViewer |
| **Layout** | AbsoluteArrangement, HorizontalArrangement, HorizontalScrollArrangement, TableArrangement, VerticalArrangement, VerticalScrollArrangement |
| **Media** | Camcorder, Camera, FilePicker, ImagePicker, Player, Sound, SoundRecorder, SpeechRecognizer, TextToSpeech, Translator, VideoPlayer |
| **Drawing and Animation** | Ball, Canvas, ImageSprite |
| **Maps** | Circle, FeatureCollection, LineString, Map, Marker, Navigation, Polygon, Rectangle |
| **Charts** | Chart, ChartData2D, Trendline |
| **Data Science** | AnomalyDetection, Regression |
| **Sensors** | AccelerometerSensor, BarcodeScanner, Barometer, Clock, GyroscopeSensor, Hygrometer, LightSensor, LocationSensor, MagneticFieldSensor, NearField, OrientationSensor, Pedometer, ProximitySensor, Thermometer |
| **Social** | ContactPicker, EmailPicker, PhoneCall, PhoneNumberPicker, Sharing, Texting |
| **Storage** | CloudDB, DataFile, File, Spreadsheet, TinyDB, TinyWebDB |
| **Connectivity** | ActivityStarter, BluetoothClient, BluetoothServer, Serial, Web |
| **LEGO® MINDSTORMS®** | Ev3ColorSensor, Ev3Commands, Ev3GyroSensor, Ev3Motors, Ev3Sound, Ev3TouchSensor, Ev3UI, Ev3UltrasonicSensor, NxtColorSensor, NxtDirectCommands, NxtDrive, NxtLightSensor, NxtSoundSensor, NxtTouchSensor, NxtUltrasonicSensor |
| **Experimental** | ChatBot, FirebaseDB, ImageBot |
| **Extension** | Third-party `.aix` files (e.g. flashlight control); imported per project |

Non-visible components (Clock, TinyDB, Web, Sound, Notifier, sensors, and so on) sit
in the same `$Components` list as visible ones. They just don't render on screen.

## Designer: `Screen1.scm`

JSON wrapped in `#| $JSON ... |#`. Components nest via `$Components`, and every
component needs a unique `$Name` and `Uuid`.

```json
#|
$JSON
{"authURL":[],"YaVersion":"233","Source":"Form","Properties":{
  "$Name":"Screen1","$Type":"Form","$Version":"31","AppName":"Calculator","Title":"Calculator","Uuid":"0",
  "$Components":[
    {"$Name":"Display","$Type":"Label","$Version":"5","Text":"0","FontSize":"36","TextAlignment":"2","Width":"-2","Uuid":"1"},
    {"$Name":"Row1","$Type":"HorizontalArrangement","$Version":"4","Width":"-2","Uuid":"2","$Components":[
      {"$Name":"Btn7","$Type":"Button","$Version":"7","Text":"7","Width":"-2","Uuid":"3"}
    ]},
    {"$Name":"HistoryDB","$Type":"TinyDB","$Version":"2","Namespace":"Calculator","Uuid":"4"}
  ]}}
|#
```

Special values: `Width`/`Height` `-1` = automatic, `-2` = fill parent, `-10xx` = xx percent.
Colors are `&HAARRGGBB` (e.g. `&HFF3F51B5`). Booleans are the strings `"True"`/`"False"`.

## Blocks: `Screen1.bky`

Blockly XML. Common block types:

| Block | `type` | Key `<mutation>` attributes |
|---|---|---|
| when X.Event | `component_event` | `component_type`, `instance_name`, `event_name` |
| when any X.Event | `component_event` | `component_type`, `is_generic="true"`, `event_name` |
| set/get X.Property | `component_set_get` | `component_type`, `set_or_get`, `property_name`, `instance_name`, `is_generic` |
| call X.Method | `component_method` | `component_type`, `method_name`, `instance_name`, `is_generic` |
| component reference | `component_component_block` | `component_type`, `instance_name` |
| global variable | `global_declaration` | field `NAME` |
| get/set variable | `lexical_variable_get` / `lexical_variable_set` | field `VAR` (`global name`) |
| procedure | `procedures_defnoreturn` / `procedures_defreturn` | `<arg name="..."/>` |
| if / else | `controls_if` | `else="1"`, `elseif="n"` |
| text, number | `text`, `math_number` | fields `TEXT`, `NUM` |
| join | `text_join` | `items="n"` |
| arithmetic | `math_add`, `math_subtract`, `math_multiply`, `math_division` | |
| compare | `math_compare`, `logic_compare`, `text_compare` | field `OP` |

Example: *when Btn7.Click, set Display.Text to join(Display.Text, "7")*

```xml
<xml xmlns="http://www.w3.org/1999/xhtml">
  <block type="component_event" x="20" y="20">
    <mutation component_type="Button" is_generic="false" instance_name="Btn7" event_name="Click"></mutation>
    <field name="COMPONENT_SELECTOR">Btn7</field>
    <statement name="DO">
      <block type="component_set_get">
        <mutation component_type="Label" set_or_get="set" property_name="Text" is_generic="false" instance_name="Display"></mutation>
        <field name="COMPONENT_SELECTOR">Display</field>
        <field name="PROP">Text</field>
        <value name="VALUE">
          <block type="text_join">
            <mutation items="2"></mutation>
            <value name="ADD0">
              <block type="component_set_get">
                <mutation component_type="Label" set_or_get="get" property_name="Text" is_generic="false" instance_name="Display"></mutation>
                <field name="COMPONENT_SELECTOR">Display</field>
                <field name="PROP">Text</field>
              </block>
            </value>
            <value name="ADD1"><block type="text"><field name="TEXT">7</field></block></value>
          </block>
        </value>
      </block>
    </statement>
  </block>
  <yacodeblocks ya-version="233" language-version="37"></yacodeblocks>
</xml>
```

Blocks need `x`/`y` on top-level blocks only. If they overlap, use right-click → **Arrange Blocks Vertically**.

## Gotchas

- **Versions:** App Inventor upgrades older `YaVersion` / component `$Version` values on
  import but rejects newer ones. When unsure, export a real project from the editor and
  copy its numbers.
- **Names must match:** `instance_name` in blocks must equal a `$Name` in the `.scm`.
- **Generic events** (`when any Button.Click`) replace dozens of per-button handlers.
- **Always test** by importing the `.aia` into the editor; a malformed file fails to open.
- **Flashlight** needs an extension (`.aix`); there is no built-in torch component.
