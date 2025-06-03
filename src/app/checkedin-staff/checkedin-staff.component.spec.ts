import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckedinStaffComponent } from './checkedin-staff.component';

describe('CheckedinStaffComponent', () => {
  let component: CheckedinStaffComponent;
  let fixture: ComponentFixture<CheckedinStaffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckedinStaffComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckedinStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
