import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorSigninComponent } from './visitor-signin.component';

describe('VisitorSigninComponent', () => {
  let component: VisitorSigninComponent;
  let fixture: ComponentFixture<VisitorSigninComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorSigninComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorSigninComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
