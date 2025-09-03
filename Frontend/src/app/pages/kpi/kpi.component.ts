import { Component, inject } from '@angular/core';
import { RoleService } from '@services/role.service';
import { Designation } from '../../common/interfaces/users/designation';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi',
  imports: [MatProgressBarModule, MatCardModule, MatExpansionModule, MatTableModule, MatIconModule, CommonModule],
  templateUrl: './kpi.component.html',
  styleUrl: './kpi.component.scss',
  standalone: true
})
export class KpiComponent {
  displayedColumns: string[] = ['parameter', 'points', 'actions'];
  dataSources: {[key: number]: MatTableDataSource<Designation>} = {};
  designations: Designation[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadDesignations();
  }

  private designationService = inject(RoleService);
  loadDesignations(): void {
    this.isLoading = true;
    this.designationService.getDesignation().subscribe({
      next: (data) => {
        this.designations = data;
        console.log(this.designations);
        
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load designations and KPIs';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  openEditDialog(kpi: any): void {
    // const dialogRef = this.dialog.open(KpiPointsEditorComponent, {
    //   width: '400px',
    //   data: { designationKpi: kpi }
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result === 'updated') {
    //     this.loadDesignations();
    //   }
    // });
  }
}