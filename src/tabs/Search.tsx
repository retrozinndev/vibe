import { register } from "gnim/gobject";
import Tab from "../widgets/Tab";
import { SearchPage } from "../pages/Search";


@register({ GTypeName: "VibeTabSearch" })
export default class Search extends Tab {
    
    constructor() {
        super({
            iconName: "system-search-symbolic",
            id: "search",
            title: "Search"
        });

        this.page = new SearchPage(this);
    }
}
