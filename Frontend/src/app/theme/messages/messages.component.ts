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
  notifications: any[] = [];
  previousNotificationIds: Set<string> = new Set();
  notifiedUnreadIds: Set<string> = new Set();
  private audioContext: AudioContext;
  messagesService = inject(MessagesService)
  userRole: string;
  roleService = inject(RoleService)


  ngOnInit() {
    this.initializeComponent()
  }

   initializeComponent(){
    this.messages = this.messagesService.getMessages();
    this.files = this.messagesService.getFiles();
    this.meetings = this.messagesService.getMeetings();
    const token: any = localStorage.getItem('token');
    let user = JSON.parse(token);
    let roleId = user.role
    this.getRoleById(roleId)
    this.userId = user.id;
    this.userRole = user.role.roleName;
    console.log(this.userRole)
    this.getNotificationsForUser();

   }

   roleSub!: Subscription;
   roleName!: string;
   getRoleById(id: number){
     this.roleSub = this.roleService.getRoleById(id).subscribe(role => {
       this.roleName = role.roleName;
     })
   }

  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(notification => !notification.isRead).length;
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


  // messageNotfiSub:Subscription
  getNotificationsForUser2() {
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
  messageNotfiSub: Subscription;
  getNotificationsForUser() {
    if (this.userRole === 'Super Administrator' || this.userRole === 'Administrator') {

      console.log("Super Administrator")
      // Fetch notifications for super admin or admin
      this.messageNotfiSub = this.messagesService.getAllNotifications().subscribe(
        (data: any) => {
          console.log('API Response:', data);
          this.notifications = data.notifications || [];

          this.checkForNewNotifications(data);
          this.updateUnreadCount();
        },
        (error) => {
          console.error('Error fetching notifications for admin:', error);
        }
      );
    } else {
      // Fetch user-specific notifications
      this.messageNotfiSub = this.messagesService.getUserNotifications(this.userId).subscribe(
        (data: any) => {
          console.log('API Response:', data);
          this.notifications = data.notifications || [];
          this.checkForNewNotifications(data);
          this.updateUnreadCount();
        },
        (error) => {
          console.error('Error fetching notifications:', error);
        }
      );
    }
  }
  checkForNewNotifications(newNotifications: any) {
    const extractedNotifications = newNotifications.notifications || [];
    if (!Array.isArray(extractedNotifications) || !Array.isArray(this.notifications)) {
      console.error('Invalid notifications:', extractedNotifications, this.notifications);
      return;
    }


    const unreadNotifications = extractedNotifications.filter(n => !n.isRead && !this.notifiedUnreadIds.has(n.id));
    if (unreadNotifications.length > 0) {
      this.playBeepSound();
      // this.notifyUser(unreadNotifications.length);
      unreadNotifications.forEach(n => this.notifiedUnreadIds.add(n.id));
    } else {

    }
    this.previousNotificationIds = new Set(extractedNotifications.map(n => n.id));
  }


  playBeepSound() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    const oscillator = this.audioContext.createOscillator();
    // oscillator.type = 'sine';
    // oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    // oscillator.connect(this.audioContext.destination);
    // oscillator.start();
    // oscillator.stop(this.audioContext.currentTime + 0.5);
  }



  notifyUser(unreadCount: number) {
    if (Notification.permission === 'granted') {
      const notification = new Notification('New Notification', {
        body: `${unreadCount} new message${unreadCount > 1 ? 's' : ''} received.`,
        icon: 'assets/icons/notification.png',
      });

      notification.onclick = () => {
        window.focus();
      };
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.notifyUser(unreadCount);
        }
      });
    }
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

  ngOnDestroy(){
    if(this.markReadSub) this.markReadSub.unsubscribe();
    if(this.messageNotfiSub) this.messageNotfiSub.unsubscribe();
  }
}

