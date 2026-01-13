import Gtk from "gi://Gtk?version=4.0";
import Media from "../modules/media";
import { createBinding, createComputed, getScope, With } from "gnim";
import { Song } from "libvibe/objects";
import { LoopMode, PlaybackStatus, ShuffleMode } from "libvibe/interfaces";
import { createSubscription } from "gnim-utils";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import Gdk from "gi://Gdk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import Adw from "gi://Adw?version=1";


export default () =>
    <Adw.Clamp orientation={Gtk.Orientation.VERTICAL} maximumSize={64}>
        <Gtk.Box class={"bg-secondary omniplayer"} hexpand vexpand={false}>

            <Gtk.CenterBox hexpand vexpand={false} valign={Gtk.Align.CENTER}>
                <Gtk.Box class={"song"} $type="start" hexpand>
                    <Gtk.Picture class={"album-image"} contentFit={Gtk.ContentFit.COVER}
                      $={self => {
                          const image = createComputed(() => [
                              createBinding(Media.getDefault(), "song", "image")(),
                              createBinding(Media.getDefault(), "song", "album", "image")()
                          ]).as(([songImage, albumImage]) => songImage ?? albumImage);

                          createSubscription(
                              image,
                              () => {
                                  const data = image.peek();
                                  
                                  if(!data) {
                                      self.set_paintable(null);
                                      return;
                                  }

                                  if(data instanceof GdkPixbuf.Pixbuf) {
                                      self.set_pixbuf(data);
                                      return;
                                  }

                                  if(data instanceof Gdk.Texture) 
                                      self.set_paintable(data);
                              }
                          );
                      }}
                    />
                    <With value={createBinding(Media.getDefault(), "song")}>
                        {(song: Song|null) => song &&
                            <Gtk.Box class="details" orientation={Gtk.Orientation.VERTICAL}
                              valign={Gtk.Align.CENTER} halign={Gtk.Align.START} vexpand>

                                <Gtk.Label class="title-4" label={createBinding(song, "title").as(s => s ?? "No Title")} 
                                  xalign={0} maxWidthChars={28} ellipsize={Pango.EllipsizeMode.END} />

                                <Gtk.Label class="caption" xalign={0} label={createBinding(song, "artist").as(artists => {
                                      if(!artists || artists.length < 1) 
                                          return "Unknown Artist";

                                      return artists.map(artist => artist.name).join(", ") // TODO: support custom metadata separators
                                  })} maxWidthChars={40} ellipsize={Pango.EllipsizeMode.END}
                                />
                            </Gtk.Box>
                        }
                    </With>
                </Gtk.Box>
                <Gtk.Box $type="center" halign={Gtk.Align.CENTER} orientation={Gtk.Orientation.VERTICAL}>
                    <Gtk.Box class={"controls"} spacing={6}>
                        <Gtk.Button class={"shuffle flat"} iconName={createBinding(Media.getDefault(), "shuffle")
                          .as(shuffle => shuffle === ShuffleMode.SHUFFLE ?
                                  "playlist-shuffle-symbolic"
                              : "playlist-consecutive-symbolic"
                          )}
                          onClicked={() => {
                              if(Media.getDefault().shuffle === ShuffleMode.SHUFFLE) {
                                  Media.getDefault().shuffle = ShuffleMode.NONE;
                                  return;
                              }

                              Media.getDefault().shuffle = ShuffleMode.SHUFFLE;
                          }}
                        />
                        <Gtk.Button class={"previous flat"} vexpand={false}
                          iconName={"media-skip-backward-symbolic"} 
                          onClicked={() => Media.getDefault().previous()}
                        />
                        <Gtk.Button class={"pause pill"}
                          iconName={createBinding(Media.getDefault(), "status").as(status =>
                              status === PlaybackStatus.PAUSED ?
                                  "media-playback-start-symbolic"
                              : "media-playback-pause-symbolic"
                          )} onClicked={() => {
                              const status = Media.getDefault().status;

                              if(status === PlaybackStatus.PLAYING) {
                                  Media.getDefault().pause();
                                  return;
                              }

                              if(status === PlaybackStatus.PAUSED) {
                                  Media.getDefault().resume();
                                  return;
                              }

                              // nothing...
                          }}
                        />
                        <Gtk.Button class={"next flat"} iconName={"media-skip-forward-symbolic"} 
                          onClicked={() => Media.getDefault().next()}
                        />
                        <Gtk.Button class={"loop flat"} iconName={createBinding(Media.getDefault(), "loop")
                          .as(loop => {
                              switch(loop) {
                                  case LoopMode.LIST:
                                      return "arrows-loop-tall-symbolic";

                                  case LoopMode.SONG:
                                      return "media-playlist-repeat-song-symbolic";
                              }

                              return "arrows-loop-tall-disabled-symbolic";
                          })}
                          onClicked={() => {
                              if(Media.getDefault().loop === LoopMode.NONE)
                                  return Media.getDefault().loop = LoopMode.LIST;

                              if(Media.getDefault().loop === LoopMode.LIST)
                                  return Media.getDefault().loop = LoopMode.SONG;

                              Media.getDefault().loop = LoopMode.NONE;
                          }}
                        />

                        <Gtk.Scale visible={false} class={"slider"} drawValue={false} $={(self) => {
                            self.set_value(0);
                            self.set_range(0, 1);

                            const connections = [
                                Media.getDefault().connect("notify::position", (media) => {
                                    console.log(media.position);
                                    self.set_value(media.position);
                                }),
                                Media.getDefault().connect("notify::length", (media) => {
                                    console.log(media.length);
                                    self.set_range(0, media.length);
                                })
                            ];

                            getScope().onCleanup(() => connections.forEach(id => Media.getDefault().disconnect(id)));
                        }} />
                    </Gtk.Box>
                </Gtk.Box>
                <Gtk.Box $type="end" />
            </Gtk.CenterBox>
        </Gtk.Box>
    </Adw.Clamp> as Gtk.Widget;
