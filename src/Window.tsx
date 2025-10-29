import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import { createBinding, createRoot, createState, For, With } from "gnim";
import { createSecureAccessorBinding } from "gnim-utils";
import { Plugin } from "libvibe";
import { App } from "./app";
import Media from "./modules/media";
import Home from "./pages/Home";
import Library from "./pages/Library";
import Search from "./pages/Search";
import PluginHandler from "./plugins/plugin-handler";
import NavigationTabButton from "./widgets/NavigationTabButton";
import OmniPlayer from "./widgets/OmniPlayer";
import Page from "./widgets/Page";


export const media = new Media();

export const openMainWindow = () => createRoot((dispose) => {
    const pages: Array<Page> = [
        new Home(),
        new Search(),
        new Library()
    ];

    const [page, _setPage] = createState(pages[1]);

    return <Adw.ApplicationWindow title={"Vibe"} hideOnClose={false} 
      visible onCloseRequest={() => dispose()} application={App.get_default()}
      class={DEVEL ? "devel" : ""}>

        <Gtk.Box class={"container"} orientation={Gtk.Orientation.VERTICAL}>
            <Adw.NavigationSplitView vexpand sidebarPosition={Gtk.PackType.START}>
                {/* sidebar */}
                <Adw.NavigationPage title={"Sidebar"} $type="sidebar">
                    <Gtk.Box orientation={Gtk.Orientation.VERTICAL} vexpand={false} spacing={6}
                      class={"sidebar-container"}>

                        <Adw.HeaderBar class={"flat"}>
                            <Gtk.Button class={"info flat"} iconName={"help-about-symbolic"}
                              $type="start" onClicked={(self) => {
                                  const dialog = Adw.AboutDialog.new();
                                  dialog.set_application_name("Vibe");
                                  dialog.set_application_icon("folder-music-symbolic");
                                  dialog.set_version(App.get_default().version);
                                  dialog.set_license(App.get_default().license);
                                  dialog.set_website("https://github.com/retrozinndev/vibe");
                                  dialog.present(self.root);
                              }}
                            />
                            <Gtk.Label class="heading" label="Vibe" $type="title" />
                            <Gtk.MenuButton class={"flat plugin-selection"} $type="end">
                                <Gtk.Popover $type="popover">
                                    <For each={createBinding(PluginHandler.getDefault(), "plugins")}>
                                        {(plugin: Plugin) => 
                                            <Gtk.Button class={"flat"} onClicked={() => {
                                                if(PluginHandler.getDefault().plugin.id !== plugin.id)
                                                    PluginHandler.getDefault().plugin = plugin
                                            }}>
                                                
                                                <Gtk.Box hexpand spacing={6}>
                                                    <Gtk.Image iconName={"folder-extensions-symbolic"} />
                                                    <Gtk.Label label={plugin.name} hexpand />
                                                    <Gtk.Image iconName={"object-select-symbolic"}
                                                      visible={createBinding(
                                                          PluginHandler.getDefault(), "plugin"
                                                      ).as(p => p.id === plugin.id)}
                                                    />
                                                </Gtk.Box>
                                            </Gtk.Button>
                                        }
                                    </For>
                                </Gtk.Popover>
                            </Gtk.MenuButton>
                        </Adw.HeaderBar>

                        {pages.map(pg => 
                            <NavigationTabButton iconName={createBinding(pg, "iconName")}
                              actionClicked={() => _setPage(pg)}
                              label={createBinding(pg, "tabName")}
                              class={page.as(p => p.tabName === pg.tabName ? "raised" : "flat")}
                            />
                        )}

                    </Gtk.Box>
                </Adw.NavigationPage>

                {/* page */}
                <Adw.NavigationPage title={createSecureAccessorBinding<Page>(
                    page, "title", ""
                )} name={"navpage"}>
                    <Gtk.Box class={"container"} vexpand={false} orientation={Gtk.Orientation.VERTICAL}>
                        <Adw.HeaderBar class={"flat"} />
                        <Gtk.Box class={"content"} vexpand>
                            {/* TODO: implement transitions on page change (we need a better structure for that) */}
                            <Gtk.Stack transitionType={Gtk.StackTransitionType.CROSSFADE}
                              transitionDuration={400}>
                            
                                <With value={page}>
                                    {(page: Page) => page}
                                </With>
                            </Gtk.Stack>
                        </Gtk.Box>
                    </Gtk.Box>
                </Adw.NavigationPage>
            </Adw.NavigationSplitView>
            <Gtk.Separator />
            <OmniPlayer />
        </Gtk.Box>
    </Adw.ApplicationWindow>;
});
