import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffPassUpdateComponent } from './staff-pass-update.component';

describe('StaffPassUpdateComponent', () => {
  let component: StaffPassUpdateComponent;
  let fixture: ComponentFixture<StaffPassUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffPassUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffPassUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
