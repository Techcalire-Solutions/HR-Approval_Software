/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { ChatService } from '@services/chat.service';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { UsersService } from '@services/users.service';
import { User } from '../../../common/interfaces/users/user';
import { Chat } from '../../../common/interfaces/chat/chat';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    FlexLayoutModule,
    MatCardModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatInputModule,
    NgScrollbarModule,
    CommonModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  providers: [
    ChatService
  ]
})
export class ChatComponent implements OnInit {
  @ViewChild('sidenav') sidenav: any;
  public userImage = 'img/users/default-user.jpg';
  apiUrl = 'https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/';
  public chats: Chat[];
  public sidenavOpen: boolean = true;
  public currentChat: Chat;
  public newMessage: string;

  constructor(private chatService: ChatService) { }

  loginId: number;
  ngOnInit() {
    this.getUsers();
    const token = localStorage.getItem('token');
    if (token) {
      const user = JSON.parse(token);
      this.loginId = user.id;
    }  

    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.getChat(this.currentUser.id);
    }
    if (window.innerWidth <= 768) {
      this.sidenavOpen = false;
    }
  }
  
  private usersService = inject(UsersService);
  users: any[] = [];
  getUsers(){
    this.usersService.getUser().subscribe(user => {
      this.users = user;
      this.users.forEach(user => {
        this.getUnreadMessages(user.id);
      });
  
    }); 
  }

  getUnreadMessages(userId: number) {
    this.chatService.getChatByUserTo(this.loginId, userId).subscribe((response: any) => {
      const unreadMessagesCount = response.unreadMessagesCount;
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.unreadMessagesCount = unreadMessagesCount;
      }
    });
  }

  currentUser: User;
  getCurrentUser(id: number){
    this.usersService.getUserById(id).subscribe(user => {
      this.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.getChat(user.id)
    })
  }

  chatSub!: Subscription;
  getChat(userId: number){
    this.chatSub = this.chatService.getChatByUser(this.loginId, userId).subscribe(chat => {
      this.chats = chat;

      this.chats.forEach(message => {
        if (message.toId === this.loginId && message.status === 'Sent') {
          this.updateMessageStatus(message.id, 'read');
        }
      });
    })
  }

  updateMessageStatus(messageId: number, status: string) {
    this.chatService.updateMessageStatus(messageId, status).subscribe(response => {
      console.log('Message status updated:', response);
    });
  }

  message: string;
  messageType(event: any){
    this.message = (event.target as HTMLInputElement).value.trim()
    console.log(this.message);
  }

  submit!:Subscription;
  sendMessage(){
    const data = {
      toId: this.currentUser.id,
      fromId: this.loginId,
      message: this.message
    }
    console.log(data);
    
    this.submit = this.chatService.addChat(data).subscribe(() =>{
      this.getChat(this.currentUser.id);
      this.message = ''
    });
  }

  @HostListener('window:resize')
  public onWindowResize(): void {
    (window.innerWidth <= 768) ? this.sidenavOpen = false : this.sidenavOpen = true;
  }

  @ViewChild('chatContent') chatContent!: ElementRef;
  scrollToBottom(): void {
    if (this.chatContent?.nativeElement) {
      const chatContent = this.chatContent.nativeElement;
      chatContent.scrollTop = chatContent.scrollHeight;
    }
  }


  public ngOnDestroy() {
    // if (this.talks)
    //   this.talks.length = 2;
  }

}

