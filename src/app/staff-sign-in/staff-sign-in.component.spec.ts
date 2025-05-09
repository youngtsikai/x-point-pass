import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffSignInComponent } from './staff-sign-in.component';

describe('StaffSignInComponent', () => {
  let component: StaffSignInComponent;
  let fixture: ComponentFixture<StaffSignInComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffSignInComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffSignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
