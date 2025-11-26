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
import { Vibe } from "libvibe";


let pages: Pages;
export const media = new Media();

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
      transitionType={Gtk.StackTransitionType.SLIDE_LEFT} transitionDuration={400} 
      $={(self) => {
          tabs.forEach(tab => tab.page &&
              self.add_named(tab.page, String(tab.id))
          );
      }}
    /> as Pages;

    Vibe.getDefault().setPages(
        pages, 
        PageWidget as never // ts(typescript) ahh
    );

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

                        {tabs.map((tab, i, arr) => 
                            <NavigationTabButton iconName={createBinding(tab, "iconName")}
                              actionClicked={() => {
                                  // all tab pages are already added, so we can do that
                                  let currentPageIndex: number;
                                  
                                  for(let i = 0; i < arr.length; i++) {
                                      const tab = arr[i];

                                      if(pages.currentPage.id === tab.id) {
                                          currentPageIndex = i;
                                          break;
                                      }
                                  }
                                  
                                  pages.set_visible_child_full(
                                      tab.id,
                                      i > currentPageIndex! ?
                                          Gtk.StackTransitionType.SLIDE_UP
                                      : Gtk.StackTransitionType.SLIDE_DOWN
                                  );
                              }} 
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
    </Adw.ApplicationWindow> as Adw.ApplicationWindow;
});
