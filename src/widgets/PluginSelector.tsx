import Gtk from "gi://Gtk?version=4.0"
import { createBinding } from "gnim"
import PluginHandler from "../plugins/plugin-handler"
import { Menu } from "./Menu"


export default function() {
    return <Gtk.MenuButton class={"flat plugin-selection"}>
        <Gtk.Box class={"icons"} spacing={4}>
            <Gtk.Image iconName={"folder-extensions-symbolic"} />
            <Gtk.Image iconName={"pan-down-symbolic"} />
        </Gtk.Box>
        <Menu $type="popover" closeOnSelect mode={Menu.Mode.SELECT}
          buttons={createBinding(PluginHandler.getDefault(), "plugins")(plugins => plugins.map(p => ({
              iconName: "folder-extensions-symbolic",
              label: p.prettyName,
              onClicked: () => {
                  if(PluginHandler.getDefault().plugin.id !== p.id)
                      PluginHandler.getDefault().plugin = p;
              },
              selected: createBinding(PluginHandler.getDefault(), "plugin")(c => c.id === p.id)
          } satisfies Menu.Button)))}
        />
    </Gtk.MenuButton>
}
