import { Injectable, ViewContainerRef, EmbeddedViewRef } from '@angular/core';
import { Menu } from '../common/models/menu.model';
import { VerticalMenuComponent } from '../theme/components/menu/vertical-menu/vertical-menu.component';

@Injectable()
export class DynamicMenuService {

  constructor(private viewContainerRef: ViewContainerRef) { }

  addNewMenuItem(component: any, menuItems: Array<Menu>, menuItem: Menu) {

    const lastId = menuItems[menuItems.length - 1].id;
    const newMenuItem = new Menu(lastId + 1, menuItem['title'], menuItem['routerLink'], menuItem['href'], menuItem['icon'], menuItem['target'], menuItem['hasSubMenu'], parseInt(menuItem['parentId'].toString()));

    menuItems.push(newMenuItem);
    let item = menuItems.filter(item => item.id == newMenuItem.parentId)[0];
    if (item) item.hasSubMenu = true;

    const componentRef = this.viewContainerRef.createComponent(component);

    let instance = <VerticalMenuComponent>componentRef.instance;
    instance.menuItems = menuItems;
    instance.menuParentId = 0;

    const elem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;

    const verticalMenu = document.getElementById('vertical-menu');
    if (verticalMenu) {
      verticalMenu.replaceChild(elem, verticalMenu.children[0]);
    } 

  }
}
