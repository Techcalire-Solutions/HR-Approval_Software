import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { LeaveService } from '@services/leave.service';
import { Subscription } from 'rxjs';
import { Holidays } from '../../../common/interfaces/leaves/holidays';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RoleService } from '@services/role.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-holiday-calendar',
  standalone: true,
  imports: [MatCardModule, MatPaginatorModule, MatIconModule, MatChipListbox, MatChipOption, CommonModule],
  templateUrl: './holiday-calendar.component.html',
  styleUrl: './holiday-calendar.component.scss'
})
export class HolidayCalendarComponent implements OnInit, OnDestroy{

  leaveService = inject(LeaveService);
  roleService = inject(RoleService);
  dialog = inject(MatDialog);
  router = inject(Router);
  ngOnInit(): void {
    this.getHolidaysForYear();

    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)

    let roleId = user.role
    this.getRoleById(roleId)
  }

  selectedFile: File | null = null;


  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  // Handles file input change
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      this.selectedFile = file;
    } else {
      this.snackBar.open('Please select a valid Excel file.', 'Close', { duration: 3000 });
    }
  }

  // Uploads the file to the server
  uploadFile() {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      this.http.post(`${environment.apiUrl}/holidays/upload`, formData).subscribe(
        (response: any) => {
          console.log(response,"holoiiiiiiiiiiiiiiiiiiii");

          this.snackBar.open('Holidays uploaded successfully!', 'Close', { duration: 3000 });

          this.getHolidaysForYear();
          this.router.navigateByUrl('/login')
          this.resetPage();


        },
        (error) => {
          this.snackBar.open('Failed to upload holidays. Please try again.', 'Close', { duration: 3000 });
        }
      );
    } else {
      this.snackBar.open('No file selected.', 'Close', { duration: 3000 });
    }
  }

  resetPage(){


    // Reset selected file
    this.selectedFile = null;
  }



  roleSub!: Subscription;
  roleName: string = '';
  getRoleById(id: number){
    this.roleSub = this.roleService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;
    })
  }

  holidaySub!: Subscription;
  holidays: Holidays[] = [];
  getHolidaysForYear(): void {
    this.holidaySub = this.leaveService.getHolidays(this.searchText, this.currentPage, this.pageSize).subscribe((res: any) => {
      this.holidays = res.items
      this.totalItems = res.count;
    })
  }



  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 5;
  currentPage = 1;
  totalItems: number;
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getHolidaysForYear();
  }

  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getHolidaysForYear()
  }


  ngOnDestroy(): void {
    this.holidaySub?.unsubscribe();
  }

  openCompoOff(id: number){
    this.router.navigateByUrl('/login/admin-leave/compo-off/'+id)
  }

}
