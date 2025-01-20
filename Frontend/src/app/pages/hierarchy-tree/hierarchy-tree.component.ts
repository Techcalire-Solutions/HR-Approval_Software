import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { User } from '../../common/interfaces/users/user';

@Component({
  selector: 'app-hierarchy-tree',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './hierarchy-tree.component.html',
  styleUrl: './hierarchy-tree.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class HierarchyTreeComponent implements OnInit, OnDestroy{
  userImage = 'img/users/avatar.png';
  s3 ='https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/';
  userService = inject(UsersService)
  router = inject(Router)

  ngOnInit(): void {
    this.getDirectors()
  }

  getUsersByParent(parentId: number) {
    return this.hierarchy.filter(user => user.parent === parentId);
  }

  directorSub!: Subscription;
  directors: User[] = [];
  getDirectors(){
    this.directorSub = this.userService.getDirectors().subscribe(res=>{
      this.directors = res;
      for(let i = 0; i < res.length; i++){
        this.getUsersByDirector(res[i].id, 2)
      }
    })
  }

  userSub!: Subscription;
  len: number = 0;
  hierarchy: any[] = [];
  getUsersByDirector(id: number, level: number) {
    this.userSub = this.userService.getUserByRm(id).subscribe(res => {
      if (res.length !== 0) {
        for (let i = 0; i < res.length; i++) {
          this.hierarchy.push({
            id: res[i].id,
            name: res[i].name,
            parent: id,
            level: level,
            url: res[i].url
          });
          this.buildHierarchy(res[i].id, level + 1);
        }
      }
    });
  }

  buildHierarchy(parentId: number, level: number) {
    this.len = level;
    this.getUsersByDirector(parentId, level);
  }

  renderNodes(parentId: number, currentLevel: number, maxLevel: number): string {
    const children = this.getUsersByParent(parentId);
    let html = '<ul>';

    for (const child of children) {
      const imgSrc = child.url ? `${this.s3}${child.url}` : this.userImage;

      html += `<li>
        <a>
          <img src="${imgSrc}" alt="${child.name}">
          <span>${child.name}</span>
        </a>`;

      if (currentLevel < maxLevel) {
        html += this.renderNodes(child.id, currentLevel + 1, maxLevel);
      }
      html += '</li>';
    }

    html += '</ul>';
    return html;
  }



  ngOnDestroy(): void {

  }

  openUser(id: number){
    this.router.navigateByUrl('/login/users/view/'+id)
  }
}
