import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCheckinLogsComponent } from './admin-checkin-logs.component';

describe('AdminCheckinLogsComponent', () => {
  let component: AdminCheckinLogsComponent;
  let fixture: ComponentFixture<AdminCheckinLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCheckinLogsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCheckinLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
