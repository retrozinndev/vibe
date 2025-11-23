import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import { Accessor, createBinding, createRoot } from "gnim";
import { createSecureAccessorBinding } from "gnim-utils";
import { App } from "./app";
import Media from "./modules/media";
import Home from "./tabs/Home";
import Library from "./tabs/Library";
import Search from "./tabs/Search";
import NavigationTabButton from "./widgets/NavigationTabButton";
import OmniPlayer from "./widgets/OmniPlayer";
import Tab from "./widgets/Tab";
import PluginSelector from "./widgets/PluginSelector";
import { Page as PageWidget } from "./widgets/Page";
import { PageModal } from "libvibe/interfaces";
import { Pages } from "./pages";


let pages: Pages;
export const media = new Media();
export function getPages(): Pages {
    return pages!;
}

export const openMainWindow = () => createRoot((dispose) => {
    const tabs: Array<Tab> = [
        new Home(),
        new Search(),
        new Library()
    ];

    pages = <Pages initialPage={new PageWidget({
          modal: PageModal.CUSTOM,
          title: "Welcome to Vibe!"
      })} 
      transitionType={Gtk.StackTransitionType.SLIDE_DOWN} transitionDuration={400} 
      $={(self) => {
          tabs.forEach(tab => tab.page &&
              self.add_named(tab.page, String(tab.id))
          );
      }}
    /> as Pages;

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
                            <PluginSelector $type="end" />
                        </Adw.HeaderBar>

                        {tabs.map(tab => 
                            <NavigationTabButton iconName={createBinding(tab, "iconName")}
                              actionClicked={() => pages.set_visible_child_name(tab.id)} // all tab pages are already added, so we can do that
                              visible={createBinding(tab, "visible")}
                              label={createBinding(tab, "title")}
                              class={createBinding(pages, "currentPage").as(page =>
                                  tab.id === page.id ? "raised" : "flat"
                              )}
                            />
                        )}

                    </Gtk.Box>
                </Adw.NavigationPage>

                {/* page */}
                <Adw.NavigationPage title={createSecureAccessorBinding<PageWidget>(
                    createBinding(pages, "visibleChild") as Accessor<PageWidget>, "title", ""
                )} name={"navpage"}>
                    <Gtk.Box class={"container"} vexpand={false} orientation={Gtk.Orientation.VERTICAL}>
                        <Adw.HeaderBar class={"flat"} />
                        <Gtk.Box class={"content"} vexpand>
                            {pages}
                        </Gtk.Box>
                    </Gtk.Box>
                </Adw.NavigationPage>
            </Adw.NavigationSplitView>
            <Gtk.Separator />
            <OmniPlayer />
        </Gtk.Box>
    </Adw.ApplicationWindow>;
});
