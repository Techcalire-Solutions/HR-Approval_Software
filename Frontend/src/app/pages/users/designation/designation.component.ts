import { Component, inject, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoleService } from '@services/role.service';
import { SettingsService } from '@services/settings.service';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { Role } from '../../../common/interfaces/users/role';
import { DeleteDialogueComponent } from '../../../theme/components/delete-dialogue/delete-dialogue.component';
import { AddRoleDialogComponent } from '../../role/add-role-dialog/add-role-dialog.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Designation } from '../../../common/interfaces/users/designation';
import { AddDesignationComponent } from './add-designation/add-designation.component';

@Component({
  selector: 'app-designation',
  standalone: true,
  imports: [MatButtonToggleModule, MatPaginatorModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './designation.component.html',
  styleUrl: './designation.component.scss'
})
export class DesignationComponent {
  public page:any;
  snackBar = inject(MatSnackBar)
  constructor(private roleService:RoleService,public settingsService: SettingsService, public dialog: MatDialog,  public usersService: UsersService){}

  ngOnInit(){
    this.getRoles()
  }

  roles: Designation[] = [];
  roleSub!: Subscription;
  getRoles(){
    this.roleSub = this.roleService.getDesignation(this.searchText, this.currentPage, this.pageSize).subscribe((res: any)=>{
      this.roles = res.items;
      this.totalItems = res.count;
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
      'Administrator',
      'Approval Administrator',
      'HR Administrator',
      'Super Administrator',
      'HR'
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

  public openRoleDialog(role: any){
    let dialogRef = this.dialog.open(AddDesignationComponent, {
      data: role
    });
    dialogRef.afterClosed().subscribe(res => {
      this.getRoles()
    });
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getRoles();
  }

  ngOnDestroy(): void {
    this.roleSub?.unsubscribe();
    this.delete?.unsubscribe();
  }

}
