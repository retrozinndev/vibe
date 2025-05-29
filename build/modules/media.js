// src/modules/media.ts
import GObject from "gi://GObject?version=2.0";
var Media = GObject.registerClass({
  GTypeName: "Media",
  Properties: {
    "playing": GObject.ParamSpec.boolean(
      "playing",
      "Is playing",
      "A boolean value that represents if there's a controllable media available (playing or paused)",
      GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
      false
    )
  }
}, class _Media extends GObject.Object {
  constructor() {
    super();
  }
  _init(...args) {
    super._init(...args);
  }
  connect(signal, callback) {
    return super.connect(signal, callback);
  }
});
export {
  Media
};
