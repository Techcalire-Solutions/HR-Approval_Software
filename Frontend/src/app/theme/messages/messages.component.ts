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
import { Holidays } from '../../common/interfaces/holidays';
import { MatPaginator, PageEvent } from '@angular/material/paginator';


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
  leaveService = inject(LeaveService)

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


  //-----------------------

  @ViewChild(MatPaginator) paginator!: MatPaginator;


  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getHolidaysForYear()
  }

  
  pageSize = 5;
  currentPage = 1;
  totalItems: number;
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getHolidaysForYear();
  }

  holidaySub!: Subscription;
  holidays: Holidays[] = [];
  getHolidaysForYear(): void {
    this.holidaySub = this.leaveService.getHolidays(this.searchText, this.currentPage, this.pageSize).subscribe((res: any) => {
      console.log(res);

      this.holidays = res.items
      this.totalItems = res.count;
    })
  }

}
