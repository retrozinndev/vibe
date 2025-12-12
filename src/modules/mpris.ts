import Gio from "gi://Gio?version=2.0";
import { register } from "gnim/gobject";


@register({ GTypeName: "VibeMpris" })
export class Mpris extends Gio.DBusObject {
    
}
