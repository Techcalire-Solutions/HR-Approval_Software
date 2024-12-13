import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY', // Change to desired format
  },
  display: {
    dateInput: 'DD/MM/YYYY', // Display format for the input field
    monthYearLabel: 'MMM YYYY', // Format for month/year in the header
    dateA11yLabel: 'DD/MM/YYYY', // Accessibility format for dates
    monthYearA11yLabel: 'MMMM YYYY', // Accessibility format for month/year
  },
};

@Component({
  selector: 'app-asset-return',
  standalone: true,
  imports: [MatToolbarModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatIconModule, MatButtonModule],
  templateUrl: './asset-return.component.html',
  styleUrl: './asset-return.component.scss',
    providers: [provideMomentDateAdapter(MY_FORMATS), DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetReturnComponent {
  private fb = inject(FormBuilder);
  assetReturnForm = this.fb.group({
    note: [''], 
    returnDate: ['']
  })
  
  private dialogRef = inject(MatDialogRef<AssetReturnComponent>)
  onCancel(){
    this.dialogRef.close({ confirmed: false });
  }

  private datePipe = inject(DatePipe);
  onConfirm() {
    if (this.assetReturnForm.valid) {
      const formattedDate = this.datePipe.transform(this.assetReturnForm.value.returnDate, 'yyyy-MM-dd');
      this.dialogRef.close({ 
        confirmed: true, 
        data: {
          note: this.assetReturnForm.value.note,
          returnDate: formattedDate
        }
      });
    }
  }
}
