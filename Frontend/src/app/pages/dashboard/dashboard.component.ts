import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { AnalyticsComponent } from './analytics/analytics.component';
import { DiskSpaceComponent } from './disk-space/disk-space.component';
import { InfoCardsComponent } from './info-cards/info-cards.component';
import { TodoComponent } from './todo/todo.component';
import { MatrixTableComponent } from "./matrix-table/matrix-table.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatIconModule,
    AnalyticsComponent,
    DiskSpaceComponent,
    InfoCardsComponent,
    TodoComponent,
    MatrixTableComponent
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

}
