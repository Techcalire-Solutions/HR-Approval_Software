/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, Input, Output, inject, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { Designation } from '../../../common/interfaces/users/designation';
import { RoleService } from '@services/role.service';
import { MatDialog } from '@angular/material/dialog';
import { Team } from '../../../common/interfaces/users/team';
import { TeamService } from '@services/team.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../personal-details/personal-details.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-user-position',
  standalone: true,
  imports: [ MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatCardModule, MatOptionModule, MatSelectModule,
    MatAutocompleteModule, MatIconModule, MatDatepickerModule
   ],
  templateUrl: './user-position.component.html',
  styleUrl: './user-position.component.scss',
  providers: [provideMomentDateAdapter(MY_FORMATS), DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPositionComponent implements OnDestroy {
  ngOnDestroy(): void {
    this.pUSub?.unsubscribe();
    this.submitSub?.unsubscribe();
    this.roleSub?.unsubscribe();
  }

  designation: Designation[]=[];
  roleSub!: Subscription;
  public filteredOptions: Designation[] = [];
  private roleService = inject(RoleService);
  getRoles(){
    this.roleSub = this.roleService.getDesignation().subscribe((res)=>{
      this.designation = res;
      this.filteredOptions = this.designation;
    })
  }

  filterValue: string;
  search(event: Event) {
    this.filterValue = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
    this.filteredOptions = this.designation.filter(option =>
      option.designationName.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)||
      option.abbreviation.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)
    );
  }

  patch(selectedSuggestion: Designation) {
    this.form.patchValue({ designationId: selectedSuggestion.id, designationName: selectedSuggestion.designationName });
  }

  private dialog = inject(MatDialog);
  add(){
    // const name = this.filterValue;
    // const dialogRef = this.dialog.open(AddRoleDialogComponent, {
    //   data: {type : 'add', name: name}
    // });

    // dialogRef.afterClosed().subscribe(() => {
    //   this.getRoles()
    // })
  }

  departments = [
    { name: 'Operation', abbreviation: 'OP' },
    { name: 'Sales', abbreviation: 'SL' },
    { name: 'Finance', abbreviation: 'FN' },
    { name: 'Designing', abbreviation: 'DS' },
    { name: 'Logistics', abbreviation: 'LG' },
    { name: 'HR', abbreviation: 'HR' },
    { name: 'Marketing', abbreviation: 'MK' },
    { name: 'IT', abbreviation: 'IT' },
  ];
  @Input() positionData: any;

  fb = inject(FormBuilder);
  userService = inject(UsersService);
  snackBar = inject(MatSnackBar);

  form = this.fb.group({
    userId : [],
    division : [''],
    costCentre : [''],
    grade : [''],
    designationName : [''],
    location : [''],
    department : <any>[],
    office  : [''],
    salary : [''],
    probationPeriod : <any>[],
    officialMailId: ['', Validators.email],
    projectMailId: ['', Validators.email],
    designationId: <any>[ Validators.required],
    teamId: <any>[],
    confirmationDate: []
  });

  editStatus: boolean = false;
  triggerNew(data?: any): void {
    this.getRoles();
    this.getTeam();
    if(data){
      // if(data.updateStatus){
        this.getPositionDetailsByUser(data.id);
        const confirmationDate: any = this.form.get('confirmationDate')?.value;
        this.form.get('confirmationDate')?.setValue(confirmationDate); 
      // }
    }
  }

  pUSub!: Subscription;
  id: number
  getPositionDetailsByUser(id: number){
    this.pUSub = this.userService.getUserPositionDetailsByUser(id).subscribe(data=>{
      if(data){
        this.id = data.id;
        this.editStatus = true;
        this.form.patchValue({
          division : data.division,
          costCentre : data.costCentre,
          grade : data.grade,
          location : data.location,
          department : data.department,
          office  : data.office,
          salary : data.salary,
          probationPeriod: data.probationPeriod,
          officialMailId: data.officialMailId,
          projectMailId: data.projectMailId,
          designationId: data.designationId,
          designationName: data.designation?.designationName,
          teamId: data.teamId,
          confirmationDate: data.confirmationDate
        })
      }
    })
  }

  @Output() dataSubmitted = new EventEmitter<any>();
  submitSub!: Subscription;
  isNext: boolean = false;
  private datePipe = inject(DatePipe);
  onSubmit(){
    this.isNext =true
    const submit = {
      ...this.form.getRawValue()
    }
    submit.userId = submit.userId ? submit.userId : this.positionData.id;
    if (this.form.get('confirmationDate')?.value) {
      const confirmationDate = this.form.get('confirmationDate')?.value; 
      submit.confirmationDate = this.datePipe.transform(confirmationDate, 'yyyy-MM-dd') || null;
    }
    if(this.editStatus){
      this.submitSub = this.userService.updateUserPosition(this.id, submit).subscribe(() => {
        this.snackBar.open("Postion Details updated succesfully...","" ,{duration:3000})
        // this.dataSubmitted.emit( {isFormSubmitted: true} );
      })
    }else{
      this.submitSub = this.userService.addUserPositionDetails(submit).subscribe((res) => {        
        this.editStatus = true;
        this.id = res.id;
        this.snackBar.open("Postion Details added succesfully...","" ,{duration:3000})
        // this.dataSubmitted.emit( {isFormSubmitted: true} );
      })
    }
  }

  @Output() nextTab = new EventEmitter<void>();
  triggerNextTab() {
    this.nextTab.emit();
  }

  @Output() previousTab = new EventEmitter<void>();
  triggerPreviousTab() {
    this.previousTab.emit();
  }

  teams : Team[]=[]
  teamSub!:Subscription;
  private teamService = inject(TeamService);
  getTeam(){
    this.teamSub = this.teamService.getTeam().subscribe((res)=>{
      this.teams = res;
    })
  }
}
