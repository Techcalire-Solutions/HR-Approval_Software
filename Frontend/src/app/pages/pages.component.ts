import { Component, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Settings, SettingsService } from '../services/settings.service';
import { MenuService } from '../services/menu.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { SidenavComponent } from '../theme/components/sidenav/sidenav.component';
import { FullScreenComponent } from '../theme/components/fullscreen/fullscreen.component';
import { ApplicationsComponent } from '../theme/components/applications/applications.component';
import { UserMenuComponent } from '../theme/components/user-menu/user-menu.component';
import { HorizontalMenuComponent } from '../theme/components/menu/horizontal-menu/horizontal-menu.component';
import { BreadcrumbComponent } from '../theme/components/breadcrumb/breadcrumb.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AnnouncementsComponent } from "./announcements/announcements.component";
import { AnnouncementsService } from '@services/announcements.service';
import { MessagesComponent } from '../theme/messages/messages.component';

@Component({
  selector: 'app-pages',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    ReactiveFormsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatRadioModule,
    FlexLayoutModule,
    NgScrollbarModule,
    SidenavComponent,
    FullScreenComponent,
    ApplicationsComponent,
    UserMenuComponent,
    HorizontalMenuComponent,
    BreadcrumbComponent,
    AnnouncementsComponent,
    MessagesComponent

],
  templateUrl: './pages.component.html',
  styleUrl: './pages.component.scss'
})
export class PagesComponent implements OnInit {
  @ViewChild('sidenav') sidenav:any;
  @ViewChild('backToTop') backToTop:any;
  @ViewChild('mainSidenavContent') mainSidenavContent: any;
  @ViewChild('mainContent') mainContent: ElementRef;

  public settings: Settings;
  public menus = ['vertical', 'horizontal'];
  public menuOption:string;
  public menuTypes = ['default', 'compact', 'mini'];
  public menuTypeOption:string;
  public lastScrollTop: number = 0;
  public showBackToTop: boolean = false;
  public toggleSearchBar: boolean = false;
  private defaultMenu: string; //declared for return default menu when window resized
  public showSidenav: boolean = false;

  constructor(public settingsService: SettingsService, public router: Router, private menuService: MenuService){
    this.settings = this.settingsService.settings;
  }
  announcementService = inject(AnnouncementsService)
  ngOnInit() {
    if(window.innerWidth <= 768){
      this.settings.menu = 'vertical';
      this.settings.sidenavIsOpened = false;
      this.settings.sidenavIsPinned = false;
    }
    this.menuOption = this.settings.menu;
    this.menuTypeOption = this.settings.menuType;
    this.defaultMenu = this.settings.menu;

    this.announcementService.callSubmit$.subscribe((data) => {
      this.getAnnouncement(data);
    });
  }

  handleSubmit(data: any) {
    // Handle submission
    console.log('Handling submit in Component B');
  }

  ngAfterViewInit(){
    setTimeout(() => { this.settings.loadingSpinner = false }, 300);
    this.backToTop.nativeElement.style.display = 'none';
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if(!this.settings.sidenavIsPinned){
          this.sidenav.close();
        }
        if(window.innerWidth <= 768){
          this.sidenav.close();
        }
      }
    });
    if(this.settings.menu == "vertical") {
      this.menuService.expandActiveSubMenu(this.menuService.getVerticalMenuItems());
    }
  }

  public chooseMenu(){
    this.settings.menu = this.menuOption;
    this.defaultMenu = this.menuOption;
    this.router.navigate(['/']);
  }

  public chooseMenuType(){
    this.settings.menuType = this.menuTypeOption;
  }

  public changeTheme(theme: string){
    this.settings.theme = theme;
  }

  public toggleSidenav(){
    this.sidenav.toggle();
  }

  public onPageScroll(event: any){
    (event.target.scrollTop > 300) ? this.backToTop.nativeElement.style.display = 'flex' : this.backToTop.nativeElement.style.display = 'none';
    if(this.settings.menu == 'horizontal'){
      if(this.settings.fixedHeader){
        var currentScrollTop = (event.target.scrollTop > 56) ? event.target.scrollTop : 0;
        if(currentScrollTop > this.lastScrollTop){
          document.querySelector('#horizontal-menu')!.classList.add('sticky');
          event.target.classList.add('horizontal-menu-hidden');
        }
        else{
          document.querySelector('#horizontal-menu')!.classList.remove('sticky');
          event.target.classList.remove('horizontal-menu-hidden');
        }
        this.lastScrollTop = currentScrollTop;
      }
      else{
        if(event.target.scrollTop > 56){
          document.querySelector('#horizontal-menu')!.classList.add('sticky');
          event.target.classList.add('horizontal-menu-hidden');
        }
        else{
          document.querySelector('#horizontal-menu')!.classList.remove('sticky');
          event.target.classList.remove('horizontal-menu-hidden');
        }
      }
    }
  }

  public scrollToTop() {
    this.mainSidenavContent.scrollTo({
      top: 0
    });
    this.mainContent.nativeElement.scrollTo({
      duration: 100,
      top: 0
    });
  }


  @HostListener('window:resize')
  public onWindowResize():void {
    if(window.innerWidth <= 768){
      this.settings.sidenavIsOpened = false;
      this.settings.sidenavIsPinned = false;
      this.settings.menu = 'vertical'
    }
    else{
      (this.defaultMenu == 'horizontal') ? this.settings.menu = 'horizontal' : this.settings.menu = 'vertical'
      this.settings.sidenavIsOpened = true;
      this.settings.sidenavIsPinned = true;
    }
  }

  public closeSubMenus(){
    let menu = document.querySelector(".sidenav-menu-outer");
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

  openAnnouncement(){
    this.router.navigateByUrl('/login/announcements')
  }

  announcement: boolean = false;
  message: string = '';
  type: string = ''
  getAnnouncement(ancmnt: any){
    this.announcement = true;
    this.message = ancmnt.message;
    this.type = ancmnt.type;
  }

  openCalender(){
    this.router.navigate(['/login/leave/events']);
  }

  openTree(){
    this.router.navigateByUrl('/login/tree')
  }

}
