import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Kpi } from '../../../common/interfaces/kpi';
import { Designation } from '../../../common/interfaces/users/designation';
import { KpiService } from '@services/kpi.service';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-create-kpi',
  imports: [MatDialogModule, ReactiveFormsModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatDividerModule, MatProgressSpinnerModule],
  templateUrl: './create-kpi.component.html',
  styleUrl: './create-kpi.component.scss',
  standalone: true
})
export class CreateKpiComponent {
  kpiForm: FormGroup;
  kpis: Kpi[] = [];
  designations: Designation[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private designationKpiService: KpiService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateKpiComponent>
  ) {
    this.kpiForm = this.fb.group({
      kpiPoints: this.fb.array([this.createKpiPointFormGroup()])
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.designationKpiService.getKpis().subscribe(kpis => {
      this.kpis = kpis;
      this.designationKpiService.getDesignations().subscribe(designations => {
        this.designations = designations;
        this.isLoading = false;
      });
    });
  }

  createKpiPointFormGroup(): FormGroup {
    return this.fb.group({
      kpiId: ['', Validators.required],
      points: ['', [Validators.required, Validators.min(0)]],
      selectedDesignations: [[], Validators.required]
    });
  }

  get kpiPointsArray(): FormArray {
    return this.kpiForm.get('kpiPoints') as FormArray;
  }

  addKpiPoint(): void {
    this.kpiPointsArray.push(this.createKpiPointFormGroup());
  }

  removeKpiPoint(index: number): void {
    this.kpiPointsArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.kpiForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;
    const kpiPointsData = this.kpiForm.value.kpiPoints;

    const requests = kpiPointsData.flatMap(kpiPoint => {
      return kpiPoint.selectedDesignations.map((designationId: number) => ({
        kpiId: kpiPoint.kpiId,
        designationId: designationId,
        points: kpiPoint.points
      }));
    });

    this.designationKpiService.createKpiPoints(requests).subscribe({
      next: () => {
        this.snackBar.open('KPI Points created successfully!', 'Close', {
          duration: 3000
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Failed to create KPI Points', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error(err);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}