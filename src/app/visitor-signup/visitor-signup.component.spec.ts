import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorSignupComponent } from './visitor-signup.component';

describe('VisitorSignupComponent', () => {
  let component: VisitorSignupComponent;
  let fixture: ComponentFixture<VisitorSignupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorSignupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorSignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
