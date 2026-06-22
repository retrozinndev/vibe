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

        this.load();
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

        const id = (this as Image).connect("destroy", () => {
            this.disconnect(id);
            this.unload();
        });
    }

    load(): void {
        if(!this.image) {
            this.set_paintable(null);
            return;
        }

        const texture = this.image.texture;
        this.image.ref();

        if(!texture) {
            if(this.get_paintable()) {
                GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                    this.set_paintable(texture);
                    return GLib.SOURCE_REMOVE;
                });

                return;
            }

            if(this.image.source || this.image.hasCacheFile) {
                this.image.load().then(() => this.load())
                    .catch(console.error);
            }

            return;
        }

        GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            this.set_paintable(texture);
            return GLib.SOURCE_REMOVE;
        });
    }

    unload(): void {
        this.image?.unref();
        this.set_paintable(null);
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
