/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { HolidayService } from '@services/holiday.service';
import { Subscription } from 'rxjs';
import { Holidays } from '../../common/interfaces/leaves/holidays';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddHolidayComponent } from './add-holiday/add-holiday.component';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../users/personal-details/personal-details.component';
import { DeleteConfirmationComponent } from './delete-confirmation/delete-confirmation.component';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-holiday',
  standalone: true,
  imports: [MatButtonToggleModule, MatFormFieldModule, MatPaginatorModule, CommonModule, MatIconModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, FormsModule
  ],
  templateUrl: './holiday.component.html',
  styleUrl: './holiday.component.scss',
    providers: [provideMomentDateAdapter(MY_FORMATS), DatePipe],
})
export class HolidayComponent implements OnInit, OnDestroy{
  yearList: number[] = [];
  currentYear: number | null;
  selectedDate: Date | null = null;
  searchValue: string | null;

  ngOnInit(): void {
    this.getHolidays();

    this.currentYear = new Date().getFullYear();
    for (let year = this.currentYear; year >= 2000; year--) {
      this.yearList.push(year);
    }
  }

  holidaySub!: Subscription;
  private readonly holidayService = inject(HolidayService);
  holidays: Holidays[] = [];
  getHolidays(){
    this.holidaySub = this.holidayService.getAllHolidays().subscribe((holidays: any) => {
      this.holidays = holidays;
    });
  }

  openDialog(data: any | null){
    const dialogRef = this.dialog.open(AddHolidayComponent, {
      data: data
    });
    dialogRef.afterClosed().subscribe(() => {
      this.currentYear = new Date().getFullYear();
      this.getHolidays()
    });
  }

  private deleteSub: Subscription;
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private dialogSub!: Subscription;
  delete(id: number){
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    this.dialogSub = dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.deleteSub = this.holidayService.deleteHolidays(id).subscribe(() => {
          this.getHolidays();
          this.snackBar.open("Holiday deleted successfully...","" ,{duration:3000})
        })
      }
    });
  }

  search(event: Event){
    const searchText = (event.target as HTMLInputElement).value.trim()    
    this.currentYear = null;
    this.selectedDate = null;
    this.holidaySub = this.holidayService.getHolidayByName(searchText).subscribe((holidays: any) => {
      this.holidays = holidays;
    });
  }

  filterSub!: Subscription;
  private readonly datePipe = inject(DatePipe);
  onDateChange(event: any) {
    const convertedDate = this.datePipe.transform(event, 'yyyy-MM-dd');
    this.currentYear = null;
    this.searchValue = null;
    this.holidaySub = this.holidayService.getHolidayByDate(convertedDate).subscribe(res => {
      this.holidays = res
    });
  }

  onYearChange(event: any) {
    this.selectedDate = null;
    this.searchValue = null;
    const selectedYear = event.value;
    this.holidaySub = this.holidayService.getHolidayByYear(selectedYear).subscribe(res => {
      this.holidays = res
    });
  }
  deleteAll(){
    const ids = this.holidays.map(holiday => holiday.id);
    const dialogRef = this.dialog.open(DeleteConfirmationComponent, {
      data: {
        holidays: this.holidays
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteSub = this.holidayService.deleteHolidaysByYear(ids).subscribe(() => {
          this.snackBar.open("Holidays deleted successfully...","" ,{duration:3000})
          this.getHolidays();
        });
      }else {
        alert('Deletion canceled');
      }
    });
  } 

  private readonly router = inject(Router);
  openCompoOff(id: number){
    this.router.navigateByUrl('/login/holiday/compo-off/'+id)
  }

  ngOnDestroy(): void {
    this.holidaySub?.unsubscribe();
    this.deleteSub?.unsubscribe();
    this.dialogSub?.unsubscribe();
  }

}
