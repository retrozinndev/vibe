import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import Media from "./modules/media";
import OmniPlayer from "./widgets/OmniPlayer";
import Page from "./widgets/Page";
import NavigationTabButton from "./widgets/NavigationTabButton";

import { createBinding, createRoot, createState, getScope, Scope, With } from "gnim";
import { App } from "./app";
import { createSubscription } from "gnim-utils";


export const media = new Media();

export const openMainWindow = () => createRoot((dispose) => {
    const pages: Array<Page> = [
        <Page tabName={"Search"} title={"Search anything"} 
          iconName={"search-symbolic"} 
        /> as Page,
        <Page tabName={"Library"} title={"Your library"}
          iconName={"user-bookmarks-symbolic"}
        /> as Page,
        <Page tabName={"Plugins"} title={"Manage plugins"}
          iconName={"folder-extensions-symbolic"}
        /> as Page
    ];

    const [page, _setPage] = createState(pages[0]);

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
                            <Gtk.Label class="heading" label="Vibe" $type="title" />
                            <Gtk.Button class={"more flat"} iconName={"help-about-symbolic"}
                              $type="start" onClicked={(self) => {
                                  const dialog = Adw.AboutDialog.new();
                                  dialog.set_application_name("Vibe");
                                  dialog.set_application_icon("folder-music-symbolic");
                                  dialog.set_version(App.get_default().version);
                                  dialog.set_license("MIT");
                                  dialog.set_website("https://github.com/retrozinndev/vibe");
                                  dialog.present(self.root);
                              }}
                            />
                        </Adw.HeaderBar>

                        {pages.map(page => 
                            <NavigationTabButton iconName={createBinding(page, "iconName")}
                              actionClicked={() => _setPage(page)} // TODO: make a method to actually change the page widget
                              label={createBinding(page, "tabName")}
                            />
                        )}

                    </Gtk.Box>
                </Adw.NavigationPage>

                {/* page */}
                <Adw.NavigationPage title={"Library"} name={"navpage"}>
                    <Gtk.Box class={"container"} vexpand={false} orientation={Gtk.Orientation.VERTICAL}>
                        <Adw.HeaderBar class={"flat"} />
                        <Gtk.Box class={"content"} vexpand>
                            <Gtk.Stack transitionType={Gtk.StackTransitionType.CROSSFADE}
                              transitionDuration={400}>
                            
                                <With value={page}>
                                    {(page: Page) => 
                                        page
                                    }
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
