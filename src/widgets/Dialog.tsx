import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import GObject from "gi://GObject?version=2.0";
import { getter, gtype, register, setter } from "gnim/gobject";
import { Dialog as VibeDialog } from "libvibe/interfaces";
import { omitObjectKeys } from "../modules/util";


@register({ GTypeName: "VibeDialog" })
export class Dialog extends Adw.Dialog implements VibeDialog {
    declare readonly $readWriteProperties: Dialog.ReadWriteProperties;
    declare readonly $signals: Dialog.SignalSignatures;
    declare readonly $constructOnlyProperties: Dialog.ConstructOnlyProperties;

    #childBin: Adw.Bin;
    #content: string|Gtk.Widget|null = null;

    @getter(gtype<string|Gtk.Widget|null>(GObject.TYPE_JSOBJECT))
    get content() { return this.#content; }

    @setter(gtype<string|Gtk.Widget|null>(GObject.TYPE_JSOBJECT))
    set content(newValue: string|Gtk.Widget|null) {
        if(typeof newValue === "string") {
            const child = this.#childBin.get_child();

            if(child && child instanceof Gtk.Label) {
                child.set_label(newValue);
                this.notify("content");
                return;
            }

            this.#childBin.set_child(
                Gtk.Label.new(newValue)
            );
            this.notify("content");

            return;
        }

        this.#childBin.set_child(newValue);
        this.notify("content");
    }


    constructor(props: Partial<GObject.ConstructorProps<Dialog>>) {
        super(omitObjectKeys(props, ["content"]));

        this.#childBin = Adw.Bin.new();

        if(props.content !== undefined)
            this.content = props.content;

        this.set_child(
            <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
                <Adw.HeaderBar class={"flat"} />
                {this.#childBin}
            </Gtk.Box> as Gtk.Box
        );
    }
}

export namespace Dialog {
    export type ConstructOnlyProperties = Adw.Dialog.ConstructOnlyProperties & VibeDialog;
    export interface ReadWriteProperties extends Adw.Dialog.ReadWriteProperties {
        content: string|Gtk.Widget|null;
    }
    export interface SignalSignatures extends Adw.Dialog.SignalSignatures {
        "notify::content": () => void;
    }
}
