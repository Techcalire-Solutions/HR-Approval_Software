import { UserDocumentsComponent } from './../user-documents/user-documents.component';
import { Component, inject, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { CommonModule, DatePipe } from '@angular/common';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { RoleService } from '../../../services/role.service';
import {MatToolbarModule} from '@angular/material/toolbar';
import { Role } from '../../../common/interfaces/role';
import { UsersService } from '../../../services/users.service';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { User } from '../../../common/interfaces/user';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PersonalDetailsComponent } from "../personal-details/personal-details.component";
import { UserPositionComponent } from '../user-position/user-position.component';
import { StatuatoryInfoComponent } from '../statuatory-info/statuatory-info.component';
import { UserAccountComponent } from "../user-account/user-account.component";
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from '../../../common/interfaces/team';
import { TeamService } from '@services/team.service';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';


@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [ ReactiveFormsModule, FlexLayoutModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatIconModule,  MatDatepickerModule,
    MatNativeDateModule, MatRadioModule, MatDialogModule,  MatButtonModule, MatCheckboxModule, DatePipe,  MatToolbarModule,
    PersonalDetailsComponent, UserPositionComponent, StatuatoryInfoComponent, UserAccountComponent, UserDocumentsComponent, MatCardModule,
    MatOptionModule, MatSelectModule, CommonModule
],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss'
})
export class UserDialogComponent implements OnInit, OnDestroy {
  url = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`;
  snackBar = inject(MatSnackBar);
  sanitizer = inject(DomSanitizer);
  fb = inject(FormBuilder)
  roleService = inject(RoleService);
  userService = inject(UsersService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  teamService = inject(TeamService)

  public form: FormGroup;
  public passwordHide: boolean = true;
  editStatus: boolean = false;
  id: number;
  ngOnInit() {
    this.route.params.subscribe(params => {
      this.id = params['id'];
      if (this.id) {
        this.editStatus = true;
        this.getUser(this.id)
      }else{
        this.generateEmployeeNumber()
      }
    });

    this.form = this.fb.group({
      empNo: [''],
      url: [''],
      name: [
        null,
        Validators.compose([Validators.required, Validators.minLength(3)])
      ],
      email: [
        null,
        Validators.compose([Validators.required, Validators.email])
      ],
      phoneNumber: [
        null,
        Validators.compose([Validators.required, Validators.pattern(/^\d{10}$/)])
      ],
      password: [
        null,
        Validators.compose([Validators.required, Validators.minLength(4)])
      ],
      roleId: [
        null,
        Validators.compose([Validators.required])
      ],
      teamId: [ null ]
    })

    this.getRoles()
    this.getTeam()
  }

  ngOnDestroy(): void {
   this.teamSub?.unsubscribe();
   this.roleSub?.unsubscribe();
   this.userSub?.unsubscribe();
   this.usersSub?.unsubscribe();
   this.uploadSub?.unsubscribe();
  }

  userSub!: Subscription;
  userName: string;
  getUser(id: number){
    this.userSub = this.userService.getUserById(id).subscribe(user=>{
      this.userName = user.name;
      this.patchUser(user)
    });
  }

  patchUser(user: User){
    this.invNo = user.empNo
    if(user.url != null && user.url != '' && user.url != 'undefined'){
      
      this.imageUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${user.url}`
    }
    this.form.patchValue({
      name: user.name,
      roleId: user.roleId,
      phoneNumber: user.phoneNumber,
      email: user.email,
      password: user.password,
      status: user.status,
      joiningDate: user.createdAt,
      teamId: user.teamId
    })
  }

  uploadProgress: number | null = null;
  uploadComplete: boolean = false;
  file!: any;
  uploadSub!: Subscription;
  fileType: string = '';
  imageUrl: string = '';
  public safeUrl!: SafeResourceUrl;
  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0];
    this.fileType = this.file.type.split('/')[1];
    if (this.file) {
      this.uploadComplete = false; // Set to false to show the progress bar

      let fileName = this.file.name;
      if (fileName.length > 12) {
        const splitName = fileName.split('.');
        fileName = splitName[0].substring(0, 12) + "... ." + splitName[1];
      }
      this.uploadSub = this.userService.uploadImage(this.file).subscribe({
        next: (invoice) => {

          this.imageUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${ invoice.fileUrl}`;
          if (this.imageUrl) {
            this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.imageUrl);
          }
          this.form.get('url')?.setValue(invoice.fileUrl);
          this.uploadComplete = true; // Set to true when upload is complete
        },
        error: (error) => {
          this.uploadComplete = true; // Set to true to remove the progress bar even on error
        }
      });
    }
  }

  hidePassword: boolean = true;
  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }



  roles:Role[]=[];
  roleSub!: Subscription;
  getRoles(){
    this.roleSub = this.roleService.getRole().subscribe((res)=>{
      this.roles = res;
    })
  }

  teams : Team[]=[]
  teamSub!:Subscription;
  getTeam(){
    this.teamSub = this.teamService.getTeam().subscribe((res)=>{
      this.teams = res;
    })
  }


  selectedTabIndex: number = 0;
  formSubmitted: boolean = true;
  isFormSubmitted: boolean = false;
  isWorkFormSubmitted: boolean = false;
  isContactsFormSubmitted: boolean = false;
  isSocialFormSubmitted: boolean = false;
  isAccountFormSubmitted: boolean = false;
  submit!: Subscription;
  onSubmit(){
    if(this.editStatus){
      this.submit = this.userService.updateUser(this.id, this.form.getRawValue()).subscribe((res)=>{
        this.snackBar.open("User updated succesfully...","" ,{duration:3000})
      })
    }else{
      this.submit = this.userService.addUser(this.form.getRawValue()).subscribe((res)=>{
        this.dataToPass = { id: res.user.id, empNo: this.invNo, name: res.user.name, updateStatus: this.editStatus };
        this.selectedTabIndex = 1;
        if (this.personalDetailsComponent && this.selectedTabIndex === 1) {
          this.personalDetailsComponent.ngOnInit();
        }
        this.isFormSubmitted = true;
        this.formSubmitted = false;
        this.snackBar.open("User added succesfully...","" ,{duration:3000})
      })
    }
  }

  personalSubmit(event: any){
    this.isWorkFormSubmitted = event.isFormSubmitted
    this.isFormSubmitted = false;
    this.selectedTabIndex = 2;
  }

  workSubmit(event: any){
    this.isContactsFormSubmitted = event.isFormSubmitted
    this.isWorkFormSubmitted = false;
    this.selectedTabIndex = 3
  }

  contactSubmit(event: any){
    this.isSocialFormSubmitted = event.isFormSubmitted
    this.isContactsFormSubmitted = false;
    this.selectedTabIndex = 4
    if (this.userAccountComponent && this.selectedTabIndex === 4) {
      this.userAccountComponent.ngOnInit();
    }
  }

  accountSubmit(event: any){
    this.isAccountFormSubmitted = event.isFormSubmitted
    this.isSocialFormSubmitted = false;
    this.selectedTabIndex = 5
    if (this.userDocumentsComponent && this.selectedTabIndex === 5) {
      this.userDocumentsComponent.trigger();
    }
  }

  dataToPass: any;
  positionData: any;
  statuatoryData: any;
  accountData: any;
  invNo: string;
  usersSub!: Subscription;
  generateEmployeeNumber() {
    let prefix: any;
    const currentYear = new Date().getFullYear();

    this.userService.getUser().subscribe((res) => {
      let users = res;

      if (users.length > 0) {
        const maxId = users.reduce((prevMax, inv) => {
          const empNoParts = inv.empNo.split('-'); // Split by '-'

          // Extract the numeric portion that represents the ID, assuming it's the last part
          const idNumber = parseInt(empNoParts[empNoParts.length - 1], 10);

          prefix = this.extractLetters(inv.empNo); // Get the prefix

          if (!isNaN(idNumber)) {
            // Compare and return the maximum ID
            return idNumber > prevMax ? idNumber : prevMax;
          } else {
            return prevMax;
          }
        }, 0);

        // Increment the maxId by 1 to get the next ID
        let nextId = maxId + 1;

        const paddedId = `${prefix}-${currentYear}-${nextId.toString().padStart(3, "0")}`;

        let ivNum = paddedId;
        this.invNo = ivNum;
        this.form.get('empNo')?.setValue(ivNum);
      } else {
        // If there are no employees in the array, set the employeeId to 'EMP001'
        let nextId = 0o1;
        prefix =  `OAC-${currentYear}-`;

        const paddedId = `${prefix}${nextId.toString().padStart(3, "0")}`;

        let ivNum = paddedId;

        this.form.get('envNo')?.setValue(ivNum);
        this.invNo = ivNum;
      }
    });
  }

  extractLetters(input: string): string {
    const match = input.match(/^[A-Za-z]+/);

    return match ? match[0] : '';
  }

  @ViewChild(PersonalDetailsComponent) personalDetailsComponent!: PersonalDetailsComponent;
  @ViewChild(UserPositionComponent) userPositionComponent!: UserPositionComponent;
  @ViewChild(StatuatoryInfoComponent) statuatoryInfoComponent!: StatuatoryInfoComponent;
  @ViewChild(UserAccountComponent) userAccountComponent!: UserAccountComponent;
  @ViewChild(UserDocumentsComponent) userDocumentsComponent!: UserDocumentsComponent;
  goToNextTab() {
    if (this.selectedTabIndex < 5) {
      if( this.dataToPass === undefined){
        this.dataToPass = { updateStatus: this.editStatus, id: this.id, name: this.userName }
      }
      this.selectedTabIndex++;

      if (this.personalDetailsComponent && this.selectedTabIndex === 1) {
        this.isFormSubmitted = true;
        this.personalDetailsComponent.triggerNew(this.dataToPass);
      }
      else if (this.userPositionComponent && this.selectedTabIndex === 2) {
        this.isWorkFormSubmitted = true;
        this.userPositionComponent.triggerNew(this.dataToPass);
      }
      else if (this.statuatoryInfoComponent && this.selectedTabIndex === 3) {
        this.isContactsFormSubmitted = true;
        this.statuatoryInfoComponent.triggerNew(this.dataToPass);
      }
      else if (this.userAccountComponent && this.selectedTabIndex === 4) {
        this.isSocialFormSubmitted = true;
        this.userAccountComponent.triggerNew(this.dataToPass);
      }
      else if (this.userDocumentsComponent && this.selectedTabIndex === 5) {
        this.isAccountFormSubmitted = true;
        this.userDocumentsComponent.triggerNew(this.dataToPass);
      }
    }
  }

  generateRandomPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    this.form.get('password')?.setValue(password);
    this.form.get('confirmPassword')?.setValue(password);  // Clear confirm password
  }

  copyEmpNoAndPassword() {
    const empNo = this.form.get('empNo')?.value;
    const password = this.form.get('password')?.value;

    if (empNo && password) {
      const textToCopy = `Emp ID: ${empNo}\nPassword: ${password}`;
      navigator.clipboard.writeText(textToCopy).then(
        () => {
          console.log('Email and password copied to clipboard');
        },
        (err) => {
          console.error('Could not copy text: ', err);
        }
      );
    }
  }

  deleteImage() {
    if(this.id){
      this.userService.deleteUserImage(this.id, this.imageUrl).subscribe(data=>{
        this.imageUrl = ''
        this.snackBar.open("User image is deleted successfully...","" ,{duration:3000})
        this.getUser(this.id)
      });
    }else{
      this.userService.deleteUserImageByurl(this.imageUrl).subscribe(data=>{
        this.imageUrl = ''
        this.snackBar.open("User image is deleted successfully...","" ,{duration:3000})
      });
    }
  }
}


