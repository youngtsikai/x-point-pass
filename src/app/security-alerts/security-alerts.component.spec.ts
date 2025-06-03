import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityAlertsComponent } from './security-alerts.component';

describe('SecurityAlertsComponent', () => {
  let component: SecurityAlertsComponent;
  let fixture: ComponentFixture<SecurityAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityAlertsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
