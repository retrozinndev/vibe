import Gtk from "gi://Gtk?version=4.0";
import AlbumArt from "./AlbumArt";

import Media from "../modules/media";


export default () =>
    <Gtk.Box class={"bg-secondary omniplayer"} hexpand vexpand={false}
      valign={Gtk.Align.END} heightRequest={64}>

        <Gtk.CenterBox hexpand vexpand={false} valign={Gtk.Align.CENTER}>
            <Gtk.Box class={"song"} $type="start" hexpand>
                <AlbumArt />
                <Gtk.Box class="details" orientation={Gtk.Orientation.VERTICAL}
                  valign={Gtk.Align.CENTER} halign={Gtk.Align.START} vexpand>

                    <Gtk.Label class="title-4" label={Media.getDefault().song.title} xalign={0} />
                    <Gtk.Label class="caption" xalign={0} label={(() => {
                          const artists = Media.getDefault().song.artist;
                          if(artists === undefined) 
                              return "Unknown Artist";

                          return Array.isArray(artists) ?
                              artists.map(artist => artist.name).join(", ") // TODO: support custom metadata separators
                          : artists.name;
                      })()} 
                    />
                </Gtk.Box>
            </Gtk.Box>
            <Gtk.Box class={"controls"} halign={Gtk.Align.CENTER} $type="center"
              spacing={6}>

                <Gtk.Button class={"previous flat"} vexpand={false}
                  iconName={"media-skip-backward-symbolic"} 
                />
                <Gtk.Button class={"pause pill"}
                  iconName={"media-playback-pause-symbolic"}
                />
                <Gtk.Button class={"next flat"} vexpand={false}
                  iconName={"media-skip-forward-symbolic"} 
                />
            </Gtk.Box>
            <Gtk.Box $type="end" />
        </Gtk.CenterBox>
    </Gtk.Box>;
