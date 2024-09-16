import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RoleService } from '@services/role.service';
import { Role } from '../../common/interfaces/role';
import { MatDialog } from '@angular/material/dialog';
import { Settings, SettingsService } from '@services/settings.service';
import { UsersService } from '@services/users.service';
import { UserDialogComponent } from '../users/user-dialog/user-dialog.component';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxPaginationModule } from 'ngx-pagination';
import { PipesModule } from '../../theme/pipes/pipes.module';
import { AddRoleDialogComponent } from './add-role-dialog/add-role-dialog.component';
import { User } from '../../common/interfaces/user';
import { Subscription } from 'rxjs';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-role',
  styleUrl: './role.component.scss',
  standalone: true,
  imports: [
    MatTableModule,
    MatInputModule ,
    FormsModule,
    FlexLayoutModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatCardModule,
    NgxPaginationModule,
    PipesModule,
    DatePipe,
    UserDialogComponent,
    CommonModule
  ],
  templateUrl: './role.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [
    UsersService
  ]
})
export class RoleComponent implements OnInit, OnDestroy {
  public page:any;
  snackBar = inject(MatSnackBar)
  constructor(private roleService:RoleService,public settingsService: SettingsService, public dialog: MatDialog,  public usersService: UsersService){}

  ngOnInit(){
    this.getRoles()
  }

  roles: Role[] = [];
  roleSub!: Subscription;
  getRoles(){
    this.roleSub = this.roleService.getRole(this.searchText).subscribe((res)=>{
      this.roles = res;
    })
  }
 

  // Function to check if the role is restricted
  isRestrictedRole(roleName: string): boolean {
    const restrictedRoles = [
      'Sales Executive',
      'Key Account Manager',
      'Manager',
      'Accountant',
      'Team Lead',
      'Administrator'
    ];
    return restrictedRoles.includes(roleName);
  }

  // Other functions like openRoleDialog, deleteRole...

  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getRoles()
  }


  delete!: Subscription;
  deleteRole(id: number){
    let dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.delete = this.roleService.deleteRole(id).subscribe(res => {
          this.snackBar.open("Role deleted successfully...","" ,{duration:3000})
          this.getRoles()
        });
      }
    });
  }

  public openRoleDialog(user: any){
    let dialogRef = this.dialog.open(AddRoleDialogComponent, {
      data: user
    });
    dialogRef.afterClosed().subscribe(user => {
      this.getRoles()
    });
  }

  ngOnDestroy(): void {
    this.roleSub?.unsubscribe();
    this.delete?.unsubscribe();
  }

}
