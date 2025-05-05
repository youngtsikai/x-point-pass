import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorViewAlertsComponent } from './visitor-view-alerts.component';

describe('VisitorViewAlertsComponent', () => {
  let component: VisitorViewAlertsComponent;
  let fixture: ComponentFixture<VisitorViewAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorViewAlertsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorViewAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
