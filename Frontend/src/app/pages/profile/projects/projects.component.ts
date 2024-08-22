import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  public projects = [
    { image: 'img/projects/1.jpg', name: 'Project Name 1', desc: "Some quick example text to build on the card title and make up the bulk of the card's content.", followers: 10 },
    { image: 'img/projects/2.jpg', name: 'Project Name 2', desc: "Some quick example text to build on the card title and make up the bulk of the card's content.", followers: 28 },
    { image: 'img/projects/3.jpg', name: 'Project Name 3', desc: "Some quick example text to build on the card title and make up the bulk of the card's content.", followers: 15 },
    { image: 'img/projects/4.jpg', name: 'Project Name 4', desc: "Some quick example text to build on the card title and make up the bulk of the card's content.", followers: 43 }
  ]
}
