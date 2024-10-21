import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteDialogueComponent } from './delete-dialogue.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

describe('DeleteDialogueComponent', () => {
  let component: DeleteDialogueComponent;
  let fixture: ComponentFixture<DeleteDialogueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteDialogueComponent], // Since it's standalone, use imports
      providers: [
        { provide: MatDialogRef, useValue: {} }, // Mock MatDialogRef
        { provide: MAT_DIALOG_DATA, useValue: {} }, // Optional: Mock dialog data if used
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteDialogueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
