import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { VALID_VIEWS } from "../data";

const NavTabs = ({ currentTab, changeTab }) => {
  return (
    <NavigationMenu className="w-full overflow-hidden">
      <NavigationMenuList className="w-full justify-evenly min-w-0">
        {VALID_VIEWS.map((tab) => {
          return (
            <NavigationMenuItem key={tab.key} className="shrink-0">
              <NavigationMenuLink
                onClick={() => changeTab(tab.key)}
                data-active={currentTab === tab.key}
                className="p-1.5 whitespace-nowrap"
              >
                {tab.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default NavTabs;
