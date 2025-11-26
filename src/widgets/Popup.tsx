import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import { createBinding, createRoot, getScope, Scope, With } from "gnim";
import { getter, gtype, property, register } from "gnim/gobject";
import { omitObjectKeys } from "../modules/util";
import { App } from "../app";



export type PopupProps = {
    hideOnClose?: boolean;
    content?: Gtk.Widget|null;
} & Partial<Omit<Adw.Dialog.ConstructorProps, 
    "canClose"
    | "can_close"
>>;


@register({ GTypeName: "VibePopup" })
export class Popup extends Adw.Dialog {

    #scope!: Scope;
    #containerWidget!: Gtk.Box;

    /** hides the popup instead of closing it when clicking the close button */
    @property(Boolean)
    hideOnClose: boolean = false;

    @getter(Gtk.Box)
    get containerWidget() { return this.#containerWidget; }

    @property(gtype<Gtk.Widget|null>(Gtk.Widget))
    content: Gtk.Widget|null = null;

    constructor(props: PopupProps) {
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

        createRoot(() => {
            this.#scope = getScope();
            this.#containerWidget = <Gtk.Box class={"container"}>
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

    vfunc_dispose(): void {
        this.#scope.dispose();
    }

    /** shortcut to AdwDialog.present(), shows the popup dialog */
    popup(): void {
        this.present(App.get_default().get_main_window());

        const id = this.connect("closed", () => {
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
            this.hide();
            return true;
        }

        super.close();
        return true;
    }
}
