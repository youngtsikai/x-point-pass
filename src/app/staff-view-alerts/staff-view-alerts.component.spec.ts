import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffViewAlertsComponent } from './staff-view-alerts.component';

describe('StaffViewAlertsComponent', () => {
  let component: StaffViewAlertsComponent;
  let fixture: ComponentFixture<StaffViewAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffViewAlertsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffViewAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
