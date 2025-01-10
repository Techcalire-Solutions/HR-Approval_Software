import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { LeaveService } from '@services/leave.service';
import { RoleService } from '@services/role.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Leave } from '../../../common/interfaces/leaves/leave';

@Component({
  selector: 'app-leave-requests-notification',
  standalone: true,
  imports: [MatCardModule, MatPaginatorModule, MatIconModule, MatChipListbox, MatChipOption, CommonModule],
  templateUrl: './leave-requests-notification.component.html',
  styleUrl: './leave-requests-notification.component.scss'
})
export class LeaveRequestsNotificationComponent {


  leaveService = inject(LeaveService);
  roleService = inject(RoleService);
  dialog = inject(MatDialog);
  router = inject(Router);
  ngOnInit(): void {

    this.getLeaves('requested');


    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)

    let roleId = user.role
    this.getRoleById(roleId)
  }

  roleSub!: Subscription;
  roleName: string = '';
  getRoleById(id: number){
    this.roleSub = this.roleService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;
    })
  }
  leaves: any[] = [];
  leaveSub: Subscription = new Subscription();
  totalItems: number = 0;
  pageSize = 5;
  currentPage = 1;
  searchText: string = '';


  getLeaves(status: string) {
    this.leaveSub = this.leaveService.getLeavesPaginated(this.searchText, this.currentPage, this.pageSize).subscribe(
      (res: any) => {
        console.log(res.items);

        // Filter leaves based on the Requested status
        this.leaves = res.items
          .filter((leave: Leave) => (status === 'requested' ? leave.status === 'requested' : true)) // Filter by 'Requested' status
          .map((leave: Leave) => ({
            ...leave,
            userName: leave.user?.name || 'Unknown',
            leaveTypeName: leave.leaveType?.leaveTypeName || 'Unknown'
          }));

        this.totalItems = res.count;

        if (this.leaves.length === 0) {
          console.warn('No leaves found');
        } else {
          console.log('Updated Leaves:', this.leaves); // For debugging
        }
      },
      (error) => {
        console.error('Error fetching leaves:', error); // Error handling
      }
    );
}

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getLeaves('Requested');
  }

  search(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value.trim();
    this.currentPage = 1; // Reset to first page on new search
    this.getLeaves('Requested');
  }

  ngOnDestroy(): void {
    this.leaveSub.unsubscribe(); // Clean up subscription
  }




  redirectToViewLeaveRequests() {
    this.router.navigate(['login/admin-leave/view-leave-request']);
}

}

