import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import GObject from "gi://GObject?version=2.0";
import { createBinding, createRoot, With } from "gnim";
import { getter, gtype, property, register } from "gnim/gobject";
import { omitObjectKeys } from "../modules/util";
import { App } from "../app";


@register({ GTypeName: "VibePopup" })
export class Popup extends Adw.Dialog {
    declare readonly $readableProperties: Popup.ReadableProperties;
    declare readonly $signals: Popup.SignalSignatures;
    declare readonly $readWriteProperties: Popup.ReadWriteProperties;

    #containerWidget!: Gtk.Box;

    /** hides the popup instead of closing it when clicking the close button */
    @property(Boolean)
    hideOnClose: boolean = false;

    @getter(Gtk.Box)
    get containerWidget() { return this.#containerWidget; }

    @property(gtype<Gtk.Widget|null>(Gtk.Widget))
    content: Gtk.Widget|null = null;

    constructor(props: Partial<GObject.ConstructorProps<Popup>>) {
        super({
            cssName: "popup",
            canClose: true,
            ...omitObjectKeys(props, [
                "hideOnClose", 
                "child"
            ])
        });

        if(props.hideOnClose !== undefined)
            this.hideOnClose = props.hideOnClose;

        if(props.content != null)
            this.content = props.content;

        createRoot((dispose) => {
            this.#containerWidget = <Gtk.Box class={"container"} onDestroy={() => dispose()}>
                <With value={createBinding(this, "content")}>
                    {(content: Gtk.Widget|null) => content}
                </With>
            </Gtk.Box> as Gtk.Box;

            super.set_child(
                <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
                    <Gtk.HeaderBar class={"flat"}>
                        <Gtk.Label class={"heading"} label={createBinding(this, "title")} 
                          $type="title"
                        />
                    </Gtk.HeaderBar>
                    {this.#containerWidget}
                </Gtk.Box> as Gtk.Box
            );
        });
    }

    /** shortcut to AdwDialog.present(), shows the popup dialog */
    popup(): void {
        this.present(App.get_default().get_main_window());

        const id = (this as Popup).connect("closed", () => {
            this.disconnect(id);
            setTimeout(() => 
                this.run_dispose(),
            300);
        });
    }

    /** closes the popup.
      * if :hide-on-close is TRUE, the popup is hidden instead 
      *
      * @returns true if closed successfully, false if :can-close is not enabled
      */
    close(): boolean {
        if(!this.canClose)
            return false;

        if(this.hideOnClose && this.visible) {
            this.set_visible(false);
            return true;
        }

        super.close();
        return true;
    }
}

export namespace Popup {
    export interface SignalSignatures extends Adw.Dialog.SignalSignatures {
        "notify::hide-on-close"(): void;
        "notify::container-widget"(): void;
        "notify::content"(): void;
    }

    export interface ReadableProperties extends Adw.Dialog.ReadableProperties {
        "container-widget": Gtk.Box;
    }

    export interface ReadWriteProperties extends Adw.Dialog.ReadWriteProperties {
        "hide-on-close": boolean;
        "content": Gtk.Widget|null;
    }
}
