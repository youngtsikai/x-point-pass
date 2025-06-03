import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffEmergencyComponent } from './staff-emergency.component';

describe('StaffEmergencyComponent', () => {
  let component: StaffEmergencyComponent;
  let fixture: ComponentFixture<StaffEmergencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffEmergencyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffEmergencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
