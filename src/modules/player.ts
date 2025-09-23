import GObject from "gi://GObject?version=2.0";
import Gst from "gi://Gst?version=1.0";
import { register } from "gnim/gobject";


/** a more "low-level" player controller for streams and audio output 
    * @todo */
@register({ GTypeName: "VibePlayer" })
export class Player extends GObject.Object {

    constructor() {
        super();

        Gst.init(null);
    }
}
