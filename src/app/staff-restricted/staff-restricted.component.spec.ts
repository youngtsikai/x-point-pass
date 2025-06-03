import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffRestrictedComponent } from './staff-restricted.component';

describe('StaffRestrictedComponent', () => {
  let component: StaffRestrictedComponent;
  let fixture: ComponentFixture<StaffRestrictedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffRestrictedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffRestrictedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
