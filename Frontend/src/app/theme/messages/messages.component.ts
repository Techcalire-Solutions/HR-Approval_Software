import { Component, OnInit, ViewEncapsulation, ViewChild, inject } from '@angular/core';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MessagesService } from '../../services/messages.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatCardModule } from '@angular/material/card';
import { PipesModule } from '../pipes/pipes.module';
import { Subscription } from 'rxjs/internal/Subscription';
import { LeaveService } from '@services/leave.service';
import { CommonModule } from '@angular/common';
import { TimeAgoPipe } from '../pipes/time-ago.pipe';
import { RoleService } from '@services/role.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatProgressBarModule,
    MatMenuModule,
    NgScrollbarModule,
    PipesModule,
    CommonModule,
    TimeAgoPipe
  ],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [MessagesService]
})
export class MessagesComponent implements OnInit {
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  public selectedTab: number = 1;
  public messages: Array<any>;
  public files: Array<any>;
  public meetings: Array<any>;
  holidays: any[] = [];
  leaveService = inject(LeaveService);
  userId: number;
  unreadCount: number = 0;
  allUnreadCount: number = 0;
  notifications: any[] = [];
  previousNotificationIds: Set<string> = new Set();
  notifiedUnreadIds: Set<string> = new Set();
  messagesService = inject(MessagesService)
  userRole: string;
  roleService = inject(RoleService)


  async ngOnInit() {
    this.initializeComponent()
  }

   async initializeComponent(){
    this.messages = this.messagesService.getMessages();
    this.files = this.messagesService.getFiles();
    this.meetings = this.messagesService.getMeetings();
    const token: any = localStorage.getItem('token');
    const user = JSON.parse(token);
    if (user && typeof user.role === 'number') {
      const roleId = user.role;
      this.userId = user.id;
      await this.getRoleById(roleId);
      if (this.userRole === 'Admin' || this.userRole === 'Super Administrator') {
        this.getAllNot();
      } else {
        this.getNotificationsForUser();
      }
    } else {
      console.error("User role is missing or incorrectly structured in token data");
    }
  }

   roleSub!: Subscription;
   roleName!: string;
   getRoleById(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.roleSub = this.roleService.getRoleById(id).subscribe({
        next: role => {
          this.userRole = role.roleName;
          resolve();
        },
        error: err => {
          console.error('Error fetching role:', err);
          reject(err);
        }
      });
    });
  }

  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(notification => !notification.isRead).length;
  }
  updateAllUnreadCount(notifications: any[]) {
    this.allUnreadCount = notifications.filter(notification => !notification.isRead).length;
  }

  markReadSub :Subscription
  markAsRead(notificationId: string) {
   this.markReadSub = this.messagesService.markAsRead(notificationId).subscribe(
      () => {
        this.getNotificationsForUser();
      },
      (error) => {
        console.error('Error marking notification as read', error);
      }
    );
  }


  messageNotfiSub:Subscription
  getNotificationsForUser() {
   this.messageNotfiSub =  this.messagesService.getUserNotifications(this.userId).subscribe(
      (data: any) => {
        this.notifications = data.notifications || [];
        console.log(this.notifications)
        this.checkForNewNotifications(data);
        this.updateUnreadCount();
      },
      (error) => {
        console.error('Error fetching notifications:', error);
      }
    );
  }
  allNotSub: Subscription;

  getAllNot() {
    this.allNotSub = this.messagesService.getAllNotifications().subscribe(
      (res) => {
        if (Array.isArray(res)) {
          this.notifications = res;
          this.updateAllUnreadCount(res);
        } else {
          this.notifications = [];
        }
      },
      (error) => {
        console.error('Error fetching all notifications:', error);
      }
    );
  }





  checkForNewNotifications(newNotifications: any) {
    const extractedNotifications = newNotifications.notifications || [];
    if (!Array.isArray(extractedNotifications) || !Array.isArray(this.notifications)) {
      console.error('Invalid notifications:', extractedNotifications, this.notifications);
      return;
    }


    const unreadNotifications = extractedNotifications.filter(n => !n.isRead && !this.notifiedUnreadIds.has(n.id));
    if (unreadNotifications.length > 0) {
      unreadNotifications.forEach(n => this.notifiedUnreadIds.add(n.id));
    } else {

    }
    this.previousNotificationIds = new Set(extractedNotifications.map(n => n.id));
  }





  openMessagesMenu() {
    this.trigger.openMenu();
    this.selectedTab = 0;
  }

  onMouseLeave() {
    this.trigger.closeMenu();
  }

  stopClickPropagate(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }

  handleMessageClick(message: any) {
    if (!message.isRead) {
      this.markAsRead(message.id);
    }
  }

  isAdmin(): boolean {
    return this.userRole === 'admin' || this.userRole === 'Super Administrator';
  }


  ngOnDestroy(){
    if(this.markReadSub) this.markReadSub.unsubscribe();
    if(this.messageNotfiSub) this.messageNotfiSub.unsubscribe();
  }
}

