import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffCheckInComponent } from './staff-check-in.component';

describe('StaffCheckInComponent', () => {
  let component: StaffCheckInComponent;
  let fixture: ComponentFixture<StaffCheckInComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffCheckInComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffCheckInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
