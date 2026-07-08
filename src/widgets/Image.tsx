import Gtk from "gi://Gtk?version=4.0";
import GObject from "gi://GObject?version=2.0";
import { getter, gtype, register, setter } from "gnim/gobject";
import { omitObjectKeys } from "../modules/util";
import { Image as VibeImage } from "libvibe/utils";
import GLib from "gi://GLib?version=2.0";


/** an abstraction made on top of `GtkPicture` to support libvibe `Image` objects.
  * this widget can be styled with the css name `vibeimage` */
@register({ GTypeName: "VibeImageWidget" })
export class Image extends Gtk.Picture {
    declare readonly $signals: Image.SignalSignatures;
    declare readonly $readWriteProperties: Image.ReadWriteProperties;

    #image: VibeImage|null = null;

    /** a libvibe `Image` object, containing the image's source */
    @getter(gtype<VibeImage|null>(GObject.Object))
    get image() { return this.#image; }

    @setter(gtype<VibeImage|null>(GObject.Object))
    set image(newImage: VibeImage|null) {
        this.#image = newImage;
        this.notify("image");

        this.load().catch(console.error);
    }

    constructor(props: Partial<GObject.ConstructorProps<Image>>) {
        super({
            cssName: "vibeimage",
            ...omitObjectKeys(props, [
                "image"
            ])
        });

        if(props.image !== undefined)
            this.image = props.image;

        const connections: Array<number> = [
            (this as Image).connect("map", () => {
                this.load().catch(console.error);
            }),
            (this as Image).connect("unmap", () => {
                this.unload();
            }),
            (this as Image).connect("destroy", () => {
                connections.forEach(id => this.disconnect(id));
                this.unload();
            })
        ];
    }

    async load(): Promise<void> {
        if(!this.image || this.image.source == null) {
            this.unload();
            return;
        }

        const texture = await this.image.load();
        this.image.use();

        GLib.idle_add(GLib.PRIORITY_LOW, () => {
            this.set_paintable(texture);
            return GLib.SOURCE_REMOVE;
        });
    }

    unload(): void {
        if(!this.paintable || !this.image)
            return;

        this.image.drop();
        GLib.idle_add(GLib.PRIORITY_LOW, () => {
            this.paintable = null;
            return GLib.SOURCE_REMOVE;
        });
    }
}

export namespace Image {
    export interface ReadWriteProperties extends Gtk.Picture.ReadWriteProperties {
        image: VibeImage;
    }

    export interface SignalSignatures extends Gtk.Picture.SignalSignatures {
        "notify::image": () => void;
    }
}
