import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminViewAlertsComponent } from './admin-view-alerts.component';

describe('AdminViewAlertsComponent', () => {
  let component: AdminViewAlertsComponent;
  let fixture: ComponentFixture<AdminViewAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminViewAlertsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminViewAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
