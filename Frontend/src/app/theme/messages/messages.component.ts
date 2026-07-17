import { Component, OnInit, ViewEncapsulation, ViewChild, inject, OnDestroy } from '@angular/core';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MessagesService } from '../../services/messages.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatCardModule } from '@angular/material/card';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NewLeaveService } from '@services/new-leave.service';
import { CommonModule } from '@angular/common';
import { TimeAgoPipe } from '../pipes/time-ago.pipe';
import { RoleService } from '@services/role.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'; // <-- Added imports
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

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
    CommonModule,
    TimeAgoPipe,
    RouterModule,
    MatPaginatorModule,
    MatTooltipModule,
  MatBadgeModule ],

  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [MessagesService]
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild(MatMenuTrigger) trigger!: MatMenuTrigger;

  public selectedTab = 1;
  public notifications: any[] = [];
  public unreadCount = 0;

  // New Button-driven Pagination State properties
  public totalCount = 0;
  public currentPage = 1;
  public pageSize = 5; // Clean fixed chunk size per view
  public isLoading = false;

  userId!: number;
  userRole!: string;
  
  private destroy$ = new Subject<void>();

  leaveService = inject(NewLeaveService);
  messagesService = inject(MessagesService);
  roleService = inject(RoleService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);

  ngOnInit() {
    this.initializeComponent();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sanitizeMessage(message: string) {
    return this.sanitizer.bypassSecurityTrustHtml(message);
  }

  async initializeComponent() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const user = JSON.parse(token);
      if (user && typeof user.role === 'number') {
        const roleId = user.role;
        this.userId = user.id;
        await this.getRoleById(roleId);
        
        this.loadNotifications();
      } else {
        console.error("User role is missing or incorrectly structured in token data");
      }
    } catch (error) {
      console.error("Error initializing component", error);
    }
  }

  getRoleById(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.roleService.getRoleById(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
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

loadNotifications() {
    this.isLoading = true;

    const request$ = this.isAdmin() 
      ? this.messagesService.getAllNotifications(this.currentPage, this.pageSize)
      : this.messagesService.getUserNotifications(this.userId, this.currentPage, this.pageSize);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any) => {
        
        // CASE 1: Backend is returning a raw flat array (like in your screenshot)
        if (Array.isArray(data)) {
          this.totalCount = data.length; // 14,903 items
          
          // Calculate slices locally so the DOM doesn't render thousands of items
          const startIndex = (this.currentPage - 1) * this.pageSize;
          const endIndex = startIndex + this.pageSize;
          
          this.notifications = data.slice(startIndex, endIndex); // Grab only 10 items
          this.unreadCount = data.filter(n => !n.isRead).length; // Keep unread count accurate
          
        // CASE 2: Backend is returning the proper paginated object structure
        } else if (data && data.notifications) {
          this.notifications = data.notifications || [];
          this.totalCount = data.totalCount || 0;
          this.unreadCount = data.unreadCount || 0;
          
        } else {
          this.notifications = [];
          this.totalCount = 0;
          this.unreadCount = 0;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching paginated notifications:', error);
        this.isLoading = false;
      }
    });
  }

  // Event handler for arrow buttons/size toggles on the Paginator
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1; // Backend is 1-indexed, Material is 0-indexed
    this.pageSize = event.pageSize;
    this.loadNotifications();
  }

markAsRead(notificationId: string) {
    // Pass isAdmin flag down to the service
    this.messagesService.markAsRead(notificationId, this.isAdmin())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const target = this.notifications.find(n => n.id === notificationId);
          if (target && !target.isRead) {
            target.isRead = true;
            if (this.unreadCount > 0) this.unreadCount--;
          }
        },
        error: (error) => console.error('Error marking as read:', error)
      });
  }

  navigateToMessage(message: any) {
    const targetId = message.id || message._id; 

    if (!targetId) {
      console.warn('Could not navigate: No valid ID property found on message object.');
      this.handleRouting(message);
      return;
    }

    if (!message.isRead) {
      // Pass isAdmin flag down to the service here as well
      this.messagesService.markAsRead(targetId, this.isAdmin())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            message.isRead = true;
            if (this.unreadCount > 0) this.unreadCount--;
            this.handleRouting(message);
          },
          error: (error) => {
            console.error('Error marking as read before navigation:', error);
            this.handleRouting(message);
          }
        });
    } else {
      this.handleRouting(message);
    }
  }

  private handleRouting(message: any) {
    if (message.route) {
      this.router.navigate([message.route]);
    }
  }

  isAdmin(): boolean {
    return this.userRole === 'Admin' || this.userRole === 'Super Administrator';
  }

  stopClickPropagate(event: Event) {
    event.stopPropagation();
    event.preventDefault();
  }

  openMessagesMenu() {
    this.trigger.openMenu();
    this.selectedTab = 0;
  }
}