import Gtk from "gi://Gtk?version=4.0";
import GObject, { getter, gtype, register, setter } from "gnim/gobject";
import { omitObjectKeys } from "../modules/util";
import { Image as VibeImage } from "libvibe/utils";


/** an abstraction made on top of `GtkPicture` to support libvibe `Image` objects.
  * this widget can be styled with the css name `vibeimage` */
@register({ GTypeName: "VibeImageWidget" })
export class Image extends Gtk.Picture {
    declare $signals: Image.SignalSignatures;
    #image: VibeImage|null = null;

    /** a libvibe `Image` object, containing the image's source */
    @getter(gtype<VibeImage|null>(GObject.Object))
    get image() { return this.#image; }

    @setter(gtype<VibeImage|null>(GObject.Object))
    set image(newImage: VibeImage|null) {
        this.#image = newImage;
        this.notify("image");

        this.setupImage();
    }

    constructor(props: Partial<Image.ConstructorProps>) {
        super({
            cssName: "vibeimage",
            ...omitObjectKeys(props, [
                "image"
            ])
        });

        if(props.image !== undefined) {
            this.#image = props.image;
            this.setupImage();
        }

        this.image?.ref();
        const id = this.connect("destroy", () => {
            this.disconnect(id);
            this.image?.unref();
        });
    }

    setupImage(): void {
        if(!this.image) {
            if(this.get_paintable())
                this.set_paintable(null); // unset picture if image is null

            return;
        }

        const texture = this.image.texture;
        if(!texture) {
            if(this.get_paintable()) {
                this.set_paintable(texture);
                return;
            }

            if(this.image.source)
                this.image.load().then(() => this.setupImage()); // load image back into memory from its source

            return;
        }

        this.set_paintable(texture);
    }

    connect<S extends keyof Image.SignalSignatures>(
        signal: S, 
        callback: (self: Image, ...params: Parameters<Image.SignalSignatures[S]>) => ReturnType<Image.SignalSignatures[S]>
    ): number {
        return super.connect(signal, callback);
    }
}

export namespace Image {
    export interface ConstructorProps extends Gtk.Picture.ConstructorProps {
        image: VibeImage;
    }

    export interface SignalSignatures extends Gtk.Picture.SignalSignatures {
        "notify::image": () => void;
    }
}
