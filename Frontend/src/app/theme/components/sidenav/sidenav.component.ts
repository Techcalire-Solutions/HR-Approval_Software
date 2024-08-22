import { Component, OnInit, ViewEncapsulation } from '@angular/core';  
import { Settings, SettingsService } from '../../../services/settings.service';
import { MenuService } from '../../../services/menu.service';
import { VerticalMenuComponent } from '../menu/vertical-menu/vertical-menu.component';

import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgScrollbarModule } from 'ngx-scrollbar';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    FlexLayoutModule,
    NgScrollbarModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    VerticalMenuComponent
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SidenavComponent implements OnInit {
  public userImage = 'img/users/user.jpg';
  public menuItems: Array<any>;
  public settings: Settings;
  constructor(public settingsService: SettingsService, public menuService: MenuService){
      this.settings = this.settingsService.settings; 
  }

  ngOnInit() {
    this.menuItems = this.menuService.getVerticalMenuItems();
  }

  public closeSubMenus(){
    let menu = document.getElementById("vertical-menu");
    if(menu){
      for (let i = 0; i < menu.children[0].children.length; i++) {
        let child = menu.children[0].children[i];
        if(child){
          if(child.children[0].classList.contains('expanded')){
              child.children[0].classList.remove('expanded');
              child.children[1].classList.remove('show');
          }
        }
      }
    }
  }

}
