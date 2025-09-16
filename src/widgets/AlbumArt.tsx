import Gtk from "gi://Gtk?version=4.0";
import Media from "../modules/media";

import { createBinding } from "gnim";


function setAlbumArt(gtkimage: Gtk.Image): void {
    const song = Media.getDefault().song;
    if(!song) return;

    const image = song.image ?? song.album?.image;
    if(image == null) return;

    try {
        gtkimage.set_from_pixbuf(image);
    } catch(e) {
        console.error(`Couldn't set album art to: ${image}. Exception:\n${e}`);
    }
}

export default ({ size, hexpand, vexpand }: {
    size?: number,
    hexpand?: boolean;
    vexpand?: boolean;
}) => 
    <Gtk.Image class={"album-art"} widthRequest={size != null ? size + 8 : undefined} 
      heightRequest={size} hexpand={hexpand} vexpand={vexpand}
      $={(self) => {
          setAlbumArt(self); // fix not working first run
          const sub = createBinding(Media.getDefault(), "song").subscribe(() => {
              setAlbumArt(self);
          });

          const conn = self.connect("destroy", () => {
              self.disconnect(conn);
              sub(); // unsub on ::destroy
          });
    }} />;
