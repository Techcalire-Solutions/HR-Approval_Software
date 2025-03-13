import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AnnouncementsService } from '@services/announcements.service';
import { Subscription } from 'rxjs';
import { Announcement } from '../../../common/interfaces/announcement';

@Component({
  selector: 'app-announcements-list',
  imports: [DatePipe, MatCardModule],
  templateUrl: './announcements-list.component.html',
  styleUrl: './announcements-list.component.scss'
})
export class AnnouncementsListComponent {
anService = inject(AnnouncementsService);

  ngOnInit(): void {
    this.getBirthdays();
  }

  annSub!: Subscription;
  ann: Announcement[] = [];
  getBirthdays(){
    this.annSub = this.anService.getAnnouncement().subscribe(res=>{
      this.ann = res;
    })
  }

  ngOnDestroy(): void {
    this.annSub?.unsubscribe();
  }
}
