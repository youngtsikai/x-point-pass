import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckinLogsComponent } from './checkin-logs.component';

describe('CheckinLogsComponent', () => {
  let component: CheckinLogsComponent;
  let fixture: ComponentFixture<CheckinLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckinLogsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckinLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
