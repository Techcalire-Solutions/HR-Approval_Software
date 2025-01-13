/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserDocumentsComponent } from './../user-documents/user-documents.component';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { CommonModule } from '@angular/common';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UsersService } from '../../../services/users.service';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PersonalDetailsComponent } from "../personal-details/personal-details.component";
import { UserPositionComponent } from '../user-position/user-position.component';
import { StatuatoryInfoComponent } from '../statuatory-info/statuatory-info.component';
import { UserAccountComponent } from "../user-account/user-account.component";
import { ActivatedRoute } from '@angular/router';
import { TeamService } from '@services/team.service';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { User } from '../../../common/interfaces/users/user';
import { UserNomineeComponent } from "../user-nominee/user-nominee.component";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, FlexLayoutModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatNativeDateModule, MatRadioModule, MatDialogModule, MatButtonModule, MatToolbarModule, MatProgressSpinnerModule,
    PersonalDetailsComponent, UserPositionComponent, StatuatoryInfoComponent, UserAccountComponent, UserDocumentsComponent, MatCardModule,
    MatOptionModule, MatSelectModule, CommonModule, MatAutocompleteModule, UserNomineeComponent],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss'
})
export class UserDialogComponent implements OnInit, OnDestroy {
  url = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`;
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder)
  private userService = inject(UsersService);
  private route = inject(ActivatedRoute);
  private teamService = inject(TeamService)

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
  }

  form = this.fb.group({
    empNo: [''],
    url: [''],
    name: [ '',  Validators.compose([Validators.required, Validators.minLength(3)]) ],
    email: [ '', Validators.compose([Validators.required, Validators.email]) ],
    phoneNumber: [ '',  Validators.compose([Validators.required, Validators.pattern(/^\d{10}$/)]) ],
    password: [ '', Validators.compose([Validators.required, Validators.minLength(4)]) ],
    roleName: [],
    teamId: <any>[  ]
  })

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.usersSub?.unsubscribe();
    this.uploadSub?.unsubscribe();
    this.delete?.unsubscribe();
  }

  userSub!: Subscription;
  userName: string;
  getUser(id: number){
    this.id = id;
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
      phoneNumber: user.phoneNumber,
      email: user.email,
      password: user.password,
      teamId: user.teamId
    })
    // this.patch(user.role)
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
      this.uploadComplete = false;

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
        error: () => {
          this.uploadComplete = true; // Set to true to remove the progress bar even on error
        }
      });
    }
  }

  hidePassword: boolean = true;
  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }




  selectedTabIndex: number = 0;
  formSubmitted: boolean = true;
  isFormSubmitted: boolean = false;
  isWorkFormSubmitted: boolean = false;
  isContactsFormSubmitted: boolean = false;
  isSocialFormSubmitted: boolean = false;
  isAccountFormSubmitted: boolean = false;
  isQualFormSubmitted: boolean = false;
  isNomineeFormSubmitted: boolean = false;
  submit!: Subscription;
  onSubmit(){
    this.isLoading = true;
    if(this.editStatus){
      this.submit = this.userService.updateUser(this.id, this.form.getRawValue()).subscribe(()=>{
        this.snackBar.open("User updated succesfully...","" ,{duration:3000})
        this.isLoading = false;
      })
    }else{
      this.submit = this.userService.addUser(this.form.getRawValue()).subscribe((res) => {        
        this.editStatus = true;
        this.id = res.id;
        this.userName = res.name
        this.dataToPass = { id: res.id, empNo: this.invNo, name: res.name, updateStatus: this.editStatus };
        // this.selectedTabIndex = 1;
        // if (this.personalDetailsComponent && this.selectedTabIndex === 1) {
        //   this.personalDetailsComponent.ngOnInit();
        // }
        this.isFormSubmitted = true;
        this.formSubmitted = false;
        this.snackBar.open("User added succesfully...","" ,{duration:3000})
        this.isLoading = false;
      })
    }
  }

  personalSubmit(event: any){
    this.isWorkFormSubmitted = event.isFormSubmitted
    this.isFormSubmitted = false;
    this.selectedTabIndex = 2;
    if (this.userPositionComponent && this.selectedTabIndex === 2) {
      this.userPositionComponent.triggerNew();
    }
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
    this.isNomineeFormSubmitted = event.isFormSubmitted
    this.isSocialFormSubmitted = false;
    this.selectedTabIndex = 5
    // if (this.userNomineeComponent && this.selectedTabIndex === 5) {
    //   this.userNomineeComponent.ngOnInit();
    // }
  }

  nomineeSubmit(event: any){
    this.isAccountFormSubmitted = event.isFormSubmitted
    this.isNomineeFormSubmitted = false;
    this.selectedTabIndex = 6
    if (this.userDocumentsComponent && this.selectedTabIndex === 6) {
      this.userDocumentsComponent.trigger();
    }
  }

  // qualSubmit(event: any){
  //   this.isAccountFormSubmitted = event.isFormSubmitted
  //   this.isQualFormSubmitted = false;
  //   this.selectedTabIndex = 6
  //   if (this.userDocumentsComponent && this.selectedTabIndex === 6) {
  //     this.userDocumentsComponent.trigger();
  //   }
  // }

  dataToPass: any;
  positionData: any;
  statuatoryData: any;
  accountData: any;
  invNo: string;
  usersSub!: Subscription;
  generateEmployeeNumber() {
    let prefix: any;
    const currentYear = new Date().getFullYear();

    this.userSub = this.userService.getUser().subscribe((res) => {
      const users = res;

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
        const nextId = maxId + 1;

        const paddedId = `${prefix}-${currentYear}-${nextId.toString().padStart(3, "0")}`;

        const ivNum = paddedId;
        this.invNo = ivNum;
        this.form.get('empNo')?.setValue(ivNum);
      } else {
        // If there are no employees in the array, set the employeeId to 'EMP001'
        const nextId = 0o1;
        prefix =  `OAC-${currentYear}-`;

        const paddedId = `${prefix}${nextId.toString().padStart(3, "0")}`;

        const ivNum = paddedId;

        this.form.get('empNo')?.setValue(ivNum);
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
  @ViewChild(UserNomineeComponent) userNomineeComponent!: UserNomineeComponent;
  // @ViewChild(UserQualificationComponent) userQualificationComponent!: UserQualificationComponent;
  goToNextTab() {
    if (this.selectedTabIndex < 6) {
      if( this.dataToPass === undefined){
        this.dataToPass = { updateStatus: this.editStatus, id: this.id, name: this.userName }
      }
      this.selectedTabIndex++;

      if (this.personalDetailsComponent && this.selectedTabIndex === 1) {
        this.isFormSubmitted = true;
        this.personalDetailsComponent.triggerNew(this.dataToPass);
      }

      else if (this.userPositionComponent && this.selectedTabIndex === 2) {
        this.isFormSubmitted = false;
        this.isWorkFormSubmitted = true;
        this.userPositionComponent.triggerNew(this.dataToPass);
      }
      else if (this.statuatoryInfoComponent && this.selectedTabIndex === 3) {
        this.isWorkFormSubmitted = false;
        this.isContactsFormSubmitted = true;
        this.statuatoryInfoComponent.triggerNew(this.dataToPass);
      }
      else if (this.userAccountComponent && this.selectedTabIndex === 4) {
        this.isContactsFormSubmitted = false;
        this.isSocialFormSubmitted = true;
        this.userAccountComponent.triggerNew(this.dataToPass);
      }
      else if (this.userNomineeComponent && this.selectedTabIndex === 5) {
        this.isSocialFormSubmitted = false;
        this.isNomineeFormSubmitted = true;
        this.userNomineeComponent.triggerNew(this.dataToPass);
      }
      // else if (this.userQualificationComponent && this.selectedTabIndex === 5) {
      //   this.isSocialFormSubmitted = false;
      //   this.isQualFormSubmitted = true;
      //   this.userQualificationComponent.triggerNew(this.dataToPass);
      // }
      
      else if (this.userDocumentsComponent && this.selectedTabIndex === 6) {
        this.isNomineeFormSubmitted = false;
        this.isAccountFormSubmitted = true;
        this.userDocumentsComponent.triggerNew(this.dataToPass);
      }
    }
  }

  // editStatus: boolean = false;
  triggerNew(data?: any): void {
    if(data){
      this.editStatus = true;
      this.getUser(data.id)
    }
  }

  goToPreviousTab(): void {
    if (this.selectedTabIndex > 0) {
      if( this.dataToPass === undefined){
        this.dataToPass = { updateStatus: this.editStatus, id: this.id, name: this.userName }
      }
      this.selectedTabIndex --;
      if(this.selectedTabIndex === 0){
          this.triggerNew(this.dataToPass)
      }

      if (this.personalDetailsComponent && this.selectedTabIndex === 1) {
        this.isFormSubmitted = true;
        this.personalDetailsComponent.triggerNew(this.dataToPass);
      }
      
      else if (this.userPositionComponent && this.selectedTabIndex === 2) {
        this.isFormSubmitted = false;
        this.isWorkFormSubmitted = true;
        this.userPositionComponent.triggerNew(this.dataToPass);
      }
      else if (this.statuatoryInfoComponent && this.selectedTabIndex === 3) {
        this.isWorkFormSubmitted = false;
        this.isContactsFormSubmitted = true;
        this.statuatoryInfoComponent.triggerNew(this.dataToPass);
      }
      else if (this.userAccountComponent && this.selectedTabIndex === 4) {
        this.isContactsFormSubmitted = false;
        this.isSocialFormSubmitted = true;
        this.userAccountComponent.triggerNew(this.dataToPass);
      }
      else if (this.userNomineeComponent && this.selectedTabIndex === 5) {
        this.isSocialFormSubmitted = false;
        this.isNomineeFormSubmitted = true;
        this.userNomineeComponent.triggerNew(this.dataToPass);
      }
      // else if (this.userQualificationComponent && this.selectedTabIndex === 5) {
      //   this.isSocialFormSubmitted = false;
      //   this.isQualFormSubmitted = true;
      //   this.userQualificationComponent.triggerNew(this.dataToPass);
      // }
      
      else if (this.userDocumentsComponent && this.selectedTabIndex === 6) {
        this.isQualFormSubmitted = false;
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
    // this.form.get('confirmPassword')?.setValue(password);  // Clear confirm password
  }

  copyEmpNoAndPassword() {
    const empNo = this.form.get('empNo')?.value;
    const password = this.form.get('password')?.value;

    if (empNo && password) {
      const textToCopy = `Emp ID: ${empNo}\nPassword: ${password}`;
      navigator.clipboard.writeText(textToCopy).then(
        () => {
          this.snackBar.open('Email and password copied to clipboard',"" ,{duration:3000});
        },
        (err) => {
          console.error('Could not copy text: ', err);
        }
      );
    }
  }

  delete!: Subscription;
  deleteImage() {
    if(this.id){
      this.delete = this.userService.deleteUserImage(this.id, this.imageUrl).subscribe(()=>{
        this.imageUrl = ''
        this.snackBar.open("User image is deleted successfully...","" ,{duration:3000})
        this.getUser(this.id)
      });
    }else{
      this.delete = this.userService.deleteUserImageByurl(this.imageUrl).subscribe(()=>{
        this.imageUrl = ''
        this.snackBar.open("User image is deleted successfully...","" ,{duration:3000})
      });
    }
  }

  isLoading: boolean
  updateLoadingState(isLoading: any): void {
      this.isLoading = isLoading;
  }
}


