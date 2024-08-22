import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MessagesService } from './messages.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatCardModule } from '@angular/material/card';
import { PipesModule } from '../../pipes/pipes.module';

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
    PipesModule
  ],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [ MessagesService ]
})
export class MessagesComponent implements OnInit {  
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  public selectedTab:number=1;
  public messages:Array<any>;
  public files:Array<any>;
  public meetings:Array<any>;  
  constructor(private messagesService:MessagesService) { 
    this.messages = messagesService.getMessages();
    this.files = messagesService.getFiles();
    this.meetings = messagesService.getMeetings();    
  }

  ngOnInit() {
  }

  openMessagesMenu() {
    this.trigger.openMenu();
    this.selectedTab = 0;
  }

  onMouseLeave(){
    this.trigger.closeMenu();
  }

  stopClickPropagate(event: any){
    event.stopPropagation();
    event.preventDefault();
  }

}
