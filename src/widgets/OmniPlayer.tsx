import Gtk from "gi://Gtk?version=4.0";
import { Accessor, createBinding, createComputed, getScope, With } from "gnim";
import { Song } from "libvibe/objects";
import { Media as VibeMedia } from "libvibe/interfaces";
import Pango from "gi://Pango?version=1.0";
import Adw from "gi://Adw?version=1";
import { Image } from "./Image";
import { Image as VibeImage } from "libvibe/utils";
import { Vibe } from "libvibe";


export default () =>
    <Adw.Clamp orientation={Gtk.Orientation.VERTICAL} maximumSize={75} vexpand={false}
      heightRequest={80}>

        <Gtk.CenterBox class={"bg-secondary omniplayer"} valign={Gtk.Align.CENTER}
          hexpand vexpand>

            <Gtk.Box class={"song"} $type="start" hexpand={false} halign={Gtk.Align.START}>
                <Image image={createBinding(Vibe.getDefault(), "media", "song", "image") as Accessor<VibeImage>}
                  visible={createBinding(Vibe.getDefault(), "media", "song", "image").as(Boolean)}
                />
                <With value={createBinding(Vibe.getDefault(), "media", "song")}>
                    {(song: Song|null) => song &&
                        <Gtk.Box class="details" orientation={Gtk.Orientation.VERTICAL}
                          valign={Gtk.Align.CENTER} halign={Gtk.Align.START} vexpand>

                            <Gtk.Label class="title-4" label={createBinding(song, "title").as(s => s ?? "No Title")} 
                              xalign={0} ellipsize={Pango.EllipsizeMode.END} />

                            <Gtk.Label class="caption dimmed" xalign={0} label={createBinding(song, "artist").as(artists => {
                                  if(!artists || artists.length < 1) 
                                      return "Unknown Artist";

                                  return artists.map(artist => artist.name).join(", ") // TODO: support custom metadata separators
                              })} ellipsize={Pango.EllipsizeMode.END}
                            />
                        </Gtk.Box>
                    }
                </With>
            </Gtk.Box>
            <Gtk.Box $type="center" orientation={Gtk.Orientation.VERTICAL} spacing={2}
              halign={Gtk.Align.CENTER} widthRequest={450}>

                <Gtk.Box class={"controls"} spacing={6} halign={Gtk.Align.CENTER} vexpand
                  valign={Gtk.Align.CENTER}>

                    <Gtk.Button class={"shuffle flat"} iconName={createBinding(Vibe.getDefault(), "media", "shuffle")
                      .as(shuffle => shuffle === VibeMedia.ShuffleMode.SHUFFLE ?
                              "playlist-shuffle-symbolic"
                          : "playlist-consecutive-symbolic"
                      )}
                      onClicked={() => {
                          if(Vibe.getDefault().media.shuffle === VibeMedia.ShuffleMode.SHUFFLE) {
                              Vibe.getDefault().media.shuffle = VibeMedia.ShuffleMode.NONE;
                              return;
                          }

                          Vibe.getDefault().media.shuffle = VibeMedia.ShuffleMode.SHUFFLE;
                      }}
                    />
                    <Gtk.Button class={"previous flat"} vexpand={false}
                      iconName={"media-skip-backward-symbolic"} 
                      onClicked={() => Vibe.getDefault().media.previous()}
                    />
                    <Gtk.Button class={"pause pill"}
                      iconName={createBinding(Vibe.getDefault(), "media", "status").as(status =>
                          status === VibeMedia.PlaybackStatus.PAUSED ?
                              "media-playback-start-symbolic"
                          : "media-playback-pause-symbolic"
                      )} onClicked={() => {
                          const status = Vibe.getDefault().media.status;

                          if(status === VibeMedia.PlaybackStatus.PLAYING) {
                              Vibe.getDefault().media.pause();
                              return;
                          }

                          if(status === VibeMedia.PlaybackStatus.PAUSED) {
                              Vibe.getDefault().media.resume();
                              return;
                          }

                          // nothing...
                      }}
                    />
                    <Gtk.Button class={"next flat"} iconName={"media-skip-forward-symbolic"} 
                      onClicked={() => Vibe.getDefault().media.next()}
                    />
                    <Gtk.Button class={"loop flat"} iconName={createBinding(Vibe.getDefault(), "media", "loop")
                      .as(loop => {
                          switch(loop) {
                              case VibeMedia.LoopMode.LIST:
                                  return "arrows-loop-tall-symbolic";

                              case VibeMedia.LoopMode.SONG:
                                  return "media-playlist-repeat-song-symbolic";
                          }

                          return "arrows-loop-tall-disabled-symbolic";
                      })}
                      onClicked={() => {
                          if(Vibe.getDefault().media.loop === VibeMedia.LoopMode.NONE)
                              return Vibe.getDefault().media.loop = VibeMedia.LoopMode.LIST;

                          if(Vibe.getDefault().media.loop === VibeMedia.LoopMode.LIST)
                              return Vibe.getDefault().media.loop = VibeMedia.LoopMode.SONG;

                          Vibe.getDefault().media.loop = VibeMedia.LoopMode.NONE;
                      }}
                    />
                </Gtk.Box>
                <Gtk.Scale class={"slider"} drawValue={false} hexpand valign={Gtk.Align.START}
                  $={(self) => {
                      self.set_value(0);
                      self.set_range(0, 1);

                      let ignoreChange: boolean = false;
                      const mediaSubs = [
                          createBinding(Vibe.getDefault(), "media", "position").subscribe(() => {
                              ignoreChange = true;
                              self.set_value(Vibe.getDefault().media.position);
                          }),
                          createBinding(Vibe.getDefault(), "media", "length").subscribe(() => {
                              self.set_range(0, Vibe.getDefault().media.length);
                          })
                      ];

                      const id = self.connect("value-changed", (self) => {
                          if(ignoreChange) {
                              ignoreChange = false;
                              return;
                          }

                          Vibe.getDefault().media.position = self.get_value();
                      });

                      getScope().onCleanup(() => {
                          mediaSubs.forEach(unsub => unsub());
                          self.disconnect(id);
                      });
                  }}
                />
            </Gtk.Box>
            <Gtk.Box $type="end" hexpand={false} halign={Gtk.Align.END}>
                <Gtk.Box class={"volume-slider"} spacing={2}>
                    <Gtk.Button class={"circular flat"} valign={Gtk.Align.CENTER}
                      iconName={createComputed(() => [
                          createBinding(Vibe.getDefault(), "media", "volume")(vol =>
                              vol >= 80 ?
                                  "audio-volume-high-symbolic"
                              : vol >= 45 ?
                                  "audio-volume-medium-symbolic"
                              : vol > 0 ?
                                  "audio-volume-low-symbolic"
                              : "audio-volume-muted-symbolic"
                          )(),
                          createBinding(Vibe.getDefault(), "media", "mute")()
                      ])((params) => {
                          const [volumeIcon, muted] = params as [string, boolean];

                          return !muted ? volumeIcon : "audio-volume-muted-symbolic"
                      })}
                      onClicked={() => Vibe.getDefault().media.mute = !Vibe.getDefault().media.mute}
                    />
                    <Gtk.Scale drawValue={false} hexpand widthRequest={120}
                      $={(self) => {
                          self.set_range(0, 100);
                          self.set_value(Vibe.getDefault().media.volume);

                          let ignoreChange: boolean = false;
                          const volumeUnsub = createBinding(Vibe.getDefault(), "media", "volume").subscribe(() => {
                              ignoreChange = true;
                              self.set_value(Vibe.getDefault().media.volume);
                          });

                          const id = self.connect("value-changed", (self) => {
                              if(ignoreChange) {
                                  ignoreChange = false;
                                  return;
                              }

                              Vibe.getDefault().media.volume = self.get_value();
                          });

                          getScope().onCleanup(() => {
                              volumeUnsub();
                              self.disconnect(id);
                          });
                      }}
                    />
                </Gtk.Box>
            </Gtk.Box>
        </Gtk.CenterBox>
    </Adw.Clamp> as Gtk.Widget;
